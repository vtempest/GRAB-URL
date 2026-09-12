/**
 * @file aria2-transfer.ts
 * @description SFTP, BitTorrent (.torrent) and magnet-URI transfers delegated to
 * the external `aria2c` binary, wrapped in the same cli-progress UI the HTTP
 * downloader uses.
 *
 * `fetch()` cannot speak SFTP or BitTorrent, so those targets are handed to
 * aria2c, whose console readout is parsed line-by-line and mirrored into a
 * progress bar. Everything here is pure except `runAria2Transfer`, which spawns
 * the child process.
 */

import fs from 'fs';
import path from 'path';
import { spawn, spawnSync, type ChildProcess } from 'child_process';

import cliProgress from 'cli-progress';

import {
    COL_BAR, COL_FILENAME,
    colors,
    formatBytes, formatBytesCompact, formatETA, formatProgress,
    formatSpeed, formatSpeedDisplay, formatTotalDisplay, truncateFilename,
} from '../display/progress-format.js';

import {
    getSpinnerFrames, getRandomSpinner, getSpinnerWidth,
    calculateBarSize, getRandomBarColor, getRandomBarGlueColor,
} from '../display/spinner-config.js';

import { isCancelInProgress } from '../cancel-state.js';

// ─── Types ────────────────────────────────────────────────────────────────────

/** Transfer kinds that are delegated to aria2c rather than fetch(). */
export type Aria2Kind = 'sftp' | 'magnet' | 'torrent';

export interface Aria2Options {
    /** Destination directory (aria2 `--dir`). Defaults to cwd. */
    dir?: string;
    /** Explicit output filename — ignored for torrents/magnets (they carry names). */
    output?: string | null;
    /** Keep seeding after a torrent completes (default: stop immediately). */
    seed?: boolean;
    /** Connections per server / split count for sftp transfers. */
    connections?: number;
    /** Username for sftp (or use the URI's userinfo). */
    user?: string | null;
    /** Password for sftp. */
    password?: string | null;
    /** Expected sftp host key digest, e.g. `sha-1=b030503...`. */
    sshHostKey?: string | null;
    /** Raw extra flags appended verbatim to the aria2c invocation. */
    extraArgs?: string[];
}

export interface Aria2Context {
    /** Live pause state — polled so `p` suspends/resumes the child. */
    isPaused: () => boolean;
    /** Receives the spawned child so callers can cancel it. */
    onChild?: (child: ChildProcess | null) => void;
}

export interface Aria2Progress {
    gid: string;
    downloaded: number;
    total: number;
    percent: number;
    speedBps: number;
    uploadBps: number;
    connections: number;
    seeders: number | null;
    etaSeconds: number;
    /** True once a torrent finished downloading and is only seeding. */
    seeding: boolean;
}

// ─── Target detection ─────────────────────────────────────────────────────────

/**
 * Classify a target as an aria2-handled transfer, or null when the plain
 * fetch()-based downloader applies.
 *
 * @param target - URL, magnet URI, or path to a `.torrent` file
 */
export function classifyAria2Target(target: string): Aria2Kind | null {
    if (!target) return null;
    const value = target.trim();
    if (/^magnet:\?/i.test(value)) return 'magnet';
    if (/^sftp:\/\//i.test(value)) return 'sftp';
    if (/\.torrent$/i.test(value.split('?')[0].split('#')[0])) return 'torrent';
    return null;
}

/** True when a target must go through aria2c instead of fetch(). */
export function isAria2Target(target: string): boolean {
    return classifyAria2Target(target) !== null;
}

/** Human-readable label for a target, used for the progress bar and logs. */
export function describeAria2Target(target: string, kind: Aria2Kind): string {
    if (kind === 'magnet') {
        const dn = /[?&]dn=([^&]+)/i.exec(target);
        if (dn) {
            try { return decodeURIComponent(dn[1].replace(/\+/g, ' ')); } catch { return dn[1]; }
        }
        const xt = /xt=urn:btih:([a-z0-9]+)/i.exec(target);
        return xt ? `magnet ${xt[1].slice(0, 12)}` : 'magnet link';
    }
    if (kind === 'torrent') return path.basename(target.split('?')[0]);
    try { return path.basename(new URL(target).pathname) || target; } catch { return target; }
}

// ─── Binary discovery ─────────────────────────────────────────────────────────

/**
 * Locate a usable `aria2c` binary (honouring `GRAB_ARIA2_PATH`) and return its
 * path, reported version and compiled-in features, or null when it is not
 * installed.
 */
export function findAria2(): { path: string; version: string; features: string[] } | null {
    const candidate = process.env.GRAB_ARIA2_PATH || 'aria2c';
    try {
        const probe = spawnSync(candidate, ['--version'], { encoding: 'utf8' });
        if (probe.error || probe.status !== 0) return null;
        const stdout = probe.stdout || '';
        const version = /aria2 version ([\d.]+)/i.exec(stdout)?.[1] ?? 'unknown';
        return { path: candidate, version, features: parseAria2Features(stdout) };
    } catch {
        return null;
    }
}

/**
 * Read the "Enabled Features" line of `aria2c --version`. SFTP and BitTorrent
 * are compile-time options, so a working binary may still not speak them.
 */
export function parseAria2Features(versionOutput: string): string[] {
    const line = /Enabled Features:(.*)/i.exec(versionOutput || '')?.[1];
    if (!line) return [];
    return line.split(',').map((f) => f.trim()).filter(Boolean);
}

/** True when the binary was built with support for a given transfer kind. */
export function supportsKind(features: string[], kind: Aria2Kind): boolean {
    if (!features.length) return true; // unknown build — let aria2c decide
    const needed = kind === 'sftp' ? 'sftp' : 'bittorrent';
    return features.some((f) => f.toLowerCase() === needed);
}

/**
 * Hide the password in a `scheme://user:password@host` URI before it reaches a
 * console or a log file.
 */
export function redactCredentials(text: string): string {
    return text.replace(/(\w+:\/\/[^/\s:@]+):[^/\s@]*@/g, '$1:***@');
}

/** Platform-appropriate install hint shown when aria2c is missing. */
export function aria2InstallHint(): string {
    const hints: Record<string, string> = {
        darwin: 'brew install aria2',
        linux: 'sudo apt install aria2   (or dnf/pacman/apk install aria2)',
        win32: 'winget install aria2.aria2   (or choco install aria2)',
    };
    return hints[process.platform] ?? 'https://aria2.github.io/';
}

// ─── Argument building ────────────────────────────────────────────────────────

/**
 * Build the full aria2c argument list for a target. Pure — no side effects — so
 * the flag matrix stays unit-testable.
 *
 * @param target - URL, magnet URI or `.torrent` path
 * @param kind   - Result of {@link classifyAria2Target}
 * @param opts   - User-supplied transfer options
 */
export function buildAria2Args(target: string, kind: Aria2Kind, opts: Aria2Options = {}): string[] {
    const connections = Math.min(Math.max(opts.connections ?? 8, 1), 16);
    const args = [
        '--summary-interval=1',
        '--console-log-level=warn',
        '--human-readable=false',
        '--download-result=full',
        '--continue=true',
        '--auto-file-renaming=false',
        '--file-allocation=none',
        `--dir=${opts.dir || process.cwd()}`,
    ];

    if (kind === 'sftp') {
        args.push(
            `--max-connection-per-server=${connections}`,
            `--split=${connections}`,
        );
        if (opts.user) args.push(`--ftp-user=${opts.user}`);
        if (opts.password) args.push(`--ftp-passwd=${opts.password}`);
        if (opts.sshHostKey) args.push(`--ssh-host-key-md=${opts.sshHostKey}`);
        if (opts.output) args.push(`--out=${path.basename(opts.output)}`);
    } else {
        // Torrent + magnet: aria2 takes the file names from the metadata.
        args.push('--follow-torrent=true', '--bt-save-metadata=true');
        if (opts.seed) args.push('--seed-ratio=0.0');
        else args.push('--seed-time=0');
    }

    if (opts.extraArgs?.length) args.push(...opts.extraArgs);
    args.push(target);
    return args;
}

// ─── Console-readout parsing ──────────────────────────────────────────────────

const UNIT_FACTORS: Record<string, number> = {
    '': 1, B: 1,
    K: 1024, KI: 1024, KIB: 1024, KB: 1024,
    M: 1024 ** 2, MI: 1024 ** 2, MIB: 1024 ** 2, MB: 1024 ** 2,
    G: 1024 ** 3, GI: 1024 ** 3, GIB: 1024 ** 3, GB: 1024 ** 3,
    T: 1024 ** 4, TI: 1024 ** 4, TIB: 1024 ** 4, TB: 1024 ** 4,
};

/**
 * Convert an aria2 size token (`4096`, `400KiB`, `1.4GiB`) into bytes.
 */
export function parseAria2Size(token: string | undefined | null): number {
    if (!token) return 0;
    const match = /^([\d.]+)\s*([KMGT]i?B?|B)?$/i.exec(token.trim());
    if (!match) return 0;
    const factor = UNIT_FACTORS[(match[2] ?? '').toUpperCase()] ?? 1;
    return Math.round(parseFloat(match[1]) * factor);
}

/**
 * Convert an aria2 ETA token (`45s`, `4m51s`, `1h2m3s`, `2d3h`) into seconds.
 */
export function parseAria2Eta(token: string | undefined | null): number {
    if (!token) return 0;
    let seconds = 0;
    const re = /(\d+)([dhms])/gi;
    let match: RegExpExecArray | null;
    while ((match = re.exec(token))) {
        const n = parseInt(match[1], 10);
        const unit = match[2].toLowerCase();
        seconds += unit === 'd' ? n * 86400 : unit === 'h' ? n * 3600 : unit === 'm' ? n * 60 : n;
    }
    return seconds;
}

/**
 * Parse one aria2c console-readout line into structured progress.
 * Returns null for lines that carry no download stats (log messages, banners).
 *
 * Handles the human-readable readout (`400KiB/33MiB(1%)`), the raw-byte readout
 * produced by `--human-readable=false`, and the seeding form (`SEED(1.0) SD:2`).
 */
export function parseAria2Progress(line: string): Aria2Progress | null {
    const group = /\[#([0-9a-zA-Z]+)\s([^\]]*)\]/.exec(line);
    if (!group) return null;
    const [, gid, body] = group;

    const sizes = /([\d.]+(?:[KMGT]i?B?|B)?)\/([\d.]+(?:[KMGT]i?B?|B)?)\((\d+)%\)/.exec(body);
    const seed = /SEED\(([\d.]+)\)/.exec(body);
    if (!sizes && !seed) return null;

    const seeders = /SD:(\d+)/.exec(body);
    return {
        gid,
        downloaded: sizes ? parseAria2Size(sizes[1]) : 0,
        total: sizes ? parseAria2Size(sizes[2]) : 0,
        percent: sizes ? parseInt(sizes[3], 10) : 100,
        speedBps: parseAria2Size(/DL:([\d.]+(?:[KMGT]i?B?|B)?)/.exec(body)?.[1]),
        uploadBps: parseAria2Size(/UL:([\d.]+(?:[KMGT]i?B?|B)?)/.exec(body)?.[1]),
        connections: parseInt(/CN:(\d+)/.exec(body)?.[1] ?? '0', 10),
        seeders: seeders ? parseInt(seeders[1], 10) : null,
        etaSeconds: parseAria2Eta(/ETA:([\dhdms]+)/i.exec(body)?.[1]),
        seeding: !!seed,
    };
}

/**
 * True for aria2's banner, results header and legend lines — they carry no
 * information about why a transfer failed.
 */
export function isAria2Noise(line: string): boolean {
    return /^(gid\s|===|---|\*\*\*|FILE:|Download Results:|Status Legend:|\(OK\)|\(ERR\)|\(INPR\)|aria2 will resume|If there are any errors)/i
        .test(line.trim());
}

/** Map an aria2c exit code to a readable reason. */
export function describeAria2Exit(code: number | null): string {
    const reasons: Record<number, string> = {
        0: 'completed',
        1: 'unknown error',
        2: 'timed out',
        3: 'resource not found',
        4: 'resource not found too many times',
        5: 'download aborted because it was too slow',
        6: 'network problem',
        7: 'stopped with unfinished downloads',
        8: 'server does not support resume',
        9: 'not enough disk space',
        11: 'aria2 was already downloading the same file',
        12: 'aria2 was already downloading the same torrent',
        13: 'file already exists — remove it or pass --dir',
        16: 'could not open the destination file',
        22: 'bad HTTP response header',
        24: 'authorization failed',
        25: 'could not parse the torrent/metalink file',
        28: 'bad command-line option',
        29: 'server temporarily unavailable',
    };
    if (code === null) return 'terminated by signal';
    return reasons[code] ?? `exit code ${code}`;
}

// ─── Transfer ─────────────────────────────────────────────────────────────────

/**
 * Run one aria2c transfer with a live progress bar.
 *
 * Pause (`p`) suspends the child with SIGSTOP/SIGCONT on POSIX; cancellation is
 * delivered as SIGINT so aria2 flushes its `.aria2` control file and the next
 * run resumes where this one stopped.
 *
 * @param target - URL, magnet URI or `.torrent` path
 * @param opts   - Transfer options
 * @param ctx    - Pause state plus child-process handle callback
 */
export async function runAria2Transfer(
    target: string,
    opts: Aria2Options = {},
    ctx: Aria2Context = { isPaused: () => false },
): Promise<void> {
    const kind = classifyAria2Target(target);
    if (!kind) throw new Error(`Not an aria2 target: ${target}`);

    const aria2 = findAria2();
    if (!aria2) {
        throw new Error(
            `aria2c is required for ${kind} transfers but was not found. ` +
            `Install it with: ${aria2InstallHint()}`,
        );
    }

    if (!supportsKind(aria2.features, kind)) {
        throw new Error(
            `this aria2c build has no ${kind === 'sftp' ? 'SFTP' : 'BitTorrent'} support ` +
            `(features: ${aria2.features.join(', ') || 'unknown'}). Install a build with it, ` +
            `or point GRAB_ARIA2_PATH at one.`,
        );
    }

    const dir = opts.dir || process.cwd();
    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e: any) {
        throw new Error(`Could not create output directory ${dir}: ${e.message}`);
    }

    const label = describeAria2Target(target, kind);
    const icons: Record<Aria2Kind, string> = { sftp: '🔐', magnet: '🧲', torrent: '🌊' };
    console.log(colors.info(`${icons[kind]} ${kind} via aria2c ${aria2.version}: ${label}`));

    const args = buildAria2Args(target, kind, { ...opts, dir });
    const frames = getSpinnerFrames(getRandomSpinner());
    const barColor = getRandomBarColor();
    const barGlue = getRandomBarGlueColor();
    const spinnerWidth = getSpinnerWidth(frames[0]);
    const RESET = '\u001b[0m';

    const bar = new cliProgress.SingleBar({
        format:
            colors.success('{percentage}%') + ' ' +
            colors.yellow('{filename}') + ' ' +
            colors.cyan('{spinner}') + ' ' +
            barColor + '{bar}' + RESET + ' ' +
            colors.info('{downloadedDisplay}') + ' ' + colors.info('{totalDisplay}') + ' ' +
            colors.purple('{speed}') + ' ' + colors.pink('{etaFormatted}') + ' ' +
            colors.primary('{peers}'),
        barCompleteChar: '█',
        barIncompleteChar: '░',
        barGlue,
        hideCursor: true,
        barsize: calculateBarSize(frames[0], COL_BAR),
        clearOnComplete: false,
        stopOnComplete: false,
    });

    bar.start(100, 0, {
        filename: truncateFilename(label, COL_FILENAME - spinnerWidth),
        spinner: frames[0],
        speed: formatSpeed('0B'),
        etaFormatted: formatETA(0),
        progress: formatProgress(0, 0),
        downloadedDisplay: formatBytesCompact(0),
        totalDisplay: formatTotalDisplay(0),
        peers: '',
    });

    const child = spawn(aria2.path, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    ctx.onChild?.(child);

    let frameIndex = 0;
    let lastFrame = Date.now();
    let knownTotal = 0;
    let lastDownloaded = 0;
    let suspended = false;
    const messages: string[] = [];
    const resultLines: string[] = [];

    const pausePoll = setInterval(() => {
        if (process.platform === 'win32' || child.killed) return;
        const wantPaused = ctx.isPaused();
        if (wantPaused && !suspended) {
            try { child.kill('SIGSTOP'); suspended = true; } catch { /* already gone */ }
        } else if (!wantPaused && suspended) {
            try { child.kill('SIGCONT'); suspended = false; } catch { /* already gone */ }
        }
    }, 200);

    const handleLine = (line: string) => {
        const text = line.trim();
        if (!text) return;

        const progress = parseAria2Progress(text);
        if (progress) {
            if (progress.total > 0 && progress.total !== knownTotal) {
                knownTotal = progress.total;
                bar.setTotal(knownTotal);
            }
            const now = Date.now();
            if (now - lastFrame >= 120) {
                frameIndex = (frameIndex + 1) % frames.length;
                lastFrame = now;
                bar.options.barsize = calculateBarSize(frames[frameIndex], COL_BAR);
            }
            lastDownloaded = progress.downloaded || lastDownloaded;

            bar.update(knownTotal > 0 ? progress.downloaded : progress.percent, {
                spinner: progress.seeding ? '🌱' : frames[frameIndex],
                speed: formatSpeed(formatSpeedDisplay(progress.speedBps)),
                etaFormatted: formatETA(progress.etaSeconds),
                progress: formatProgress(progress.downloaded, knownTotal),
                downloadedDisplay: formatBytesCompact(progress.downloaded),
                totalDisplay: formatTotalDisplay(knownTotal),
                peers: progress.seeders !== null
                    ? `CN:${progress.connections} SD:${progress.seeders}`
                    : `CN:${progress.connections}`,
            });
            return;
        }

        // Non-progress output: keep the download results and a tail of messages.
        if (/^[0-9a-f]{6}\|/i.test(text)) { resultLines.push(text); return; }
        if (isAria2Noise(text)) return;
        messages.push(redactCredentials(text));
        if (messages.length > 10) messages.shift();
    };

    const attach = (stream: NodeJS.ReadableStream | null) => {
        if (!stream) return;
        let buffer = '';
        stream.setEncoding('utf8');
        stream.on('data', (chunk: string) => {
            buffer += chunk;
            // aria2 redraws its readout with \r, so split on both terminators.
            const parts = buffer.split(/\r|\n/);
            buffer = parts.pop() ?? '';
            parts.forEach(handleLine);
        });
        stream.on('end', () => { if (buffer) handleLine(buffer); });
    };
    attach(child.stdout);
    attach(child.stderr);

    const exitCode: number | null = await new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', (code) => resolve(code));
    });

    clearInterval(pausePoll);
    bar.stop();
    ctx.onChild?.(null);

    if (exitCode === 0) {
        const saved = resultLines
            .map((line) => line.split('|').pop()?.trim())
            .filter((p): p is string => !!p && p !== 'path/URI');
        console.log(colors.success('✅ Transfer completed!'));
        if (saved.length)
            console.log(colors.primary('📁 Saved to: ') + redactCredentials(saved.join(', ')));
        if (lastDownloaded > 0) console.log(colors.purple('📊 Total: ') + formatBytes(lastDownloaded));
        return;
    }

    // The user asked to stop — the CLI reports the outcome, not aria2's teardown.
    if (isCancelInProgress()) throw new Error(`aria2c ${describeAria2Exit(exitCode)}`);

    // Prefer the lines that name the cause over aria2's generic footer.
    const causes = messages.filter((m) => /error|exception|->|denied|refused/i.test(m));
    (causes.length ? causes : messages).slice(-5)
        .forEach((m) => console.log(colors.warning(`   ${m}`)));
    if (exitCode === 7 || exitCode === null) {
        console.log(colors.info('💾 Progress saved by aria2c. Run the same command to resume.'));
    }
    throw new Error(`aria2c ${describeAria2Exit(exitCode)}`);
}

/**
 * @file ytdlp-transfer.ts
 * @description Media-site downloads delegated to the external `yt-dlp` binary,
 * wrapped in the same cli-progress UI the HTTP downloader uses.
 *
 * A URL on a site in `MEDIA_DOMAINS` points at a player page, not at the media,
 * so fetching it directly saves a page of HTML. Those targets are handed to
 * yt-dlp, which resolves the real stream, and its machine-readable progress
 * readout is mirrored into a progress bar. Everything here is pure except
 * {@link runYtDlpTransfer}, which spawns the child process.
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
import { findYtDlp, ytDlpInstallHint } from './ytdlp-binary.js';
// Re-exported so a caller that only speaks in transfers — archive-page, say —
// does not need to know which of the two yt-dlp modules owns each helper.
export { findYtDlp, ytDlpInstallHint } from './ytdlp-binary.js';
import { hostnameOf, matchMediaDomain } from './media-domains.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface YtDlpOptions {
    /** Destination directory (yt-dlp `--paths`). Defaults to cwd. */
    dir?: string;
    /** Explicit output name — used verbatim as yt-dlp's output template. */
    output?: string | null;
    /** Format selector passed to `-f`, e.g. `bestvideo+bestaudio`. */
    format?: string | null;
    /** Extract audio only; the value is the target container (`best` by default). */
    audioFormat?: string | null;
    /** Download every entry of a playlist instead of only the linked item. */
    playlist?: boolean;
    /** Browser to read cookies from, for members-only or age-gated media. */
    cookiesFromBrowser?: string | null;
    /** Raw extra flags appended verbatim to the yt-dlp invocation. */
    extraArgs?: string[];
}

export interface YtDlpContext {
    /** Live pause state — polled so `p` suspends/resumes the child. */
    isPaused: () => boolean;
    /** Receives the spawned child so callers can cancel it. */
    onChild?: (child: ChildProcess | null) => void;
}

export interface YtDlpProgress {
    /** yt-dlp's own status word: `downloading`, `finished`, `error`. */
    status: string;
    downloaded: number;
    /** Exact size when known, otherwise yt-dlp's estimate, otherwise 0. */
    total: number;
    /** True when {@link YtDlpProgress.total} came from `total_bytes_estimate`. */
    estimated: boolean;
    speedBps: number;
    etaSeconds: number;
    /** Fragment counters for HLS/DASH streams, null for plain files. */
    fragmentIndex: number | null;
    fragmentCount: number | null;
}

// ─── Target detection ─────────────────────────────────────────────────────────

/**
 * True when a target should go through yt-dlp instead of fetch().
 *
 * @param target - URL to classify
 */
export function isYtDlpTarget(target: string): boolean {
    return matchMediaDomain(target) !== null;
}

/**
 * Short label for the progress bar before yt-dlp reports a real filename —
 * the matched site plus the video id or last meaningful path segment.
 *
 * @param target - URL being downloaded
 */
export function describeYtDlpTarget(target: string): string {
    const site = matchMediaDomain(target);
    try {
        const url = new URL(target);
        const id = url.searchParams.get('v')
            || url.pathname.split('/').filter(Boolean).pop()
            || url.hostname;
        return site ? `${site}/${id}` : id;
    } catch {
        return site ?? target;
    }
}

/**
 * Resolve the site label a transfer reports under, or throw when yt-dlp cannot
 * speak the target's scheme at all.
 *
 * The domain list decides what gets *routed* here by default; it does not gate
 * what runs. `--ytdlp` deliberately sends off-list URLs, so an unlisted host is
 * labelled by hostname rather than refused — only magnet URIs, sftp:// and
 * local paths, which belong to aria2c, are rejected.
 *
 * @param target - URL to run through yt-dlp
 */
export function resolveYtDlpSite(target: string): string {
    const host = hostnameOf(target);
    if (!host) throw new Error(`yt-dlp needs an http(s) URL, got: ${target}`);
    return matchMediaDomain(target) ?? host;
}

// ─── Argument building ────────────────────────────────────────────────────────

/**
 * Sentinel-prefixed progress line yt-dlp is asked to emit. Its own readout is a
 * redrawn, human-formatted bar; this template is stable enough to parse.
 */
export const YTDLP_PROGRESS_TEMPLATE =
    'download:@GRAB@%(progress.status)s|%(progress.downloaded_bytes)s'
    + '|%(progress.total_bytes)s|%(progress.total_bytes_estimate)s'
    + '|%(progress.speed)s|%(progress.eta)s'
    + '|%(progress.fragment_index)s|%(progress.fragment_count)s';

/**
 * Build the full yt-dlp argument list for a target. Pure — no side effects — so
 * the flag matrix stays unit-testable.
 *
 * @param target - Media page URL
 * @param opts   - User-supplied transfer options
 */
export function buildYtDlpArgs(target: string, opts: YtDlpOptions = {}): string[] {
    const args = [
        '--newline',
        '--color', 'never',
        '--progress',
        '--progress-template', YTDLP_PROGRESS_TEMPLATE,
        '--continue',
        '--no-warnings',
        '--paths', opts.dir || process.cwd(),
    ];

    // A media URL often carries a playlist id as well; without this, opening one
    // track from an album would pull the whole album.
    args.push(opts.playlist ? '--yes-playlist' : '--no-playlist');

    args.push('--output', opts.output || '%(title)s [%(id)s].%(ext)s');

    if (opts.format) args.push('--format', opts.format);
    if (opts.audioFormat) args.push('--extract-audio', '--audio-format', opts.audioFormat);
    if (opts.cookiesFromBrowser) args.push('--cookies-from-browser', opts.cookiesFromBrowser);

    if (opts.extraArgs?.length) args.push(...opts.extraArgs);
    args.push(target);
    return args;
}

// ─── Console-readout parsing ──────────────────────────────────────────────────

/** Convert a progress-template field into a number, treating `NA` as unknown. */
function parseField(token: string | undefined): number {
    if (!token || token === 'NA' || token === 'None') return 0;
    const value = parseFloat(token);
    return Number.isFinite(value) ? value : 0;
}

/**
 * Parse one sentinel-prefixed progress line into structured progress.
 * Returns null for every other line yt-dlp writes.
 *
 * @param line - A single line of yt-dlp output
 */
export function parseYtDlpProgress(line: string): YtDlpProgress | null {
    const index = line.indexOf('@GRAB@');
    if (index === -1) return null;
    const fields = line.slice(index + '@GRAB@'.length).trim().split('|');
    if (fields.length < 6) return null;

    const [status, downloaded, total, estimate, speed, eta, fragIndex, fragCount] = fields;
    const exact = parseField(total);
    const guess = parseField(estimate);
    const fragmentIndex = parseField(fragIndex);
    const fragmentCount = parseField(fragCount);

    return {
        status: status || 'downloading',
        downloaded: parseField(downloaded),
        total: exact || guess,
        estimated: !exact && guess > 0,
        speedBps: parseField(speed),
        etaSeconds: Math.round(parseField(eta)),
        fragmentIndex: fragmentIndex || null,
        fragmentCount: fragmentCount || null,
    };
}

/**
 * Pull the output path out of the lines yt-dlp prints when it opens, merges or
 * skips a file. Returns null for lines that name no destination.
 *
 * @param line - A single line of yt-dlp output
 */
export function parseYtDlpDestination(line: string): string | null {
    const text = line.trim();
    const destination = /^\[(?:download|ExtractAudio|VideoConvertor|FixupM3u8)\]\s+Destination:\s+(.+)$/.exec(text);
    if (destination) return destination[1].trim();

    const merged = /^\[Merger\]\s+Merging formats into\s+"(.+)"$/.exec(text);
    if (merged) return merged[1];

    const already = /^\[download\]\s+(.+?)\s+has already been downloaded$/.exec(text);
    if (already) return already[1];

    return null;
}

/**
 * True for yt-dlp's routine chatter (extractor banners, format selection).
 * Everything else is kept as a candidate explanation for a failure.
 */
export function isYtDlpNoise(line: string): boolean {
    const text = line.trim();
    if (!text) return true;
    if (text.startsWith('@GRAB@')) return true;
    return /^\[(?:youtube|info|download|debug|generic|hlsnative|Merger|ExtractAudio|VideoConvertor|Metadata|dashsegments|MoveFiles|FixupM3u8)[^\]]*\]/i
        .test(text);
}

/** Map a yt-dlp exit code to a readable reason. */
export function describeYtDlpExit(code: number | null): string {
    if (code === null) return 'terminated by signal';
    const reasons: Record<number, string> = {
        0: 'completed',
        1: 'download failed — the media may be private, region-locked or removed',
        2: 'bad command-line option',
        100: 'yt-dlp needs a newer Python than this system has',
        101: 'stopped early by a --max-downloads or --break-on filter',
    };
    return reasons[code] ?? `exit code ${code}`;
}

// ─── Transfer ─────────────────────────────────────────────────────────────────

/**
 * Run one yt-dlp download with a live progress bar.
 *
 * Pause (`p`) suspends the child with SIGSTOP/SIGCONT on POSIX; cancellation is
 * delivered as SIGINT so yt-dlp leaves its `.part` file in place and the next
 * run resumes where this one stopped.
 *
 * @param target - Media page URL
 * @param opts   - Transfer options
 * @param ctx    - Pause state plus child-process handle callback
 */
export async function runYtDlpTransfer(
    target: string,
    opts: YtDlpOptions = {},
    ctx: YtDlpContext = { isPaused: () => false },
): Promise<void> {
    const site = resolveYtDlpSite(target);

    const ytdlp = findYtDlp();
    if (!ytdlp) {
        throw new Error(
            `yt-dlp is required for ${site} links but was not found. Install it with:\n${ytDlpInstallHint()}`,
        );
    }

    const dir = opts.dir || process.cwd();
    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e: any) {
        throw new Error(`Could not create output directory ${dir}: ${e.message}`);
    }

    const label = describeYtDlpTarget(target);
    console.log(colors.info(`🎬 ${site} via yt-dlp ${ytdlp.version}: ${label}`));

    const args = buildYtDlpArgs(target, { ...opts, dir });
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
            colors.primary('{stage}'),
        barCompleteChar: '█',
        barIncompleteChar: '░',
        barGlue,
        hideCursor: true,
        barsize: calculateBarSize(frames[0], COL_BAR),
        clearOnComplete: false,
        stopOnComplete: false,
    });

    let barLabel = label;
    bar.start(100, 0, {
        filename: truncateFilename(barLabel, COL_FILENAME - spinnerWidth),
        spinner: frames[0],
        speed: formatSpeed('0B'),
        etaFormatted: formatETA(0),
        progress: formatProgress(0, 0),
        downloadedDisplay: formatBytesCompact(0),
        totalDisplay: formatTotalDisplay(0),
        stage: '',
    });

    const child = spawn(ytdlp.path, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    ctx.onChild?.(child);

    let frameIndex = 0;
    let lastFrame = Date.now();
    let knownTotal = 0;
    let lastDownloaded = 0;
    let grandTotal = 0;
    let part = 0;
    let merging = false;
    let suspended = false;
    const messages: string[] = [];
    const destinations: string[] = [];

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

        const progress = parseYtDlpProgress(text);
        if (progress) {
            // A video+audio download runs as two sequential streams, each
            // restarting at zero — count them so the readout says which is live.
            if (progress.downloaded < lastDownloaded) {
                grandTotal += lastDownloaded;
                part++;
            }
            lastDownloaded = progress.downloaded;

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

            const fragments = progress.fragmentCount
                ? `frag ${progress.fragmentIndex ?? 0}/${progress.fragmentCount}`
                : '';
            bar.update(knownTotal > 0 ? progress.downloaded : 0, {
                filename: truncateFilename(barLabel, COL_FILENAME - spinnerWidth),
                spinner: frames[frameIndex],
                speed: formatSpeed(formatSpeedDisplay(progress.speedBps)),
                etaFormatted: formatETA(progress.etaSeconds),
                progress: formatProgress(progress.downloaded, knownTotal),
                downloadedDisplay: formatBytesCompact(progress.downloaded),
                totalDisplay: formatTotalDisplay(knownTotal) + (progress.estimated ? '~' : ''),
                stage: part > 0 ? `part ${part + 1} ${fragments}`.trim() : fragments,
            });
            return;
        }

        const destination = parseYtDlpDestination(text);
        if (destination) {
            if (!destinations.includes(destination)) destinations.push(destination);
            barLabel = path.basename(destination);
            if (/Merging formats/.test(text)) {
                merging = true;
                bar.update({ spinner: '🧩', stage: 'merging' });
            }
            return;
        }

        if (isYtDlpNoise(text)) return;
        messages.push(text);
        if (messages.length > 10) messages.shift();
    };

    const attach = (stream: NodeJS.ReadableStream | null) => {
        if (!stream) return;
        let buffer = '';
        stream.setEncoding('utf8');
        stream.on('data', (chunk: string) => {
            buffer += chunk;
            // --newline keeps progress on its own line, but yt-dlp's
            // postprocessors still redraw with a carriage return.
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
        const transferred = grandTotal + lastDownloaded;
        console.log(colors.success(merging ? '✅ Download merged and completed!' : '✅ Download completed!'));
        // The merged file is the last destination announced; the raw streams
        // that fed it are deleted by yt-dlp.
        const saved = merging ? destinations.slice(-1) : destinations;
        if (saved.length) console.log(colors.primary('📁 Saved to: ') + saved.join(', '));
        if (transferred > 0) console.log(colors.purple('📊 Total: ') + formatBytes(transferred));
        return;
    }

    // The user asked to stop — the CLI reports the outcome, not yt-dlp's teardown.
    if (isCancelInProgress()) throw new Error(`yt-dlp ${describeYtDlpExit(exitCode)}`);

    const causes = messages.filter(
        (m) => /^(ERROR|WARNING)/i.test(m) || /unable|unavailable|forbidden|sign in/i.test(m),
    );
    (causes.length ? causes : messages).slice(-5)
        .forEach((m) => console.log(colors.warning(`   ${m}`)));
    if (exitCode === 1) {
        console.log(colors.info('💾 Partial data kept in .part files. Run the same command to resume.'));
    }
    throw new Error(`yt-dlp ${describeYtDlpExit(exitCode)}`);
}

// ─── Metadata probe and quiet download ────────────────────────────────────────

/**
 * The handful of `yt-dlp -J` fields the archiver actually reads.
 *
 * yt-dlp's JSON dump carries a few hundred keys; naming only these keeps the
 * shape stable when yt-dlp renames something deeper in the payload.
 */
export interface YtDlpMetadata {
    /** Extractor id for the media, e.g. a YouTube video id. */
    id: string;
    /** Human title, empty when the extractor does not supply one. */
    title: string;
    /** Container yt-dlp would write, e.g. `mp4`. */
    ext: string;
    /** Length in seconds, 0 when unknown (a live stream, say). */
    duration: number;
    /** Channel or account the media belongs to, empty when unknown. */
    uploader: string;
}

/**
 * Ask yt-dlp whether a URL holds media, without downloading anything.
 *
 * Returns null for an ordinary page — the common case when archiving an
 * article — so the caller can skip the video step silently rather than treat a
 * non-video URL as an error. Synchronous: archiving is a linear script, and the
 * probe is a sub-second `--skip-download` call.
 *
 * @param target - URL to inspect
 */
export function probeYtDlp(target: string): YtDlpMetadata | null {
    const ytdlp = findYtDlp();
    if (!ytdlp) return null;

    const result = spawnSync(
        ytdlp.path,
        [
            '--dump-single-json',
            '--skip-download',
            '--no-warnings',
            '--no-playlist',
            '--quiet',
            target,
        ],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
    );

    if (result.status !== 0 || !result.stdout?.trim()) return null;

    try {
        const meta = JSON.parse(result.stdout);
        // A playlist page dumps entries instead of a single medium; the archiver
        // saves one video per page, so treat that as "no video here".
        if (!meta || meta._type === 'playlist') return null;
        return {
            id: String(meta.id ?? ''),
            title: String(meta.title ?? ''),
            ext: String(meta.ext ?? ''),
            duration: Number(meta.duration) || 0,
            uploader: String(meta.uploader ?? meta.channel ?? ''),
        };
    } catch {
        return null;
    }
}

/**
 * Download media into a directory and return the files yt-dlp actually wrote.
 *
 * The quiet counterpart to {@link runYtDlpTransfer}: no progress bar and no
 * console output, because it runs inside a larger archive run that prints its
 * own report. Paths come from yt-dlp's own `after_move:filepath` print, so a
 * title sanitised or de-duplicated by yt-dlp is still reported correctly.
 *
 * @param target - Media page URL
 * @param opts   - Transfer options; `dir` defaults to cwd
 * @returns Absolute paths of the saved files, in the order yt-dlp wrote them
 */
export async function runYtDlpDownload(
    target: string,
    opts: YtDlpOptions = {},
): Promise<string[]> {
    const ytdlp = findYtDlp();
    if (!ytdlp) {
        throw new Error(`yt-dlp not found. Install it with:\n${ytDlpInstallHint()}`);
    }

    const dir = opts.dir || process.cwd();
    try {
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    } catch (e: any) {
        throw new Error(`Could not create output directory ${dir}: ${e.message}`);
    }

    // The progress template and `--progress` only feed the bar this caller does
    // not draw, so build the args without them and add the filepath print.
    const args = buildYtDlpArgs(target, { ...opts, dir })
        .filter((arg, i, all) =>
            arg !== '--progress'
            && arg !== '--progress-template'
            && arg !== YTDLP_PROGRESS_TEMPLATE
            && all[i - 1] !== '--progress-template');
    args.unshift('--no-simulate', '--print', 'after_move:filepath', '--quiet');

    const child = spawn(ytdlp.path, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    const saved: string[] = [];
    const messages: string[] = [];
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (chunk) => {
        stdout += chunk.toString();
        const lines = stdout.split('\n');
        stdout = lines.pop() ?? '';
        lines.map((l) => l.trim()).filter(Boolean).forEach((l) => saved.push(l));
    });
    child.stderr?.on('data', (chunk) => {
        stderr += chunk.toString();
        const lines = stderr.split('\n');
        stderr = lines.pop() ?? '';
        lines.map((l) => l.trim()).filter(Boolean).forEach((l) => messages.push(l));
    });

    const exitCode: number | null = await new Promise((resolve, reject) => {
        child.on('error', reject);
        child.on('close', resolve);
    });

    if (stdout.trim()) saved.push(stdout.trim());
    if (stderr.trim()) messages.push(stderr.trim());

    if (exitCode !== 0) {
        const cause = messages.filter((m) => /^ERROR/i.test(m)).slice(-1)[0];
        throw new Error(cause || `yt-dlp ${describeYtDlpExit(exitCode)}`);
    }

    return saved.filter((file) => fs.existsSync(file));
}

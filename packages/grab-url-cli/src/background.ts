/**
 * @file background.ts
 * @description Detached background transfers plus the job registry behind
 * `--background`, the Ctrl+C "keep running in background?" prompt, and `--jobs`.
 *
 * A running transfer cannot hand its sockets to another process, so
 * "backgrounding" re-launches the same command as a detached child. Both the
 * HTTP downloader (`.tmp` + `.download-state` sidecar) and aria2c (`.aria2`
 * control file) resume from disk, so the child picks up where the foreground
 * run stopped.
 */

import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

import { colors, formatBytesPlain } from './display/progress-format.js';
import { redactCredentials } from './transfer/aria2-transfer.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface JobRecord {
    pid: number;
    /** Targets being transferred. */
    urls: string[];
    /** Absolute path of the log file the detached process writes to. */
    log: string;
    /** Working directory the job was started from. */
    cwd: string;
    /** ISO timestamp of when the job was detached. */
    started: string;
    /** "flag" when started with --background, "cancel" when handed off by Ctrl+C. */
    reason: 'flag' | 'cancel';
}

export interface DetachOptions {
    /** Directory holding logs + job records (defaults to the download state dir). */
    stateDir: string;
    /** Targets, used for the job record and re-invocation. */
    urls: string[];
    /** Explicit log path; one is generated under `<stateDir>/logs` when omitted. */
    logFile?: string | null;
    /** Why the job is being detached. */
    reason?: 'flag' | 'cancel';
    /** argv to re-run with (defaults to the current process argv). */
    argv?: string[];
}

/** Internal flag added to the re-invoked argv so the child never re-detaches. */
export const BACKGROUND_CHILD_FLAG = '--grab-background-child';

// ─── Argv helpers ─────────────────────────────────────────────────────────────

/**
 * Strip foreground-only flags from an argv list and append the child marker, so
 * the detached process runs the same transfer without detaching again.
 *
 * @param argv - User arguments (i.e. `process.argv.slice(2)`)
 */
export function buildChildArgv(argv: string[]): string[] {
    const dropped = new Set(['--background', '-b', BACKGROUND_CHILD_FLAG]);
    const cleaned = argv.filter((arg) => !dropped.has(arg) && !/^--background=/.test(arg));
    return [...cleaned, BACKGROUND_CHILD_FLAG];
}

/** True when this process is itself a detached background child. */
export function isBackgroundChild(argv: string[] = process.argv): boolean {
    return argv.includes(BACKGROUND_CHILD_FLAG);
}

// ─── Job registry ─────────────────────────────────────────────────────────────

/** Directory holding one JSON record per detached job. */
export function getJobsDirectory(stateDir: string): string {
    return path.join(stateDir, 'jobs');
}

/** Directory holding background job logs. */
export function getLogsDirectory(stateDir: string): string {
    return path.join(stateDir, 'logs');
}

/**
 * Build the default log path for a background job.
 */
export function buildLogPath(stateDir: string, urls: string[]): string {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const slug = (path.basename((urls[0] ?? 'grab').split('?')[0]) || 'grab')
        .replace(/[^\w.-]/g, '_')
        .slice(0, 40);
    return path.join(getLogsDirectory(stateDir), `${slug}-${stamp}.log`);
}

/** Persist a job record so `--jobs` can list it later. */
export function writeJobRecord(stateDir: string, job: JobRecord): void {
    try {
        const dir = getJobsDirectory(stateDir);
        fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(path.join(dir, `${job.pid}.json`), JSON.stringify(job, null, 2));
    } catch { /* the registry is best-effort */ }
}

/** True when a pid belongs to a process that is still alive. */
export function isProcessAlive(pid: number): boolean {
    try { process.kill(pid, 0); return true; } catch (e: any) { return e?.code === 'EPERM'; }
}

/**
 * Read all job records, dropping the ones whose process has exited.
 *
 * @param stateDir - Download state directory
 * @param prune    - Delete records for finished jobs (default true)
 */
export function listJobs(stateDir: string, prune = true): JobRecord[] {
    const dir = getJobsDirectory(stateDir);
    let files: string[] = [];
    try { files = fs.readdirSync(dir).filter((f) => f.endsWith('.json')); } catch { return []; }

    const running: JobRecord[] = [];
    for (const file of files) {
        const full = path.join(dir, file);
        try {
            const job = JSON.parse(fs.readFileSync(full, 'utf8')) as JobRecord;
            if (isProcessAlive(job.pid)) running.push(job);
            else if (prune) fs.unlinkSync(full);
        } catch {
            if (prune) { try { fs.unlinkSync(full); } catch { /* ignore */ } }
        }
    }
    return running.sort((a, b) => a.started.localeCompare(b.started));
}

/**
 * Print the running background jobs, or a hint when there are none.
 */
export function printJobs(stateDir: string): void {
    const jobs = listJobs(stateDir);
    if (!jobs.length) {
        console.log(colors.info('No background transfers running.'));
        console.log(colors.info('Start one with: ') + 'grab <url> --background');
        return;
    }
    console.log(colors.cyan.bold(`\n${jobs.length} background transfer${jobs.length > 1 ? 's' : ''}:`));
    for (const job of jobs) {
        let size = '';
        try { size = ` (log ${formatBytesPlain(fs.statSync(job.log).size)})`; } catch { /* no log yet */ }
        console.log(
            colors.success(`  PID ${job.pid}`) + ' ' +
            colors.yellow(job.urls.join(' ')) + '\n' +
            colors.info(`    started ${new Date(job.started).toLocaleString()}  •  log: ${job.log}${size}`),
        );
    }
    console.log(colors.info('\nFollow a log: ') + `tail -f <log>` + colors.info('   Stop a job: ') + 'kill <pid>\n');
}

// ─── Detaching ────────────────────────────────────────────────────────────────

/**
 * Re-launch the current command as a detached background process and register
 * it as a job. The parent is expected to exit right after.
 *
 * @returns The child pid plus its log path, or null when spawning failed
 */
export function detachToBackground(opts: DetachOptions): { pid: number; log: string } | null {
    const argv = buildChildArgv(opts.argv ?? process.argv.slice(2));
    const logPath = opts.logFile
        ? path.resolve(opts.logFile)
        : buildLogPath(opts.stateDir, opts.urls);

    try {
        fs.mkdirSync(path.dirname(logPath), { recursive: true });
        const logFd = fs.openSync(logPath, 'a');
        const entry = process.argv[1];
        const child = spawn(process.execPath, [entry, ...argv], {
            cwd: process.cwd(),
            detached: true,
            stdio: ['ignore', logFd, logFd],
            env: { ...process.env, FORCE_COLOR: '0', GRAB_BACKGROUND: '1' },
        });
        child.unref();
        fs.closeSync(logFd);

        const pid = child.pid ?? -1;
        if (pid > 0) {
            writeJobRecord(opts.stateDir, {
                pid,
                // The child gets the real argv; the record is only for display.
                urls: opts.urls.map(redactCredentials),
                log: logPath,
                cwd: process.cwd(),
                started: new Date().toISOString(),
                reason: opts.reason ?? 'flag',
            });
        }
        return { pid, log: logPath };
    } catch (e: any) {
        console.error(colors.error.bold('❌ Could not start background transfer: ') + e.message);
        return null;
    }
}

/**
 * Print the standard "now running in the background" summary.
 */
export function reportDetached(handoff: { pid: number; log: string }): void {
    console.log(colors.success(`\n🌙 Continuing in the background — PID ${handoff.pid}`));
    console.log(colors.info('   Log:    ') + handoff.log);
    console.log(colors.info('   Follow: ') + `tail -f ${handoff.log}`);
    console.log(colors.info('   List:   ') + 'grab --jobs' + colors.info('    Stop: ') + `kill ${handoff.pid}`);
}

// ─── Cancel prompt ────────────────────────────────────────────────────────────

/**
 * Ask a yes/no question on a raw-mode TTY, resolving on a single keypress.
 * Resolves to `defaultYes` on Enter, and false on Ctrl+C / Esc.
 *
 * @param question   - Text shown to the user
 * @param defaultYes - Answer used when Enter is pressed (default true)
 * @param timeoutMs  - Auto-answer with the default after this long (0 = never)
 */
export function promptYesNo(question: string, defaultYes = true, timeoutMs = 15000): Promise<boolean> {
    const stdin = process.stdin as NodeJS.ReadStream;
    if (!stdin.isTTY) return Promise.resolve(false);

    const hint = defaultYes ? '[Y/n]' : '[y/N]';
    process.stdout.write(colors.warning(`\n${question} ${hint} `));

    const wasRaw = stdin.isRaw;
    if (!wasRaw) stdin.setRawMode(true);
    stdin.resume();

    return new Promise<boolean>((resolve) => {
        let settled = false;
        const finish = (answer: boolean) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            stdin.removeListener('data', onData);
            if (!wasRaw) stdin.setRawMode(false);
            process.stdout.write(`${answer ? 'y' : 'n'}\n`);
            resolve(answer);
        };
        const onData = (chunk: Buffer | string) => {
            const key = chunk.toString();
            if (key === '\r' || key === '\n') return finish(defaultYes);
            if (key === '\u0003' || key === '\u001b') return finish(false);
            if (/^[yY]/.test(key)) return finish(true);
            if (/^[nN]/.test(key)) return finish(false);
        };
        const timer = timeoutMs > 0 ? setTimeout(() => finish(defaultYes), timeoutMs) : (null as any);
        stdin.on('data', onData);
    });
}

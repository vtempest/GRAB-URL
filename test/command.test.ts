/**
 * @file command.test.ts
 * @description Integration tests for the CLI downloader.
 * These tests use a small, real HTTP server (via Vitest) to verify the
 * full download pipeline without hitting external servers.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';
import http from 'http';

import { ColorFileDownloader } from '../src/grab-url-cli/downloader.js';

// ─── Tiny local HTTP server ───────────────────────────────────────────────────

const FILE_CONTENT = 'A'.repeat(64 * 1024); // 64 KB of 'A'

let server: http.Server;
let baseUrl: string;

beforeAll(async () => {
    server = http.createServer((req, res) => {
        const url = req.url;

        // ── /file — standard download ──────────────────────────────────────────
        if (url === '/file') {
            const data = Buffer.from(FILE_CONTENT);
            const rangeHeader = req.headers['range'];
            if (rangeHeader) {
                const [, rangeStr] = rangeHeader.split('=');
                const [startStr] = rangeStr.split('-');
                const start = parseInt(startStr, 10);
                const chunk = data.subarray(start);
                res.writeHead(206, {
                    'Content-Range': `bytes ${start}-${data.length - 1}/${data.length}`,
                    'Content-Length': String(chunk.length),
                    'Accept-Ranges': 'bytes',
                });
                res.end(chunk);
            } else {
                res.writeHead(200, {
                    'Content-Length': String(data.length),
                    'Accept-Ranges': 'bytes',
                    'ETag': '"test-etag"',
                });
                res.end(data);
            }
        }

        // ── /file-head — HEAD request ──────────────────────────────────────────
        else if (url === '/file' && req.method === 'HEAD') {
            res.writeHead(200, {
                'Content-Length': String(FILE_CONTENT.length),
                'Accept-Ranges': 'bytes',
                'ETag': '"test-etag"',
            });
            res.end();
        }

        // ── /api-json — API mode (JSON) ────────────────────────────────────────
        else if (url === '/api-json') {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ status: 'ok', items: [1, 2, 3] }));
        }

        // ── /slow — returns first 1 KB then pauses instantly (for cancel test) ─
        else if (url === '/slow') {
            const data = Buffer.from('B'.repeat(4 * 1024));
            res.writeHead(200, { 'Content-Length': String(data.length), 'Accept-Ranges': 'bytes' });
            res.write(data.subarray(0, 1024));
            // never finish — will be aborted by the test
        }

        else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });

    await new Promise<void>(resolve => server.listen(0, '127.0.0.1', resolve));
    const addr = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${addr.port}`;
});

afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
        server.close(err => (err ? reject(err) : resolve()))
    );
});

// ─── Per-test setup ───────────────────────────────────────────────────────────

let testDir: string;
let downloader: ColorFileDownloader;

beforeEach(() => {
    testDir = fs.mkdtempSync(path.join(os.tmpdir(), 'grab-cmd-'));
    downloader = new ColorFileDownloader();
    vi.spyOn(console, 'log').mockImplementation(() => { });
    vi.spyOn(console, 'error').mockImplementation(() => { });
});

afterEach(() => {
    downloader.cleanup();
    vi.restoreAllMocks();
    fs.rmSync(testDir, { recursive: true, force: true });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('CLI Downloader — single file', () => {
    it('downloads a complete file and writes correct bytes', async () => {
        const out = path.join(testDir, 'output.bin');
        await downloader.downloadFile(`${baseUrl}/file`, out);

        expect(fs.existsSync(out)).toBe(true);
        const content = fs.readFileSync(out, 'utf8');
        expect(content).toBe(FILE_CONTENT);
    });

    it('creates no temp file after a successful download', async () => {
        const out = path.join(testDir, 'output.bin');
        await downloader.downloadFile(`${baseUrl}/file`, out);
        expect(fs.existsSync(out + '.tmp')).toBe(false);
    });

    it('resumes from a partial file when server supports range requests', async () => {
        const out = path.join(testDir, 'resume.bin');
        const tmp = out + '.tmp';

        // Write a partial file (first 32 KB)
        const partial = Buffer.from('A'.repeat(32 * 1024));
        fs.writeFileSync(tmp, partial);

        // Persist a matching state so the downloader knows it was interrupted
        const { getStateFilePath, saveDownloadState } = await import('../src/grab-url-cli/download-state.js');
        const stateFile = getStateFilePath(downloader.stateDir, out);
        saveDownloadState(stateFile, {
            url: `${baseUrl}/file`,
            outputPath: out,
            totalSize: FILE_CONTENT.length,
            startByte: 0,
            lastModified: null,
            etag: '"test-etag"',
            timestamp: new Date().toISOString(),
        });

        await downloader.downloadFile(`${baseUrl}/file`, out);

        expect(fs.existsSync(out)).toBe(true);
        const content = fs.readFileSync(out, 'utf8');
        expect(content).toBe(FILE_CONTENT);
    }, 15_000);
});

describe('CLI Downloader — multiple files', () => {
    it('downloads multiple files concurrently', async () => {
        const downloads = [
            { url: `${baseUrl}/file`, outputPath: path.join(testDir, 'a.bin'), filename: 'a.bin' },
            { url: `${baseUrl}/file`, outputPath: path.join(testDir, 'b.bin'), filename: 'b.bin' },
        ];

        await downloader.downloadMultipleFiles(downloads);

        for (const dl of downloads) {
            expect(fs.existsSync(dl.outputPath)).toBe(true);
            expect(fs.readFileSync(dl.outputPath, 'utf8')).toBe(FILE_CONTENT);
        }
    }, 20_000);

    it('continues other downloads when one fails', async () => {
        const downloads = [
            { url: `${baseUrl}/file`, outputPath: path.join(testDir, 'ok.bin'), filename: 'ok.bin' },
            { url: `${baseUrl}/does-not-exist`, outputPath: path.join(testDir, 'err.bin'), filename: 'err.bin' },
        ];

        // Should not throw even if one file 404s
        await expect(downloader.downloadMultipleFiles(downloads)).resolves.not.toThrow();
        expect(fs.existsSync(downloads[0].outputPath)).toBe(true);
    }, 20_000);
});

describe('CLI Downloader — pause / resume state', () => {
    it('pauseAll() sets isPaused and resumeAll() clears it', () => {
        expect(downloader.isPaused).toBe(false);
        downloader.pauseAll();
        expect(downloader.isPaused).toBe(true);
        downloader.resumeAll();
        expect(downloader.isPaused).toBe(false);
    });

    it('cleanup() aborts without throwing', () => {
        expect(() => downloader.cleanup()).not.toThrow();
    });
});

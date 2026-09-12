/**
 * @file page-archive.test.ts
 * @description Unit tests for `grab-url --page`, the page archiver:
 *   - page/folder-name.ts          (title -> safe directory name)
 *   - page/archive-html.ts         (citation + document builders)
 *   - transfer/ytdlp-transfer.ts   (yt-dlp arg building + progress parsing)
 *   - page/archive-page.ts         (orchestration, against a stubbed extractor)
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
    titleToFolderName,
    urlToFolderName,
    resolveFolderName,
    MAX_FOLDER_NAME,
} from '../packages/grab-url-cli/src/page/folder-name.js';

import {
    escapeHTML,
    wrapDocument,
    buildApaCite,
    buildCiteDocument,
    buildContentDocument,
    buildTranscriptDocument,
} from '../packages/grab-url-cli/src/page/archive-html.js';

import {
    YTDLP_PROGRESS_TEMPLATE,
    parseYtDlpProgress,
    buildYtDlpArgs,
    describeYtDlpExit,
    ytDlpInstallHint,
} from '../packages/grab-url-cli/src/transfer/ytdlp-transfer.js';

// ─── folder-name ──────────────────────────────────────────────────────────────

describe('folder-name — titleToFolderName()', () => {
    it('keeps an ordinary title intact', () => {
        expect(titleToFolderName('How Rockets Work')).toBe('How Rockets Work');
    });

    it('replaces path separators so the name cannot escape its parent', () => {
        expect(titleToFolderName('a/b\\c')).toBe('a b c');
    });

    it('strips the characters Win32 rejects', () => {
        expect(titleToFolderName('Q: is 3 < 4? "yes" | no *')).toBe('Q is 3 4 yes no');
    });

    it('strips control characters picked up from sloppy markup', () => {
        expect(titleToFolderName('Title\n\twith\r\nbreaks')).toBe('Title with breaks');
    });

    it('drops a trailing dot, which Win32 would silently remove', () => {
        expect(titleToFolderName('Chapter One.')).toBe('Chapter One');
    });

    it('suffixes reserved device names', () => {
        expect(titleToFolderName('CON')).toBe('CON-page');
        expect(titleToFolderName('lpt1')).toBe('lpt1-page');
    });

    it('truncates at a word boundary when over the cap', () => {
        const long = 'word '.repeat(80).trim();
        const result = titleToFolderName(long);
        expect(result.length).toBeLessThanOrEqual(MAX_FOLDER_NAME);
        expect(result.endsWith('word')).toBe(true);
    });

    it('hard-truncates a single over-long token', () => {
        const result = titleToFolderName('x'.repeat(300));
        expect(result.length).toBe(MAX_FOLDER_NAME);
    });

    it('returns an empty string for unusable input', () => {
        expect(titleToFolderName('')).toBe('');
        expect(titleToFolderName('///')).toBe('');
        expect(titleToFolderName(undefined as any)).toBe('');
    });
});

describe('folder-name — urlToFolderName()', () => {
    it('joins host and path into a slug', () => {
        expect(urlToFolderName('https://www.ex.com/blog/post-1?utm=x')).toBe('ex.com-blog-post-1');
    });

    it('drops a file extension from the last segment', () => {
        expect(urlToFolderName('https://ex.com/docs/page.html')).toBe('ex.com-docs-page');
    });

    it('falls back to the bare host for a root URL', () => {
        expect(urlToFolderName('https://ex.com/')).toBe('ex.com');
    });

    it('returns an empty string for a malformed URL', () => {
        expect(urlToFolderName('not a url')).toBe('');
    });
});

describe('folder-name — resolveFolderName()', () => {
    it('prefers the title', () => {
        expect(resolveFolderName('My Page', 'https://ex.com/x')).toBe('My Page');
    });

    it('falls back to the URL slug without a title', () => {
        expect(resolveFolderName('', 'https://ex.com/x')).toBe('ex.com-x');
    });

    it('falls back to "page" when neither is usable', () => {
        expect(resolveFolderName('', 'not a url')).toBe('page');
    });
});

// ─── archive-html ─────────────────────────────────────────────────────────────

describe('archive-html — escapeHTML()', () => {
    it('escapes every character that could break out of markup', () => {
        expect(escapeHTML(`<a href="x">&'`)).toBe('&lt;a href=&quot;x&quot;&gt;&amp;&#39;');
    });

    it('renders null and undefined as an empty string', () => {
        expect(escapeHTML(null)).toBe('');
        expect(escapeHTML(undefined)).toBe('');
    });
});

describe('archive-html — wrapDocument()', () => {
    it('produces a standalone document with a charset and the title', () => {
        const doc = wrapDocument('Hi & bye', '<p>body</p>');
        expect(doc.startsWith('<!doctype html>')).toBe(true);
        expect(doc).toContain('<meta charset="utf-8">');
        expect(doc).toContain('<title>Hi &amp; bye</title>');
        expect(doc).toContain('<p>body</p>');
    });
});

describe('archive-html — buildApaCite()', () => {
    it('renders author, year, title, source and link', () => {
        const cite = buildApaCite(
            {
                author_cite: 'Doe, J.',
                title: 'Rockets',
                source: 'Example News',
                date: '2024-03-05T00:00:00Z',
            },
            'https://ex.com/a',
        );
        expect(cite).toContain('Doe, J. (2024, Mar 5)');
        expect(cite).toContain('<b>Rockets</b>');
        expect(cite).toContain('<i>Example News</i>');
        expect(cite).toContain('href="https://ex.com/a"');
    });

    it('omits the date when it is missing or implausible', () => {
        expect(buildApaCite({ title: 'T', source: 'S' }, 'https://ex.com')).not.toContain('(');
        expect(buildApaCite({ title: 'T', date: 'nonsense' }, 'https://ex.com')).not.toContain('(');
        expect(buildApaCite({ title: 'T', date: '1900-01-01' }, 'https://ex.com')).not.toContain('(1900');
    });

    it('escapes a title carrying markup', () => {
        const cite = buildApaCite({ title: '<script>x</script>' }, 'https://ex.com');
        expect(cite).not.toContain('<script>');
        expect(cite).toContain('&lt;script&gt;');
    });
});

describe('archive-html — document builders', () => {
    const article = {
        title: 'Rockets',
        author: 'Jane Doe',
        author_cite: 'Doe, J.',
        date: '2024-03-05',
        source: 'Example News',
        word_count: 412,
        html: '<p>Lift-off.</p>',
    };

    it('buildCiteDocument() lists the extracted metadata', () => {
        const doc = buildCiteDocument(article, 'https://ex.com/a', new Date('2025-01-02T03:04:05Z'));
        expect(doc).toContain('<th>Title</th><td>Rockets</td>');
        expect(doc).toContain('<th>Author</th><td>Jane Doe</td>');
        expect(doc).toContain('<th>Word count</th><td>412</td>');
        expect(doc).toContain('2025-01-02T03:04:05.000Z');
        expect(doc).toContain('https://ex.com/a');
    });

    it('buildCiteDocument() prefers a citation the extractor already built', () => {
        const doc = buildCiteDocument(
            { ...article, cite: 'PRE-BUILT CITE' },
            'https://ex.com/a',
        );
        expect(doc).toContain('PRE-BUILT CITE');
        expect(doc).not.toContain('<b>Rockets</b>');
    });

    it('buildCiteDocument() skips rows with no value', () => {
        const doc = buildCiteDocument({ title: 'Only a title' }, 'https://ex.com/a');
        expect(doc).not.toContain('<th>Author</th>');
    });

    it('buildContentDocument() keeps the extracted body verbatim', () => {
        const doc = buildContentDocument(article, 'https://ex.com/a');
        expect(doc).toContain('<h1>Rockets</h1>');
        expect(doc).toContain('<p>Lift-off.</p>');
    });

    it('buildTranscriptDocument() heads the transcript with its video', () => {
        const doc = buildTranscriptDocument('<p>hello there</p>', 'A Video', 'https://youtu.be/x');
        expect(doc).toContain('<title>Transcript - A Video</title>');
        expect(doc).toContain('<p>hello there</p>');
        expect(doc).toContain('https://youtu.be/x');
    });
});

// ─── ytdlp-transfer ───────────────────────────────────────────────────────────

describe('ytdlp-transfer — parseYtDlpProgress()', () => {
    /** One line as yt-dlp emits it under {@link YTDLP_PROGRESS_TEMPLATE}. */
    const sentinel = (...fields: string[]) => `download:@GRAB@${fields.join('|')}`;

    it('parses a sentinel-prefixed progress line', () => {
        const p = parseYtDlpProgress(
            sentinel('downloading', '3145728', '12582912', 'NA', '1048576', '42', 'NA', 'NA'),
        );
        expect(p).not.toBeNull();
        expect(p!.status).toBe('downloading');
        expect(p!.downloaded).toBe(3 * 1024 ** 2);
        expect(p!.total).toBe(12 * 1024 ** 2);
        expect(p!.estimated).toBe(false);
        expect(p!.speedBps).toBe(1024 ** 2);
        expect(p!.etaSeconds).toBe(42);
    });

    it('falls back to the estimate and says so when the exact total is unknown', () => {
        const p = parseYtDlpProgress(
            sentinel('downloading', '1024', 'NA', '12582912', 'NA', 'NA', 'NA', 'NA'),
        );
        expect(p!.total).toBe(12 * 1024 ** 2);
        expect(p!.estimated).toBe(true);
    });

    it('treats NA and None as unknown rather than NaN', () => {
        const p = parseYtDlpProgress(
            sentinel('finished', 'None', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA'),
        );
        expect(p!.downloaded).toBe(0);
        expect(p!.total).toBe(0);
        expect(p!.speedBps).toBe(0);
        expect(p!.etaSeconds).toBe(0);
    });

    it('keeps the fragment counters an HLS stream reports, and nulls them otherwise', () => {
        const hls = parseYtDlpProgress(
            sentinel('downloading', '1024', 'NA', 'NA', 'NA', 'NA', '7', '20'),
        );
        expect(hls!.fragmentIndex).toBe(7);
        expect(hls!.fragmentCount).toBe(20);

        const plain = parseYtDlpProgress(
            sentinel('downloading', '1024', 'NA', 'NA', 'NA', 'NA', 'NA', 'NA'),
        );
        expect(plain!.fragmentIndex).toBeNull();
        expect(plain!.fragmentCount).toBeNull();
    });

    it('returns null for every other line yt-dlp writes', () => {
        expect(parseYtDlpProgress('[youtube] abc: Downloading webpage')).toBeNull();
        expect(parseYtDlpProgress('[download]  23.4% of ~12.00MiB at 1.00MiB/s')).toBeNull();
        expect(parseYtDlpProgress('[download] Destination: video.mp4')).toBeNull();
        expect(parseYtDlpProgress('')).toBeNull();
    });

    it('returns null for a truncated sentinel line', () => {
        expect(parseYtDlpProgress(sentinel('downloading', '1024', 'NA'))).toBeNull();
    });
});

describe('ytdlp-transfer — buildYtDlpArgs()', () => {
    it('never expands a playlist and always writes into --paths', () => {
        const args = buildYtDlpArgs('https://youtu.be/x', { dir: '/tmp/out' });
        expect(args).toContain('--no-playlist');
        expect(args[args.indexOf('--paths') + 1]).toBe('/tmp/out');
        expect(args[args.length - 1]).toBe('https://youtu.be/x');
    });

    it('uses the supplied output template verbatim', () => {
        const args = buildYtDlpArgs('https://youtu.be/x', { output: 'My Video.%(ext)s' });
        expect(args[args.indexOf('--output') + 1]).toBe('My Video.%(ext)s');
    });

    it('falls back to title and id when no output template was given', () => {
        const args = buildYtDlpArgs('https://youtu.be/x');
        expect(args[args.indexOf('--output') + 1]).toBe('%(title)s [%(id)s].%(ext)s');
    });

    it('asks yt-dlp for the sentinel progress template the parser reads', () => {
        const args = buildYtDlpArgs('https://youtu.be/x');
        expect(args[args.indexOf('--progress-template') + 1]).toBe(YTDLP_PROGRESS_TEMPLATE);
    });

    it('passes a format selector through', () => {
        const args = buildYtDlpArgs('https://youtu.be/x', { format: 'bestaudio' });
        expect(args[args.indexOf('--format') + 1]).toBe('bestaudio');
    });

    it('omits --format when none was given', () => {
        expect(buildYtDlpArgs('https://youtu.be/x')).not.toContain('--format');
    });

    it('appends extra args before the URL', () => {
        const args = buildYtDlpArgs('https://youtu.be/x', { extraArgs: ['--limit-rate', '1M'] });
        expect(args.slice(-3)).toEqual(['--limit-rate', '1M', 'https://youtu.be/x']);
    });
});

describe('ytdlp-transfer — misc', () => {
    it('describes known exit codes', () => {
        expect(describeYtDlpExit(0)).toBe('completed');
        expect(describeYtDlpExit(1)).toContain('download failed');
        expect(describeYtDlpExit(null)).toBe('terminated by signal');
        expect(describeYtDlpExit(77)).toContain('77');
    });

    it('always offers an install hint', () => {
        expect(ytDlpInstallHint().length).toBeGreaterThan(0);
    });
});

// ─── archive-page ─────────────────────────────────────────────────────────────

/**
 * `archivePage` reaches for two things the tests must not: the optional
 * `extract-webpage` package and the `yt-dlp` binary. Both are mocked at the
 * module boundary so the orchestration itself — which files land where, and
 * which failures are warnings rather than errors — can be checked on a real
 * temp directory.
 */
const extractorStub = {
    scrapeURL: vi.fn(),
    extractContent: vi.fn(),
    getURLYoutubeVideo: vi.fn(),
    convertYoutubeToText: vi.fn(),
};

vi.mock('../packages/grab-url-cli/src/page/extract-webpage-loader.js', () => ({
    loadExtractWebpage: () => Promise.resolve(extractorStub),
    resetExtractWebpageCache: () => {},
    EXTRACT_WEBPAGE_INSTALL_HINT: 'npm install extract-webpage',
}));

const ytdlpStub = {
    findYtDlp: vi.fn(),
    probeYtDlp: vi.fn(),
    runYtDlpDownload: vi.fn(),
    ytDlpInstallHint: () => 'install yt-dlp',
};

vi.mock('../packages/grab-url-cli/src/transfer/ytdlp-transfer.js', async (importOriginal) => ({
    ...(await importOriginal<typeof import('../packages/grab-url-cli/src/transfer/ytdlp-transfer.js')>()),
    findYtDlp: (...a: any[]) => ytdlpStub.findYtDlp(...a),
    probeYtDlp: (...a: any[]) => ytdlpStub.probeYtDlp(...a),
    runYtDlpDownload: (...a: any[]) => ytdlpStub.runYtDlpDownload(...a),
    ytDlpInstallHint: () => ytdlpStub.ytDlpInstallHint(),
}));

const { archivePage, ARCHIVE_FILES } = await import(
    '../packages/grab-url-cli/src/page/archive-page.js'
);

describe('archive-page — archivePage()', () => {
    let tmp: string;
    let logSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'grab-page-'));
        logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        extractorStub.scrapeURL.mockReset().mockResolvedValue('<html><body>full page</body></html>');
        extractorStub.extractContent.mockReset().mockResolvedValue({
            title: 'Rockets: A Primer',
            author_cite: 'Doe, J.',
            source: 'Example News',
            date: '2024-03-05',
            html: '<p>Lift-off.</p>',
        });
        extractorStub.getURLYoutubeVideo.mockReset().mockReturnValue(null);
        extractorStub.convertYoutubeToText.mockReset();

        ytdlpStub.findYtDlp.mockReset().mockReturnValue(null);
        ytdlpStub.probeYtDlp.mockReset().mockReturnValue(null);
        ytdlpStub.runYtDlpDownload.mockReset();
    });

    afterEach(() => {
        logSpy.mockRestore();
        fs.rmSync(tmp, { recursive: true, force: true });
    });

    it('creates a folder named after the page title', async () => {
        const result = await archivePage('https://ex.com/a', { dir: tmp, skipVideo: true });
        expect(path.basename(result.folder)).toBe('Rockets A Primer');
        expect(fs.existsSync(result.folder)).toBe(true);
    });

    it('writes the full page, the content and the cite', async () => {
        const result = await archivePage('https://ex.com/a', { dir: tmp, skipVideo: true });
        const names = fs.readdirSync(result.folder).sort();
        expect(names).toEqual([ARCHIVE_FILES.cite, ARCHIVE_FILES.content, ARCHIVE_FILES.page]);

        expect(fs.readFileSync(path.join(result.folder, ARCHIVE_FILES.page), 'utf8')).toBe(
            '<html><body>full page</body></html>',
        );
        expect(fs.readFileSync(path.join(result.folder, ARCHIVE_FILES.content), 'utf8')).toContain(
            '<p>Lift-off.</p>',
        );
        expect(fs.readFileSync(path.join(result.folder, ARCHIVE_FILES.cite), 'utf8')).toContain(
            'Doe, J. (2024, Mar 5)',
        );
    });

    it('fetches the page once and feeds the same HTML to the extractor', async () => {
        await archivePage('https://ex.com/a', { dir: tmp, skipVideo: true });
        expect(extractorStub.scrapeURL).toHaveBeenCalledTimes(1);
        expect(extractorStub.extractContent).toHaveBeenCalledWith(
            '<html><body>full page</body></html>',
            expect.objectContaining({ url: 'https://ex.com/a' }),
        );
    });

    it('falls back to a URL slug when the page has no title', async () => {
        extractorStub.extractContent.mockResolvedValue({ html: '<p>x</p>' });
        const result = await archivePage('https://ex.com/blog/post', { dir: tmp, skipVideo: true });
        expect(path.basename(result.folder)).toBe('ex.com-blog-post');
    });

    it('honours an explicit folder name', async () => {
        const result = await archivePage('https://ex.com/a', {
            dir: tmp,
            folderName: 'custom',
            skipVideo: true,
        });
        expect(path.basename(result.folder)).toBe('custom');
    });

    it('reuses an existing folder so a re-run refreshes it', async () => {
        const first = await archivePage('https://ex.com/a', { dir: tmp, skipVideo: true });
        const second = await archivePage('https://ex.com/a', { dir: tmp, skipVideo: true });
        expect(second.folder).toBe(first.folder);
        expect(fs.readdirSync(tmp)).toHaveLength(1);
    });

    it('throws when the page cannot be fetched', async () => {
        extractorStub.scrapeURL.mockResolvedValue(null);
        await expect(archivePage('https://ex.com/a', { dir: tmp })).rejects.toThrow(
            /Could not fetch HTML/,
        );
    });

    it('throws when nothing could be extracted', async () => {
        extractorStub.extractContent.mockResolvedValue({ error: 'blocked' });
        await expect(archivePage('https://ex.com/a', { dir: tmp })).rejects.toThrow(/blocked/);
    });

    it('writes a transcript for a YouTube URL and uses it as the content', async () => {
        extractorStub.getURLYoutubeVideo.mockReturnValue('dQw4w9WgXcQ');
        extractorStub.convertYoutubeToText.mockResolvedValue({ html: '<p>never gonna</p>' });

        const result = await archivePage('https://youtu.be/dQw4w9WgXcQ', {
            dir: tmp,
            skipVideo: true,
            languages: ['es', 'en'],
        });

        const transcript = fs.readFileSync(path.join(result.folder, ARCHIVE_FILES.transcript), 'utf8');
        expect(transcript).toContain('<p>never gonna</p>');
        expect(fs.readFileSync(path.join(result.folder, ARCHIVE_FILES.content), 'utf8')).toContain(
            '<p>never gonna</p>',
        );
        expect(extractorStub.convertYoutubeToText).toHaveBeenCalledWith(
            'https://youtu.be/dQw4w9WgXcQ',
            { languages: ['es', 'en'] },
        );
    });

    it('warns but still archives when no transcript is available', async () => {
        extractorStub.getURLYoutubeVideo.mockReturnValue('dQw4w9WgXcQ');
        extractorStub.convertYoutubeToText.mockResolvedValue({ error: 'captions disabled' });

        const result = await archivePage('https://youtu.be/x', { dir: tmp, skipVideo: true });
        expect(result.warnings.join(' ')).toContain('captions disabled');
        expect(fs.existsSync(path.join(result.folder, ARCHIVE_FILES.transcript))).toBe(false);
        expect(fs.existsSync(path.join(result.folder, ARCHIVE_FILES.content))).toBe(true);
    });

    it('warns when yt-dlp is not installed', async () => {
        const result = await archivePage('https://ex.com/a', { dir: tmp });
        expect(result.warnings.join(' ')).toContain('yt-dlp not found');
    });

    it('stays silent about yt-dlp when --no-video was passed', async () => {
        const result = await archivePage('https://ex.com/a', { dir: tmp, skipVideo: true });
        expect(result.warnings).toHaveLength(0);
        expect(ytdlpStub.findYtDlp).not.toHaveBeenCalled();
    });

    it('does not warn when yt-dlp simply finds no video', async () => {
        ytdlpStub.findYtDlp.mockReturnValue({ path: 'yt-dlp', version: '2025.01.01' });
        const result = await archivePage('https://ex.com/a', { dir: tmp });
        expect(result.warnings).toHaveLength(0);
        expect(ytdlpStub.runYtDlpDownload).not.toHaveBeenCalled();
    });

    it('downloads a video into the same folder when yt-dlp catches one', async () => {
        ytdlpStub.findYtDlp.mockReturnValue({ path: 'yt-dlp', version: '2025.01.01' });
        ytdlpStub.probeYtDlp.mockReturnValue({ id: 'abc', title: 'A Video' });
        ytdlpStub.runYtDlpDownload.mockImplementation(async (_url: string, opts: any) => {
            const file = path.join(opts.dir, 'A Video.mp4');
            fs.writeFileSync(file, 'fake');
            return [file];
        });

        const result = await archivePage('https://ex.com/a', { dir: tmp, videoFormat: 'best' });
        expect(result.warnings).toHaveLength(0);
        expect(result.files.some((f) => f.endsWith('A Video.mp4'))).toBe(true);
        expect(ytdlpStub.runYtDlpDownload).toHaveBeenCalledWith(
            'https://ex.com/a',
            expect.objectContaining({ dir: result.folder, format: 'best' }),
        );
    });

    it('keeps the html files when the video download fails', async () => {
        ytdlpStub.findYtDlp.mockReturnValue({ path: 'yt-dlp', version: '2025.01.01' });
        ytdlpStub.probeYtDlp.mockReturnValue({ id: 'abc', title: 'A Video' });
        ytdlpStub.runYtDlpDownload.mockRejectedValue(new Error('yt-dlp download failed'));

        const result = await archivePage('https://ex.com/a', { dir: tmp });
        expect(result.warnings.join(' ')).toContain('yt-dlp download failed');
        expect(fs.existsSync(path.join(result.folder, ARCHIVE_FILES.content))).toBe(true);
    });
});

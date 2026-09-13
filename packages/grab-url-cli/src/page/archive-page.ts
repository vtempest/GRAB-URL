/**
 * @file archive-page.ts
 * @description `--page` mode: archive a web page into a self-contained folder.
 *
 * The folder is named after the page title and holds everything needed to read
 * the page again with no network:
 *
 * ```text
 * <Page Title>/
 *   page.html         the full page exactly as fetched
 *   content.html      reading-mode article body
 *   cite.html         APA citation + extracted metadata
 *   transcript.html   YouTube transcript, when the URL is a video
 *   <video>.mp4       whatever yt-dlp caught, when it recognised the URL
 * ```
 *
 * Content extraction, citation metadata and the transcript all come from
 * qwksearch's [`extract-webpage`](https://www.npmjs.com/package/extract-webpage);
 * the video comes from `yt-dlp`. Both are optional: a missing `yt-dlp` costs the
 * video and nothing else, and every step reports what it did or why it did not.
 */

import fs from 'fs';
import path from 'path';

import {
    buildCiteDocument,
    buildContentDocument,
    buildTranscriptDocument,
} from './archive-html.js';
import { resolveFolderName } from './folder-name.js';
import {
    loadExtractWebpage,
    type ExtractedArticle,
    type ExtractWebpageModule,
} from './extract-webpage-loader.js';
import { colors } from '../display/progress-format.js';
import {
    findYtDlp,
    probeYtDlp,
    runYtDlpDownload,
    ytDlpInstallHint,
} from '../transfer/ytdlp-transfer.js';

/** Fixed file names inside an archive folder. */
export const ARCHIVE_FILES = {
    page: 'page.html',
    content: 'content.html',
    cite: 'cite.html',
    transcript: 'transcript.html',
} as const;

export interface ArchivePageOptions {
    /** Parent directory the archive folder is created in. Defaults to cwd. */
    dir?: string;
    /** Override the folder name instead of deriving it from the page title. */
    folderName?: string | null;
    /** Skip the yt-dlp step entirely. */
    skipVideo?: boolean;
    /** Format selector handed to `yt-dlp -f`. */
    videoFormat?: string | null;
    /** Preferred transcript languages, most preferred first. */
    languages?: string[];
    /** Proxy passed through to the extractor's scraper. */
    proxy?: string | null;
}

export interface ArchivePageResult {
    /** Absolute path of the created folder. */
    folder: string;
    /** Title the folder was named after. */
    title: string;
    /** Absolute paths of every file written, in the order they were written. */
    files: string[];
    /** Extraction metadata, kept so callers can print a summary. */
    article: ExtractedArticle;
    /** Non-fatal problems: a missing transcript, an absent yt-dlp, a failed video. */
    warnings: string[];
}

/**
 * Create the archive folder, tolerating one that already exists so re-running
 * the same command refreshes an archive rather than piling up `(2)` copies.
 *
 * @param parent - Directory to create the folder inside
 * @param name - Folder name, already sanitised
 * @returns The absolute folder path
 */
function ensureFolder(parent: string, name: string): string {
    const folder = path.resolve(parent, name);
    fs.mkdirSync(folder, { recursive: true });
    return folder;
}

/**
 * Fetch the raw page HTML through the extractor's scraper, which already knows
 * about proxies and reader fallbacks.
 *
 * @param lib - The loaded `extract-webpage` module
 * @param url - Page URL
 * @param proxy - Optional proxy passed to the scraper
 * @returns The page HTML
 * @throws When the scraper returns anything other than a non-empty string
 */
async function fetchPageHTML(
    lib: ExtractWebpageModule,
    url: string,
    proxy: string | null | undefined,
): Promise<string> {
    const html = await lib.scrapeURL(url, { proxy: proxy ?? null });
    if (typeof html !== 'string' || !html.trim()) {
        throw new Error(`Could not fetch HTML for ${url}`);
    }
    return html;
}

/**
 * Archive one page into its own folder.
 *
 * @param url - The page to archive
 * @param options - Destination, video and transcript options
 * @returns Where everything landed, plus any non-fatal warnings
 * @throws When `extract-webpage` is missing, the page cannot be fetched, or no
 *         content could be extracted from it
 */
export async function archivePage(
    url: string,
    options: ArchivePageOptions = {},
): Promise<ArchivePageResult> {
    const lib = await loadExtractWebpage();
    const warnings: string[] = [];
    const files: string[] = [];

    console.log(colors.info(`📄 Extracting: ${url}`));

    // One fetch feeds both `page.html` and the extractor, so the archived page
    // and the archived article are guaranteed to be the same revision.
    const pageHTML = await fetchPageHTML(lib, url, options.proxy);
    const article = await lib.extractContent(pageHTML, { ...options, url });
    if (article.error || !article.html) {
        throw new Error(`Could not extract content from ${url}: ${article.error ?? 'no content'}`);
    }
    article.url = article.url || url;
    article.word_count =
        article.word_count ?? article.html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;

    const title = article.title || url;
    const folder = ensureFolder(
        options.dir ? path.resolve(options.dir) : process.cwd(),
        options.folderName || resolveFolderName(article.title, url),
    );

    /** Write one archive file and record it. */
    const write = (name: string, contents: string) => {
        const file = path.join(folder, name);
        fs.writeFileSync(file, contents, 'utf8');
        files.push(file);
    };

    write(ARCHIVE_FILES.page, pageHTML);

    // --- YouTube transcript -------------------------------------------------
    // Runs before `content.html` is written: the readable body of a watch page
    // is its transcript, not the chrome around the player, which is what
    // `extract-webpage` also does when it is handed a YouTube URL directly.
    if (lib.getURLYoutubeVideo(url)) {
        try {
            const transcript = await lib.convertYoutubeToText(url, {
                languages: options.languages?.length ? options.languages : ['en'],
            });
            const html = typeof transcript?.html === 'string' ? transcript.html : '';
            if (html) {
                write(ARCHIVE_FILES.transcript, buildTranscriptDocument(html, title, url));
                article.html = html;
                article.word_count = html.replace(/<[^>]*>/g, ' ').trim().split(/\s+/).length;
            } else {
                warnings.push(
                    `No transcript saved: ${String(transcript?.error ?? 'none available')}`,
                );
            }
        } catch (error: any) {
            warnings.push(`No transcript saved: ${error?.message ?? error}`);
        }
    }

    write(ARCHIVE_FILES.content, buildContentDocument(article, url));
    write(ARCHIVE_FILES.cite, buildCiteDocument(article, url));

    // --- Video, when yt-dlp recognises the URL ------------------------------
    if (!options.skipVideo) {
        if (!findYtDlp()) {
            warnings.push(`No video saved: yt-dlp not found. Install it with: ${ytDlpInstallHint()}`);
        } else {
            const meta = probeYtDlp(url);
            if (!meta) {
                // The common case for an ordinary article — not worth a warning.
                console.log(colors.info('🎬 No video found at this URL'));
            } else {
                console.log(
                    colors.info(`🎬 Video found: ${meta.title || meta.id || url}`),
                );
                try {
                    const saved = await runYtDlpDownload(url, {
                        dir: folder,
                        format: options.videoFormat ?? null,
                    });
                    saved.forEach((file) => files.push(file));
                    if (!saved.length) {
                        warnings.push('yt-dlp reported success but named no output file');
                    }
                } catch (error: any) {
                    warnings.push(`No video saved: ${error?.message ?? error}`);
                }
            }
        }
    }

    return { folder, title, files, article, warnings };
}

/**
 * Print the result of an archive run: where it went and what is in it.
 *
 * @param result - Value returned by {@link archivePage}
 */
export function reportArchive(result: ArchivePageResult): void {
    console.log(colors.success('✅ Archived: ') + colors.yellow(result.title));
    console.log(colors.primary('📁 Folder: ') + result.folder);
    result.files.forEach((file) => {
        let size = '';
        try {
            size = ` (${(fs.statSync(file).size / 1024).toFixed(1)} KB)`;
        } catch {
            /* the file was reported but is gone — show the name alone */
        }
        console.log(colors.info(`   • ${path.basename(file)}${size}`));
    });
    result.warnings.forEach((warning) => console.log(colors.warning(`   ⚠ ${warning}`)));
}

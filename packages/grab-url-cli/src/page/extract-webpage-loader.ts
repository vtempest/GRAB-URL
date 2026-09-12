/**
 * @file extract-webpage-loader.ts
 * @description Lazy bridge to [`extract-webpage`](https://www.npmjs.com/package/extract-webpage),
 * the qwksearch content extractor that turns a fetched page into reading-mode
 * HTML plus citation metadata.
 *
 * It is loaded through a dynamic `import()` rather than a static one because it
 * is an optional peer dependency: it pulls in jsdom, linkedom and a transformers
 * runtime, which is a lot of install for a CLI whose other modes are a plain
 * `fetch()`. Only `--page` needs it, so only `--page` pays for it, and the miss
 * is reported as an install hint in the same style as the missing-`aria2c` and
 * missing-`yt-dlp` paths.
 */

/** Citation + content fields returned by `extract-webpage`'s `extractContent`. */
export interface ExtractedArticle {
    cite?: string;
    html?: string;
    url?: string;
    author?: string;
    author_cite?: string;
    author_short?: string;
    author_type?: number | string;
    date?: string;
    title?: string;
    source?: string;
    word_count?: number;
    format?: string;
    error?: string | number;
}

/** The subset of the `extract-webpage` surface the archiver calls. */
export interface ExtractWebpageModule {
    /** Fetch a URL's raw HTML, applying the library's scraping fallbacks. */
    scrapeURL: (url: string, options?: Record<string, unknown>) => Promise<unknown>;
    /** Extract reading-mode content + citation fields from a URL, DOM or HTML string. */
    extractContent: (
        urlOrDoc: string,
        options?: Record<string, unknown>,
    ) => Promise<ExtractedArticle>;
    /** Return the 11-character video id when the URL points at a YouTube video. */
    getURLYoutubeVideo: (url: string) => string | null;
    /** Fetch a YouTube transcript as an HTML fragment. */
    convertYoutubeToText: (
        url: string,
        options?: { languages?: string[] },
    ) => Promise<Record<string, unknown>>;
}

/** Shown when the optional dependency is not installed. */
export const EXTRACT_WEBPAGE_INSTALL_HINT =
    'npm install extract-webpage   (or: npm i -g extract-webpage)';

let cached: ExtractWebpageModule | null = null;

/**
 * Resolve `extract-webpage`, caching the module across calls.
 *
 * @returns The extractor module
 * @throws When the package is not installed, with an install hint
 */
export async function loadExtractWebpage(): Promise<ExtractWebpageModule> {
    if (cached) return cached;
    try {
        // Kept as a variable so bundlers leave the specifier alone and resolve
        // it at runtime from the host's node_modules.
        const specifier = 'extract-webpage';
        const mod = (await import(/* @vite-ignore */ specifier)) as
            | ExtractWebpageModule
            | { default: ExtractWebpageModule };
        cached = ('extractContent' in mod ? mod : mod.default) as ExtractWebpageModule;
        return cached;
    } catch (error: any) {
        throw new Error(
            '--page needs the optional "extract-webpage" package, which is not installed. ' +
                `Install it with: ${EXTRACT_WEBPAGE_INSTALL_HINT}` +
                (error?.message ? `\n  (import failed: ${error.message})` : ''),
        );
    }
}

/** Drop the cached module. Exported for tests. */
export function resetExtractWebpageCache(): void {
    cached = null;
}

/**
 * @file archive-html.ts
 * @description Pure builders for the HTML files written into a page archive.
 *
 * `extract-webpage` hands back a body fragment plus loose citation fields; the
 * archive folder is meant to be opened straight from a file manager, so every
 * fragment is wrapped into a standalone document here with a charset, a title
 * and enough styling to read comfortably offline.
 */

import type { ExtractedArticle } from './extract-webpage-loader.js';

/** Minimal reading-mode stylesheet, inlined so the files work with no network. */
const ARCHIVE_STYLE = `
  :root { color-scheme: light dark; }
  body { margin: 0 auto; max-width: 46rem; padding: 2rem 1.25rem;
         font: 1.05rem/1.7 system-ui, -apple-system, Segoe UI, Roboto, sans-serif; }
  img, video { max-width: 100%; height: auto; }
  pre { overflow-x: auto; }
  table { border-collapse: collapse; }
  th, td { border: 1px solid currentColor; padding: .35rem .6rem; text-align: left;
           vertical-align: top; }
  th { white-space: nowrap; }
  .archive-source { word-break: break-all; }
`.trim();

/**
 * Escape the five characters that would otherwise break out of HTML text or an
 * attribute value. Titles and author names come from arbitrary pages, so they
 * are never interpolated raw.
 *
 * @param value - Untrusted text destined for the archive documents
 */
export function escapeHTML(value: unknown): string {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

/**
 * Wrap a body fragment in a complete, self-contained HTML5 document.
 *
 * @param title - Document title, escaped before use
 * @param body - Body markup, inserted as-is
 */
export function wrapDocument(title: string, body: string): string {
    return [
        '<!doctype html>',
        '<html lang="en">',
        '<head>',
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1">',
        `<title>${escapeHTML(title)}</title>`,
        `<style>${ARCHIVE_STYLE}</style>`,
        '</head>',
        `<body>\n${body}\n</body>`,
        '</html>',
        '',
    ].join('\n');
}

/**
 * Assemble an APA-style citation from the fields `extract-webpage` extracted.
 *
 * Used only when the extractor did not already build one itself: passing it
 * pre-fetched HTML skips its own citation assembly, so the archive recreates
 * the same `Author (Year, Mon D). **Title**. *Source*. URL` shape here.
 *
 * @param article - Extraction result carrying author / date / title / source
 * @param url - The archived URL, rendered as the trailing link
 */
export function buildApaCite(article: ExtractedArticle, url: string): string {
    const { author_cite, source, title, date } = article;

    const parsed = date ? new Date(date) : null;
    const hasYear = parsed && !Number.isNaN(parsed.getTime()) && parsed.getFullYear() > 1971;
    const datePart = hasYear
        ? ` (${parsed!.getFullYear()}, ${parsed!.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
          })})`
        : '';

    return (
        `${escapeHTML(author_cite || source || ' ')}${datePart}. ` +
        `<b>${escapeHTML(title || '')}</b>. <i>${escapeHTML(source || '')}</i>. ` +
        `<a href="${escapeHTML(url)}" target="_blank">${escapeHTML(url)}</a>`
    );
}

/**
 * Build `cite.html`: the citation line plus a table of every metadata field the
 * extractor resolved, so the archive still identifies its source once the
 * folder has been moved or renamed.
 *
 * @param article - Extraction result
 * @param url - The archived URL
 * @param archivedAt - Timestamp recorded as the retrieval date
 */
export function buildCiteDocument(
    article: ExtractedArticle,
    url: string,
    archivedAt: Date = new Date(),
): string {
    const cite = article.cite || buildApaCite(article, url);

    const rows = ([
        ['Title', article.title || ''],
        ['Author', article.author || ''],
        ['Author (cite)', article.author_cite || ''],
        ['Date', article.date || ''],
        ['Source', article.source || ''],
        ['Word count', article.word_count ? String(article.word_count) : ''],
        ['Format', article.format || ''],
    ] as Array<[string, string]>).filter(([, value]) => value !== '');

    const table = [
        '<table>',
        ...rows.map(
            ([label, value]) =>
                `<tr><th>${escapeHTML(label)}</th><td>${escapeHTML(value)}</td></tr>`,
        ),
        `<tr><th>URL</th><td class="archive-source">` +
            `<a href="${escapeHTML(url)}">${escapeHTML(url)}</a></td></tr>`,
        `<tr><th>Retrieved</th><td>${escapeHTML(archivedAt.toISOString())}</td></tr>`,
        '</table>',
    ].join('\n');

    return wrapDocument(
        `Cite - ${article.title || url}`,
        `<h1>Citation</h1>\n<p>${cite}</p>\n${table}`,
    );
}

/**
 * Build `content.html`: the reading-mode article body under its own heading.
 *
 * @param article - Extraction result whose `html` holds the cleaned body
 * @param url - The archived URL, linked under the heading
 */
export function buildContentDocument(article: ExtractedArticle, url: string): string {
    const title = article.title || url;
    return wrapDocument(
        title,
        `<h1>${escapeHTML(title)}</h1>\n` +
            `<p class="archive-source"><a href="${escapeHTML(url)}">${escapeHTML(url)}</a></p>\n` +
            `<hr>\n${article.html || ''}`,
    );
}

/**
 * Build `transcript.html` from a transcript fragment.
 *
 * @param html - Transcript markup produced by the extractor
 * @param title - Video title used for the document heading
 * @param url - The archived video URL
 */
export function buildTranscriptDocument(html: string, title: string, url: string): string {
    return wrapDocument(
        `Transcript - ${title}`,
        `<h1>Transcript</h1>\n<h2>${escapeHTML(title)}</h2>\n` +
            `<p class="archive-source"><a href="${escapeHTML(url)}">${escapeHTML(url)}</a></p>\n` +
            `<hr>\n${html}`,
    );
}

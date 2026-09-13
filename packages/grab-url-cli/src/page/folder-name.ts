/**
 * @file folder-name.ts
 * @description Turns a page title (or, failing that, its URL) into a directory
 * name that is safe on every platform the CLI runs on.
 *
 * Windows is the strict one: it rejects `\ / : * ? " < > |`, reserves a handful
 * of device names (`CON`, `LPT1`, ...) and silently drops trailing dots and
 * spaces, which would otherwise make a folder unreachable after it is created.
 * Everything here is pure so it can be unit tested without touching disk.
 */

/** Characters no filesystem in the supported set accepts inside a name. */
const ILLEGAL_CHARS = /[\\/:*?"<>|]/g;

/** Control characters and newlines, which titles pick up from sloppy markup. */
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

/** MS-DOS device names, still reserved by Win32 with or without an extension. */
const RESERVED_NAMES = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i;

/** Longest folder name we produce - leaves room for the files written inside. */
export const MAX_FOLDER_NAME = 120;

/**
 * Convert arbitrary text into a directory name.
 *
 * @param title - Raw page title, may contain slashes, emoji or newlines
 * @param maxLength - Cap on the returned length (default {@link MAX_FOLDER_NAME})
 * @returns A trimmed, filesystem-safe name, or `''` when nothing usable remains
 */
export function titleToFolderName(title: string, maxLength = MAX_FOLDER_NAME): string {
    if (!title || typeof title !== 'string') return '';

    let name = title
        .replace(CONTROL_CHARS, ' ')
        .replace(ILLEGAL_CHARS, ' ')
        // Collapse the runs the replacements above just created.
        .replace(/\s+/g, ' ')
        .trim();

    if (name.length > maxLength) {
        // Prefer cutting at a word boundary so the name still reads as a title.
        const clipped = name.slice(0, maxLength);
        const lastSpace = clipped.lastIndexOf(' ');
        name = (lastSpace > maxLength / 2 ? clipped.slice(0, lastSpace) : clipped).trim();
    }

    // Win32 drops a trailing dot or space silently, leaving an unreachable folder.
    name = name.replace(/[. ]+$/, '');

    if (RESERVED_NAMES.test(name)) name = `${name}-page`;

    return name;
}

/**
 * Build a folder name from a URL, used when a page has no usable title.
 * `https://ex.com/blog/post-1?utm=x` becomes `ex.com-blog-post-1`.
 *
 * @param url - The URL being archived
 */
export function urlToFolderName(url: string): string {
    try {
        const { hostname, pathname } = new URL(url);
        const slug = pathname
            .replace(/\.[a-z0-9]{1,5}$/i, '')
            .split('/')
            .filter(Boolean)
            .join('-');
        return titleToFolderName(
            [hostname.replace(/^www\./, ''), slug].filter(Boolean).join('-'),
        );
    } catch {
        return '';
    }
}

/**
 * Pick the folder name for an archive, falling back down the chain
 * title -> URL slug -> `page` so a directory is always created.
 *
 * @param title - Extracted page title, if any
 * @param url - The URL being archived
 */
export function resolveFolderName(title: string | undefined, url: string): string {
    return titleToFolderName(title || '') || urlToFolderName(url) || 'page';
}

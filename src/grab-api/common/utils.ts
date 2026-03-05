/**
 * @file common/utils.ts
 * @description Common utility functions used across the Grab API.
 * Includes helpers for debouncing, URL building, and asynchronous waiting.
 */

/**
 * Delays execution so that future calls may override and only executes the last one.
 * Useful for search inputs or other high-frequency events.
 * 
 * @param func - The function to debounce.
 * @param wait - Time to wait in milliseconds.
 * @returns A debounced version of the function.
 */
export const debouncer = async (func: Function, wait: number) => {
    let timeout: any;
    return async function executedFunction(...args: any[]) {
        const later = async () => {
            clearTimeout(timeout);
            await func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

/**
 * Helper function to wait for a specified number of seconds.
 * 
 * @param s - Seconds to wait.
 * @returns A promise that resolves after the timeout.
 */
export const wait = (s: number) => new Promise((res) => setTimeout(res, s * 1000 || 0));

/**
 * Normalizes and builds a URL from a base and relative path.
 * 
 * @param baseURL - The base API URL.
 * @param path - The specific endpoint path.
 * @returns An object containing the combined URL and updated baseURL/path if needed.
 */
export const buildUrl = (baseURL: string, path: string) => {
    let s = (t: string) => path.startsWith(t);
    let finalBaseURL = baseURL;
    let finalPath = path;

    if (s("http:") || s("https:")) {
        finalBaseURL = "";
    } else if (!s("/") && !finalBaseURL.endsWith("/")) {
        finalPath = "/" + path;
    } else if (s("/") && finalBaseURL.endsWith("/")) {
        finalPath = path.slice(1);
    }

    return { baseURL: finalBaseURL, path: finalPath };
};

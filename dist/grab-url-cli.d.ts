import { ChalkInstance } from 'chalk';

/**
 * @file arg-parser.ts
 * @description Minimal CLI argument parser for grab-url bin, plus URL type detection.
 */
/** Minimal yargs-style arg parser used by the grab-url CLI */
export declare class ArgParser {
    commands: Record<string, {
        desc: string;
        handler?: any;
        required: boolean;
    }>;
    options: Record<string, any>;
    examples: Array<{
        cmd: string;
        desc: string;
    }>;
    helpText: string;
    versionText: string;
    usage(text: string): this;
    command(pattern: string, desc: string, handler?: any): this;
    option(name: string, opts?: any): this;
    example(cmd: string, desc: string): this;
    help(): this;
    alias(short: string, long: string): this;
    version(v: string): this;
    strict(): this;
    parseSync(): Record<string, any>;
    coerceValue(optName: string, value: string): any;
    findLongName(shortFlag: string): string;
    showHelp(): void;
}

/**
 * Calculate an appropriate bar size for the terminal, accounting for the
 * current spinner frame width and fixed UI elements.
 */
declare function calculateBarSize(spinnerFrame: string, baseBarSize?: number): number;

/**
 * @file download-multi.ts
 * @description Concurrent multi-file download with a shared MultiBar, per-file
 * progress bars, a master aggregate bar, and speed-update interval.
 *
 * Three exported functions:
 *   downloadMultipleFiles     — orchestrates a batch download session
 *   downloadSingleFileWithBar — downloads one file and updates shared tracking
 *   addFileToMultiBar         — adds a new URL dynamically to a running session
 */
export declare interface Download {
    url: string;
    outputPath: string;
    filename: string;
    estimatedSize?: number;
    index?: number;
}

/**
 * Format bytes into a human-readable colored string (B / KB / MB / GB / TB).
 */
declare function formatBytes(bytes: number, decimals?: number): string;

/**
 * Compact byte formatter (no units label for MB+, whole-number KB below 100 KB).
 */
declare function formatBytesCompact(bytes: number): string;

/**
 * Format seconds as H:MM:SS, padded to COL_ETA width.
 */
declare function formatETA(seconds: number, colEta?: number): string;

/**
 * Format total-downloaded progress for the master bar (MB/GB).
 */
declare function formatMasterProgress(totalDownloaded: number, totalSize: number, colDownloaded?: number): string;

/**
 * Format per-file downloaded bytes for the progress column.
 */
declare function formatProgress(downloaded: number, _total: number, colDownloaded?: number): string;

/**
 * Pad a pre-formatted speed string to COL_SPEED.
 */
declare function formatSpeed(speed: string, colSpeed?: number): string;

/**
 * Convert bytes/second to a compact display string (KB or MB, no label for MB).
 */
declare function formatSpeedDisplay(bytesPerSecond: number): string;

/**
 * Format total file size for display (MB/GB, 1 decimal).
 */
declare function formatTotalDisplay(total: number, colTotal?: number): string;

/**
 * Format total aggregate speed, padded to COL_SPEED.
 */
declare function formatTotalSpeed(bytesPerSecond: number, colSpeed?: number): string;

/** Derive a local filename from a URL pathname. */
export declare function generateFilename(url: string): string;

/** Extract the file extension from a URL pathname. */
export declare function getFileExtension(url: string): string;

/** Pick a random bar fill color. */
declare function getRandomBarColor(): string;

/** Pick a random bar glue color. */
declare function getRandomBarGlueColor(): string;

/**
 * Return a random spinner type name.
 */
declare function getRandomSpinner(): string;

/**
 * Return the frame array for a given spinner type.
 * Falls back to dots if the type is not found.
 */
declare function getSpinnerFrames(spinnerType: string): string[];

/**
 * Measure the visual (terminal) width of a spinner frame, accounting for wide emoji.
 */
declare function getSpinnerWidth(frame: string): number;

/**
 * Detect whether a URL points to a file download (has a file extension).
 * @param url - The URL string to inspect
 */
export declare function isFileUrl(url: string): boolean;

/** Check whether a string is a valid URL. */
export declare function isValidUrl(url: string): boolean;

export declare class MultiColorFileDownloaderCLI {
    progressBar: any;
    multiBar: any;
    loadingSpinner: any;
    abortController: AbortController | null;
    abortControllers: AbortController[];
    isPaused: boolean;
    pauseCallback: (() => void) | null;
    resumeCallback: (() => void) | null;
    isAddingUrl: boolean;
    stateDir: string;
    readonly COL_FILENAME = 25;
    readonly COL_SPINNER = 2;
    readonly COL_BAR = 15;
    readonly COL_PERCENT = 4;
    readonly COL_DOWNLOADED = 16;
    readonly COL_TOTAL = 10;
    readonly COL_SPEED = 10;
    readonly COL_ETA = 10;
    readonly colors: {
        primary: ChalkInstance;
        success: ChalkInstance;
        warning: ChalkInstance;
        error: ChalkInstance;
        info: ChalkInstance;
        purple: ChalkInstance;
        pink: ChalkInstance;
        yellow: ChalkInstance;
        cyan: ChalkInstance;
        green: ChalkInstance;
        red: ChalkInstance;
        gradient: ChalkInstance[];
    };
    formatBytes: typeof formatBytes;
    formatBytesCompact: typeof formatBytesCompact;
    formatTotalDisplay: typeof formatTotalDisplay;
    formatTotal: typeof formatTotalDisplay;
    formatETA: typeof formatETA;
    formatMasterProgress: typeof formatMasterProgress;
    formatProgress: typeof formatProgress;
    formatSpeed: typeof formatSpeed;
    formatSpeedDisplay: typeof formatSpeedDisplay;
    formatTotalSpeed: typeof formatTotalSpeed;
    truncateFilename: typeof truncateFilename;
    getSpinnerFrames: typeof getSpinnerFrames;
    getRandomSpinner: typeof getRandomSpinner;
    getRandomOraSpinner: typeof getRandomSpinner;
    getSpinnerWidth: typeof getSpinnerWidth;
    calculateBarSize: typeof calculateBarSize;
    getRandomBarColor: typeof getRandomBarColor;
    getRandomBarGlueColor: typeof getRandomBarGlueColor;
    isValidUrl: typeof isValidUrl;
    generateFilename: typeof generateFilename;
    getFileExtension: typeof getFileExtension;
    getRandomColor(): ChalkInstance;
    constructor();
    setPauseCallback(cb: () => void): void;
    setResumeCallback(cb: () => void): void;
    pauseAll(): void;
    resumeAll(): void;
    cleanup(): void;
    setupGlobalKeyboardListener(): void;
    downloadFile(url: string, outputPath: string): Promise<void>;
    downloadMultipleFiles(downloads: Download[]): Promise<void>;
    downloadSingleFileWithBar(fileBar: any, masterBar: any, _n: number, tracking: TotalTracking): Promise<void>;
    addToMultipleDownloads(url: string, outputPath: string, filename: string): Promise<void>;
}

declare interface TotalTracking {
    totalDownloaded: number;
    totalSize: number;
    individualSpeeds: number[];
    individualSizes: number[];
    individualDownloaded: number[];
    individualStartTimes: number[];
    lastTotalUpdate: number;
    lastTotalDownloaded: number;
    actualTotalSize: number;
}

/**
 * Truncate a filename to `maxLength` characters, preserving extension.
 */
declare function truncateFilename(filename: string, maxLength?: number): string;

export { }

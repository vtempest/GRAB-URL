/**
 * Created archive result.
 */
export declare interface ArchiveFile {
    /** Archive Blob */
    blob: Blob;
    /** MIME for response */
    mime: string;
    /** Suggested download name */
    downloadName: string;
}

/**
 * Create a ZIP archive from files array.
 * @param options - Create configuration
 * @param options.files - Array of {path, content} pairs
 * @param options.outputName - Archive filename (e.g., 'out.zip')
 * @param options.compressionLevel - 1-9 (defaults 6)
 * @returns Blob of archive
 */
export declare function compress(options: CreateOptions): Promise<ArchiveFile>;

/**
 * Options for compress().
 */
export declare interface CreateOptions {
    /** Files to pack: path/content pairs */
    files: Array<{
        path: string;
        content: string | Uint8Array | ArrayBuffer | Blob;
    }>;
    /** Output filename (.zip) */
    outputName: string;
    /** Compression level 1-9 (default 6) */
    compressionLevel?: number;
}

/**
 * Extract files from a ZIP ArrayBuffer.
 * @param options - Extract configuration
 * @param options.archiveBuffer - The archive to extract (ArrayBuffer)
 * @param options.folderPath - Folder to extract (e.g., 'src/'), empty=root
 * @param options.password - Optional password (not supported by JSZip - throws if provided)
 * @returns Array of extracted files
 */
export declare function extract(options: {
    archiveBuffer: ArrayBuffer;
    folderPath?: string;
    password?: string;
}): Promise<ExtractEvent[]>;

/**
 * Extracted file info.
 */
export declare interface ExtractEvent {
    /** Relative path */
    path: string;
    /** Size in bytes */
    size: number;
    /** Content (text or base64 binary) */
    content: string;
    /** MIME type */
    mime: string;
}

export { }

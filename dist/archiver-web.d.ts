export declare type ArchiveCompression = "NONE" | "GZIP" | "BZIP2" | "LZMA" | "XZ";

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

export declare type ArchiveFormat = "ZIP" | "USTAR" | "_7ZIP" | "RAW" | "XAR" | "CPIO_NEWC";

/**
 * Create archive from files array.
 * @param options - Create configuration
 * @param options.files - Array of {path: string, content: string|Uint8Array|ArrayBuffer|Blob}
 * @param options.outputName - Archive filename (e.g., 'out.tar.gz')
 * @param options.format - Archive format (defaults USTAR)
 * @param options.compression - Compression (defaults NONE)
 * @param options.compressionLevel - 1-9 (defaults 6, format-dependent)
 * @param options.passphrase - Optional password
 * @returns Blob of archive (download/save as)
 * @throws Error on invalid options
 */
export declare function compress(options: CreateOptions): Promise<ArchiveFile>;

/**
 * Options for createArchive.
 */
export declare interface CreateOptions {
    /** Files to pack: path/content pairs */
    files: Array<{
        path: string;
        content: string | Uint8Array | ArrayBuffer | Blob;
    }>;
    /** Output filename (.tar.gz etc.) */
    outputName: string;
    /** Archive format */
    format?: ArchiveFormat;
    /** Compression type */
    compression?: ArchiveCompression;
    /** Compression level 1-9 */
    compressionLevel?: number;
    /** Password */
    passphrase?: string;
}

/**
 * Extract files from an archive ArrayBuffer.
 * @param options - Extract configuration
 * @param options.archiveBuffer - The archive to extract (ArrayBuffer)
 * @param options.folderPath - Folder to extract (e.g., 'src/'), empty=root
 * @param options.password - Optional password
 * @returns Array of extracted files
 * @throws Error on unsupported format
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

/* Excluded from this release type: _setArchiveClass */

export { }

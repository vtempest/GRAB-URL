
/*
 * libarchive.js compression types
 */
export type ArchiveFormat = "ZIP" | "USTAR" | "_7ZIP" | "RAW" | "XAR" | "CPIO_NEWC";

export type ArchiveCompression = "NONE" | "GZIP" | "BZIP2" | "LZMA" | "XZ";

/**
 * Extracted file info.
 */
export interface ExtractEvent {
  /** Relative path */
  path: string;
  /** Size in bytes */
  size: number;
  /** Content (text or base64 binary) */
  content: string;
  /** MIME type */
  mime: string;
}

/**
 * Options for createArchive.
 */
export interface CreateOptions {
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
 * Created archive result.
 */
export interface ArchiveFile {
  /** Archive Blob */
  blob: Blob;
  /** MIME for response */
  mime: string;
  /** Suggested download name */
  downloadName: string;
}

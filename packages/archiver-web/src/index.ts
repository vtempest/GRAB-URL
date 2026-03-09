/**
 * Universal Archive Extractor & Creator using JSZip (pure JS).
 * Supports ZIP format. Works in Node.js and browser with no WASM/workers.
 * @module archiveUtils
 * @example
 * const files = await extract({ archiveBuffer: buf, folderPath: 'src/' });
 * const archiveBlob = await compress({ files: [...], outputName: 'out.zip' });
 */

import JSZip from "jszip";

import type {
  ExtractEvent,
  CreateOptions,
  ArchiveFile,
} from "./types.js";

/**
 * Extract files from a ZIP ArrayBuffer.
 * @param options - Extract configuration
 * @param options.archiveBuffer - The archive to extract (ArrayBuffer)
 * @param options.folderPath - Folder to extract (e.g., 'src/'), empty=root
 * @param options.password - Optional password (not supported by JSZip - throws if provided)
 * @returns Array of extracted files
 */
export async function extract(options: {
  archiveBuffer: ArrayBuffer;
  folderPath?: string;
  password?: string;
}): Promise<ExtractEvent[]> {
  const { archiveBuffer, folderPath = "", password } = options;

  if (!archiveBuffer) {
    throw new Error("Must provide archiveBuffer");
  }

  if (password) {
    throw new Error("Password-protected archives are not supported");
  }

  const zip = await JSZip.loadAsync(archiveBuffer);
  const files: ExtractEvent[] = [];

  for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
    if (zipEntry.dir) continue;

    if (folderPath && !relativePath.startsWith(folderPath)) continue;

    const strippedPath = folderPath
      ? relativePath.slice(folderPath.length).replace(/^\//, "")
      : relativePath;

    if (!strippedPath) continue;

    let content: string;
    const data = await zipEntry.async("uint8array");
    const size = data.byteLength;

    try {
      content = await zipEntry.async("text");
    } catch {
      content = btoa(String.fromCharCode(...data));
    }

    files.push({ path: strippedPath, size, content, mime: "application/octet-stream" });
  }

  return files;
}

/**
 * Create a ZIP archive from files array.
 * @param options - Create configuration
 * @param options.files - Array of {path, content} pairs
 * @param options.outputName - Archive filename (e.g., 'out.zip')
 * @param options.compressionLevel - 1-9 (defaults 6)
 * @returns Blob of archive
 */
export async function compress(options: CreateOptions): Promise<ArchiveFile> {
  const {
    files,
    outputName,
    compressionLevel = 6,
  } = options;

  const zip = new JSZip();

  for (const { path, content } of files) {
    let data: string | Uint8Array | ArrayBuffer | Blob;
    if (typeof content === "string") {
      data = content;
    } else if (content instanceof Uint8Array) {
      data = content;
    } else if (content instanceof ArrayBuffer) {
      data = new Uint8Array(content);
    } else if (content instanceof Blob) {
      data = await content.arrayBuffer().then((b) => new Uint8Array(b));
    } else {
      throw new Error(`Unsupported content type for ${path}`);
    }
    zip.file(path, data);
  }

  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: compressionLevel },
  });

  return {
    blob,
    mime: "application/zip",
    downloadName: outputName,
  };
}

export type { ExtractEvent, CreateOptions, ArchiveFile };

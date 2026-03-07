/**
 * Universal Archive Extractor & Creator using libarchive.js (WASM).
 * Supports: ZIP/7z/RAR4/5/TAR + GZIP/BZIP2/LZMA. Node.js/browser.
 * No streaming extract (full download first). Create archives from files.
 * @module archiveUtils
 * @example
 * const files = await extractFolder({ archiveUrl: 'https://ex.zip', folderPath: 'src/' });
 * const archiveBlob = await createArchive({ files: [...], outputName: 'out.tar.gz' });
 */


let ArchiveClass: any = null;

/** @internal For testing: inject a mock Archive class. */
export function _setArchiveClass(cls: any) {
  ArchiveClass = cls;
}

async function ensureLibarchiveNode(): Promise<boolean> {
  // Skip in Cloudflare Workers
  if (typeof navigator !== 'undefined' && navigator.userAgent === 'Cloudflare-Workers') {
    return false;
  }

  // Check if already installed (silent resolve)
  try {
    require.resolve('libarchive.js');
    return true;
  } catch {}

  // Lazy load child_process and install globally
  let spawn: typeof import('child_process').spawn;
  try {
    const { spawn } = await import('node:child_process');
    await new Promise<void>((resolve) => {
      const proc = spawn('npm', ['i', '-g', 'libarchive.js'], { stdio: 'ignore' });
      proc.on('close', () => resolve());
      proc.on('error', () => resolve()); // npm unavailable: silent fail
    });
    return true;
  } catch {
    return false; // Silent fail if spawn/import fails
  }
}

async function getArchive() {
  if (ArchiveClass) return ArchiveClass;

  if (typeof process !== 'undefined' && process?.versions?.node) {
    const installed = await ensureLibarchiveNode();
    if (!installed) {
      console.error('libarchive.js not available (install failed). Use browser fallback or manual npm i -g libarchive.js.');
      throw new Error('libarchive.js Node.js unavailable');
    }
    const mod = await import('libarchive.js/dist/libarchive-node.mjs');
    ArchiveClass = mod.Archive;
  } else {
    const mod = await import('libarchive.js/main.js');
    ArchiveClass = mod.Archive;
    ArchiveClass.init({
      workerUrl: 'libarchive.js/dist/worker-bundle.js'
    });
  }
  return ArchiveClass;
}


import type { ExtractEvent, 
  ArchiveCompression,
  ArchiveFormat,
  CreateOptions, 
  ArchiveFile } from "./types.js";

/**
 * Extract files from an archive ArrayBuffer.
 * @param options - Extract configuration
 * @param options.archiveBuffer - The archive to extract (ArrayBuffer)
 * @param options.folderPath - Folder to extract (e.g., 'src/'), empty=root
 * @param options.password - Optional password
 * @returns Array of extracted files
 * @throws Error on unsupported format
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
  const blob = new Blob([new Uint8Array(archiveBuffer)]);

  /** Open with libarchive.js */
  const Archive = await getArchive();
  const archive = await Archive.open(blob as File);
  if (password) await archive.usePassword(password);

  /** Get file tree */
  const filesObj = await archive.getFilesObject();
  const files: ExtractEvent[] = [];

  /**
   * Recursively walk file tree, filter by folderPath, extract matching files.
   * @param obj - Nested file/dir object
   * @param prefix - Current path prefix
   */
  const walker = async (obj: any, prefix: string = ""): Promise<void> => {
    for (const [name, entry] of Object.entries(obj)) {
      const fullPath = prefix ? `${prefix}/${name}` : name;
      if (fullPath.startsWith(folderPath) && !fullPath.endsWith("/")) {
        const relativePath = fullPath
          .slice(folderPath.length)
          .replace(/^\//, "");
        const fileBlob = await (entry as any).extract();
        let content: string;
        try {
          content = await fileBlob.text();
        } catch {
          const buffer = await fileBlob.arrayBuffer();
          content = btoa(String.fromCharCode(...new Uint8Array(buffer))); // Base64 binary
        }
        files.push({
          path: relativePath,
          size: fileBlob.size,
          content,
          mime: fileBlob.type || "application/octet-stream",
        });
      }
      if (typeof entry === 'object' && !(entry as any)?.extract) {
        // Subdir (directories don't have .extract, files do)
        await walker(entry, fullPath);
      }
    }
  };

  await walker(filesObj);
  return files;
}



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
export async function compress(
  options: CreateOptions,
): Promise<ArchiveFile> {
  const {
    files,
    outputName,
    format = "USTAR",
    compression = "NONE",
    compressionLevel = 6,
    passphrase,
  } = options;

  /** Convert files to Blobs with pathnames */
  const archiveFiles: { file: Blob; pathname: string }[] = files.map(
    ({ path, content }) => {
      let blobContent: Blob;
      if (typeof content === "string") {
        blobContent = new Blob([content]);
      } else if (content instanceof Uint8Array) {
        blobContent = new Blob([content as BlobPart]);
      } else if (content instanceof ArrayBuffer) {
        blobContent = new Blob([content]);
      } else if (content instanceof Blob) {
        blobContent = content;
      } else {
        throw new Error(`Unsupported content type for ${path}`);
      }
      return { file: blobContent, pathname: path };
    },
  );

  /** Create archive */
  const Archive = await getArchive();
  //@ts-ignore
  const archiveBlob = await Archive.write({
    files: archiveFiles,
    outputFileName: outputName,
    compression,
    format,
    compressionLevel, // Passed if supported
    passphrase: passphrase || null,
  });

  return {
    blob: archiveBlob,
    mime: "application/zip", // Adjust per format
    downloadName: outputName,
  };
}

export type { ArchiveFormat, ArchiveCompression };
export type { ExtractEvent, CreateOptions, ArchiveFile };

# archiver-web

Universal archive **extractor and creator** for the web. TypeScript, frontend-friendly, uses [JSZip](https://stuk.github.io/jszip/) under the hood and runs in Node.js, the browser, Cloudflare Workers, and the CLI.

```bash
npm i archiver-web
```

## Quick Start

**Extract a folder out of a remote archive:**

```ts
import { extractFolder } from "archiver-web";

const files = await extractFolder({
  archiveUrl: "https://github.com/user/repo/archive/main.zip",
  folderPath: "src/",
});
// [{ path: 'main.ts', size: 2048, content: '...', mime: 'text/typescript' }]
```

**Create an archive from in-memory files:**

```ts
import { createArchive, ArchiveCompression, ArchiveFormat } from "archiver-web";

const archive = await createArchive({
  files: [{ path: "hello.txt", content: "World!" }],
  outputName: "out.tar.gz",
  compression: ArchiveCompression.GZIP,
});
```

## Format Comparison

| Format      | Compression | Speed      | Size       | % Reduction (10MB) | Use Case         |
| ----------- | ----------- | ---------- | ---------- | ------------------ | ---------------- |
| **ZIP**     | Deflate 1-9 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | **79%**            | Web/distribution |
| **7z**      | LZMA 1-9    | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | **88%**            | Max compression  |
| **TAR.GZ**  | GZIP 1-9    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | **72%**            | Linux/fast       |
| **TAR.BZ2** | BZIP2 1-9   | ⭐⭐       | ⭐⭐⭐⭐   | **82%**            | Medium Unix      |
| **TAR**     | None        | ⭐⭐⭐⭐⭐ | ⭐         | **0%**             | Bundling         |

## API

```ts
// Extract a folder (or single file path) out of a remote archive
extractFolder({
  archiveUrl: string,
  folderPath?: string,
  password?: string,
});

// Create an archive from a list of files
createArchive({
  files: Array<{ path: string; content: string | Uint8Array | Blob }>,
  outputName: string,
  format?: ArchiveFormat,
  compression?: ArchiveCompression,
  compressionLevel?: 1 | 3 | 6 | 9, // 1 = fastest, 9 = best
});
```

## Usage Recipes

```ts
// Extract just the React `packages/react` source from upstream
const reactSrc = await extractFolder({
  archiveUrl: "https://github.com/facebook/react/archive/main.zip",
  folderPath: "react-*/packages/react",
});

// Repackage it as 7z at max compression
const tiny7z = await createArchive({
  files: reactSrc,
  outputName: "react.7z",
  compression: ArchiveCompression.LZMA,
  compressionLevel: 9, // ~88% reduction
});
```

## CLI

The package exposes two bins for one-off use:

```bash
npx extract <archiveUrl> [folderPath]
npx compress <inputDir> <outputName>
```

## Development

```bash
bun install
bun run build     # vite build
bun test          # tsx test.ts
```

## License

MIT

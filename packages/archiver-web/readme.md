# Universal Archive Extractor & Creator for Web

TypeScript library using **libarchive.js (WASM)** for ZIP/7z/RAR/TAR.GZ extract/create with folder filtering and compression. Works in Node.js/browser/Cloudflare/CLI.

## 🚀 Quick Start

```bash
npm i archiver-web
```

**Extract folder:**

```typescript
import { extractFolder } from "archiver-web";

const files = await extractFolder({
  archiveUrl: "https://github.com/user/repo/archive/main.zip",
  folderPath: "src/",
});
// [{ path: 'main.ts', size: 2048, content: '...', mime: 'text/typescript' }]
```

**Create archive:**

```typescript
import { createArchive, ArchiveCompression, ArchiveFormat } from "archiver-web";

const archive = await createArchive({
  files: [{ path: "hello.txt", content: "World!" }],
  outputName: "out.tar.gz",
  compression: ArchiveCompression.GZIP,
});
```

## 📊 Format Comparison

| Format      | Compression | Speed      | Size       | % Reduction (10MB) | Use Case         |
| ----------- | ----------- | ---------- | ---------- | ------------------ | ---------------- |
| **ZIP**     | Deflate 1-9 | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐   | **79%**            | Web/distribution |
| **7z**      | LZMA 1-9    | ⭐⭐⭐     | ⭐⭐⭐⭐⭐ | **88%**            | Max compression  |
| **TAR.GZ**  | GZIP 1-9    | ⭐⭐⭐⭐⭐ | ⭐⭐⭐     | **72%**            | Linux/fast       |
| **TAR.BZ2** | BZIP2 1-9   | ⭐⭐       | ⭐⭐⭐⭐   | **82%**            | Medium Unix      |
| **TAR**     | None        | ⭐⭐⭐⭐⭐ | ⭐         | **0%**             | Bundling         |

## 📖 API

```typescript
// Extract
extractFolder({ archiveUrl: string, folderPath?: string, password?: string })

// Create
createArchive({
  files: Array<{path: string, content: string|Uint8Array|Blob}>,
  outputName: string,
  format?: ArchiveFormat,
  compression?: ArchiveCompression,
  compressionLevel?: 1|3|6|9  // Fastest=1, Best=9
})
```

## 💾 Usage

```typescript
// Extract React src only
const reactSrc = await extractFolder({
  archiveUrl: "https://github.com/facebook/react/archive/main.zip",
  folderPath: "react-*/packages/react",
});

// Repackage as 7z (max compression)
const tiny7z = await createArchive({
  files: reactSrc,
  outputName: "react.7z",
  compression: ArchiveCompression.LZMA,
  compressionLevel: 9, // 88% reduction
});
```

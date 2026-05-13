# @grab-url/cli

CLI front end for [`grab-url`](https://grab.js.org). Fetches API responses or downloads files — auto-detecting which mode to use based on the URL — with colored multi-file progress bars, resumable transfers, and keyboard controls.

```bash
npx grab-url <url> [options]
```

## Examples

```bash
# Fetch JSON/text from an API and save to output.json
npx grab-url https://api.example.com/data

# Download a file
npx grab-url https://releases.ubuntu.com/24.04.2/ubuntu-24.04.2-live-server-amd64.iso

# Download multiple files concurrently
npx grab-url https://example.com/file1.zip https://example.com/file2.zip

# Save the first URL to a custom filename
npx grab-url https://example.com/file.iso -o ubuntu.iso

# Pass query params as JSON
npx grab-url https://api.example.com/search -p '{"q":"hello","limit":10}'

# Print to stdout instead of writing a file
npx grab-url https://api.example.com/data --no-save
```

## Options

| Flag                | Alias | Type    | Description                                                                |
| ------------------- | ----- | ------- | -------------------------------------------------------------------------- |
| `--output <file>`   | `-o`  | string  | Output filename (default: `output.json` for APIs, derived from URL for files) |
| `--params <json>`   | `-p`  | string  | JSON string of query parameters, e.g. `'{"key":"value"}'`                 |
| `--no-save`         |       | boolean | Don't save output to a file — just print to console                       |
| `--help`            | `-h`  |         | Show help                                                                  |
| `--version`         |       |         | Show version                                                               |

The CLI auto-detects **download mode** when more than one URL is passed or any URL looks like a file. Otherwise it runs in **API mode** and tries to parse JSON.

## Programmatic API

The package also exports its primitives so you can embed the downloader in your own scripts:

```ts
import {
  MultiColorFileDownloaderCLI,
  ArgParser,
  isFileUrl,
  isValidUrl,
  generateFilename,
  getFileExtension,
} from "@grab-url/cli";

const downloader = new MultiColorFileDownloaderCLI();
await downloader.downloadMultipleFiles([
  { url: "https://example.com/a.zip", outputPath: "./a.zip", filename: "a.zip" },
  { url: "https://example.com/b.zip", outputPath: "./b.zip", filename: "b.zip" },
]);
```

## What's in this package

| File / Folder                                   | Purpose                                                            |
| ----------------------------------------------- | ------------------------------------------------------------------ |
| [index.ts](index.ts)                            | CLI entry point — argv parsing, mode detection, dispatch           |
| [cli-args.ts](cli-args.ts)                      | Minimal `ArgParser` (yargs-like) and `isFileUrl` detection          |
| [file-downloader.ts](file-downloader.ts)        | `MultiColorFileDownloaderCLI` — concurrent download orchestrator    |
| [keyboard-controls.ts](keyboard-controls.ts)    | Pause / resume / cancel keybindings while downloads run            |
| [download-spinners.ts](download-spinners.ts)    | Spinner frames used by progress bars                               |
| [display/](display/)                            | Progress bar formatting and spinner configuration                  |
| [transfer/](transfer/)                          | Single-file & multi-file transfer engines plus resume-state logic  |

## Dependencies

- [`chalk`](https://github.com/chalk/chalk) — terminal colors
- [`cli-progress`](https://github.com/npkgz/cli-progress) — multi-bar progress UI
- [`cli-table3`](https://github.com/cli-table/cli-table3) — final stats table
- [`@grab-url/loading-animations`](../loading-animations) — spinner frame data

## License

MIT

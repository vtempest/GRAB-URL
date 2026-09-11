# Architecture Overview

A monorepo in layout, a **single published package** in practice. `packages/*`
are source modules; one Vite build at the repo root compiles them into the
`grab-url` package's `dist/`, and the root `package.json` exposes them as
subpath exports.

## What ships

`grab-url`, version-pinned at the repo root, with these public entries:

| Import | Built from | What it is |
| --- | --- | --- |
| `grab-url` | `packages/grab-api/src/index.ts` | The HTTP client: caching, retries, rate limiting, request dedupe, mock support |
| `grab-url/slim` | `packages/grab-api/src/index.slim.ts` | The same client with the heavy dependencies externalized |
| `grab-url/animations` | `packages/loading-animations/src/svg/index.ts` | Tree-shakable SVG spinners |
| `grab-url/icons/quantum-sphere` | `packages/quantum-sphere-loading-animation/src/icons.ts` | The React orbital loader |
| `grab-url/log` | `packages/log-json/src/log-json.ts` | JSON logger |
| `grab-url/cli` | `packages/grab-url-cli/src/index.ts` | The CLI, also installed as the `grab-url`, `grab` and `g` bins |

Plus three more build entries that back the archive tooling: `archiver-web`,
`bin-extract`, `bin-compress`.

## Source packages

| Package | npm name | Published? |
| --- | --- | --- |
| `grab-api` | `@grab-url/grab-api` | **No** — bundled into `grab-url` |
| `grab-url-cli` | `@grab-url/cli` | **No** — bundled |
| `log-json` | `@grab-url/log` | **No** — bundled |
| `api2client` | `api2client` | Yes |
| `archiver-web` | `archiver-web` | Yes |
| `loading-animations` | `loading-animations` | Yes |
| `quantum-sphere-loading-animation` | `quantum-sphere-loading-icon` | Yes |
| `native-app-wrapper` | `native-app-wrapper` | No — **and excluded from the workspace globs** |

So there are two kinds of directory under `packages/`: internals that only exist
to be bundled, and packages that publish in their own right *and* get bundled
into a `grab-url` entry. Know which one you are in before you reason about how a
consumer receives your change.

## Other top-level directories

| Directory | What it is |
| --- | --- |
| `test/` | **All the tests.** Vitest, run through the root `vite.config.ts`. |
| `grab-help-docs/` | The Fumadocs documentation site, deployed to GitHub Pages. A workspace. |
| `skills/use-grab-request/` | The agent skill — the source of truth for the docs page about it |
| `examples/` | Runnable examples: basic request, cookbook, reactive React/Svelte/Vue, api2client |
| `scripts/` | `install-yt-dlp.mjs` (postinstall), `sync-skill-docs.mjs` |
| `docs/` | A GitHub Pages Jekyll stub — `_config.yml` plus an `index.html` redirect. No documentation; see [documentation.md](documentation.md), which also explains why it is what breaks the Vercel deploy. |
| `dist/` | Build output. Generated; never hand-edited, never a source of truth. |

## Optional peers, loaded at runtime

`grab-url` declares `react`, `react-dom` and **`extract-webpage`** as optional
peer dependencies. `extract-webpage` is the qwksearch content extractor behind
`grab-url --page`; it is loaded through a runtime `import()` and drags in
jsdom/linkedom, so it is externalized and **must never enter the CLI bundle**.
The same applies to React for the quantum-sphere entry — see
[build.md](build.md).

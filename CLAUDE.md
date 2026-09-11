# CLAUDE.md — GRAB-URL

Orientation for Claude agents working in this repository. Read this first; the
detailed notes live in [`.claude/architecture/`](.claude/architecture/) and are
linked from each section below.

`grab-url` ("Generate Request to API from Browser") is one npm package with
several subpath entries — an HTTP client with caching, retries, rate limiting
and request dedupe; a download/archive CLI; loading animations; and a JSON
logger. The repo is a monorepo in layout only: **`packages/*` are source
modules, and one Vite build at the root bundles them all into a single
published `dist/`.**

## Ground rules

1. **npm, not bun or pnpm.** `packageManager` pins `npm@11.19.1` and CI runs
   `npm install` / `npm ci` against `package-lock.json`. A `pnpm-workspace.yaml`
   exists for pnpm compatibility, but there is no pnpm lockfile — do not switch
   package managers or commit a second lockfile.
2. **There is no root `src/`.** All source lives under `packages/*/src`, and the
   published entry points are built from there. See
   [`architecture/build.md`](.claude/architecture/build.md).
3. **Most `packages/*` are private internals**, not separately published
   packages. `@grab-url/grab-api`, `@grab-url/cli` and `@grab-url/log` are
   compiled *into* `grab-url`. See
   [`architecture/monorepo.md`](.claude/architecture/monorepo.md).
4. **Changing `vite.config.ts` is changing the product.** Externals, aliases,
   the `"use client"` restoration and the CLI shebang banner each exist because
   something broke without them. Read the comments before touching it.
5. **Tests live in the root `test/` folder**, run by Vitest through the same
   `vite.config.ts`. Coverage counts `packages/**/src/**`.
6. **`postinstall` downloads yt-dlp** (`scripts/install-yt-dlp.mjs`). An install
   that "hangs" is usually that.
7. **Never commit secrets** or build output. `dist/` is generated.

## Where things live

| You want to change… | Go to |
| --- | --- |
| The HTTP client, caching, retries, dedupe | `packages/grab-api` |
| The `grab` / `grab-url` CLI | `packages/grab-url-cli` |
| Archive extract/create | `packages/archiver-web` |
| SVG + terminal loading spinners | `packages/loading-animations` |
| The React/Svelte orbital loader | `packages/quantum-sphere-loading-animation` |
| JSON logging | `packages/log-json` |
| The Hey API client adapter | `packages/api2client` |
| Documentation | `grab-help-docs` |
| The agent skill | `skills/use-grab-request` |
| Build entries, externals, bundling | `vite.config.ts` |

Full map: [`architecture/overview.md`](.claude/architecture/overview.md).

## Commands

```bash
npm install                    # not bun, not pnpm
npm run build                  # vite build — produces every dist entry
npm run make                   # icons → skill docs → help docs → build
npm run test                   # vitest
npm run test:coverage
npm run test:cli               # a real end-to-end CLI download
```

## Before you open a PR

- Run `npm run test:coverage` — that is what CI runs.
- Run `npm run build` if you touched anything under `packages/*/src` or
  `vite.config.ts`, and check the entry you changed actually appears in `dist/`.
- If you changed the CLI's public behaviour, update
  `skills/use-grab-request/SKILL.md` and run `npm run make:skill` — the docs
  page is generated from the skill.
- Target `master`. Keep the PR focused; no drive-by refactors.

## Detailed notes

| Note | Covers |
| --- | --- |
| [overview.md](.claude/architecture/overview.md) | What ships, every entry point, every source package |
| [build.md](.claude/architecture/build.md) | The one Vite build: entries, externals, aliases, and the hacks that must not be removed |
| [monorepo.md](.claude/architecture/monorepo.md) | Workspaces, npm vs pnpm, which packages actually publish, tests |
| [documentation.md](.claude/architecture/documentation.md) | `grab-help-docs`, the generated skill page, the Pages deploy |
| [conventions.md](.claude/architecture/conventions.md) | Code style, commits, PRs, CI, publishing, security |

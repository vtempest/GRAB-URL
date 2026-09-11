# The Build

One `vite build` at the repo root produces every published entry. `vite.config.ts`
is therefore the most consequential file in the repo: it is the packaging, the
module boundaries and the runtime contract all at once.

Its comments record real production failures. Read them before editing, and do
not remove any of the following.

## Aliases: how `packages/*` resolve

```ts
"@grab-url/log"      → packages/log-json/src/log-json.ts
"@grab-url/grab-api" → packages/grab-api/src/index.ts
"grab-url"           → packages/grab-api/src/index.ts
```

That last one matters: the Hey API client imports the **published package
name**, and inside the monorepo it has to resolve to the same source. Without
it you get two copies of the client in one bundle.

## Externals — three separate reasons

| Externalized | Why |
| --- | --- |
| Node builtins (`node:*` and a long explicit list) | The library runs in browsers too |
| `chalk`, `cli-table3`, `cli-progress`, `cli-spinners` | CLI-only deps, kept out of library bundles |
| **`extract-webpage`** | The optional peer behind `grab-url --page`. It is loaded via runtime `import()` and pulls in jsdom/linkedom. **Bundling it would drag a DOM implementation into the CLI.** |
| **`react`, `react-dom`, `react/jsx-runtime`, `react/jsx-dev-runtime`** | A second React copy makes every hook in `QuantumOrbital` throw *"Invalid hook call"*. No other entry imports React, so this costs nothing elsewhere. |
| `jszip` | Heavy; the archive tooling's caller provides it |
| `archiver-web`, `linkedom` — **slim entry only** | The point of `grab-url/slim`: the same client without the heavy deps. Externalized only when the importer is `index.slim`. |

## The two output hacks

Both exist because the obvious approach silently fails.

**1. `"use client"` on the quantum-sphere bundles.** Rollup drops the source
file's module-level directive when bundling, and a `banner` does not survive
either — terser re-parses the chunk afterwards and discards a directive it reads
as dead code in an ES module. Writing it in `generateBundle`, which runs *after*
minification, is the one point where it sticks. Without it, a React Server
Component importing the sphere fails on the first hook.

**2. The shebang banner.** `rollupOptions.output.banner` adds
`#!/usr/bin/env node` to `grab-url-cli` and any `bin-*` chunk. The bins in
`package.json` point at these files directly; without the shebang they are not
executable.

Also note `inlineDynamicImports: false` — the runtime `import()` of
`extract-webpage` depends on dynamic imports staying dynamic.

## Output shape

- Formats: **ES and CJS**, named `<entry>.<format>.js`.
- Target `es2022`, minified with **terser**, sourcemaps on.
- Types via `vite-plugin-dts` over `packages/**/*.ts(x)`, excluding the
  quantum-sphere Svelte, demo and dist directories.

## After changing the build

```bash
npm run build
ls dist/          # the entry you touched must be there, in both formats
```

A missing or renamed `dist` file is a broken `exports` map, which consumers hit
at import time and no test here will catch.

## `npm run make`

The full pipeline, in order:

```
make:icons  → export-svg-typescript over packages/loading-animations/src/svg
make:skill  → scripts/sync-skill-docs.mjs   (skill → docs page)
make:docs   → turbo build --filter=grab-help-docs
build       → vite build
```

Use it when you changed icons, the skill or the docs — `npm run build` alone
skips all three.

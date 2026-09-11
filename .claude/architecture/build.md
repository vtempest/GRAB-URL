# The Build

Everything published comes from **one** Vite build at the repo root. There is no
per-package build step, and `packages/*/package.json` files are mostly metadata —
editing one does not change what ships.

```bash
npm run build      # vite build --config vite.config.ts → dist/
npm run make       # icons → skill docs → docs site → build
```

`npm run make` is the full refresh:

1. `make:icons` — regenerates `packages/loading-animations/src/svg/index.ts` from
   the SVG files with `export-svg-typescript`.
2. `make:skill` — regenerates `grab-help-docs/content/docs/claude-skill.mdx` from
   `skills/use-grab-request/SKILL.md`.
3. `make:docs` — `turbo run build --filter=grab-help-docs`.
4. `build` — the library bundle.

## Entries

Each key becomes `dist/<name>.{es,cjs}.js` plus a `.d.ts`, and is wired into
`package.json`'s `exports`:

| Entry | From | Exposed as |
| --- | --- | --- |
| `grab-api` | `packages/grab-api/src/index.ts` | `grab-url` |
| `grab-api-slim` | `…/index.slim.ts` | `grab-url/slim` |
| `animations` | `packages/loading-animations/src/svg/index.ts` | `grab-url/animations` |
| `quantum-sphere` | `packages/quantum-sphere-loading-animation/src/icons.ts` | `grab-url/icons/quantum-sphere` |
| `log` | `packages/log-json/src/log-json.ts` | `grab-url/log` |
| `grab-url-cli` | `packages/grab-url-cli/src/index.ts` | `grab-url/cli`, and the `grab-url`/`grab`/`g` bins |
| `archiver-web`, `bin-extract`, `bin-compress` | `packages/archiver-web/src/` | `archiver-web` and its bins |

**Adding an entry means editing three places**: `build.lib.entry` in
`vite.config.ts`, `exports` in `package.json`, and `files` if it needs new source
shipped.

## Externals — each one is load-bearing

`rollupOptions.external` is a function, not a list, and every branch is there for
a reason:

- **Node builtins** (`node:*` and the `nodeBuiltins` list) — the CLI is a Node
  program; bundling these breaks it.
- **`extract-webpage`** — the optional peer behind `--page`, loaded by runtime
  `import()`. Bundling it pulls jsdom/linkedom into the CLI.
- **`react`, `react-dom`, the JSX runtimes** — a second React copy makes every
  hook in `QuantumOrbital` throw *Invalid hook call*. Only the sphere imports
  React, so this is a no-op for the other entries.
- **`jszip`** — always external.
- **`archiver-web` and `linkedom`, but only when the importer is `index.slim`** —
  this is what makes the slim build slim. The `importer?.includes("index.slim")`
  check is the whole mechanism.

## Two traps that have already cost a release

**The `"use client"` directive on the quantum-sphere bundles.** Rollup drops the
source file's module-level directive when bundling, and a `banner` does not
survive either — terser re-parses the chunk and discards a directive it reads as
dead code in an ES module. The `useClientDirective` plugin writes it in
`generateBundle`, after minification, which is the one point where it sticks.
Without it, a React Server Component importing the sphere fails on the first
hook. Do not "simplify" that plugin into a banner.

**Shebangs.** `rollupOptions.output.banner` adds `#!/usr/bin/env node` to
`grab-url-cli` and the `bin-*` chunks by name. A renamed entry silently loses its
shebang and the bin stops being executable.

## Aliases

`resolve.alias` maps `@grab-url/log`, `@grab-url/grab-api` **and the published
name `grab-url`** to the in-repo source, so the generated Hey API client — which
imports `grab-url` by package name — resolves to the same source inside the
monorepo as it does for a consumer.

## Tests

Vitest is configured inside `vite.config.ts` (`test.coverage`), with tests in
`test/*.test.ts` and coverage over `packages/**/src/**`.

```bash
npm test                 # watch
npm run test:coverage    # what CI runs
npm run test:cli         # a real end-to-end download
```

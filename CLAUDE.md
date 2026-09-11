# CLAUDE.md — GRAB-URL

Orientation for Claude agents working in this repository. Read this first; the
detailed notes live in [`.claude/architecture/`](.claude/architecture/).

**GRAB — Generate Request to API from Browser.** One `grab()` function with no
runtime dependencies that replaces a request library: auto-JSON, auto-unzip, DOM
parsing, dedupe, retry, timeout, rate limiting, caching, infinite scroll, mocks
and a devtools overlay. Around it: a media-downloading CLI, an OpenAPI client
generator, loading animations, and a Tauri wrapper.

## Ground rules

1. **npm, not bun or yarn.** `packageManager` pins `npm@11.19.1` and CI runs
   `npm install`. The Pages workflow uses `npm ci` deliberately — a floating
   resolve picks an incompatible fumadocs pair. Commit `package-lock.json`.
2. **The published package has one build, from the repo root.** `packages/*` are
   source folders, not independently published packages — `vite.config.ts` at the
   root compiles all of them into one `dist/`. See
   [`architecture/build.md`](.claude/architecture/build.md).
3. **Zero runtime dependencies in `grab-api`.** That is the product claim. Adding
   an import to `packages/grab-api/src/` that is not a Node builtin breaks it.
4. **Documentation goes in the user guide**, `grab-help-docs/content/docs`.
   The root `docs/` folder holds no documentation — it is a vestigial Jekyll stub
   from before GitHub Pages switched to deploying via Actions, and PR #47 removes
   it. Put nothing there, and do not recreate it. See
   [`architecture/documentation.md`](.claude/architecture/documentation.md).
5. **The skill is generated.** `grab-help-docs/content/docs/claude-skill.mdx` is
   written from `skills/use-grab-request/SKILL.md` — edit the skill, then run
   `npm run make:skill`.
6. **`dist/` is never committed.** It is gitignored everywhere and rebuilt on
   demand; npm still ships it, because a `files` whitelist beats `.gitignore`
   and `prepublishOnly` runs the build. The one exception is
   `packages/native-app-wrapper/dist/`, which is hand-written Tauri source, not
   build output. See [`architecture/build.md`](.claude/architecture/build.md).
7. **Never commit secrets**, credentials, or API keys.

## Where things live

| You want to change… | Go to |
| --- | --- |
| The `grab()` request function | `packages/grab-api/src/` |
| The `grab-url` download CLI | `packages/grab-url-cli/src/` |
| ZIP extract/create | `packages/archiver-web/src/` |
| The OpenAPI → client generator | `packages/api2client/` |
| `log()` and the JSON printer | `packages/log-json/src/` |
| SVG / CLI spinners | `packages/loading-animations/src/` |
| The 3D orbital loader | `packages/quantum-sphere-loading-animation/` |
| The Tauri desktop/mobile wrapper | `packages/native-app-wrapper/` (not in the workspace globs) |
| Build entries, externals, bundling | `vite.config.ts` at the root |
| Documentation | `grab-help-docs/content/docs/` |
| The agent skill | `skills/use-grab-request/SKILL.md` |

Full map: [`architecture/overview.md`](.claude/architecture/overview.md).

## Commands

```bash
npm install                 # never bun/yarn
npm run build               # vite build — the whole dist/
npm run make                # icons → skill → docs → build (the full refresh)
npm test                    # vitest
npm run test:coverage       # as CI runs it
npm run test:cli            # a real download, end to end
```

## Before you open a PR

- `npm run test:coverage`, and `npm run build` if you touched anything bundled.
- If you changed the skill, run `npm run make:skill` and commit the regenerated
  docs page; `--check` fails when it is stale.
- Commit style is **gitmoji + conventional commits**:
  `✨ feat(cli): archive a page into a folder with --page`. See
  [`architecture/conventions.md`](.claude/architecture/conventions.md).
- Target `master`. Keep the PR focused.

## Detailed notes

| Note | Covers |
| --- | --- |
| [overview.md](.claude/architecture/overview.md) | What each package does and how a request flows through `grab()` |
| [build.md](.claude/architecture/build.md) | The single root build, entries, externals, and the traps in it |
| [documentation.md](.claude/architecture/documentation.md) | The Fumadocs site, the two deployments, the vestigial root `docs/`, and the broken Vercel setting |
| [conventions.md](.claude/architecture/conventions.md) | Code style, commits, PRs, CI, publishing |

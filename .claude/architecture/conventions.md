# Conventions and General Rules

## Language and style

- TypeScript, ESM (`"type": "module"`) throughout. A few `.mjs` scripts under
  `scripts/`.
- Match the surrounding file's style — naming, import order, comment density.
  There is no repo-wide formatter enforcing it in CI.
- **Comments explain why, not what.** The best comments here record a failure
  and its cause: why the `"use client"` directive has to be written in
  `generateBundle`, why `extract-webpage` must stay external, why React is
  externalized for one entry. `vite.config.ts` and
  `scripts/sync-skill-docs.mjs` are the house style — copy that register.
- The library runs in **browsers, Node and CLIs**. Before reaching for a Node
  API in `packages/grab-api`, check which entry it ends up in.

## Commits

Gitmoji + conventional commits, lowercase subject, imperative mood:

```
✨ feat(cli): archive a page into a folder with --page
✨ feat(cli): route media-site URLs through yt-dlp
📝 docs(skill): cover api2ai, the transfer CLI, and the rest of the surface
💄 feat(homepage): show the full README badge set under the hero tagline
```

Scope is the package or surface name.

## Pull requests

- Target `master`. One concern per PR; no drive-by refactors.
- Say what changed, why, and **which `dist` entries it affects** — a change in
  `packages/grab-api` ships to every `grab-url` consumer.
- Say whether the published API changed and whether a version bump is needed.
- Include test results. If you changed the CLI, say whether you ran
  `npm run test:cli`.
- If you changed the skill, say you ran `npm run make:skill`.

## Tests

- Add or update tests for every behaviour change and bug fix.
- **All tests live in the root `test/` folder** — there are no per-package test
  directories. See [monorepo.md](monorepo.md#tests).
- `npm run test:coverage` is exactly what CI runs.
- Tests run through the same `vite.config.ts` as the build, so they see the
  real aliases and externals. That is deliberate: a test that passes against
  bundled behaviour is worth more here than one against raw source.
- `npm run test:cli` performs a real network download. Run it by hand for CLI
  changes; do not add it to CI.

## CI

| Workflow | Trigger | What it guards |
| --- | --- | --- |
| `tests.yml` | push to `master`, PR | Node 20, `npm install`, `npm run test:coverage`, upload to Codecov |
| `npm-publish.yml` | push to `master` | Iterates `packages/*` and publishes each **non-private** one, then commits version bumps |
| `pages.yml` | push to `master` | Node 22, `npm ci`, `node grab-help-docs/scripts/build-static-pages.mjs`, deploy to GitHub Pages |

Note what CI does **not** do: it never runs `npm run build`. A change that
breaks the Vite build passes CI. Build locally before you push.

## Publishing

- The root package `grab-url` is the main artifact; `npm run ship` is the manual
  release path (`standard-version` patch, then `npm publish`), and
  `prepublishOnly` forces a build first.
- `npm-publish.yml` publishes the **non-private** `packages/*` — `api2client`,
  `archiver-web`, `loading-animations`, `quantum-sphere-loading-icon`.
- `@grab-url/*` packages are `"private": true` and must stay that way: they are
  bundled into `grab-url`, and publishing them would create two copies of the
  same code in the wild.

## Security

- Never commit secrets or tokens.
- **The CLI downloads and writes files from user-supplied URLs.** Path traversal
  out of the target directory, following a redirect to a local address, and
  archive extraction that escapes its destination ("zip slip") are the three
  failure modes to keep tested. `archiver-web` and the downloader both touch
  this.
- yt-dlp is fetched at install time by `scripts/install-yt-dlp.mjs`. Keep the
  download pinned and verified; never execute an arbitrary URL's payload.
- `extract-webpage` parses hostile HTML. It stays an optional runtime import for
  that reason as well as for bundle size.

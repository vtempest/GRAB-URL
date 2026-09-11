# Documentation — Where It Goes

All documentation lives in the user guide, **`grab-help-docs/content/docs`** — a
Next.js + Fumadocs app. Nothing else in this repo is documentation prose, with
the package `README.md`s and the agent skill as the two deliberate exceptions.

## `docs/` at the root is vestigial

It holds three files and no documentation: a Jekyll `_config.yml`, an
`index.html` redirect to grab.js.org, and a `README.md` describing itself.

They are left over from when GitHub Pages deployed from a branch folder — `/docs`
being the only folder name Pages accepts besides the repository root. **Pages no
longer works that way.** Settings → Pages → Source is "GitHub Actions", and
`.github/workflows/pages.yml` publishes the static export built from
`grab-help-docs/out`. Nothing reads `docs/` at all.

Verify that claim rather than trusting this paragraph, or the folder's own
README: the `Deploy docs to Pages` workflow ends in `actions/deploy-pages@v5`,
which **only succeeds when Source is "GitHub Actions"**, and it is green on
`master`. If it is passing, the folder is inert.

The folder's `README.md` and `_config.yml` still assert that Pages builds them
with Jekyll. That is stale, and it is load-bearing stale: it is the stated reason
the folder exists. PR #47 corrects those files and then deletes the folder.

So: put no documentation here, and do not recreate it once it is gone.

## The Vercel deploy is broken, and `docs/` is why

Every deployment of the `grab-url` Vercel project is failing, production
included, and has been since the docs app was renamed `docs/` → `grab-help-docs/`.

The project's **Root Directory is still `docs`**. Turbo resolves no package from
there (`docs/` matches neither `packages/*` nor `grab-help-docs` in the workspace
globs), so it reports `No tasks were executed as part of this run`, never writes
a `.next`, and Vercel fails with:

```
The file "/vercel/path0/docs/.next/routes-manifest.json" couldn't be found.
```

**This is a dashboard setting, not a diff — no commit can fix it.** Set Root
Directory to `grab-help-docs`, clear the `npm install --prefix=..` Install
Command override, and leave Build Command unset; `grab-help-docs/vercel.json`
supplies all three. Deleting `docs/` does not fix it either — it only changes the
error to a missing-root-directory one.

Until that setting changes, a red Vercel check on a PR here says nothing about
that PR.

## Adding a page

1. Write `grab-help-docs/content/docs/<slug>.mdx` with frontmatter — `title` is
   required by `frontmatterSchema` in `source.config.ts`; `icon` takes a Lucide
   name.
2. Add the slug to `content/docs/meta.json`. Sections are `---Label---`
   separators; a subdirectory is included with `...<dir>` and needs its own
   `meta.json`.
3. MDX rules apply: a bare `{` or `<` outside a code fence is parsed as JSX —
   this is the specific reason Jekyll is kept away from the real docs.

## The generated skill page

`content/docs/claude-skill.mdx` is **generated**. The source of truth is
`skills/use-grab-request/SKILL.md`; `scripts/sync-skill-docs.mjs` regenerates the
page and writes the header telling you so.

```bash
npm run make:skill            # regenerate
node scripts/sync-skill-docs.mjs --check   # fail if stale, instead of writing
```

Edit the skill, regenerate, commit both. Editing the `.mdx` directly is undone by
the next `npm run make`.

## Two deployments, one source

| Target | Built by | Notes |
| --- | --- | --- |
| **https://grab.js.org** (Vercel) | `grab-help-docs/vercel.json` → `turbo run build --filter=grab-help-docs` | The full app — middleware, a Server Action and a POST route handler all work. **Currently failing**: Root Directory is still `docs`. See the section above. |
| **GitHub Pages** | `.github/workflows/pages.yml` → `grab-help-docs/scripts/build-static-pages.mjs` → `actions/deploy-pages@v5` | A static export, served from `grab-help-docs/out`. `output: 'export'` supports none of those three server pieces, so the script **prunes them from the working tree** before building. It is destructive by design and refuses to run outside CI without `--force`. Green on `master`. |

The Pages workflow uses `npm ci`, not a floating install: `package-lock.json`
pins a compatible `fumadocs-openapi` / `fumadocs-ui` pair and a fresh resolve
picks versions that break the build.

## Package READMEs and the root README

Each `packages/*/README.md` documents that folder's own surface. The root
`README.md` is the npm landing page and the feature list — when you add a
user-visible capability, it belongs there, in the relevant docs page, and in the
skill if an agent would use it.

# Documentation — Where It Goes

All documentation lives in the user guide, **`grab-help-docs/content/docs`** — a
Next.js + Fumadocs app. Nothing else in this repo is documentation prose, with
the package `README.md`s and the agent skill as the two deliberate exceptions.

## `docs/` at the root is not a docs folder

It holds exactly three files and no documentation: `_config.yml`, an
`index.html` that redirects to grab.js.org, and a `README.md` explaining itself.

GitHub Pages' "Deploy from a branch" mode accepts only the repository root or a
folder literally named `/docs`, so the folder stays behind as a deployment stub
while that setting is in use; `_config.yml` also keeps Jekyll from choking on
content it cannot parse. **Do not put documentation in it, and do not delete it**
while Settings → Pages → Source is still "Deploy from a branch" — the Pages
deploy goes with it.

It becomes removable the moment Pages' Source is switched to "GitHub Actions",
which is what `.github/workflows/pages.yml` is waiting for.

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
| **https://grab.js.org** (Vercel) | `grab-help-docs/vercel.json` → `turbo run build --filter=grab-help-docs` | The full app — middleware, a Server Action and a POST route handler all work. The Vercel project's **Root Directory must be `grab-help-docs`**; left at `docs/` the deploy fails with `The file "…/docs/.next/routes-manifest.json" couldn't be found`. |
| **GitHub Pages** | `.github/workflows/pages.yml` → `grab-help-docs/scripts/build-static-pages.mjs` | A static export. `output: 'export'` supports none of those three server pieces, so the script **prunes them from the working tree** before building. It is destructive by design and refuses to run outside CI without `--force`. |

The Pages workflow uses `npm ci`, not a floating install: `package-lock.json`
pins a compatible `fumadocs-openapi` / `fumadocs-ui` pair and a fresh resolve
picks versions that break the build.

## Package READMEs and the root README

Each `packages/*/README.md` documents that folder's own surface. The root
`README.md` is the npm landing page and the feature list — when you add a
user-visible capability, it belongs there, in the relevant docs page, and in the
skill if an agent would use it.

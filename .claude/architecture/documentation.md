# Documentation

| If it is… | It goes in… |
| --- | --- |
| A guide for users of `grab-url` | `grab-help-docs/content/docs` |
| How an agent should *use* `grab-url` | `skills/use-grab-request/SKILL.md` |
| How an agent should *work on* a package | That package's `CLAUDE.md` |
| Repo-wide agent orientation | root `CLAUDE.md` + `.claude/architecture/` |

## The skill is the source of truth for its docs page

`grab-help-docs/content/docs/claude-skill.mdx` is **generated** from
`skills/use-grab-request/SKILL.md` by `scripts/sync-skill-docs.mjs`. The
generated file carries a comment saying so. Edit the skill, then:

```bash
npm run make:skill              # write
node scripts/sync-skill-docs.mjs --check    # fail if stale
```

`npm run make` runs `make:skill` before the docs build, so the full pipeline
keeps them in sync — but a bare `npm run build` does not.

The skill is what agents load to use this library. When the client's public
behaviour or the CLI's flags change, updating it is part of the change, not a
follow-up.

## The docs site — `grab-help-docs`

A Fumadocs site, and a workspace. It is **statically exported and deployed to
GitHub Pages** by `.github/workflows/pages.yml`, which runs
`node grab-help-docs/scripts/build-static-pages.mjs` after `npm ci` — not a
plain `next build`. If the deployed site and a local dev run disagree, the
static export path is the one that ships.

```bash
npm run make:docs     # turbo run build --filter=grab-help-docs
```

## `docs/` is not the docs site — and it is what breaks Vercel

The root `docs/` directory holds no documentation. It is a **GitHub Pages
Jekyll stub**: a `_config.yml` and an `index.html` that redirects to
grab.js.org, kept because `/docs` is the only folder name Pages accepts besides
the repository root. Its own `README.md` says so. Do not put documentation
there.

It matters for one operational reason. **The Vercel project's Root Directory
must be `grab-help-docs`.** Left pointing at `docs/`, every deploy fails the
same way: turbo resolves no package from `docs/` (it matches neither
`packages/*` nor `grab-help-docs` in the workspace globs), so no `.next` is
produced and Vercel reports

```
The file "/vercel/path0/docs/.next/routes-manifest.json" couldn't be found.
```

With the Root Directory set correctly, `grab-help-docs/vercel.json` supplies
the framework, install command and build command — so the project's own
Install/Build Command overrides should be left unset.

**This is a dashboard setting, not a diff.** No commit in this repository can
fix it, so do not go looking for the bug in `turbo.json` or `vercel.json`.

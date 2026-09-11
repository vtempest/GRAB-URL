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

## `docs/` is not the docs site

The root `docs/` directory is a small static landing page (`index.html`,
`_config.yml`, `README.md`) for grab.js.org. Do not put documentation there.

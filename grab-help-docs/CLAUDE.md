# CLAUDE.md — `grab-help-docs`

The documentation site for `grab-url`: a Fumadocs site, and a workspace (it is
listed explicitly in the root `workspaces` array).

## It deploys as a static export, not `next build`

`.github/workflows/pages.yml` runs `npm ci` and then:

```bash
node grab-help-docs/scripts/build-static-pages.mjs
```

and publishes the result to GitHub Pages. **That script is what ships** — if the
deployed site and a local dev run disagree, trust the static export. Build
through it before claiming a docs change works.

```bash
npm run make:docs     # turbo run build --filter=grab-help-docs
```

## One page is generated — don't edit it

`content/docs/claude-skill.mdx` is generated from
`skills/use-grab-request/SKILL.md` by `scripts/sync-skill-docs.mjs`, and says so
in a comment at the top. Edit the skill, then `npm run make:skill`.
`node scripts/sync-skill-docs.mjs --check` fails when it is stale.

## The root `docs/` folder is gone

It was a vestigial Jekyll stub from before GitHub Pages switched to deploying
via Actions, and #47 deleted it. **Do not recreate it** — documentation belongs
here, in `content/docs/`.

It is still worth knowing about, because the Vercel project's Root Directory
points at that now-missing folder and every deploy fails as a result. See
[`../.claude/architecture/documentation.md`](../.claude/architecture/documentation.md);
it is a dashboard setting, so no commit here can fix it.

# This folder no longer serves anything

The documentation site lives in [`../grab-help-docs`](../grab-help-docs) — a
Next.js + Fumadocs app. Edit the docs in `grab-help-docs/content/docs/`.

Nothing in this folder is published any more. It exists only because the Vercel
project's **Root Directory** still points at it; see below.

## Deployments

- **GitHub Pages** — served from the static export that
  `.github/workflows/pages.yml` builds out of `grab-help-docs/out` and uploads
  with `actions/deploy-pages`. Settings → Pages → Source is "GitHub Actions", so
  Pages no longer builds a branch folder with Jekyll and never reads this
  directory. `_config.yml` and `index.html` are leftovers from the era when it
  did.
- **Vercel** (<https://grab.js.org>) — builds `grab-help-docs`, not this folder.
  The project's **Root Directory** must be set to `grab-help-docs`; install and
  build commands then come from `grab-help-docs/vercel.json`. While it is left
  pointing at `docs/`, every deploy fails: Turbo resolves no package from this
  directory ("Running build in 0 packages") and Vercel then reports
  `The file "…/docs/.next/routes-manifest.json" couldn't be found`.

## Deleting this folder

Once the Vercel Root Directory is `grab-help-docs`, this whole directory can go.
Removing it while Vercel still points here only swaps one failing build for
another.

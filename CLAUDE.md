# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

**Snob 2000** — a dashboard of every song featured in the "Snob 2000" countdown, 2013 through 2025. Plain static site, no framework, no build step:

```
index.html          # the dashboard page
css/style.css
js/data.js           # song dataset
js/script.js
assets/              # hero image, favicon, social preview
scripts/             # one-off Python enrichment/review scripts + their CSV/XLSX output — not part of the served site
```

`SNOB2000_dashboard.html` is an older, self-contained single-file version the current `index.html`/`css`/`js` split was pulled out of — check before assuming it's still current.

## Deployment

Live at `https://bier-en-brood.nl/snob2000`. Deployed via Coolify's static build pack (`nginx:alpine`, no
install/build/start command), pushed to `main`. Auto-deploy uses a **manual GitHub webhook** (not a real
GitHub App connection, despite the repo being public) — see the Coolify Hosting Playbook for why and how
to re-set it up if it ever stops firing.

Full server/infra details (Coolify IDs, nginx config, webhook setup) live in
`../Coolify Hosting Playbook.md` — check that file for anything deploy- or server-related,
not duplicated here.

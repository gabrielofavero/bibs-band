# Bibs Band — Music Library

This is my music-game song catalog for friends choosing what to play. The
published site uses the pinned `game-setlist-hub` core for its UI; this repo owns
only the catalog, branding, site configuration, and build workflow. The original
standalone site remains at the repository root during the migration. GitHub
Pages publishes `dist/` after the shared build passes.

## Catalog files

The three JSON arrays in `assets/json` are the public catalog. Edit them
directly; `site.config.json` lists them. The review reports in `catalog/` are
maintainer records and stay out of `dist/`. See the core's
[`catalog setup`](game-setlist-hub/docs/CATALOG.md) for the file format.

## Build and publish

Use Node 20 or newer. From a clean checkout:

```sh
git submodule update --init --recursive
cd game-setlist-hub
npm ci --ignore-scripts
cd ..
npm run build
```

The output is `dist/`. It contains the shared UI, the three declared catalogs,
the logo, and the site icons. It does not copy `catalog/`, the original
standalone HTML/CSS/JS, host settings, or local DLC. The GitHub Actions workflow
uses the same commands and deploys `dist/` on pushes to `main` or manual runs.
In the repository's **Settings → Pages**, select **GitHub Actions** as the
build/deployment source. The workflow needs the core submodule revision to be
available from its configured GitHub URL.

The default `site.config.json` has `backend.mode: "disabled"`, so Pages always
works as an Offline catalog. To enable live Setlist and Download, set
`backend.mode` to `"url"` and `backend.baseUrl` to the host's public HTTPS base
URL; configure that host's `HUB_ALLOWED_ORIGINS` with the exact Pages origin
(for this repository, `https://gabrielofavero.github.io`). A URL alone cannot
make a private LAN host reachable from a phone. See
[`host configuration`](game-setlist-hub/docs/CONFIGURATION.md) for the tunnel or
reverse-proxy setup, pairing, and capability behavior. For a local site served
by the host, use `"same-origin"` with a null base URL instead.

To check the reusable build with a second configuration, set `HUB_SITE_CONFIG`
to an absolute path to another config before `npm run build`. For example, the
core's `site.config.example.json` builds its small fixture catalog. Restore the
Bibs build by clearing the variable and running `npm run build` again.

The Bibs catalog and legacy site retain their existing GPLv2-only notice. The
new shared core has its own `LICENSE` and `THIRD-PARTY-NOTICES.md`; review those
with any redistributed build. The legal notice for Epic content is in the
public site config.

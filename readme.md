# Bibs Band — Music Library

This is my music-game song catalog for friends choosing what to play. The
Pages build uses the pinned `game-setlist-hub` core for its UI; this repo owns
only the catalog, branding, site configuration, and build workflow. The original
standalone site remains at the repository root during the migration. GitHub
Pages publishes `dist/` after the shared build passes.
The current pin is a review commit, not a tagged release. Publication and the
real-game/phone checks are still pending; see the core's
[`release checks`](game-setlist-hub/docs/RELEASE-CHECKS.md).

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
This is a source build and static site deployment; no executable is released.
In the repository's **Settings → Pages**, select **GitHub Actions** as the
build/deployment source. The workflow needs the core submodule revision to be
available from its configured GitHub URL.

The site opens the Bibs catalog in offline mode when it cannot reach YARG.
A GitHub Pages copy of these files cannot reach a same-origin Node host, so it
stays in offline mode. Serving the build through the host as described below
enables the live YASS view when YARG's Setlist Bridge is connected. Catalog
cover URLs and the three local game covers remain available in both modes.

## Test Bibs Band with local YARG

Run these commands in **PowerShell on the computer running YARG**. Complete the
checkout and dependency install under **Build and publish** once first. The
checked-in configuration already uses the host at the same origin:

```powershell
# Terminal 1, from the bibs-band repository root
npm run build
```

Start the host in another PowerShell terminal:

```powershell
# Terminal 2, from the bibs-band repository root
cd .\game-setlist-hub
$env:YASS_CLIENT_DIST = (Resolve-Path ..\dist).Path
$env:HUB_BIND_HOST = '127.0.0.1'
npm run build --workspace=server
npm start
```

Leave Terminal 2 running and open `http://localhost:4321` on that computer.
This address serves the Bibs build and its `/api` routes from one process.
Scan songs once in YARG's Music Library before checking Setlist. The host
startup log should report a found song cache and a nonzero song count; check
`http://localhost:4321/api/capabilities` if Setlist stays unavailable.
If the default YARG data location is wrong, set `HUB_YARG_DATA_DIR` to the
existing channel directory containing `songcache.bin` **before** `npm start`.

Browsing now requires BepInEx 5 and the
[YARG Setlist Bridge](https://github.com/d4g/YARG-Setlist-Bridge#install)
connected to YARG. Editing also needs an editable YARG scene. To try an install, set
`HUB_YARG_SONGS_DIR` before `npm start` to an existing custom-songs directory
that YARG scans. Create a pairing code from Download mode on the host computer,
pair the browser, then install. After the job says refresh pending, use YARG's
**Music Library → Scan Songs**; the host cannot trigger that scan.

For a phone on the same LAN, start the host with
`$env:HUB_BIND_HOST = '0.0.0.0'` instead and open the LAN URL printed by the
host. Keep the phone and YARG computer on the same network. This local test
does not require GitHub Pages or a public HTTPS host.

To check the reusable build with a second configuration, set `HUB_SITE_CONFIG`
to an absolute path to another config before `npm run build`. For example, the
core's `site.config.example.json` builds its small fixture catalog. Restore the
Bibs build by clearing the variable and running `npm run build` again.

The Bibs catalog and legacy site retain their existing GPLv2-only notice. The
new shared core has its own `LICENSE` and `THIRD-PARTY-NOTICES.md`; review those
with any redistributed build. The legal notice for Epic content is in the
public site config.

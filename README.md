# Bibs Band

Bibs Band is a **template** for Game Setlist Hub. This folder contains the
song catalogs, logo, cover images, favicon, and `site.config.json`. It does not
contain the hub's webpage or backend. Keep this folder and the
`game-setlist-hub` checkout beside each other:

```text
Music Games/
├── bibs-band/          ← this folder; choose it as the template
└── game-setlist-hub/   ← builds and runs the site
```

## Easiest: open Bibs Band with the executable

If Game Setlist Hub has already been built, find
**`../game-setlist-hub/dist/YASS.exe`** and double-click it. No terminal or
Node installation is needed to *run* the executable.

1. On the first launch, choose **this `bibs-band` folder** in the folder
   picker. Select the folder, not `site.config.json` or `assets/`.
2. Find the **YASS** icon near the Windows clock. Right-click it and choose
   **Open in browser**. The page and backend start together.
3. To change templates later, click the tray icon and use **choose folder**,
   or right-click it and choose **Choose template…**.
4. To stop it, right-click the icon and choose **Quit YASS**.

The offline Bibs catalog works even when YARG is closed. Live YARG songs need
YARG's song cache; use **Music Library → Scan Songs** in YARG first. If live
songs are missing, check the **YARG data folder** in the tray app's settings.

## Build the executable yourself

Install [Git](https://git-scm.com/) and [Node.js](https://nodejs.org/) 20 or
newer on the **build computer**. Node 22 is used in CI. Open PowerShell in this
`bibs-band` folder and run the commands below. To open PowerShell there, open
the folder in File Explorer, type `powershell` in the address bar, and press
Enter.

```powershell
cd ..\game-setlist-hub
git submodule update --init --recursive
npm ci
npm run dist:desktop
```

The output is **`../game-setlist-hub/dist/YASS.exe`**. Double-click it and
choose the Bibs folder as above. `npm run dist:desktop` includes a ready-made
example in the executable; it does **not** bake Bibs into it. You can edit
Bibs' JSON or images later and reopen the app without rebuilding the
executable. Building needs internet access for npm and Electron; running the
finished file does not. The local executable is unsigned and Windows may show
a security prompt.

## Build and preview the static website

Use this when you want only website files, such as for GitHub Pages. Open
PowerShell in this `bibs-band` folder:

```powershell
cd ..\game-setlist-hub
git submodule update --init --recursive
npm ci --ignore-scripts
$env:HUB_TEMPLATE_DIR = (Resolve-Path ..\bibs-band).Path
npm run build:static
npm run preview --workspace=client
```

Open the local URL printed by `preview` (normally `http://localhost:4173`).
The output is **`../game-setlist-hub/client/dist/`**. Press `Ctrl+C` to stop
previewing. The static website shows the catalog without a running backend.
The old `bibs-band/dist/` folder, if present from an earlier setup, is not
updated by these commands. Avoid opening `index.html` directly from disk;
preview or serve the files over HTTP so the catalog JSON loads.

## Build and run the site with the YARG backend

After the dependency install above, stay in `game-setlist-hub` and run:

```powershell
$env:HUB_TEMPLATE_DIR = (Resolve-Path ..\bibs-band).Path
npm run build
npm start
```

Open **`http://localhost:4321`**. Press `Ctrl+C` to stop the backend. This
source workflow needs a terminal; the executable above does these steps for
the person running it. For live development, run `npm run dev` instead and
open `http://localhost:5173`. The
[hub's host guide](https://github.com/gabrielofavero/game-setlist-hub/blob/main/docs/DEPLOYMENT.md)
explains LAN access, pairing, and YARG settings.

## Edit the Bibs template

- `site.config.json` chooses the site name, colors, logo, catalogs, and
  backend mode. Its paths are relative to this folder.
- `assets/json/` contains the public song lists. `assets/img/` contains the
  logo and fallback covers. `favicon.ico` is the browser icon.
- `catalog/` contains maintainer reports; it is not published.

An ignored `site.config.local` can hold local settings. To build with it, set
`HUB_SITE_CONFIG` to that file's absolute path **instead of** setting
`HUB_TEMPLATE_DIR`. The executable's folder picker uses `site.config.json`.
See the hub's [catalog guide](https://github.com/gabrielofavero/game-setlist-hub/blob/main/docs/CATALOG.md)
for the song format.

The Pages workflow checks out the hub during CI, builds this template, and
publishes the generated website. Publish matching hub changes before running
that workflow. `npm run resolve:yarg-art` is a separate catalog maintenance
command that updates `assets/json/yarg.json` and its artwork report using
existing cover matches and Deezer lookups.

The Bibs catalog retains its existing GPLv2-only notice. Review the hub's
license and third-party notices with any redistributed build. The Epic legal
notice is in `site.config.json`.

# Bibs Band template

This folder supplies the Bibs Band catalog and appearance to Game Setlist Hub.
It does not contain the hub or build its UI. `site.config.json` declares the
public catalogs, branding, cover fallbacks, and optional backend. The `catalog/`
reports are maintainer records and are not published. `favicon.ico` is copied
when present. `site.config.local` is an ignored local variant; point
`HUB_SITE_CONFIG` at it to use it instead of the checked-in configuration.

## Build and preview

Install Node 20 or newer and check out
[Game Setlist Hub](https://github.com/gabrielofavero/game-setlist-hub) separately.
From the hub checkout, set `HUB_TEMPLATE_DIR` to this folder:

```powershell
cd ..\game-setlist-hub
git submodule update --init --recursive
npm ci --ignore-scripts
$env:HUB_TEMPLATE_DIR = (Resolve-Path ..\bibs-band).Path
npm run build:static
npm run preview --workspace=client
```

The static output is `game-setlist-hub/client/dist/`. For live YARG features,
run `npm run build` and `npm start` in the hub checkout with the same variable.
For development, `npm run dev` prepares this template and starts the client
and host. The hub's [deployment guide](https://github.com/gabrielofavero/game-setlist-hub/blob/main/docs/DEPLOYMENT.md)
describes host settings and catalog format.

The Pages workflow checks out the hub during CI and publishes the output from
this template. Publish the matching hub changes before running that workflow.

`npm run resolve:yarg-art` remains a Bibs catalog maintenance command. It
updates `assets/json/yarg.json` and `catalog/yarg-artwork-report.json` using
existing cover matches and Deezer lookups.

The Bibs catalog retains its existing GPLv2-only notice. Review the hub's
license and third-party notices with any redistributed build. The Epic legal
notice is in the public site configuration.

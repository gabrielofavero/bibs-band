# Bibs catalog review

Reviewed on 2026-11-04. The public arrays remain directly editable in
`../assets/json/`. The reports and decisions in this directory are maintainer
artifacts and are not copied into the static site.

`reconciliation-report.json` classifies all 852 Rock Band 4 and 73 Festival
rows against the 1,777 imported YARG songs: 501 exact artist/full-title
matches, one version conflict, and 423 unmatched. A match is an identity
candidate, not proof that two games use the same recording. The reviewed
`manual-overrides.json` leaves the Rock Band 4 "Supersonic" separate from the
YARG "Supersonic (Live)". Other uncertain and unmatched rows receive no
automatic YARG metadata.

`field-provenance.json` records 770 fields added to the direct arrays. For 189
Rock Band 4 rows, each unique exact match also declares `rb4` or `rb4_dlc` in
its local `songs.dta`; album, year, genre, and chart duration were copied from
that file. Its `sourceId` links to `yarg-import-report.json` and the YARG
array. The local package has no source URL; the recorded date is the read date.
No difficulty tier or existing cover was changed. Seven Festival entries have
year and duration from the individual [official Fortnite Jam Track pages](https://www.fortnite.com/item-shop/jam-tracks)
listed in `verified-metadata.json`. Their albums and genres remain unknown.

The site configuration retains the Deezer, Apple Music, and Epic cover hosts in
published catalog JSON. `assets/json/yarg.json` now has 1,505 cover URLs: 598
from exact artist/album or artist/title matches in the other game catalogs,
and 907 from exact Deezer album or track matches. The 272 unresolved songs use
the local YARG game cover. Run `npm run resolve:yarg-art` to repeat the lookup
after catalog edits; `yarg-artwork-report.json` records the latest counts.
`artwork-audit.json` records an earlier build check when only Epic URLs were
published; it does not verify the newly enabled URLs. Artwork usage rights still need review. The
[Deezer developer terms](https://cdn-content.dzcdn.net/pdf/CGU-developers.pdf)
reserve rights in cover visuals, and the [Epic Fan Content Policy](https://legal.epicgames.com/epicgames/fan-art-policy)
requires the notice in Bibs' site config for non-commercial fan sites.

When a cover URL is missing or fails, the site uses the corresponding local
image in `assets/img/`: `cover-rb4.jpg`, `cover-fn-festival.jpg`, or
`cover-yarg.jpg`. These three files are copied into the shared build.

The site uses the local game cover if an allowed image later fails to load. A build
with `HUB_VALIDATE_ART=1` checks the currently allowed remote URLs and writes
an ignored, per-URL report at `game-setlist-hub/client/.hub-artwork-report.json`.

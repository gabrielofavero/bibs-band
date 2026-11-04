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

The static build allows only the 72 existing `cdn2.unrealengine.com` cover
links. `artwork-audit.json` records that all 72 returned images in the
2026-11-04 build check. The source arrays still contain 844 Deezer and eight
Apple Music image URLs for reference, but the published copy uses designed
placeholders for those 852 images. Permission for those uses has not been
established. The [Deezer developer terms](https://cdn-content.dzcdn.net/pdf/CGU-developers.pdf)
reserve rights in cover visuals, and the [Epic Fan Content Policy](https://legal.epicgames.com/epicgames/fan-art-policy)
requires the notice now in Bibs' site config for non-commercial fan sites.
Epic's policy does not settle any separate third-party rights in Jam Track
artwork; the host allowlist can be narrowed if that artwork needs removal.

The site shows placeholders if an allowed image later fails to load. A build
with `HUB_VALIDATE_ART=1` checks the currently allowed remote URLs and writes
an ignored, per-URL report at `game-setlist-hub/client/.hub-artwork-report.json`.

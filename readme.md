# Bibs Band — Music Library

A static, single-page song library for Rock Band 4 and Fortnite Festival tracks,
styled after the **Rock Band 4** in-game music library.

## Features

- **Rock Band 4 look**: deep navy/cyan palette, condensed uppercase type, alternating
  translucent row bands, sticky artist headers and a washed-out concert backdrop.
- **Cover art** for every song, with `assets/img/cover-rb4.jpg` and
  `assets/img/cover-fn-festival.jpg` used as fallbacks when a cover is missing or fails to load.
- **Difficulty**: per-instrument meters (guitar, bass, drums, vocals) plus a band star rating.
  Level `6` renders as the red devil tier.
- **Search** across title, artist and song source.
- **Filters** drawer (console-style rows you can cycle, or drive with the arrow keys):
  song source, difficulty instrument, minimum difficulty, and sort order
  (artist, song, difficulty, source). Active filters show as removable chips.
- **Random song** picker that scrolls to and flashes the chosen row.
- **Lazy rendering**: rows are appended in chunks while you scroll, and cover images use
  native lazy loading, so the ~1,000 song library stays fast.
- **Responsive**: single-line rows on desktop, stacked metadata on phones, and the filter
  drawer turns into a bottom sheet below 560px.

## Files

```
index.html                  page shell (header, toolbar, list, filter drawer)
assets/css/styles.css       all styling, icons are tinted via CSS masks
assets/js/main.js           data loading, filtering, sorting, rendering
assets/json/rock-band.json  the library (title, artist, game, difficulties, cover)
assets/img/icons/*.svg      guitar, bass, drums, vocals, star, devil, search, filter,
                            random, close, chevron, music
assets/img/cover-*.jpg      fallback covers
```

## Data shape

```json
{
  "song-title": "Move Along",
  "artist": "All-American Rejects",
  "game": "Rock Band 4",
  "difficulties": { "guitar": 1, "bass": 1, "drums": 5, "vocals": 2, "band": 4 },
  "cover": "https://…/cover.jpg"
}
```

Difficulty is `0` (no part / not rated) through `5`, with `6` reserved for the devil tier.
`band` is `null` for Fortnite Festival entries, which shows an empty star row.

Today's free Fortnite Festival rotation is merged in from a community mirror
(`fnfestival.co`) after the local list renders; those entries use the Festival fallback cover.

## Run locally

Any static file server works, for example:

```powershell
python -m http.server 8123
```

Then open <http://localhost:8123/index.html>.

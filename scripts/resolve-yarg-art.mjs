import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const catalog = join(root, 'assets', 'json')
const yargPath = join(catalog, 'yarg.json')
const yarg = JSON.parse(await readFile(yargPath, 'utf8'))
const existing = (await Promise.all(['rock-band.json', 'fortnite-festival.json'].map(async (name) =>
  JSON.parse(await readFile(join(catalog, name), 'utf8'))))).flat()

const key = (value) => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLocaleLowerCase('en').replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
const albumKey = (row) => `${key(row.artist)}|${key(row.album)}`
const songKey = (row) => `${key(row.artist)}|${key(row['song-title'])}`
const covers = (rows, makeKey) => {
  const grouped = new Map()
  for (const row of rows) {
    if (!row.cover) continue
    const id = makeKey(row)
    if (!grouped.has(id)) grouped.set(id, new Set())
    grouped.get(id).add(row.cover)
  }
  return new Map([...grouped].filter(([, urls]) => urls.size === 1).map(([id, urls]) => [id, [...urls][0]]))
}
const byAlbum = covers(existing.filter((row) => row.album), albumKey)
const bySong = covers(existing, songKey)
const counts = { existing: 0, sharedAlbum: 0, sharedSong: 0, deezerAlbum: 0, deezerSong: 0, unresolved: 0 }

for (const row of yarg) {
  if (row.cover) { counts.existing++; continue }
  if (row.album && byAlbum.has(albumKey(row))) { row.cover = byAlbum.get(albumKey(row)); counts.sharedAlbum++; continue }
  if (bySong.has(songKey(row))) { row.cover = bySong.get(songKey(row)); counts.sharedSong++ }
}

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
async function lookup(endpoint, term) {
  const url = new URL(`https://api.deezer.com/search/${endpoint}`)
  url.searchParams.set('q', term)
  url.searchParams.set('limit', '10')
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(12000) })
      if (response.status === 429 || response.status >= 500) { await pause(2000 * (attempt + 1)); continue }
      if (!response.ok) return []
      const body = await response.json()
      return Array.isArray(body.data) ? body.data : []
    } catch { await pause(1000 * (attempt + 1)) }
  }
  return []
}

async function resolveGroup(groups, endpoint, match, selectCover, countName) {
  const entries = [...groups.values()]
  let cursor = 0
  await Promise.all(Array.from({ length: 3 }, async () => {
    while (cursor < entries.length) {
      const rows = entries[cursor++]
      const row = rows[0]
      const query = endpoint === 'album' ? `${row.artist} ${row.album}` : `${row.artist} ${row['song-title']}`
      const results = await lookup(endpoint, query)
      const found = results.find((result) => match(row, result))
      const cover = found ? selectCover(found) : null
      if (typeof cover === 'string' && /^https:\/\/cdn-images\.dzcdn\.net\/images\/cover\//.test(cover)) {
        for (const target of rows) { target.cover = cover; counts[countName]++ }
      }
      await pause(300)
      if (cursor % 100 === 0) console.log(`${endpoint}: ${cursor}/${entries.length} lookups`)
    }
  }))
}

const missingAlbums = new Map()
for (const row of yarg) {
  if (row.cover || !row.album) continue
  const id = albumKey(row)
  if (!missingAlbums.has(id)) missingAlbums.set(id, [])
  missingAlbums.get(id).push(row)
}
await resolveGroup(missingAlbums, 'album', (row, result) =>
  key(row.artist) === key(result.artist?.name) && key(row.album) === key(result.title),
  (result) => result.cover_big ?? result.cover_medium, 'deezerAlbum')

const missingSongs = new Map()
for (const row of yarg) {
  if (row.cover) continue
  const id = songKey(row)
  if (!missingSongs.has(id)) missingSongs.set(id, [])
  missingSongs.get(id).push(row)
}
await resolveGroup(missingSongs, 'track', (row, result) =>
  key(row.artist) === key(result.artist?.name) && key(row['song-title']) === key(result.title_short ?? result.title) &&
  (!row.album || key(row.album) === key(result.album?.title)),
  (result) => result.album?.cover_big ?? result.album?.cover_medium, 'deezerSong')

counts.unresolved = yarg.filter((row) => !row.cover).length
await writeFile(yargPath, `${JSON.stringify(yarg, null, 2)}\n`)
await writeFile(join(root, 'catalog', 'yarg-artwork-report.json'), `${JSON.stringify({ schemaVersion: 1, asOf: new Date().toISOString().slice(0, 10), counts }, null, 2)}\n`)
console.log(counts)

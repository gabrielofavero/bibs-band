import { spawnSync } from 'node:child_process'
import { cp, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const core = join(root, 'game-setlist-hub')
const config = resolve(process.env.HUB_SITE_CONFIG ?? join(root, 'site.config.json'))
const dist = join(root, 'dist')

try { await stat(join(core, 'scripts', 'prepare-site-config.mjs')) }
catch { throw new Error('Core submodule is missing. Run git submodule update --init --recursive.') }
try { await stat(join(core, 'node_modules', 'vite')) }
catch { throw new Error('Core dependencies are missing. Run npm ci --ignore-scripts in game-setlist-hub.') }

const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const result = spawnSync(npm, ['run', 'build:static'], {
  cwd: core,
  env: { ...process.env, HUB_SITE_CONFIG: config },
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
if (result.error) throw result.error
if (result.status !== 0) process.exit(result.status ?? 1)

await rm(dist, { recursive: true, force: true })
await cp(join(core, 'client', 'dist'), dist, { recursive: true })
await cp(join(root, 'favicon.ico'), join(dist, 'favicon.ico'))
const site = JSON.parse(await readFile(join(dist, 'site.config.json'), 'utf8'))
const title = `${site.siteName} · Music Library`.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const html = (await readFile(join(dist, 'index.html'), 'utf8'))
  .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
  .replace(/<meta name="theme-color" content="[^"]*"\s*\/>/, `<meta name="theme-color" content="${site.branding.backgroundColor}" />`)
  .replace(/<!-- The publishing build may replace this title and add its own icon\. -->/, '<link rel="icon" href="./favicon.ico" />')
await writeFile(join(dist, 'index.html'), html)
for (const name of await readdir(join(dist, 'assets'))) {
  if (name.endsWith('.map')) await rm(join(dist, 'assets', name))
}
console.log(`Built Bibs Band at ${dist} from ${config}`)

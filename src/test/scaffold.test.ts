import { createHash } from 'node:crypto'
import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const abs = (p: string) => fileURLToPath(new URL(`../../${p}`, import.meta.url))
const read = (p: string) => readFileSync(abs(p))
const sha256 = (b: Buffer) => createHash('sha256').update(b).digest('hex')

/**
 * The legacy calculator as tagged at `v1-final`. `/v1/` serves this forever.
 * If this hash ever has to change, that is a deliberate decision by the owner,
 * not a side effect of a refactor.
 */
const V1_SHA256 = '88240d1e0a7ab8fa9e0a78fa4b29142efdc90e6e2c04c5388f7b02b10108344a'

describe('scaffold', () => {
  it('runs the test suite', () => {
    expect(true).toBe(true)
  })

  // "The CNAME file is sacred" — CLAUDE.md. This is the tripwire.
  it('ships a CNAME pointing at mahjongyuk.com', () => {
    expect(read('public/CNAME').toString().trim()).toBe('mahjongyuk.com')
  })

  it('preserves the v1 calculator byte-for-byte', () => {
    expect(sha256(read('public/v1/index.html'))).toBe(V1_SHA256)
  })

  // Run 2 took the root. The v1 copy is no longer there and must not come back,
  // or the shim would be silently resurrected and the app would stop shipping.
  it('serves the v2 app from the root', () => {
    const root = read('index.html').toString()
    expect(root).toContain('/src/main.tsx')
    expect(sha256(read('index.html'))).not.toBe(V1_SHA256)
  })

  it('keeps the engine harness at /app/', () => {
    expect(read('app/index.html').toString()).toContain('/src/harness-main.tsx')
  })
})

/**
 * Run 4 ships to /v3/ and NOWHERE ELSE.
 *
 * The owner is away. They left the root serving the Run 3 app and asked for
 * the whole of Run 4 to arrive as a preview they can look at on their return,
 * with the live site unchanged underneath them. These are the guards that
 * make that a fact rather than an intention.
 */
describe('the /v3/ preview, and the root it must not disturb', () => {
  it('ships a /v3/ entry that mounts the Run 4 app', () => {
    const v3 = read('v3/index.html').toString()
    expect(v3).toContain('/src/v3-main.tsx')
    expect(read('src/v3-main.tsx').toString()).toContain("from './v3/App'")
  })

  it('builds /v3/ as its own page', () => {
    // vite.config.ts must list it as an entry, or nothing is deployed there.
    expect(read('vite.config.ts').toString()).toContain("v3: fromRoot('v3/index.html')")
  })

  /**
   * The Run 3 app, exactly as the owner left it. A manifest hash over every
   * file in src/ui/ plus the root entry: if Run 4 leaks into either, this
   * fails and the preview is no longer a preview.
   *
   * To change this deliberately — promoting v3 to the root, say — recompute
   * both hashes in the same commit that moves them, and say so in the message.
   */
  it('leaves the Run 3 app at the root untouched', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`])
    const files = walk(abs('src/ui')).sort()
    const h = createHash('sha256')
    for (const f of files) {
      h.update(f.slice(f.indexOf('src/ui')))
      h.update(readFileSync(f))
    }
    expect(files.length, 'src/ui gained or lost a file').toBe(18)
    expect(h.digest('hex'), 'src/ui changed — Run 4 must ship to /v3/ only')
      .toBe('821229fe7d379a2376e531451a75ecd6aeb5aeb5f8a6d7aee73bbf6ecf13edb1')
    expect(sha256(read('index.html')), 'the root entry changed')
      .toBe('cd9a9680f55fba4890d1cea698e85dfd737583c2049dab12b857492d79a368e6')
  })

  it('keeps the two app surfaces from importing each other', () => {
    // A shared import is how "untouched" quietly stops being true.
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory() ? walk(`${dir}/${e.name}`) : [`${dir}/${e.name}`])
    const bad: string[] = []
    for (const [dir, forbidden] of [['src/ui', '/v3/'], ['src/v3', '/ui/']] as const) {
      for (const f of walk(abs(dir))) {
        if (!/\.tsx?$/.test(f)) continue
        const src = readFileSync(f, 'utf8')
        for (const m of src.matchAll(/from\s+'([^']+)'/g)) {
          if (m[1]!.includes(forbidden)) bad.push(`${f.split('/').slice(-2).join('/')} → ${m[1]}`)
        }
      }
    }
    expect(bad, 'one app surface importing the other').toEqual([])
  })

  /**
   * THE ROOT'S STRINGS ARE PART OF THE ROOT.
   *
   * The manifest above hashes the eighteen files under src/ui/ — and every
   * one of them imports src/i18n/en.json, which is NOT frozen and which Run 5
   * edited heavily. Three times in one run a shared key was changed in a way
   * that reached the frozen app: a {groups} placeholder it never passes, a
   * {wind} placeholder it never passes, and a hint describing a badge only
   * the new screen draws.
   *
   * So the STRINGS the root renders are pinned too. Changing one is allowed —
   * it is sometimes a strict improvement, and Run 5 made two on purpose — but
   * it has to be a decision, which means updating this hash and saying why.
   */
  it('pins every string the frozen root renders', () => {
    const uiDir = fileURLToPath(new URL('../ui/', import.meta.url))
    const walk = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true })
        .flatMap((e) => (e.isDirectory() ? walk(`${d}${e.name}/`) : [`${d}${e.name}`]))
    const src = walk(uiDir).filter((f) => /\.tsx?$/.test(f))
      .map((f) => readFileSync(f, 'utf8')).join('\n')
    const en = JSON.parse(readFileSync(
      fileURLToPath(new URL('../i18n/en.json', import.meta.url)), 'utf8')) as Record<string, string>

    const keys = new Set<string>()
    // t('key') and tv(variant, 'key'), plus the per-variant siblings tv() can
    // reach, and the template families the root builds by interpolation.
    for (const m of src.matchAll(/\b(?:t|tv)\(\s*(?:[A-Za-z]+\s*,\s*)?'([^']+)'/g)) keys.add(m[1]!)
    for (const m of src.matchAll(/`([a-z][a-zA-Z.]*)\.\$\{/g)) {
      for (const k of Object.keys(en)) if (k.startsWith(`${m[1]!}.`)) keys.add(k)
    }
    for (const k of [...keys]) {
      for (const v of ['singapore', 'hongkong']) if (en[`${k}.${v}`] !== undefined) keys.add(`${k}.${v}`)
    }

    const pinned = [...keys].filter((k) => en[k] !== undefined).sort()
      .map((k) => `${k}\u0000${en[k]}`).join('\u0001')
    const hash = createHash('sha256').update(pinned).digest('hex')
    expect(pinned.length, 'found no root strings to pin — the scan broke').toBeGreaterThan(2000)
    expect(hash, `${keys.size} keys reach the frozen root; one of their values changed`)
      .toBe('0bdc6fc1e26ef4cdf1acfb289e1380f44d126b193ee498ba08db3ec921f6bc13')
  })
})

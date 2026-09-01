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

/**
 * THE GUARDS CHANGED AT v3.0.0, and it is worth saying what went and why.
 *
 * Two guards are GONE:
 *
 *   - the root-source manifest, which hashed the eighteen files of src/ui/
 *     and failed if any of them moved;
 *   - the root-string hash, which pinned every en.json value the old root
 *     rendered.
 *
 * Both existed for one reason: while Runs 4 to 6C built the new app at /v3/,
 * the OLD app was still the live front door, and nothing done to the preview
 * was allowed to disturb it. They earned their keep — between them they
 * caught five accidental changes to the frozen app, four of them shared
 * i18n strings that no test of the new app would have noticed.
 *
 * That app is retired now. src/ui/ is deleted and preserved at the v2-legacy
 * tag, so there is no longer a frozen surface to protect, and a guard that
 * hashes a directory which does not exist is not a guard.
 *
 * What replaces them is below, and it protects the thing that is now true:
 * the ROOT is the app, /v3/ forwards to it, and /v1/ never changes.
 */
describe('scaffold', () => {
  it('runs the test suite', () => {
    expect(true).toBe(true)
  })

  it('ships a CNAME pointing at mahjongyuk.com', () => {
    expect(read('public/CNAME').toString().trim()).toBe('mahjongyuk.com')
  })

  it('preserves the v1 calculator byte-for-byte', () => {
    expect(sha256(read('public/v1/index.html')), 'v1 is frozen — see CLAUDE.md')
      .toBe(V1_SHA256)
  })
})

describe('the front door', () => {
  const root = read('index.html').toString()

  it('serves the app from the root', () => {
    // The app IS the root since v3.0.0. Its entry is the v3 bundle, and the
    // old /src/main.tsx went with the app it booted.
    expect(root).toContain('/src/v3-main.tsx')
    expect(root).not.toContain('/src/main.tsx')
    expect(root).toContain('<div id="app">')
  })

  it('names itself on the front door and in a share card', () => {
    expect(root).toContain('<title>Mahjongyuk — Mahjong Calculator</title>')
    expect(root).toMatch(/property="og:title" content="Mahjongyuk — Mahjong Calculator"/)
    // Both games, on the card somebody sees before they ever open it.
    for (const meta of ['name="description"', 'property="og:description"']) {
      const m = new RegExp(`${meta} content="([^"]*)"`).exec(root)
      expect(m, `${meta} is missing`).toBeTruthy()
      expect(m![1], `${meta} does not name Singapore`).toContain('Singapore')
      expect(m![1], `${meta} does not name Hong Kong`).toContain('Hong Kong')
    }
    expect(root).toContain('property="og:image"')
    expect(root).toContain('rel="canonical" href="https://mahjongyuk.com/"')
  })

  it('preloads the masthead the front door is built around', () => {
    expect(root).toContain('/brand/logo-mahjongyuk.png')
  })
})

describe('/v3/ forwards rather than serving a second copy', () => {
  const v3 = read('v3/index.html').toString()

  it('is a redirect, not the app', () => {
    // /v3/ was the address for four runs, so it must not 404 — but it must
    // also not boot a second copy of the app at a second URL.
    expect(v3).not.toContain('/src/v3-main.tsx')
    expect(v3).not.toContain('<div id="app">')
  })

  it('forwards with or without JavaScript, and does not trap Back', () => {
    expect(v3).toContain('http-equiv="refresh"')
    expect(v3).toMatch(/content="0;\s*url=\/"/)
    // replace(), never assign(): an extra history entry would send a player
    // who pressed Back straight forward into the app again.
    expect(v3).toContain("location.replace('/')")
    expect(v3).not.toMatch(/location\.(href\s*=|assign)/)
  })

  it('tells crawlers where the page actually lives', () => {
    expect(v3).toContain('rel="canonical" href="https://mahjongyuk.com/"')
    expect(v3).toContain('name="robots" content="noindex, follow"')
  })
})

describe('the retired surfaces are gone, not half-gone', () => {
  const listed = (p: string): string[] => {
    try { return readdirSync(abs(p)) } catch { return [] }
  }

  it('the Run 3 app and the engine harness left no files behind', () => {
    // Preserved at the v2-legacy tag; a stray file here would be dead code
    // that still typechecks and still ships.
    expect(listed('src/ui'), 'src/ui/ still exists').toEqual([])
    expect(listed('app'), 'app/ still exists').toEqual([])
    for (const f of ['src/main.tsx', 'src/harness-main.tsx']) {
      expect(() => read(f), `${f} still exists`).toThrow()
    }
  })

  it('nothing still imports them', () => {
    const walk = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        (e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`]))
    const bad: string[] = []
    for (const f of walk(abs('src/')).filter((f) => /\.tsx?$/.test(f))) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(/from\s+'([^']+)'/g)) {
        if (/(^|\/)ui\//.test(m[1]!) || /harness-main|(^|\/)main$/.test(m[1]!)) {
          bad.push(`${f.split('/').slice(-2).join('/')} → ${m[1]}`)
        }
      }
    }
    expect(bad, 'an import of a retired surface').toEqual([])
  })

  it('the build only has the two entries left', () => {
    const cfg = read('vite.config.ts').toString()
    expect(cfg).toContain("main: fromRoot('index.html')")
    expect(cfg).toContain("v3: fromRoot('v3/index.html')")
    expect(cfg, 'the harness entry is still built').not.toContain('app/index.html')
  })
})

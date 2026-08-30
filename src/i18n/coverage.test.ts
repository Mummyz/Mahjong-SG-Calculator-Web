/**
 * CONSTITUTION: no hardcoded UI text, ever.
 *
 * The engine emits pattern keys, rejection reasons and instant-payout keys
 * that the UI has to render as words. This test walks the golden corpus —
 * which is the exhaustive list of what the engine can produce — and fails if
 * any of them has no string. That is the guard that stops an untranslated key
 * from ever reaching a player.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import en from './en.json'
import { LOCALE_NAMES } from './index'

// Both corpora, because both variants ship. Between them they are the
// exhaustive list of what the engine can emit.
const corpusDirs = ['singapore', 'hongkong'].map((v) =>
  fileURLToPath(new URL(`../engine/corpus/${v}/`, import.meta.url)))
const files = corpusDirs.flatMap((d) =>
  readdirSync(d).filter((f) => f.endsWith('.json')).map((f) => d + f))

const patterns = new Set<string>()
const reasons = new Set<string>()
const instants = new Set<string>()

for (const f of files) {
  const doc = JSON.parse(readFileSync(f, 'utf8')) as {
    entries: {
      expect: {
        patterns?: string[]
        reason?: string
        payouts?: { key: string }[]
      }
    }[]
  }
  for (const e of doc.entries) {
    for (const p of e.expect.patterns ?? []) patterns.add(p)
    if (e.expect.reason) reasons.add(e.expect.reason)
    for (const p of e.expect.payouts ?? []) instants.add(p.key)
  }
}

const keys = new Set(Object.keys(en))

// Both app surfaces: src/ui/ is the frozen Run 3 app still served at `/`, and
// src/v3/ is the Run 4 preview at `/v3/`. A string is live if EITHER renders it.
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`],
  )
const uiFiles = ['../ui/', '../v3/']
  .flatMap((d) => walk(fileURLToPath(new URL(d, import.meta.url))))
  .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'))

describe('i18n coverage', () => {
  it('names every hand pattern the engine can produce', () => {
    const missing = [...patterns].filter((p) => !keys.has(`pattern.${p}`)).sort()
    expect(missing, `no string for pattern.${missing.join(', pattern.')}`).toEqual([])
  })

  it('explains every rejection the engine can return', () => {
    const missing = [...reasons].filter((r) => !keys.has(`reject.${r}`)).sort()
    expect(missing, `no string for reject.${missing.join(', reject.')}`).toEqual([])
  })

  it('names every instant payout', () => {
    const missing = [...instants].filter((p) => !keys.has(`instant.${p}`)).sort()
    expect(missing, `no string for instant.${missing.join(', instant.')}`).toEqual([])
  })

  it('covers all four winds', () => {
    for (const w of ['E', 'S', 'W', 'N']) expect(keys.has(`wind.${w}`)).toBe(true)
  })

  it('names every bonus tile', () => {
    for (const b of ['F1', 'F2', 'F3', 'F4', 'S1', 'S2', 'S3', 'S4',
                     'cat', 'rat', 'rooster', 'centipede']) {
      expect(keys.has(`tile.bonus.${b}`), `no string for tile.bonus.${b}`).toBe(true)
    }
  })

  it('resolves every t() key used in the UI', () => {
    const missing: string[] = []
    for (const file of uiFiles) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/\bt\(\s*'([^']+)'/g)) {
        const key = m[1]!
        if (!keys.has(key)) missing.push(`${file.split('/').pop()}: ${key}`)
      }
    }
    expect(missing, `t() keys with no string`).toEqual([])
  })

  it('has no dead strings in the bundle', () => {
    const src = uiFiles.map((f) => readFileSync(f, 'utf8')).join('\n')
    // Keys reached through a template are enumerated exactly, rather than
    // waved through by prefix — a loose allowlist hides dead strings.
    const WINDS = ['E', 'S', 'W', 'N']
    const BONUS = ['F1', 'F2', 'F3', 'F4', 'S1', 'S2', 'S3', 'S4',
                   'cat', 'rat', 'rooster', 'centipede']
    const FLAGS = ['robbingKong', 'lastTile', 'kongReplacement', 'flowerReplacement',
                   'heavenly', 'earthly', 'humanly', 'kongOnKong', 'pao']
    const EXPLAINED = FLAGS
    const GROUPS = ['characters', 'dots', 'bamboo', 'winds', 'dragons',
                    'flowers', 'seasons', 'animals']
    const reachable = new Set<string>([
      ...[...patterns].map((p) => `pattern.${p}`),
      // The engine emits no component for a plain hand; the results screen
      // names it when nothing else applied. See Results.tsx.
      'pattern.chickenHand',
      ...[...reasons].map((r) => `reject.${r}`),
      ...[...instants].map((i) => `instant.${i}`),
      ...WINDS.flatMap((w) => [`wind.${w}`, `wind.${w}.short`]),
      ...['m', 'p', 's'].map((x) => `tile.suit.${x}`),
      ...['C', 'F', 'P'].flatMap((x) => [`tile.name.${x}`, `tile.name.${x}.short`]),
      ...BONUS.flatMap((b) => [`tile.bonus.${b}`, `tile.bonus.${b}.short`]),
      ...FLAGS.map((f) => `flag.${f}`),
      ...GROUPS.map((g) => `tileinfo.group.${g}`),
      // Rendered through tv() or a variant id, not a literal.
      'tileinfo.jokers.singapore', 'tileinfo.jokers.hongkong',
      'table.payment.full', 'table.payment.half',
      ...['singapore', 'hongkong'].flatMap((v) => [`variant.${v}.name`, `variant.${v}.blurb`]),
      // The prediction panel's sparse-hand nudges, keyed by what the tiles lean towards.
      ...['flush:m', 'flush:p', 'flush:s', 'honours', 'allPong', 'terminals']
        .flatMap((h) => [`predict.hint.${h}`, `predict.hint.${h}.name`]),
      // The language switch names each language in its own language.
      'lang.en', 'lang.id',
      ...['characters', 'dots', 'bamboo', 'honours', 'bonus'].map((x) => `hand.tab.${x}`),
      ...['Chow', 'Pong', 'Kong'].flatMap((k) => [
        `hand.declare${k}`, `hand.declare${k}Sub`, `hand.tag${k}`,
      ]),
      ...EXPLAINED.flatMap((f) => [`flag.${f}.sub`, `flag.${f}.detail`]),
    ])
    // A key ending .singapore / .hongkong is reached through tv(), which
    // falls back to the un-suffixed key — so the base key appearing in the
    // source is what makes the variant-specific one live.
    const VARIANTS = ['singapore', 'hongkong']
    const live = (k: string): boolean => {
      if (src.includes(`'${k}'`) || reachable.has(k)) return true
      for (const v of VARIANTS) {
        if (k.endsWith(`.${v}`)) {
          const base = k.slice(0, -(v.length + 1))
          if (src.includes(`'${base}'`) || reachable.has(base)) return true
        }
      }
      return false
    }
    const dead = [...keys].filter((k) => !live(k))
    expect(dead, 'strings nothing renders').toEqual([])
  })

  it('has no template key without a string', () => {
    // The mirror of the test above: every key a template can reach must exist.
    for (const w of ['E', 'S', 'W', 'N']) {
      expect(keys.has(`wind.${w}.short`), `wind.${w}.short`).toBe(true)
    }
    for (const dgn of ['C', 'F', 'P']) {
      expect(keys.has(`tile.name.${dgn}.short`), `tile.name.${dgn}.short`).toBe(true)
    }
  })

  it('keeps user-visible text out of the components', () => {
    // A crude but effective tripwire: a JSX text node of two or more Latin
    // words that never passed through t().
    const offenders: string[] = []
    for (const file of uiFiles.filter((f) => f.endsWith('.tsx'))) {
      const src = readFileSync(file, 'utf8')
      for (const m of src.matchAll(/>\s*([A-Za-z][A-Za-z',.!?-]*(?:\s+[A-Za-z][A-Za-z',.!?-]*)+)\s*</g)) {
        offenders.push(`${file.split('/').pop()}: ${m[1]}`)
      }
    }
    expect(offenders, 'hardcoded UI text').toEqual([])
  })

  it('found a non-trivial corpus to check against', () => {
    expect(patterns.size).toBeGreaterThan(25)
    expect(reasons.size).toBeGreaterThan(5)
  })

  it('names every pattern in the regional form each variant uses', () => {
    // A .hongkong string is only safe if Singapore has an answer too: either
    // an un-suffixed base that tv() falls back to, or its own .singapore
    // sibling. Otherwise the Singapore screen renders a raw key.
    for (const k of Object.keys(en)) {
      if (!k.endsWith('.hongkong')) continue
      const base = k.slice(0, -'.hongkong'.length)
      expect(
        keys.has(base) || keys.has(`${base}.singapore`),
        `${k} leaves Singapore with no string for ${base}`,
      ).toBe(true)
    }
  })
})

// ─────────────────────────────────────────────────────────────────────
// The Indonesian bundle. The glossary in docs/GLOSSARY-ID.md is binding,
// and these are the parts of it a machine can hold.
// ─────────────────────────────────────────────────────────────────────
import id from './id.json'

const idKeys = new Set(Object.keys(id as Record<string, string>))
const idOf = id as Record<string, string>
const enOf = en as Record<string, string>

/** The five words the glossary allows to stay as they are, and no others. */
const BORROWED = ['Mahjongyuk', 'fan', 'pong', 'kong', 'chow']

describe('Bahasa Indonesia', () => {
  it('translates every key the English bundle has', () => {
    const missing = [...keys].filter((k) => !idKeys.has(k)).sort()
    expect(missing, `no Indonesian for ${missing.length} keys`).toEqual([])
  })

  it('has no key the English bundle does not', () => {
    const extra = [...idKeys].filter((k) => !keys.has(k)).sort()
    expect(extra, 'Indonesian keys with no English source').toEqual([])
  })

  it('is never left blank', () => {
    const blank = [...idKeys].filter((k) => !idOf[k]!.trim()).sort()
    expect(blank).toEqual([])
  })

  it('carries every placeholder across, exactly', () => {
    // A dropped {name} is a sentence with a hole in it; a renamed one is a
    // sentence that prints "{nama}" at a mahjong table.
    const wrong: string[] = []
    for (const k of idKeys) {
      const want = [...(enOf[k] ?? '').matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort()
      const got = [...idOf[k]!.matchAll(/\{(\w+)\}/g)].map((m) => m[1]!).sort()
      if (want.join(',') !== got.join(',')) wrong.push(`${k}: [${want}] vs [${got}]`)
    }
    expect(wrong, 'placeholders that do not match').toEqual([])
  })

  it('leaves the marks carved on a tile alone', () => {
    // CJK inside a string is content — what is physically on the tile — and is
    // identical in both locales.
    const cjk = (s: string) => [...s].filter((c) => /[㐀-鿿]/.test(c)).join('')
    const wrong: string[] = []
    for (const k of idKeys) {
      if (cjk(enOf[k] ?? '') !== cjk(idOf[k]!)) wrong.push(k)
    }
    expect(wrong, 'CJK changed in translation').toEqual([])
  })

  it('borrows only the five words the glossary allows', () => {
    // A crude but effective net: an ASCII word of four letters or more that
    // appears in the English string and survives unchanged into the Indonesian
    // one is either a borrowing or a miss.
    const allowed = new Set(BORROWED.map((w) => w.toLowerCase()))
    // Placeholder NAMES are not words — they are identifiers, and a separate
    // test above requires them to survive unrenamed. Strip them first.
    const words = (s: string) =>
      (s.replace(/\{\w+\}/g, ' ').toLowerCase().match(/[a-z]{4,}/g) ?? [])
    // Proper nouns, and words that are KBBI headwords in Indonesian in their
    // own right — absorbed loanwords, not English mixing. A player writing
    // Indonesian writes "menu", "bonus" and "minimum".
    const SHARED = new Set([
      'mahjong', 'hong', 'kong', 'singapura', 'singapore', 'total', 'player',
      'timur', 'selatan', 'barat', 'utara', 'english', 'bahasa', 'indonesia',
      'menu', 'bonus', 'minimum', 'joker', 'poin', 'meja',
    ])
    const offenders: string[] = []
    for (const k of idKeys) {
      const enWords = new Set(words(enOf[k] ?? ''))
      for (const w of words(idOf[k]!)) {
        if (allowed.has(w) || SHARED.has(w)) continue
        if (enWords.has(w)) offenders.push(`${k}: "${w}"`)
      }
    }
    expect(offenders, 'English left in the Indonesian bundle').toEqual([])
  })

  it('keeps the brand and its invitation', () => {
    expect(idOf['app.name']).toBe('Mahjongyuk')
    // The name IS the invitation, so the Indonesian front door has to say it.
    const front = `${idOf['app.tagline'] ?? ''} ${idOf['variant.play'] ?? ''} ${idOf['variant.title'] ?? ''}`
    expect(front.toLowerCase(), 'the Indonesian front door has lost its "yuk"').toContain('yuk')
  })

  it('names the languages in their own language', () => {
    expect(LOCALE_NAMES.en).toBe('English')
    expect(LOCALE_NAMES.id).toBe('Bahasa Indonesia')
  })
})

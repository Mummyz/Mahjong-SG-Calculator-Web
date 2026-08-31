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
import { ENGLISH_ONLY, LOCALE_NAMES, TRANSLATED } from './index'

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

  /**
   * THE SHARED-BUNDLE TRAP, and Run 5 walked straight into it.
   *
   * src/ui/ is the FROZEN Run 3 app still served at `/`. Its components
   * cannot be edited — but it reads the SAME en.json as the app being built.
   * Run 5 gave hand.bonusNone a {groups} placeholder for the new screen, and
   * the frozen screen, which calls it with no variables, would have printed
   * "{groups} — none" to a player at `/`.
   *
   * So: a key called WITHOUT a variables object must have no placeholder in
   * it. That is checkable, and now it is checked.
   */
  it('never gives a placeholder to a string that is called without one', () => {
    const offenders: string[] = []
    for (const file of uiFiles) {
      const src = readFileSync(file, 'utf8')
      // t('key') closed immediately — no comma, so no variables passed.
      for (const m of src.matchAll(/\bt\(\s*'([^']+)'\s*\)/g)) {
        const key = m[1]!
        const val = (en as Record<string, string>)[key]
        if (val && /\{\w+\}/.test(val)) {
          offenders.push(`${file.split('/').slice(-2).join('/')}: t('${key}') → "${val}"`)
        }
      }
    }
    expect(offenders, 'a placeholder that will print verbatim').toEqual([])
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
  /**
   * LOCALISATION, NOT TRANSLATION — the owner's bar for Run 7.
   *
   * The switch reaches the sentences that explain, warn, count and settle.
   * It does NOT reach the words a player taps or the words that NAME things.
   * src/i18n/scope.ts decides which is which; this suite holds both halves to
   * what the decision implies, and holds the Indonesian to the glossary.
   *
   * The false friend the owner named is the shape of the whole risk: "Score
   * this hand" must never become "Skor tangan ini", because "tangan" is a
   * body part and a mahjong hand is a set of tiles. A machine cannot judge
   * naturalness — the Language Critic does that — but it CAN refuse the
   * specific words the glossary forbids, and it can prove the scope is total.
   */
  const LIVE = [...TRANSLATED].filter((k) => keys.has(k))
  const ENGLISH = [...ENGLISH_ONLY].filter((k) => keys.has(k))

  it('classifies every string in the bundle, one way or the other', () => {
    const unclassified = [...keys].filter(
      (k) => !TRANSLATED.has(k) && !ENGLISH_ONLY.has(k))
    expect(unclassified, 'a string with no scope decision').toEqual([])
    const both = [...keys].filter((k) => TRANSLATED.has(k) && ENGLISH_ONLY.has(k))
    expect(both, 'a string classified twice').toEqual([])
    // A new key is TRANSLATED by default, so the English side can only grow
    // deliberately. If this number moves, somebody made a scope decision.
    expect(ENGLISH.length, 'the English side changed size').toBe(207)
  })

  it('leaves every word a thumb lands on in English', () => {
    // Buttons, screen titles, tile names, hand names, circumstance names.
    // These are the strings whose whole value is that they never move.
    for (const k of ['nav.continue', 'hand.declare', 'hand.undo', 'hand.clear',
      'hand.scoreReady', 'result.nextHand', 'result.editHand', 'variant.play',
      'wizard.finish', 'menu.close', 'variant.title', 'result.title',
      'hand.yourHand', 'predict.title', 'app.tagline', 'tile.suit.p',
      'pattern.fullFlush', 'flag.heavenly', 'wind.E']) {
      expect(TRANSLATED.has(k), `${k} must stay English`).toBe(false)
    }
  })

  it('translates every sentence that explains, warns, counts or settles', () => {
    for (const k of ['hand.needTiles', 'hand.notAHand', 'predict.need',
      'predict.drop', 'predict.awayN', 'result.payments', 'result.paysVerb',
      'result.youCollect', 'wizard.whichTile', 'wizard.howWon', 'hand.threwIt',
      'pattern.selfDraw', 'pattern.noFlowers', 'pattern.seatWind',
      'pattern.seatFlower', 'flag.heavenly.sub', 'flag.heavenly.detail',
      'table.stakeHint', 'tileinfo.groupCount', 'reject.wrongTileCount']) {
      expect(TRANSLATED.has(k), `${k} must be localised`).toBe(true)
    }
  })

  describe('the strings a player reads', () => {
    it.each(LIVE)('%s is written in Indonesian', (k) => {
      const v = idOf[k]!
      expect(v.trim().length, 'blank').toBeGreaterThan(0)
      // A string that is byte-identical to the English was never localised —
      // unless every word in it is one the glossary keeps: a borrowing, or a
      // NAME that is English on purpose. "Concealed kong" is both.
      const kept = new Set([
        ...BORROWED.map((w) => w.toLowerCase()),
        ...[...ENGLISH_ONLY].flatMap((e) => (enOf[e] ?? '').toLowerCase().match(/[a-z]{2,}/g) ?? []),
      ])
      const own = (v.replace(/\{\w+\}/g, ' ').toLowerCase().match(/[a-z]{2,}/g) ?? [])
        .filter((w) => !kept.has(w))
      if (own.length > 0) {
        expect(v, 'still the English string').not.toBe(enOf[k])
      }
    })

    /**
     * There WAS a test here that demanded an Indonesian function word in any
     * string whose English ran to four words or more. It failed nineteen
     * perfectly good strings — "Kena batas {limit} fan — aslinya {raw} fan."
     * has no dan, yang or untuk in it and is flawless Indonesian — because
     * Indonesian says the same thing in fewer, denser words than English.
     *
     * A machine cannot judge whether a sentence sounds like a person. That is
     * the Language Critic's job, and it does it by having native speakers read
     * the Indonesian with the English hidden. What a machine CAN do is refuse
     * the specific words the glossary bans and catch a string that was never
     * touched at all, which is what the tests around this comment do.
     */

    it.each(LIVE)('%s never calls a mahjong hand a body part', (k) => {
      // THE OWNER'S TEST CASE. "tangan" is an arm; a hand is a set of tiles.
      // "tangan" is allowed nowhere in the bundle, in any inflection.
      expect(idOf[k]!, `"tangan" in ${k}`).not.toMatch(/\btangan\b/i)
      // and the pieces are kartu, never ubin
      expect(idOf[k]!, `"ubin" in ${k}`).not.toMatch(/\bubin\b/i)
    })

    it.each(LIVE)('%s borrows only what the glossary allows', (k) => {
      // Loanwords Indonesian has absorbed and KBBI lists as headwords. A
      // player writing Indonesian writes "menu", "bonus", "total".
      const ABSORBED = ['menu', 'bonus', 'total', 'minimum', 'poin', 'meja',
        'set', 'grup', 'seri', 'standar', 'variasi', 'kombinasi']
      const allowed = new Set([
        ...BORROWED.map((w) => w.toLowerCase()), ...ABSORBED, 'hong', 'kong',
      ])
      const words = (x: string) =>
        (x.replace(/\{\w+\}/g, ' ').toLowerCase().match(/[a-z]{3,}/g) ?? [])
      // A NAME that stays English on purpose may legitimately appear inside an
      // Indonesian sentence — "Full Flush" in an explanation of Full Flush.
      const names = new Set(ENGLISH.flatMap((e) => words(enOf[e] ?? '')))
      const enWords = new Set(words(enOf[k] ?? ''))
      const left = words(idOf[k]!)
        .filter((w) => enWords.has(w) && !allowed.has(w) && !names.has(w))
      expect(left, `English left in ${k}`).toEqual([])
    })
  })

  /**
   * id.json holds the translated set and NOTHING else.
   *
   * Run 5 kept a full parallel bundle so it would not rot while the policy
   * was narrow. Run 7 made the policy the point: a key that is English by
   * decision has no Indonesian, because there is no Indonesian to have. A
   * spare translation sitting behind an English-by-decision key is dead
   * weight that the next contributor would reasonably assume is live.
   */
  it('has an Indonesian string for every key the switch reaches', () => {
    const missing = LIVE.filter((k) => !idKeys.has(k)).sort()
    expect(missing, `${missing.length} keys would fall back to English`).toEqual([])
  })

  it('has no Indonesian for a key that is English by decision', () => {
    const dead = [...idKeys].filter((k) => ENGLISH_ONLY.has(k)).sort()
    expect(dead, 'a translation nothing can ever read').toEqual([])
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

  it('keeps the brand spelled the one way it is spelled', () => {
    // app.name is English by decision, so it has no Indonesian to check — and
    // that is the point: the brand is one word in both modes.
    expect(enOf['app.name']).toBe('Mahjongyuk')
    expect(ENGLISH_ONLY.has('app.name')).toBe(true)
  })

  it('names the languages in their own language', () => {
    expect(LOCALE_NAMES.en).toBe('English')
    expect(LOCALE_NAMES.id).toBe('Bahasa Indonesia')
  })
})

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

const corpusDir = fileURLToPath(new URL('../engine/corpus/singapore/', import.meta.url))
const files = readdirSync(corpusDir).filter((f) => f.endsWith('.json'))

const patterns = new Set<string>()
const reasons = new Set<string>()
const instants = new Set<string>()

for (const f of files) {
  const doc = JSON.parse(readFileSync(corpusDir + f, 'utf8')) as {
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

const uiDir = fileURLToPath(new URL('../ui/', import.meta.url))
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`],
  )
const uiFiles = walk(uiDir).filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'))

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
                   'heavenly', 'earthly', 'humanly', 'kongOnKong', 'pao',
                   'disabled.dealerOnly', 'disabled.nonDealerOnly', 'disabled.needsTwoKongs']
    const EXPLAINED = FLAGS.filter((f) => !f.startsWith('disabled.'))
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
      ...BONUS.map((b) => `tile.bonus.${b}`),
      ...FLAGS.map((f) => `flag.${f}`),
      ...GROUPS.map((g) => `tileinfo.group.${g}`),
      ...['characters', 'dots', 'bamboo', 'honours', 'bonus'].map((x) => `hand.tab.${x}`),
      ...['Chow', 'Pong', 'Kong'].flatMap((k) => [
        `hand.declare${k}`, `hand.declare${k}Sub`, `hand.tag${k}`,
      ]),
      ...EXPLAINED.flatMap((f) => [`flag.${f}.sub`, `flag.${f}.detail`]),
    ])
    const dead = [...keys].filter((k) => !src.includes(`'${k}'`) && !reachable.has(k))
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
})

/**
 * No variant may ever show another variant's tiles.
 *
 * Run 4 shipped with the Hong Kong flower tray offering Singapore's animals,
 * because the hand-entry screen listed the bonus tiles as literals instead of
 * asking the variant. These tests are the guard: the first group proves the
 * inventory is right, and the second proves no screen can go round it.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { VARIANTS, VARIANT_IDS, inventoryOf, playsTile, keepPlayable } from './index'
import { ANIMALS, FLOWERS, SEASONS, DRAGONS, WINDS, SUITS } from '../core/tiles'

const SUITED = SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`))

describe('what each variant has on the table', () => {
  it('gives Hong Kong flowers and seasons and NOTHING else in the tray', () => {
    const inv = inventoryOf(VARIANTS.hongkong)
    expect([...inv.bonusTiles].sort()).toEqual([...FLOWERS, ...SEASONS].sort())
    for (const a of ANIMALS) {
      expect(inv.bonusTiles.has(a), `Hong Kong must not offer ${a}`).toBe(false)
      expect(playsTile(VARIANTS.hongkong, a)).toBe(false)
    }
  })

  it('gives Singapore the animals as well', () => {
    const inv = inventoryOf(VARIANTS.singapore)
    expect([...inv.bonusTiles].sort()).toEqual([...FLOWERS, ...SEASONS, ...ANIMALS].sort())
  })

  it('gives both variants the same wall', () => {
    for (const id of VARIANT_IDS) {
      const inv = inventoryOf(VARIANTS[id])
      expect([...inv.wallTiles].sort()).toEqual([...SUITED, ...WINDS, ...DRAGONS].sort())
    }
  })

  it('counts to each variant\'s declared total', () => {
    for (const id of VARIANT_IDS) {
      const v = VARIANTS[id]
      const n = v.tileSet.groups.reduce((sum, g) => sum + g.tiles.length * g.copies, 0)
      expect(n, `${id} tile count`).toBe(v.tileSet.total)
    }
    expect(VARIANTS.hongkong.tileSet.total).toBe(144)
    expect(VARIANTS.singapore.tileSet.total).toBe(148)
  })

  it('splits every group into either the wall or the tray, never both, never neither', () => {
    for (const id of VARIANT_IDS) {
      const v = VARIANTS[id]
      const inv = inventoryOf(v)
      expect(inv.wallGroups.length + inv.bonusGroups.length).toBe(v.tileSet.groups.length)
      for (const g of inv.wallGroups) {
        for (const t of g.tiles) expect(inv.bonusTiles.has(t as never)).toBe(false)
      }
    }
  })

  it('strips tiles a variant does not play when a table changes game', () => {
    expect(keepPlayable(VARIANTS.hongkong, ['F1', 'cat', 'S3', 'rat'])).toEqual(['F1', 'S3'])
    expect(keepPlayable(VARIANTS.singapore, ['F1', 'cat', 'S3', 'rat']))
      .toEqual(['F1', 'cat', 'S3', 'rat'])
  })

  it('offers only the circumstances a variant scores', () => {
    // RULING HK15 — Hong Kong pays nothing for a flower replacement.
    expect(VARIANTS.hongkong.flags).not.toContain('flowerReplacement')
    expect(VARIANTS.singapore.flags).toContain('flowerReplacement')
    for (const id of VARIANT_IDS) {
      expect(new Set(VARIANTS[id].flags).size, `${id} lists a flag twice`)
        .toBe(VARIANTS[id].flags.length)
    }
  })

  it('scores nothing for a circumstance the variant does not list', () => {
    const hand = { concealed: '111m 333m 555p 777s 99s', melds: [], bonus: [] }
    const ctx = {
      seat: 'S', prevailing: 'E', win: 'selfDraw', winningTile: '9s',
      flags: ['flowerReplacement'],
    } as const
    const r = VARIANTS.hongkong.score(hand, ctx)
    expect(r.valid).toBe(true)
    if (r.valid) expect(r.patterns).not.toContain('flowerReplacement')
  })
})

// ── the guard that stops a screen going round the inventory ─────────────
const v3Dir = fileURLToPath(new URL('../../v3/', import.meta.url))
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`])
const v3Files = walk(v3Dir).filter((f) => /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f))

describe('no screen decides for itself which tiles exist', () => {
  it('found the v3 sources to check', () => {
    expect(v3Files.length).toBeGreaterThan(5)
  })

  it('never imports a tile constant into a screen', () => {
    // ANIMALS / FLOWERS / SEASONS in a component is exactly the bug: a list of
    // tiles that does not know which game is being played. The inventory is
    // the only way to ask.
    const offenders: string[] = []
    for (const f of v3Files) {
      const src = readFileSync(f, 'utf8')
      for (const m of src.matchAll(/import\s*\{([^}]*)\}\s*from/g)) {
        const named = m[1]!.split(',').map((x) => x.trim().replace(/^type\s+/, ''))
        for (const n of named) {
          if (n === 'ANIMALS' || n === 'FLOWERS' || n === 'SEASONS') {
            offenders.push(`${f.split('/').slice(-2).join('/')}: ${n}`)
          }
        }
      }
    }
    expect(offenders, 'a screen hardcoding a tile list').toEqual([])
  })

  it('never hardcodes an animal name in a screen', () => {
    const offenders: string[] = []
    for (const f of v3Files) {
      const src = readFileSync(f, 'utf8')
      // 'cat' / 'rat' / 'rooster' / 'centipede' as string literals.
      if (/'(cat|rat|rooster|centipede)'/.test(src)) {
        offenders.push(f.split('/').slice(-2).join('/'))
      }
    }
    expect(offenders, 'a screen naming a Singapore-only tile').toEqual([])
  })

  /**
   * THE LEAKAGE BUG, IN WORDS.
   *
   * The Run 4 guards above stop a screen naming a tile group in CODE. Run 5
   * found the same bug living in a STRING: the bonus summary read "Flowers,
   * seasons, animals — none" on a Hong Kong table, which plays no animals.
   * A string that names a group belongs to the group, not to a screen.
   */
  it('never names the animals in a string both variants are shown', () => {
    const en = JSON.parse(readFileSync(
      fileURLToPath(new URL('../../i18n/en.json', import.meta.url)), 'utf8',
    )) as Record<string, string>
    // ANIMALS is the only group that is not in both sets, so it is the only
    // word that can lie. Flowers and seasons are on both tables.
    //
    // Legitimately allowed to say it: the group's own label and tile names;
    // a string scoped to one variant by its key; a flag's explanation, since
    // the flags themselves are variant-gated by the test above; and the /app/
    // engine harness, which is not the product.
    // A key ending in a variant name is scoped by tv() to that variant; a
    // key that HAS such a sibling is the other variant's branch, and tv()
    // never reaches it from the one with a sibling.
    // pattern.* and instant.* are ENGINE output: a name only reaches a
    // player when the engine emitted the pattern, and only Singapore can
    // emit an animal. variant.<id>.* is each variant describing itself.
    const OK = new RegExp(String.raw`^(tileinfo\.group\.|tile\.bonus\.|hand\.tab\.`
      + String.raw`|flag\.|harness\.|pattern\.|instant\.|variant\.(singapore|hongkong)\.)`
      + String.raw`|\.(singapore|hongkong)$`)
    const offenders = Object.entries(en)
      .filter(([k, v]) => !OK.test(k) && !(`${k}.hongkong` in en) && /\banimals?\b/i.test(v))
      .map(([k, v]) => `${k}: "${v}"`)
    expect(offenders, 'the animals named in copy Hong Kong also sees').toEqual([])
  })

  it('builds the bonus summary from the variant rather than from English', () => {
    const en = JSON.parse(readFileSync(
      fileURLToPath(new URL('../../i18n/en.json', import.meta.url)), 'utf8',
    )) as Record<string, string>
    expect(en['hand.bonusNoneIn'], 'must take the groups as a placeholder')
      .toMatch(/\{groups\}/)
    // `hand.bonusNone` — the variant-neutral form the frozen root rendered
    // with no variables — went with that app at v3.0.0. What has to stay true
    // is that the summary names the groups the VARIANT has, never a list
    // written into English: Hong Kong has no animals.
    expect(en['hand.bonusNoneIn']).not.toMatch(/\bAnimals?\b/)
    expect(en['hand.bonusNone'], 'retired with the Run 3 app').toBeUndefined()
  })
})

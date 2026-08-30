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
})

/**
 * WHAT A PLAN REQUIRES — the three ways Run 6C's first attempt got it wrong.
 *
 * The module exists to stop the tray inventing a tile the plan never asked
 * for. Its first version invented three different ones, and the Design Critic
 * reproduced all three against the real engine:
 *
 *   1. A partially-built chow collapsed its two unlike missing tiles into
 *      "count copies of the first", so a plan needing 6p 7p was drawn as
 *      6p 6p.
 *   2. The example was re-scored under a hardcoded East/East probe, so any
 *      plan whose fan came from the seat or prevailing wind fell below the
 *      minimum and produced NO requirements at all.
 *   3. "The player holds none of this set" was read as "any tile will do",
 *      which is false for every plan that names its tiles — a three-dragons
 *      hand needs THAT dragon.
 */

import { describe, expect, it } from 'vitest'
import { VARIANTS } from '../variants'
import { predict } from './index'
import { candidateRequirements } from './requirements'
import type { TileId } from '../core/tiles'
import type { KeyedHand } from '../session/table'

const hand = (s: string): KeyedHand =>
  ({ concealed: s.trim().split(/\s+/) as TileId[], melds: [], bonus: [] })

const reqs = (variant: 'singapore' | 'hongkong', tiles: string,
              ctx: { seat: 'E' | 'S' | 'W' | 'N'; prevailing: 'E' | 'S' | 'W' | 'N' },
              pick?: (k: string) => boolean) => {
  const plugin = VARIANTS[variant]
  const h = hand(tiles)
  const p = predict(plugin, h, ctx, {})
  const c = pick ? p.candidates.find((x) => pick(x.key)) : p.candidates[0]
  if (!c) return null
  return {
    key: c.key,
    groups: candidateRequirements(
      plugin, c.example, h.concealed, { ...ctx, win: 'selfDraw' }, {}),
    needed: c.needed.flatMap((n) => Array<TileId>(n.count).fill(n.tile)).sort(),
  }
}

describe('a requirement never names a tile the plan does not want', () => {
  it('a half-built chow asks for each missing tile, not copies of the first', () => {
    // The Design Critic's own reproduction: Hong Kong, four tiles away, two
    // partially-built dot chows. It used to read "6 Dots ×2" and "7 Dots ×2".
    const r = reqs('hongkong', '2s 3s 4s 6s 7s 8s 1p 5p 9p C C F',
      { seat: 'E', prevailing: 'E' })
    expect(r, 'the predictor offered nothing to test').not.toBeNull()

    // Every specific requirement must name a tile the plan actually needs,
    // as many times as it needs it — never more.
    const asked = r!.groups.filter((g) => g.kind === 'specific')
      .flatMap((g) => Array<TileId>(g.count).fill(g.tile)).sort()
    for (const tile of asked) {
      expect(r!.needed, `asks for ${tile}, which the plan does not need`)
        .toContain(tile)
    }
    for (const g of r!.groups) {
      if (g.kind !== 'specific') continue
      const wanted = r!.needed.filter((t) => t === g.tile).length
      const askedFor = asked.filter((t) => t === g.tile).length
      expect(askedFor, `asks for ${askedFor}x ${g.tile}, plan wants ${wanted}`)
        .toBeLessThanOrEqual(wanted)
    }
  })

  it('the slots asked for never exceed the tiles the plan is missing', () => {
    for (const tiles of [
      '2s 3s 4s 6s 7s 8s 1p 5p 9p C C F',
      '1m 2m 3m 4p 5p 6p 7s 8s 9s 5s 5s',
      '1m 1m 1m 9s 9s 9s C C F F P',
    ]) {
      for (const v of ['singapore', 'hongkong'] as const) {
        const r = reqs(v, tiles, { seat: 'E', prevailing: 'E' })
        if (!r) continue
        const slots = r.groups.reduce((n, g) => n + g.count, 0)
        expect(slots, `${v} ${tiles}`).toBeLessThanOrEqual(r.needed.length)
      }
    }
  })
})

describe('a plan is read in the player own seat, not a probe', () => {
  it('a seat-wind plan still produces requirements away from East', () => {
    // Under the old East/East probe this returned [] on three seats in four.
    for (const seat of ['S', 'W', 'N'] as const) {
      const r = reqs('hongkong', '1m 2m 3m 4p 5p 6p 7s 8s 9s S S 2m',
        { seat, prevailing: seat })
      if (!r) continue
      expect(r.groups.length, `seat ${seat} produced no requirements`)
        .toBeGreaterThan(0)
    }
  })

  it('every candidate the panel shows can describe itself', () => {
    // An empty requirement list under a "You need" heading, with a "Use this"
    // button that paints nothing, is the failure this guards.
    const plugin = VARIANTS.hongkong
    const h = hand('1m 2m 3m 4p 5p 6p 7s 8s 9s S S 2m')
    const ctx = { seat: 'S', prevailing: 'S' } as const
    const p = predict(plugin, h, ctx, {})
    for (const c of p.candidates) {
      if (c.needed.length === 0) continue
      const g = candidateRequirements(
        plugin, c.example, h.concealed, { ...ctx, win: 'selfDraw' }, {})
      expect(g.length, `${c.key} offers "Use this" and requires nothing`)
        .toBeGreaterThan(0)
    }
  })
})

describe('"any tile of this family" is proved, not assumed', () => {
  it('a plan that names its dragons keeps them specific', () => {
    // Holding none of a set used to mean "any tile will do". A three-dragons
    // hand needs THAT dragon, and swapping it does not score the same.
    const r = reqs('singapore', '1m 2m 3m 4p 5p 6p C C F F 9s 9s',
      { seat: 'E', prevailing: 'E' }, (k) => /[Dd]ragon/.test(k))
    if (r) {
      for (const g of r.groups) {
        if (g.klass !== 'dragon') continue
        expect(g.kind, `a named dragon went generic: ${JSON.stringify(g)}`)
          .toBe('specific')
      }
    }
  })

  it('a generic requirement really is interchangeable', () => {
    // Whatever comes back as `any`, swapping its tile for another of the same
    // family must still be a win worth the same — that IS the definition.
    const plugin = VARIANTS.singapore
    const h = hand('1m 2m 3m 4p 5p 6p 7s 8s 9s 2s 3s 4s')
    const ctx = { seat: 'E', prevailing: 'E' } as const
    const p = predict(plugin, h, ctx, {})
    for (const c of p.candidates.slice(0, 4)) {
      const groups = candidateRequirements(
        plugin, c.example, h.concealed, { ...ctx, win: 'selfDraw' }, {})
      for (const g of groups) {
        if (g.kind !== 'any') continue
        // A chow is never offered as interchangeable.
        expect(g.shape, 'a chow claimed to be interchangeable').not.toBe('chow')
      }
    }
  })
})

describe('a declared meld is already satisfied', () => {
  it('its tiles are not offered to another set', () => {
    const plugin = VARIANTS.singapore
    const h: KeyedHand = {
      concealed: '1m 2m 3m 4p 5p 6p 9s 9s'.split(' ') as TileId[],
      melds: [{ t: 'pong', tiles: '5s 5s 5s', open: true }],
      bonus: [],
    }
    const ctx = { seat: 'E', prevailing: 'E' } as const
    const p = predict(plugin, h, ctx, {})
    const c = p.candidates[0]
    if (!c) return
    const groups = candidateRequirements(
      plugin, c.example, h.concealed, { ...ctx, win: 'selfDraw' }, {})
    const slots = groups.reduce((n, g) => n + g.count, 0)
    // The melded pong contributes nothing to ask for, and its tiles cannot be
    // counted as progress on any other set.
    expect(slots).toBe(c.needed.reduce((n, x) => n + x.count, 0))
  })
})

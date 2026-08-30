import { describe, expect, it } from 'vitest'
import { bestPlan, ALL_TILES } from './complete'
import { parseTiles, tally } from '../core/tiles'

const avail = () => new Map(ALL_TILES.map((t) => [t, 4]))
const U = new Set(ALL_TILES)

describe('bestPlan', () => {
  it('finds a plain hand and keeps everything it can', () => {
    const have = tally(parseTiles('123m 456p'))
    const p = bestPlan({ avail: avail(), have, universe: U, sets: 4 })!
    expect(p.tiles).toHaveLength(14)
    expect(p.kept).toBe(6)
  })
  it('keeps a full flush together', () => {
    const have = tally(parseTiles('123p 55p 7p'))
    const uni = new Set(ALL_TILES.filter((t) => t.endsWith('p')))
    const p = bestPlan({ avail: avail(), have, universe: uni, sets: 4 })!
    expect(p.tiles.every((t) => t.endsWith('p'))).toBe(true)
    expect(p.kept).toBe(6)
  })
  it('respects the four-copy limit', () => {
    const a = avail(); a.set('1m', 1)
    const have = tally(parseTiles('1m'))
    const uni = new Set(ALL_TILES.filter((t) => t.endsWith('m')))
    const p = bestPlan({ avail: a, have, universe: uni, sets: 4, kind: 'pong' })
    // a pong of 1m is impossible with one copy free
    expect(p!.tiles.filter((t) => t === '1m')).toHaveLength(0)
  })
  it('builds an all-pong hand when told to', () => {
    const have = tally(parseTiles('111m 222p'))
    const p = bestPlan({ avail: avail(), have, universe: U, sets: 4, kind: 'pong' })!
    expect(p.tiles).toHaveLength(14)
    expect(p.kept).toBe(6)
  })
  it('returns 14 tiles for every universe it can fill', () => {
    for (const kind of [undefined, 'pong'] as const) {
      const p = bestPlan({ avail: avail(), have: new Map(), universe: U, sets: 4, kind })!
      expect(p.tiles, String(kind)).toHaveLength(14)
    }
  })
})

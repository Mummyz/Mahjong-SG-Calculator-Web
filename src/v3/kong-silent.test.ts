/**
 * THE KONG QUESTION IS NEVER PUT TO THE PLAYER. Run 6C.
 *
 * Run 6 grew the target the moment a fourth copy appeared and offered a chip
 * reading "Not a kong". The owner's verdict was that it breaks the flow — it
 * scrolls the tray away, and with two quads held there are two of them. The
 * count answers it instead, in the engine (see kong-resolution.corpus.ts).
 *
 * What this file guards is the SCREEN: that the decline is gone and cannot
 * come back by accident, and that the arithmetic the dock and the tray do is
 * the resolver's, not a second opinion.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  concealedTargets, handIsReadable, readingKongs, resolveTarget, type KeyedHand,
} from '../engine/session/table'
import { singapore } from '../engine/variants'
import { EMPTY_HAND, type HandState } from './screens/HandEntry'
import type { TileId } from '../engine/core/tiles'

const read = (f: string) =>
  readFileSync(fileURLToPath(new URL(f, import.meta.url)), 'utf8')
const screen = read('./screens/HandEntry.tsx')
const en = JSON.parse(read('../i18n/en.json')) as Record<string, string>
const id = JSON.parse(read('../i18n/id.json')) as Record<string, string>

const hand = (s: string): KeyedHand =>
  ({ concealed: s.trim().split(/\s+/) as TileId[], melds: [], bonus: [] })

/** Exactly what HandEntry computes, so the two cannot drift apart. */
const dock = (h: KeyedHand) => {
  const target = resolveTarget(singapore, h)
  const complete = target >= 2 && h.concealed.length === target
  return {
    target,
    complete,
    readable: complete && handIsReadable(singapore, h),
    slotsLeft: Math.max(0, target - h.concealed.length),
    kongs: readingKongs(singapore, h),
    ceiling: concealedTargets(h).max,
  }
}

describe('the decline is gone from the screen', () => {
  it('HandState carries no `declined` field', () => {
    const keys = Object.keys(EMPTY_HAND as HandState).sort()
    expect(keys).toEqual(['bonus', 'concealed', 'ghost', 'log', 'melds'])
    expect(screen).not.toMatch(/\bdeclined\b/)
  })

  it('no control offers to reject a kong', () => {
    for (const gone of ['kongDecline', 'kongRestore', 'kongDeclined',
                        'notAHandKong', 'notAHandDeclined',
                        'tooMany', 'overTargetKong']) {
      expect(screen, `${gone} is still wired up`).not.toContain(gone)
      expect(en[`hand.${gone}`], `hand.${gone} is still in en.json`).toBeUndefined()
      expect(id[`hand.${gone}`], `hand.${gone} is still in id.json`).toBeUndefined()
    }
  })

  it('the kong chip itself is gone, and only the not-a-hand note is left', () => {
    expect(screen).not.toContain('chipnote--kong')
    expect(screen).toContain('chipnote--warn')
  })

  it('the screen asks the engine rather than counting quads itself', () => {
    expect(screen).toContain('readingKongs')
    expect(screen).toContain('resolveTarget')
    // The old formula — minimum plus one per quad — must not survive anywhere.
    expect(screen).not.toMatch(/targetMin\s*\+/)
    expect(screen).not.toMatch(/concealedKongs\(/)
  })
})

describe('the dock states the resolution, never a second opinion', () => {
  it('four copies that decompose stay at fourteen and show no kong', () => {
    const d = dock(hand('1m 1m 1m 1m 2m 3m 4p 5p 6p 7s 8s 9s 5s 5s'))
    expect(d).toMatchObject({
      target: 14, complete: true, readable: true, slotsLeft: 0, kongs: [],
    })
  })

  it('four copies that cannot decompose ask for exactly one more tile', () => {
    const d = dock(hand('1m 1m 1m 1m 4p 5p 6p 7s 8s 9s 2p 2p 3s 3s'))
    expect(d.target).toBe(15)
    expect(d.slotsLeft).toBe(1)
    expect(d.complete).toBe(false)
    // And the wall must be willing to take it.
    expect(d.ceiling).toBeGreaterThanOrEqual(d.target)
  })

  it('the fifteenth tile completes it, as a kong', () => {
    const d = dock(hand('1m 1m 1m 1m 2m 3m 4m 4p 5p 6p 7s 8s 9s 5s 5s'))
    expect(d).toMatchObject({ target: 15, complete: true, readable: true, kongs: ['1m'] })
  })

  it('two kongs reach sixteen and both show in the tray', () => {
    const d = dock(hand('1m 1m 1m 1m 9s 9s 9s 9s 2m 3m 4m 4p 5p 6p 5s 5s'))
    expect(d.target).toBe(16)
    expect(d.complete).toBe(true)
    expect([...d.kongs].sort()).toEqual(['1m', '9s'])
  })

  it('THE WALL NEVER REFUSES A TILE THE RESOLUTION STILL NEEDS', () => {
    // The ceiling is the max reading; the target only ever climbs to it.
    const cases = [
      '1m 1m 1m 1m 4p 5p 6p 7s 8s 9s 2p 2p 3s 3s',
      '1m 1m 1m 1m 9s 9s 9s 9s 2m 3m 4m 4p 5p 6p 5s',
      '1m 1m 1m 1m 2m 3m 4p 5p 6p 7s 8s 9s 5s',
      '5p 5p 5p 5p 1m 1m 1m 2p 2p 2p 3s 3s 3s 9s 9s',
    ]
    for (const c of cases) {
      const d = dock(hand(c))
      expect(d.target, c).toBeLessThanOrEqual(d.ceiling)
    }
  })

  it('a hand still being keyed never has its target run ahead', () => {
    for (const n of [1, 4, 8, 13]) {
      const h = hand(Array(n).fill('1m').slice(0, Math.min(n, 4))
        .concat(Array(Math.max(0, n - 4)).fill('5p')).join(' '))
      const d = dock(h)
      if (h.concealed.length < 14) expect(d.target, `${n} tiles`).toBe(14)
    }
  })
})

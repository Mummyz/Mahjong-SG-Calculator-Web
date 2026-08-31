/**
 * DECLINING A KONG CAN PUT THE HAND OVER ITS TARGET.
 *
 * The wall's ceiling is the MAX reading — fourteen plus one per concealed
 * quad — so a hand keyed to fifteen STAYS at fifteen when the player answers
 * "Not a kong", while the target it is measured against drops back to
 * fourteen. Those two numbers disagreeing is legal; the screen lying about it
 * is not.
 *
 * The dock used to compute `Math.max(1, shownTarget - concealed.length)` and
 * so read "1 more to go" beside a wall that answered every tap with "Hand is
 * full" — one screen asking for a tile and refusing to accept it. That is the
 * same dead end this run exists to remove, reached through the new decline
 * button, so it is pinned here.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  concealedKongs, concealedTarget, concealedTargets, handIsComplete,
  type KeyedHand,
} from '../engine/session/table'
import type { TileId } from '../engine/core/tiles'

const read = (f: string) => JSON.parse(readFileSync(
  fileURLToPath(new URL(f, import.meta.url)), 'utf8')) as Record<string, string>
const en = read('../i18n/en.json')
const id = read('../i18n/id.json')

/** Fifteen tiles whose only reading as a hand needs the quad to be a kong. */
const quadAt15: KeyedHand = {
  concealed: '5m 5m 5m 5m 1p 1p 1p 2p 2p 2p 3s 3s 3s 9s 9s'.split(' ') as TileId[],
  melds: [],
  bonus: [],
}

/** What HandEntry computes, reproduced exactly. */
const screen = (hand: KeyedHand, declined: TileId[]) => {
  const autoKongs = concealedKongs(hand.concealed).filter((k) => !declined.includes(k))
  const shownTarget = concealedTargets(hand).min + autoKongs.length
  return {
    shownTarget,
    complete: shownTarget >= 2 && hand.concealed.length === shownTarget,
    slotsLeft: Math.max(0, shownTarget - hand.concealed.length),
    over: Math.max(0, hand.concealed.length - shownTarget),
  }
}

describe('a declined kong never asks for a tile the wall will refuse', () => {
  it('taken, the kong reading fills the hand exactly', () => {
    expect(quadAt15.concealed).toHaveLength(15)
    expect(concealedKongs(quadAt15.concealed)).toEqual(['5m'])
    expect(concealedTargets(quadAt15)).toEqual({ min: 14, max: 15 })
    expect(handIsComplete(quadAt15)).toBe(true)

    const s = screen(quadAt15, [])
    expect(s).toEqual({ shownTarget: 15, complete: true, slotsLeft: 0, over: 0 })
  })

  it('declined, the target drops BELOW the tiles already keyed', () => {
    const s = screen(quadAt15, ['5m'])
    expect(s.shownTarget).toBe(14)
    expect(s.complete).toBe(false)
    expect(s.slotsLeft).toBe(0)
    expect(s.over).toBe(1)
  })

  it('the old label asked for a tile that does not exist', () => {
    const s = screen(quadAt15, ['5m'])
    // THE BUG, preserved: max(1, 14 - 15) = 1 -> "1 more to go".
    expect(Math.max(1, s.shownTarget - quadAt15.concealed.length)).toBe(1)
    // The truth it was hiding.
    expect(s.shownTarget - quadAt15.concealed.length).toBe(-1)
  })

  it('and the wall really was full, so the refusal was not a bug', () => {
    // concealedTarget counts every quad found, declined or not — which is
    // exactly why the ceiling and the shown target can disagree.
    expect(concealedTarget(quadAt15)).toBe(15)
    expect(quadAt15.concealed.length).toBe(concealedTarget(quadAt15))

    const s = screen(quadAt15, ['5m'])
    expect(s.over).toBeGreaterThan(0)
    expect(concealedTarget(quadAt15)).toBeGreaterThan(s.shownTarget)
  })

  it('undoing one tile clears the surplus without restoring the kong', () => {
    const shorter: KeyedHand = { ...quadAt15, concealed: quadAt15.concealed.slice(0, -1) }
    const s = screen(shorter, ['5m'])
    expect(s.over).toBe(0)
    expect(s.shownTarget).toBe(14)
    expect(s.complete).toBe(true)
  })

  it('restoring the kong clears the surplus without dropping a tile', () => {
    const s = screen(quadAt15, [])
    expect(s.over).toBe(0)
    expect(s.complete).toBe(true)
    expect(quadAt15.concealed).toHaveLength(15)
  })

  describe('the surplus explains itself in both languages', () => {
    const keys = ['hand.tooMany', 'hand.overTarget', 'hand.overTargetKong']

    it('every key exists in both bundles', () => {
      for (const k of keys) {
        expect(en[k], `${k} missing from en.json`).toBeTruthy()
        expect(id[k], `${k} missing from id.json`).toBeTruthy()
      }
    })

    it('the kong case points at the chip that undoes the decline', () => {
      expect(en['hand.overTargetKong']).toContain(en['hand.kongRestore']!)
      expect(id['hand.overTargetKong']).toContain(id['hand.kongRestore']!)
    })

    it('no explanation asks for another tile', () => {
      // "more to go" / "Kurang" / "Tinggal" are the shortfall phrasings. A
      // hand that is OVER its target must never borrow one of them.
      for (const k of ['hand.overTarget', 'hand.overTargetKong']) {
        expect(en[k]).not.toMatch(/more to go/i)
        expect(id[k]).not.toMatch(/\b(Kurang|Tinggal)\b/i)
      }
    })

    it('both name the two counts, so the surplus is arithmetic the player can see', () => {
      for (const k of ['hand.overTarget', 'hand.overTargetKong']) {
        for (const bundle of [en, id]) {
          expect(bundle[k]).toContain('{have}')
          expect(bundle[k]).toContain('{want}')
        }
      }
    })
  })
})

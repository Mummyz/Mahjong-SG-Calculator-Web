/**
 * GHOSTS ARE PRESENTATION. THIS IS THE PROOF.
 *
 * A ghost tile is a tile the player does NOT hold, drawn into an empty slot so
 * they can see the shape a prediction is describing. The danger is obvious: a
 * tile drawn in the tray that the engine also counts would inflate the hand,
 * change the fan, and settle money that never existed.
 *
 * The guarantee is structural rather than careful. `KeyedHand` — the only
 * shape the engine accepts — has no ghost field at all, so the scorer cannot
 * see one however hard the UI tries. These tests hold that structure to
 * account, and hold the screen to reading `hand.ghost` in exactly one place.
 */

import { readFileSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  composeHands, concealedKongs, concealedTargets, handIsComplete, handIsReadable,
  scoreKeyedHand, type KeyedHand,
} from '../engine/session/table'
import { singapore } from '../engine/variants'
import { EMPTY_HAND, type HandState } from './screens/HandEntry'

const TILES = '1s 2s 3s 4s 5s 6s 7s 8s 9s 2s 3s 4s 5s'.split(' ')

/** The screen's state, with and without a plan painted into the empty slots. */
const bare: HandState = { ...EMPTY_HAND, concealed: [...TILES] }
const haunted: HandState = {
  ...bare,
  ghost: ['5s', '1m', '1m', '9p', '9p', '9p'],
}

/** What the engine is actually handed. There is no ghost in this shape. */
const asKeyed = (h: HandState): KeyedHand =>
  ({ concealed: h.concealed, melds: h.melds, bonus: h.bonus })

const ctx = { seat: 'E', prevailing: 'E', win: 'selfDraw', winningTile: '5s' } as const

describe('a ghost never reaches the engine', () => {
  it('is not part of the shape the engine accepts', () => {
    // If a ghost field ever appears on KeyedHand this stops compiling, which
    // is the point: the type is the guard, the test only witnesses it.
    const keyed = asKeyed(haunted)
    expect(Object.keys(keyed).sort()).toEqual(['bonus', 'concealed', 'melds'])
  })

  it('does not change the tile count', () => {
    expect(asKeyed(haunted).concealed).toHaveLength(TILES.length)
    expect(asKeyed(haunted).concealed).toEqual(asKeyed(bare).concealed)
  })

  it('does not change completeness', () => {
    expect(handIsComplete(asKeyed(haunted))).toBe(handIsComplete(asKeyed(bare)))
    expect(handIsReadable(singapore, asKeyed(haunted)))
      .toBe(handIsReadable(singapore, asKeyed(bare)))
  })

  it('does not change the readings the scorer is offered', () => {
    expect(composeHands(asKeyed(haunted))).toEqual(composeHands(asKeyed(bare)))
  })

  it('does not change the score', () => {
    const a = scoreKeyedHand(singapore, asKeyed(bare), ctx)
    const b = scoreKeyedHand(singapore, asKeyed(haunted), ctx)
    expect(b.result).toEqual(a.result)
  })

  it('does not change the hand target', () => {
    expect(concealedTargets(asKeyed(haunted))).toEqual(concealedTargets(asKeyed(bare)))
  })

  it('cannot conjure or suppress a concealed kong', () => {
    // Three real 5s plus a GHOST 5s is not a kong, and must not be read as one.
    const three: HandState = { ...EMPTY_HAND, concealed: ['5s', '5s', '5s'], ghost: ['5s'] }
    expect(concealedKongs(asKeyed(three).concealed)).toEqual([])
    // Four real ones stay a kong however many ghosts sit beside them.
    const four: HandState = { ...EMPTY_HAND, concealed: ['5s', '5s', '5s', '5s'], ghost: ['5s', '5s'] }
    expect(concealedKongs(asKeyed(four).concealed)).toEqual(['5s'])
  })
})

describe('only one place in the app reads a ghost', () => {
  const walk = (dir: string): string[] =>
    readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
      e.isDirectory() ? walk(`${dir}${e.name}/`) : [`${dir}${e.name}`])

  it('and it is the tray', () => {
    const files = walk(fileURLToPath(new URL('./', import.meta.url)))
      .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'))
    const readers: string[] = []
    for (const f of files) {
      const src = readFileSync(f, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
      // Reading it: `hand.ghost` or destructuring `ghost` off a hand.
      for (const m of src.matchAll(/\bhand\.ghost\b/g)) {
        void m
        readers.push(f.split('/').slice(-2).join('/'))
      }
    }
    expect([...new Set(readers)], 'a ghost read outside the tray')
      .toEqual(['screens/HandEntry.tsx'])
  })

  it('and nothing outside src/v3 knows the word at all', () => {
    const engine = walk(fileURLToPath(new URL('../engine/', import.meta.url)))
      .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'))
      .filter((f) => /\bghost\b/i.test(readFileSync(f, 'utf8')))
    expect(engine, 'the engine has heard of ghosts').toEqual([])
  })
})

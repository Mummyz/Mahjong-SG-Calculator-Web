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
  // Run 6C: ghosts are REQUIREMENTS, not tiles. A forced identity and a
  // generic class, so both shapes are under the guard.
  ghost: [
    { count: 1, kind: 'specific', tile: '5s', shape: 'single', klass: 's' },
    { count: 2, kind: 'specific', tile: '1m', shape: 'pair', klass: 'm' },
    { count: 3, kind: 'any', tile: '9p', shape: 'pong', klass: 'p' },
  ],
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
    const three: HandState = {
      ...EMPTY_HAND, concealed: ['5s', '5s', '5s'],
      ghost: [{ count: 1, kind: 'specific', tile: '5s', shape: 'single', klass: 's' }],
    }
    expect(concealedKongs(asKeyed(three).concealed)).toEqual([])
    // Four real ones stay a kong however many ghosts sit beside them.
    const four: HandState = {
      ...EMPTY_HAND, concealed: ['5s', '5s', '5s', '5s'],
      ghost: [{ count: 2, kind: 'specific', tile: '5s', shape: 'pair', klass: 's' }],
    }
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
    // TWO readers, and the second one only ever THROWS GHOSTS AWAY. Run 6C
    // retyped hand.ghost, so restore() has to recognise and drop the old
    // shape — persistence is the one place that meets a ghost without the
    // tray around it. It is held to a stricter rule than the tray below.
    expect([...new Set(readers)].sort(), 'a ghost read outside the tray')
      .toEqual(['screens/HandEntry.tsx', 'v3/App.tsx'])
  })

  it('and the persistence layer only ever discards them', () => {
    const app = readFileSync(
      fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, '')
    // It may recognise the shape and drop what does not match. It must never
    // BUILD a requirement, read a tile out of one, or hand one to the engine.
    expect(app, 'App.tsx builds a ghost').not.toMatch(/\{\s*count:\s*\d/)
    expect(app, 'App.tsx reads a tile out of a ghost').not.toMatch(/ghost\w*\.tile\b/)
    expect(app, 'App.tsx imports the requirement type').not.toContain('predict/requirements')
    // And the tiles it hands the engine are never sourced from a ghost.
    for (const line of app.split('\n').filter((l) => /\bghost\b/.test(l))) {
      expect(line, `a ghost reaching the tiles: ${line.trim()}`)
        .not.toMatch(/concealed:\s*\[?[^)]*ghost|ghost[^)]*=>\s*concealed/)
    }
  })

  it('and nothing outside src/v3 knows the word at all', () => {
    const engine = walk(fileURLToPath(new URL('../engine/', import.meta.url)))
      .filter((f) => /\.tsx?$/.test(f) && !f.endsWith('.test.ts'))
      .filter((f) => /\bghost\b/i.test(readFileSync(f, 'utf8')))
    expect(engine, 'the engine has heard of ghosts').toEqual([])
  })
})

/**
 * A GHOST FROM AN OLDER APP IS NOT A GHOST NOW.
 *
 * Run 6C retyped hand.ghost from a list of tiles to a list of REQUIREMENTS,
 * and the old shape is sitting in the storage of anyone who used the app
 * before this run. Restoring one would draw a bracket with no slots under a
 * label reading "need.klass.undefined".
 */
describe('a ghost saved by an older version is dropped, not restored', () => {
  const looksLikeRequirement = (g: unknown): boolean =>
    typeof g === 'object' && g !== null
    && typeof (g as { count?: unknown }).count === 'number'
    && typeof (g as { tile?: unknown }).tile === 'string'

  it('rejects the Run 6 shape — bare tile ids', () => {
    for (const stale of ['5s', '1m', '9p']) {
      expect(looksLikeRequirement(stale), stale).toBe(false)
    }
  })

  it('keeps the Run 6C shape', () => {
    for (const g of haunted.ghost ?? []) {
      expect(looksLikeRequirement(g)).toBe(true)
    }
  })

  it('the check App.tsx runs is the one tested here', () => {
    const app = readFileSync(
      fileURLToPath(new URL('./App.tsx', import.meta.url)), 'utf8')
    // If the guard moves or loosens, this test is measuring nothing.
    expect(app).toContain('v.hand.ghost')
    expect(app).toMatch(/count\?: unknown/)
    expect(app).toMatch(/tile\?: unknown/)
  })
})

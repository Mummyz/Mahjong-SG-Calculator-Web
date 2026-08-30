/**
 * Shape analysis for one reading of a hand. Pure observation — no scoring.
 */

import {
  type TileId, type Wind,
  isDragon, isHonour, isSuited, isTerminal, isTerminalOrHonour, isWind, suitOf, tally,
} from '../../core/tiles'
import type { Decomposition, TileSet } from '../../core/sets'
import { decompose } from '../../core/sets'
import type { ParsedHand } from '../../core/hand'
import type { WinContext } from '../../core/variant'

const GREEN_TILES = new Set<TileId>(['2s', '3s', '4s', '6s', '8s', 'F'])

export interface Facts {
  readonly sets: readonly TileSet[]
  readonly pair: TileSet
  readonly allChow: boolean
  readonly allPong: boolean
  readonly fullFlush: boolean
  readonly halfFlush: boolean
  readonly allHonour: boolean
  readonly pureTerminals: boolean
  readonly mixedTerminals: boolean
  readonly pureGreen: boolean
  readonly dragonSets: number
  readonly windSets: readonly Wind[]
  readonly bigThreeDragons: boolean
  readonly smallThreeDragons: boolean
  readonly bigFourWinds: boolean
  readonly smallFourWinds: boolean
  /** No exposed melds at all. A concealed kong does not break this. */
  readonly noOpenMelds: boolean
  /** Every set concealed AND won by self-draw — the Hidden Treasure condition. */
  readonly hiddenTreasure: boolean
}

const isPongLike = (s: TileSet): boolean => s.kind === 'pong' || s.kind === 'kong'

export function factsFor(hand: ParsedHand, d: Decomposition, ctx: WinContext): Facts {
  const sets = [...hand.melds, ...d.sets]
  const pair = d.pair
  const tiles = hand.allTiles

  const suits = new Set(tiles.map(suitOf).filter((s): s is NonNullable<typeof s> => s !== null))
  const anyHonour = tiles.some(isHonour)

  const dragonSets = sets.filter((s) => isPongLike(s) && isDragon(s.tiles[0]!)).length
  const windSets = sets
    .filter((s) => isPongLike(s) && isWind(s.tiles[0]!))
    .map((s) => s.tiles[0] as Wind)

  const allHonour = tiles.every(isHonour)
  const allTerminalOnly = tiles.every((t) => isSuited(t) && isTerminal(t))
  const allPong = sets.every(isPongLike)
  const allTermOrHonour = tiles.every(isTerminalOrHonour)

  const noOpenMelds = hand.melds.every((m) => !m.open)

  return {
    sets,
    pair,
    allChow: sets.every((s) => s.kind === 'chow'),
    allPong,
    fullFlush: suits.size === 1 && !anyHonour,
    halfFlush: suits.size === 1 && anyHonour,
    allHonour,
    pureTerminals: allPong && allTerminalOnly,
    mixedTerminals: allPong && allTermOrHonour && !allTerminalOnly && !allHonour,
    pureGreen: tiles.every((t) => GREEN_TILES.has(t)),
    dragonSets,
    windSets,
    bigThreeDragons: dragonSets === 3,
    smallThreeDragons: dragonSets === 2 && isDragon(pair.tiles[0]!),
    bigFourWinds: windSets.length === 4,
    smallFourWinds: windSets.length === 3 && isWind(pair.tiles[0]!),
    noOpenMelds,
    hiddenTreasure: allPong && noOpenMelds && ctx.win === 'selfDraw',
  }
}

/** 1112345678999 of one suit plus any one more tile of that suit, all concealed. */
export function isNineGates(hand: ParsedHand): boolean {
  if (hand.melds.length > 0) return false
  if (hand.concealed.length !== 14) return false
  const suits = new Set(hand.concealed.map(suitOf))
  if (suits.size !== 1 || suits.has(null)) return false
  const suit = [...suits][0]!
  const counts = tally(hand.concealed)
  const required: Record<number, number> = { 1: 3, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 3 }
  let spare = 0
  for (let r = 1; r <= 9; r++) {
    const have = counts.get(`${r}${suit}`) ?? 0
    const extra = have - required[r]!
    if (extra < 0) return false
    spare += extra
  }
  return spare === 1
}

const THIRTEEN: readonly TileId[] =
  ['1m', '9m', '1p', '9p', '1s', '9s', 'E', 'S', 'W', 'N', 'C', 'F', 'P']

/** One of each terminal and honour, plus a duplicate of any one of them. */
export function isThirteenWonders(hand: ParsedHand): boolean {
  if (hand.melds.length > 0) return false
  if (hand.concealed.length !== 14) return false
  const counts = tally(hand.concealed)
  let spare = 0
  for (const t of THIRTEEN) {
    const n = counts.get(t) ?? 0
    if (n < 1) return false
    spare += n - 1
  }
  const distinct = [...counts.keys()]
  if (distinct.some((t) => !THIRTEEN.includes(t))) return false
  return spare === 1
}

/**
 * How many distinct tiles would complete the hand as it stood before the
 * winning tile arrived. This is what Ping Hu's "at least 2 different tiles"
 * rule is measured against.
 */
export function waitBreadth(hand: ParsedHand, winningTile: TileId): number {
  const before = [...hand.concealed]
  const i = before.indexOf(winningTile)
  if (i < 0) return 0
  before.splice(i, 1)

  const setsNeeded = 4 - hand.melds.length
  const universe = new Set<TileId>([
    ...before,
    ...before.flatMap((t) => {
      const r = Number(t[0])
      const s = suitOf(t)
      if (!s) return []
      return [r - 2, r - 1, r + 1, r + 2].filter((x) => x >= 1 && x <= 9).map((x) => `${x}${s}`)
    }),
    winningTile,
  ])

  const held = tally([...before, ...hand.melds.flatMap((m) => [...m.tiles])])
  let n = 0
  for (const cand of universe) {
    // A tile already exhausted cannot be waited on - only four of each exist.
    if ((held.get(cand) ?? 0) >= 4) continue
    if (decompose([...before, cand], setsNeeded).length > 0) n++
  }
  return n
}

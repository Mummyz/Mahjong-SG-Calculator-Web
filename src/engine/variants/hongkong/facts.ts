/**
 * Shape analysis for one reading of a Hong Kong hand. Pure observation — no
 * scoring, no faan values. Deliberately separate from the Singapore module:
 * the two variants ask different questions of the same tiles.
 */

import {
  type TileId, type Wind,
  isDragon, isHonour, isSuited, isTerminal, isTerminalOrHonour, isWind, suitOf, tally,
} from '../../core/tiles'
import type { Decomposition, TileSet } from '../../core/sets'
import type { ParsedHand } from '../../core/hand'

export interface Facts {
  readonly sets: readonly TileSet[]
  readonly pair: TileSet
  /** 平糊 — four chows. RULING HK14: the pair is unrestricted. */
  readonly allChow: boolean
  /** 對對糊 */
  readonly allPong: boolean
  /** 坎坎糊 — RULING HK21: every set a pung or kong, none of them claimed. */
  readonly allConcealedPong: boolean
  readonly fullFlush: boolean
  readonly halfFlush: boolean
  readonly allHonour: boolean
  readonly pureTerminals: boolean
  readonly mixedTerminals: boolean
  readonly dragonSets: number
  readonly windSets: readonly Wind[]
  readonly bigThreeDragons: boolean
  readonly smallThreeDragons: boolean
  readonly bigFourWinds: boolean
  readonly smallFourWinds: boolean
  /** 門前清 — RULING HK12: no melds at all, kongs included. */
  readonly fullyConcealed: boolean
}

const isPongLike = (s: TileSet): boolean => s.kind === 'pong' || s.kind === 'kong'

export function factsFor(hand: ParsedHand, d: Decomposition): Facts {
  const sets = [...hand.melds, ...d.sets]
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

  return {
    sets,
    pair: d.pair,
    allChow: sets.every((s) => s.kind === 'chow'),
    allPong,
    allConcealedPong: allPong && sets.every((s) => !s.open),
    fullFlush: suits.size === 1 && !anyHonour,
    halfFlush: suits.size === 1 && anyHonour,
    allHonour,
    pureTerminals: allPong && allTerminalOnly,
    mixedTerminals:
      allPong && tiles.every(isTerminalOrHonour) && !allTerminalOnly && !allHonour,
    dragonSets,
    windSets,
    bigThreeDragons: dragonSets === 3,
    smallThreeDragons: dragonSets === 2 && isDragon(d.pair.tiles[0]!),
    bigFourWinds: windSets.length === 4,
    smallFourWinds: windSets.length === 3 && isWind(d.pair.tiles[0]!),
    fullyConcealed: hand.melds.length === 0,
  }
}

/** 1112345678999 of one suit plus any one more tile of that suit, all concealed. */
export function isNineGates(hand: ParsedHand): boolean {
  if (hand.melds.length > 0 || hand.concealed.length !== 14) return false
  const suits = new Set(hand.concealed.map(suitOf))
  if (suits.size !== 1 || suits.has(null)) return false
  const suit = [...suits][0]!
  const counts = tally(hand.concealed)
  const required: Record<number, number> = { 1: 3, 2: 1, 3: 1, 4: 1, 5: 1, 6: 1, 7: 1, 8: 1, 9: 3 }
  let spare = 0
  for (let r = 1; r <= 9; r++) {
    const extra = (counts.get(`${r}${suit}`) ?? 0) - required[r]!
    if (extra < 0) return false
    spare += extra
  }
  return spare === 1
}

const THIRTEEN: readonly TileId[] =
  ['1m', '9m', '1p', '9p', '1s', '9s', 'E', 'S', 'W', 'N', 'C', 'F', 'P']

/** 十三么 — one of each terminal and honour, plus a duplicate of any one. */
export function isThirteenOrphans(hand: ParsedHand): boolean {
  if (hand.melds.length > 0 || hand.concealed.length !== 14) return false
  const counts = tally(hand.concealed)
  if ([...counts.keys()].some((t) => !THIRTEEN.includes(t))) return false
  let spare = 0
  for (const t of THIRTEEN) {
    const n = counts.get(t) ?? 0
    if (n < 1) return false
    spare += n - 1
  }
  return spare === 1
}

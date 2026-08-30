/**
 * Hand parser — turns a keyed-in tile selection into a validated structure the
 * scorer and (from Run 4) the predictor can both consume.
 *
 * Structural validation only. Whether a hand *scores* enough to win is a
 * variant question and lives in the variant plugin.
 */

import {
  type BonusId, type TileId, type Wind,
  isBonus, isValidTile, parseTiles, TileParseError, tally,
} from './tiles'
import { type Decomposition, type TileSet, decompose } from './sets'

export type MeldKind = 'chow' | 'pong' | 'kong'

export interface MeldInput {
  readonly t: MeldKind
  readonly tiles: string
  readonly open: boolean
}

export interface HandInput {
  readonly concealed: string
  readonly melds?: readonly MeldInput[]
  readonly bonus?: readonly string[]
}

export type RejectReason =
  | 'unknownTile'
  /** A real tile, but not one this variant plays — animals in Hong Kong. */
  | 'tileNotInSet'
  | 'bonusTileInHand'
  | 'duplicateBonusTile'
  | 'tileCountExceeded'
  | 'malformedMeld'
  | 'wrongTileCount'
  | 'winningTileNotInHand'
  | 'noValidDecomposition'
  | 'belowMinimum'

export interface ParsedHand {
  /** Concealed tiles, including the winning tile. */
  readonly concealed: readonly TileId[]
  readonly melds: readonly TileSet[]
  readonly bonus: readonly BonusId[]
  readonly kongCount: number
  /** Every tile in play for this hand, melds included. */
  readonly allTiles: readonly TileId[]
  /** Every reading as 4 sets + a pair. Empty for the irregular special hands. */
  readonly decompositions: readonly Decomposition[]
}

export type ParseResult =
  | { readonly ok: true; readonly hand: ParsedHand }
  | { readonly ok: false; readonly reason: RejectReason }

const fail = (reason: RejectReason): ParseResult => ({ ok: false, reason })

const meldIsWellFormed = (kind: MeldKind, tiles: readonly TileId[]): boolean => {
  if (kind === 'pong') return tiles.length === 3 && tiles.every((t) => t === tiles[0])
  if (kind === 'kong') return tiles.length === 4 && tiles.every((t) => t === tiles[0])
  // chow: three consecutive tiles of one suit
  if (tiles.length !== 3) return false
  const sorted = [...tiles].sort()
  const suit = sorted[0]![1]
  if (!suit || !'mps'.includes(suit)) return false
  if (!sorted.every((t) => t[1] === suit)) return false
  const ranks = sorted.map((t) => Number(t[0])).sort((a, b) => a - b)
  return ranks[1] === ranks[0]! + 1 && ranks[2] === ranks[1]! + 1
}

/**
 * Validate a hand's structure.
 *
 * `handSize` maps a kong count to the number of tiles a winning hand must
 * hold — 14 + kongs for both variants in the lineup, but the variant owns it.
 */
export function parseHand(
  input: HandInput,
  opts: { handSize: (kongCount: number) => number; winningTile?: string | undefined },
): ParseResult {
  // 1. concealed tiles
  let concealed: TileId[]
  try {
    for (const token of input.concealed.trim().split(/\s+/).filter(Boolean)) {
      if (isBonus(token)) return fail('bonusTileInHand')
    }
    concealed = parseTiles(input.concealed)
  } catch (e) {
    if (e instanceof TileParseError && isBonus(e.token)) return fail('bonusTileInHand')
    return fail('unknownTile')
  }
  if (!concealed.every(isValidTile)) return fail('unknownTile')

  // 2. melds
  const melds: TileSet[] = []
  for (const m of input.melds ?? []) {
    let tiles: TileId[]
    try {
      tiles = parseTiles(m.tiles)
    } catch {
      return fail('malformedMeld')
    }
    if (!tiles.every(isValidTile)) return fail('malformedMeld')
    if (!meldIsWellFormed(m.t, tiles)) return fail('malformedMeld')
    melds.push({ kind: m.t, tiles, open: m.open, fromMeld: true })
  }

  // 3. bonus tiles
  const bonus: BonusId[] = []
  for (const b of input.bonus ?? []) {
    if (!isBonus(b)) return fail('unknownTile')
    if (bonus.includes(b)) return fail('duplicateBonusTile')
    bonus.push(b)
  }

  // 4. no tile can exist more than four times
  const allTiles: TileId[] = [...concealed, ...melds.flatMap((m) => [...m.tiles])]
  for (const n of tally(allTiles).values()) {
    if (n > 4) return fail('tileCountExceeded')
  }

  // 5. total size, which each kong grows by one
  const kongCount = melds.filter((m) => m.kind === 'kong').length
  if (allTiles.length !== opts.handSize(kongCount)) return fail('wrongTileCount')

  // 6. the declared winning tile has to actually be in the hand
  if (opts.winningTile !== undefined && !concealed.includes(opts.winningTile)) {
    return fail('winningTileNotInHand')
  }

  const setsNeeded = 4 - melds.length
  const decompositions = setsNeeded >= 0 ? decompose(concealed, setsNeeded) : []

  return {
    ok: true,
    hand: { concealed, melds, bonus, kongCount, allTiles, decompositions },
  }
}

/** The four sets plus pair for one reading, melds included. */
export const setsOf = (hand: ParsedHand, d: Decomposition): TileSet[] => [...hand.melds, ...d.sets]

/** Seat wind → the flower and season index that seat owns. */
export const ownBonusIndex = (seat: Wind): 1 | 2 | 3 | 4 =>
  ({ E: 1, S: 2, W: 3, N: 4 } as const)[seat]

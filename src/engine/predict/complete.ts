/**
 * "What is the nearest complete hand of THIS shape, and how much of what I
 * already hold does it keep?"
 *
 * This is the only search in the predictor. It builds four sets and a pair out
 * of a restricted universe of tiles, maximising how many of the player's
 * current tiles the result reuses, and never using a fifth copy of anything —
 * counting the copies already locked into declared melds.
 *
 * It decides nothing about scoring. Its output is a complete hand, which the
 * variant plugin then scores; a candidate whose fan came from anywhere but the
 * scorer would be a claim this project cannot stand behind.
 */

import { SUITS, HONOURS, type TileId } from '../core/tiles'

/** The canonical order: 1m..9m, 1p..9p, 1s..9s, E S W N C F P. */
export const ALL_TILES: readonly TileId[] = [
  ...SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`)),
  ...HONOURS,
]
const INDEX = new Map<TileId, number>(ALL_TILES.map((t, i) => [t, i]))
const SUITED_COUNT = 27

/** Can a chow start at this index — suited, ranks 1..7, all three in play. */
const chowStart = (i: number): boolean => i < SUITED_COUNT && i % 9 <= 6

export interface PlanRequest {
  /** Copies still free for each tile: 4 minus everything already committed. */
  readonly avail: ReadonlyMap<TileId, number>
  /** The player's concealed tiles, by tile. */
  readonly have: ReadonlyMap<TileId, number>
  /** Tiles this shape is allowed to use at all. */
  readonly universe: ReadonlySet<TileId>
  /** Sets still to place — four minus the declared melds. */
  readonly sets: number
  /** Restrict every set to one kind. Undefined means either. */
  readonly kind?: 'chow' | 'pong'
  /** Whether the pair still has to be found, or a meld already covers it. */
  readonly needPair?: boolean
}

export interface Plan {
  /** The concealed tiles of the finished hand, in canonical order. */
  readonly tiles: readonly TileId[]
  /** How many of the player's current tiles this plan reuses. */
  readonly kept: number
}

interface Cell { readonly kept: number; readonly pick: Pick | null }
interface Pick {
  readonly chows: number
  readonly pong: boolean
  readonly pair: boolean
  readonly next: string
}

/**
 * Walk the canonical order once, deciding at each tile how many chows start
 * here, whether a pong sits here, and whether the pair does.
 *
 * `c1` and `c2` carry the chows started one and two tiles back, because those
 * chows consume a copy of the tile we are standing on. That is the whole
 * trick; everything else is bookkeeping.
 */
export function bestPlan(req: PlanRequest): Plan | null {
  const { avail, have, universe, kind } = req
  const memo = new Map<string, Cell>()

  const free = (i: number): number => {
    const t = ALL_TILES[i]!
    return universe.has(t) ? (avail.get(t) ?? 0) : 0
  }
  const mine = (i: number): number => have.get(ALL_TILES[i]!) ?? 0

  const key = (i: number, sets: number, pair: number, c1: number, c2: number) =>
    `${i}|${sets}|${pair}|${c1}|${c2}`

  const walk = (i: number, sets: number, pair: number, c1: number, c2: number): Cell => {
    if (i >= ALL_TILES.length) {
      return sets === 0 && pair === 0 && c1 === 0 && c2 === 0
        ? { kept: 0, pick: null }
        : { kept: -1, pick: null }
    }
    const k = key(i, sets, pair, c1, c2)
    const hit = memo.get(k)
    if (hit) return hit

    const cap = free(i)
    const held = mine(i)
    // The carried chows already eat this many copies before we choose anything.
    const carried = c1 + c2
    let best: Cell = { kept: -1, pick: null }

    if (carried <= cap) {
      const maxChow = kind === 'pong' || !chowStart(i)
        ? 0
        : Math.min(sets, cap - carried, free(i + 1), free(i + 2))
      for (let chows = 0; chows <= maxChow; chows++) {
        for (const pong of (kind === 'chow' ? [false] : [false, true])) {
          if (pong && (sets - chows < 1 || carried + chows + 3 > cap)) continue
          for (const takesPair of (pair === 1 ? [false, true] : [false])) {
            const used = carried + chows + (pong ? 3 : 0) + (takesPair ? 2 : 0)
            if (used > cap) continue
            const rest = walk(
              i + 1,
              sets - chows - (pong ? 1 : 0),
              pair - (takesPair ? 1 : 0),
              chows,
              c1,
            )
            if (rest.kept < 0) continue
            const kept = Math.min(used, held) + rest.kept
            if (kept > best.kept) {
              best = { kept, pick: { chows, pong, pair: takesPair, next: key(i + 1, sets - chows - (pong ? 1 : 0), pair - (takesPair ? 1 : 0), chows, c1) } }
            }
          }
        }
      }
    }
    memo.set(k, best)
    return best
  }

  const root = walk(0, req.sets, req.needPair === false ? 0 : 1, 0, 0)
  if (root.kept < 0) return null

  // Re-walk the memo to lay the tiles out.
  const tiles: TileId[] = []
  let i = 0
  let sets = req.sets
  let pair = req.needPair === false ? 0 : 1
  let c1 = 0
  let c2 = 0
  while (i < ALL_TILES.length) {
    const cell = memo.get(key(i, sets, pair, c1, c2))
    const pick = cell?.pick
    if (!pick) break
    const t = ALL_TILES[i]!
    for (let n = 0; n < pick.chows; n++) {
      tiles.push(t, ALL_TILES[i + 1]!, ALL_TILES[i + 2]!)
    }
    if (pick.pong) tiles.push(t, t, t)
    if (pick.pair) tiles.push(t, t)
    const nc1 = pick.chows
    const nc2 = c1
    sets -= pick.chows + (pick.pong ? 1 : 0)
    pair -= pick.pair ? 1 : 0
    c1 = nc1
    c2 = nc2
    i += 1
  }
  tiles.sort((a, b) => (INDEX.get(a) ?? 99) - (INDEX.get(b) ?? 99))
  return { tiles, kept: root.kept }
}

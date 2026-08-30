/**
 * Set decomposition — enumerate every legal way a hand splits into
 * melds/pairs.
 *
 * Scoring must consider ALL decompositions and take the best-scoring one, not
 * the first one found: a hand that parses two ways is scored at its maximum.
 * That choice belongs to the variant, so this module returns every reading.
 */

import { type TileId, isSuited, nextInSuit, sortTiles, tally } from './tiles'

export type SetKind = 'chow' | 'pong' | 'kong' | 'pair'

export interface TileSet {
  readonly kind: SetKind
  readonly tiles: readonly TileId[]
  /** Exposed to the table (claimed from a discard). Concealed kongs are not open. */
  readonly open: boolean
  /** Declared as a meld rather than found inside the concealed tiles. */
  readonly fromMeld: boolean
}

export interface Decomposition {
  /** The four sets, melds included. Never contains the pair. */
  readonly sets: readonly TileSet[]
  readonly pair: TileSet
}

const setOf = (kind: SetKind, tiles: TileId[]): TileSet =>
  ({ kind, tiles, open: false, fromMeld: false })

/** Total tiles still in the counts map. */
const remaining = (counts: Map<TileId, number>): number => {
  let n = 0
  for (const v of counts.values()) n += v
  return n
}

const lowest = (counts: Map<TileId, number>): TileId | null => {
  let best: TileId | null = null
  for (const [t, n] of counts) {
    if (n > 0 && (best === null || sortTiles([t, best])[0] === t)) best = t
  }
  return best
}

const take = (counts: Map<TileId, number>, tiles: readonly TileId[]): boolean => {
  for (const t of tiles) {
    const n = counts.get(t) ?? 0
    if (n === 0) {
      // roll back what we already took
      for (const u of tiles) {
        if (u === t) break
        counts.set(u, (counts.get(u) ?? 0) + 1)
      }
      return false
    }
    counts.set(t, n - 1)
  }
  return true
}

const give = (counts: Map<TileId, number>, tiles: readonly TileId[]): void => {
  for (const t of tiles) counts.set(t, (counts.get(t) ?? 0) + 1)
}

/**
 * Every way to carve `need` sets (chow or pong) out of `counts`, consuming it
 * exactly. Kongs never appear here — a kong is always a declared meld.
 */
function carve(counts: Map<TileId, number>, need: number, acc: TileSet[], out: TileSet[][]): void {
  if (need === 0) {
    if (remaining(counts) === 0) out.push([...acc])
    return
  }
  if (remaining(counts) < need * 3) return
  const t = lowest(counts)
  if (t === null) return

  if ((counts.get(t) ?? 0) >= 3) {
    const tiles = [t, t, t]
    take(counts, tiles)
    acc.push(setOf('pong', tiles))
    carve(counts, need - 1, acc, out)
    acc.pop()
    give(counts, tiles)
  }

  if (isSuited(t)) {
    const b = nextInSuit(t)
    const c = b ? nextInSuit(b) : null
    if (b && c) {
      const tiles = [t, b, c]
      if (take(counts, tiles)) {
        acc.push(setOf('chow', tiles))
        carve(counts, need - 1, acc, out)
        acc.pop()
        give(counts, tiles)
      }
    }
  }
}

const keyOf = (d: Decomposition): string =>
  [...d.sets.map((s) => `${s.kind}:${s.tiles.join('')}`)].sort().join('|') +
  `#${d.pair.tiles.join('')}`

/**
 * Every reading of `tiles` as `setsNeeded` sets plus one pair.
 * Duplicate readings are collapsed.
 */
export function decompose(tiles: readonly TileId[], setsNeeded: number): Decomposition[] {
  if (tiles.length !== setsNeeded * 3 + 2) return []
  const counts = tally(tiles)
  const seen = new Set<string>()
  const out: Decomposition[] = []

  for (const [t, n] of counts) {
    if (n < 2) continue
    const pairTiles = [t, t]
    take(counts, pairTiles)
    const found: TileSet[][] = []
    carve(counts, setsNeeded, [], found)
    give(counts, pairTiles)
    for (const sets of found) {
      const d: Decomposition = { sets, pair: setOf('pair', pairTiles) }
      const k = keyOf(d)
      if (!seen.has(k)) {
        seen.add(k)
        out.push(d)
      }
    }
  }
  return out
}

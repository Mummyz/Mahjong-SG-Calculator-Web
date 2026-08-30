/**
 * Tile model — the shared vocabulary every variant is expressed in.
 *
 * Covers the union of both FINAL variants: Hong Kong Old Style's 144 tiles and
 * Singapore's 148 (the same 144 plus four animals). Nothing here is
 * variant-specific; a variant declares which of these it actually uses.
 */

export type Suit = 'm' | 'p' | 's'
export type Wind = 'E' | 'S' | 'W' | 'N'
export type Dragon = 'C' | 'F' | 'P'
export type Honour = Wind | Dragon

/** A tile in the wall: `1m`..`9m`, `1p`..`9p`, `1s`..`9s`, or an honour letter. */
export type TileId = string

/** Flowers `F1`-`F4`, seasons `S1`-`S4`, and the Singapore animals. */
export type BonusId =
  | 'F1' | 'F2' | 'F3' | 'F4'
  | 'S1' | 'S2' | 'S3' | 'S4'
  | 'cat' | 'rat' | 'rooster' | 'centipede'

export const SUITS: readonly Suit[] = ['m', 'p', 's']
export const WINDS: readonly Wind[] = ['E', 'S', 'W', 'N']
export const DRAGONS: readonly Dragon[] = ['C', 'F', 'P']
export const HONOURS: readonly Honour[] = [...WINDS, ...DRAGONS]

export const FLOWERS: readonly BonusId[] = ['F1', 'F2', 'F3', 'F4']
export const SEASONS: readonly BonusId[] = ['S1', 'S2', 'S3', 'S4']
export const ANIMALS: readonly BonusId[] = ['cat', 'rat', 'rooster', 'centipede']

/** Seat order, and the index a seat's own flower/season carries. East = 1. */
export const SEAT_INDEX: Readonly<Record<Wind, 1 | 2 | 3 | 4>> = { E: 1, S: 2, W: 3, N: 4 }

const HONOUR_SET = new Set<string>(HONOURS)
const BONUS_SET = new Set<string>([...FLOWERS, ...SEASONS, ...ANIMALS])

export const isHonour = (t: TileId): boolean => HONOUR_SET.has(t)
export const isWind = (t: TileId): t is Wind => (WINDS as readonly string[]).includes(t)
export const isDragon = (t: TileId): t is Dragon => (DRAGONS as readonly string[]).includes(t)
export const isSuited = (t: TileId): boolean => t.length === 2 && (SUITS as readonly string[]).includes(t[1]!)
export const isBonus = (t: string): t is BonusId => BONUS_SET.has(t)

export const suitOf = (t: TileId): Suit | null => (isSuited(t) ? (t[1] as Suit) : null)
export const rankOf = (t: TileId): number | null => (isSuited(t) ? Number(t[0]) : null)

/** Terminals are the 1s and 9s. Honours are not terminals — they are honours. */
export const isTerminal = (t: TileId): boolean => {
  const r = rankOf(t)
  return r === 1 || r === 9
}
/** "Terminal or honour" — the 么九 set that Mixed Terminals is built from. */
export const isTerminalOrHonour = (t: TileId): boolean => isTerminal(t) || isHonour(t)
/** Simples: suited 2–8. */
export const isSimple = (t: TileId): boolean => isSuited(t) && !isTerminal(t)

export const isValidTile = (t: string): boolean => {
  if (HONOUR_SET.has(t)) return true
  if (t.length !== 2) return false
  const r = Number(t[0])
  return Number.isInteger(r) && r >= 1 && r <= 9 && (SUITS as readonly string[]).includes(t[1]!)
}

/** The tile one rank higher in the same suit, or null at the suit edge. */
export const nextInSuit = (t: TileId): TileId | null => {
  const r = rankOf(t)
  if (r === null || r >= 9) return null
  return `${r + 1}${suitOf(t)}`
}

/**
 * Expand the corpus / UI notation into tiles.
 *
 * Space-separated groups; a group is either digits followed by a suit letter
 * (`123m` → 1m 2m 3m) or a run of honour letters (`EEE` → three East).
 * Throws `TileParseError` on anything else.
 */
export class TileParseError extends Error {
  constructor(readonly token: string, message: string) {
    super(message)
    this.name = 'TileParseError'
  }
}

export function parseTiles(notation: string): TileId[] {
  const out: TileId[] = []
  for (const group of notation.trim().split(/\s+/).filter(Boolean)) {
    if (/^\d+[mps]$/.test(group)) {
      const suit = group[group.length - 1]!
      for (const d of group.slice(0, -1)) {
        if (d === '0') throw new TileParseError(group, `rank 0 is not a tile: "${group}"`)
        out.push(`${d}${suit}`)
      }
    } else if (/^[ESWNCFP]+$/.test(group)) {
      for (const c of group) out.push(c)
    } else {
      throw new TileParseError(group, `unrecognised tile group: "${group}"`)
    }
  }
  return out
}

/** Count each distinct tile. Insertion order is the order first seen. */
export function tally(tiles: readonly TileId[]): Map<TileId, number> {
  const m = new Map<TileId, number>()
  for (const t of tiles) m.set(t, (m.get(t) ?? 0) + 1)
  return m
}

/** Sort into a stable display order: m, p, s by rank, then E S W N C F P. */
const ORDER = new Map<string, number>(
  [...SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`)), ...HONOURS]
    .map((t, i) => [t, i]),
)
export const compareTiles = (a: TileId, b: TileId): number =>
  (ORDER.get(a) ?? 99) - (ORDER.get(b) ?? 99)
export const sortTiles = (tiles: readonly TileId[]): TileId[] => [...tiles].sort(compareTiles)

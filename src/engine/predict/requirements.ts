/**
 * WHAT A PLAN ACTUALLY REQUIRES, as opposed to one way of satisfying it.
 *
 * The predictor finishes a hand by naming a concrete example: it will say the
 * plan needs `5p 5p`, because five of dots is what its search happened to
 * reach for. Drawn into the tray as two outlined tiles that reads as an
 * instruction — go and get 5 Dots — when the real requirement is very often
 * "a pair of anything in this suit", and a player who chases the specific
 * tile is being sent after the wrong one.
 *
 * So each set the hand is still missing is asked TWO questions, and one YES
 * is enough to pin the tile down:
 *
 *   Does the PLAYER already hold part of it? Two Red Dragons in hand mean the
 *   third can only be a Red Dragon, whatever the pattern would have taken.
 *
 *   Does the PATTERN name it? Answered by SWAPPING THE TILE AND RE-SCORING —
 *   if the substitute hand is still a win worth the same, the identity was
 *   never the point; if it is not, the plan wants that tile and no other.
 *
 * Either test alone gets it wrong, and Run 6C got it wrong both ways round
 * before settling here: holding-only called a named dragon generic, and
 * pattern-only called a half-built Red Dragon pong "any Dragon pong".
 *
 * Nothing here invents a constraint the example did not have, and nothing
 * relaxes one it did.
 */

import {
  DRAGONS, WINDS, isDragon, isHonour, isWind, suitOf, tally, type TileId,
} from '../core/tiles'
import type { TileSet } from '../core/sets'
import type { HandInput } from '../core/hand'
import type { RuleOptions, VariantPlugin, WinContext } from '../core/variant'

export type RequirementShape = 'pair' | 'pong' | 'kong' | 'chow' | 'single'

export interface Requirement {
  /** How many tray slots this requirement occupies. Always the MISSING count. */
  readonly count: number
  /** Whether the tile identity is forced, or any tile of `klass` will do. */
  readonly kind: 'specific' | 'any'
  /**
   * For `specific`, the tile itself. For `any`, a representative used ONLY to
   * draw the suit or honour mark — never a numbered face, because there is no
   * number in the requirement.
   */
  readonly tile: TileId
  readonly shape: RequirementShape
  /** For `any`: 'm' | 'p' | 's' | 'dragon' | 'wind' | 'honour' | 'tile'. */
  readonly klass: string
}

const shapeOf = (kind: string, n: number): RequirementShape => {
  if (kind === 'pair') return 'pair'
  if (kind === 'chow') return 'chow'
  if (kind === 'kong') return 'kong'
  if (kind === 'pong') return 'pong'
  return n === 2 ? 'pair' : n >= 3 ? 'pong' : 'single'
}

/** The narrowest true description of what a set's tiles have in common. */
const classOf = (tiles: readonly TileId[]): string => {
  if (tiles.every(isDragon)) return 'dragon'
  if (tiles.every(isWind)) return 'wind'
  if (tiles.every(isHonour)) return 'honour'
  const suits = new Set(tiles.map(suitOf))
  if (suits.size === 1) {
    const s = [...suits][0]
    if (s) return s
  }
  return 'tile'
}

/** Every tile that belongs to a class, for the substitution test. */
const membersOf = (klass: string): TileId[] => {
  if (klass === 'dragon') return [...DRAGONS] as TileId[]
  if (klass === 'wind') return [...WINDS] as TileId[]
  if (klass === 'honour') return [...WINDS, ...DRAGONS] as TileId[]
  if (klass === 'm' || klass === 'p' || klass === 's') {
    return Array.from({ length: 9 }, (_, i) => `${i + 1}${klass}` as TileId)
  }
  return []
}

const flat = (h: HandInput): TileId[] =>
  (h.concealed ? h.concealed.trim().split(/\s+/) : []) as TileId[]

/**
 * WOULD ANOTHER TILE OF THE SAME FAMILY DO?
 *
 * Substitutes the whole set for the same shape built from a different tile of
 * its class, and re-scores. Interchangeable means the substitute is still a
 * legal win worth the same — so a plan that turns on holding the RED dragon
 * specifically fails the test and stays specific, while a plain pair passes.
 *
 * Chows are never tested: shifting a run changes which tiles it contains, so
 * "any run in this suit" is a different claim from a swapped pong, and the
 * honest answer for a partially-built run is the tiles themselves.
 */
function interchangeable(
  plugin: VariantPlugin,
  example: HandInput,
  set: TileSet,
  ctx: WinContext,
  opts: Partial<RuleOptions> | undefined,
  fan: number,
): boolean {
  if (set.kind === 'chow') return false
  const klass = classOf(set.tiles)
  const alts = membersOf(klass)
  if (alts.length === 0) return false

  const tiles = flat(example)
  const held = tally(tiles)
  const target = set.tiles[0]
  if (!target) return false

  for (const alt of alts) {
    if (alt === target) continue
    // Only a tile there is room for: four of anything is the whole supply.
    if ((held.get(alt) ?? 0) + set.tiles.length > 4) continue
    const swapped = [...tiles]
    let removed = 0
    for (let i = swapped.length - 1; i >= 0 && removed < set.tiles.length; i--) {
      if (swapped[i] === target) { swapped.splice(i, 1); removed += 1 }
    }
    if (removed !== set.tiles.length) continue
    for (let i = 0; i < set.tiles.length; i++) swapped.push(alt)

    const r = plugin.score(
      { ...example, concealed: swapped.join(' ') }, ctx, opts)
    // Same win, same worth: the identity was never what the plan needed.
    if (r.valid && r.totalTai === fan) return true
  }
  return false
}

/**
 * The requirements a plan is still missing, in the order the sets appear.
 *
 * `held` is every tile the player has, melds included.
 */
export function requirementsOf(
  plugin: VariantPlugin,
  example: HandInput,
  sets: readonly TileSet[],
  pair: TileSet | null,
  held: readonly TileId[],
  ctx: WinContext,
  opts: Partial<RuleOptions> | undefined,
  fan: number,
): Requirement[] {
  const pool = tally(held)
  const take = (t: TileId): boolean => {
    const n = pool.get(t) ?? 0
    if (n <= 0) return false
    pool.set(t, n - 1)
    return true
  }

  // The pair last: it is the smallest ask and the least interesting to chase.
  const all = pair ? [...sets, pair] : [...sets]
  // MELDED SETS FIRST, and their tiles come OUT of the pool. Skipping them
  // before consuming left every tile locked in a declared meld available for
  // another set to claim, which made sets look further along than they are.
  for (const set of all) {
    if (set.fromMeld) for (const tile of set.tiles) take(tile)
  }

  const out: Requirement[] = []
  for (const set of all) {
    if (set.fromMeld) continue
    const missing: TileId[] = []
    let heldInSet = 0
    for (const tile of set.tiles) {
      if (take(tile)) heldInSet += 1
      else missing.push(tile)
    }
    if (missing.length === 0) continue

    const shape = shapeOf(set.kind, set.tiles.length)
    const klass = classOf(set.tiles)

    /**
     * TWO WAYS TO BE FORCED, and a requirement needs only one of them.
     *
     *   the PLAYER forces it — two Red Dragons already in hand mean the third
     *     can only be a Red Dragon, whatever the pattern would have accepted;
     *   the PATTERN forces it — a three-dragons plan needs THAT dragon even
     *     though the player holds none of it yet.
     *
     * Run 6C's first attempt used the first test alone and called a named
     * dragon generic; the fix for that used the second alone and called a
     * half-built Red Dragon pong "any Dragon pong". Both are required.
     */
    if (heldInSet === 0 && interchangeable(plugin, example, set, ctx, opts, fan)) {
      out.push({ count: missing.length, kind: 'any', tile: missing[0]!, shape, klass })
      continue
    }
    // FORCED, and a chow's missing tiles need not be the same tile — so each
    // distinct one is its own requirement. Sharing one count across unlike
    // tiles drew `count` copies of the first and dropped the rest, which is
    // the invention this module exists to remove.
    for (const [tile, n] of tally(missing)) {
      out.push({ count: n, kind: 'specific', tile, shape, klass })
    }
  }
  return out
}

/**
 * The requirements for a candidate, read off the finished hand it proposes.
 *
 * The example is scored rather than re-derived so the sets are exactly the
 * ones the engine certified — a requirement must never describe a shape the
 * scorer would not accept. It is scored IN THE PLAYER'S OWN CONTEXT: under a
 * hardcoded East/East probe, every plan whose fan comes from the seat or
 * prevailing wind fell below the variant minimum, scored invalid, and
 * returned no requirements at all.
 */
export function candidateRequirements(
  plugin: VariantPlugin,
  example: HandInput,
  held: readonly TileId[],
  ctx: WinContext,
  opts?: Partial<RuleOptions>,
): Requirement[] {
  const r = plugin.score(example, ctx, opts)
  if (!r.valid) return []
  const fan = r.totalTai
  const d = r.hand.decompositions[0]
  // The irregular hands (Thirteen Wonders and friends) have no decomposition
  // at all. They are chased tile by tile, so every missing tile is specific
  // and there is nothing to generalise.
  if (!d) {
    const pool = tally(held)
    const missing: TileId[] = []
    for (const tile of r.hand.allTiles) {
      const n = pool.get(tile) ?? 0
      if (n > 0) pool.set(tile, n - 1)
      else missing.push(tile)
    }
    return [...tally(missing)].map(([tile, n]) => ({
      count: n, kind: 'specific' as const, tile, shape: 'single' as const,
      klass: classOf([tile]),
    }))
  }
  return requirementsOf(
    plugin, example, [...r.hand.melds, ...d.sets], d.pair, held, ctx, opts, fan)
}

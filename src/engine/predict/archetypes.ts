/**
 * The shapes a hand can still become.
 *
 * Each archetype is a RESTRICTION handed to the completion search — a universe
 * of allowed tiles, an optional all-chow or all-pong rule, and sets that must
 * appear. None of them carries a fan value: the fan of whatever the search
 * builds is whatever the variant's scorer says it is, and nothing here is
 * allowed to second-guess that.
 *
 * The list is deliberately over-generous. A shape that turns out to be far
 * away, or to score the same as a simpler one, is dropped downstream; a shape
 * that is missing here can never be suggested at all.
 */

import { DRAGONS, HONOURS, SUITS, WINDS, type TileId } from '../core/tiles'
import { ALL_TILES } from './complete'

export interface Archetype {
  /** Stable id, used by the corpus and as an i18n key suffix. */
  readonly key: string
  readonly universe: ReadonlySet<TileId>
  readonly kind?: 'chow' | 'pong'
  /** Tiles that must appear as a pung, three copies each. */
  readonly pongs?: readonly TileId[]
  /** A tile that must be the pair. */
  readonly pair?: TileId
  /** A hand this archetype is trying to be, for the sparse-hand hints. */
  readonly hint: string
}

const suited = (s: string) => ALL_TILES.filter((t) => t.endsWith(s))
const ALL = new Set(ALL_TILES)
const HON = new Set<TileId>(HONOURS)
const TERMINALS = new Set<TileId>([
  ...SUITS.flatMap((s) => [`1${s}`, `9${s}`]),
])
const TERM_HON = new Set<TileId>([...TERMINALS, ...HONOURS])

export const ARCHETYPES: readonly Archetype[] = [
  // ── the ordinary hand, and the two shapes ──────────────────────────
  { key: 'any', universe: ALL, hint: 'any' },
  { key: 'allChow', universe: ALL, kind: 'chow', hint: 'allChow' },
  { key: 'allPong', universe: ALL, kind: 'pong', hint: 'allPong' },

  // ── flushes, per suit ─────────────────────────────────────────────
  ...SUITS.flatMap((s) => [
    { key: `fullFlush:${s}`, universe: new Set(suited(s)), hint: 'fullFlush' },
    { key: `fullFlushChow:${s}`, universe: new Set(suited(s)), kind: 'chow' as const, hint: 'fullFlush' },
    { key: `fullFlushPong:${s}`, universe: new Set(suited(s)), kind: 'pong' as const, hint: 'fullFlush' },
    { key: `halfFlush:${s}`, universe: new Set<TileId>([...suited(s), ...HONOURS]), hint: 'halfFlush' },
    { key: `halfFlushPong:${s}`, universe: new Set<TileId>([...suited(s), ...HONOURS]), kind: 'pong' as const, hint: 'halfFlush' },
  ]),

  // ── terminals and honours ─────────────────────────────────────────
  { key: 'allHonours', universe: HON, kind: 'pong', hint: 'allHonours' },
  { key: 'pureTerminals', universe: TERMINALS, kind: 'pong', hint: 'pureTerminals' },
  { key: 'mixedTerminals', universe: TERM_HON, kind: 'pong', hint: 'mixedTerminals' },

  // ── the dragon hands ──────────────────────────────────────────────
  { key: 'bigThreeDragons', universe: ALL, pongs: [...DRAGONS], hint: 'bigThreeDragons' },
  ...DRAGONS.map((eye) => ({
    key: `smallThreeDragons:${eye}`,
    universe: ALL,
    pongs: DRAGONS.filter((d) => d !== eye) as TileId[],
    pair: eye as TileId,
    hint: 'smallThreeDragons',
  })),
  ...DRAGONS.map((d) => ({ key: `dragon:${d}`, universe: ALL, pongs: [d as TileId], hint: 'dragonTriplet' })),

  // ── the wind hands ────────────────────────────────────────────────
  // A pung of your own wind, or of the round's, is the cheapest fan in either
  // table and the standard way a Hong Kong hand clears the three-faan
  // minimum. Without an archetype forcing it, the search could only ever
  // produce one by accident.
  ...WINDS.map((w) => ({ key: `wind:${w}`, universe: ALL, pongs: [w as TileId], hint: 'wind' })),
  { key: 'bigFourWinds', universe: ALL, pongs: [...WINDS], hint: 'bigFourWinds' },
  ...WINDS.map((eye) => ({
    key: `smallFourWinds:${eye}`,
    universe: ALL,
    pongs: WINDS.filter((w) => w !== eye) as TileId[],
    pair: eye as TileId,
    hint: 'smallFourWinds',
  })),
  // ── 綠一色. Singapore prices it; Hong Kong does not have it, and the
  //    scorer is what decides that — the archetype simply produces the hand
  //    and lets each variant say what it is worth.
  {
    key: 'pureGreen',
    universe: new Set<TileId>(['2s', '3s', '4s', '6s', '8s', 'F']),
    hint: 'pureGreen',
  },
]

/**
 * The irregular hands, which have no sets and so cannot come out of the
 * completion search. Each is a fixed target multiset.
 */
export const IRREGULAR: readonly { key: string; tiles: readonly TileId[]; hint: string }[] = [
  {
    key: 'thirteenOrphans',
    tiles: ['1m', '9m', '1p', '9p', '1s', '9s', ...HONOURS] as TileId[],
    hint: 'thirteenOrphans',
  },
  ...SUITS.map((s) => ({
    key: `nineGates:${s}`,
    tiles: [`1${s}`, `1${s}`, `1${s}`, `2${s}`, `3${s}`, `4${s}`, `5${s}`,
            `6${s}`, `7${s}`, `8${s}`, `9${s}`, `9${s}`, `9${s}`] as TileId[],
    hint: 'nineGates',
  })),
]

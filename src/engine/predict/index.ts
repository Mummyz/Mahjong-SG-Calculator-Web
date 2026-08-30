/**
 * Prediction — what a partial hand could still become.
 *
 * THE RULE THIS MODULE IS BUILT AROUND: the predictor proposes, the scorer
 * certifies. Every candidate it returns is a COMPLETE, LEGAL hand that has
 * been through the variant's own `score()`, and the fan it reports is the
 * number that scorer returned. There is no fan table in this file and there
 * must never be one — a suggestion worth less than it claims is worse than no
 * suggestion at all.
 *
 * What it does NOT do: guess at the wall, weigh probabilities, or account for
 * what other players have discarded. It answers a structural question — which
 * complete hands are nearest, and exactly which tiles are missing.
 */

import { tally, type TileId } from '../core/tiles'
import type { HandInput, MeldInput } from '../core/hand'
import type { RuleOptions, VariantPlugin, WinContext, WinMethod } from '../core/variant'
import { concealedTargets, handIsComplete, handIsReadable, type KeyedHand } from '../session/table'
import { inventoryOf } from '../variants/inventory'
import { handSignature } from '../patterns'
import { ARCHETYPES, IRREGULAR } from './archetypes'
import { ALL_TILES, bestPlan } from './complete'

export type PredictionState =
  | 'empty'      // nothing keyed at all
  | 'sparse'     // too little to name a plan without inventing one
  | 'candidates' // here is what it could become
  | 'complete'   // it is a hand; go and score it
  | 'won'        // the flower tray already won it, whatever the tiles say
  | 'notAHand'   // the right number of tiles, and they do not make a hand

export interface NeededTile {
  readonly tile: TileId
  /** How many more copies of it the hand still needs. */
  readonly count: number
}

export interface Candidate {
  /** The archetype that produced it. Stable, and an i18n key suffix. */
  readonly key: string
  /** What the scorer says the finished hand is — its own pattern keys. */
  readonly patterns: readonly string[]
  /**
   * The FLOOR: the least this hand pays across every way it can legally be
   * finished. Never computed here — it is the smallest number the variant's
   * own scorer returned. A player is never told a hand is worth more than it
   * might turn out to be.
   */
  readonly fan: number
  /** The most it pays, if it finishes the best way. */
  readonly fanBest: number
  /**
   * The needed tiles that make it a legal win when they arrive LAST.
   * Shorter than `needed` means some finishes do not win at all — Singapore's
   * 平胡 turns entirely on the wait, so which tile lands last decides both the
   * value and, sometimes, whether it is a win.
   */
  readonly finishOn: readonly TileId[]
  /** How it must be won for the best figure — a self-draw, or either. */
  readonly bestWin: WinMethod
  /** The tile that, arriving last, produces `fanBest`. */
  readonly bestTile: TileId
  /**
   * Whether any finish wins on a claimed tile at all. False means the hand is
   * only ever a win if the last tile is drawn — Singapore's 四暗刻 by
   * definition, and any Hong Kong hand that needs 自摸 to clear the minimum.
   */
  readonly winsOnDiscard: boolean
  readonly limitApplied: boolean
  /** Exactly what is still missing, in canonical order. */
  readonly needed: readonly NeededTile[]
  /** How many tiles that is in total — "you are N tiles away". */
  readonly away: number
  /** Tiles currently held that this hand has no room for. */
  readonly discard: readonly TileId[]
  /** The finished hand, so the claim can be reproduced. */
  readonly example: HandInput
}

export interface Hint {
  /** An archetype worth aiming for, named but not costed. */
  readonly key: string
  /** Tiles already held that point that way. */
  readonly seen: number
}

export interface Prediction {
  readonly state: PredictionState
  /** Concealed tiles keyed so far. */
  readonly keyed: number
  /** Concealed tiles a finished hand needs. */
  readonly target: number
  /** Ranked best first: fewest tiles away, then most fan. */
  readonly candidates: readonly Candidate[]
  /** Only populated in the `sparse` state, where precision would be a lie. */
  readonly hints: readonly Hint[]
  /** The context the fan figures were produced under, so they can be checked. */
  readonly ctx: WinContext
}

/**
 * Below this many tiles a hand is compatible with almost every shape in the
 * game, and naming "the tiles you need" would be inventing a plan the player
 * never had. Under it we name shapes worth aiming for and nothing else.
 */
export const SPARSE_BELOW = 5

/** How many candidates are worth showing on a phone. */
const KEEP = 4

const meldTiles = (m: MeldInput): TileId[] => m.tiles.trim().split(/\s+/)
const order = new Map<TileId, number>(ALL_TILES.map((t, i) => [t, i]))
const byOrder = (a: TileId, b: TileId) => (order.get(a) ?? 99) - (order.get(b) ?? 99)

export interface PredictOptions {
  readonly rules?: Partial<RuleOptions>
  /** Cap the number of candidates returned. Defaults to four. */
  readonly limit?: number
}

export function predict(
  plugin: VariantPlugin,
  hand: KeyedHand,
  seatCtx: Pick<WinContext, 'seat' | 'prevailing'>,
  opts: PredictOptions = {},
): Prediction {
  const inv = inventoryOf(plugin)
  const { min, max } = concealedTargets(hand)
  const keyed = hand.concealed.length
  const setsNeeded = 4 - hand.melds.length
  // Once the hand is past the no-kong size, the size it is heading for is the
  // konged one — the same reading the tray uses, so the two never disagree.
  const target = keyed <= min ? min : max

  const base: Omit<Prediction, 'state' | 'candidates' | 'hints'> = {
    keyed,
    target,
    ctx: { ...seatCtx, win: 'discard' },
  }
  const done = (state: PredictionState): Prediction =>
    ({ ...base, state, candidates: [], hints: [] })

  if (setsNeeded < 0 || min < 2) return done('complete')

  // The flower tray can win the hand outright, and then the tiles are beside
  // the point. Hong Kong's 花糊 needs seven and 大花糊 eight (HK8b); Singapore
  // prices the eight as a limit hand. Which counts is the VARIANT's answer,
  // so it is asked rather than assumed: a hand of the right size scored with
  // this tray comes back naming the flower award if one applies.
  if (hand.bonus.length >= 7 && wonOnFlowers(plugin, hand, seatCtx, opts.rules)) {
    return done('won')
  }

  if (handIsComplete(hand)) {
    return done(handIsReadable(plugin, hand) ? 'complete' : 'notAHand')
  }
  // The sparse gate counts everything committed, not just the concealed part.
  // Comparing the concealed count alone meant a hand with three melds down —
  // whose target is five, and which may be one tile from a limit hand — could
  // never be predicted at all.
  const onTable = keyed + hand.melds.reduce((n, m) => n + meldTiles(m).length, 0)
  if (onTable === 0) return done('empty')

  // Copies already committed anywhere — the concealed tiles and every meld.
  const committed = tally([...hand.concealed, ...hand.melds.flatMap(meldTiles)])
  const have = tally(hand.concealed)
  // What a FINISHED hand may contain: the four copies in the game, minus the
  // ones locked into declared melds. The player's own concealed copies are
  // not subtracted — they are already part of the hand being built.
  const avail = new Map<TileId, number>()
  for (const t of ALL_TILES) {
    const inMelds = (committed.get(t) ?? 0) - (have.get(t) ?? 0)
    avail.set(t, inv.wallTiles.has(t) ? Math.max(0, 4 - inMelds) : 0)
  }

  if (onTable < SPARSE_BELOW) {
    return { ...base, state: 'sparse', candidates: [], hints: hintsFor(have, seatCtx) }
  }

  const seen = new Map<string, Candidate>()

  for (const a of ARCHETYPES) {
    const plan = planFor(a, avail, have, setsNeeded, inv.wallTiles, hand.melds)
    if (!plan) continue
    const c = certify(plugin, hand, plan, have, target, a.key, seatCtx, opts.rules)
    if (c) keepBest(seen, c)
  }

  for (const irr of IRREGULAR) {
    if (hand.melds.length > 0) continue // both irregular hands are fully concealed
    if (!irr.tiles.every((t) => inv.wallTiles.has(t))) continue
    const c = certifyIrregular(plugin, hand, irr, have, target, seatCtx, opts.rules)
    if (c) keepBest(seen, c)
  }

  // Four suggestions that are all "Half Flush with a dragon triplet" are one
  // suggestion shown four times. Group by the hands the scorer named and keep
  // the nearest of each, so the panel offers genuinely different plans.
  const byHand = new Map<string, Candidate>()
  for (const c of seen.values()) {
    const sig = handSignature(c.patterns)
    const had = byHand.get(sig)
    if (!had || c.away < had.away
      || (c.away === had.away && c.fanBest > had.fanBest)) byHand.set(sig, c)
  }

  /**
   * A plan that throws away half the hand is not a plan the player is on.
   * Allow roughly one discard per three tiles keyed, and relax only if that
   * would leave nothing to show.
   */
  const budget = Math.max(1, Math.floor(keyed / 3))
  const ranked = [...byHand.values()]
    .sort((x, y) => (x.away - y.away) || (y.fanBest - x.fanBest)
      || (y.fan - x.fan) || x.discard.length - y.discard.length)
  const near = ranked.filter((c) => c.discard.length <= budget)
  const candidates = (near.length >= 2 ? near : ranked).slice(0, opts.limit ?? KEEP)

  return {
    ...base,
    state: candidates.length > 0 ? 'candidates' : 'sparse',
    candidates,
    hints: candidates.length > 0 ? [] : hintsFor(have, seatCtx),
  }
}

/**
 * Has the flower tray already won the hand?
 *
 * Hong Kong's 花糊 and 大花糊 are declared the instant the flower is drawn and
 * end the deal on the spot (HK8b); Singapore prices all eight as a limit hand.
 * Which of those applies is the VARIANT's answer, so it is asked: score any
 * legal hand of the right size with this tray and see whether the award comes
 * back. If it does, the tiles are beside the point and telling the player they
 * are nine tiles from winning would be nonsense.
 */
const FLOWER_HANDS = new Set(['sevenFlowers', 'eightFlowers'])

function wonOnFlowers(
  plugin: VariantPlugin,
  hand: KeyedHand,
  seatCtx: Pick<WinContext, 'seat' | 'prevailing'>,
  rules?: Partial<RuleOptions>,
): boolean {
  const probe: HandInput = {
    concealed: '1m 2m 3m 4m 5m 6m 7m 8m 9m 2p 3p 4p 5p 5p',
    melds: [],
    bonus: [...hand.bonus],
  }
  if (hand.melds.length > 0) return false
  const r = plugin.score(probe, { ...seatCtx, win: 'discard', winningTile: '5p' }, rules)
  return r.valid && r.patterns.some((p) => FLOWER_HANDS.has(p))
}

/** Two archetypes that finish as the same hand are the same suggestion. */
function keepBest(seen: Map<string, Candidate>, c: Candidate): void {
  const id = [...c.example.concealed.split(/\s+/)].sort().join(' ')
  const had = seen.get(id)
  if (!had || c.away < had.away
    || (c.away === had.away && c.fanBest > had.fanBest)) seen.set(id, c)
}

function planFor(
  a: (typeof ARCHETYPES)[number],
  avail: Map<TileId, number>,
  have: Map<TileId, number>,
  setsNeeded: number,
  playable: ReadonlySet<TileId>,
  melds: readonly MeldInput[],
) {
  const universe = new Set([...a.universe].filter((t) => playable.has(t)))
  if (universe.size === 0) return null

  // Required pungs and a required pair are placed before the search, so the
  // search never has to be told about them — it just sees fewer sets, fewer
  // free copies and fewer of the player's tiles left to reuse.
  const forced: TileId[] = []
  let sets = setsNeeded
  let needPair = true
  const localAvail = new Map(avail)
  const localHave = new Map(have)
  const take = (t: TileId, n: number): boolean => {
    if (!playable.has(t)) return false
    if ((localAvail.get(t) ?? 0) < n) return false
    localAvail.set(t, (localAvail.get(t) ?? 0) - n)
    localHave.set(t, Math.max(0, (localHave.get(t) ?? 0) - n))
    for (let i = 0; i < n; i++) forced.push(t)
    return true
  }
  // A pung the player has already claimed is IN the hand: forcing it again
  // into the concealed part asked for three more copies that do not exist,
  // and quietly deleted every dragon and wind archetype for exactly the
  // players who were already halfway to one.
  const melded = new Set<TileId>(
    melds.filter((m) => m.t !== 'chow').map((m) => m.tiles.trim().split(/\s+/)[0] as TileId),
  )
  let keptForced = 0
  for (const p of a.pongs ?? []) {
    if (melded.has(p)) continue
    keptForced += Math.min(3, have.get(p) ?? 0)
    if (!take(p, 3)) return null
    sets -= 1
  }
  if (a.pair) {
    keptForced += Math.min(2, have.get(a.pair) ?? 0)
    if (!take(a.pair, 2)) return null
    needPair = false
  }
  if (sets < 0) return null

  const plan = bestPlan({ avail: localAvail, have: localHave, universe, sets, kind: a.kind, needPair })
  if (!plan) return null
  return { tiles: [...forced, ...plan.tiles].sort(byOrder), kept: plan.kept + keptForced }
}

function certify(
  plugin: VariantPlugin,
  hand: KeyedHand,
  plan: { tiles: TileId[]; kept: number },
  have: Map<TileId, number>,
  target: number,
  key: string,
  seatCtx: Pick<WinContext, 'seat' | 'prevailing'>,
  rules?: Partial<RuleOptions>,
): Candidate | null {
  if (plan.tiles.length !== target) return null
  return build(plugin, hand, plan.tiles, have, key, seatCtx, rules)
}

function certifyIrregular(
  plugin: VariantPlugin,
  hand: KeyedHand,
  irr: (typeof IRREGULAR)[number],
  have: Map<TileId, number>,
  target: number,
  seatCtx: Pick<WinContext, 'seat' | 'prevailing'>,
  rules?: Partial<RuleOptions>,
): Candidate | null {
  // The fourteenth tile of an irregular hand is a duplicate of one of its
  // thirteen. Pick the duplicate the player is most likely to already hold.
  let best: Candidate | null = null
  for (const dup of new Set(irr.tiles)) {
    const tiles = [...irr.tiles, dup].sort(byOrder)
    if (tiles.length !== target) return null
    if ([...tally(tiles).values()].some((n) => n > 4)) continue
    const c = build(plugin, hand, tiles, have, irr.key, seatCtx, rules)
    if (c && (!best || c.away < best.away
      || (c.away === best.away && c.fanBest > best.fanBest))) best = c
  }
  return best
}

function build(
  plugin: VariantPlugin,
  hand: KeyedHand,
  tiles: TileId[],
  have: Map<TileId, number>,
  key: string,
  seatCtx: Pick<WinContext, 'seat' | 'prevailing'>,
  rules?: Partial<RuleOptions>,
): Candidate | null {
  const want = tally(tiles)
  const needed: NeededTile[] = []
  for (const [t, n] of want) {
    const short = n - (have.get(t) ?? 0)
    if (short > 0) needed.push({ tile: t, count: short })
  }
  needed.sort((a, b) => byOrder(a.tile, b.tile))
  const away = needed.reduce((n, x) => n + x.count, 0)
  if (away === 0) return null // already there; nothing to predict

  const discard: TileId[] = []
  for (const [t, n] of have) {
    const used = want.get(t) ?? 0
    // A fourth copy sitting on top of a triplet is a concealed kong waiting to
    // be declared, not a tile to throw away. This module does not yet build
    // plans that CONTAIN a kong (see the scope note in predict/README), so the
    // least it can do is not tell the player to discard one.
    if (n === 4 && used >= 3) continue
    for (let i = 0; i < n - used; i++) discard.push(t)
  }
  discard.sort(byOrder)

  const example: HandInput = {
    concealed: tiles.join(' '),
    melds: [...hand.melds],
    bonus: [...hand.bonus],
  }

  /**
   * THE CERTIFICATION, and it is the whole safety property of this module.
   *
   * A hand is not worth one number. Which of the missing tiles arrives LAST,
   * and whether it is drawn or claimed, both change the answer — Singapore's
   * 平胡 (R5) forfeits its four tai on a closed wait and can take the hand
   * below the minimum entirely, and Hong Kong's ordinary concealed hand only
   * clears three faan once 自摸 is counted (HK8a, HK2).
   *
   * So every realisation is scored: each needed tile as the last one, drawn
   * and claimed. The candidate survives if ANY of them is a legal win, and
   * the figure reported is the FLOOR over the ones that are. Scoring one
   * arbitrary realisation and printing it flat was how this module told
   * players a hand was worth four fan when finishing it the other way was
   * not a win at all.
   */
  let floor = Infinity
  let best = -1
  let limitApplied = false
  let patterns: readonly string[] = []
  let bestWin: WinMethod = 'discard'
  let bestTile: TileId = needed[0]!.tile
  let winsOnDiscard = false
  const finishOn: TileId[] = []

  for (const n of needed) {
    let winsHere = false
    for (const win of ['discard', 'selfDraw'] as const) {
      const ctx: WinContext = { ...seatCtx, win, winningTile: n.tile }
      const r = plugin.score(example, ctx, rules)
      if (!r.valid) continue
      winsHere = true
      if (win === 'discard') winsOnDiscard = true
      if (r.totalTai < floor) floor = r.totalTai
      if (r.totalTai > best) {
        best = r.totalTai
        patterns = r.patterns
        limitApplied = r.limitApplied
        bestWin = win
        bestTile = n.tile
      }
    }
    if (winsHere) finishOn.push(n.tile)
  }
  if (finishOn.length === 0) return null

  return {
    key,
    patterns,
    fan: floor,
    fanBest: best,
    finishOn,
    bestWin,
    bestTile,
    winsOnDiscard,
    limitApplied,
    needed,
    away,
    discard,
    example,
  }
}

/**
 * The sparse state. With four tiles or fewer nothing is decided, so we name
 * the directions the tiles already lean in rather than inventing a plan.
 *
 * `seen` is a count of TILES in every case — mixing a count of pairs into the
 * same ranking made the list sort against itself.
 */
function hintsFor(
  have: Map<TileId, number>,
  seatCtx: Pick<WinContext, 'seat' | 'prevailing'>,
): Hint[] {
  const out: Hint[] = []
  const count = (pred: (t: TileId) => boolean) => {
    let n = 0
    for (const [t, c] of have) if (pred(t)) n += c
    return n
  }
  for (const s of ['m', 'p', 's']) {
    const n = count((t) => t.endsWith(s))
    if (n > 0) out.push({ key: `flush:${s}`, seen: n })
  }
  // Only the honours that actually pay: the three dragons, your own wind and
  // the round's. A triplet of any other wind is worth nothing in either
  // variant, and the copy promises "real fan".
  const scoring = new Set<TileId>(['C', 'F', 'P', seatCtx.seat, seatCtx.prevailing])
  const honours = count((t) => scoring.has(t))
  if (honours > 0) out.push({ key: 'honours', seen: honours })
  const paired = [...have.entries()].filter(([, n]) => n >= 2).reduce((n, [, c]) => n + c, 0)
  if (paired > 0) out.push({ key: 'allPong', seen: paired })
  const terminals = count((t) => t.length === 2 && (t[0] === '1' || t[0] === '9'))
  if (terminals > 0) out.push({ key: 'terminals', seen: terminals })
  return out.sort((a, b) => b.seen - a.seen).slice(0, 3)
}

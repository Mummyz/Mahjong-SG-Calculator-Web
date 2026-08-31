/**
 * The table session: who deals, which wind each player is sitting on, and how
 * that changes between hands.
 *
 * Rotation is a variant rule, and the two variants in the FINAL LINEUP happen
 * to agree on every part of it — the dealer keeps the deal by winning and
 * keeps it on a washout, and the prevailing wind advances only once the deal
 * has been all the way round the table. Singapore RULING R16; Hong Kong
 * RULINGS HK6 and HK7, which was chosen to match so that one table module
 * serves both. If a third variant ever disagreed this would move behind the
 * plugin interface; today that would overstate how much they differ.
 *
 * Scoring a keyed hand IS variant-dependent, so `scoreKeyedHand` takes the
 * plugin. Everything else here is tiles and seats.
 */

import { WINDS, tally, type TileId, type Wind } from '../core/tiles'
import type { HandInput, MeldInput } from '../core/hand'
import type {
  InstantPayout, PaymentBreakdown,
  RuleOptions, ScoreOk, ScoreRejected, ScoreResult, VariantPlugin, WinContext,
} from '../core/variant'

export interface TableState {
  /** Four names in seating order. The deal passes along this order. */
  readonly players: readonly string[]
  /** Which of the four is the person using the app. */
  readonly youIndex: number
  /** Which of the four currently holds East. */
  readonly dealerIndex: number
  /** Index into WINDS for the prevailing wind. */
  readonly prevailingIndex: number
  /** How many times the deal has passed on in this round, 0–3. */
  readonly dealsThisRound: number
  /** 1-based, counts every hand played at this table. */
  readonly handNumber: number
}

export const newTable = (players: readonly string[], youIndex = 0, dealerIndex = 0): TableState => ({
  players: [...players],
  youIndex,
  dealerIndex,
  prevailingIndex: 0,
  dealsThisRound: 0,
  handNumber: 1,
})

/** The wind a given player is sitting on this hand. */
export const seatWindOf = (t: TableState, playerIndex: number): Wind =>
  WINDS[(playerIndex - t.dealerIndex + 4) % 4]!

export const prevailingWind = (t: TableState): Wind => WINDS[t.prevailingIndex % 4]!
export const yourSeat = (t: TableState): Wind => seatWindOf(t, t.youIndex)
export const isDealer = (t: TableState, playerIndex: number): boolean =>
  playerIndex === t.dealerIndex

/** The player sitting on a given wind this hand. */
export const playerOnWind = (t: TableState, wind: Wind): number =>
  (t.dealerIndex + WINDS.indexOf(wind) + 4) % 4

/**
 * Advance to the next hand.
 *
 * `winnerIndex` is the player who won, or null for a washout. The dealer keeps
 * the deal by winning, and also keeps it on a washout — the usual Singapore
 * convention (see RULING R16). Otherwise the deal passes on, and the prevailing
 * wind moves once it has been all the way round the table.
 */
export function advanceTable(t: TableState, winnerIndex: number | null): TableState {
  const dealerHolds = winnerIndex === null || winnerIndex === t.dealerIndex
  if (dealerHolds) return { ...t, handNumber: t.handNumber + 1 }

  // Count the passes rather than watching for seat 0: a table can start with
  // any player dealing, and a round is four deals however it is numbered.
  const deals = t.dealsThisRound + 1
  const circuit = deals >= 4
  return {
    ...t,
    dealerIndex: (t.dealerIndex + 1) % 4,
    dealsThisRound: circuit ? 0 : deals,
    prevailingIndex: circuit ? (t.prevailingIndex + 1) % 4 : t.prevailingIndex,
    handNumber: t.handNumber + 1,
  }
}

// ─── turning a keyed hand into engine input ──────────────────────────────

export interface KeyedHand {
  /** Tiles the player keyed in, in order. Kongs are NOT declared here. */
  readonly concealed: readonly TileId[]
  /** Melds claimed from the table, made through the Declare flow. */
  readonly melds: readonly MeldInput[]
  readonly bonus: readonly string[]
}

/** Tiles held four times over in the concealed hand: a concealed kong. */
export const concealedKongs = (concealed: readonly TileId[]): TileId[] =>
  [...tally(concealed).entries()].filter(([, n]) => n >= 4).map(([t]) => t)

/**
 * How many tiles the concealed part of the hand should hold.
 *
 * Fourteen, plus one for every kong — a kong is four tiles doing the work of
 * three, and the replacement tile makes up the difference.
 *
 * `max` reads every tile held four times over as a concealed kong; `min`
 * reads none of them as one. Both are real hands: 1p2p3p four times over
 * holds three tiles four times and is a complete fourteen-tile hand with no
 * kong in it at all. The UI must not assert either reading before the hand is
 * the size that settles it.
 */
export function concealedTargets(hand: KeyedHand): { min: number; max: number } {
  const meldTiles = hand.melds.reduce((n, m) => n + m.tiles.trim().split(/\s+/).length, 0)
  const exposedKongs = hand.melds.filter((m) => m.t === 'kong').length
  const min = 14 + exposedKongs - meldTiles
  return { min, max: min + concealedKongs(hand.concealed).length }
}

/** The larger of the two readings — what a tap is allowed to grow the hand to. */
export const concealedTarget = (hand: KeyedHand): number => concealedTargets(hand).max

/**
 * Every reading of a keyed hand worth handing to the engine.
 *
 * Four identical concealed tiles are almost always a concealed kong, so the
 * fully-konged reading comes first. But the same four tiles can also be part
 * of an irregular hand that takes no melds at all — Nine Gates can hold four
 * of a terminal — so the un-konged reading is offered too, and the caller
 * keeps whichever scores. Neither reading is ever silently preferred.
 *
 * EVERY SUBSET, not just all-or-nothing. Run 6: a hand holding two quads at
 * fifteen tiles is a real hand — one quad melded as a kong, the other read as
 * a pong plus a tile that joins a chow — and the old all-or-none enumeration
 * had no reading for it. It offered a sixteen-tile konged reading and a
 * fifteen-tile plain one, scored neither, and the player was told their tiles
 * were not a hand with nothing to do about it.
 */
export function composeHands(hand: KeyedHand): HandInput[] {
  const flat = (t: readonly TileId[]) => t.join(' ')
  const plain: HandInput = {
    concealed: flat(hand.concealed),
    melds: [...hand.melds],
    bonus: [...hand.bonus],
  }

  const kongs = concealedKongs(hand.concealed)
  if (kongs.length === 0) return [plain]

  const readings: HandInput[] = []
  // Descending by kong count, so the fullest reading is still first.
  for (let mask = (1 << kongs.length) - 1; mask >= 0; mask--) {
    const take = kongs.filter((_, i) => (mask >> i) & 1)
    if (take.length === 0) continue
    const rest = [...hand.concealed]
    const kongMelds: MeldInput[] = []
    for (const k of take) {
      for (let i = 0; i < 4; i++) {
        const at = rest.indexOf(k)
        if (at >= 0) rest.splice(at, 1)
      }
      kongMelds.push({ t: 'kong', tiles: [k, k, k, k].join(' '), open: false })
    }
    readings.push({
      concealed: flat(rest),
      melds: [...hand.melds, ...kongMelds],
      bonus: [...hand.bonus],
    })
  }
  readings.sort((a, b) => b.melds!.length - a.melds!.length)
  return [...readings, plain]
}

// ─── guided meld declaration ─────────────────────────────────────────────

export type MeldKind = 'chow' | 'pong' | 'kong'

/** How many of each meld kind a tile is worth taking out of the wall. */
const COPIES: Record<MeldKind, number> = { chow: 1, pong: 3, kong: 4 }

const SUITS = ['m', 'p', 's'] as const
const suited = (): TileId[] =>
  SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`))
const HONOURS: TileId[] = ['E', 'S', 'W', 'N', 'C', 'F', 'P']
const ALL_TILES: TileId[] = [...suited(), ...HONOURS]

/** The three-tile runs a suited tile can belong to. */
const runsContaining = (t: TileId): TileId[][] => {
  const r = Number(t[0])
  const s = t[1]
  if (!Number.isInteger(r) || !s || !SUITS.includes(s as never)) return []
  const out: TileId[][] = []
  for (let lo = Math.max(1, r - 2); lo <= Math.min(7, r); lo++) {
    out.push([`${lo}${s}`, `${lo + 1}${s}`, `${lo + 2}${s}`])
  }
  return out
}

const runsFor = (chosen: readonly TileId[]): TileId[][] => {
  if (chosen.length === 0) {
    return SUITS.flatMap((s) =>
      Array.from({ length: 7 }, (_, i) => [`${i + 1}${s}`, `${i + 2}${s}`, `${i + 3}${s}`]),
    )
  }
  return runsContaining(chosen[0]!).filter((run) => chosen.every((c) => run.includes(c)))
}

/**
 * The tiles that may legally be tapped next while declaring a meld.
 *
 * `used` counts every copy already committed anywhere in the hand, so a tile
 * the player has run out of is never offered. This is the single source of
 * truth for the greyed-out guidance: the UI shows exactly this set live, and
 * refuses every tap outside it.
 */
export function legalNextTiles(
  kind: MeldKind,
  chosen: readonly TileId[],
  used: ReadonlyMap<TileId, number>,
): Set<TileId> {
  const free = (t: TileId, want: number) => (4 - (used.get(t) ?? 0)) >= want

  if (kind === 'pong' || kind === 'kong') {
    return new Set(ALL_TILES.filter((t) => free(t, COPIES[kind])))
  }

  const need = new Map<TileId, number>()
  for (const c of chosen) need.set(c, (need.get(c) ?? 0) + 1)

  const out = new Set<TileId>()
  for (const run of runsFor(chosen)) {
    // Every tile of the run has to be affordable, counting the ones already
    // chosen, or offering the next tile would lead the player into a dead end.
    const affordable = run.every((t) => free(t, (need.get(t) ?? 0) + (chosen.includes(t) ? 0 : 1)))
    if (!affordable) continue
    for (const t of run) {
      if (!chosen.includes(t) && free(t, 1)) out.add(t)
    }
  }
  return out
}

/** How many taps a meld of this kind still needs. */
export const tilesRemaining = (kind: MeldKind, chosen: readonly TileId[]): number =>
  (kind === 'chow' ? 3 : 1) - chosen.length

/** The finished meld once enough tiles have been tapped. */
export function buildMeld(kind: MeldKind, chosen: readonly TileId[]): MeldInput | null {
  if (tilesRemaining(kind, chosen) > 0) return null
  if (kind === 'chow') {
    const sorted = [...chosen].sort((a, b) => Number(a[0]) - Number(b[0]))
    return { t: 'chow', tiles: sorted.join(' '), open: true }
  }
  const t = chosen[0]!
  return { t: kind, tiles: Array.from({ length: COPIES[kind] }, () => t).join(' '), open: true }
}

// ─── scoring a keyed hand ────────────────────────────────────────────────

/**
 * Score a keyed hand, trying every reading `composeHands` offers and keeping
 * the best.
 *
 * When none of them wins, the rejection reported is the most informative one.
 * `composeHands` puts the konged reading first, and for a fourteen-tile hand
 * that holds four of something the konged reading is one tile short — so
 * reporting it verbatim told a player with fourteen tiles that they needed
 * fourteen tiles. A rejection that is about the tile COUNT is only worth
 * showing when no reading got past the count.
 */
export function scoreKeyedHand(
  plugin: VariantPlugin,
  hand: KeyedHand,
  ctx: WinContext,
  opts?: Partial<RuleOptions>,
): { result: ScoreResult; input: HandInput } {
  const inputs = composeHands(hand)
  let best: { result: ScoreOk; input: HandInput } | null = null
  let rejected: { result: ScoreRejected; input: HandInput } | null = null

  for (const input of inputs) {
    const result = plugin.score(input, ctx, opts)
    if (!result.valid) {
      if (rejected === null || rejected.result.reason === 'wrongTileCount') {
        rejected = { result, input }
      }
      continue
    }
    if (!best || result.totalTai > best.result.totalTai) best = { result, input }
  }
  return best ?? rejected ?? { result: plugin.score(inputs[0]!, ctx, opts), input: inputs[0]! }
}

// ─── submitting a hand ───────────────────────────────────────────────────

/**
 * How the hand was won. Collected at submit time, never earlier: the win
 * context is only meaningful once the tiles are proven complete.
 */
export interface WinSubmission {
  readonly winningTile: TileId
  readonly win: 'selfDraw' | 'discard'
  /** Index of the player who threw it; null on a self-draw. */
  readonly discarderIndex: number | null
  readonly flags: readonly string[]
  readonly pao: boolean
}

/**
 * WHAT ONE SETTLED HAND MOVED, per player, signed.
 *
 * The result screen used to render three rows — the people who pay YOU — and
 * the winner was implied by their absence. A four-player ledger has to show
 * four players, and it has to balance: a settlement where the signs do not sum
 * to zero is money invented or destroyed, which is the one thing a scoring
 * app cannot do.
 *
 * So it is built by MOVING units, never by writing them: every unit is taken
 * from one player and given to another in the same statement. Zero-sum is a
 * property of the construction, not of the arithmetic being right.
 */
export interface HandLedger {
  readonly handNumber: number
  /** The mahjong round it was played in, 1–4. */
  readonly round: number
  /** null on a washout, or when someone else won and the app never scored it. */
  readonly winnerIndex: number | null
  /** Signed units per player, in seat order. Sums to zero. */
  readonly deltas: readonly number[]
}

/**
 * Turn a scored hand into a signed four-player settlement.
 *
 * Instant payouts are included: they are money that changed hands during this
 * hand, and a running total that left them out would not settle at the end of
 * the night. The result screen still shows them in their own block, because
 * WHY money moved and HOW MUCH are different questions.
 */
export function settleHand(args: {
  playerCount: number
  winnerIndex: number
  pay: PaymentBreakdown
  win: 'selfDraw' | 'discard'
  discarderIndex: number | null
  instants?: readonly InstantPayout[]
}): number[] {
  const { playerCount, winnerIndex, pay, win, discarderIndex } = args
  const deltas = Array<number>(playerCount).fill(0)
  const move = (from: number, units: number) => {
    if (from === winnerIndex || units === 0) return
    deltas[from] = (deltas[from] ?? 0) - units
    deltas[winnerIndex] = (deltas[winnerIndex] ?? 0) + units
  }
  for (let i = 0; i < playerCount; i++) {
    if (i === winnerIndex) continue
    const owed = win === 'discard' && pay.fromDiscarder !== null && i === discarderIndex
      ? pay.fromDiscarder
      : pay.fromEachOther
    move(i, owed)
    for (const p of args.instants ?? []) move(i, p.fromEachPlayer)
  }
  return deltas
}

/** Sum a run of settled hands into one signed figure per player. */
export function runningTotal(history: readonly HandLedger[], playerCount: number): number[] {
  const out = Array<number>(playerCount).fill(0)
  for (const h of history) {
    for (let i = 0; i < playerCount; i++) out[i] = (out[i] ?? 0) + (h.deltas[i] ?? 0)
  }
  return out
}

/**
 * The mahjong ROUND, 1–4 — 東 South West North, the prevailing wind cycle.
 *
 * Not the deal counter. A round is at most four, and "Round 8" is a state the
 * game cannot be in; the signboard said it for eight deals because it was
 * showing handNumber under a label that means something else.
 */
export const roundNumber = (t: TableState): number => (t.prevailingIndex % 4) + 1

/** Which deal of the current round this is, 1–4. */
export const dealInRound = (t: TableState): number => t.dealsThisRound + 1

/** Is the keyed hand the right size to be a winning hand? */
export function handIsComplete(hand: KeyedHand): boolean {
  const { min, max } = concealedTargets(hand)
  if (min < 2) return false
  // ANY size in the range, not just the two ends. Four of a tile is nearly
  // always a concealed kong, but an irregular hand can hold four with no meld
  // at all — and with two quads held, reading one as a kong and not the other
  // lands exactly between min and max. composeHands now offers that reading,
  // so the size check has to admit it.
  return hand.concealed.length >= min && hand.concealed.length <= max
}

/**
 * Do these tiles make a hand at all?
 *
 * The size check above is about counting; this is about whether the engine can
 * read the tiles as four sets and a pair, or as one of the irregular hands.
 * It needs no win context, so the player can be told before the submit wizard
 * rather than after it — mis-keying one of fourteen taps is the likeliest
 * mistake at a table, and walking someone through two wizard steps to reach
 * "these are not a hand" throws their answers away for nothing.
 */
export function handIsReadable(plugin: VariantPlugin, hand: KeyedHand): boolean {
  if (!handIsComplete(hand)) return false
  // The seat and the win method are not known yet and do not matter: this
  // asks about structure. A hand that is merely below the minimum HAS a
  // structure, and the player should be told that after scoring rather than
  // be stopped from scoring at all.
  const ctx: WinContext = { seat: 'E', prevailing: 'E', win: 'selfDraw' }
  for (const input of composeHands(hand)) {
    const r = plugin.score(input, ctx)
    if (r.valid || r.reason === 'belowMinimum') return true
  }
  return false
}

/**
 * Does a submission still describe the hand in front of us?
 *
 * This is the guard against the Run 2B bug class: a winning tile chosen while
 * the hand was complete, then left behind when a tile was undone. Any change
 * that removes the winning tile from the hand invalidates the whole
 * submission, so no stale win context can survive an edit.
 */
export function submissionMatchesHand(hand: KeyedHand, sub: WinSubmission | null): boolean {
  if (sub === null) return false
  if (!handIsComplete(hand)) return false
  return hand.concealed.includes(sub.winningTile)
}

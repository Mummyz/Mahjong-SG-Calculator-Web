/**
 * Singapore payments — RULING R11, R12, R13.
 *
 * Amounts are multiples of the agreed 1-tai stake: at 1 tai a plain discard
 * loser pays exactly 1 unit, and that doubles with every further tai.
 */

import { ANIMALS, FLOWERS, SEASONS, type BonusId } from '../../core/tiles'
import type {
  InstantPayout, PaymentBreakdown, RuleOptions, ScoreResult, WinContext,
} from '../../core/variant'
import { SINGAPORE_DEFAULTS } from './score'

export function payments(
  score: ScoreResult,
  ctx: WinContext,
  partial?: Partial<RuleOptions>,
): PaymentBreakdown | null {
  if (!score.valid) return null
  const opts: RuleOptions = { ...SINGAPORE_DEFAULTS, ...partial }
  const base = score.base

  let out: PaymentBreakdown
  if (ctx.pao && ctx.win === 'discard') {
    // The discarder covers the other two as well; they pay nothing.
    out = { fromDiscarder: 4 * base, fromEachOther: 0, winnerTotal: 4 * base }
  } else if (score.patterns.includes('thirteenWonders')) {
    // R12: paid as a self-draw whichever way it was won.
    out = { fromDiscarder: 2 * base, fromEachOther: 2 * base, winnerTotal: 6 * base }
  } else if (ctx.win === 'selfDraw') {
    out = { fromDiscarder: null, fromEachOther: 2 * base, winnerTotal: 6 * base }
  } else {
    out = { fromDiscarder: 2 * base, fromEachOther: base, winnerTotal: 4 * base }
  }

  // R13 — off by default; not a general Singapore rule.
  if (opts.doubleSpecialHandPayout && score.totalTai >= opts.limit) {
    out = {
      fromDiscarder: out.fromDiscarder === null ? null : out.fromDiscarder * 2,
      fromEachOther: out.fromEachOther * 2,
      winnerTotal: out.winnerTotal * 2,
    }
  }
  return out
}

/**
 * Mid-game payouts that settle immediately and are never re-paid at the end
 * (TT SS-Instant payment). The agreed rate is pegged to a 1-tai self-pick:
 * 2 units per player for a 'Bitten' (咬到) event, 4 for a 'Concealed Kong'
 * (暗杠) level event. Cumulative.
 */
const YAO_DAO = 2
const AN_GANG = 4

export function instantPayouts(
  bonus: readonly BonusId[],
  ctx: Pick<WinContext, 'seat'>,
): InstantPayout[] {
  const held = new Set<BonusId>(bonus)
  const out: InstantPayout[] = []
  const add = (key: string, each: number) =>
    out.push({ key, fromEachPlayer: each, total: each * 3 })

  if (held.has('cat') && held.has('rat')) add('catAndRat', YAO_DAO)
  if (held.has('rooster') && held.has('centipede')) add('roosterAndCentipede', YAO_DAO)
  if (ANIMALS.every((a) => held.has(a))) add('allAnimals', AN_GANG)

  const idx = { E: 1, S: 2, W: 3, N: 4 }[ctx.seat]
  if (held.has(`F${idx}` as BonusId) && held.has(`S${idx}` as BonusId)) {
    add('bothSeatFlowers', YAO_DAO)
  }
  if (FLOWERS.every((f) => held.has(f))) add('completeFlowerGroup', AN_GANG)
  if (SEASONS.every((s) => held.has(s))) add('completeSeasonGroup', AN_GANG)

  return out
}

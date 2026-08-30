/**
 * Hong Kong Old Style payments — RULING HK4, HK17, HK18.
 *
 * `score.base` is the winner's total on a discard win, read straight off
 * Family A's published 出銃 column. Every figure below is a fraction of it:
 *
 *   full payment 全銃制   discard    discarder base, others nothing
 *   half payment 陪銃制   discard    discarder base/2, others base/4 each
 *   either                self-draw  each of three base/2, winner 1.5 x base
 *
 * There is no dealer term anywhere in this file, and RULING HK5 explains why
 * that is a finding rather than an omission.
 */

import type { PaymentBreakdown, RuleOptions, ScoreResult, WinContext } from '../../core/variant'
import { HONGKONG_DEFAULTS, isInstantFlowerHand } from './score'

export function payments(
  score: ScoreResult,
  ctx: WinContext,
  partial?: Partial<RuleOptions>,
): PaymentBreakdown | null {
  if (!score.valid) return null
  const opts: RuleOptions = { ...HONGKONG_DEFAULTS, ...partial }
  const base = score.base

  // RULING HK8b — 花糊 and 大花糊 settle as a self-draw however they arrived.
  const selfDraw = ctx.win === 'selfDraw' || isInstantFlowerHand(score.patterns)
  if (selfDraw) {
    return { fromDiscarder: null, fromEachOther: base / 2, winnerTotal: (base * 3) / 2 }
  }

  // RULING HK18 — pao loads the whole loss onto the discarder. Under full
  // payment that is what already happens, so it only bites under half payment.
  if (ctx.pao || !opts.halfPayment) {
    return { fromDiscarder: base, fromEachOther: 0, winnerTotal: base }
  }
  return { fromDiscarder: base / 2, fromEachOther: base / 4, winnerTotal: base }
}

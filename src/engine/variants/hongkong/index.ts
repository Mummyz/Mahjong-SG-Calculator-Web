/**
 * Hong Kong Old Style — 144 tiles, no animals.
 *
 * Every rule traces to docs/sources/RULING-LOG-HK.md and is proven by the
 * golden corpus in src/engine/corpus/hongkong/, which was written from the
 * archived sources before this code existed.
 */

import type { RuleOptions, PaymentBreakdown, ScoreResult, VariantPlugin, WinContext } from '../../core/variant'
import type { HandInput } from '../../core/hand'
import { HONGKONG_TILE_SET } from './tileset'
import { HONGKONG_DEFAULTS, basePoints, handSize, score } from './score'
import { payments } from './payments'

export const hongkong: VariantPlugin = {
  id: 'hongkong',
  tileSet: HONGKONG_TILE_SET,
  defaults: HONGKONG_DEFAULTS,
  // RULING HK15 — 「補花後不算」. A flower replacement scores nothing here, so
  // asking about it would be asking a question with no consequence.
  flags: [
    'robbingKong', 'lastTile', 'kongReplacement',
    'heavenly', 'earthly', 'humanly', 'kongOnKong',
  ],
  handSize,
  // RULING HK17 — the published 出銃 column IS the fan-to-base table,
  // so the lost-hand settlement reads the same function scoring does.
  baseForFan: basePoints,
  score(hand: HandInput, ctx: WinContext, opts?: Partial<RuleOptions>): ScoreResult {
    return score(hand, ctx, opts)
  },
  payments(s: ScoreResult, ctx: WinContext, opts?: Partial<RuleOptions>): PaymentBreakdown | null {
    return payments(s, ctx, opts)
  },
  // RULING HK20 — Hong Kong Old Style has no mid-game instant payouts.
}

export { HONGKONG_TILE_SET, HONGKONG_DEFAULTS, basePoints, handSize, score, payments }

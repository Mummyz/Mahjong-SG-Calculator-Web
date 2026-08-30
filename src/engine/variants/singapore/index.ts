/**
 * Singapore Mahjong — 148 tiles (144 + 4 animals).
 *
 * Every rule traces to docs/sources/RULING-LOG.md and is proven by the golden
 * corpus in src/engine/corpus/singapore/.
 */

import type { BonusId, Wind } from '../../core/tiles'
import type {
  InstantPayout, PaymentBreakdown, RuleOptions, ScoreResult, VariantPlugin, WinContext,
} from '../../core/variant'
import type { HandInput } from '../../core/hand'
import { SINGAPORE_TILE_SET } from './tileset'
import { SINGAPORE_DEFAULTS, handSize, score } from './score'
import { instantPayouts, payments } from './payments'

export const singapore: VariantPlugin = {
  id: 'singapore',
  tileSet: SINGAPORE_TILE_SET,
  defaults: SINGAPORE_DEFAULTS,
  handSize,
  score(hand: HandInput, ctx: WinContext, opts?: Partial<RuleOptions>): ScoreResult {
    return score(hand, ctx, opts)
  },
  payments(s: ScoreResult, ctx: WinContext, opts?: Partial<RuleOptions>): PaymentBreakdown | null {
    return payments(s, ctx, opts)
  },
  instantPayouts(bonus: readonly BonusId[], seat: Wind): readonly InstantPayout[] {
    return instantPayouts(bonus, { seat })
  },
}

export { SINGAPORE_TILE_SET, SINGAPORE_DEFAULTS, handSize, score, payments, instantPayouts }

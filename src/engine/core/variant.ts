/**
 * The variant plugin interface.
 *
 * Everything variant-specific — which tiles are in play, how big a winning
 * hand is, what scores, and who pays whom — lives behind this. The core knows
 * nothing about tai, fan, or Singapore.
 */

import type { BonusId, TileId, Wind } from './tiles'
import type { HandInput, ParsedHand, RejectReason } from './hand'

/** One row of the pre-game "these are the tiles in play" screen. */
export interface TileSetGroup {
  readonly key: string
  readonly tiles: readonly (TileId | BonusId)[]
  /** How many of each tile in this group the set contains. */
  readonly copies: number
}

export interface TileSetSpec {
  readonly total: number
  readonly groups: readonly TileSetGroup[]
}

export interface RuleOptions {
  /** Maximum tai a hand can score. Agreed before play; 5 in Singapore. */
  readonly limit: number
  /** Tai a hand must reach to be a legal win (起胡). */
  readonly minTai: number
  /** RULING R13 — off by default; not a general Singapore rule. */
  readonly doubleSpecialHandPayout: boolean
  /**
   * RULING HK4 — 陪銃制: the discarder pays half the winner's total and the
   * other two pay a quarter each, instead of the discarder paying all of it.
   * Hong Kong only; Singapore never reads it.
   */
  readonly halfPayment: boolean
}

export type WinMethod = 'discard' | 'selfDraw'

export type WinFlag =
  | 'robbingKong'
  | 'lastTile'
  | 'kongReplacement'
  | 'flowerReplacement'
  | 'heavenly'
  | 'earthly'
  | 'humanly'
  | 'kongOnKong'

export interface WinContext {
  readonly seat: Wind
  readonly prevailing: Wind
  readonly win: WinMethod
  readonly winningTile?: TileId
  readonly flags?: readonly WinFlag[]
  /** 包 — the discarder pays for everyone. */
  readonly pao?: boolean
}

export interface FanComponent {
  readonly key: string
  readonly tai: number
}

export interface ScoreOk {
  readonly valid: true
  readonly patterns: readonly string[]
  readonly fan: readonly FanComponent[]
  /** Tai before the limit is applied. */
  readonly rawTai: number
  readonly totalTai: number
  readonly limitApplied: boolean
  /**
   * The money figure the payment table is built from. Each variant documents
   * what it means: Singapore's is the 1-tai stake multiplier 2^(totalTai − 1)
   * (RULING R11); Hong Kong's is the winner's total on a discard win, read
   * straight off the published 出銃 column (RULING HK17).
   */
  readonly base: number
  readonly hand: ParsedHand
}

export interface ScoreRejected {
  readonly valid: false
  readonly reason: RejectReason
  /** Present when the hand parsed but simply did not score enough. */
  readonly rawTai?: number
}

export type ScoreResult = ScoreOk | ScoreRejected

export interface PaymentBreakdown {
  /** null on a self-draw — there is no discarder. */
  readonly fromDiscarder: number | null
  readonly fromEachOther: number
  readonly winnerTotal: number
}

/** A mid-game payout that settles immediately, outside the winning hand. */
export interface InstantPayout {
  readonly key: string
  /** Paid by each of the other three players. */
  readonly fromEachPlayer: number
  readonly total: number
}

export interface VariantPlugin {
  readonly id: string
  readonly tileSet: TileSetSpec
  readonly defaults: RuleOptions
  handSize(kongCount: number): number
  score(hand: HandInput, ctx: WinContext, opts?: Partial<RuleOptions>): ScoreResult
  payments(score: ScoreResult, ctx: WinContext, opts?: Partial<RuleOptions>): PaymentBreakdown | null
  /** Instant payouts triggered by the bonus tiles held. Empty where a variant has none. */
  instantPayouts?(bonus: readonly BonusId[], seat: Wind): readonly InstantPayout[]
}

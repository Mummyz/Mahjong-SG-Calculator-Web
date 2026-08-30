/**
 * Hong Kong Old Style scoring.
 *
 * Every faan value here traces to docs/sources/RULING-LOG-HK.md, which in turn
 * cites docs/sources/hongkong-old-style-reconciliation.md. Nothing is tuned to
 * make a corpus entry pass — when the corpus and this file disagree, the
 * corpus is right until a new citation says otherwise.
 *
 * The shape of this file differs from the Singapore scorer in one important
 * way. Singapore prices named hands as whole-hand awards that absorb their
 * parts (R8b). Hong Kong's sources write the same hands as sums and say so —
 * 小三元 「本身計三番，再加兩番三元牌刻子的番數」 — so RULING HK8 awards the parts.
 * Only 例牌 absorb, and RULING HK10 says what they absorb.
 */

import { ANIMALS, FLOWERS, SEASONS, SEAT_INDEX, type BonusId } from '../../core/tiles'
import { parseHand, type HandInput, type ParsedHand } from '../../core/hand'
import type { FanComponent, RuleOptions, ScoreResult, WinContext, WinFlag } from '../../core/variant'
import { type Facts, factsFor, isNineGates, isThirteenOrphans } from './facts'

export const HONGKONG_DEFAULTS: RuleOptions = {
  limit: 10,                      // RULING HK3
  minTai: 3,                      // RULING HK2
  doubleSpecialHandPayout: false, // Singapore only — RULING R13
  halfPayment: false,             // RULING HK4
}

export const handSize = (kongCount: number): number => 14 + kongCount

const fan = (key: string, tai: number): FanComponent => ({ key, tai })
const has = (ctx: WinContext, f: WinFlag): boolean => (ctx.flags ?? []).includes(f)

/**
 * Reporting precedence when two readings score the same after the cap. The
 * more specific named hand is the one the player should be told they have,
 * and 例牌 outrank the ordinary patterns they suppress (RULING HK10).
 */
const PRECEDENCE: readonly string[] = [
  'eightFlowers', 'sevenFlowers',
  'heavenly', 'earthly', 'humanly',
  'thirteenOrphans', 'eighteenArhats', 'bigFourWinds',
  'nineGates', 'allHonours', 'pureTerminals',
  'bigThreeDragons', 'fourConcealedTriplets', 'smallThreeDragons', 'smallFourWinds',
  'fullFlush', 'halfFlush', 'allTriplets', 'mixedTerminals', 'commonHand',
]
const rank = (key: string): number => {
  const i = PRECEDENCE.indexOf(key)
  return i < 0 ? PRECEDENCE.length : i
}

/** RULING HK16 — these score, but they cannot carry a hand over the minimum. */
const FLOWER_DERIVED = new Set([
  'seatFlower', 'seatSeason', 'completeFlowerGroup', 'completeSeasonGroup', 'noFlowers',
])

/** RULING HK8b — declared the moment the flower is drawn, so nothing else is read. */
const INSTANT_FLOWER = new Set(['sevenFlowers', 'eightFlowers'])

/** RULING HK8a. 一台花 replaces the 正花 of its own series, and does not add to it. */
function bonusComponents(hand: ParsedHand, ctx: WinContext): FanComponent[] {
  if (hand.bonus.length === 0) return [fan('noFlowers', 1)]

  const held = new Set<BonusId>(hand.bonus)
  const idx = SEAT_INDEX[ctx.seat]
  const out: FanComponent[] = []

  if (FLOWERS.every((f) => held.has(f))) out.push(fan('completeFlowerGroup', 2))
  else if (held.has(`F${idx}` as BonusId)) out.push(fan('seatFlower', 1))

  if (SEASONS.every((s) => held.has(s))) out.push(fan('completeSeasonGroup', 2))
  else if (held.has(`S${idx}` as BonusId)) out.push(fan('seatSeason', 1))

  return out
}

/**
 * RULING HK8a, HK22 and HK23. The flower replacement is the one faan the
 * sources exclude outright (HK15); every other exclusion here is HK23 — a
 * circumstance that contradicts how the hand was won is not that circumstance.
 */
function circumstanceComponents(hand: ParsedHand, ctx: WinContext): FanComponent[] {
  const out: FanComponent[] = []
  const selfDraw = ctx.win === 'selfDraw'

  if (selfDraw) out.push(fan('selfDraw', 1))
  if (hand.melds.length === 0) out.push(fan('fullyConcealed', 1))   // RULING HK12
  // 搶槓 is a claim on another player's tile, so it cannot be self-drawn.
  if (has(ctx, 'robbingKong') && !selfDraw) out.push(fan('robbingKong', 1))
  // 海底撈月 off the wall, 河底撈魚 off the discard — one faan either way.
  if (has(ctx, 'lastTile')) out.push(fan(selfDraw ? 'lastTile' : 'lastDiscard', 1))
  // A replacement drawn from the dead wall is self-drawn by definition —
  // 「明/暗/加槓後自摸」. Without this a discard win carrying the flag was paid
  // 連槓開花's eight faan for a hand that cannot exist.
  if (selfDraw) {
    if (has(ctx, 'kongOnKong') && hand.kongCount >= 2) out.push(fan('kongOnKong', 8))
    else if (has(ctx, 'kongReplacement') && hand.kongCount >= 1) {
      out.push(fan('kongReplacement', 1))
    }
  }
  // RULING HK15: 「補花後不算」 — a flower replacement adds nothing.
  return out
}

/** RULING HK8b. Each of these prices the whole hand on its own. */
function wholeHandAwards(hand: ParsedHand, facts: Facts): FanComponent[] {
  const out: FanComponent[] = []
  if (facts.bigFourWinds) out.push(fan('bigFourWinds', 13))
  if (hand.kongCount === 4) out.push(fan('eighteenArhats', 13))
  if (facts.allHonour) out.push(fan('allHonours', 10))
  if (facts.pureTerminals) out.push(fan('pureTerminals', 10))
  if (isNineGates(hand)) out.push(fan('nineGates', 10))
  return out
}

/** RULING HK8a. The ordinary patterns, which compose freely with each other. */
function composedPatterns(facts: Facts, ctx: WinContext): FanComponent[] {
  const out: FanComponent[] = []

  // shape — mutually exclusive by definition
  if (facts.allConcealedPong) out.push(fan('fourConcealedTriplets', 8))   // RULING HK9/HK21
  else if (facts.allPong) out.push(fan('allTriplets', 3))
  else if (facts.allChow) out.push(fan('commonHand', 1))                  // RULING HK14

  // flush — exclusive, stacks with shape
  if (facts.fullFlush) out.push(fan('fullFlush', 7))
  else if (facts.halfFlush) out.push(fan('halfFlush', 3))

  if (facts.mixedTerminals) out.push(fan('mixedTerminals', 1))            // RULING HK8

  if (facts.bigThreeDragons) out.push(fan('bigThreeDragons', 5))
  else if (facts.smallThreeDragons) out.push(fan('smallThreeDragons', 3))
  for (let i = 0; i < facts.dragonSets; i++) out.push(fan('dragonTriplet', 1))

  if (facts.smallFourWinds) out.push(fan('smallFourWinds', 3))            // RULING HK9
  for (const w of facts.windSets) {
    if (w === ctx.seat) out.push(fan('seatWind', 1))
    if (w === ctx.prevailing) out.push(fan('prevailingWind', 1))
  }

  return out
}

interface Candidate { readonly comps: readonly FanComponent[] }

const total = (c: Candidate): number => c.comps.reduce((n, f) => n + f.tai, 0)

const better = (a: Candidate, b: Candidate, L: number): Candidate => {
  const capped = (c: Candidate) => Math.min(total(c), L)
  if (capped(a) !== capped(b)) return capped(a) > capped(b) ? a : b
  // Tie after the cap — two 例牌 at once, or two readings of the same tiles.
  // Report the more specific hand. Suppression itself is not done here: a
  // 例牌 removes its rivals before they ever become candidates (HK10).
  const best = (c: Candidate) => Math.min(...c.comps.map((f) => rank(f.key)), PRECEDENCE.length)
  if (best(a) !== best(b)) return best(a) < best(b) ? a : b
  if (total(a) !== total(b)) return total(a) > total(b) ? a : b
  return a.comps.length <= b.comps.length ? a : b
}

export function score(
  input: HandInput,
  ctx: WinContext,
  partial?: Partial<RuleOptions>,
): ScoreResult {
  const opts: RuleOptions = { ...HONGKONG_DEFAULTS, ...partial }

  // RULING HK1 — 144 tiles. The animals belong to Singapore's 148 and the
  // shared parser accepts them, so this variant has to refuse them itself.
  for (const b of input.bonus ?? []) {
    if ((ANIMALS as readonly string[]).includes(b)) return { valid: false, reason: 'tileNotInSet' }
  }

  const parsed = parseHand(input, { handSize, winningTile: ctx.winningTile })
  if (!parsed.ok) return { valid: false, reason: parsed.reason }
  const hand = parsed.hand

  const bonusCount = hand.bonus.length
  const circumstance = circumstanceComponents(hand, ctx)
  const bonus = bonusComponents(hand, ctx)
  const orphans = isThirteenOrphans(hand)

  // RULING HK8b — the flower hands end the deal on the spot, so nothing else
  // about the hand is read and the settlement is a self-draw either way.
  if (bonusCount >= 7) {
    const award = bonusCount === 8 ? fan('eightFlowers', 8) : fan('sevenFlowers', 3)
    return finish([{ comps: [award] }], hand, opts, true)
  }

  if (hand.decompositions.length === 0 && !orphans) {
    return { valid: false, reason: 'noValidDecomposition' }
  }

  const candidates: Candidate[] = []
  const extras = [...circumstance, ...bonus]

  // RULING HK8b and HK23. 天糊 belongs to the dealer and 地糊 / 人糊 to a
  // non-dealer, and each is defined by a moment as much as by a seat: 天糊 is
  // the dealer's dealt fourteen tiles, so it is self-drawn and nothing can
  // have been claimed; 地糊 is a win on the dealer's very first discard, so
  // no player has had a turn either. 人糊 is a win somewhere in the first
  // go-round, by which point a claim is legitimate. "Nothing claimed" is the
  // test rather than "no melds at all": no Hong Kong source rules out a kong
  // declared out of the dealt tiles, and inventing that restriction would be
  // stricter than the archive supports.
  const isDealer = ctx.seat === 'E'
  const selfDrawn = ctx.win === 'selfDraw'
  const unclaimed = hand.melds.every((m) => !m.open)
  const circumstanceHand =
    has(ctx, 'heavenly') && isDealer && selfDrawn && unclaimed ? 'heavenly'
      : has(ctx, 'earthly') && !isDealer && !selfDrawn && unclaimed ? 'earthly'
        : has(ctx, 'humanly') && !isDealer && !selfDrawn ? 'humanly'
          : null
  if (circumstanceHand !== null) candidates.push({ comps: [fan(circumstanceHand, 13), ...extras] })
  if (orphans) candidates.push({ comps: [fan('thirteenOrphans', 13), ...extras] })

  for (const d of hand.decompositions) {
    const facts = factsFor(hand, d)
    const awards = wholeHandAwards(hand, facts)
    for (const award of awards) candidates.push({ comps: [award, ...extras] })
    // RULING HK10 — a 例牌 SUPPRESSES the shape, flush, terminal, dragon and
    // wind components; it does not compete with them. Offering the composed
    // reading alongside it turned the ruling into "take whichever is larger",
    // which pays a 字一色 that is also 大三元 three times over at a 13-faan cap
    // and never prints the name of the hand that was actually won. Family A
    // allows the composed reading only in 無限番 play, which this engine,
    // always having a cap, never plays.
    if (awards.length === 0) {
      candidates.push({ comps: [...composedPatterns(facts, ctx), ...extras] })
    }
  }

  if (candidates.length === 0) return { valid: false, reason: 'noValidDecomposition' }
  return finish(candidates, hand, opts, false)
}

function finish(
  candidates: readonly Candidate[],
  hand: ParsedHand,
  opts: RuleOptions,
  instant: boolean,
): ScoreResult {
  const L = opts.limit
  const best = candidates.reduce((a, b) => better(a, b, L))
  const rawTai = total(best)
  const totalTai = Math.min(rawTai, L)

  // RULING HK16 — the flower lines score but do not qualify a hand to win.
  // RULING HK8b — the flower hands are instant wins and skip the check.
  if (!instant) {
    const qualifying = best.comps
      .filter((f) => !FLOWER_DERIVED.has(f.key))
      .reduce((n, f) => n + f.tai, 0)
    if (qualifying < opts.minTai) return { valid: false, reason: 'belowMinimum', rawTai }
  }

  return {
    valid: true,
    patterns: best.comps.map((f) => f.key),
    fan: best.comps,
    rawTai,
    totalTai,
    limitApplied: rawTai > L,
    base: basePoints(totalTai),
    hand,
  }
}

/**
 * RULING HK17 — Family A's 「分數計算（全銃制）」 出銃 column: 半辣上, the score
 * doubling every two faan above four. This is the winner's total on a discard
 * win, and every other figure in payments.ts is a fraction of it.
 */
export function basePoints(faan: number): number {
  if (faan <= 4) return 2 ** Math.max(faan, 0)
  if (faan % 2 === 0) return 16 * 2 ** ((faan - 4) / 2)
  return 24 * 2 ** ((faan - 5) / 2)
}

export const isInstantFlowerHand = (patterns: readonly string[]): boolean =>
  patterns.some((p) => INSTANT_FLOWER.has(p))

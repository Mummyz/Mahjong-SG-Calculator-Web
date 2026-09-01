/**
 * Singapore scoring.
 *
 * Every tai value here traces to docs/sources/RULING-LOG.md, which in turn
 * cites the archived rule sources. Nothing is tuned to make a corpus entry
 * pass — when the corpus and this file disagree, the corpus is right until a
 * new citation says otherwise.
 */

import { FLOWERS, SEASONS, ANIMALS, type BonusId, isDragon, isWind } from '../../core/tiles'
import type { ParsedHand } from '../../core/hand'
import { parseHand, type HandInput } from '../../core/hand'
import type { FanComponent, RuleOptions, ScoreResult, WinContext, WinFlag } from '../../core/variant'
import { type Facts, factsFor, isNineGates, isThirteenWonders, waitBreadth } from './facts'

export const SINGAPORE_DEFAULTS: RuleOptions = {
  limit: 5,           // RULING R14
  minTai: 1,          // RULING R14
  doubleSpecialHandPayout: false, // RULING R13
  halfPayment: false,             // Hong Kong only — RULING HK4
}

export const handSize = (kongCount: number): number => 14 + kongCount

/**
 * RULING R11 — payments are multiples of the agreed 1-tai stake, and the
 * multiplier doubles with every tai: 1 tai is 1 unit, 3 tai is 4, 5 tai is 16.
 *
 * Exported because a hand SOMEBODY ELSE won is known only by its fan, and the
 * lost-hand settlement has no tiles to score. Scoring calls the same function,
 * so the two readings of the table can never drift apart.
 */
export const baseForFan = (fan: number): number => (fan >= 1 ? 2 ** (fan - 1) : 0)

/**
 * Reporting precedence when two readings score the same. The more specific
 * named hand is the one the player should be told they have.
 */
const PRECEDENCE: readonly string[] = [
  'eightFlowers', 'heavenly', 'earthly', 'humanly', 'thirteenWonders',
  'eighteenArhats', 'nineGates', 'kongOnKong', 'allHonours', 'pureTerminals',
  'bigFourWinds', 'bigThreeDragons', 'hiddenTreasure', 'pureGreen',
  'fullFlushSequence', 'fullFlushTriplets', 'fullFlushLesserSequence',
  'mixedTerminals', 'smallThreeDragons', 'smallFourWinds', 'sequenceHand',
  'fullFlush', 'halfFlush', 'triplets', 'lesserSequence',
]
const rank = (key: string): number => {
  const i = PRECEDENCE.indexOf(key)
  return i < 0 ? PRECEDENCE.length : i
}

type Group = 'shape' | 'dragons' | 'winds' | 'windsHand' | 'bonus'
const WHOLE_HAND: readonly Group[] = ['shape', 'dragons', 'winds', 'windsHand']
const WHOLE_HAND_AND_BONUS: readonly Group[] = [...WHOLE_HAND, 'bonus']
interface Option { readonly comps: readonly FanComponent[]; readonly suppress: readonly Group[] }
const NONE: Option = { comps: [], suppress: [] }
const fan = (key: string, tai: number): FanComponent => ({ key, tai })

const has = (ctx: WinContext, f: WinFlag): boolean => (ctx.flags ?? []).includes(f)

/** Ping Hu's pair may not be a dragon, the seat wind, or the prevailing wind. */
const pairIsAllowedForSequence = (facts: Facts, ctx: WinContext): boolean => {
  const t = facts.pair.tiles[0]!
  if (isDragon(t)) return false
  if (isWind(t) && (t === ctx.seat || t === ctx.prevailing)) return false
  return true
}

/**
 * RULING R5. Two-sided-or-wider wait, or a self-draw — except when all four
 * sets are melded and the player waits on the eye, which forfeits either way.
 */
const sequenceWaitOk = (hand: ParsedHand, ctx: WinContext): boolean => {
  // Without the winning tile the wait cannot be checked, and Ping Hu is a claim
  // that has to be proven. Fail closed rather than award 4 tai unverified.
  if (ctx.winningTile === undefined) return false
  const breadth = waitBreadth(hand, ctx.winningTile)
  if (breadth >= 2) return true
  if (ctx.win !== 'selfDraw') return false
  return !(hand.melds.length === 4)
}

function bonusComponents(hand: ParsedHand, ctx: WinContext): FanComponent[] {
  const out: FanComponent[] = []
  const held = new Set<BonusId>(hand.bonus)
  const idx = { E: 1, S: 2, W: 3, N: 4 }[ctx.seat]

  if (held.has(`F${idx}` as BonusId)) out.push(fan('seatFlower', 1))
  if (held.has(`S${idx}` as BonusId)) out.push(fan('seatSeason', 1))
  if (FLOWERS.every((f) => held.has(f))) out.push(fan('completeFlowerGroup', 1))
  if (SEASONS.every((s) => held.has(s))) out.push(fan('completeSeasonGroup', 1))

  const animals = ANIMALS.filter((a) => held.has(a))
  for (const _ of animals) out.push(fan('animal', 1))
  if (animals.length === 4) out.push(fan('allAnimals', 1))
  return out
}

/** RULING R17 — a circumstance point requires the circumstance. */
function circumstanceComponents(hand: ParsedHand, ctx: WinContext): FanComponent[] {
  const out: FanComponent[] = []
  const noOpenMelds = hand.melds.every((m) => !m.open)
  const selfDraw = ctx.win === 'selfDraw'
  if (noOpenMelds && selfDraw) out.push(fan('fullyConcealed', 1))
  // TT makes the kong declarer the discarder, so 抢杠 is a discard win.
  if (has(ctx, 'robbingKong') && !selfDraw) out.push(fan('robbingKong', 1))
  // A replacement tile is DRAWN from the wall in every scenario TT lists.
  if (has(ctx, 'kongReplacement') && selfDraw) out.push(fan('kongReplacement', 1))
  if (has(ctx, 'flowerReplacement') && selfDraw) out.push(fan('flowerReplacement', 1))
  // TT: a last tile reached via a flower or kong replacement is not Hai Di Lao Yue.
  if (has(ctx, 'lastTile') && !has(ctx, 'kongReplacement') && !has(ctx, 'flowerReplacement')) {
    out.push(fan('lastTile', 1))
  }
  return out
}

function shapeOptions(hand: ParsedHand, facts: Facts, ctx: WinContext, L: number): Option[] {
  const cap = (n: number) => Math.min(n, L)
  const opts: Option[] = []
  const noBonus = hand.bonus.length === 0
  const pairOk = pairIsAllowedForSequence(facts, ctx)
  const sequence = facts.allChow && pairOk && noBonus && sequenceWaitOk(hand, ctx)
  const lesser = facts.allChow && pairOk && !noBonus

  // RULING R8b — a limit-hand award prices the whole hand and absorbs every
  // shape, dragon and wind component. Only bonus tiles and win circumstances,
  // which are properties of the draw rather than the tiles, still add.
  const whole = (key: string, tai: number) => opts.push({ comps: [fan(key, tai)], suppress: WHOLE_HAND })

  if (facts.allHonour) whole('allHonours', L)
  if (facts.pureTerminals) whole('pureTerminals', L)
  if (isNineGates(hand)) whole('nineGates', L)
  if (facts.hiddenTreasure) whole('hiddenTreasure', L)
  if (hand.kongCount === 4) whole('eighteenArhats', L)
  if (has(ctx, 'kongOnKong') && hand.kongCount >= 2) whole('kongOnKong', cap(10))
  if (facts.bigThreeDragons) whole('bigThreeDragons', cap(10))
  if (facts.bigFourWinds) whole('bigFourWinds', L)

  // R4a — Pure Green replaces only the flush it is priced against.
  if (facts.pureGreen) opts.push({ comps: [fan('pureGreen', 4)], suppress: ['shape'] })
  if (facts.mixedTerminals) opts.push({ comps: [fan('mixedTerminals', 4)], suppress: ['shape'] })

  if (facts.fullFlush && sequence) {
    opts.push({ comps: [fan('fullFlushSequence', cap(10))], suppress: ['shape'] })
  }
  if (facts.fullFlush && lesser) {
    opts.push({ comps: [fan('fullFlushLesserSequence', 5)], suppress: ['shape'] })
  }
  if (facts.fullFlush && facts.allPong) {
    opts.push({ comps: [fan('fullFlushTriplets', cap(8))], suppress: ['shape'] })
  }

  // the compositional reading: flush + shape stack normally
  const base: FanComponent[] = []
  if (facts.fullFlush) base.push(fan('fullFlush', 4))
  else if (facts.halfFlush) base.push(fan('halfFlush', 2))
  if (facts.allPong) base.push(fan('triplets', 2))
  if (sequence) base.push(fan('sequenceHand', 4))
  else if (lesser) base.push(fan('lesserSequence', 1))
  opts.push({ comps: base, suppress: ['shape'] })

  return opts
}

function dragonOptions(facts: Facts): Option[] {
  const opts: Option[] = []
  if (facts.smallThreeDragons) {
    opts.push({ comps: [fan('smallThreeDragons', 3)], suppress: ['dragons'] })
  }
  opts.push({
    comps: Array.from({ length: facts.dragonSets }, () => fan('dragonTriplet', 1)),
    suppress: ['dragons'],
  })
  return opts
}

function windOptions(facts: Facts, ctx: WinContext): Option[] {
  const opts: Option[] = []
  const base: FanComponent[] = []
  for (const w of facts.windSets) {
    if (w === ctx.seat && w === ctx.prevailing) base.push(fan('seatPrevailingWind', 2))
    else if (w === ctx.seat) base.push(fan('seatWind', 1))
    else if (w === ctx.prevailing) base.push(fan('prevailingWind', 1))
  }
  opts.push({ comps: base, suppress: ['winds'] })
  return opts
}

interface Candidate { readonly comps: readonly FanComponent[] }

const better = (a: Candidate, b: Candidate, L: number): Candidate => {
  const tot = (c: Candidate) => Math.min(c.comps.reduce((n, f) => n + f.tai, 0), L)
  if (tot(a) !== tot(b)) return tot(a) > tot(b) ? a : b
  const best = (c: Candidate) => Math.min(...c.comps.map((f) => rank(f.key)), PRECEDENCE.length)
  if (best(a) !== best(b)) return best(a) < best(b) ? a : b
  return a.comps.length <= b.comps.length ? a : b
}

export function score(
  input: HandInput,
  ctx: WinContext,
  partial?: Partial<RuleOptions>,
): ScoreResult {
  const opts: RuleOptions = { ...SINGAPORE_DEFAULTS, ...partial }
  const L = opts.limit

  const parsed = parseHand(input, { handSize, winningTile: ctx.winningTile })
  if (!parsed.ok) return { valid: false, reason: parsed.reason }
  const hand = parsed.hand

  const allEightBonus =
    FLOWERS.every((f) => hand.bonus.includes(f)) && SEASONS.every((s) => hand.bonus.includes(s))
  const thirteen = isThirteenWonders(hand)

  if (hand.decompositions.length === 0 && !thirteen && !allEightBonus) {
    return { valid: false, reason: 'noValidDecomposition' }
  }

  const candidates: Candidate[] = []
  // RULING R17. TT defines each seat hand by a moment, not just a seat.
  // Heavenly is the dealer's dealt tiles, so it is self-drawn; Humanly is a
  // non-dealer winning "by discard"; Earthly is the one TT gives two
  // scenarios, so its win method is unrestricted. None of the three can have
  // a claimed meld in it, because nobody has had the chance to claim — but a
  // concealed kong out of the dealt tiles is explicitly allowed, and TT names
  // that exception itself under Humanly.
  const isDealer = ctx.seat === 'E'
  const selfDraw = ctx.win === 'selfDraw'
  const unclaimed = hand.melds.every((m) => !m.open)
  const circumstanceHand: string | null =
    has(ctx, 'heavenly') && isDealer && selfDraw && unclaimed ? 'heavenly'
      : has(ctx, 'earthly') && !isDealer && unclaimed ? 'earthly'
        : has(ctx, 'humanly') && !isDealer && !selfDraw && unclaimed ? 'humanly'
          : null

  // RULING R8c. Tile-priced awards absorb only same-tile components; the
  // circumstance points always survive, and the bonus-tile points survive
  // everything except Eight Flowers, which is priced for those very tiles.
  const bonusComps = bonusComponents(hand, ctx)

  const irregular: Option[] = []
  if (allEightBonus) {
    irregular.push({ comps: [fan('eightFlowers', L)], suppress: WHOLE_HAND_AND_BONUS })
  }
  if (thirteen) {
    irregular.push({ comps: [fan('thirteenWonders', Math.min(13, L))], suppress: WHOLE_HAND })
  }
  if (circumstanceHand !== null) {
    irregular.push({ comps: [fan(circumstanceHand, L)], suppress: WHOLE_HAND })
  }

  const decomps = hand.decompositions.length > 0
    ? hand.decompositions
    : [null]

  const circumstance = circumstanceComponents(hand, ctx)

  // These do not depend on how the tiles decompose, so they are built once.
  for (const one of irregular) {
    candidates.push({
      comps: [
        ...one.comps,
        ...(one.suppress.includes('bonus') ? [] : bonusComps),
        ...circumstance,
      ],
    })
  }

  const extras = [...bonusComps, ...circumstance]
  for (const d of decomps) {
    if (d === null) continue
    const facts = factsFor(hand, d, ctx)
    for (const shape of shapeOptions(hand, facts, ctx, L)) {
      const ds = shape.suppress.includes('dragons') ? [NONE] : dragonOptions(facts)
      const ws = shape.suppress.includes('winds') ? [NONE] : windOptions(facts, ctx)
      const whs: Option[] = shape.suppress.includes('windsHand')
        ? [NONE]
        : facts.smallFourWinds
          ? [{ comps: [fan('smallFourWinds', 2)], suppress: [] }, NONE]
          : [NONE]
      for (const dr of ds) {
        for (const wi of ws) {
          for (const wh of whs) {
            candidates.push({
              comps: [...shape.comps, ...dr.comps, ...wi.comps, ...wh.comps, ...extras],
            })
          }
        }
      }
    }
  }

  if (candidates.length === 0) return { valid: false, reason: 'noValidDecomposition' }

  const best = candidates.reduce((a, b) => better(a, b, L))
  const rawTai = best.comps.reduce((n, f) => n + f.tai, 0)
  const totalTai = Math.min(rawTai, L)

  if (totalTai < opts.minTai) return { valid: false, reason: 'belowMinimum', rawTai }

  return {
    valid: true,
    patterns: best.comps.map((f) => f.key),
    fan: best.comps,
    rawTai,
    totalTai,
    limitApplied: rawTai > L,
    base: baseForFan(totalTai),
    hand,
  }
}

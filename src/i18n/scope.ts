/**
 * WHICH STRINGS THE LANGUAGE SWITCH REACHES.
 *
 * Owner's scope, Run 7. The rule is not "translate the app" — it is
 * LOCALISATION, NOT TRANSLATION, and only where Indonesian earns its place:
 * the sentences that explain, warn, count and settle. The words a player taps
 * and the words that NAME things stay English, because a table calls a Full
 * Flush a Full Flush whatever language it is arguing in.
 *
 * ENGLISH_ALWAYS below is enumerated, not inferred. Everything in en.json
 * that it does not cover is translated, so a NEW key is translated by
 * default — a string added without a decision shows up in Indonesian rather
 * than silently staying English, which is the failure mode that leaves a
 * half-translated UI. coverage.test.ts asserts the classification is total.
 */

import en from './en.json'

/** A key, or a prefix ending in `.`, that is English in both language modes. */
const ENGLISH_ALWAYS: readonly string[] = [
  // ── THE BRAND AND THE FRONT DOOR ──────────────────────────────────────
  // The landing is the brand's own voice. "Mahjong, yuk!" is already the
  // invitation; the tagline under it is the promise, and the owner keeps
  // both in English so the front door reads the same to everyone.
  'app.', 'variant.title', 'variant.subtitle', 'variant.play',
  'variant.singapore.name', 'variant.hongkong.name',
  'lang.', 'menu.languageScope',

  // ── ACTIONS ───────────────────────────────────────────────────────────
  // Every word a thumb lands on. A player learns six verbs once and then
  // stops reading them, so switching them buys nothing and costs the
  // muscle memory of anyone who has used the app in either mode.
  'nav.', 'menu.close', 'table.save', 'table.start',
  'hand.declare', 'hand.declareCancel', 'hand.undo', 'hand.clear',
  'hand.clearConfirm', 'hand.bonusAdd', 'hand.scoreReady', 'hand.whatsThis',
  'wizard.next', 'wizard.back', 'wizard.cancel', 'wizard.finish',
  'result.nextHand', 'result.editHand', 'predict.show', 'predict.hide',

  // ── SCREEN AND SECTION TITLES ─────────────────────────────────────────
  // The owner listed these by name, and the list is the decision: Pick Your
  // Game, Result, Your hand, What could this become?, plus the wizard's own
  // "Score this hand" and the two noun labels beside them.
  //
  // NOT here, deliberately: "Who's playing?" and "Check your set". They are
  // instructions addressed to the player, not labels — and an English
  // question standing over an entirely Indonesian form is the one place the
  // split stopped reading as a design and started reading as an oversight.
  'menu.title', 'table.settingsTitle',
  'wizard.title', 'result.title', 'hand.yourHand',
  'predict.title', 'hand.pickerSuits',

  // ── NAMES ─────────────────────────────────────────────────────────────
  // Tiles, suits, winds, and the groups they come in. The tile-set screen's
  // headings are the SAME words as the picker's tabs and as the name the app
  // reads out for a tile you hold; translating one of the three and not the
  // other two would put "Lingkaran" over a tile the app calls 5 Dots.
  'tile.suit.', 'tile.bonus.', 'tile.name.', 'wind.',
  'tileinfo.group.', 'hand.tab.',
  // The tile's own name, assembled: "{rank} {suit}" → "5 Bamboo". Translated,
  // it became "Bamboo 5" — Indonesian word order around an English noun,
  // which is neither language. The NAME is English, whole.
  'tile.suited',

  // Named winning hands, in both regional forms. A hand's name is what the
  // table shouts; it is a proper noun, not a description.
  'pattern.allHonours', 'pattern.allTriplets', 'pattern.bigFourWinds',
  'pattern.bigThreeDragons', 'pattern.chickenHand', 'pattern.commonHand',
  'pattern.eightFlowers', 'pattern.eighteenArhats',
  'pattern.fourConcealedTriplets', 'pattern.fullFlush',
  'pattern.fullFlushLesserSequence', 'pattern.fullFlushSequence',
  'pattern.fullFlushTriplets', 'pattern.halfFlush', 'pattern.hiddenTreasure',
  'pattern.lesserSequence', 'pattern.mixedTerminals', 'pattern.nineGates',
  'pattern.pureGreen', 'pattern.pureTerminals', 'pattern.sequenceHand',
  'pattern.sevenFlowers', 'pattern.smallFourWinds', 'pattern.smallThreeDragons',
  'pattern.thirteenOrphans', 'pattern.thirteenWonders', 'pattern.triplets',

  // The nine special circumstances the wizard asks about. Their NAMES stay
  // English — the owner's line — while every word explaining them does not:
  // flag.*.sub and flag.*.detail are exactly the beginner copy that has to
  // land in the reader's own language. pattern.* keys that are the same
  // circumstance under another name go with them.
  'flag.earthly', 'flag.flowerReplacement', 'flag.heavenly', 'flag.humanly',
  'flag.kongOnKong', 'flag.kongReplacement', 'flag.lastTile', 'flag.pao',
  'flag.robbingKong',
  'pattern.earthly', 'pattern.heavenly', 'pattern.humanly',
  'pattern.kongOnKong', 'pattern.kongReplacement', 'pattern.flowerReplacement',
  'pattern.lastTile', 'pattern.lastDiscard', 'pattern.robbingKong',

  // Prediction targets are hand names too — they are what the panel is
  // suggesting the player build.
  'predict.plain',

  // Words the glossary borrows whole — chow, pong, kong, fan. They are what
  // a player SAYS at the table in either language, so there is nothing to
  // switch and marking them translated only invites somebody to try.
  'hand.declareChow', 'hand.declarePong', 'hand.declareKong',
  'hand.tagChow', 'hand.tagPong', 'hand.tagKong', 'result.fanUnit',

  // ── NOT THE PRODUCT ───────────────────────────────────────────────────
  // /app/ is the bare engine harness, kept for driving the engine by hand.
  // variant.tiles is one of its strings that never got a harness. prefix.
  'harness.', 'variant.tiles',
]

/** The `.hongkong` / `.singapore` sibling of an English key is English too. */
const VARIANTS = ['singapore', 'hongkong'] as const

const covered = (key: string): boolean =>
  ENGLISH_ALWAYS.some((e) => (e.endsWith('.') ? key.startsWith(e) : key === e))

/**
 * A hand NAME is English; the sentence explaining it is not. `.sub` and
 * `.detail` hang off a circumstance's name and are the explanation, so they
 * are pulled back out of whatever their parent matched.
 */
const EXPLAINS = /\.(sub|detail)(\.(singapore|hongkong))?$/

const isEnglish = (key: string): boolean => {
  if (EXPLAINS.test(key)) return false
  if (covered(key)) return true
  // `predict.hint.flush:p.name` names a target hand; the sentence beside it
  // does not, and neither share a prefix that could tell them apart.
  if (/^predict\.hint\..+\.name$/.test(key)) return true
  for (const v of VARIANTS) {
    if (key.endsWith(`.${v}`) && covered(key.slice(0, -v.length - 1))) return true
  }
  return false
}

/** Every key the language switch changes. Everything else resolves English. */
export const TRANSLATED: ReadonlySet<string> = new Set(
  Object.keys(en as Record<string, string>).filter((k) => !isEnglish(k)),
)

/** Every key that is English in both modes — the other half of the split. */
export const ENGLISH_ONLY: ReadonlySet<string> = new Set(
  Object.keys(en as Record<string, string>).filter(isEnglish),
)

/** Whether `key` is one the language switch actually changes. */
export const translates = (key: string): boolean => TRANSLATED.has(key)

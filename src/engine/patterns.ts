/**
 * Which scoring keys NAME a hand, and which describe how it was won or what
 * was in the flower tray.
 *
 * Both variants emit keys into the same namespace, and three places need the
 * same answer: the results screen, which lists "what you have" separately from
 * the breakdown; the predictor, which must not offer four suggestions that are
 * the same hand; and the locale files, which caption them.
 */

const NOT_A_HAND = new Set([
  // how the hand was won
  'selfDraw', 'fullyConcealed', 'robbingKong', 'lastTile', 'lastDiscard',
  'kongReplacement', 'flowerReplacement',
  // sets that score but do not name the hand
  'dragonTriplet', 'seatWind', 'prevailingWind', 'seatPrevailingWind',
  // the flower tray
  'noFlowers', 'seatFlower', 'seatSeason',
  'completeFlowerGroup', 'completeSeasonGroup', 'animal', 'allAnimals',
])

export const isHandPattern = (key: string): boolean => !NOT_A_HAND.has(key)

/** The stable identity of a suggestion: the hands it is, in order. */
export const handSignature = (patterns: readonly string[]): string =>
  [...new Set(patterns.filter(isHandPattern))].sort().join('+') || 'plain'

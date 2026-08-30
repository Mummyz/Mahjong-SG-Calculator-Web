import { ANIMALS, DRAGONS, FLOWERS, SEASONS, SUITS, WINDS, type TileId } from '../../core/tiles'
import type { TileSetSpec } from '../../core/variant'

const suited = (): TileId[] =>
  SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`))

/**
 * Singapore: 148 tiles.
 * 108 suited + 16 winds + 12 dragons + 4 flowers + 4 seasons + 4 animals.
 * This is what the Run 2 pre-game screen renders.
 */
export const SINGAPORE_TILE_SET: TileSetSpec = {
  total: 148,
  groups: [
    { key: 'characters', tiles: suited().filter((t) => t.endsWith('m')), copies: 4 },
    { key: 'dots', tiles: suited().filter((t) => t.endsWith('p')), copies: 4 },
    { key: 'bamboo', tiles: suited().filter((t) => t.endsWith('s')), copies: 4 },
    { key: 'winds', tiles: [...WINDS], copies: 4 },
    { key: 'dragons', tiles: [...DRAGONS], copies: 4 },
    { key: 'flowers', tiles: [...FLOWERS], copies: 1 },
    { key: 'seasons', tiles: [...SEASONS], copies: 1 },
    { key: 'animals', tiles: [...ANIMALS], copies: 1 },
  ],
}

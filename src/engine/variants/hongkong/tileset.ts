import { DRAGONS, FLOWERS, SEASONS, SUITS, WINDS, type TileId } from '../../core/tiles'
import type { TileSetSpec } from '../../core/variant'

const suited = (): TileId[] =>
  SUITS.flatMap((s) => Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`))

/**
 * Hong Kong Old Style: 144 tiles — RULING HK1.
 * 108 suited + 16 winds + 12 dragons + 4 flowers + 4 seasons. No animals.
 */
export const HONGKONG_TILE_SET: TileSetSpec = {
  total: 144,
  groups: [
    { key: 'characters', tiles: suited().filter((t) => t.endsWith('m')), copies: 4 },
    { key: 'dots', tiles: suited().filter((t) => t.endsWith('p')), copies: 4 },
    { key: 'bamboo', tiles: suited().filter((t) => t.endsWith('s')), copies: 4 },
    { key: 'winds', tiles: [...WINDS], copies: 4 },
    { key: 'dragons', tiles: [...DRAGONS], copies: 4 },
    { key: 'flowers', tiles: [...FLOWERS], copies: 1 },
    { key: 'seasons', tiles: [...SEASONS], copies: 1 },
  ],
}

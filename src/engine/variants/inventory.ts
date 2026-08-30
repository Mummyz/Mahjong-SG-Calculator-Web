/**
 * What a variant actually has on the table.
 *
 * Run 4 shipped with the Hong Kong bonus tray offering Singapore's four animal
 * tiles: the hand-entry screen listed FLOWERS, SEASONS and ANIMALS as literals
 * rather than asking the variant, and tapping an animal on a 144-tile table
 * made the hand unscoreable. This module exists so that no screen ever again
 * decides for itself which tiles exist.
 *
 * Everything here is DERIVED from the variant's own `tileSet` and `flags`.
 * There is no second list to keep in sync.
 */

import { isBonus, type BonusId, type TileId } from '../core/tiles'
import type { TileSetGroup, VariantPlugin, WinFlag } from '../core/variant'

export interface VariantInventory {
  /** Groups whose tiles are keyed into the hand — suits and honours. */
  readonly wallGroups: readonly TileSetGroup[]
  /** Groups that live in the flower tray — flowers, seasons, and Singapore's animals. */
  readonly bonusGroups: readonly TileSetGroup[]
  readonly wallTiles: ReadonlySet<TileId>
  readonly bonusTiles: ReadonlySet<BonusId>
  /** The win circumstances this variant scores. Anything else is not offered. */
  readonly flags: readonly WinFlag[]
}

const isBonusGroup = (g: TileSetGroup): boolean =>
  g.tiles.length > 0 && g.tiles.every((t) => isBonus(t))

const cache = new WeakMap<VariantPlugin, VariantInventory>()

export function inventoryOf(v: VariantPlugin): VariantInventory {
  const hit = cache.get(v)
  if (hit) return hit

  const wallGroups = v.tileSet.groups.filter((g) => !isBonusGroup(g))
  const bonusGroups = v.tileSet.groups.filter(isBonusGroup)
  const inv: VariantInventory = {
    wallGroups,
    bonusGroups,
    wallTiles: new Set(wallGroups.flatMap((g) => [...g.tiles] as TileId[])),
    bonusTiles: new Set(bonusGroups.flatMap((g) => [...g.tiles] as BonusId[])),
    flags: v.flags,
  }
  cache.set(v, inv)
  return inv
}

/** Is this tile one the variant plays at all? */
export const playsTile = (v: VariantPlugin, t: string): boolean => {
  const inv = inventoryOf(v)
  return inv.wallTiles.has(t) || inv.bonusTiles.has(t as BonusId)
}

/** Strip anything the variant does not play. Used when a table changes game. */
export const keepPlayable = <T extends string>(v: VariantPlugin, tiles: readonly T[]): T[] =>
  tiles.filter((t) => playsTile(v, t))

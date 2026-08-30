/**
 * The variant registry.
 *
 * FINAL LINEUP, per CLAUDE.md: Singapore and Hong Kong Old Style. Adding a
 * third needs the owner's explicit approval, not a line in this file.
 */

import type { VariantPlugin } from '../core/variant'
import { singapore } from './singapore'
import { hongkong } from './hongkong'

export type VariantId = 'singapore' | 'hongkong'

export const VARIANT_IDS: readonly VariantId[] = ['singapore', 'hongkong']

export const VARIANTS: Readonly<Record<VariantId, VariantPlugin>> = { singapore, hongkong }

export const isVariantId = (x: unknown): x is VariantId =>
  typeof x === 'string' && (VARIANT_IDS as readonly string[]).includes(x)

export { singapore, hongkong }
export * from './inventory'

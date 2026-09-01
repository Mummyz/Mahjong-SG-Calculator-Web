import { t } from '../../i18n'
import { tileName } from './Tile'
import type { Requirement } from '../../engine/predict/requirements'

/**
 * ONE WORDING, TWO PLACES.
 *
 * The prediction card and the ghost group in the tray describe the same
 * requirement, so they read it from the same function. When they were written
 * separately the card said "5 Dots, 5 Dots" and the tray drew two 5 Dots
 * outlines — agreeing with each other and both wrong about what the plan
 * actually needed.
 */
export function needLabel(g: Requirement): string {
  if (g.kind === 'specific') {
    return g.count > 1
      ? t('need.many', { tile: tileName(g.tile), n: g.count })
      : t('need.one', { tile: tileName(g.tile) })
  }
  const klass = t(`need.klass.${g.klass}`)
  switch (g.shape) {
    case 'pair': return t('need.anyPair', { klass })
    case 'pong': return t('need.anyPong', { klass })
    case 'kong': return t('need.anyKong', { klass })
    case 'chow': return t('need.anyChow', { klass })
    default: return t('need.anySingle', { klass })
  }
}

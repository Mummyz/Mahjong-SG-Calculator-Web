/**
 * A single tile face. Every string reaches the DOM through t() — including
 * accessible names — per CLAUDE.md. The CJK on a tile face is content, not
 * copy: it is what is physically carved into the tile.
 */

import { t } from '../../i18n'
import { rankOf, suitOf, type BonusId, type TileId, type Wind } from '../../engine/core/tiles'

const SUIT_MARK: Record<string, string> = { m: '萬', p: '筒', s: '索' }
const HONOUR_GLYPH: Record<string, string> = {
  E: '東', S: '南', W: '西', N: '北', C: '中', F: '發', P: '白',
}
const BONUS_GLYPH: Record<BonusId, string> = {
  F1: '梅', F2: '蘭', F3: '菊', F4: '竹',
  S1: '春', S2: '夏', S3: '秋', S4: '冬',
  cat: '貓', rat: '鼠', rooster: '雞', centipede: '蜈',
}
const BONUS_SEAT: Partial<Record<BonusId, Wind>> = {
  F1: 'E', F2: 'S', F3: 'W', F4: 'N',
  S1: 'E', S2: 'S', S3: 'W', S4: 'N',
}

const DRAGONS_SET = new Set(['C', 'F', 'P'])

/** The spoken name of a tile: "5 Bamboo", "East", "Red Dragon". */
export function tileName(id: TileId): string {
  const suit = suitOf(id)
  // Built from a template rather than concatenated, so word order is the
  // translator's decision and not English's.
  if (suit) return t('tile.suited', { rank: rankOf(id) ?? '', suit: t(`tile.suit.${suit}`) })
  if (DRAGONS_SET.has(id)) return t(`tile.name.${id}`)
  return t(`wind.${id}`)
}

/** The short caption printed under an honour glyph. */
const honourCap = (id: TileId): string =>
  DRAGONS_SET.has(id) ? t(`tile.name.${id}.short`) : t(`wind.${id}.short`)

interface TileProps {
  id: TileId
  onClick?: (id: TileId) => void
  /** How many copies of this tile are already committed, 0–4. */
  count?: number
  /** Visually picked out — used both for a meld in progress and the winner. */
  selected?: boolean
  /** Part of the meld currently being declared. */
  taken?: boolean
  mini?: boolean
  disabled?: boolean
  /** In the tray this tile removes itself; name it as the action it performs. */
  removes?: boolean
  /** Not a legal choice right now — turned face-down and inert. */
  dead?: boolean
}

export function Tile({
  id, onClick, count = 0, selected, taken, mini, disabled, removes, dead,
}: TileProps) {
  const suit = suitOf(id)
  const exhausted = count >= 4 || dead === true
  const cls = ['tile', suit ? '' : 'tile--honour', mini ? 'tile--mini' : ''].filter(Boolean).join(' ')
  const label = dead
    ? t('tile.notNowName', { tile: tileName(id) })
    : taken
      ? t('tile.takenName', { tile: tileName(id) })
      : removes && onClick
        ? t('hand.removeTile', { tile: tileName(id) })
        : exhausted
          ? t('tile.exhaustedName', { tile: tileName(id) })
          : tileName(id)
  // A tile nobody can tap is a picture of a tile, not a control: no tab stop,
  // no pressed state to mis-announce.
  const Wrapper = onClick ? 'button' : 'span'

  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      role={onClick ? undefined : 'img'}
      class={cls}
      data-suit={suit ?? undefined}
      data-h={suit ? undefined : id}
      data-exhausted={exhausted ? 'true' : undefined}
      data-exhausted-label={dead ? '' : exhausted ? '×4' : undefined}
      data-taken={taken ? 'true' : undefined}
      aria-pressed={onClick && !removes
        ? (!exhausted && (selected || taken || count > 0) ? 'true' : 'false')
        : undefined}
      aria-disabled={onClick && (exhausted || disabled) ? 'true' : undefined}
      aria-label={label}
      onClick={onClick ? () => { if (!exhausted && !disabled) onClick(id) } : undefined}
    >
      {suit ? (
        <>
          <span class="tile__rank" aria-hidden="true">{rankOf(id)}</span>
          <span class="tile__mark" aria-hidden="true">{SUIT_MARK[suit]}</span>
          <span class="tile__rule" aria-hidden="true" />
        </>
      ) : (
        <>
          <span class="tile__glyph" aria-hidden="true">{HONOUR_GLYPH[id]}</span>
          {!mini && <span class="tile__cap" aria-hidden="true">{honourCap(id)}</span>}
        </>
      )}
      {count > 0 && !exhausted && !mini && (
        <span class="tile__count" aria-hidden="true">×{count}</span>
      )}
    </Wrapper>
  )
}

interface BonusTileProps {
  id: BonusId
  seat: Wind
  held?: boolean
  onClick?: (id: BonusId) => void
}

/** Held has to survive losing the button: aria-pressed goes with it. */
const label = (held: boolean, name: string): string =>
  (held ? t('tile.heldName', { tile: name }) : name)

export function BonusTile({ id, seat, held, onClick }: BonusTileProps) {
  const owner = BONUS_SEAT[id]
  const Wrapper = onClick ? 'button' : 'span'
  return (
    <Wrapper
      type={onClick ? 'button' : undefined}
      role={onClick ? undefined : 'img'}
      class="tile tile--bonus"
      data-held={held ? 'true' : undefined}
      aria-pressed={onClick ? (held ? 'true' : 'false') : undefined}
      aria-label={label(held === true, owner === seat
        ? t('tile.ownBonusName', { tile: t(`tile.bonus.${id}`) })
        : t(`tile.bonus.${id}`))}
      onClick={onClick ? () => onClick(id) : undefined}
    >
      {owner && (
        <span class="tile__seat" data-own={owner === seat ? 'true' : 'false'} aria-hidden="true">
          {t(`wind.${owner}.short`)}
        </span>
      )}
      <span class="tile__glyph" aria-hidden="true">{BONUS_GLYPH[id]}</span>
      <span class="tile__cap" aria-hidden="true">{t(`tile.bonus.${id}`)}</span>
    </Wrapper>
  )
}

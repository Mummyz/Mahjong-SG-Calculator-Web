import { t } from '../../i18n'
import { isDealer, seatWindOf, type TableState } from '../../engine/session/table'

const WIND_GLYPH: Record<string, string> = { E: '東', S: '南', W: '西', N: '北' }

/**
 * Who is sitting on which wind this hand, and who is dealing. Directive 1:
 * the seat winds are always visible, not only your own.
 */
export function Seats({ table }: { table: TableState }) {
  return (
    <ul class="seats">
      {table.players.map((name, i) => {
        const w = seatWindOf(table, i)
        const you = i === table.youIndex
        return (
          <li class="seat" key={i} data-wind={w}
            data-dealer={isDealer(table, i) ? 'true' : undefined}
            data-you={you ? 'true' : undefined}>
            <span class="seat__avatar" aria-hidden="true">{WIND_GLYPH[w]}</span>
            <span class="seat__name">
              {you ? t('table.youTag') : (name || t('table.playerN', { n: i + 1 }))}
            </span>
            {/* The dealer is marked by a ring AND a word — never the ring alone. */}
            {isDealer(table, i) && <span class="seat__deal">{t('seats.dealer')}</span>}
          </li>
        )
      })}
    </ul>
  )
}

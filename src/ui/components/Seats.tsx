import { t } from '../../i18n'
import { isDealer, seatWindOf, type TableState } from '../../engine/variants/singapore/table'

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
          <li class="seats__x" key={i} data-you={you ? 'true' : undefined}>
            <span class="seats__w" aria-hidden="true">{WIND_GLYPH[w]}</span>
            <span class="seats__n">
              {you ? t('table.youTag') : (name || t('table.playerN', { n: i + 1 }))}
            </span>
            {isDealer(table, i) && <span class="seats__d">{t('seats.dealer')}</span>}
          </li>
        )
      })}
    </ul>
  )
}

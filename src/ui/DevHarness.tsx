/**
 * Run 1 developer harness — plain and functional, so the engine can be driven
 * by hand. The real mobile interface, under the Design Critic, is Run 2.
 *
 * CONSTITUTION: every user-visible string goes through t(). See CLAUDE.md.
 */

import { useMemo, useState } from 'preact/hooks'
import { t } from '../i18n'
import { singapore } from '../engine/variants/singapore'
import {
  ANIMALS, DRAGONS, FLOWERS, SEASONS, SUITS, WINDS, parseTiles, sortTiles,
  type BonusId, type TileId, type Wind,
} from '../engine/core/tiles'
import type { MeldInput } from '../engine/core/hand'
import type { WinFlag } from '../engine/core/variant'

const SUIT_TILES: TileId[] = SUITS.flatMap((s) =>
  Array.from({ length: 9 }, (_, i) => `${i + 1}${s}`),
)
const HONOUR_TILES: TileId[] = [...WINDS, ...DRAGONS]
const FLAGS: WinFlag[] = [
  'robbingKong', 'lastTile', 'kongReplacement', 'flowerReplacement',
  'heavenly', 'earthly', 'humanly', 'kongOnKong',
]

interface Example {
  key: string
  concealed: string
  melds: MeldInput[]
  bonus: BonusId[]
  seat: Wind
  prevailing: Wind
  win: 'discard' | 'selfDraw'
  winningTile: TileId
}

const EXAMPLES: Example[] = [
  { key: 'A', concealed: '123m 456m 789m 234p 55s', melds: [], bonus: [],
    seat: 'E', prevailing: 'E', win: 'discard', winningTile: '4p' },
  { key: 'B', concealed: '111m 222m CCC EEE 99m', melds: [], bonus: [],
    seat: 'E', prevailing: 'E', win: 'discard', winningTile: '1m' },
  { key: 'C', concealed: '222m 555p 888s 111m 99p', melds: [],
    bonus: ['cat', 'rat', 'rooster', 'centipede'],
    seat: 'E', prevailing: 'E', win: 'discard', winningTile: '2m' },
]

const toggle = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

export function DevHarness() {
  const [concealed, setConcealed] = useState(EXAMPLES[0]!.concealed)
  const [melds, setMelds] = useState<MeldInput[]>([])
  const [bonus, setBonus] = useState<BonusId[]>([])
  const [seat, setSeat] = useState<Wind>('E')
  const [prevailing, setPrevailing] = useState<Wind>('E')
  const [win, setWin] = useState<'discard' | 'selfDraw'>('discard')
  const [discarder, setDiscarder] = useState<Wind>('S')
  const [winningTile, setWinningTile] = useState<string>('4p')
  const [flags, setFlags] = useState<WinFlag[]>([])
  const [pao, setPao] = useState(false)
  const [limit, setLimit] = useState(5)
  const [minTai, setMinTai] = useState(1)
  const [doubleSpecial, setDoubleSpecial] = useState(false)

  // Parse rather than split on spaces: "123m" is three tiles, not one.
  const handTiles = useMemo(() => {
    try {
      return parseTiles(concealed)
    } catch {
      return []
    }
  }, [concealed])

  const { result, pay, instant } = useMemo(() => {
    const ctx = {
      seat, prevailing, win,
      winningTile: winningTile || undefined,
      flags, pao,
    }
    const opts = { limit, minTai, doubleSpecialHandPayout: doubleSpecial }
    const r = singapore.score({ concealed, melds, bonus }, ctx, opts)
    return {
      result: r,
      pay: singapore.payments(r, ctx, opts),
      instant: singapore.instantPayouts!(bonus, seat),
    }
  }, [concealed, melds, bonus, seat, prevailing, win, winningTile, flags, pao,
      limit, minTai, doubleSpecial])

  const others = WINDS.filter((w) => w !== seat)
  const loadExample = (e: Example) => {
    setConcealed(e.concealed); setMelds(e.melds); setBonus(e.bonus)
    setSeat(e.seat); setPrevailing(e.prevailing); setWin(e.win)
    setWinningTile(e.winningTile); setFlags([]); setPao(false)
    setLimit(5); setMinTai(1); setDoubleSpecial(false)
    setDiscarder(e.seat === 'S' ? 'W' : 'S')
  }

  const windSelect = (value: Wind, onChange: (w: Wind) => void) => (
    <select
      value={value}
      onChange={(ev) => onChange((ev.target as HTMLSelectElement).value as Wind)}
    >
      {WINDS.map((w) => <option value={w} key={w}>{t(`wind.${w}`)}</option>)}
    </select>
  )

  return (
    <div class="wrap">
      <h1>{t('app.devHarness')}</h1>
      <p class="sub">{t('app.devNote')}</p>

      <section>
        <h2>{t('example.label')}</h2>
        <div class="chips">
          {EXAMPLES.map((e) => (
            <button class="act" key={e.key} onClick={() => loadExample(e)}>
              {t('example.load')} {e.key}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2>{t('variant.label')}</h2>
        <div>
          {t('variant.singapore')}{' '}
          <span class="pill">{t('variant.tileCount', { count: singapore.tileSet.total })}</span>
        </div>
      </section>

      <section>
        <h2>{t('hand.label')}</h2>
        <textarea
          value={concealed}
          placeholder={t('hand.placeholder')}
          onInput={(e) => setConcealed((e.target as HTMLTextAreaElement).value)}
        />
        <p class="muted">{t('hand.count', { count: handTiles.length })}</p>
        {SUITS.map((s) => (
          <div class="tiles" key={s}>
            {SUIT_TILES.filter((x) => x.endsWith(s)).map((tile) => (
              <button class="tile" key={tile}
                onClick={() => setConcealed((c) => `${c.trim()} ${tile}`.trim())}>{tile}</button>
            ))}
          </div>
        ))}
        <div class="tiles honours">
          {HONOUR_TILES.map((tile) => (
            <button class="tile" key={tile}
              onClick={() => setConcealed((c) => `${c.trim()} ${tile}`.trim())}>{tile}</button>
          ))}
        </div>
        <div class="chips">
          <button class="act" onClick={() =>
            setConcealed((c) => c.trim().split(/\s+/).slice(0, -1).join(' '))}>
            {t('hand.backspace')}
          </button>
          <button class="act" onClick={() => setConcealed('')}>{t('hand.clear')}</button>
        </div>
      </section>

      <section>
        <h2>{t('melds.label')}</h2>
        {melds.length === 0 && <p class="muted">{t('melds.none')}</p>}
        {melds.map((m, i) => (
          <div class="meld" key={i}>
            <select value={m.t} onChange={(e) => setMelds((ms) => ms.map((x, j) =>
              j === i ? { ...x, t: (e.target as HTMLSelectElement).value as MeldInput['t'] } : x))}>
              <option value="chow">{t('melds.kind.chow')}</option>
              <option value="pong">{t('melds.kind.pong')}</option>
              <option value="kong">{t('melds.kind.kong')}</option>
            </select>
            <input type="text" value={m.tiles} placeholder={t('melds.tilesPlaceholder')}
              onInput={(e) => setMelds((ms) => ms.map((x, j) =>
                j === i ? { ...x, tiles: (e.target as HTMLInputElement).value } : x))} />
            <button class="chip" aria-pressed={m.open}
              onClick={() => setMelds((ms) => ms.map((x, j) =>
                j === i ? { ...x, open: !x.open } : x))}>{t('melds.open')}</button>
            <button class="act" onClick={() => setMelds((ms) => ms.filter((_, j) => j !== i))}>
              {t('melds.remove')}
            </button>
          </div>
        ))}
        <button class="act" onClick={() =>
          setMelds((ms) => [...ms, { t: 'pong', tiles: '', open: true }])}>
          {t('melds.add')}
        </button>
      </section>

      <section>
        <h2>{t('bonus.label')}</h2>
        {([['bonus.flowers', FLOWERS], ['bonus.seasons', SEASONS], ['bonus.animals', ANIMALS]] as const)
          .map(([labelKey, group]) => (
            <div key={labelKey} style="margin-bottom:10px">
              <label>{t(labelKey)}</label>
              <div class="chips">
                {group.map((b) => (
                  <button class="chip" key={b} aria-pressed={bonus.includes(b)}
                    onClick={() => setBonus((x) => toggle(x, b))}>{b}</button>
                ))}
              </div>
            </div>
          ))}
      </section>

      <section>
        <h2>{t('ctx.winMethod')}</h2>
        <div class="row">
          <div>
            <label>{t('ctx.seat')}</label>
            {windSelect(seat, setSeat)}
          </div>
          <div>
            <label>{t('ctx.prevailing')}</label>
            {windSelect(prevailing, setPrevailing)}
          </div>
        </div>
        <div style="margin-top:10px" class="chips">
          <button class="chip" aria-pressed={win === 'discard'} onClick={() => setWin('discard')}>
            {t('ctx.discard')}
          </button>
          <button class="chip" aria-pressed={win === 'selfDraw'} onClick={() => setWin('selfDraw')}>
            {t('ctx.selfDraw')}
          </button>
        </div>
        <div class="row" style="margin-top:10px">
          <div>
            <label>{t('ctx.winningTile')}</label>
            <select value={winningTile}
              onChange={(e) => setWinningTile((e.target as HTMLSelectElement).value)}>
              <option value="">—</option>
              {sortTiles([...new Set(handTiles)]).map((tile) => (
                <option value={tile} key={tile}>{tile}</option>
              ))}
            </select>
          </div>
          {win === 'discard' && (
            <div>
              <label>{t('ctx.discarder')}</label>
              <select value={discarder}
                onChange={(e) => setDiscarder((e.target as HTMLSelectElement).value as Wind)}>
                {others.map((w) => <option value={w} key={w}>{t(`wind.${w}`)}</option>)}
              </select>
            </div>
          )}
        </div>
        <div style="margin-top:12px">
          <label>{t('ctx.flags')}</label>
          <div class="chips">
            {FLAGS.map((f) => (
              <button class="chip" key={f} aria-pressed={flags.includes(f)}
                onClick={() => setFlags((x) => toggle(x, f))}>{t(`flag.${f}`)}</button>
            ))}
            <button class="chip" aria-pressed={pao} onClick={() => setPao((p) => !p)}>
              {t('flag.pao')}
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2>{t('rules.label')}</h2>
        <div class="row">
          <div>
            <label>{t('rules.limit')}</label>
            <input type="text" inputMode="numeric" value={String(limit)}
              onInput={(e) => setLimit(Number((e.target as HTMLInputElement).value) || 1)} />
          </div>
          <div>
            <label>{t('rules.minTai')}</label>
            <input type="text" inputMode="numeric" value={String(minTai)}
              onInput={(e) => setMinTai(Number((e.target as HTMLInputElement).value) || 0)} />
          </div>
        </div>
        <div class="chips" style="margin-top:10px">
          <button class="chip" aria-pressed={doubleSpecial}
            onClick={() => setDoubleSpecial((d) => !d)}>{t('rules.doubleSpecial')}</button>
        </div>
      </section>

      <section class="result">
        <h2>{t('result.title')}</h2>
        {!result.valid ? (
          <>
            <p class="bad">{t('result.notAWin')}</p>
            <p class="muted">{t(`reject.${result.reason}`)}</p>
          </>
        ) : (
          <>
            <div class="total">{t('result.tai', { n: result.totalTai })}</div>
            {result.limitApplied && (
              <p class="muted">{t('result.rawTai', { n: result.rawTai })}</p>
            )}
            <p class="muted">{t('result.base')}: {result.base}</p>

            <h2 style="margin-top:16px">{t('result.breakdown')}</h2>
            <table>
              <tbody>
                {result.fan.map((f, i) => (
                  <tr key={`${f.key}-${i}`}>
                    <td>{f.key}</td>
                    <td>+{f.tai}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {pay && (
              <>
                <h2 style="margin-top:16px">{t('result.payments')}</h2>
                <table>
                  <tbody>
                    {others.map((w) => {
                      const isDiscarder = win === 'discard' && w === discarder
                      const amount = isDiscarder
                        ? (pay.fromDiscarder ?? 0)
                        : (win === 'discard' && pao ? 0 : pay.fromEachOther)
                      return (
                        <tr key={w}>
                          <td>{t(`wind.${w}`)} {t('result.pays')}</td>
                          <td>{amount}</td>
                        </tr>
                      )
                    })}
                    <tr>
                      <td><strong>{t('result.youReceive')}</strong></td>
                      <td>{pay.winnerTotal}</td>
                    </tr>
                  </tbody>
                </table>
              </>
            )}
          </>
        )}

        {instant.length > 0 && (
          <>
            <h2 style="margin-top:16px">{t('result.instant')}</h2>
            <table>
              <tbody>
                {instant.map((p) => (
                  <tr key={p.key}>
                    <td>{p.key}</td>
                    <td>{t('result.instantEach', { n: p.fromEachPlayer })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </section>
    </div>
  )
}

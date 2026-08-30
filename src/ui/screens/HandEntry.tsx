import { useEffect, useMemo, useState } from 'preact/hooks'
import { t } from '../../i18n'
import { Tile, BonusTile, tileName } from '../components/Tile'
import { Signboard } from '../components/Signboard'
import { Seats } from '../components/Seats'
import { Sheet } from '../components/Sheet'
import {
  ANIMALS, DRAGONS, FLOWERS, SEASONS, WINDS,
  type BonusId, type TileId, tally,
} from '../../engine/core/tiles'
import type { MeldInput } from '../../engine/core/hand'
import type { WinFlag } from '../../engine/core/variant'
import {
  buildMeld, concealedKongs, concealedTarget, isDealer, legalNextTiles,
  tilesRemaining, yourSeat, type MeldKind, type TableState,
} from '../../engine/variants/singapore/table'

export interface HandState {
  concealed: TileId[]
  /** Melds claimed from the table. Concealed kongs are never in here. */
  melds: MeldInput[]
  bonus: BonusId[]
  winningTile: TileId | null
  win: 'selfDraw' | 'discard' | null
  /** Index of the player who threw it, not a wind. */
  discarderIndex: number | null
  flags: WinFlag[]
  pao: boolean
  log: ('tile' | 'meld')[]
}

export const EMPTY_HAND: HandState = {
  concealed: [], melds: [], bonus: [], winningTile: null,
  win: null, discarderIndex: null, flags: [], pao: false, log: [],
}

type TabKey = 'characters' | 'dots' | 'bamboo' | 'honours' | 'bonus'
const TABS: { key: TabKey; cjk: string }[] = [
  { key: 'characters', cjk: '萬' }, { key: 'dots', cjk: '筒' }, { key: 'bamboo', cjk: '索' },
  { key: 'honours', cjk: '風箭' }, { key: 'bonus', cjk: '花' },
]
const SUIT_OF_TAB: Partial<Record<TabKey, 'm' | 'p' | 's'>> =
  { characters: 'm', dots: 'p', bamboo: 's' }
const SUIT_CJK: Record<string, string> = { m: '萬', p: '筒', s: '索' }

const FLAGS: WinFlag[] = [
  'robbingKong', 'lastTile', 'kongReplacement', 'flowerReplacement',
  'kongOnKong', 'heavenly', 'earthly', 'humanly',
]

const toggle = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

const meldTiles = (m: MeldInput): TileId[] => m.tiles.trim().split(/\s+/)

/** Circumstances ruled out by this seat, this kong count, or how the hand was won. */
const SELF_DRAW_ONLY: WinFlag[] = ['kongReplacement', 'flowerReplacement', 'heavenly', 'kongOnKong']
const DISCARD_ONLY: WinFlag[] = ['robbingKong', 'humanly']

function blockedReason(
  f: WinFlag, dealer: boolean, kongs: number, win: 'selfDraw' | 'discard' | null,
): string | null {
  if (f === 'heavenly' && !dealer) return t('flag.disabled.dealerOnly')
  if ((f === 'earthly' || f === 'humanly') && dealer) return t('flag.disabled.nonDealerOnly')
  if (f === 'kongOnKong' && kongs < 2) return t('flag.disabled.needsTwoKongs')
  if (win === 'discard' && SELF_DRAW_ONLY.includes(f)) return t('flag.disabled.selfDrawOnly')
  if (win === 'selfDraw' && DISCARD_ONLY.includes(f)) return t('flag.disabled.discardOnly')
  return null
}

export function HandEntry({ table, stake, limit, hand, setHand, onMenu, onScore }: {
  table: TableState
  stake: number
  limit: number
  hand: HandState
  setHand: (patch: Partial<HandState>) => void
  onMenu: () => void
  onScore: () => void
}) {
  const [tab, setTab] = useState<TabKey>('characters')
  const [declare, setDeclare] = useState<{ kind: MeldKind; chosen: TileId[] } | null>(null)
  const [picking, setPicking] = useState(false)
  const [unusual, setUnusual] = useState(false)
  const [detail, setDetail] = useState<WinFlag | 'pao' | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [editWin, setEditWin] = useState(false)
  const [refused, setRefused] = useState(false)

  const used = useMemo(
    () => tally([...hand.concealed, ...hand.melds.flatMap(meldTiles)]),
    [hand.concealed, hand.melds],
  )
  const autoKongs = useMemo(() => concealedKongs(hand.concealed), [hand.concealed])
  const target = concealedTarget(hand)
  const complete = target >= 2 && (
    hand.concealed.length === target
    // Four of a tile is nearly always a concealed kong, but an irregular hand
    // like Nine Gates can hold four with no meld at all, so the shorter
    // reading counts as finished too.
    || (autoKongs.length > 0 && hand.concealed.length === target - autoKongs.length)
  )
  const kongCount = hand.melds.filter((m) => m.t === 'kong').length + autoKongs.length
  const dealer = isDealer(table, table.youIndex)

  const legal = declare ? legalNextTiles(declare.kind, declare.chosen, used) : null


  /** The loose tiles, with each auto-detected kong pulled out as a group. */
  const loose = useMemo(() => {
    const rest = [...hand.concealed]
    for (const k of autoKongs) {
      for (let i = 0; i < 4; i++) {
        const at = rest.indexOf(k)
        if (at >= 0) rest.splice(at, 1)
      }
    }
    return rest
  }, [hand.concealed, autoKongs])

  // The winning tile is one tile, not every copy of it: mark the first match
  // so "won on this" never appears twice.
  const wonIndex = complete && hand.winningTile !== null
    ? loose.indexOf(hand.winningTile)
    : -1

  // A hand holds four sets and a pair, so a fifth meld cannot exist, and a
  // meld must leave room for the tiles already keyed.
  const meldRoom = (kind: MeldKind): boolean => {
    if (hand.melds.length >= 4) return false
    const size = kind === 'kong' ? 4 : 3
    const grows = kind === 'kong' ? 1 : 0
    const nextTarget = 14 + kongCount + grows
      - (hand.melds.reduce((n, m) => n + meldTiles(m).length, 0) + size)
    return nextTarget >= 2 && hand.concealed.length <= nextTarget
  }
  const canDeclare = (['chow', 'pong', 'kong'] as MeldKind[]).some(meldRoom)

  useEffect(() => {
    const patch: Partial<HandState> = {}
    const stale = hand.flags.filter((f) => blockedReason(f, dealer, kongCount, hand.win) !== null)
    if (stale.length) patch.flags = hand.flags.filter((f) => !stale.includes(f))
    // A tile swallowed by a concealed kong can no longer be the winning tile.
    if (hand.winningTile !== null && !loose.includes(hand.winningTile)) {
      patch.winningTile = null
    }
    if (hand.win === 'selfDraw' && hand.pao) patch.pao = false
    if (Object.keys(patch).length) setHand(patch)
  }, [dealer, kongCount, hand.flags, hand.winningTile, hand.win, hand.pao, loose])

  const tapWall = (id: TileId) => {
    if (declare) {
      if (declare.chosen.includes(id)) {
        setDeclare({ ...declare, chosen: declare.chosen.filter((x) => x !== id) })
        return
      }
      if (!legal?.has(id)) return
      const chosen = [...declare.chosen, id]
      if (tilesRemaining(declare.kind, chosen) > 0) { setDeclare({ ...declare, chosen }); return }
      const meld = buildMeld(declare.kind, chosen)
      if (meld) setHand({ melds: [...hand.melds, meld], log: [...hand.log, 'meld'] })
      setDeclare(null)
      return
    }
    if ((used.get(id) ?? 0) >= 4) return
    // The fourth copy of a tile IS the tile that turns it into a concealed kong
    // and grows the hand by one, so the tap has to be measured against the hand
    // it would produce, not the one before it.
    const next = [...hand.concealed, id]
    if (next.length > concealedTarget({ ...hand, concealed: next })) {
      setRefused(true)
      window.setTimeout(() => setRefused(false), 3000)
      return
    }
    setHand({ concealed: next, log: [...hand.log, 'tile'] })
  }

  const tapTray = (id: TileId, index: number) => {
    if (complete) { setHand({ winningTile: id }); return }
    const at = hand.concealed.indexOf(id, index)
    const i = at >= 0 ? at : hand.concealed.indexOf(id)
    const next = hand.concealed.filter((_, j) => j !== i)
    const log = [...hand.log]
    const lastTile = log.lastIndexOf('tile')
    if (lastTile >= 0) log.splice(lastTile, 1)
    setHand({
      concealed: next, log,
      winningTile: hand.winningTile && next.includes(hand.winningTile) ? hand.winningTile : null,
    })
  }

  /** Take one copy of a tile back out of the concealed hand. */
  const removeOne = (id: TileId) => {
    const i = hand.concealed.indexOf(id)
    if (i < 0) return
    const next = hand.concealed.filter((_, j) => j !== i)
    const log = [...hand.log]
    const lastTile = log.lastIndexOf('tile')
    if (lastTile >= 0) log.splice(lastTile, 1)
    setHand({
      concealed: next, log,
      winningTile: hand.winningTile && next.includes(hand.winningTile) ? hand.winningTile : null,
    })
  }

  const undo = () => {
    setConfirmClear(false)
    setDeclare(null)
    const last = hand.log[hand.log.length - 1]
    const log = hand.log.slice(0, -1)
    if (last === 'meld') { setHand({ melds: hand.melds.slice(0, -1), log }); return }
    if (last === 'tile') {
      const next = hand.concealed.slice(0, -1)
      setHand({
        concealed: next, log,
        winningTile: hand.winningTile && next.includes(hand.winningTile) ? hand.winningTile : null,
      })
    }
  }

  const winKnown = hand.win === 'selfDraw'
    || (hand.win === 'discard' && hand.discarderIndex !== null)
  const ready = complete && hand.winningTile !== null && winKnown

  const note = declare
    ? declare.kind === 'chow'
      ? declare.chosen.length === 0
        ? t('hand.pickChowFirst')
        : t('hand.pickChowMore', { n: tilesRemaining('chow', declare.chosen) })
      : declare.kind === 'pong' ? t('hand.pickPong') : t('hand.pickKong')
    : refused
      ? t('hand.full')
      : complete && hand.winningTile === null
        ? t('hand.tapWinningTile')
        : null

  const suit = SUIT_OF_TAB[tab]
  const wallTile = (id: TileId) => {
    // A tile already tapped into the meld shows as taken, not as dead, so the
    // player can see what they have picked so far.
    const chosen = declare?.chosen.includes(id) ?? false
    return (
      <Tile key={id} id={id} count={used.get(id) ?? 0} onClick={tapWall}
        taken={chosen} dead={!chosen && legal ? !legal.has(id) : false} />
    )
  }
  const others = table.players.map((_, i) => i).filter((i) => i !== table.youIndex)
  const nameOf = (i: number) => table.players[i] || t('table.playerN', { n: i + 1 })

  return (
    <div class="shell">
      <Signboard table={table} stake={stake} limit={limit} onMenu={onMenu} />
      <Seats table={table} />

      <div class="tabs" role="tablist" aria-label={t('hand.pickerSuits')}>
        {TABS.map((x) => (
          <button type="button" key={x.key} class="tab" role="tab"
            aria-selected={tab === x.key ? 'true' : 'false'}
            onClick={() => setTab(x.key)}>
            <span class="tab__cjk" aria-hidden="true">{x.cjk}</span>
            <span class="tab__cap">{t(`hand.tab.${x.key}`)}</span>
          </button>
        ))}
      </div>

      <div class="scroll">
        {suit && (
          <div class="grid grid--5" style="margin-top:10px">
            {Array.from({ length: 9 }, (_, i) => `${i + 1}${suit}`).map(wallTile)}
            <div class="stampcell" aria-hidden="true">
              <span class="stampcell__glyph">{SUIT_CJK[suit]}</span>
              <span class="stampcell__n">×36</span>
            </div>
          </div>
        )}
        {tab === 'honours' && (
          <div class="grid grid--4" style="margin-top:10px">
            {[...WINDS, ...DRAGONS].map(wallTile)}
            <div class="stampcell" aria-hidden="true">
              <span class="stampcell__glyph">風箭</span>
              <span class="stampcell__n">×28</span>
            </div>
          </div>
        )}
        {tab === 'bonus' && (
          <>
            <p class="sub" style="margin:10px 0 6px">{t('hand.bonusHint')}</p>
            {([['flowers', FLOWERS], ['seasons', SEASONS], ['animals', ANIMALS]] as const)
              .map(([key, group]) => (
                <section key={key}>
                  <div class="grouplabel">
                    <span class="caps">{t(`tileinfo.group.${key}`)}</span>
                    <span class="grouplabel__rule" />
                  </div>
                  <div class="grid grid--4">
                    {group.map((b) => (
                      <BonusTile key={b} id={b} seat={yourSeat(table)}
                        held={hand.bonus.includes(b)}
                        onClick={declare
                          ? undefined
                          : (id) => setHand({ bonus: toggle(hand.bonus, id) })} />
                    ))}
                  </div>
                </section>
              ))}
          </>
        )}

        {/* ── the hand: melds and loose tiles in one tray ── */}
        <div class="trayhead">
          <span class="caps">{t('hand.yourHand')}</span>
          <span class="trayhead__n">
            {t('hand.count', { n: hand.concealed.length, needed: target })}
          </span>
          <span class="trayhead__sp" />
          <button type="button" class="linkbtn" disabled={!hand.log.length} onClick={undo}>
            {t('hand.undo')}
          </button>
          <button type="button" class="linkbtn"
            disabled={!hand.log.length && !hand.bonus.length}
            aria-pressed={confirmClear ? 'true' : 'false'}
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true)
                window.setTimeout(() => setConfirmClear(false), 4000)
                return
              }
              setHand({ ...EMPTY_HAND })
              setConfirmClear(false); setDeclare(null)
            }}>
            {confirmClear ? t('hand.clearConfirm') : t('hand.clear')}
          </button>
        </div>

        <div class="tray">
          {hand.melds.map((m, i) => (
            <button type="button" class="tray__group tray__group--exposed" key={`m${i}`}
              aria-label={t('hand.meldRemove')}
              onClick={() => {
                const log = [...hand.log]
                const at = log.lastIndexOf('meld')
                if (at >= 0) log.splice(at, 1)
                setHand({ melds: hand.melds.filter((_, j) => j !== i), log })
              }}>
              <div class="tray__tiles">
                {meldTiles(m).map((id, j) => <Tile key={j} id={id} mini />)}
              </div>
              <span class="tray__tag">{t(`hand.tag${m.t[0]!.toUpperCase()}${m.t.slice(1)}`)}</span>
            </button>
          ))}
          {autoKongs.map((k) => (
            <div class="tray__group" key={`k${k}`}>
              <div class="tray__tiles">
                {[0, 1, 2, 3].map((j) => (
                  <Tile key={j} id={k} mini removes={!complete}
                    onClick={complete ? undefined : () => removeOne(k)} />
                ))}
              </div>
              <span class="tray__tag tray__tag--auto">{t('hand.tagConcealedKong')}</span>
            </div>
          ))}
          {loose.map((id, i) => (
            <div class="tray__one" key={`${id}-${i}`}>
              <Tile id={id} mini removes={!complete} wonOn={i === wonIndex}
                onClick={() => tapTray(id, i)} />
              {i === wonIndex && <span class="tray__won">{t('hand.wonOnTag')}</span>}
            </div>
          ))}
          {Array.from({ length: Math.max(0, target - hand.concealed.length) }, (_, i) => (
            <div class="tray__one" key={`s${i}`}><div class="slot" aria-hidden="true" /></div>
          ))}
        </div>

        {autoKongs.map((k) => (
          <p class="chipnote" key={`n${k}`}>
            {t('hand.concealedKongFound', { tile: tileName(k) })}
          </p>
        ))}
        <button type="button" class="bonusheld" onClick={() => setTab('bonus')}>
          {hand.bonus.length > 0
            ? hand.bonus.map((b) => (
              <span class="bonusheld__x" key={b}>{t(`tile.bonus.${b}`)}</span>
            ))
            : <span class="bonusheld__none">{t('hand.bonusNone')}</span>}
          <span class="bonusheld__go">{t('hand.bonusAdd')}</span>
        </button>

        {/* ── declare ── */}
        {declare ? null : picking ? (
          <div class="declarerow">
            {(['chow', 'pong', 'kong'] as MeldKind[]).map((k) => (
              <button type="button" key={k} class="declareopt" disabled={!meldRoom(k)}
                onClick={() => { setDeclare({ kind: k, chosen: [] }); setPicking(false) }}>
                <span class="declareopt__k">
                  {t(`hand.declare${k[0]!.toUpperCase()}${k.slice(1)}`)}
                </span>
                <span class="declareopt__s">
                  {t(`hand.declare${k[0]!.toUpperCase()}${k.slice(1)}Sub`)}
                </span>
              </button>
            ))}
            <button type="button" class="btn" onClick={() => setPicking(false)}>
              {t('hand.declareCancel')}
            </button>
          </div>
        ) : (
          <>
            <button type="button" class="btn btn--block" style="margin-top:10px"
              disabled={complete || !canDeclare} onClick={() => setPicking(true)}>
              {t('hand.declare')}
            </button>
            {(complete || !canDeclare) && (
              <p class="capnote">{t('hand.declareDone')}</p>
            )}
          </>
        )}

        {/* ── anything unusual ── */}
        <div class="disclose">
          <button type="button" class="disclose__btn" aria-expanded={unusual}
            onClick={() => setUnusual((v) => !v)}>
            <span>{t('hand.unusual')}</span>
            <span class="disclose__n">
              {hand.flags.length + (hand.pao ? 1 : 0)
                ? t('hand.unusualCount', { n: hand.flags.length + (hand.pao ? 1 : 0) })
                : t('hand.unusualNone')}
            </span>
          </button>
          {unusual && (
            <div class="disclose__body">
              {FLAGS.map((f) => {
                const why = blockedReason(f, dealer, kongCount, hand.win)
                return (
                  <div class="unusual" key={f}>
                    <button type="button" class="unusual__pick" disabled={why !== null}
                      aria-pressed={hand.flags.includes(f) ? 'true' : 'false'}
                      onClick={() => setHand({ flags: toggle(hand.flags, f) })}>
                      <span class="unusual__name">{t(`flag.${f}`)}</span>
                      <span class="unusual__sub">{why ?? t(`flag.${f}.sub`)}</span>
                    </button>
                    <button type="button" class="unusual__why" onClick={() => setDetail(f)}
                      aria-label={t('hand.whatsThis')}>?</button>
                  </div>
                )
              })}
              {hand.win === 'discard' && (
                <div class="unusual">
                  <button type="button" class="unusual__pick"
                    aria-pressed={hand.pao ? 'true' : 'false'}
                    onClick={() => setHand({ pao: !hand.pao })}>
                    <span class="unusual__name">{t('flag.pao')}</span>
                    <span class="unusual__sub">{t('flag.pao.sub')}</span>
                  </button>
                  <button type="button" class="unusual__why" onClick={() => setDetail('pao')}
                    aria-label={t('hand.whatsThis')}>?</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div class="dock">
        <p class="docknote" role="status" data-empty={note ? undefined : 'true'}>
          <span>{note ?? ''}</span>
          {declare && (
            <button type="button" class="linkbtn" onClick={() => setDeclare(null)}>
              {t('hand.declareCancel')}
            </button>
          )}
        </p>

        {hand.win === null || editWin ? (
          <div class="wingrid" role="radiogroup" aria-label={t('hand.whoWon')}>
            <button type="button" class="wingrid__opt" role="radio"
              aria-checked={hand.win === 'selfDraw' ? 'true' : 'false'}
              onClick={() => {
                setHand({ win: 'selfDraw', discarderIndex: null, pao: false }); setEditWin(false)
              }}>
              {t('hand.selfDrew')}
            </button>
            {others.map((i) => (
              <button type="button" key={i} class="wingrid__opt" role="radio"
                aria-checked={hand.win === 'discard' && hand.discarderIndex === i ? 'true' : 'false'}
                onClick={() => { setHand({ win: 'discard', discarderIndex: i }); setEditWin(false) }}>
                {t('hand.threwIt', { name: nameOf(i) })}
              </button>
            ))}
          </div>
        ) : (
          <button type="button" class="winsummary" onClick={() => setEditWin(true)}>
            <span>{hand.win === 'selfDraw'
              ? t('hand.selfDrew')
              : t('hand.threwIt', { name: nameOf(hand.discarderIndex!) })}</span>
            <span class="winsummary__edit">{t('result.editHand')}</span>
          </button>
        )}

        <button type="button" class="btn btn--primary btn--block" disabled={!ready}
          onClick={onScore}>
          {ready ? t('hand.ready')
            : !complete ? t('hand.needTiles', { n: Math.max(0, target - hand.concealed.length) })
              : hand.winningTile === null ? t('hand.needWinningTile')
                : t('hand.needWinner')}
        </button>
      </div>

      {detail && (
        <Sheet title={t(`flag.${detail}`)} onClose={() => setDetail(null)}>
          <p>{t(`flag.${detail}.detail`)}</p>
        </Sheet>
      )}
    </div>
  )
}

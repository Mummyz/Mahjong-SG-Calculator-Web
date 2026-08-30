import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { t } from '../../i18n'
import { Tile, BonusTile, tileName } from '../components/Tile'
import { Signboard } from '../components/Signboard'
import { Seats } from '../components/Seats'
import {
  ANIMALS, DRAGONS, FLOWERS, SEASONS, WINDS,
  type BonusId, type TileId, tally,
} from '../../engine/core/tiles'
import type { MeldInput } from '../../engine/core/hand'
import {
  buildMeld, concealedKongs, concealedTarget, concealedTargets, handIsComplete,
  handIsReadable, legalNextTiles, tilesRemaining, yourSeat,
  type MeldKind, type TableState,
} from '../../engine/session/table'
import { VARIANTS, type VariantId } from '../../engine/variants'

/**
 * The tiles, and nothing else.
 *
 * How the hand was won is not part of this state — it is asked for once, in
 * the submit wizard, after the tiles are proven complete. Nothing about the
 * win can go stale here because nothing about the win is stored here.
 */
export interface HandState {
  concealed: TileId[]
  /** Melds claimed from the table. Concealed kongs are never in here. */
  melds: MeldInput[]
  bonus: BonusId[]
  log: ('tile' | 'meld')[]
}

export const EMPTY_HAND: HandState = { concealed: [], melds: [], bonus: [], log: [] }

type TabKey = 'characters' | 'dots' | 'bamboo' | 'honours' | 'bonus'
const TABS: { key: TabKey; cjk: string }[] = [
  { key: 'characters', cjk: '萬' }, { key: 'dots', cjk: '筒' }, { key: 'bamboo', cjk: '索' },
  { key: 'honours', cjk: '風箭' }, { key: 'bonus', cjk: '花' },
]
const SUIT_OF_TAB: Partial<Record<TabKey, 'm' | 'p' | 's'>> =
  { characters: 'm', dots: 'p', bamboo: 's' }
const SUIT_CJK: Record<string, string> = { m: '萬', p: '筒', s: '索' }

const toggle = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

const meldTiles = (m: MeldInput): TileId[] => m.tiles.trim().split(/\s+/)

export function HandEntry({ variant, table, stake, limit, hand, setHand, onMenu, onScore }: {
  variant: VariantId
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
  const [confirmClear, setConfirmClear] = useState(false)
  const [refused, setRefused] = useState(false)

  const used = useMemo(
    () => tally([...hand.concealed, ...hand.melds.flatMap(meldTiles)]),
    [hand.concealed, hand.melds],
  )
  const autoKongs = useMemo(() => concealedKongs(hand.concealed), [hand.concealed])
  const { min: targetMin, max: targetMax } = concealedTargets(hand)
  const complete = handIsComplete(hand)
  const readable = complete && handIsReadable(VARIANTS[variant], hand)
  const kongCount = hand.melds.filter((m) => m.t === 'kong').length + autoKongs.length

  /**
   * Four of a tile is a concealed kong only once the hand is the size that
   * says so. Until then those four tiles are four tiles: claiming a kong early
   * made a fourteen-tile hand ask for seventeen and hang three empty slots off
   * the tray it had no use for.
   */
  const kongsInPlay = autoKongs.length > 0 && hand.concealed.length === targetMax
    && targetMax !== targetMin
  const shownTarget = hand.concealed.length <= targetMin ? targetMin : targetMax
  const slotsLeft = complete ? 0 : Math.max(0, shownTarget - hand.concealed.length)

  const legal = declare ? legalNextTiles(declare.kind, declare.chosen, used) : null
  /**
   * While a meld is being declared — including while its kind is still being
   * chosen — nothing else on the screen responds. The chooser is part of the
   * declare, not a step before it: a wall tap during it used to add a loose
   * tile behind the player's back.
   */
  const focus = declare !== null || picking

  const loose = useMemo(() => {
    if (!kongsInPlay) return [...hand.concealed]
    const rest = [...hand.concealed]
    for (const k of autoKongs) {
      for (let i = 0; i < 4; i++) {
        const at = rest.indexOf(k)
        if (at >= 0) rest.splice(at, 1)
      }
    }
    return rest
  }, [hand.concealed, autoKongs, kongsInPlay])

  // A declare cannot outlive the hand it was started in.
  const emptied = hand.concealed.length === 0 && hand.melds.length === 0
  useEffect(() => {
    if (emptied) { setDeclare(null); setPicking(false) }
  }, [emptied])

  const declareRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (picking) declareRef.current?.scrollIntoView({ block: 'end' })
  }, [picking])

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

  /** Declare says what is actually left rather than just going dead. */
  const declareLabel = (): string => {
    if (canDeclare && !complete) return t('hand.declare')
    if (complete) return t('hand.declareComplete')
    if (hand.melds.length >= 4) return t('hand.declareNoRoom')
    if (slotsLeft === 1) return t('hand.declareOneLeft')
    if (slotsLeft === 2) return t('hand.declarePairLeft')
    return t('hand.declareNoRoom')
  }

  const tapWall = (id: TileId) => {
    // The kind chooser is open: the wall is scenery until it is answered.
    if (picking) return
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

  /** Take one copy of a tile back out of the concealed hand. */
  const removeOne = (id: TileId) => {
    const i = hand.concealed.indexOf(id)
    if (i < 0) return
    const log = [...hand.log]
    const lastTile = log.lastIndexOf('tile')
    if (lastTile >= 0) log.splice(lastTile, 1)
    setHand({ concealed: hand.concealed.filter((_, j) => j !== i), log })
  }

  const undo = () => {
    setConfirmClear(false); setDeclare(null)
    const last = hand.log[hand.log.length - 1]
    const log = hand.log.slice(0, -1)
    if (last === 'meld') { setHand({ melds: hand.melds.slice(0, -1), log }); return }
    if (last === 'tile') setHand({ concealed: hand.concealed.slice(0, -1), log })
  }

  const note = declare
    ? declare.kind === 'chow'
      ? declare.chosen.length === 0
        ? t('hand.pickChowFirst')
        : t('hand.pickChowMore', { n: tilesRemaining('chow', declare.chosen) })
      : declare.kind === 'pong' ? t('hand.pickPong') : t('hand.pickKong')
    : refused ? t('hand.full') : null

  const suit = SUIT_OF_TAB[tab]
  const wallTile = (id: TileId) => {
    const chosen = declare?.chosen.includes(id) ?? false
    return (
      <Tile key={id} id={id} count={used.get(id) ?? 0}
        onClick={focus && !declare ? undefined : tapWall}
        taken={chosen} dead={!chosen && (legal ? !legal.has(id) : picking)} />
    )
  }

  return (
    <div class="shell" data-focus={focus ? 'true' : undefined}>
      <Signboard table={table} stake={stake} limit={limit}
        onMenu={focus ? () => {} : onMenu} disabled={focus} />
      <Seats table={table} />

      <div class="tabs" role="tablist" aria-label={t('hand.pickerSuits')}>
        {TABS.map((x) => (
          <button type="button" key={x.key} class="tab" role="tab"
            aria-selected={tab === x.key ? 'true' : 'false'}
            disabled={focus && x.key === 'bonus'}
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
                  <div class="grid grid--4 bonusgrid">
                    {group.map((b) => (
                      <BonusTile key={b} id={b} seat={yourSeat(table)}
                        held={hand.bonus.includes(b)}
                        onClick={focus
                          ? undefined
                          : (id) => setHand({ bonus: toggle(hand.bonus, id) })} />
                    ))}
                  </div>
                </section>
              ))}
          </>
        )}

        <div class="trayhead">
          <span class="caps">{t('hand.yourHand')}</span>
          <span class="trayhead__n">
            {complete
              ? t('hand.countComplete', { n: hand.concealed.length })
              : t('hand.count', { n: hand.concealed.length, needed: shownTarget })}
          </span>
          <span class="trayhead__sp" />
          <button type="button" class="linkbtn" disabled={focus || !hand.log.length} onClick={undo}>
            {t('hand.undo')}
          </button>
          <button type="button" class="linkbtn"
            disabled={focus || (!hand.log.length && !hand.bonus.length)}
            aria-pressed={confirmClear ? 'true' : 'false'}
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true)
                window.setTimeout(() => setConfirmClear(false), 4000)
                return
              }
              setHand({ ...EMPTY_HAND }); setConfirmClear(false); setDeclare(null)
            }}>
            {confirmClear ? t('hand.clearConfirm') : t('hand.clear')}
          </button>
        </div>

        <div class="tray">
          {hand.melds.map((m, i) => (
            <button type="button" class="tray__group tray__group--exposed" key={`m${i}`}
              disabled={focus} aria-label={t('hand.meldRemove')}
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
          {(kongsInPlay ? autoKongs : []).map((k) => (
            <div class="tray__group" key={`k${k}`}>
              <div class="tray__tiles">
                {[0, 1, 2, 3].map((j) => (
                  <Tile key={j} id={k} mini removes onClick={focus ? undefined : () => removeOne(k)} />
                ))}
              </div>
              <span class="tray__tag tray__tag--auto">{t('hand.tagConcealedKong')}</span>
            </div>
          ))}
          {loose.map((id, i) => (
            <div class="tray__one" key={`${id}-${i}`}>
              <Tile id={id} mini removes onClick={focus ? undefined : () => removeOne(id)} />
            </div>
          ))}
          {Array.from({ length: slotsLeft }, (_, i) => (
            <div class="tray__one" key={`s${i}`}><div class="slot" aria-hidden="true" /></div>
          ))}
        </div>

        {(kongsInPlay ? autoKongs : []).map((k) => (
          <p class="chipnote" key={`n${k}`}>
            {t('hand.concealedKongFound', { tile: tileName(k) })}
          </p>
        ))}

        <button type="button" class="bonusheld" disabled={focus} onClick={() => setTab('bonus')}>
          {hand.bonus.length > 0
            ? hand.bonus.map((b) => (
              <span class="bonusheld__x" key={b}>{t(`tile.bonus.${b}`)}</span>
            ))
            : <span class="bonusheld__none">{t('hand.bonusNone')}</span>}
          <span class="bonusheld__go">{t('hand.bonusAdd')}</span>
        </button>

        {picking ? (
          <div class="declarerow" ref={declareRef}>
            {(['chow', 'pong', 'kong'] as MeldKind[]).map((k) => (
              <button type="button" key={k} class="declareopt" disabled={!meldRoom(k)}
                onClick={() => {
                  // The bonus tab has no wall tiles on it, so a declare
                  // started from there would strand the player in focus mode.
                  if (tab === 'bonus') setTab('characters')
                  setDeclare({ kind: k, chosen: [] }); setPicking(false)
                }}>
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
        ) : !declare && (
          <button type="button" class="btn btn--block" style="margin-top:10px"
            disabled={complete || !canDeclare} onClick={() => setPicking(true)}>
            {declareLabel()}
          </button>
        )}
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
        <button type="button" class="btn btn--primary btn--block"
          disabled={focus || !readable} onClick={onScore}>
          {readable
            ? t('hand.scoreReady')
            : complete
              ? t('hand.notAHand')
              : t('hand.needTiles', { n: Math.max(1, shownTarget - hand.concealed.length) })}
        </button>
      </div>
    </div>
  )
}

import { useEffect, useMemo, useState } from 'preact/hooks'
import { t } from '../../i18n'
import { Tile, BonusTile } from '../components/Tile'
import { Signboard } from '../components/Signboard'
import type { GameSettings } from './Setup'
import {
  ANIMALS, DRAGONS, FLOWERS, SEASONS, WINDS,
  type BonusId, type TileId, type Wind, rankOf, suitOf, tally,
} from '../../engine/core/tiles'
import type { MeldInput, MeldKind } from '../../engine/core/hand'
import type { WinFlag, WinMethod } from '../../engine/core/variant'

export interface HandState {
  concealed: TileId[]
  melds: MeldInput[]
  bonus: BonusId[]
  winningTile: TileId | null
  /** How this hand was won. Null until the player says — never defaulted. */
  win: WinMethod | null
  /** Who threw the winning tile. Null on a self-draw, and never guessed. */
  discarder: Wind | null
  flags: WinFlag[]
  pao: boolean
  /** What was added, in order, so Undo can reverse the last action. */
  log: ('tile' | 'meld')[]
}

export const EMPTY_HAND: HandState = {
  concealed: [], melds: [], bonus: [], winningTile: null,
  win: null, discarder: null, flags: [], pao: false, log: [],
}

type TabKey = 'characters' | 'dots' | 'bamboo' | 'honours' | 'bonus'
const TABS: { key: TabKey; cjk: string }[] = [
  { key: 'characters', cjk: '萬' }, { key: 'dots', cjk: '筒' }, { key: 'bamboo', cjk: '索' },
  { key: 'honours', cjk: '風箭' }, { key: 'bonus', cjk: '花' },
]
const SUIT_OF_TAB: Partial<Record<TabKey, 'm' | 'p' | 's'>> =
  { characters: 'm', dots: 'p', bamboo: 's' }
const SUIT_CJK: Record<string, string> = { m: '萬', p: '筒', s: '索' }
const WIND_GLYPH: Record<Wind, string> = { E: '東', S: '南', W: '西', N: '北' }

const FLAGS: WinFlag[] = [
  'robbingKong', 'lastTile', 'kongReplacement', 'flowerReplacement',
  'heavenly', 'earthly', 'humanly', 'kongOnKong',
]

/** Circumstances the engine will refuse for this seat or kong count (R8d). */
function flagBlockedReason(f: WinFlag, seat: Wind, kongs: number): string | null {
  if (f === 'heavenly' && seat !== 'E') return t('flag.disabled.dealerOnly')
  if ((f === 'earthly' || f === 'humanly') && seat === 'E') return t('flag.disabled.nonDealerOnly')
  if (f === 'kongOnKong' && kongs < 2) return t('flag.disabled.needsTwoKongs')
  return null
}

const toggle = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

const meldTileList = (kind: MeldKind, base: TileId): TileId[] => {
  if (kind === 'pong') return [base, base, base]
  if (kind === 'kong') return [base, base, base, base]
  const r = rankOf(base)!
  const s = suitOf(base)!
  return [`${r}${s}`, `${r + 1}${s}`, `${r + 2}${s}`]
}

export function HandEntry({ game, hand, setHand, onBack, onScore, onInfo }: {
  game: GameSettings
  hand: HandState
  setHand: (patch: Partial<HandState>) => void
  onBack: () => void
  onScore: () => void
  onInfo: () => void
}) {
  const [tab, setTab] = useState<TabKey>('characters')
  const [draft, setDraft] = useState<{ kind: MeldKind; open: boolean } | null>(null)
  const [draftError, setDraftError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  const [showMelds, setShowMelds] = useState(false)
  const [showExtras, setShowExtras] = useState(false)

  const meldTiles = hand.melds.reduce((n, m) => n + m.tiles.trim().split(/\s+/).length, 0)
  const kongs = hand.melds.filter((m) => m.t === 'kong').length
  const needed = 14 + kongs - meldTiles
  const used = useMemo(() => {
    const all = [...hand.concealed, ...hand.melds.flatMap((m) => m.tiles.trim().split(/\s+/))]
    return tally(all)
  }, [hand.concealed, hand.melds])


  // A seat change can make you your own discarder, or leave a circumstance set
  // that the engine would now refuse. Neither may survive silently.
  useEffect(() => {
    const patch: Partial<HandState> = {}
    if (hand.discarder === game.seat) { patch.discarder = null; patch.win = null; patch.pao = false }
    const stale = hand.flags.filter((f) => flagBlockedReason(f, game.seat, kongs) !== null)
    if (stale.length) patch.flags = hand.flags.filter((f) => !stale.includes(f))
    if (Object.keys(patch).length) setHand(patch)
  }, [game.seat, kongs, hand.discarder, hand.flags])

  // Tapping the wall with a full hand does nothing; say so rather than going silent.
  const full = !draft && hand.concealed.length >= needed && needed >= 2
  const note = draftError
    ?? (draft
      ? (draft.kind === 'chow'
          ? t('hand.meldPromptChow')
          : t('hand.meldPrompt', {
              kind: t(`hand.meld${draft.kind === 'pong' ? 'Pong' : 'Kong'}`),
            }))
      : full
        ? t('hand.full')
        : null)

  const complete = hand.concealed.length === needed && needed >= 2
  const winKnown = hand.win === 'selfDraw' || (hand.win === 'discard' && hand.discarder !== null)
  const ready = complete && hand.winningTile !== null && winKnown

  const addTile = (id: TileId) => {
    if (draft) {
      if (draft.kind === 'chow') {
        const st = suitOf(id); const r = rankOf(id)
        if (!st || r === null || r > 7) { setDraftError(t('hand.meldChowIneligible')); return }
      }
      const tiles = meldTileList(draft.kind, id)
      // A meld must fit in the hand and cannot want a fifth copy of a tile.
      const counts = new Map(used)
      for (const x of tiles) counts.set(x, (counts.get(x) ?? 0) + 1)
      if ([...counts.values()].some((n) => n > 4)) { setDraftError(t('hand.meldTooMany')); return }
      const kongsAfter = kongs + (draft.kind === 'kong' ? 1 : 0)
      const neededAfter = 14 + kongsAfter - (meldTiles + tiles.length)
      if (hand.melds.length >= 4 || neededAfter < 2 || hand.concealed.length > neededAfter) {
        setDraftError(t('hand.meldNoRoom')); return
      }
      setHand({
        melds: [...hand.melds, { t: draft.kind, tiles: tiles.join(' '), open: draft.open }],
        log: [...hand.log, 'meld'],
      })
      setDraft(null); setDraftError(null)
      return
    }
    if ((used.get(id) ?? 0) >= 4) return
    if (hand.concealed.length >= needed) return
    // The winning tile is never guessed — it changes the score by up to 4 fan.
    setHand({ concealed: [...hand.concealed, id], log: [...hand.log, 'tile'] })
  }

  const removeAt = (i: number) => {
    const next = hand.concealed.filter((_, j) => j !== i)
    const log = [...hand.log]
    const last = log.lastIndexOf('tile')
    if (last >= 0) log.splice(last, 1)
    setHand({
      concealed: next,
      log,
      winningTile: hand.winningTile && next.includes(hand.winningTile) ? hand.winningTile : null,
    })
  }

  /** Reverse the most recent addition, whatever kind it was. */
  const undo = () => {
    setConfirmClear(false)
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

  const suit = SUIT_OF_TAB[tab]
  const distinct = [...new Set(hand.concealed)]

  return (
    <div class="shell">
      <Signboard seat={game.seat} prevailing={game.prevailing} stake={game.stake}
        limit={game.limit} onSeat={onBack} onInfo={onInfo} />

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
            {Array.from({ length: 9 }, (_, i) => `${i + 1}${suit}`).map((id) => (
              <Tile key={id} id={id} count={used.get(id) ?? 0} onClick={addTile} />
            ))}
            <div class="stampcell" aria-hidden="true">
              <span class="stampcell__glyph">{SUIT_CJK[suit]}</span>
              <span class="stampcell__n">×36</span>
            </div>
          </div>
        )}

        {tab === 'honours' && (
          <div class="grid grid--4" style="margin-top:10px">
            {[...WINDS, ...DRAGONS].map((id) => (
              <Tile key={id} id={id} count={used.get(id) ?? 0} onClick={addTile} />
            ))}
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
                      <BonusTile key={b} id={b} seat={game.seat}
                        held={hand.bonus.includes(b)}
                        onClick={(id) => setHand({ bonus: toggle(hand.bonus, id) })} />
                    ))}
                  </div>
                </section>
              ))}
          </>
        )}

        <div class="trayhead">
          <span class="trayhead__n">{t('hand.count', { n: hand.concealed.length, needed })}</span>
          <span class="trayhead__sp" />
          <button type="button" class="linkbtn" disabled={!hand.log.length} onClick={undo}>
            {t('hand.undo')}</button>
          <button type="button" class="linkbtn"
            disabled={!hand.log.length && !hand.bonus.length}
            aria-pressed={confirmClear ? 'true' : 'false'}
            onClick={() => {
              if (!confirmClear) {
                setConfirmClear(true)
                window.setTimeout(() => setConfirmClear(false), 4000)
                return
              }
              setHand({ concealed: [], melds: [], bonus: [], winningTile: null, log: [] })
              setConfirmClear(false)
            }}
            onBlur={() => setConfirmClear(false)}>
            {confirmClear ? t('hand.clearConfirm') : t('hand.clear')}
          </button>
        </div>

        {hand.bonus.length > 0 && (
          <p class="bonusheld">
            <span class="caps">{t('hand.bonusHeld')}</span>
            {hand.bonus.map((b) => (
              <span class="bonusheld__x" key={b}>{t(`tile.bonus.${b}`)}</span>
            ))}
          </p>
        )}
        <div class="grid grid--7">
          {Array.from({ length: Math.ceil(Math.max(needed, hand.concealed.length) / 7) * 7 },
            (_, i) => {
              const id = hand.concealed[i]
              if (id) {
                return <Tile key={`${id}-${i}`} id={id} mini removes onClick={() => removeAt(i)} />
              }
              // Dashed while the hand still wants tiles; blank once it is full,
              // so an empty cell never lies about what is still needed.
              return i < needed
                ? <div class="slot" key={`slot-${i}`} aria-hidden="true" />
                : <div class="cell--blank" key={`blank-${i}`} aria-hidden="true" />
            })}
        </div>

        {complete && (
          <>
            <div class="grouplabel">
              <span class="caps">{t('hand.wonOn')}</span>
              <span class="grouplabel__rule" />
            </div>
            <p class="sub" style="margin:0 0 6px">{t('hand.wonOnPick')}</p>
            <div class="grid grid--7 grid--pick">
              {distinct.map((id) => (
                <Tile key={id} id={id} mini selected={hand.winningTile === id}
                  onClick={() => setHand({ winningTile: id })} />
              ))}
              {Array.from({ length: (7 - (distinct.length % 7)) % 7 }, (_, i) => (
                <div class="cell--blank" key={`b${i}`} aria-hidden="true" />
              ))}
            </div>
          </>
        )}

        <div class="disclose">
          <button type="button" class="disclose__btn" aria-expanded={showMelds}
            onClick={() => setShowMelds((v) => !v)}>
            <span>{t('hand.melds')}</span>
            <span class="disclose__n">{hand.melds.length || t('hand.meldNone')}</span>
          </button>
          {showMelds && (
            <div class="disclose__body">
              <p class="sub" style="margin:0 0 8px">{t('hand.meldsHint')}</p>
              {hand.melds.map((m, i) => (
                <div class="meld" key={i} style="margin-bottom:6px">
                  <div class="meld__tiles">
                    {m.tiles.trim().split(/\s+/).map((id, j) => (
                      <Tile key={j} id={id} mini />
                    ))}
                  </div>
                  <span class="caps">
                    {m.open ? t('hand.meldExposed') : t('hand.meldConcealed')}
                  </span>
                  <button type="button" class="linkbtn"
                    onClick={() => setHand({ melds: hand.melds.filter((_, j) => j !== i) })}>
                    {t('hand.meldRemove')}
                  </button>
                </div>
              ))}
              <div class="chiprow" style="margin-top:8px">
                {(['chow', 'pong', 'kong'] as MeldKind[]).map((k) => (
                  <button type="button" key={k} class="chip"
                    aria-pressed={draft?.kind === k ? 'true' : 'false'}
                    onClick={() => { setDraft({ kind: k, open: true }); setDraftError(null) }}>
                    {t(`hand.meld${k[0]!.toUpperCase()}${k.slice(1)}`)}
                  </button>
                ))}
                <button type="button" class="chip"
                  aria-pressed={draft ? (draft.open ? 'false' : 'true') : 'false'}
                  disabled={!draft}
                  onClick={() => draft && setDraft({ ...draft, open: !draft.open })}>
                  {t('hand.meldConcealed')}
                </button>
              </div>
            </div>
          )}
        </div>

        <div class="disclose">
          <button type="button" class="disclose__btn" aria-expanded={showExtras}
            onClick={() => setShowExtras((v) => !v)}>
            <span>{t('hand.extras')}</span>
            <span class="disclose__n">
              {hand.flags.length + (hand.pao ? 1 : 0) || t('hand.extrasNone')}
            </span>
          </button>
          {showExtras && (
            <div class="disclose__body">
              <div class="chiprow">
                {FLAGS.map((f) => {
                  const reason = flagBlockedReason(f, game.seat, kongs)
                  return (
                    <button type="button" key={f} class="chip" disabled={reason !== null}
                      title={reason ?? undefined}
                      aria-describedby={reason ? `flag-${f}-why` : undefined}
                      aria-pressed={hand.flags.includes(f) ? 'true' : 'false'}
                      onClick={() => setHand({ flags: toggle(hand.flags, f) })}>
                      {t(`flag.${f}`)}
                      {reason && <span class="chip__why" id={`flag-${f}-why`}>{reason}</span>}
                    </button>
                  )
                })}
                {hand.win === 'discard' && (
                  <button type="button" class="chip" aria-pressed={hand.pao ? 'true' : 'false'}
                    onClick={() => setHand({ pao: !hand.pao })}>{t('flag.pao')}</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div class="dock">
        {note && (
          <p class="docknote" role="status">
            <span>{note}</span>
            {draft && (
              <button type="button" class="linkbtn"
                onClick={() => { setDraft(null); setDraftError(null) }}>
                {t('hand.meldCancel')}
              </button>
            )}
          </p>
        )}
        <div class="wincond" role="radiogroup" aria-label={t('hand.winCondition')}>
          <button type="button" class="wincond__opt" role="radio"
            aria-checked={hand.win === 'selfDraw' ? 'true' : 'false'}
            onClick={() => setHand({ win: 'selfDraw', discarder: null, pao: false })}>
            {t('win.selfDraw')}
          </button>
          {WINDS.filter((w) => w !== game.seat).map((w) => (
            <button type="button" key={w} class="wincond__opt" role="radio"
              aria-checked={hand.win === 'discard' && hand.discarder === w ? 'true' : 'false'}
              aria-label={t('hand.threwIt', { wind: t(`wind.${w}`) })}
              onClick={() => setHand({ win: 'discard', discarder: w })}>
              <span class="wincond__cjk" aria-hidden="true">{WIND_GLYPH[w]}</span>
              <span class="wincond__cap" aria-hidden="true">{t(`wind.${w}.short`)}</span>
            </button>
          ))}
        </div>
        <button type="button" class="btn btn--primary btn--block" disabled={!ready}
          onClick={onScore}>
          {ready
            ? t('hand.ready')
            : !complete
              ? t('hand.needTiles', { n: Math.max(0, needed - hand.concealed.length) })
              : hand.winningTile === null
                ? t('hand.needWinningTile')
                : t('hand.needWinCondition')}
        </button>
      </div>
    </div>
  )
}

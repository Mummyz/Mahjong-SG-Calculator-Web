import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { t } from '../../i18n'
import { Tile, BonusTile, tileName } from '../components/Tile'
import { Signboard } from '../components/Signboard'
import { Prediction } from '../components/Prediction'
import { isHonour, type BonusId, type TileId, tally } from '../../engine/core/tiles'
import type { MeldInput } from '../../engine/core/hand'
import {
  buildMeld, concealedKongs, concealedTargets,
  handIsReadable, legalNextTiles, playerOnWind, prevailingWind, tilesRemaining,
  yourSeat,
  type MeldKind, type TableState,
} from '../../engine/session/table'
import { VARIANTS, inventoryOf, type VariantId } from '../../engine/variants'

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
  /**
   * Tiles held four times over that the player has said are NOT a kong.
   *
   * Four of a tile is a concealed kong nearly always — but a pong plus a
   * floater waiting to be discarded is a real hand too, and only the player
   * knows which they have. So the kong is taken by default and this is how it
   * is given back.
   */
  declined?: TileId[]
  /**
   * Tiles a prediction card is showing as GHOSTS in the empty slots.
   *
   * Presentation only. Nothing here is ever part of the hand: not counted, not
   * scored, not submitted. See the guards in ghost.test.ts.
   */
  ghost?: TileId[]
}

export const EMPTY_HAND: HandState = {
  concealed: [], melds: [], bonus: [], log: [], declined: [], ghost: [],
}

/**
 * The picker's tabs are BUILT FROM THE VARIANT, never listed here.
 *
 * Hong Kong has no animals, and the bug this replaced was a screen that
 * listed FLOWERS, SEASONS and ANIMALS as literals: on a 144-tile table the
 * tray offered four tiles that do not exist, and tapping one made the hand
 * unscoreable. A tab now exists because the variant's tile set says so.
 */
type TabKey = string
const CJK_OF_GROUP: Record<string, string> = {
  characters: '萬', dots: '筒', bamboo: '索', winds: '風', dragons: '箭',
  flowers: '花', seasons: '季', animals: '獸',
}
const SUIT_CJK: Record<string, string> = { m: '萬', p: '筒', s: '索' }
const BONUS_TAB = 'bonus'

const toggle = <T,>(list: T[], v: T): T[] =>
  list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

const meldTiles = (m: MeldInput): TileId[] => m.tiles.trim().split(/\s+/)

export function HandEntry({
  variant, table, stake, limit, halfPayment, hand, setHand, onMenu, onScore,
  predictOpen, onPredictToggle,
}: {
  variant: VariantId
  table: TableState
  stake: number
  limit: number
  halfPayment: boolean
  hand: HandState
  setHand: (patch: Partial<HandState>) => void
  onMenu: () => void
  onScore: () => void
  predictOpen: boolean
  onPredictToggle: () => void
}) {
  const plugin = VARIANTS[variant]
  const inv = inventoryOf(plugin)
  /**
   * The picker's tabs, built from the variant's own tile set.
   *
   * One tab per suit, one that merges every honour group (winds and dragons
   * share a tab because at 360px six tabs do not fit), and one tray tab that
   * stacks whatever bonus groups the variant has — three in Singapore, two in
   * Hong Kong. Which tiles exist is never decided here.
   */
  const pickers = useMemo(() => {
    const suits = inv.wallGroups.filter((g) => g.tiles.some((x) => !isHonour(x)))
    const honours = inv.wallGroups.filter((g) => g.tiles.every((x) => isHonour(x)))
    const out = suits.map((g) => ({
      key: g.key, cjk: CJK_OF_GROUP[g.key] ?? '',
      tiles: [...g.tiles] as TileId[], total: g.tiles.length * g.copies,
    }))
    if (honours.length > 0) {
      out.push({
        key: 'honours', cjk: honours.map((g) => CJK_OF_GROUP[g.key] ?? '').join(''),
        tiles: honours.flatMap((g) => [...g.tiles]) as TileId[],
        total: honours.reduce((n, g) => n + g.tiles.length * g.copies, 0),
      })
    }
    return out
  }, [inv])
  const tabs = useMemo(
    () => [...pickers.map((p) => ({ key: p.key, cjk: p.cjk })),
           { key: BONUS_TAB, cjk: CJK_OF_GROUP.flowers! }],
    [pickers])
  const [tab, setTab] = useState<TabKey>(tabs[0]!.key)

  // Changing game changes which tabs exist. Never leave the player standing
  // on one the new variant does not have.
  useEffect(() => {
    if (!tabs.some((x) => x.key === tab)) setTab(tabs[0]!.key)
  }, [tabs, tab])
  const [declare, setDeclare] = useState<{ kind: MeldKind; chosen: TileId[] } | null>(null)
  const [picking, setPicking] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  /** Which candidate is being ghosted. Cleared whenever the tiles change. */
  const [ghostKey, setGhostKey] = useState<string | null>(null)
  const [refused, setRefused] = useState(false)

  const used = useMemo(
    () => tally([...hand.concealed, ...hand.melds.flatMap(meldTiles)]),
    [hand.concealed, hand.melds],
  )
  const found = useMemo(() => concealedKongs(hand.concealed), [hand.concealed])
  const declined = hand.declined ?? []
  /**
   * THE KONG IS TAKEN BY DEFAULT. This is the Run 6 fix.
   *
   * It used to be taken only once the hand had already reached the longer
   * size — which meant a player who tapped a tile four times and stopped at
   * fourteen was told the hand was complete, told it was not a hand, and
   * offered nothing: no empty slot, no prompt, no reason. The fifteenth tile
   * that makes the kong reading work was reachable and never mentioned.
   *
   * Now four of a tile grows the target the moment it appears, a chip says
   * why, and the chip can be answered "not a kong" — because a pong plus a
   * floater is a real hand and only the player knows which they have.
   */
  const autoKongs = useMemo(
    () => found.filter((k) => !declined.includes(k)),
    [found, declined.join(',')],
  )
  const { min: targetMin } = concealedTargets(hand)
  const shownTarget = targetMin + autoKongs.length
  const complete = shownTarget >= 2 && hand.concealed.length === shownTarget
  const readable = complete && handIsReadable(plugin, hand)
  const kongCount = hand.melds.filter((m) => m.t === 'kong').length + autoKongs.length
  const kongsInPlay = autoKongs.length > 0
  const slotsLeft = Math.max(0, shownTarget - hand.concealed.length)
  /**
   * TILES ABOVE THE TARGET, which only declining a kong can produce: the
   * wall's ceiling is the MAX reading, so a hand keyed to fifteen with a quad
   * stays at fifteen when the player says it is not a kong, while the target
   * it is measured against drops to fourteen.
   *
   * Without this the dock read "1 more to go" — Math.max(1, 14 - 15) — beside
   * a wall that answered every tap with "Hand is full". One screen telling a
   * player to add a tile and refusing to let them is the dead end this run
   * exists to remove, and the decline button was a new way back into it.
   */
  const over = Math.max(0, hand.concealed.length - shownTarget)

  /**
   * The ghost tiles, clamped to the slots there are.
   *
   * A plan can need more tiles than the hand has room for once melds are
   * down; painting more ghosts than slots would put tiles in the tray that
   * correspond to nothing. Presentation only, in every direction.
   */
  const ghosts = (hand.ghost ?? []).slice(0, slotsLeft)

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

  /**
   * A GHOST CANNOT OUTLIVE THE HAND IT WAS DRAWN FOR.
   *
   * The plan was computed against a particular set of tiles; the moment the
   * tiles move the outlines are advice about a hand that no longer exists.
   * Keyed on the tiles alone, so painting the ghosts does not clear them.
   */
  const shape = `${hand.concealed.join(',')}|${hand.melds.length}`
  const lastShape = useRef({ shape, tiles: [...hand.concealed] })
  useEffect(() => {
    const was = lastShape.current
    lastShape.current = { shape, tiles: [...hand.concealed] }
    if (was.shape === shape || ghostKey === null) return
    // The player tapped a tile the plan was waiting for: that ghost has become
    // real, so it leaves the outline list and the rest of the plan stands.
    // Anything else means the plan is about a hand that no longer exists.
    const added = hand.concealed.length === was.tiles.length + 1
      ? hand.concealed.find((t, i) => was.tiles[i] !== t) ?? hand.concealed[hand.concealed.length - 1]
      : null
    const ghost = hand.ghost ?? []
    const at = added === undefined || added === null ? -1 : ghost.indexOf(added)
    if (at >= 0) { setHand({ ghost: ghost.filter((_, i) => i !== at) }); return }
    setGhostKey(null); setHand({ ghost: [] })
  }, [shape])

  // A declare cannot outlive the hand it was started in.
  const emptied = hand.concealed.length === 0 && hand.melds.length === 0
  useEffect(() => {
    if (emptied) { setDeclare(null); setPicking(false) }
  }, [emptied])

  const gridRef = useRef<HTMLDivElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const popRef = useRef<HTMLDivElement>(null)
  const declareBtnRef = useRef<HTMLButtonElement>(null)
  /**
   * The chooser is a popup anchored over the dock, not a row in the scroll.
   * As a row it sat under the prediction panel — a thousand pixels below the
   * fold with the panel open — and answering it scrolled the wall away. Over
   * the dock it costs the bottom eighty pixels of the wall and nothing else,
   * which is the whole point: the tiles you are about to tap stay on screen.
   */
  useEffect(() => {
    if (picking) popRef.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus()
  }, [picking])
  /**
   * Escape gets you out of BOTH halves of a declare, and closing the chooser
   * puts the reading cursor back on the button that opened it. Focus was
   * falling to <body> on every exit, which sends a screen reader back to the
   * top of the page from the bottom of it.
   */
  useEffect(() => {
    if (!focus) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (picking) { setPicking(false); declareBtnRef.current?.focus() }
      else setDeclare(null)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [focus, picking])
  // Choosing a kind asks the player to tap a tile, so the wall goes to the
  // top — and the TABS go with it, since the tile they want may be in another
  // suit and the way back to it was scrolling off the screen.
  useEffect(() => {
    if (declare) tabsRef.current?.scrollIntoView({ block: 'start' })
  }, [declare?.kind])

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

  /**
   * Why declaring is off, as a SENTENCE — and it goes in the note, not on the
   * button. On the button it was up to 231px of a 328px dock row, and the
   * primary action was squeezed into what was left of it.
   */
  const declareWhy = (): string | null => {
    if (canDeclare && !complete) return null
    // "Hand is complete" beside a button reading "Not a hand yet" is a
    // contradiction on one screen. The chip above already says what is wrong.
    if (complete) return readable ? t('hand.declareComplete') : null
    if (hand.melds.length >= 4) return t('hand.declareNoRoom')
    // "One tile to finish" is gone: the status pill beside the tray already
    // says "1 more to go", and saying it twice in two registers is noise.
    // NOTHING is the right answer here — falling through to "No room for
    // another meld" told a player one tile short a different and untrue
    // thing about why Declare was off.
    if (slotsLeft <= 1) return null
    if (slotsLeft === 2) return t('hand.declarePairLeft')
    return t('hand.declareNoRoom')
  }

  /**
   * WHY these tiles are not a hand, and what to do about it.
   *
   * A bare "not a winning hand" is the dead end this run exists to remove. If
   * a kong is being read and the hand is one short, say so. If a kong is being
   * read and it is wrong, point at the chip that undoes it.
   */
  const notAHandWhy = (): string => {
    // Over the target first: it is the only one of these the player cannot
    // fix by keying more tiles, so it has to name its own way out.
    if (over > 0) {
      return found.length > 0 && declined.length > 0
        ? t('hand.overTargetKong', { have: hand.concealed.length, want: shownTarget })
        : t('hand.overTarget', { have: hand.concealed.length, want: shownTarget })
    }
    if (kongsInPlay) return t('hand.notAHandKong')
    if (found.length > 0 && declined.length > 0) return t('hand.notAHandDeclined')
    return t('hand.notAHand')
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
    // The ceiling follows the DECLINE: a player who said "not a kong" is
    // building a fourteen-tile hand and must be stopped at fourteen.
    const ceiling = concealedTargets({ ...hand, concealed: next }).min
      + concealedKongs(next).filter((k) => !declined.includes(k)).length
    if (next.length > ceiling) {
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
    : refused ? t('hand.full') : picking ? null : declareWhy()

  const picker = pickers.find((p) => p.key === tab) ?? null
  const suit = picker && picker.tiles[0]!.length === 2 ? picker.tiles[0]![1] : undefined
  const wallTile = (id: TileId) => {
    const chosen = declare?.chosen.includes(id) ?? false
    return (
      <Tile key={id} id={id} count={used.get(id) ?? 0}
        onClick={focus && !declare ? undefined : tapWall}
        taken={chosen}
        /* Face-down means "not a legal next tile", and that is only knowable
           once a KIND has been chosen. While the chooser is open the wall is
           inert but stays face-up: turning forty tiles over to ask a
           three-way question was the opposite of keeping the wall in view. */
        dead={!chosen && legal ? !legal.has(id) : false} />
    )
  }

  /**
   * Two focus modes, not one. While the KIND is being chosen the wall is
   * scenery: it stays face-up (that is the whole point of the popup) but it
   * must not look tappable, because a tile that depresses under a thumb and
   * does nothing reads as a broken app rather than as a question waiting.
   */
  const mode = declare ? 'meld' : picking ? 'pick' : undefined

  return (
    <div class="shell" data-focus={mode}>
      <Signboard table={table} stake={stake} limit={limit}
        onMenu={focus ? () => {} : onMenu} disabled={focus} />

      <div class="scroll">
        {/* YOUR HAND FIRST. The tray used to sit below the wall, so on a 360px
            screen the thing the player is building was never on screen at the
            moment they were building it. */}
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
              setGhostKey(null)
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
          {/* A CONCEALED kong. Its own class of group — face-down at the ends,
              the way it sits on a real table — so it never reads as one of the
              melds claimed from the table above it. */}
          {autoKongs.map((k) => (
            <div class="tray__group tray__group--concealed" key={`k${k}`}>
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
          {/* GHOSTS fill the empty slots and nothing else. They are drawn from
              hand.ghost, which no other part of this screen reads: not the
              count, not `complete`, not the score button, not the kong
              detection. A slot with a ghost in it is still an empty slot. */}
          {Array.from({ length: slotsLeft }, (_, i) => {
            const g = ghosts[i]
            return (
              <div class="tray__one" key={`s${i}`}>
                {g
                  ? <Tile id={g} mini needed />
                  : <div class="slot" aria-hidden="true" />}
              </div>
            )
          })}
        </div>

        {/* THE CHIP. It says plainly why the hand just got a tile longer, and
            it offers the one answer the app cannot work out for itself: a pong
            plus a floater is a real hand, and only the player knows. */}
        {autoKongs.map((k) => (
          <div class="chipnote chipnote--kong" key={`n${k}`}>
            <span>{t('hand.concealedKongFound', { tile: tileName(k) })}</span>
            <button type="button" class="linkbtn" disabled={focus}
              onClick={() => setHand({ declined: [...declined, k] })}>
              {t('hand.kongDecline')}
            </button>
          </div>
        ))}
        {/* WHY, and what to do — beside the tray, not in the dock's status
            line. In the dock it was clamped to two lines of 12px and the
            sentence that names the fix was cut off mid-word, which is the
            dead end this run exists to remove wearing a different hat. */}
        {((complete && !readable) || over > 0) && (
          <p class="chipnote chipnote--warn">{notAHandWhy()}</p>
        )}
        {found.filter((k) => declined.includes(k)).map((k) => (
          <div class="chipnote" key={`d${k}`}>
            <span>{t('hand.kongDeclined', { tile: tileName(k) })}</span>
            <button type="button" class="linkbtn" disabled={focus}
              onClick={() => setHand({ declined: declined.filter((x) => x !== k) })}>
              {t('hand.kongRestore')}
            </button>
          </div>
        ))}

        <button type="button" class="bonusheld" disabled={focus} onClick={() => setTab('bonus')}>
          {hand.bonus.length > 0
            ? hand.bonus.map((b) => (
              <span class="bonusheld__x" key={b}>{t(`tile.bonus.${b}`)}</span>
            ))
            : (
              /* Built from the variant's OWN bonus groups. As a fixed string
                 it said "Flowers, seasons, animals" on a Hong Kong table,
                 which is the Run 4 leakage bug in words instead of tiles.
                 Its own key, because the FROZEN root at / still renders
                 hand.bonusNone with no variables and would have printed the
                 placeholder verbatim. */
              <span class="bonusheld__none">{t('hand.bonusNoneIn', {
                groups: inv.bonusGroups
                  .map((g) => t(`tileinfo.group.${g.key}`))
                  .join(t('list.join')),
              })}</span>
            )}
          <span class="bonusheld__go">{t('hand.bonusAdd')}</span>
        </button>

        {/* THE WALL. Its tabs stick to the top of the scroll, so scrolling
            down the wall never takes the way back to another suit with it. */}
        <div class="tabs" role="tablist" aria-label={t('hand.pickerSuits')} ref={tabsRef}>
          {tabs.map((x) => (
            <button type="button" key={x.key} class="tab" role="tab"
              aria-selected={tab === x.key ? 'true' : 'false'}
              disabled={focus && x.key === BONUS_TAB}
              onClick={() => setTab(x.key)}>
              <span class="tab__cjk" aria-hidden="true">{x.cjk}</span>
              <span class="tab__cap">{t(`hand.tab.${x.key}`)}</span>
            </button>
          ))}
        </div>

        {picker && (
          <div class={`grid grid--${suit ? 5 : 4}`} style="margin-top:10px" ref={gridRef}>
            {picker.tiles.map(wallTile)}
            <div class="stampcell" aria-hidden="true">
              <span class="stampcell__glyph">{suit ? SUIT_CJK[suit] : picker.cjk}</span>
              <span class="stampcell__n">×{picker.total}</span>
            </div>
          </div>
        )}
        {tab === BONUS_TAB && (
          <>
            {/* Its own key. The seat badge is a NUMBER only in v3; the frozen
                root at / still draws a letter, and it renders hand.bonusHint
                too — it would have told a player to read a number that is not
                there. Third time this run that the shared bundle bit. */}
            <p class="sub" style="margin:10px 0 6px">{t('hand.bonusHintSeats')}</p>
            {inv.bonusGroups.map((g) => (
              <section key={g.key}>
                <div class="grouplabel">
                  <span class="caps">{t(`tileinfo.group.${g.key}`)}</span>
                  <span class="grouplabel__rule" />
                </div>
                <div class="grid grid--4 bonusgrid">
                  {g.tiles.map((b) => (
                    <BonusTile key={b} id={b as BonusId} seat={yourSeat(table)}
                      playerOf={(w) => playerOnWind(table, w) + 1}
                      held={hand.bonus.includes(b as BonusId)}
                      onClick={focus
                        ? undefined
                        : (id) => setHand({ bonus: toggle(hand.bonus, id) })} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}

        {/* Gated on focus like every other control: collapsing the panel
            mid-declare threw the wall a screen and a half up the page. */}
        <Prediction variant={variant} hand={hand} rules={{ limit, halfPayment }}
          ctx={{ seat: yourSeat(table), prevailing: prevailingWind(table) }}
          open={predictOpen} onToggle={focus ? () => {} : onPredictToggle}
          frozen={focus}
          ghost={ghostKey}
          onGhost={(key, tiles) => { setGhostKey(key); setHand({ ghost: tiles }) }} />
      </div>

      <div class="dock">
        {picking && (
          <div class="declarepop" ref={popRef} role="dialog"
            aria-label={t('hand.declareTitle')}>
            <p class="declarepop__t">{t('hand.declareTitle')}</p>
            <div class="declarepop__opts">
              {(['chow', 'pong', 'kong'] as MeldKind[]).map((k) => (
                <button type="button" key={k} class="declareopt" disabled={!meldRoom(k)}
                  onClick={() => {
                    // The bonus tab has no wall tiles on it, so a declare
                    // started from there would strand the player in focus mode.
                    if (tab === BONUS_TAB) setTab(tabs[0]!.key)
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
            </div>
            <button type="button" class="linkbtn declarepop__x"
              onClick={() => { setPicking(false); declareBtnRef.current?.focus() }}>
              {t('hand.declareCancel')}
            </button>
          </div>
        )}
        {/* Text only. The Cancel control used to live in here, and when Run 5
            gave the note a fixed 30px box with overflow hidden it clipped a
            44px button down to a strip the thumb could not reach the top or
            bottom of. It is a button, so it sits with the buttons. */}
        <p class="docknote" role="status" data-empty={note ? undefined : 'true'}>
          <span>{note ?? ''}</span>
        </p>
        {/* Both of the screen's actions live in the dock. Declare used to sit
            in the scroll flow under the prediction panel, which put it a
            thousand pixels below the fold the moment the panel was open. */}
        <div class="dock__row">
          {declare ? (
            <button type="button" class="btn btn--ghost" onClick={() => setDeclare(null)}>
              {t('hand.declareCancel')}
            </button>
          ) : (
            <button type="button" class="btn btn--ghost" aria-expanded={picking}
              ref={declareBtnRef}
              disabled={complete || !canDeclare} onClick={() => setPicking(!picking)}>
              {t('hand.declare')}
            </button>
          )}
          <button type="button" class="btn btn--primary btn--block"
            disabled={focus || !readable} onClick={onScore}>
            {readable
              ? t('hand.scoreReady')
              : complete
                ? t('hand.notAHandShort')
                : over > 0
                  ? t('hand.tooMany', { n: over })
                  : t('hand.needTiles', { n: shownTarget - hand.concealed.length })}
          </button>
        </div>
      </div>
    </div>
  )
}

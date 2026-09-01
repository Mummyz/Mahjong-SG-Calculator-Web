import { useEffect, useMemo, useRef, useState } from 'preact/hooks'
import { t } from '../../i18n'
import { Tile, BonusTile } from '../components/Tile'
import { Signboard } from '../components/Signboard'
import { Prediction, SUIT_MARK } from '../components/Prediction'
import { needLabel } from '../components/needLabel'
import type { Requirement } from '../../engine/predict/requirements'
import {
  DRAGONS, WINDS, isHonour, type BonusId, type TileId, tally,
} from '../../engine/core/tiles'
import type { MeldInput } from '../../engine/core/hand'
import {
  buildMeld, concealedTargets, handIsReadable, legalNextTiles, playerOnWind,
  prevailingWind, readingKongs, resolveTarget, tilesRemaining, yourSeat,
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
   * The REQUIREMENTS a prediction card is showing as ghost groups in the empty
   * slots — "any Bamboo pair", not two invented 5 Bamboo faces.
   *
   * Presentation only. Nothing here is ever part of the hand: not counted, not
   * scored, not submitted. See the guards in ghost.test.ts.
   */
  ghost?: Requirement[]
}

export const EMPTY_HAND: HandState = {
  concealed: [], melds: [], bonus: [], log: [], ghost: [],
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

/** Does a tile satisfy a generic requirement of this class? */
const classMatches = (klass: string, tile: TileId): boolean => {
  if (klass === 'dragon') return DRAGONS.includes(tile as never)
  if (klass === 'wind') return WINDS.includes(tile as never)
  if (klass === 'honour') return isHonour(tile)
  if (klass === 'tile') return true
  return tile.length === 2 && tile[1] === klass
}

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
  /**
   * THE TILES ANSWER THE KONG QUESTION. Run 6C.
   *
   * Run 6 put the question on screen: four copies grew the target at once and
   * a chip offered "Not a kong". It was the wrong shape — it interrupted the
   * one thing the screen is for, it scrolled the tray away to do it, and with
   * two quads held there were two of them.
   *
   * The count settles it instead. A hand is fourteen tiles plus one per kong,
   * so `1m 1m 1m 1m 2m 3m` at fourteen is a pong and a chow, and the same
   * quad at fifteen can only be a kong. The engine resolves it on every tap
   * and the player is never asked.
   */
  const kongs = useMemo(
    () => readingKongs(plugin, hand),
    [plugin, hand.concealed.join(','), hand.melds.length],
  )
  const shownTarget = useMemo(
    () => resolveTarget(plugin, hand),
    [plugin, hand.concealed.join(','), hand.melds.length],
  )
  const complete = shownTarget >= 2 && hand.concealed.length === shownTarget
  const readable = complete && handIsReadable(plugin, hand)
  const kongCount = hand.melds.filter((m) => m.t === 'kong').length + kongs.length
  const kongsInPlay = kongs.length > 0
  const slotsLeft = Math.max(0, shownTarget - hand.concealed.length)

  /**
   * The ghost tiles, clamped to the slots there are.
   *
   * A plan can need more tiles than the hand has room for once melds are
   * down; painting more ghosts than slots would put tiles in the tray that
   * correspond to nothing. Presentation only, in every direction.
   */
  /**
   * Clamped to the slots there are, GROUP BY GROUP: a plan can want more than
   * the hand has room for once melds are down, and half a group is not a
   * requirement. Presentation only, in every direction.
   */
  const ghosts = useMemo(() => {
    const out: Requirement[] = []
    let room = slotsLeft
    for (const g of hand.ghost ?? []) {
      // SKIP, do not stop. Breaking on the first group too big for the room
      // left threw away every smaller one behind it, so a plan whose first
      // requirement was a pong showed nothing at all once the tray was three
      // slots from full.
      if (g.count > room) continue
      out.push(g); room -= g.count
    }
    return out
  }, [hand.ghost, slotsLeft])
  const ghostSlots = ghosts.reduce((n, g) => n + g.count, 0)

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
    for (const k of kongs) {
      for (let i = 0; i < 4; i++) {
        const at = rest.indexOf(k)
        if (at >= 0) rest.splice(at, 1)
      }
    }
    return rest
  }, [hand.concealed, kongs, kongsInPlay])

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
    // A tile that SATISFIES a requirement takes a slot off that group rather
    // than clearing the plan: a specific group wants that exact tile, a
    // generic one wants anything of its class.
    const at = added === undefined || added === null ? -1 : ghost.findIndex((g) =>
      g.kind === 'specific' ? g.tile === added : classMatches(g.klass, added))
    if (at >= 0) {
      setHand({
        ghost: ghost.flatMap((g, i) =>
          (i === at ? (g.count > 1 ? [{ ...g, count: g.count - 1 }] : []) : [g])),
      })
      return
    }
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
  const notAHandWhy = (): string => t('hand.notAHand')

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
    // THE CEILING IS THE LONGEST READING THE TILES COULD STILL NEED. The
    // resolver may raise the target by one at a time; the wall must never
    // refuse a tile that resolution is asking for, so it is measured against
    // the maximum rather than the current resolution.
    const ceiling = concealedTargets({ ...hand, concealed: next }).max
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
          {kongs.map((k) => (
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
          {/* GHOST GROUPS. Bracketed like the meld blocks above, spanning the
              slots they need and labelled with the REQUIREMENT — "any Bamboo
              pair" — rather than a face the plan never actually asked for. A
              specific tile still shows its face, because there the identity
              really is forced.

              Drawn from hand.ghost, which no other part of this screen reads:
              not the count, not `complete`, not the score button, not the kong
              resolution. A slot under a ghost is still an empty slot. */}
          {ghosts.map((g, i) => (
            <div class="tray__group tray__group--ghost" key={`g${i}`}>
              <div class="tray__tiles">
                {Array.from({ length: g.count }, (_, j) => (
                  g.kind === 'specific'
                    ? <Tile key={j} id={g.tile} mini needed />
                    : <span class="ghostmark" key={j} aria-hidden="true">
                        {SUIT_MARK[g.klass] ?? '?'}
                      </span>
                ))}
              </div>
              <span class="tray__tag tray__tag--ghost">{needLabel(g)}</span>
            </div>
          ))}
          {Array.from({ length: Math.max(0, slotsLeft - ghostSlots) }, (_, i) => (
            <div class="tray__one" key={`s${i}`}>
              <div class="slot" aria-hidden="true" />
            </div>
          ))}
        </div>

        {/* NO KONG CHIP, and nothing to answer. The tray already shows the
            resolution — a quad the count makes a kong sits in its own
            face-down group — so the only note left is the one case the tiles
            cannot resolve: the right number of tiles that are not a hand. */}
        {complete && !readable && (
          <p class="chipnote chipnote--warn">{notAHandWhy()}</p>
        )}

        <button type="button" class="bonusheld" disabled={focus} onClick={() => setTab('bonus')}>
          {hand.bonus.length > 0
            ? hand.bonus.map((b) => (
              <span class="bonusheld__x" key={b}>{t(`tile.bonus.${b}`)}</span>
            ))
            : (
              /* Built from the variant's OWN bonus groups. As a fixed string
                 it said "Flowers, seasons, animals" on a Hong Kong table,
                 which is the Run 4 leakage bug in words instead of tiles. */
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
            {/* The seat badge on a bonus tile is a NUMBER, so the hint says
                so. It has its own key because the app that used to sit at /
                drew a letter there and shared this bundle — the third time in
                Run 5 that one string served two screens badly. */}
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
                : t('hand.needTiles', { n: shownTarget - hand.concealed.length })}
          </button>
        </div>
      </div>
    </div>
  )
}

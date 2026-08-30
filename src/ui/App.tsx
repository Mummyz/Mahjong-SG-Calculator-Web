import { useEffect, useRef, useState } from 'preact/hooks'
import { t } from '../i18n'
import { VariantSelect } from './screens/VariantSelect'
import { TileInfo } from './screens/TileInfo'
import { TableSetup, type Money } from './screens/TableSetup'
import { HandEntry, EMPTY_HAND, type HandState } from './screens/HandEntry'
import { Results } from './screens/Results'
import { Sheet } from './components/Sheet'
import {
  advanceTable, newTable, yourSeat, type TableState,
} from '../engine/variants/singapore/table'
import './app.css'
import './tile.css'

type Screen = 'variant' | 'tileinfo' | 'setup' | 'hand' | 'result'
const SCREENS: Screen[] = ['variant', 'tileinfo', 'setup', 'hand', 'result']

const DEFAULT_MONEY: Money = { stake: 0.5, limit: 5 }
const defaultTable = (): TableState =>
  newTable([1, 2, 3, 4].map((n) => t('table.playerN', { n })), 0, 0)

interface Saved {
  /** False until the player has been through setup for this table. */
  started: boolean
  screen: Screen
  table: TableState
  money: Money
  hand: HandState
  infoOrigin: Screen
  setupOrigin: Screen
}

const KEY = 'mahjongyuk.table'

/**
 * A hand takes a couple of dozen taps and a table lasts all evening, so the
 * whole session is mirrored to sessionStorage and every screen gets a history
 * entry. Anything unrecognised is discarded rather than half-restored.
 */
const restore = (): Saved | null => {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<Saved>
    if (!v.screen || !SCREENS.includes(v.screen)) return null
    if (!v.table || !Array.isArray(v.table.players) || v.table.players.length !== 4) return null
    if (!v.money || !v.hand || !Array.isArray(v.hand.concealed) || !Array.isArray(v.hand.log)) {
      return null
    }
    return v as Saved
  } catch {
    return null
  }
}

export function App() {
  const saved = restore()
  const [screen, setScreenState] = useState<Screen>(saved?.screen ?? 'variant')
  const [table, setTable] = useState<TableState>(saved?.table ?? defaultTable())
  const [money, setMoney] = useState<Money>(saved?.money ?? DEFAULT_MONEY)
  const [hand, setHandState] = useState<HandState>(saved?.hand ?? EMPTY_HAND)
  const [infoOrigin, setInfoOrigin] = useState<Screen>(saved?.infoOrigin ?? 'variant')
  const [setupOrigin, setSetupOrigin] = useState<Screen>(saved?.setupOrigin ?? 'tileinfo')
  const [menu, setMenu] = useState(false)
  const [whoWon, setWhoWon] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  const [started, setStarted] = useState(saved?.started ?? false)

  const go = (next: Screen, replace = false) => {
    setScreenState(next)
    try {
      if (replace) history.replaceState({ screen: next }, '')
      else history.pushState({ screen: next }, '')
    } catch { /* ignore */ }
  }

  const startedRef = useRef(started)
  startedRef.current = started

  useEffect(() => {
    try { history.replaceState({ screen }, '') } catch { /* ignore */ }
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { screen?: Screen } | null)?.screen
      if (!s) return
      // Back must never walk into a hand belonging to a table that was cleared.
      if ((s === 'hand' || s === 'result') && !startedRef.current) {
        setScreenState('variant')
        return
      }
      setScreenState(s)
    }
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY,
        JSON.stringify({ started, screen, table, money, hand, infoOrigin, setupOrigin }))
    } catch { /* private mode, quota — the app works, it just forgets */ }
  }, [started, screen, table, money, hand, infoOrigin, setupOrigin])

  const patchTable = (p: Partial<TableState>) => setTable((s) => ({ ...s, ...p }))
  const patchMoney = (p: Partial<Money>) => setMoney((s) => ({ ...s, ...p }))
  const patchHand = (p: Partial<HandState>) => setHandState((s) => ({ ...s, ...p }))

  const closeMenu = () => { setMenu(false); setWhoWon(false); setConfirmNew(false) }

  /** Move the table on without scoring — someone else won, or nobody did. */
  const passHand = (winnerIndex: number | null) => {
    setTable((s) => advanceTable(s, winnerIndex))
    setHandState(EMPTY_HAND)
    closeMenu()
    go('hand', true)
  }

  const menuSheet = menu && (
    <Sheet title={whoWon ? t('menu.whoWon') : t('menu.title')} onClose={closeMenu}>
      {whoWon ? (
        <div class="menulist">
          {table.players.map((_, i) => i).filter((i) => i !== table.youIndex).map((i) => (
            <button type="button" class="menuitem" key={i} onClick={() => passHand(i)}>
              <span class="menuitem__k">
                {table.players[i] || t('table.playerN', { n: i + 1 })}
              </span>
            </button>
          ))}
          <button type="button" class="menuitem" onClick={() => passHand(null)}>
            <span class="menuitem__k">{t('menu.washout')}</span>
          </button>
        </div>
      ) : (
        <div class="menulist">
          <button type="button" class="menuitem"
            onClick={() => { setInfoOrigin('hand'); closeMenu(); go('tileinfo') }}>
            <span class="menuitem__k">{t('menu.tileset')}</span>
            <span class="menuitem__s">{t('menu.tilesetSub')}</span>
          </button>
          <button type="button" class="menuitem"
            onClick={() => { setSetupOrigin('hand'); closeMenu(); go('setup') }}>
            <span class="menuitem__k">{t('menu.settings')}</span>
            <span class="menuitem__s">{t('menu.settingsSub')}</span>
          </button>
          <button type="button" class="menuitem" onClick={() => setWhoWon(true)}>
            <span class="menuitem__k">{t('menu.notMyHand')}</span>
            <span class="menuitem__s">{t('menu.notMyHandSub')}</span>
          </button>
          <button type="button" class="menuitem menuitem--danger"
            aria-pressed={confirmNew ? 'true' : 'false'}
            onClick={() => {
              if (!confirmNew) {
                setConfirmNew(true)
                window.setTimeout(() => setConfirmNew(false), 4000)
                return
              }
              try { localStorage.removeItem(KEY) } catch { /* ignore */ }
              setTable(defaultTable()); setMoney(DEFAULT_MONEY); setHandState(EMPTY_HAND)
              setStarted(false); closeMenu(); go('variant', true)
            }}>
            <span class="menuitem__k">
              {confirmNew ? t('menu.newTableConfirm') : t('menu.newTable')}
            </span>
            <span class="menuitem__s">{t('menu.newTableSub')}</span>
          </button>
        </div>
      )}
    </Sheet>
  )

  switch (screen) {
    case 'variant':
      return <VariantSelect onPick={() => { setInfoOrigin('variant'); go('tileinfo') }} />

    case 'tileinfo':
      return (
        <TileInfo seat={yourSeat(table)} fromHand={infoOrigin === 'hand'}
          onBack={() => go(infoOrigin)}
          onContinue={() => {
            if (infoOrigin === 'hand') { go('hand'); return }
            setSetupOrigin('tileinfo'); go('setup')
          }} />
      )

    case 'setup':
      return (
        <TableSetup table={table} money={money} onTable={patchTable} onMoney={patchMoney}
          firstRun={setupOrigin !== 'hand'}
          onDone={() => { setStarted(true); go('hand') }} />
      )

    case 'hand':
      return (
        <>
          <HandEntry table={table} stake={money.stake} limit={money.limit}
            hand={hand} setHand={patchHand}
            onMenu={() => setMenu(true)} onScore={() => go('result')} />
          {menuSheet}
        </>
      )

    case 'result':
      return (
        <Results table={table} stake={money.stake} limit={money.limit} hand={hand}
          onEdit={() => go('hand')}
          onNext={() => {
            // You are the winner of the hand you just scored, so the table
            // advances on that — dealer keeps the deal, everyone else passes it.
            setTable((s) => advanceTable(s, s.youIndex))
            setHandState(EMPTY_HAND)
            go('hand', true)
          }} />
      )
  }
}

import { useEffect, useRef, useState } from 'preact/hooks'
import { t, tv } from '../i18n'
import { useLocale } from '../i18n/useLocale'
import { LanguageToggle } from './components/LanguageToggle'
import { VariantSelect } from './screens/VariantSelect'
import { TileInfo } from './screens/TileInfo'
import { TableSetup, type Money } from './screens/TableSetup'
import { HandEntry, EMPTY_HAND, type HandState } from './screens/HandEntry'
import { Results } from './screens/Results'
import { Sheet } from './components/Sheet'
import { usePredictionPanel } from './components/Prediction'
import { SubmitWizard } from './components/SubmitWizard'
import {
  advanceTable, concealedKongs, newTable, submissionMatchesHand, yourSeat,
  type TableState, type WinSubmission,
} from '../engine/session/table'
import type { WinFlag } from '../engine/core/variant'
import { VARIANTS, isVariantId, keepPlayable, type VariantId } from '../engine/variants'
import './app.css'
import './tile.css'

type Screen = 'variant' | 'tileinfo' | 'setup' | 'hand' | 'result'
const SCREENS: Screen[] = ['variant', 'tileinfo', 'setup', 'hand', 'result']

/**
 * Opening money settings per variant. The limit is each variant's own default
 * ruling — Singapore R14, Hong Kong HK3 — and the stake is scaled to the size
 * of that variant's published points table, so a hand costs a plausible amount
 * before anyone touches the settings.
 */
const DEFAULT_MONEY: Record<VariantId, Money> = {
  singapore: { stake: 1, limit: VARIANTS.singapore.defaults.limit, halfPayment: false },
  hongkong: { stake: 1, limit: VARIANTS.hongkong.defaults.limit, halfPayment: false },
}
const defaultTable = (): TableState =>
  newTable([1, 2, 3, 4].map((n) => t('table.playerN', { n })), 0, 0)

interface Saved {
  /** False until the player has been through setup for this table. */
  started: boolean
  variant: VariantId
  screen: Screen
  table: TableState
  money: Money
  hand: HandState
  submission: WinSubmission | null
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
    if (!isVariantId(v.variant)) return null
    if (typeof v.money.halfPayment !== 'boolean') return null
    // A stored hand can outlive a change of game — a tray of animals restored
    // onto a Hong Kong table would be unscoreable. Drop what this variant
    // does not play rather than restoring a hand that cannot win.
    const plugin = VARIANTS[v.variant]
    const bonus = keepPlayable(plugin, (v.hand.bonus ?? []) as string[])
    const concealed = keepPlayable(plugin, (v.hand.concealed ?? []) as string[])
    if (bonus.length !== (v.hand.bonus ?? []).length
      || concealed.length !== (v.hand.concealed ?? []).length) {
      return { ...v, hand: { ...v.hand, bonus, concealed }, submission: null } as Saved
    }
    return v as Saved
  } catch {
    return null
  }
}

export function App() {
  const saved = restore()
  const [screen, setScreenState] = useState<Screen>(saved?.screen ?? 'variant')
  const [variant, setVariant] = useState<VariantId>(saved?.variant ?? 'singapore')
  const [table, setTable] = useState<TableState>(saved?.table ?? defaultTable())
  const [money, setMoney] = useState<Money>(saved?.money ?? DEFAULT_MONEY.singapore)
  const [hand, setHandState] = useState<HandState>(saved?.hand ?? EMPTY_HAND)
  const [infoOrigin, setInfoOrigin] = useState<Screen>(saved?.infoOrigin ?? 'variant')
  const [setupOrigin, setSetupOrigin] = useState<Screen>(saved?.setupOrigin ?? 'tileinfo')
  const [menu, setMenu] = useState(false)
  const [whoWon, setWhoWon] = useState(false)
  const [confirmNew, setConfirmNew] = useState(false)
  /** Which who-won row is armed. advanceTable has no inverse, so it is armed. */
  const [confirmPass, setConfirmPass] = useState<number | 'washout' | null>(null)
  const [wizard, setWizard] = useState(false)
  const wizardRef = useRef(false)
  wizardRef.current = wizard
  const [submission, setSubmission] = useState<WinSubmission | null>(saved?.submission ?? null)
  const [explain, setExplain] = useState<WinFlag | 'pao' | null>(null)
  const [started, setStarted] = useState(saved?.started ?? false)
  const [predictOpen, togglePredict] = usePredictionPanel()
  // Subscribing here is what makes a language change instant: the whole tree
  // re-renders, and the hand being keyed stays exactly where it was.
  useLocale()

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
      // Back closes the wizard first: it is a layer over hand entry, and
      // leaving the screen underneath it open would reopen it on the way
      // forward again.
      if (wizardRef.current) {
        setWizard(false)
        try { history.pushState({ screen: 'hand' }, '') } catch { /* ignore */ }
        return
      }
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
        JSON.stringify({
          started, variant, screen, table, money, hand, submission, infoOrigin, setupOrigin,
        }))
    } catch { /* private mode, quota — the app works, it just forgets */ }
  }, [started, variant, screen, table, money, hand, submission, infoOrigin, setupOrigin])

  const patchTable = (p: Partial<TableState>) => setTable((s) => ({ ...s, ...p }))
  const patchMoney = (p: Partial<Money>) => setMoney((s) => ({ ...s, ...p }))
  const patchHand = (p: Partial<HandState>) => {
    // Any change to the tiles throws away the win context. This is the guard
    // against the Run 2B bug class — see submissionMatchesHand.
    setSubmission(null)
    setHandState((s) => ({ ...s, ...p }))
  }

  const closeMenu = () => {
    setMenu(false); setWhoWon(false); setConfirmNew(false); setConfirmPass(null)
  }

  /** Move the table on without scoring — someone else won, or nobody did. */
  const passHand = (winnerIndex: number | null) => {
    setTable((s) => advanceTable(s, winnerIndex))
    setHandState(EMPTY_HAND); setSubmission(null)
    closeMenu()
    go('hand', true)
  }

  /**
   * Moving the deal on throws away a hand that took a couple of dozen taps and
   * rotates seats that cannot be rotated back — TableSetup locks the dealer
   * once the table has started. Every cheaper destructive action in the app
   * already asks twice; this is the expensive one.
   */
  const arm = (who: number | 'washout') => {
    if (confirmPass !== who) {
      setConfirmPass(who)
      window.setTimeout(() => setConfirmPass(null), 4000)
      return
    }
    passHand(who === 'washout' ? null : who)
  }

  const menuSheet = menu && (
    <Sheet title={whoWon ? t('menu.whoWon') : t('menu.title')} onClose={closeMenu}>
      {whoWon ? (
        <div class="menulist">
          {table.players.map((_, i) => i).filter((i) => i !== table.youIndex).map((i) => (
            <button type="button" class="menuitem" key={i}
              aria-pressed={confirmPass === i ? 'true' : 'false'}
              onClick={() => arm(i)}>
              <span class="menuitem__k">
                {table.players[i] || t('table.playerN', { n: i + 1 })}
              </span>
              {confirmPass === i && (
                <span class="menuitem__s">{t('hand.whoWonConfirm')}</span>
              )}
            </button>
          ))}
          <button type="button" class="menuitem"
            aria-pressed={confirmPass === 'washout' ? 'true' : 'false'}
            onClick={() => arm('washout')}>
            <span class="menuitem__k">{t('menu.washout')}</span>
            {confirmPass === 'washout' && (
              <span class="menuitem__s">{t('hand.whoWonConfirm')}</span>
            )}
          </button>
        </div>
      ) : (
        <div class="menulist">
          <button type="button" class="menuitem"
            onClick={() => { setInfoOrigin('hand'); closeMenu(); go('tileinfo') }}>
            <span class="menuitem__k">{t('menu.tileset')}</span>
            <span class="menuitem__s">{t('menu.tilesetSub')}</span>
          </button>
          <div class="menuitem menuitem--inert">
            <span class="menuitem__k">{t('menu.language')}</span>
            <LanguageToggle compact />
          </div>
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
              setTable(defaultTable()); setMoney(DEFAULT_MONEY.singapore)
              setHandState(EMPTY_HAND)
              setSubmission(null); setStarted(false); closeMenu(); go('variant', true)
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
      return (
        <VariantSelect onPick={(v) => {
          // Picking a variant starts that variant's session: its own tile set,
          // its own limit, its own money. Nothing carries over from the other.
          if (v !== variant) { setMoney(DEFAULT_MONEY[v]); setHandState(EMPTY_HAND) }
          setVariant(v); setSubmission(null); setInfoOrigin('variant'); go('tileinfo')
        }} />
      )

    case 'tileinfo':
      return (
        <TileInfo variant={variant} seat={yourSeat(table)} fromHand={infoOrigin === 'hand'}
          onBack={() => go(infoOrigin)}
          onContinue={() => {
            if (infoOrigin === 'hand') { go('hand'); return }
            setSetupOrigin('tileinfo'); go('setup')
          }} />
      )

    case 'setup':
      return (
        <TableSetup variant={variant} table={table} money={money}
          onTable={patchTable} onMoney={patchMoney}
          firstRun={!started}
          onDone={() => { setStarted(true); go('hand') }} />
      )

    case 'hand':
      return (
        <>
          <HandEntry variant={variant} table={table} stake={money.stake} limit={money.limit}
            halfPayment={money.halfPayment}
            predictOpen={predictOpen} onPredictToggle={togglePredict}
            hand={hand} setHand={patchHand}
            onMenu={() => setMenu(true)}
            onScore={() => {
              setWizard(true)
              try { history.pushState({ screen: 'hand' }, '') } catch { /* ignore */ }
            }} />
          {menuSheet}
          {wizard && (
            <SubmitWizard variant={variant} table={table}
              // Every concealed tile, not a filtered subset. Stripping the
              // tiles held four times over hid the winning tile itself on
              // hands like Nine Gates, and the engine's own guard is only
              // `concealed.includes(winningTile)`.
              loose={hand.concealed} melds={hand.melds}
              kongCount={hand.melds.filter((m) => m.t === 'kong').length
                + concealedKongs(hand.concealed).length}
              onCancel={() => setWizard(false)}
              onExplain={setExplain}
              onSubmit={(s) => { setSubmission(s); setWizard(false); go('result') }} />
          )}
          {explain && (
            <Sheet title={t(`flag.${explain}`)} onClose={() => setExplain(null)}>
              {/* The explainers are variant rules, not general facts: Singapore
                  refuses the last-tile point off a replacement (TT) and Hong
                  Kong pays it (HK22). tv() picks the right one. */}
              <p>{tv(variant, `flag.${explain}.detail`)}</p>
            </Sheet>
          )}
        </>
      )

    case 'result':
      // A submission that no longer describes the hand is not shown at all.
      if (!submissionMatchesHand(hand, submission)) { go('hand', true); return null }
      return (
        <Results variant={variant} table={table} stake={money.stake} limit={money.limit}
          halfPayment={money.halfPayment} hand={hand}
          predictOpen={predictOpen} onPredictToggle={togglePredict}
          submission={submission!}
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

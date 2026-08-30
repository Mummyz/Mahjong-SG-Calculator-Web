import { useEffect, useState } from 'preact/hooks'
import { t } from '../i18n'
import { VariantSelect } from './screens/VariantSelect'
import { TileInfo } from './screens/TileInfo'
import { Setup, type GameSettings } from './screens/Setup'
import { HandEntry, EMPTY_HAND, type HandState } from './screens/HandEntry'
import { Results } from './screens/Results'
import './app.css'
import './tile.css'

type Screen = 'variant' | 'tileinfo' | 'setup' | 'hand' | 'result'

const DEFAULT_GAME: GameSettings = { seat: 'E', prevailing: 'E', stake: 0.5, limit: 5 }

interface Saved {
  screen: Screen
  game: GameSettings
  hand: HandState
  infoOrigin: Screen
  setupReturn: Screen
}

const KEY = 'mahjongyuk.v2'

/**
 * A hand takes a couple of dozen taps to key in. Losing it to a locked phone,
 * a reload, or a stray back-swipe is not acceptable at a table, so the whole
 * session is mirrored to sessionStorage and every screen gets a history entry.
 */
const SCREENS: Screen[] = ['variant', 'tileinfo', 'setup', 'hand', 'result']

const restore = (): Saved | null => {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const v = JSON.parse(raw) as Partial<Saved>
    // A session written by an older build may not match this shape. Anything
    // unrecognised is discarded rather than rendered as a blank screen.
    if (!v.screen || !SCREENS.includes(v.screen)) return null
    if (!v.game || !v.hand || !Array.isArray(v.hand.concealed)
        || !Array.isArray(v.hand.log)) return null
    return v as Saved
  } catch {
    return null
  }
}

export function App() {
  const saved = restore()
  const [screen, setScreenState] = useState<Screen>(saved?.screen ?? 'variant')
  const [game, setGame] = useState<GameSettings>(saved?.game ?? DEFAULT_GAME)
  const [hand, setHandState] = useState<HandState>(saved?.hand ?? EMPTY_HAND)
  const [infoOrigin, setInfoOrigin] = useState<Screen>(saved?.infoOrigin ?? 'variant')
  const [setupReturn, setSetupReturn] = useState<Screen>(saved?.setupReturn ?? 'hand')
  const [freshHand, setFreshHand] = useState(false)

  const go = (next: Screen, replace = false) => {
    setScreenState(next)
    try {
      if (replace) history.replaceState({ screen: next }, '')
      else history.pushState({ screen: next }, '')
    } catch { /* ignore */ }
  }

  useEffect(() => {
    try { history.replaceState({ screen }, '') } catch { /* ignore */ }
    const onPop = (e: PopStateEvent) => {
      const s = (e.state as { screen?: Screen } | null)?.screen
      if (s) setScreenState(s)
    }
    addEventListener('popstate', onPop)
    return () => removeEventListener('popstate', onPop)
    // Runs once: the listener reads its screen from the history entry itself.
  }, [])

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify({ screen, game, hand, infoOrigin, setupReturn }))
    } catch { /* private mode, quota — the app still works, it just forgets */ }
  }, [screen, game, hand, infoOrigin, setupReturn])

  const patchGame = (patch: Partial<GameSettings>) => setGame((g) => ({ ...g, ...patch }))
  const patchHand = (patch: Partial<HandState>) => setHandState((h) => ({ ...h, ...patch }))

  switch (screen) {
    case 'variant':
      return <VariantSelect onPick={() => { setInfoOrigin('variant'); go('tileinfo') }} />

    case 'tileinfo':
      return (
        <TileInfo seat={game.seat} fromHand={infoOrigin === 'hand'}
          onBack={() => go(infoOrigin)}
          onContinue={() => {
            if (infoOrigin === 'hand') { go('hand'); return }
            setSetupReturn('hand'); setFreshHand(false); go('setup')
          }} />
      )

    case 'setup':
      return (
        <Setup value={game} onChange={patchGame}
          singleLabel={
            setupReturn === 'hand' && !freshHand && hand.concealed.length > 0
              ? t('nav.backToHand')
              : freshHand ? t('nav.continue') : undefined
          }
          onBack={() => go('tileinfo')}
          onContinue={() => { setFreshHand(false); go('hand') }} />
      )

    case 'hand':
      return (
        <HandEntry game={game} hand={hand} setHand={patchHand}
          onBack={() => { setSetupReturn('hand'); setFreshHand(false); go('setup') }}
          onInfo={() => { setInfoOrigin('hand'); go('tileinfo') }}
          onScore={() => go('result')} />
      )

    case 'result':
      return (
        <Results game={game} hand={hand}
          onEdit={() => go('hand')}
          onNext={() => {
            // The deal usually passes, so the seat is re-confirmed before the
            // next hand rather than silently carried over.
            setHandState(EMPTY_HAND)
            setSetupReturn('hand')
            setFreshHand(true)
            // Replace, so Back cannot return to a settlement whose hand is gone.
            go('setup', true)
          }} />
      )
  }
}

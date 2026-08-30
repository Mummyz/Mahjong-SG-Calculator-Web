import { useEffect, useRef, useState } from 'preact/hooks'
import { t, tv } from '../../i18n'
import { Tile } from './Tile'
import type { TileId } from '../../engine/core/tiles'
import type { MeldInput } from '../../engine/core/hand'
import type { WinFlag } from '../../engine/core/variant'
import type { TableState, WinSubmission } from '../../engine/session/table'
import type { VariantId } from '../../engine/variants'

/**
 * The win context is collected here, at submit time, and nowhere else.
 *
 * Run 2B marked the winning tile on the tray as soon as the hand looked
 * complete, and that mark outlived the tiles — undo the pair and the mark
 * stayed. Asking only once the tiles are proven complete, and throwing the
 * answers away if the hand changes, makes that whole bug class unreachable.
 */

const SELF_DRAW_ONLY: WinFlag[] = ['kongReplacement', 'flowerReplacement', 'heavenly', 'kongOnKong']
const DISCARD_ONLY: WinFlag[] = ['robbingKong', 'humanly']
const ALWAYS: WinFlag[] = ['lastTile', 'earthly']

/**
 * Circumstances that cannot change the score in a variant are not offered.
 * Hong Kong pays nothing for a flower replacement — RULING HK15, 「補花後不算」 —
 * so asking about it would be asking a question with no consequence.
 */
const IRRELEVANT: Record<VariantId, readonly WinFlag[]> = {
  singapore: [],
  hongkong: ['flowerReplacement'],
}

export function SubmitWizard({
  variant, table, loose, melds, kongCount, onCancel, onSubmit, onExplain,
}: {
  variant: VariantId
  table: TableState
  /**
   * Every concealed tile, unfiltered. The winning tile is by definition one
   * the player is holding, and it can be the fourth copy of something.
   */
  loose: readonly TileId[]
  /** Claimed melds, shown so step 1 really is "the completed hand". */
  melds: readonly MeldInput[]
  kongCount: number
  onCancel: () => void
  onSubmit: (s: WinSubmission) => void
  onExplain: (f: WinFlag | 'pao') => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const dialog = useRef<HTMLDivElement>(null)

  // Same behaviour as the Sheet next door: the dialog takes focus and Escape
  // closes it, so opening the wizard does not strand a screen reader outside.
  useEffect(() => {
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onCancel])
  const [winningTile, setWinningTile] = useState<TileId | null>(null)
  const [win, setWin] = useState<'selfDraw' | 'discard' | null>(null)
  const [discarderIndex, setDiscarderIndex] = useState<number | null>(null)
  const [flags, setFlags] = useState<WinFlag[]>([])
  const [pao, setPao] = useState(false)

  const nameOf = (i: number) => table.players[i] || t('table.playerN', { n: i + 1 })
  const others = table.players.map((_, i) => i).filter((i) => i !== table.youIndex)
  const dealer = table.dealerIndex === table.youIndex

  const chooseWin = (w: 'selfDraw' | 'discard', d: number | null) => {
    setWin(w); setDiscarderIndex(d)
    // Circumstances that contradict the answer just given cannot survive it.
    const allowed = (w === 'selfDraw' ? [...ALWAYS, ...SELF_DRAW_ONLY] : [...ALWAYS, ...DISCARD_ONLY])
      .filter((x) => !IRRELEVANT[variant].includes(x))
    setFlags((f) => f.filter((x) => allowed.includes(x)))
    if (w === 'selfDraw') setPao(false)
  }

  const available: WinFlag[] = win === null
    ? []
    : [...ALWAYS, ...(win === 'selfDraw' ? SELF_DRAW_ONLY : DISCARD_ONLY)].filter((f) => {
      if (f === 'heavenly') return dealer
      if (f === 'earthly' || f === 'humanly') return !dealer
      if (f === 'kongOnKong') return kongCount >= 2
      return !IRRELEVANT[variant].includes(f)
    })

  const winKnown = win === 'selfDraw' || (win === 'discard' && discarderIndex !== null)
  const canFinish = winningTile !== null && winKnown

  return (
    <div class="sheet__scrim" onClick={onCancel}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={t('wizard.title')}
        ref={dialog} tabIndex={-1}
        onClick={(e) => e.stopPropagation()}>
        <p class="wizard__step">{t('wizard.step', { n: step })}</p>

        {step === 1 ? (
          <>
            <h2 class="sheet__title">{t('wizard.whichTile')}</h2>
            <p class="sub" style="margin:0">{t('wizard.whichTileSub')}</p>
            <div class="grid grid--7">
              {loose.map((id, i) => (
                <Tile key={`${id}-${i}`} id={id} mini
                  selected={winningTile === id}
                  onClick={() => setWinningTile(id)} />
              ))}
            </div>
            {melds.length > 0 && (
              <>
                <p class="sub" style="margin:0">{t('wizard.melded')}</p>
                <div class="wizard__melds">
                  {melds.map((m, i) => (
                    <div class="tray__group tray__group--exposed" key={`m${i}`}>
                      <div class="tray__tiles">
                        {m.tiles.trim().split(/\s+/).map((id, j) => (
                          <Tile key={j} id={id} mini />
                        ))}
                      </div>
                      <span class="tray__tag">
                        {t(`hand.tag${m.t[0]!.toUpperCase()}${m.t.slice(1)}`)}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div class="dock__row">
              <button type="button" class="btn btn--ghost" onClick={onCancel}>
                {t('wizard.cancel')}
              </button>
              <button type="button" class="btn btn--primary btn--block"
                disabled={winningTile === null} onClick={() => setStep(2)}>
                {t('wizard.next')}
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 class="sheet__title">{t('wizard.howWon')}</h2>
            <p class="sub" style="margin:0">{t('wizard.howWonSub')}</p>
            <div class="wingrid" role="radiogroup" aria-label={t('wizard.howWon')}>
              <button type="button" class="wingrid__opt" role="radio"
                aria-checked={win === 'selfDraw' ? 'true' : 'false'}
                onClick={() => chooseWin('selfDraw', null)}>{t('hand.selfDrew')}</button>
              {others.map((i) => (
                <button type="button" key={i} class="wingrid__opt" role="radio"
                  aria-checked={win === 'discard' && discarderIndex === i ? 'true' : 'false'}
                  onClick={() => chooseWin('discard', i)}>
                  {t('hand.threwIt', { name: nameOf(i) })}
                </button>
              ))}
            </div>

            {win !== null && (
              <>
                <h2 class="sheet__title">{t('wizard.unusual')}</h2>
                <p class="sub" style="margin:0">{t('wizard.unusualSub')}</p>
                <div class="wizard__flags">
                  {available.map((f) => (
                    <div class="unusual" key={f}>
                      <button type="button" class="unusual__pick"
                        aria-pressed={flags.includes(f) ? 'true' : 'false'}
                        onClick={() => setFlags((x) =>
                          x.includes(f) ? x.filter((y) => y !== f) : [...x, f])}>
                        <span class="unusual__name">{t(`flag.${f}`)}</span>
                        <span class="unusual__sub">{tv(variant, `flag.${f}.sub`)}</span>
                      </button>
                      <button type="button" class="unusual__why" onClick={() => onExplain(f)}
                        aria-label={t('hand.whatsThis')}>?</button>
                    </div>
                  ))}
                  {win === 'discard' && (
                    <div class="unusual">
                      <button type="button" class="unusual__pick"
                        aria-pressed={pao ? 'true' : 'false'}
                        onClick={() => setPao((p) => !p)}>
                        <span class="unusual__name">{t('flag.pao')}</span>
                        <span class="unusual__sub">{t('flag.pao.sub')}</span>
                      </button>
                      <button type="button" class="unusual__why" onClick={() => onExplain('pao')}
                        aria-label={t('hand.whatsThis')}>?</button>
                    </div>
                  )}
                </div>
              </>
            )}

            <div class="dock__row">
              <button type="button" class="btn btn--ghost" onClick={() => setStep(1)}>
                {t('wizard.back')}
              </button>
              <button type="button" class="btn btn--primary btn--block" disabled={!canFinish}
                onClick={() => onSubmit({
                  winningTile: winningTile!, win: win!, discarderIndex, flags, pao,
                })}>
                {t('wizard.finish')}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'preact/hooks'
import { t } from '../../i18n'
import { Tile } from './Tile'
import { fanBounds, seatWindOf, type TableState } from '../../engine/session/table'
import { VARIANTS, type VariantId } from '../../engine/variants'
import type { RuleOptions } from '../../engine/core/variant'

/**
 * A HAND SOMEBODY ELSE WON.
 *
 * "Someone else won this one" used to move the deal on and no money at all.
 * That made the running total a record of the hands this player happened to
 * win rather than of the night — and losing off your own discard, the most
 * expensive thing that can happen to you at a table, cost nothing.
 *
 * Three questions, in the order the table answers them out loud: who won, how
 * they won, and what it was worth. The app never sees the winner's tiles, so
 * the fan is entered rather than derived — bounded by the variant's own
 * minimum and the limit this table agreed, because nothing outside that range
 * is a hand anybody could have won.
 */
export interface LostHandAnswer {
  winnerIndex: number
  /** null on a self-draw. May be the player themselves. */
  discarderIndex: number | null
  fan: number
}

export function LostHand({
  variant, table, opts, onCancel, onSubmit,
}: {
  variant: VariantId
  table: TableState
  opts: Partial<RuleOptions>
  onCancel: () => void
  onSubmit: (a: LostHandAnswer) => void
}) {
  const plugin = VARIANTS[variant]
  const { min, max } = fanBounds(plugin, opts)

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [winner, setWinner] = useState<number | null>(null)
  const [discarder, setDiscarder] = useState<number | null | undefined>(undefined)
  const [fan, setFan] = useState<number>(min)
  const dialog = useRef<HTMLDivElement>(null)

  // Same behaviour as the submit wizard next door: the dialog takes focus and
  // Escape closes it, so opening it does not strand a screen reader outside.
  useEffect(() => {
    dialog.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onCancel])

  const nameOf = (i: number) => table.players[i] || t('table.playerN', { n: i + 1 })
  const others = table.players.map((_, i) => i).filter((i) => i !== table.youIndex)
  /** Who could have thrown it: everyone except the winner. Me included. */
  const throwers = table.players.map((_, i) => i).filter((i) => i !== winner)

  const back = () => {
    if (step === 1) { onCancel(); return }
    setStep((s) => (s === 3 ? 2 : 1) as 1 | 2 | 3)
  }

  return (
    <div class="sheet__scrim" onClick={onCancel}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={t('lost.title')}
        tabIndex={-1} ref={dialog} onClick={(e) => e.stopPropagation()}>
        {/* Its OWN counter. wizard.step is "Step {n} of 2", written for
            the two-step submit wizard next door; this one has three. */}
        <p class="wizard__step">{t('lost.step', { n: step })}</p>

        {step === 1 && (
          <>
            <h2 class="sheet__title">{t('lost.whoWon')}</h2>
            <p class="sub" style="margin:0">{t('lost.whoWonSub')}</p>
            <div class="menulist">
              {others.map((i) => (
                <button type="button" class="menuitem" key={i}
                  aria-pressed={winner === i ? 'true' : 'false'}
                  onClick={() => {
                    setWinner(i)
                    // Changing the winner can invalidate a discarder already
                    // chosen — they cannot have thrown to themselves.
                    setDiscarder(undefined)
                    setStep(2)
                  }}>
                  <span class="seatcell">
                    <Tile id={seatWindOf(table, i)} small />
                    <span class="menuitem__k">{nameOf(i)}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 class="sheet__title">{t('lost.howWon')}</h2>
            <p class="sub" style="margin:0">
              {t('lost.howWonSub', { name: nameOf(winner!) })}
            </p>
            <div class="menulist">
              <button type="button" class="menuitem"
                aria-pressed={discarder === null ? 'true' : 'false'}
                onClick={() => { setDiscarder(null); setStep(3) }}>
                <span class="menuitem__k">{t('lost.selfDraw')}</span>
                <span class="menuitem__s">{t('lost.selfDrawSub', { name: nameOf(winner!) })}</span>
              </button>
              {/* EVERY player who could have thrown it, INCLUDING me. Losing
                  off your own discard is the case the old flow charged
                  nothing for, and in Hong Kong under full payment it is the
                  difference between paying nothing and paying all of it. */}
              {throwers.map((i) => (
                <button type="button" class="menuitem" key={i}
                  aria-pressed={discarder === i ? 'true' : 'false'}
                  onClick={() => { setDiscarder(i); setStep(3) }}>
                  <span class="menuitem__k">
                    {i === table.youIndex
                      ? t('lost.myDiscard')
                      : t('lost.theirDiscard', { name: nameOf(i) })}
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <h2 class="sheet__title">{t('lost.howMuch')}</h2>
            <p class="sub" style="margin:0">{t('lost.howMuchSub', { min, max })}</p>
            {/* A STEPPER, not a free text field. The range is small, the
                bounds are rules rather than validation, and a number pad on a
                phone is four taps to do what two do here. */}
            <div class="fanpick">
              <button type="button" class="fanpick__step" disabled={fan <= min}
                aria-label={t('lost.fanDown')}
                onClick={() => setFan((f) => Math.max(min, f - 1))}>−</button>
              <span class="fanpick__n" aria-live="polite">
                {t('result.fan', { n: fan })}
              </span>
              <button type="button" class="fanpick__step" disabled={fan >= max}
                aria-label={t('lost.fanUp')}
                onClick={() => setFan((f) => Math.min(max, f + 1))}>+</button>
            </div>
            <div class="fanrow" role="radiogroup" aria-label={t('lost.howMuch')}>
              {Array.from({ length: max - min + 1 }, (_, k) => min + k).map((n) => (
                <button type="button" key={n} class="fanchip" role="radio"
                  aria-checked={fan === n ? 'true' : 'false'}
                  onClick={() => setFan(n)}>{n}</button>
              ))}
            </div>
          </>
        )}

        <div class="dock__row">
          <button type="button" class="btn btn--ghost" onClick={back}>
            {step === 1 ? t('wizard.cancel') : t('wizard.back')}
          </button>
          {step === 3 && (
            <button type="button" class="btn btn--primary btn--block"
              onClick={() => onSubmit({
                winnerIndex: winner!,
                discarderIndex: discarder === undefined ? null : discarder,
                fan,
              })}>
              {t('lost.settle')}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

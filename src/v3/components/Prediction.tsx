import { useMemo, useState } from 'preact/hooks'
import { t, tv } from '../../i18n'
import { Tile, tileName } from './Tile'
import { Cuit } from './Brand'
import { predict, type Candidate } from '../../engine/predict'
import { candidateRequirements, type Requirement } from '../../engine/predict/requirements'
import { needLabel } from './needLabel'
import { isHandPattern } from '../../engine/patterns'
import { VARIANTS, type VariantId } from '../../engine/variants'
import type { KeyedHand } from '../../engine/session/table'
import type { RuleOptions, WinContext } from '../../engine/core/variant'
import type { TileId } from '../../engine/core/tiles'

/**
 * "What could this become?"
 *
 * Never blocks the main path: it is collapsed by default, it is below the
 * tray, and nothing in it is required to score a hand. Everything it says
 * comes from the prediction engine, which in turn had every suggestion
 * certified by the scorer — this component does no arithmetic of its own.
 */
/**
 * The shape each nudge is pointing at, drawn as ghosts. A card that names a
 * direction without showing one is a sentence in a box.
 */
/** Beyond this, a list of every missing tile is the wall, not a plan. */
const FAR = 6

/** The mark a generic requirement wears instead of a numbered face. */
export const SUIT_MARK: Record<string, string> = {
  m: '萬', p: '筒', s: '索', dragon: '箭', wind: '風', honour: '風箭', tile: '?',
}

const HINT_TILES: Record<string, TileId[]> = {
  'flush:m': ['1m', '5m', '9m'],
  'flush:p': ['1p', '5p', '9p'],
  'flush:s': ['1s', '5s', '9s'],
  honours: ['C', 'F', 'P'],
  allPong: ['5p', '5p', '5p'],
  terminals: ['1m', '9p', '1s'],
}

export function Prediction({
  variant, hand, ctx, rules, open, onToggle, frozen, ghost, onGhost,
}: {
  variant: VariantId
  hand: KeyedHand
  ctx: Pick<WinContext, 'seat' | 'prevailing'>
  rules: Partial<RuleOptions>
  open: boolean
  onToggle: () => void
  /** A meld is being declared: this panel is scenery like everything else. */
  frozen?: boolean
  /**
   * The candidate whose tiles are currently painted into the tray as ghosts,
   * by key — or null. PRESENTATION ONLY: see the guard in ghost.test.ts.
   */
  ghost?: string | null
  /** Show this candidate's REQUIREMENTS as ghost groups, or clear them. */
  onGhost?: (key: string | null, groups: Requirement[]) => void
}) {
  const p = useMemo(
    () => (open ? predict(VARIANTS[variant], hand, ctx, { rules }) : null),
    // The search is ~10ms, so it runs on every tile — but only while the
    // panel is actually open.
    [open, variant, hand.concealed.join(','), hand.melds.length, ctx.seat, ctx.prevailing,
     rules.limit, rules.minTai],
  )

  // No aria-live on this section: it holds forty-odd items and every tile tap
  // re-announced all of them.
  return (
    <section class="predict">
      <button type="button" class="predict__head" aria-expanded={open ? 'true' : 'false'}
        disabled={frozen} onClick={onToggle}>
        <span class="predict__title">{t('predict.title')}</span>
        {p && p.candidates.length > 0 && (
          <span class="predict__count">{p.candidates.length}</span>
        )}
        <span class="predict__toggle">{open ? t('predict.hide') : t('predict.show')}</span>
        <svg class="predict__chev" viewBox="0 0 20 20" aria-hidden="true" focusable="false">
          <path d="M5 8l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2.2"
            stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>

      {open && p && (
        <div class="predict__body">
          {p.state === 'empty' && (
            <div class="predict__cuit">
              <Cuit mood="idle" size={56} />
              <p class="predict__note">{t('predict.empty')}</p>
            </div>
          )}
          {p.state === 'complete' && <p class="predict__note">{t('predict.complete')}</p>}
          {p.state === 'won' && (
            <div class="predict__cuit">
              <Cuit mood="cheer" size={56} />
              <p class="predict__note">{t('predict.won')}</p>
            </div>
          )}
          {p.state === 'notAHand' && <p class="predict__note">{t('predict.notAHand')}</p>}

          {p.state === 'sparse' && (
            <>
              <div class="predict__cuit">
                <Cuit mood="think" size={56} />
                <p class="predict__note">{t('predict.sparse')}</p>
              </div>
              <ul class="predict__hints">
                {p.hints.map((h) => (
                  <li key={h.key} class="hint">
                    <p class="hint__name">{t(`predict.hint.${h.key}.name`)}</p>
                    <span class="hint__tiles" aria-hidden="true">
                      {(HINT_TILES[h.key] ?? []).map((x, i) => (
                        <Tile key={`${x}-${i}`} id={x} mini needed />
                      ))}
                    </span>
                    <p class="hint__why">{t(`predict.hint.${h.key}`)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}

          {p.state === 'candidates' && p.candidates.length === 0 && (
            <p class="predict__note">{t('predict.nothing')}</p>
          )}

          {p.candidates.map((c) => (
            <CandidateCard key={c.key} variant={variant} c={c} hand={hand}
              ctx={ctx} rules={rules} ghost={ghost} onGhost={onGhost} />
          ))}
        </div>
      )}
    </section>
  )
}

function CandidateCard({ variant, c, hand, ctx, rules, ghost, onGhost }: {
  variant: VariantId
  c: Candidate
  hand: KeyedHand
  ctx: Pick<WinContext, 'seat' | 'prevailing'>
  rules: Partial<RuleOptions>
  ghost?: string | null
  onGhost?: (key: string | null, groups: Requirement[]) => void
}) {
  /**
   * WHAT THIS PLAN REQUIRES, not one way of satisfying it. The card and the
   * tray read the same groups through the same labels, so they can never
   * describe the same plan differently.
   */
  const groups = useMemo(
    () => candidateRequirements(
      VARIANTS[variant], c.example,
      [...hand.concealed, ...hand.melds.flatMap((m) => m.tiles.trim().split(/\s+/))] as TileId[],
      // THE PLAYER'S OWN CONTEXT. Under a hardcoded East/East probe every plan
      // whose fan comes from the seat or prevailing wind fell below the
      // variant minimum and returned no requirements at all — an empty "You
      // need" list under a "Use this" button that painted nothing.
      { ...ctx, win: 'selfDraw' }, rules,
    ),
    [variant, c.key, hand.concealed.join(','), hand.melds.length,
     ctx.seat, ctx.prevailing, rules.limit, rules.minTai],
  )
  const names = [...new Set(c.patterns.filter(isHandPattern))]
  /**
   * A hand is not worth one number. Which of the missing tiles lands last, and
   * whether it is drawn or claimed, both change the answer — so the panel
   * shows the range the engine certified and names the condition, rather than
   * printing the best case and hoping.
   */
  const ranged = c.fan !== c.fanBest
  const partial = c.finishOn.length < c.needed.length
  // "<n> tiles away : <fan or range> Fan" — one figure, one line, no "worth".
  // The range is the engine's own floor and ceiling, not a guess.
  const fan = ranged ? `${c.fan}\u2013${c.fanBest}` : `${c.fan}`
  const badge = c.limitApplied
    ? t('predict.awayFanCapped', { n: c.away, fan })
    : t('predict.awayFan', { n: c.away, fan })

  return (
    <article class="card cand">
      <header class="cand__head">
        <h3 class="cand__name">
          {names.length > 0
            ? names.map((k) => tv(variant, `pattern.${k}`)).join(' + ')
            : t('predict.plain')}
        </h3>
        <p class="cand__meta"><span class="cand__fan">{badge}</span></p>
      </header>

      {(ranged || partial || !c.winsOnDiscard || c.bestWin === 'selfDraw') && (
        <p class="cand__caveat">
          {[
            partial ? t('predict.onlyIf', { tiles: c.finishOn.map(tileName).join(', ') }) : null,
            ranged ? t('predict.finishOn', { tile: tileName(c.bestTile) }) : null,
            // Two different conditions, and they must not be worded the same:
            // one is about how much the hand pays, the other about whether it
            // wins at all.
            !c.winsOnDiscard
              ? t('predict.selfDrawOnly')
              : c.bestWin === 'selfDraw' ? t('predict.selfDrawBest') : null,
          ].filter(Boolean).join(' ')}
        </p>
      )}

      {/* Past about half a hand away, naming every missing tile is a list of
          the wall rather than a plan. The direction and its worth are the
          information at that distance; the tiles become useful as it closes. */}
      {c.away <= FAR ? (
        <>
          <p class="cand__label">{t('predict.need')}</p>
          {/* REQUIREMENTS, not a shopping list of specific faces. A plan that
              needs "any pair in this suit" used to be drawn as two copies of
              whichever tile the search happened to reach for, which reads as
              an instruction to go and get that tile. */}
          <ul class="needlist">
            {groups.map((g, i) => (
              <li class="needchip" key={`${g.klass}-${g.shape}-${i}`}>
                {g.kind === 'specific'
                  ? <Tile id={g.tile} mini needed />
                  : <span class="needchip__mark" aria-hidden="true">
                      {SUIT_MARK[g.klass] ?? '?'}
                    </span>}
                <span class="needchip__t">{needLabel(g)}</span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p class="cand__label">{t('predict.stillFar', { n: c.away })}</p>
      )}

      {/* GHOSTS. The button hands the card's missing tiles to the tray to be
          drawn as outlines. It hands over a LIST OF TILES and nothing else:
          the hand model never learns they exist. */}
      {/* Only where the card actually names the tiles. Past FAR the body
          shows "still {n} away" instead of a tile list on purpose, and a
          button offering to paint that list contradicts it. */}
      {onGhost && c.needed.length > 0 && c.away <= FAR && (
        <div class="cand__use">
          <button type="button" class={`btn ${ghost === c.key ? '' : 'btn--ghost'}`}
            aria-pressed={ghost === c.key ? 'true' : 'false'}
            onClick={() => onGhost(
              ghost === c.key ? null : c.key,
              ghost === c.key ? [] : groups,
            )}>
            {ghost === c.key ? t('predict.useThisOff') : t('predict.useThis')}
          </button>
        </div>
      )}

      {c.discard.length > 0 && (
        <>
          <p class="cand__label">{t('predict.drop')}</p>
          <div class="cand__tiles cand__tiles--drop">
            {c.discard.map((d, i) => <Tile key={`${d}-${i}`} id={d} mini />)}
          </div>
        </>
      )}
    </article>
  )
}

/** Remembers whether the player wants the panel open, across hands. */
export function usePredictionPanel(): [boolean, () => void] {
  const KEY = 'mahjongyuk.predict'
  const [open, setOpen] = useState(() => {
    try { return localStorage.getItem(KEY) === '1' } catch { return false }
  })
  return [open, () => setOpen((v) => {
    try { localStorage.setItem(KEY, v ? '0' : '1') } catch { /* private mode */ }
    return !v
  })]
}

import { t } from '../../i18n'
import { VARIANTS, type VariantId } from '../../engine/variants'

const CJK: Record<VariantId, string> = { singapore: '新加坡', hongkong: '香港' }
const ORDER: VariantId[] = ['singapore', 'hongkong']

export function VariantSelect({ onPick }: { onPick: (v: VariantId) => void }) {
  return (
    <div class="shell">
      <div class="scroll" style="display:flex;flex-direction:column">
        <div class="masthead">
          <p class="masthead__name">{t('app.name')}</p>
          <p class="masthead__tag">{t('app.tagline')}</p>
        </div>
        <div class="pushdown" aria-hidden="true" />
        <h2 class="title">{t('variant.title')}</h2>
        <p class="sub">{t('variant.subtitle')}</p>

        {ORDER.map((id) => (
          <div key={id}>
            <button type="button" class="board board--live" onClick={() => onPick(id)}>
              <span class="board__cjk" aria-hidden="true">{CJK[id]}</span>
              <span class="board__name">{t(`variant.${id}.name`)}</span>
              <span class="board__n" aria-hidden="true">{VARIANTS[id].tileSet.total}</span>
              <span class="board__go">{t('variant.play')}</span>
            </button>
            <p class="sub board__blurb">{t(`variant.${id}.blurb`)}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

import { t } from '../../i18n'
import { singapore } from '../../engine/variants/singapore'

export function VariantSelect({ onPick }: { onPick: () => void }) {
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

        <button type="button" class="board board--live" onClick={onPick}>
          <span class="board__cjk" aria-hidden="true">新加坡</span>
          <span class="board__name">{t('variant.singapore.name')}</span>
          <span class="board__n" aria-hidden="true">{singapore.tileSet.total}</span>
          <span class="board__go">{t('variant.play')}</span>
        </button>
        <p class="sub board__blurb">{t('variant.singapore.blurb')}</p>

        <div class="board board--soon" aria-disabled="true">
          <span class="board__cjk" aria-hidden="true">香港</span>
          <span class="board__name">{t('variant.hongkong.name')}</span>
          <span class="board__n" aria-hidden="true">144</span>
          <span class="board__go">{t('variant.comingSoon')}</span>
        </div>
        <p class="sub board__blurb">{t('variant.hongkong.blurb')}</p>
      </div>
    </div>
  )
}

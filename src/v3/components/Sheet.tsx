import { useEffect, useRef } from 'preact/hooks'
import type { ComponentChildren } from 'preact'
import { t } from '../../i18n'

/**
 * A bottom sheet for the things that must not clutter the main path: the
 * table menu, and the plain-English explanation of a circumstance.
 */
export function Sheet({ title, onClose, children }: {
  title: string
  onClose: () => void
  children: ComponentChildren
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    ref.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div class="sheet__scrim" onClick={onClose}>
      <div class="sheet" role="dialog" aria-modal="true" aria-label={title}
        tabIndex={-1} ref={ref} onClick={(e) => e.stopPropagation()}>
        <h2 class="sheet__title">{title}</h2>
        <div class="sheet__body">{children}</div>
        <button type="button" class="btn btn--block" onClick={onClose}>
          {t('menu.close')}
        </button>
      </div>
    </div>
  )
}

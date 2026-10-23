import type { PhotoRecord } from '../../domain/photo'
import type { Preferences } from '../../domain/settings'
import { usePreview } from '../../application/use-preview'
import { useTranslation } from 'react-i18next'
export function FramePreview({ photo, preferences }: { photo: PhotoRecord | undefined; preferences: Preferences }) {
    const { ref, state, size } = usePreview(photo, preferences)
    const { t } = useTranslation()
    return (
        <div className={`frame-preview ${state === 'loading' ? 'is-loading' : ''}`} data-state={state}>
            <canvas ref={ref} aria-label={t('workspace.frameView')} data-width={size.width} data-height={size.height} />
            {state === 'loading' && (
                <div className="preview-status">
                    <span className="spinner" />
                    {t('workspace.loading')}
                </div>
            )}
            {state === 'error' && (
                <p role="alert" className="preview-error">
                    {t('photo.preview-error')}
                </p>
            )}
        </div>
    )
}

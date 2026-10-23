import { useTranslation } from 'react-i18next'
import { FiCheck, FiDroplet } from 'react-icons/fi'
import { BACKGROUND_PRESETS } from '../../engine/render/background'
import { useWorkspace } from '../../application/workspace'
import { Section, Button } from '../components/primitives'
export function BackgroundPanel() {
    const { photos, selectedId, applyRecipe } = useWorkspace()
    const photo = photos.find((p) => p.id === selectedId),
        { t } = useTranslation()
    if (!photo) return null
    return (
        <Section title={t('workspace.background')}>
            <p className="field-hint">{t('workspace.backgroundNote')}</p>
            <div className="swatch-grid">
                {BACKGROUND_PRESETS.map((preset) => (
                    <button
                        key={preset.id}
                        aria-label={t('photo.background-' + preset.id)}
                        title={t('photo.background-' + preset.id)}
                        aria-pressed={photo.background === preset.id}
                        className={photo.background === preset.id ? 'selected' : ''}
                        onClick={() => applyRecipe(photo.id, { background: preset.id })}
                    >
                        <span style={{ background: preset.color }}>
                            {photo.background === preset.id && (
                                <FiCheck
                                    style={{
                                        color: [
                                            'black',
                                            'navy',
                                            'teal',
                                            'charcoal',
                                            'slate',
                                            'olive',
                                            'burgundy',
                                            'terracotta',
                                        ].includes(preset.id)
                                            ? 'white'
                                            : 'black',
                                    }}
                                />
                            )}
                        </span>
                        <small>{t('photo.background-' + preset.id)}</small>
                    </button>
                ))}
            </div>
            <Button
                className={`blur-choice ${photo.background === 'blur' ? 'is-selected' : ''}`}
                onClick={() => applyRecipe(photo.id, { background: 'blur' })}
            >
                <span className="blur-thumb" style={{ backgroundImage: `url(${photo.thumbnail})` }} />
                <span>
                    <strong>{t('photo.background-blur')}</strong>
                    <small>{t('photo.background-blur-help')}</small>
                </span>
                <FiDroplet />
            </Button>
        </Section>
    )
}

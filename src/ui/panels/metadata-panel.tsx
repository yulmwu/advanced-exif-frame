import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '../../application/workspace'
import type { Metadata } from '../../domain/photo'
import { DATE_FORMATS } from '../../domain/photo'
import { Button, Field, NumberField, Section, Toggle } from '../components/primitives'
const fields: [keyof Metadata, string][] = [
    ['make', 'make'],
    ['model', 'model'],
    ['lensModel', 'lens'],
    ['focalLength', 'focal'],
    ['focalLengthIn35mm', 'focal35'],
    ['fNumber', 'aperture'],
    ['iso', 'iso'],
    ['exposureTime', 'shutter'],
    ['takenAt', 'taken'],
]
const labels: Record<string, string> = {
    make: 'make',
    model: 'model',
    lens: 'lens',
    focal: 'focal',
    focal35: 'focal-35mm',
    aperture: 'aperture',
    iso: 'iso',
    shutter: 'shutter',
    taken: 'taken-at',
}
export function MetadataPanel() {
    const s = useWorkspace(),
        p = s.preferences,
        photo = s.photos.find((p) => p.id === s.selectedId),
        { t } = useTranslation()
    const [presetName, setPresetName] = useState('')
    if (!photo) return null
    return (
        <>
            <Section title={t('workspace.selected')}>
                <div className="metadata-summary">
                    <span>{photo.metadata.make || '—'}</span>
                    <strong>{photo.metadata.model || t('workspace.noExif')}</strong>
                    <small>{photo.metadata.lensModel}</small>
                </div>
                {fields.map(([key, label]) => (
                    <Field key={key} label={t(labels[label])}>
                        <input
                            value={photo.metadata[key] ?? ''}
                            placeholder="—"
                            onChange={(e) =>
                                s.applyRecipe(photo.id, {
                                    metadata: { ...photo.metadata, [key]: e.target.value },
                                })
                            }
                        />
                    </Field>
                ))}
            </Section>
            <Section title={t('workspace.global')} defaultOpen={false}>
                {(
                    [
                        ['showCameraMaker', 'show-camera-maker'],
                        ['showCameraModel', 'show-camera-model'],
                        ['showLensModel', 'show-lens-model'],
                        ['disableExposureMeter', 'disable-exposure-meter'],
                        ['focalLength35mmMode', 'focal-length-35mm-mode'],
                        ['focalLengthRatioMode', 'focal-length-ratio-mode'],
                    ] as const
                ).map(([key, label]) => (
                    <Toggle
                        key={key}
                        label={t('root.settings.' + label)}
                        checked={p[key]}
                        onChange={(value) => s.patchPreferences({ [key]: value })}
                    />
                ))}
                {p.focalLengthRatioMode && (
                    <NumberField
                        label={t('root.settings.focal-length-ratio')}
                        value={p.focalLengthRatio}
                        min={0.01}
                        max={100}
                        step={0.1}
                        onChange={(v) => s.patchPreferences({ focalLengthRatio: v })}
                    />
                )}
                {(
                    [
                        ['overrideCameraMaker', 'override-camera-maker'],
                        ['overrideCameraModel', 'override-camera-model'],
                        ['overrideLensModel', 'override-lens-model'],
                    ] as const
                ).map(([key, label]) => (
                    <Field key={key} label={t('root.settings.' + label)}>
                        <input value={p[key]} onChange={(e) => s.patchPreferences({ [key]: e.target.value })} />
                    </Field>
                ))}
                <Field label={t('root.settings.date-notation')}>
                    <select
                        value={p.dateNotation}
                        onChange={(e) => s.patchPreferences({ dateNotation: e.target.value })}
                    >
                        {DATE_FORMATS.map((f) => (
                            <option key={f}>{f}</option>
                        ))}
                    </select>
                </Field>
            </Section>
            <Section title={t('workspace.presets')} defaultOpen={false}>
                <Field label={t('root.settings.select-overridable-metadata')}>
                    <select
                        value={p.overrideMetadataIndex ?? ''}
                        onChange={(e) =>
                            s.patchPreferences({
                                overrideMetadataIndex: e.target.value === '' ? null : Number(e.target.value),
                            })
                        }
                    >
                        <option value="">{t('workspace.none')}</option>
                        {p.overridableMetadata.map((m, i) => (
                            <option value={i} key={i}>
                                {m.name || m.model || `Preset ${i + 1}`}
                            </option>
                        ))}
                    </select>
                </Field>
                <form
                    onSubmit={(event) => {
                        event.preventDefault()
                        if (!presetName.trim()) return
                        s.patchPreferences({
                            overridableMetadata: [
                                ...p.overridableMetadata,
                                {
                                    ...Object.fromEntries(fields.map(([key]) => [key, photo.metadata[key] ?? ''])),
                                    name: presetName.trim(),
                                },
                            ],
                        })
                        setPresetName('')
                    }}
                >
                    <Field label={t('workspace.presetName')}>
                        <input
                            value={presetName}
                            maxLength={100}
                            onChange={(event) => setPresetName(event.target.value)}
                        />
                    </Field>
                    <Button type="submit" disabled={!presetName.trim()}>
                        {t('workspace.newPreset')}
                    </Button>
                </form>
                {p.overrideMetadataIndex !== null && (
                    <div className="mt-4">
                        {(
                            [
                                ['name', 'workspace.presetName'],
                                ...fields.map(([key, label]) => [key, labels[label]]),
                            ] as string[][]
                        ).map(([key, label]) => (
                            <Field key={key} label={t(label)}>
                                <input
                                    value={p.overridableMetadata[p.overrideMetadataIndex!]?.[key] ?? ''}
                                    onChange={(event) =>
                                        s.patchPreferences({
                                            overridableMetadata: p.overridableMetadata.map((preset, index) =>
                                                index === p.overrideMetadataIndex
                                                    ? { ...preset, [key]: event.target.value }
                                                    : preset,
                                            ),
                                        })
                                    }
                                />
                            </Field>
                        ))}
                    </div>
                )}
                {p.overridableMetadata.map((m, i) => (
                    <div className="preset-row" key={i}>
                        <span>{m.name || m.model}</span>
                        <Button
                            variant="ghost"
                            onClick={() =>
                                s.patchPreferences({
                                    overridableMetadata: p.overridableMetadata.filter((_, index) => index !== i),
                                    overrideMetadataIndex:
                                        p.overrideMetadataIndex === i
                                            ? null
                                            : p.overrideMetadataIndex !== null && p.overrideMetadataIndex > i
                                              ? p.overrideMetadataIndex - 1
                                              : p.overrideMetadataIndex,
                                })
                            }
                        >
                            {t('workspace.remove')}
                        </Button>
                    </div>
                ))}
            </Section>
        </>
    )
}

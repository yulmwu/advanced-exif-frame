import { useTranslation } from 'react-i18next'
import { FiDownload, FiFile } from 'react-icons/fi'
import { useRef } from 'react'
import { useWorkspace } from '../../application/workspace'
import { usesOriginalResolution } from '../../engine/render/format'
import { normalizeAspectRatio } from '../../engine/geometry/aspect'
import { serializeSettings, parseSettings } from '../../application/settings-codec'
import { serializePhoto, parsePhoto, settingsFilename } from '../../application/photo-codec'
import { downloadText } from '../../application/export'
import { Button, Field, NumberField, Section, Toggle } from '../components/primitives'
export function ExportPanel({ onExport }: { onExport: () => void }) {
    const s = useWorkspace(),
        p = s.preferences,
        { t } = useTranslation(),
        input = useRef<HTMLInputElement>(null),
        photoInput = useRef<HTMLInputElement>(null),
        photo = s.photos.find((p) => p.id === s.selectedId),
        native = usesOriginalResolution(p)
    const read = async (file: File | undefined, kind: 'global' | 'photo') => {
        if (!file) return
        try {
            if (file.size > 1024 * 1024) throw Error('Settings too large')
            const text = await file.text()
            if (kind === 'global') s.replacePreferences(parseSettings(text))
            else if (photo) s.applyRecipe(photo.id, parsePhoto(text, photo))
            s.setNotice(t('workspace.saved'))
        } catch (error) {
            s.setNotice(String(error))
        }
    }
    return (
        <>
            <Section title={t('workspace.format')}>
                <div className="format-options">
                    {['PNG', 'JPEG', 'WebP'].map((format) => (
                        <button
                            key={format}
                            className={
                                (p.losslessExport ? 'PNG' : p.exportToJpeg ? 'JPEG' : 'WebP') === format
                                    ? 'selected'
                                    : ''
                            }
                            onClick={() =>
                                s.patchPreferences({
                                    losslessExport: format === 'PNG',
                                    exportToJpeg: format === 'JPEG',
                                })
                            }
                        >
                            {format}
                            <small>
                                {format === 'PNG'
                                    ? t('root.settings.lossless')
                                    : format === 'JPEG'
                                      ? 'Universal'
                                      : 'Compact'}
                            </small>
                        </button>
                    ))}
                </div>
                {p.losslessExport && <p className="notice-note">{t('workspace.pngNote')}</p>}
                {p.exportToJpeg && <p className="field-hint">{t('workspace.jpegNote')}</p>}
                <Field
                    label={
                        <span className="flex justify-between">
                            <span>{t('workspace.quality')}</span>
                            <span>{p.quality}%</span>
                        </span>
                    }
                >
                    <input
                        type="range"
                        min="1"
                        max="100"
                        disabled={p.losslessExport}
                        value={p.quality}
                        onChange={(e) => s.patchPreferences({ quality: Number(e.target.value) })}
                    />
                </Field>
                <Toggle
                    label={t('root.settings.maintain-exif').replace(/\s*\(.*\)/, '')}
                    checked={p.maintainExif}
                    onChange={(maintainExif) => s.patchPreferences({ maintainExif })}
                />
            </Section>
            <Section title={t('workspace.dimensions')}>
                <Toggle
                    label={t('workspace.native')}
                    checked={native}
                    disabled={p.losslessExport || (p.exportToJpeg && p.quality === 100)}
                    onChange={(v) => s.patchPreferences({ originalResolution: v })}
                />
                <Toggle
                    label={t('root.settings.fix-image-width')}
                    checked={!native && p.fixImageWidth}
                    disabled={native}
                    onChange={(fixImageWidth) => s.patchPreferences({ fixImageWidth })}
                />
                {p.fixImageWidth && !native && (
                    <NumberField
                        label={t('workspace.longEdge')}
                        value={p.imageWidth}
                        min={1}
                        max={4096}
                        unit="px"
                        onChange={(imageWidth) => s.patchPreferences({ imageWidth: Math.round(imageWidth) })}
                    />
                )}
                <Field label={t('workspace.ratio')}>
                    <select
                        value={
                            ['free', '1:1', '3:4', '4:5', '3:2', '2:3', '4:3', '16:9', '9:16'].includes(p.ratio)
                                ? p.ratio
                                : 'custom'
                        }
                        onChange={(e) => {
                            if (e.target.value !== 'custom') s.patchPreferences({ ratio: e.target.value })
                            else s.patchPreferences({ ratio: '7:5' })
                        }}
                    >
                        {['free', '1:1', '3:4', '4:5', '3:2', '2:3', '4:3', '16:9', '9:16'].map((r) => (
                            <option key={r}>{r}</option>
                        ))}
                        <option value="custom">
                            {t('workspace.custom')}
                            {p.ratio !== 'free' ? ' · ' + p.ratio : ''}
                        </option>
                    </select>
                </Field>
                <form
                    className="ratio-custom"
                    onSubmit={(e) => {
                        e.preventDefault()
                        const data = new FormData(e.currentTarget),
                            ratio = normalizeAspectRatio(data.get('w') + ':' + data.get('h'))
                        if (ratio) s.patchPreferences({ ratio })
                        else s.setNotice(t('root.settings.ratio-custom-error'))
                    }}
                    key={p.ratio}
                >
                    <input
                        aria-label={t('photo.ratio-width')}
                        type="number"
                        min="0.01"
                        max="10000"
                        step="0.01"
                        name="w"
                        defaultValue={p.ratio === 'free' ? 3 : p.ratio.split(':')[0]}
                    />
                    <span>:</span>
                    <input
                        aria-label={t('photo.ratio-height')}
                        type="number"
                        min="0.01"
                        max="10000"
                        step="0.01"
                        name="h"
                        defaultValue={p.ratio === 'free' ? 4 : p.ratio.split(':')[1]}
                    />
                    <button type="submit">{t('workspace.apply')}</button>
                </form>
                {p.ratio !== 'free' && (
                    <>
                        <Toggle
                            label={t('root.settings.not-cropped-mode')}
                            checked={native || p.notCroppedMode}
                            disabled={native}
                            onChange={(notCroppedMode) => s.patchPreferences({ notCroppedMode })}
                        />
                        {(native || p.notCroppedMode) && (
                            <Toggle
                                label={t('root.settings.apply-ratio-to-text')}
                                checked={p.applyRatioToText}
                                onChange={(applyRatioToText) => s.patchPreferences({ applyRatioToText })}
                            />
                        )}
                    </>
                )}
            </Section>
            <Section title={t('root.settings.watermark')} defaultOpen={false}>
                <Toggle
                    label={t('root.settings.fix-watermark')}
                    checked={p.fixWatermark}
                    onChange={(fixWatermark) => s.patchPreferences({ fixWatermark })}
                />
                {p.fixWatermark && (
                    <input
                        aria-label={t('root.settings.watermark')}
                        value={p.watermark}
                        onChange={(e) => s.patchPreferences({ watermark: e.target.value })}
                    />
                )}
            </Section>
            <Section title={t('workspace.backup')} defaultOpen={false}>
                <Button onClick={() => downloadText(serializeSettings(p), 'advanced-exif-frame-settings.json')}>
                    <FiDownload />
                    {t('workspace.saveSettings')}
                </Button>
                <Button onClick={() => input.current?.click()}>
                    <FiFile />
                    {t('workspace.loadSettings')}
                </Button>
                <input
                    ref={input}
                    hidden
                    type="file"
                    accept=".json,application/json"
                    onChange={(e) => {
                        void read(e.target.files?.[0], 'global')
                        e.target.value = ''
                    }}
                />
                {photo && (
                    <>
                        <hr />
                        <Button onClick={() => downloadText(serializePhoto(photo), settingsFilename(photo.file.name))}>
                            {t('workspace.photoSave')}
                        </Button>
                        <Button onClick={() => photoInput.current?.click()}>{t('workspace.photoLoad')}</Button>
                        <input
                            ref={photoInput}
                            hidden
                            type="file"
                            accept=".json,application/json"
                            onChange={(e) => {
                                void read(e.target.files?.[0], 'photo')
                                e.target.value = ''
                            }}
                        />
                    </>
                )}
            </Section>
            <div className="panel-export">
                <Button variant="primary" disabled={!photo || photo.demo || !!s.job} onClick={onExport}>
                    <FiDownload />
                    {t('workspace.export')}
                </Button>
            </div>
        </>
    )
}

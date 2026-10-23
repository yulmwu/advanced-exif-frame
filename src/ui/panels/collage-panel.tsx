import { useCollageSettings } from '../../application/collage-settings'
import { useTranslation } from 'react-i18next'
import JSZip from 'jszip'
import saveAs from 'file-saver'
import { useWorkspace } from '../../application/workspace'
import { renderCollage } from '../../engine/collage'
import { exportFormat } from '../../engine/render/format'
import encode from '../../engine/render/encode'
import { timestamp } from '../../application/export'
import { Button, Field, NumberField, Section } from '../components/primitives'
export function CollagePanel() {
    const { t } = useTranslation(),
        s = useWorkspace(),
        { options: o, setOptions: set, excludedIds, togglePhoto } = useCollageSettings()
    const run = async () => {
        const photos = s.photos.filter((p) => !p.demo && !excludedIds.includes(p.id))
        if (s.job) return
        if (!photos.length) return
        const preferences = structuredClone(s.preferences),
            options = { ...o },
            size = o.rows * o.columns,
            total = Math.ceil(photos.length / size),
            zip = new JSZip()
        s.setJob({ done: 0, total, label: t('workspace.collage') })
        try {
            for (let i = 0; i < total; i++) {
                const canvas = renderCollage(photos.slice(i * size, (i + 1) * size), preferences, options)
                try {
                    const format = exportFormat(preferences),
                        data = await encode(canvas, {
                            type: format.type,
                            quality: preferences.quality,
                        })
                    if (total === 1) saveAs(data, `collage.${format.extension}`)
                    else zip.file(`collage-${i + 1}.${format.extension}`, data.split(',')[1], { base64: true })
                } finally {
                    canvas.width = canvas.height = 1
                }
                s.setJob({ done: i + 1, total, label: t('workspace.collage') })
                await new Promise((r) => setTimeout(r, 0))
            }
            if (total > 1) saveAs(await zip.generateAsync({ type: 'blob' }), timestamp() + '.zip')
        } catch (error) {
            s.setNotice(String(error))
        } finally {
            s.setJob(null)
        }
    }
    return (
        <Section title={t('workspace.collage')}>
            <p className="field-hint">
                {t('lab.collage-description')} · {s.photos.filter((p) => !p.demo).length} {t('workspace.photos')}
            </p>
            <div className="collage-photo-picker">
                {s.photos
                    .filter((photo) => !photo.demo)
                    .map((photo) => (
                        <label key={photo.id}>
                            <input
                                type="checkbox"
                                checked={!excludedIds.includes(photo.id)}
                                onChange={() => togglePhoto(photo.id)}
                            />
                            <img src={photo.thumbnail} alt="" />
                            <span>{photo.file.name}</span>
                        </label>
                    ))}
            </div>
            <Field label={t('workspace.ratio')}>
                <input value={o.ratio} onChange={(e) => set({ ...o, ratio: e.target.value })} />
            </Field>
            <div className="control-grid">
                {(
                    [
                        ['rows', 'rows'],
                        ['columns', 'columns'],
                        ['gap', 'gap'],
                        ['top', 'photo.top'],
                        ['bottom', 'photo.bottom'],
                        ['left', 'photo.left'],
                        ['right', 'photo.right'],
                    ] as const
                ).map(([key, label]) => (
                    <NumberField
                        key={key}
                        label={t(label.startsWith('photo') ? label : 'workspace.' + label)}
                        value={o[key]}
                        min={key === 'rows' || key === 'columns' ? 1 : 0}
                        max={key === 'rows' || key === 'columns' ? 10 : 1000}
                        onChange={(value) => set({ ...o, [key]: Math.round(value) })}
                    />
                ))}
            </div>
            <Field label={t('workspace.background')}>
                <input type="color" value={o.background} onChange={(e) => set({ ...o, background: e.target.value })} />
            </Field>
            <Button variant="primary" disabled={!!s.job || !s.photos.some((p) => !p.demo)} onClick={() => void run()}>
                {t('workspace.createCollage')}
            </Button>
        </Section>
    )
}

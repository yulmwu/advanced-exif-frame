import { useTranslation } from 'react-i18next'
import { FiRotateCcw, FiRotateCw, FiAlignCenter, FiAlignJustify, FiCheck } from 'react-icons/fi'
import type { PhotoRecord } from '../../domain/photo'
import type { PhotoEdit, CropRect } from '../../engine/geometry/crop'
import {
    originalEdit,
    rotatedSize,
    cropPixels,
    cropForRatio,
    presetRatio,
    resizeCrop,
    setRotation,
    constrainCrop,
} from '../../engine/geometry/crop'
import { centerCropAxis, isRatioLocked, lockedCropRatio } from '../../engine/geometry/controls'
import { FINAL_RATIOS } from '../../engine/geometry/final-frame'
import { normalizeAspectRatio } from '../../engine/geometry/aspect'
import { useWorkspace } from '../../application/workspace'
import { Button, Field, NumberField, Section, Toggle } from '../components/primitives'
import { FramePreview } from '../components/frame-preview'
export const CROP_PRESETS = [
    'free',
    'original',
    '1:1',
    '4:3',
    '3:4',
    '3:2',
    '2:3',
    '16:9',
    '9:16',
    '4:5',
    '5:4',
    '5:7',
    '7:5',
    '2:1',
    '1:2',
]
export function EditPanel({
    photo,
    edit,
    onChange,
    error,
}: {
    photo: PhotoRecord
    edit: PhotoEdit
    onChange: (edit: PhotoEdit) => void
    error?: string
}) {
    const { t } = useTranslation(),
        s = useWorkspace(),
        width = photo.image.naturalWidth || photo.image.width,
        height = photo.image.naturalHeight || photo.image.height,
        size = rotatedSize(width, height, edit.rotation),
        bounds = cropPixels(width, height, edit),
        locked = isRatioLocked(edit),
        ratio = lockedCropRatio(edit, width, height)
    const crop = (rect: CropRect, preset = edit.preset) =>
        onChange({
            ...edit,
            crop: constrainCrop(width, height, edit.rotation, rect),
            preset,
            rotationReference: undefined,
        })
    return (
        <>
            <Section title={t('photo.crop')}>
                <p className="field-hint">{t('workspace.cropNote')}</p>
                <Toggle
                    label={t('photo.fit-final-ratio')}
                    checked={!!edit.finalRatio}
                    onChange={(enabled) =>
                        onChange({
                            ...edit,
                            finalRatio: enabled ? (normalizeAspectRatio(s.preferences.ratio) ?? '3:4') : undefined,
                            aspectRatioLocked: true,
                            lockedRatio: ratio ?? undefined,
                            rotationReference: undefined,
                        })
                    }
                />
                {edit.finalRatio ? (
                    <>
                        <Field label={t('photo.final-ratio')}>
                            <select
                                value={edit.finalRatio}
                                onChange={(e) =>
                                    onChange({
                                        ...edit,
                                        finalRatio: e.target.value,
                                        rotationReference: undefined,
                                    })
                                }
                            >
                                {!FINAL_RATIOS.includes(edit.finalRatio) && <option>{edit.finalRatio}</option>}
                                {FINAL_RATIOS.map((r) => (
                                    <option key={r}>{r}</option>
                                ))}
                            </select>
                        </Field>
                        <p className="field-hint">{t('photo.final-ratio-help')}</p>
                    </>
                ) : (
                    <>
                        <Field label={t('photo.crop-ratio')}>
                            <select
                                value={edit.preset}
                                onChange={(e) => {
                                    const preset = e.target.value,
                                        r = presetRatio(preset, width, height)
                                    onChange({
                                        ...edit,
                                        preset,
                                        crop: constrainCrop(
                                            width,
                                            height,
                                            edit.rotation,
                                            r ? cropForRatio(size.width, size.height, r) : edit.crop,
                                        ),
                                        aspectRatioLocked: !!r,
                                        lockedRatio: r ?? undefined,
                                        rotationReference: undefined,
                                    })
                                }}
                            >
                                {!CROP_PRESETS.includes(edit.preset) && <option>{edit.preset}</option>}
                                {CROP_PRESETS.map((r) => (
                                    <option key={r} value={r}>
                                        {r === 'free'
                                            ? t('photo.free')
                                            : r === 'original'
                                              ? t('photo.original-ratio')
                                              : r}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <form
                            className="ratio-custom"
                            key={edit.preset}
                            onSubmit={(e) => {
                                e.preventDefault()
                                const f = new FormData(e.currentTarget),
                                    preset = String(f.get('w')) + ':' + String(f.get('h')),
                                    r = presetRatio(preset, width, height)
                                if (r)
                                    onChange({
                                        ...edit,
                                        preset,
                                        crop: constrainCrop(
                                            width,
                                            height,
                                            edit.rotation,
                                            cropForRatio(size.width, size.height, r),
                                        ),
                                        aspectRatioLocked: true,
                                        lockedRatio: r,
                                        rotationReference: undefined,
                                    })
                            }}
                        >
                            <input
                                aria-label={t('photo.ratio-width')}
                                name="w"
                                type="number"
                                min="0.001"
                                max="100000"
                                step="any"
                                defaultValue={edit.preset.includes(':') ? edit.preset.split(':')[0] : 1}
                            />
                            <span>:</span>
                            <input
                                aria-label={t('photo.ratio-height')}
                                name="h"
                                type="number"
                                min="0.001"
                                max="100000"
                                step="any"
                                defaultValue={edit.preset.includes(':') ? edit.preset.split(':')[1] : 1}
                            />
                            <button type="submit">{t('workspace.apply')}</button>
                        </form>
                    </>
                )}
                <Toggle
                    label={t('photo.lock-ratio')}
                    checked={locked}
                    disabled={!!edit.finalRatio}
                    onChange={(enabled) =>
                        onChange({
                            ...edit,
                            aspectRatioLocked: enabled,
                            lockedRatio: enabled
                                ? (edit.crop.width * size.width) / (edit.crop.height * size.height)
                                : undefined,
                            rotationReference: undefined,
                        })
                    }
                />
                <Field label={t('photo.crop-size')}>
                    <input
                        type="range"
                        min="1"
                        max="100"
                        value={Math.max(edit.crop.width, edit.crop.height) * 100}
                        onChange={(e) => {
                            const factor = Number(e.target.value) / 100 / Math.max(edit.crop.width, edit.crop.height)
                            crop({
                                x: edit.crop.x + (edit.crop.width * (1 - factor)) / 2,
                                y: edit.crop.y + (edit.crop.height * (1 - factor)) / 2,
                                width: edit.crop.width * factor,
                                height: edit.crop.height * factor,
                            })
                        }}
                    />
                </Field>
                <div className="control-grid">
                    {(['width', 'height'] as const).map((axis) => (
                        <NumberField
                            key={axis}
                            label={t(axis === 'width' ? 'photo.crop-width' : 'photo.crop-height')}
                            value={bounds[axis]}
                            min={1}
                            max={size[axis]}
                            unit="px"
                            onChange={(value) =>
                                crop(resizeCrop(edit.crop, axis, value / size[axis], size.width, size.height, ratio))
                            }
                        />
                    ))}
                    {(['x', 'y'] as const).map((axis) => (
                        <NumberField
                            key={axis}
                            label={t(axis === 'x' ? 'photo.horizontal-position' : 'photo.vertical-position')}
                            value={edit.crop[axis] * 100}
                            min={0}
                            max={(1 - edit.crop[axis === 'x' ? 'width' : 'height']) * 100}
                            step={0.1}
                            unit="%"
                            onChange={(value) => crop({ ...edit.crop, [axis]: value / 100 })}
                        />
                    ))}
                </div>
                <div className="flex gap-2">
                    <Button onClick={() => crop(centerCropAxis(width, height, edit.rotation, edit.crop, 'x'))}>
                        <FiAlignCenter />
                        {t('photo.center-horizontal')}
                    </Button>
                    <Button onClick={() => crop(centerCropAxis(width, height, edit.rotation, edit.crop, 'y'))}>
                        <FiAlignJustify />
                        {t('photo.center-vertical')}
                    </Button>
                </div>
            </Section>
            <Section title={t('photo.rotation-angle')}>
                <NumberField
                    label={t('photo.rotation-angle')}
                    value={edit.rotation > 180 ? edit.rotation - 360 : edit.rotation}
                    min={-180}
                    max={180}
                    step={0.1}
                    unit="°"
                    onChange={(value) => onChange(setRotation(edit, value, width, height))}
                />
                <input
                    aria-label={t('photo.rotation-angle')}
                    type="range"
                    min="-180"
                    max="180"
                    step="0.1"
                    value={edit.rotation > 180 ? edit.rotation - 360 : edit.rotation}
                    onChange={(e) => onChange(setRotation(edit, Number(e.target.value), width, height))}
                />
                <div className="flex gap-2">
                    <Button onClick={() => onChange(setRotation(edit, edit.rotation - 90, width, height))}>
                        <FiRotateCcw />
                        90°
                    </Button>
                    <Button onClick={() => onChange(setRotation(edit, edit.rotation + 90, width, height))}>
                        <FiRotateCw />
                        90°
                    </Button>
                    <Button variant="ghost" onClick={() => onChange(originalEdit())}>
                        {t('workspace.reset')}
                    </Button>
                </div>
                <p className="field-hint">{t('photo.rotation-hint')}</p>
            </Section>
            <Section title={t('workspace.draft')}>
                <FramePreview photo={{ ...photo, edit }} preferences={s.preferences} />
            </Section>
            {error && (
                <p role="alert" className="notice-note">
                    {error}
                </p>
            )}
            <div className="panel-export">
                <Button
                    variant="primary"
                    disabled={!!error}
                    onClick={() => {
                        s.applyRecipe(photo.id, { edit })
                        s.setNotice(t('workspace.saved'))
                    }}
                >
                    <FiCheck />
                    {t('workspace.apply')}
                </Button>
                <Button onClick={() => onChange(structuredClone(photo.edit))}>{t('workspace.cancel')}</Button>
            </div>
        </>
    )
}

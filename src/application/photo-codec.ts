import type { PhotoRecord, Metadata } from '../domain/photo'
import type { PhotoEdit } from '../engine/geometry/crop'
import { constrainCrop } from '../engine/geometry/crop'
import { normalizeAspectRatio } from '../engine/geometry/aspect'
import { BACKGROUND_PRESETS } from '../engine/render/background'
const fields = [
    'make',
    'model',
    'lensModel',
    'focalLength',
    'focalLengthIn35mm',
    'fNumber',
    'iso',
    'exposureTime',
    'takenAt',
] as const
const dimensions = (p: PhotoRecord) => ({
    width: p.image.naturalWidth || p.image.width,
    height: p.image.naturalHeight || p.image.height,
})
export const settingsFilename = (name: string) => name.replace(/\.[^/.]+$/, '') + '.settings.json'
export function serializePhoto(p: PhotoRecord) {
    return JSON.stringify(
        {
            format: 'exif-frame-photo-settings',
            version: 1,
            source: { name: p.file.name, ...dimensions(p) },
            edit: p.edit,
            background: p.background,
            metadata: Object.fromEntries(fields.map((key) => [key, p.metadata[key] ?? null])),
        },
        null,
        2,
    )
}
export function parsePhoto(text: string, p: PhotoRecord): Pick<PhotoRecord, 'edit' | 'background' | 'metadata'> {
    const fail = (): never => {
        throw new Error('Invalid photo settings or mismatched original dimensions')
    }
    if (new TextEncoder().encode(text).length > 1024 * 1024) fail()
    const v = JSON.parse(text.replace(/^\uFEFF/, ''))
    if (
        !v ||
        v.format !== 'exif-frame-photo-settings' ||
        v.version !== 1 ||
        v.source?.width !== dimensions(p).width ||
        v.source?.height !== dimensions(p).height
    )
        fail()
    if (
        typeof v.source.name !== 'string' ||
        v.source.name.length > 1024 ||
        Object.keys(v.source).some((key) => !['name', 'width', 'height'].includes(key))
    )
        fail()
    if (v.background !== 'blur' && !BACKGROUND_PRESETS.some((b) => b.id === v.background)) fail()
    if (Object.keys(v).some((key) => !['format', 'version', 'source', 'edit', 'background', 'metadata'].includes(key)))
        fail()
    const edit = v.edit as PhotoEdit
    if (
        !edit ||
        Object.keys(edit).some(
            (key) =>
                ![
                    'rotation',
                    'crop',
                    'preset',
                    'aspectRatioLocked',
                    'lockedRatio',
                    'finalRatio',
                    'rotationReference',
                ].includes(key),
        )
    )
        fail()
    const validRect = (crop: PhotoEdit['crop']) =>
        crop &&
        Object.keys(crop).length === 4 &&
        ['x', 'y', 'width', 'height'].every((key) => Object.hasOwn(crop, key)) &&
        Object.values(crop).every((n) => typeof n === 'number' && Number.isFinite(n)) &&
        crop.x >= 0 &&
        crop.y >= 0 &&
        crop.width > 0 &&
        crop.height > 0 &&
        crop.x + crop.width <= 1 + 1e-9 &&
        crop.y + crop.height <= 1 + 1e-9
    const validRotation = (n: number) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n < 360
    if (
        !edit ||
        !validRotation(edit.rotation) ||
        !validRect(edit.crop) ||
        typeof edit.preset !== 'string' ||
        edit.preset.length > 100 ||
        (!['free', 'original'].includes(edit.preset) &&
            (!/^\d+(?:\.\d+)?:\d+(?:\.\d+)?$/.test(edit.preset) ||
                edit.preset
                    .split(':')
                    .map(Number)
                    .some((n) => !Number.isFinite(n) || n <= 0) ||
                !Number.isFinite(Number(edit.preset.split(':')[0]) / Number(edit.preset.split(':')[1]))))
    )
        fail()
    if (edit.finalRatio !== undefined && !normalizeAspectRatio(edit.finalRatio)) fail()
    if (
        edit.rotationReference !== undefined &&
        (!edit.rotationReference ||
            Object.keys(edit.rotationReference).some((key) => !['rotation', 'crop'].includes(key)))
    )
        fail()
    if (edit.lockedRatio !== undefined && (!Number.isFinite(edit.lockedRatio) || edit.lockedRatio <= 0)) fail()
    if (edit.aspectRatioLocked !== undefined && typeof edit.aspectRatioLocked !== 'boolean') fail()
    for (const part of [
        { rotation: edit.rotation, crop: edit.crop },
        ...(edit.rotationReference ? [edit.rotationReference] : []),
    ]) {
        if (!validRotation(part.rotation) || !validRect(part.crop)) fail()
        const bounded = constrainCrop(dimensions(p).width, dimensions(p).height, part.rotation, part.crop)
        if ((Object.keys(bounded) as (keyof typeof bounded)[]).some((k) => Math.abs(bounded[k] - part.crop[k]) > 1e-7))
            fail()
    }
    if (
        !v.metadata ||
        fields.some(
            (key) =>
                v.metadata[key] !== null && (typeof v.metadata[key] !== 'string' || v.metadata[key].length > 10000),
        ) ||
        Object.keys(v.metadata).some((key) => !fields.includes(key as (typeof fields)[number]))
    )
        fail()
    const metadata: Metadata = { ...p.metadata }
    for (const key of fields) metadata[key] = v.metadata[key] ?? undefined
    return { edit: structuredClone(edit), background: v.background, metadata }
}

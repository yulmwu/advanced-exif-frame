import saveAs from 'file-saver'
import JSZip from 'jszip'
import type { PhotoRecord } from '../domain/photo'
import type { Preferences } from '../domain/settings'
import { renderPhoto } from '../engine/render'
import { exportFormat } from '../engine/render/format'
import encode from '../engine/render/encode'
import restoreJpeg from '../engine/metadata/jpeg'
import restorePng from '../engine/metadata/png'
import release from '../engine/render/release'
import { snapshotPhoto } from './photos'
import { serializePhoto, settingsFilename } from './photo-codec'
export function downloadText(text: string, filename: string) {
    saveAs(new Blob([text], { type: 'application/json;charset=utf-8' }), filename)
}
export function timestamp(date = new Date()) {
    const p = (v: number) => String(v).padStart(2, '0')
    return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}_${p(date.getHours())}-${p(date.getMinutes())}-${p(date.getSeconds())}`
}
export function reserveFilename(name: string, used: Set<string>) {
    let result = name,
        i = 2
    const dot = name.lastIndexOf('.'),
        base = dot < 0 ? name : name.slice(0, dot),
        ext = dot < 0 ? '' : name.slice(dot)
    while (used.has(result)) result = `${base} (${i++})${ext}`
    used.add(result)
    return result
}
export async function exportOne(photo: PhotoRecord, preferences: Preferences, signal?: AbortSignal) {
    const settings = structuredClone(preferences),
        snapshot = snapshotPhoto(photo)
    const canvas = await renderPhoto(snapshot, settings, signal)
    try {
        const format = exportFormat(settings)
        let data = await encode(canvas, {
            type: format.type,
            quality: settings.quality,
        })
        signal?.throwIfAborted()
        if (settings.maintainExif && format.type === 'image/jpeg')
            data = restoreJpeg(snapshot.imageBase64, data, canvas.width, canvas.height)
        if (settings.maintainExif && format.type === 'image/png')
            data = restorePng(snapshot.imageBase64, data, canvas.width, canvas.height)
        return {
            filename: photo.file.name.replace(/\.[^/.]+$/, '') + '.' + format.extension,
            data,
        }
    } finally {
        release(canvas)
    }
}
export async function exportBatch(
    photos: PhotoRecord[],
    preferences: Preferences,
    progress: (done: number) => void,
    signal?: AbortSignal,
) {
    const snapshots = photos.map(snapshotPhoto),
        settings = structuredClone(preferences),
        name = timestamp() + '.zip',
        zip = new JSZip(),
        used = new Set<string>()
    for (const [i, photo] of snapshots.entries()) {
        signal?.throwIfAborted()
        const file = await exportOne(photo, settings, signal)
        const filename = reserveFilename(file.filename, used)
        zip.file(filename, file.data.split(',')[1], { base64: true })
        zip.file(settingsFilename(filename), serializePhoto(photo))
        progress(i + 1)
        await new Promise((r) => setTimeout(r, 0))
    }
    signal?.throwIfAborted()
    const blob = await zip.generateAsync({ type: 'blob' })
    signal?.throwIfAborted()
    saveAs(blob, name)
}

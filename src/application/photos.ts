import ExifReader from 'exifreader'
import type { PhotoRecord } from '../domain/photo'
import MetadataReader from '../engine/metadata/reader'
import { cropPixels, originalEdit } from '../engine/geometry/crop'
import { defaultPreferences } from '../domain/settings'
import PhotoView from '../domain/photo'
import { drawPhoto } from '../engine/render/raster'
export async function importPhoto(file: File, demo = false): Promise<PhotoRecord> {
    if (file.size > 250 * 1024 * 1024) throw new Error('Photo exceeds 250 MB')
    let metadata = {}
    try {
        metadata = new MetadataReader(await ExifReader.load(file, { expanded: true }))
    } catch {
        /* Decodable photos without metadata remain usable. */
    }
    const url = URL.createObjectURL(file),
        image = new Image()
    try {
        await new Promise<void>((resolve, reject) => {
            image.onload = () => resolve()
            image.onerror = () => reject(new Error('Unable to decode ' + file.name))
            image.src = url
        })
    } finally {
        URL.revokeObjectURL(url)
    }
    const imageBase64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(reader.error)
        reader.readAsDataURL(file)
    })
    const photo: PhotoRecord = {
        id: crypto.randomUUID(),
        file,
        image,
        imageBase64,
        thumbnail: '',
        metadata,
        edit: originalEdit(),
        background: 'white',
        demo,
    }
    photo.thumbnail = makeThumbnail(photo)
    return photo
}
export function makeThumbnail(photo: PhotoRecord) {
    const canvas = document.createElement('canvas')
    const { width, height } = cropPixels(
        photo.image.naturalWidth || photo.image.width,
        photo.image.naturalHeight || photo.image.height,
        photo.edit,
    )
    const aspect = width / height
    canvas.width = Math.max(1, Math.round(Math.min(200, 150 * aspect)))
    canvas.height = Math.max(1, Math.round(canvas.width / aspect))
    const context = canvas.getContext('2d')!
    const view = new PhotoView(photo, defaultPreferences())
    // Thumbnails contain the selection; the original never gets re-encoded for editing.
    drawPhoto(context, view, 0, 0, canvas.width, canvas.height)
    const url = canvas.toDataURL('image/jpeg', 0.85)
    canvas.width = canvas.height = 1
    return url
}
export function snapshotPhoto(photo: PhotoRecord): PhotoRecord {
    return {
        ...photo,
        metadata: { ...photo.metadata },
        edit: structuredClone(photo.edit),
    }
}

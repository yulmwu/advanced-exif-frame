import type { PhotoRecord } from '../domain/photo'
import PhotoView from '../domain/photo'
import type { Preferences } from '../domain/settings'
import { drawPhoto, photoSize } from './render/raster'
import { normalizeAspectRatio } from './geometry/aspect'
import type { CollageOptions } from '../domain/collage'
export type { CollageOptions } from '../domain/collage'
export function renderCollage(photos: PhotoRecord[], p: Preferences, o: CollageOptions) {
    const ratio = normalizeAspectRatio(o.ratio)
    if (
        !ratio ||
        ![o.rows, o.columns].every((v) => Number.isInteger(v) && v >= 1 && v <= 10) ||
        ![o.gap, o.top, o.bottom, o.left, o.right].every((v) => Number.isFinite(v) && v >= 0)
    )
        throw Error('Invalid collage settings')
    const [rw, rh] = ratio.split(':').map(Number),
        canvas = document.createElement('canvas')
    canvas.width = rw >= rh ? 4096 : Math.floor((4096 * rw) / rh)
    canvas.height = rh >= rw ? 4096 : Math.floor((4096 * rh) / rw)
    const w = (canvas.width - o.left - o.right - o.gap * (o.columns - 1)) / o.columns,
        h = (canvas.height - o.top - o.bottom - o.gap * (o.rows - 1)) / o.rows
    if (w <= 0 || h <= 0) throw Error('Collage padding leaves no room')
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = o.background
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    photos.slice(0, o.rows * o.columns).forEach((p0, i) => {
        const photo = new PhotoView(p0, p),
            size = photoSize(photo),
            scale = Math.max(w / size.width, h / size.height),
            x = o.left + (i % o.columns) * (w + o.gap),
            y = o.top + Math.floor(i / o.columns) * (h + o.gap)
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()
        drawPhoto(
            ctx,
            photo,
            x + (w - size.width * scale) / 2,
            y + (h - size.height * scale) / 2,
            size.width * scale,
            size.height * scale,
        )
        ctx.restore()
    })
    return canvas
}

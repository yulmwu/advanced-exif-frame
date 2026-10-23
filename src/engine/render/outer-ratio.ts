import type Photo from '../../domain/photo'
import { drawPhotoBackground } from './background'
import { MAX_SIZE } from './layout'
/** Measure the final frame without allocating a canvas. */
export const fitRatioSize = (
    sourceWidth: number,
    sourceHeight: number,
    targetRatio: string,
    originalResolution = false,
) => {
    const ratio = targetRatio.split(':').map(Number)
    if (ratio.length !== 2 || ratio.some((value) => !Number.isFinite(value) || value <= 0)) {
        throw new Error('Invalid target ratio')
    }
    const unit = Math.floor(MAX_SIZE / Math.max(ratio[0], ratio[1]))
    let width = unit * ratio[0]
    let height = unit * ratio[1]
    if (originalResolution) {
        const unit = Math.ceil(Math.max(sourceWidth / ratio[0], sourceHeight / ratio[1]))
        width = Math.ceil(unit * ratio[0])
        height = Math.ceil(unit * ratio[1])
    }
    return { width, height }
}
/** Paint the inner frame using the final outer frame's coordinates, avoiding blur seams. */
export const drawFrameBackground = (
    context: CanvasRenderingContext2D,
    photo: Photo,
    width: number,
    height: number,
    frameRatio?: string,
    originalResolution = false,
) => {
    if (!frameRatio || frameRatio === 'free') return drawPhotoBackground(context, photo, width, height)
    const size = fitRatioSize(width, height, frameRatio, originalResolution)
    const scale = originalResolution ? 1 : Math.min(size.width / width, size.height / height)
    const x = (size.width - width * scale) / 2
    const y = (size.height - height * scale) / 2
    context.save()
    context.scale(1 / scale, 1 / scale)
    context.translate(-(originalResolution ? Math.floor(x) : x), -(originalResolution ? Math.floor(y) : y))
    drawPhotoBackground(context, photo, size.width, size.height)
    context.restore()
}
/** Fit the completed photo and text frame inside the ratio without cropping or stretching. */
const fitRatio = (
    source: HTMLCanvasElement,
    targetRatio: string,
    backgroundColor: string,
    originalResolution = false,
    preserveAlpha = false,
    photo?: Photo,
): HTMLCanvasElement => {
    const size = fitRatioSize(source.width, source.height, targetRatio, originalResolution)
    const canvas = document.createElement('canvas')
    canvas.width = size.width
    canvas.height = size.height
    const scale = originalResolution ? 1 : Math.min(canvas.width / source.width, canvas.height / source.height)
    const width = source.width * scale
    const height = source.height * scale
    const context = canvas.getContext('2d')!
    if (photo) drawPhotoBackground(context, photo, canvas.width, canvas.height)
    else {
        context.fillStyle = backgroundColor
        context.fillRect(0, 0, canvas.width, canvas.height)
    }
    const x = (canvas.width - width) / 2
    const y = (canvas.height - height) / 2
    const drawX = originalResolution ? Math.floor(x) : x
    const drawY = originalResolution ? Math.floor(y) : y
    if (preserveAlpha) {
        context.beginPath()
        context.rect(drawX, drawY, width, height)
        context.clip()
        context.globalCompositeOperation = 'copy'
    }
    context.drawImage(source, drawX, drawY, width, height)
    return canvas
}
export default fitRatio

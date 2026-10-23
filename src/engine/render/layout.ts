import { photoAppearance } from './background'
import { drawFrameBackground } from './outer-ratio'
import Photo from '../../domain/photo'
import { drawPhoto, photoSize } from './raster'
import { finalRatioGeometry } from '../geometry/final-frame'
export const MAX_SIZE = 4096 // Mobile Safari canvas limit used by the existing exporter.
const backgroundColors = new WeakMap<HTMLCanvasElement, string>()
export const getBackgroundColor = (canvas: HTMLCanvasElement): string | undefined => backgroundColors.get(canvas)
const frameScales = new WeakMap<HTMLCanvasElement, number>()
const footerScales = new WeakMap<HTMLCanvasElement, number>()
export const getFrameScale = (canvas: HTMLCanvasElement) => frameScales.get(canvas) ?? 1
export const setFrameScale = (canvas: HTMLCanvasElement, scale: number) => frameScales.set(canvas, scale)
/** Theme dimensions use the existing design coordinates; rasterize text at native resolution. */
export const themeContext = (canvas: HTMLCanvasElement, footer = true) => {
    const scale = getFrameScale(canvas) * (footer ? (footerScales.get(canvas) ?? 1) : 1)
    const context = canvas.getContext('2d')!
    context.setTransform(scale, 0, 0, scale, 0, 0)
    return {
        context,
        width: canvas.width / scale,
        height: canvas.height / scale,
    }
}
export interface SandboxOptions {
    footerScale?: number
    backgroundColor: string
    padding: {
        top: number
        bottom: number
        left: number
        right: number
    }
    targetRatio: string
    frameRatio?: string
    notCroppedMode: boolean
    originalResolution?: boolean
    preserveAlpha?: boolean
}
export const measureSandbox = (photo: Photo, options: SandboxOptions) => {
    const footerFactor = options.footerScale ?? 1
    if (!Number.isFinite(footerFactor) || footerFactor <= 0) throw new Error('Invalid EXIF scale')
    options = {
        ...options,
        padding: {
            ...options.padding,
            bottom: options.padding.bottom * footerFactor,
        },
    }
    const image = photoSize(photo)
    if (photo.edit.finalRatio) {
        const geometry = finalRatioGeometry(photo.edit.finalRatio, options.padding.bottom)
        const width = options.originalResolution ? image.width : geometry.width
        const height = options.originalResolution ? (image.width / geometry.rw) * geometry.rh : geometry.height
        if (!Number.isInteger(height)) throw new Error('Final crop must align with the output ratio')
        const photoHeight = options.originalResolution ? image.height : height - geometry.bottom
        if (photoHeight > height) throw new Error('Invalid final crop')
        return {
            width,
            height,
            frameScale: width / geometry.width,
            clip: { x: 0, y: 0, width, height: photoHeight },
            photo: { x: 0, y: 0, width, height: photoHeight },
        }
    }
    const { targetRatio, notCroppedMode } = options
    let { top, bottom, left, right } = options.padding
    if ([top, bottom, left, right].some((value) => !Number.isFinite(value) || value < 0))
        throw new Error('Invalid frame padding')
    const canvas = { width: 0, height: 0 }
    let frameScale = 1
    if (targetRatio === 'free') {
        const scale = Math.min((MAX_SIZE - left - right) / image.width, (MAX_SIZE - top - bottom) / image.height)
        canvas.width = image.width * scale + left + right
        canvas.height = image.height * scale + top + bottom
    } else {
        const ratio = targetRatio.split(':').map(Number)
        if (ratio.length !== 2 || ratio.some((value) => !Number.isFinite(value) || value <= 0))
            throw new Error('Invalid target ratio')
        const unit = Math.floor(MAX_SIZE / Math.max(ratio[0], ratio[1]))
        canvas.width = unit * ratio[0]
        canvas.height = unit * ratio[1]
    }
    canvas.width = Math.floor(canvas.width)
    canvas.height = Math.floor(canvas.height)
    let width = canvas.width - left - right
    let height = canvas.height - top - bottom
    if (![canvas.width, canvas.height, width, height].every((value) => Number.isFinite(value) && value > 0))
        throw new Error('Frame padding leaves no room for the photo')
    if (options.originalResolution) {
        // Extend the frame rather than resize/crop the photo. Integer placement preserves source pixels.
        frameScale = Math.max(image.width / width, image.height / height)
        left = Math.round(left * frameScale)
        right = Math.round(right * frameScale)
        top = Math.round(top * frameScale)
        bottom = Math.round(bottom * frameScale)
        width = targetRatio === 'free' ? image.width : Math.max(image.width, Math.ceil(width * frameScale))
        height = targetRatio === 'free' ? image.height : Math.max(image.height, Math.ceil(height * frameScale))
        canvas.width = width + left + right
        canvas.height = height + top + bottom
        if (targetRatio !== 'free') {
            const [rw, rh] = targetRatio.split(':').map(Number)
            const unit = Math.ceil(Math.max(canvas.width / rw, canvas.height / rh))
            canvas.width = Math.ceil(unit * rw)
            canvas.height = Math.ceil(unit * rh)
            width = canvas.width - left - right
            height = canvas.height - top - bottom
        }
    }
    const scale = options.originalResolution
        ? 1
        : targetRatio === 'free' || notCroppedMode
          ? Math.min(width / image.width, height / image.height)
          : Math.max(width / image.width, height / image.height)
    const imageWidth = image.width * scale
    const imageHeight = image.height * scale
    const x = left + (width - imageWidth) / 2
    const y = top + (height - imageHeight) / 2
    return {
        width: canvas.width,
        height: canvas.height,
        frameScale,
        clip: { x: left, y: top, width, height },
        photo: {
            x: options.originalResolution ? Math.floor(x) : x,
            y: options.originalResolution ? Math.floor(y) : y,
            width: imageWidth,
            height: imageHeight,
        },
    }
}
const sandbox = (photo: Photo, options: SandboxOptions): HTMLCanvasElement => {
    const layout = measureSandbox(photo, options)
    const canvas = document.createElement('canvas')
    canvas.width = layout.width
    canvas.height = layout.height
    backgroundColors.set(canvas, photoAppearance(photo).color)
    setFrameScale(canvas, layout.frameScale)
    footerScales.set(canvas, options.footerScale ?? 1)
    const context = canvas.getContext('2d')!
    drawFrameBackground(context, photo, canvas.width, canvas.height, options.frameRatio, options.originalResolution)
    context.save()
    context.beginPath()
    context.rect(layout.clip.x, layout.clip.y, layout.clip.width, layout.clip.height)
    context.clip()
    if (options.preserveAlpha) context.globalCompositeOperation = 'copy'
    drawPhoto(context, photo, layout.photo.x, layout.photo.y, layout.photo.width, layout.photo.height)
    context.restore()
    return canvas
}
export default sandbox

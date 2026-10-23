import type Photo from '../../domain/photo'
export const BACKGROUND_PRESETS = [
    { id: 'white', color: '#ffffff', label: '화이트' },
    { id: 'black', color: '#000000', label: '블랙' },
    { id: 'ivory', color: '#f5f0e6', label: '아이보리' },
    { id: 'sand', color: '#dfc9a6', label: '샌드' },
    { id: 'gray', color: '#e2e4e7', label: '라이트 그레이' },
    { id: 'slate', color: '#475569', label: '슬레이트' },
    { id: 'charcoal', color: '#27272a', label: '차콜' },
    { id: 'navy', color: '#172554', label: '네이비' },
    { id: 'blue', color: '#dbeafe', label: '파스텔 블루' },
    { id: 'teal', color: '#134e4a', label: '딥 틸' },
    { id: 'mint', color: '#d1fae5', label: '민트' },
    { id: 'olive', color: '#4d572f', label: '올리브' },
    { id: 'lavender', color: '#ede9fe', label: '라벤더' },
    { id: 'rose', color: '#ffe4e6', label: '로즈' },
    { id: 'burgundy', color: '#671c35', label: '버건디' },
    { id: 'terracotta', color: '#a84732', label: '테라코타' },
] as const
export type PhotoBackground = (typeof BACKGROUND_PRESETS)[number]['id'] | 'blur'
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminance = (hex: string) =>
    rgb(hex)
        .map((v) => {
            const s = v / 255
            return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
        })
        .reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0)
export const contrast = (a: string, b: string) => {
    const [x, y] = [luminance(a), luminance(b)]
    return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}
export const colorsForBackground = (color: string) => {
    const dark = contrast(color, '#ffffff') > contrast(color, '#000000')
    const primary = dark ? '#ffffff' : '#000000'
    const muted = dark ? '#dddddd' : '#444444'
    return {
        color,
        dark,
        primary,
        secondary: contrast(color, muted) >= 4.5 ? muted : primary,
    }
}
// Only the decorative background is downsampled. Source pixels and edit data are never changed.
// A real separable Gaussian kernel works in browsers without Canvas filter support.
const blurred = new WeakMap<
    HTMLImageElement,
    {
        canvas: HTMLCanvasElement
        light: boolean
    }
>()
const blurredOriginal = (photo: Photo) => {
    const cached = blurred.get(photo.image)
    if (cached) return cached
    const canvas = document.createElement('canvas')
    const width = photo.image.naturalWidth || photo.image.width
    const height = photo.image.naturalHeight || photo.image.height
    const scale = Math.min(1, 256 / Math.max(width, height))
    canvas.width = Math.max(1, Math.round(width * scale))
    canvas.height = Math.max(1, Math.round(height * scale))
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(photo.image, 0, 0, canvas.width, canvas.height)
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height)
    let brightness = 0
    for (let i = 0; i < data.data.length; i += 4)
        brightness += data.data[i] * 0.2126 + data.data[i + 1] * 0.7152 + data.data[i + 2] * 0.0722
    const light = brightness / (canvas.width * canvas.height) >= 140
    const radius = 24
    const kernel = Array.from({ length: radius * 2 + 1 }, (_, i) => Math.exp(-((i - radius) ** 2) / (2 * 8 ** 2)))
    const total = kernel.reduce((a, b) => a + b, 0)
    const temp = new Float32Array(data.data.length)
    for (let pass = 0; pass < 2; pass++) {
        const source = pass === 0 ? data.data : temp
        const target = pass === 0 ? temp : data.data
        for (let y = 0; y < canvas.height; y++)
            for (let x = 0; x < canvas.width; x++) {
                const offset = (y * canvas.width + x) * 4
                for (let channel = 0; channel < 3; channel++) {
                    let sum = 0
                    for (let k = -radius; k <= radius; k++) {
                        const sx = pass === 0 ? Math.max(0, Math.min(canvas.width - 1, x + k)) : x
                        const sy = pass === 1 ? Math.max(0, Math.min(canvas.height - 1, y + k)) : y
                        sum += source[(sy * canvas.width + sx) * 4 + channel] * kernel[k + radius]
                    }
                    target[offset + channel] = sum / total
                }
                target[offset + 3] = 255
            }
    }
    ctx.putImageData(data, 0, 0)
    const result = { canvas, light }
    blurred.set(photo.image, result)
    return result
}
export const photoAppearance = (photo: Photo) => {
    if (photo.background === 'blur') {
        const { light } = blurredOriginal(photo)
        // These bounds cover every blurred pixel after the protective tint, not only the average.
        return colorsForBackground(light ? '#b8b8b8' : '#595959')
    }
    return colorsForBackground(BACKGROUND_PRESETS.find((p) => p.id === photo.background)?.color ?? '#ffffff')
}
export const drawPhotoBackground = (ctx: CanvasRenderingContext2D, photo: Photo, width: number, height: number) => {
    ctx.save()
    ctx.fillStyle = photoAppearance(photo).color
    ctx.fillRect(0, 0, width, height)
    if (photo.background === 'blur') {
        const { canvas, light } = blurredOriginal(photo)
        const scale = Math.max(width / canvas.width, height / canvas.height)
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(
            canvas,
            (width - canvas.width * scale) / 2,
            (height - canvas.height * scale) / 2,
            canvas.width * scale,
            canvas.height * scale,
        )
        ctx.fillStyle = light ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.65)'
        ctx.fillRect(0, 0, width, height)
    }
    ctx.restore()
}
/** Protect text drawn over the photo itself, where a frame palette alone cannot ensure contrast. */
export const drawThemeText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, overPhoto = false) => {
    if (overPhoto) {
        ctx.save()
        ctx.strokeStyle = ctx.fillStyle === '#000000' || ctx.fillStyle === '#444444' ? '#ffffff' : '#000000'
        ctx.lineWidth = Math.max(2, (Number(ctx.font.match(/([\d.]+)px/)?.[1]) || 50) * 0.07)
        ctx.lineJoin = 'round'
        ctx.strokeText(text, x, y)
        ctx.restore()
    }
    ctx.fillText(text, x, y)
}

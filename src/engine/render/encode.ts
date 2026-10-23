import { clamp } from '../../domain/math'
import { encode } from '@jsquash/webp' // WASM-based WebP encoder/decoder - https://github.com/jamsinclair/jSquash
import { Buffer } from 'buffer'
interface ConvertOption {
    /**
     * Type of the image
     * @default 'image/webp'
     */
    type: 'image/jpeg' | 'image/webp' | 'image/png'
    /**
     * Quality of the image
     * @default 92
     * @range 1 ~ 100
     */
    quality: number
}
/**
 * Convert canvas to base64 string
 * @param canvas
 * @returns Base64 string
 */
export default async function convert(canvas: HTMLCanvasElement, options: ConvertOption): Promise<string> {
    if (options.type === 'image/png' || options.type === 'image/jpeg') {
        const data = canvas.toDataURL(
            options.type,
            options.type === 'image/png' ? undefined : clamp(options.quality, 1, 100) / 100,
        )
        if (!data.startsWith(`data:${options.type};base64,`))
            throw new Error('The browser cannot encode this image at its original resolution')
        return data
    }
    const quality = clamp(options.quality, 1, 100)
    if (options.type === 'image/webp') {
        if (typeof window !== 'undefined') {
            const { ensureWebpEncoder } = await import('./webp-browser')
            await ensureWebpEncoder()
        }
        const arrayBuffer = await encode(canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height), {
            quality,
        })
        return `data:image/webp;base64,${Buffer.from(arrayBuffer).toString('base64')}`
    }
    throw new Error('Unsupported image type')
}

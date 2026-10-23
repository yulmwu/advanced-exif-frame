import { createCanvas, Image } from '@napi-rs/canvas'
import type { PhotoRecord } from '../src/domain/photo'
import { originalEdit } from '../src/engine/geometry/crop'
const storage = new Map<string, string>()
Object.assign(globalThis, {
    localStorage: {
        getItem: (k: string) => storage.get(k) ?? null,
        setItem: (k: string, v: string) => storage.set(k, v),
        removeItem: (k: string) => storage.delete(k),
    },
    Image,
    FontFace: class {
        async load() {
            return this
        }
    },
    document: {
        createElement: () => createCanvas(1, 1),
        fonts: { ready: Promise.resolve(), add() {} },
    },
})
export function fixture(width = 121, height = 163): PhotoRecord {
    const image = createCanvas(width, height),
        ctx = image.getContext('2d')
    for (let y = 0; y < height; y++)
        for (let x = 0; x < width; x++) {
            ctx.fillStyle = `rgb(${x % 230},${y % 210},${(x + y) % 200})`
            ctx.fillRect(x, y, 1, 1)
        }
    return {
        id: crypto.randomUUID(),
        file: { name: 'original.jpg' } as File,
        image: image as unknown as HTMLImageElement,
        imageBase64: image.toDataURL('image/png'),
        thumbnail: '',
        metadata: {
            make: 'Acme',
            model: 'Camera 1',
            lensModel: '35mm Lens',
            focalLength: '35mm',
            iso: 'ISO800',
            fNumber: 'F2.8',
            exposureTime: '1/125s',
            takenAt: '2026-10-17T21:32:48',
        },
        background: 'white',
        edit: originalEdit(),
    }
}
export const pixels = (canvas: any) =>
    Buffer.from(canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data)
export { storage }

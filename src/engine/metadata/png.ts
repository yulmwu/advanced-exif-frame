import { Buffer } from 'buffer'
import { normalizedExif } from './jpeg'
/** PNG eXIf stores the TIFF payload, excluding the JPEG APP1 and Exif headers. */
export default function restoreExportPngExif(original: string, output: string, width: number, height: number): string {
    const exif = normalizedExif(original, width, height)
    if (!exif || !output.startsWith('data:image/png;base64,')) return output
    const png = Buffer.from(output.slice(output.indexOf(',') + 1), 'base64')
    if (png.length < 33 || png.readUInt32BE(8) !== 13 || png.toString('ascii', 12, 16) !== 'IHDR') return output
    const payload = exif.subarray(10)
    const chunk = Buffer.alloc(payload.length + 12)
    chunk.writeUInt32BE(payload.length, 0)
    chunk.write('eXIf', 4, 'ascii')
    chunk.set(payload, 8)
    let crc = 0xffffffff
    for (const byte of chunk.subarray(4, -4)) {
        crc ^= byte
        for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
    }
    chunk.writeUInt32BE((crc ^ 0xffffffff) >>> 0, chunk.length - 4)
    return 'data:image/png;base64,' + Buffer.concat([png.subarray(0, 33), chunk, png.subarray(33)]).toString('base64')
}

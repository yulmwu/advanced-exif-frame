/** Read JPEG/PNG EXIF and normalize orientation/dimensions to the rendered pixels. */
export function normalizedExif(original: string, width: number, height: number): Uint8Array | undefined {
    if (!/^data:image\/(jpeg|jpg|png);base64,/i.test(original)) return undefined
    const source = atob(original.slice(original.indexOf(',') + 1))
    let exif: Uint8Array | undefined
    const png = source.startsWith('\x89PNG\r\n\x1a\n')
    if (!png && (source.charCodeAt(0) !== 0xff || source.charCodeAt(1) !== 0xd8)) return undefined
    let offset = png ? 8 : 2
    while (offset + 4 <= source.length) {
        if (png) {
            if (offset + 12 > source.length) break
            const length =
                source.charCodeAt(offset) * 0x1000000 +
                source.charCodeAt(offset + 1) * 0x10000 +
                source.charCodeAt(offset + 2) * 0x100 +
                source.charCodeAt(offset + 3)
            if (offset + length + 12 > source.length) break
            if (source.slice(offset + 4, offset + 8) === 'eXIf') {
                // A JPEG APP1 segment can hold at most 65527 bytes of TIFF data.
                if (length > 65527) return undefined
                exif = new Uint8Array(length + 10)
                exif.set([0xff, 0xe1, (length + 8) >>> 8, (length + 8) & 0xff, 69, 120, 105, 102, 0, 0])
                exif.set(
                    Uint8Array.from(source.slice(offset + 8, offset + 8 + length), (char) => char.charCodeAt(0)),
                    10,
                )
                break
            }
            offset += length + 12
            continue
        }
        if (source.charCodeAt(offset) !== 0xff) break
        const marker = source.charCodeAt(offset + 1)
        if (marker === 0xda || marker === 0xd9) break
        const length = source.charCodeAt(offset + 2) * 256 + source.charCodeAt(offset + 3)
        if (length < 2 || offset + length + 2 > source.length) break
        if (marker === 0xe1 && source.slice(offset + 4, offset + 10) === 'Exif\0\0') {
            exif = Uint8Array.from(source.slice(offset, offset + length + 2), (char) => char.charCodeAt(0))
            break
        }
        offset += length + 2
    }
    if (!exif || exif.length < 18) return undefined
    const view = new DataView(exif.buffer)
    const tiff = 10
    const littleEndian = view.getUint16(tiff) === 0x4949
    if (!littleEndian && view.getUint16(tiff) !== 0x4d4d) return undefined
    if (view.getUint16(tiff + 2, littleEndian) !== 42) return undefined
    const visited = new Set<number>()
    const updateIfd = (relativeOffset: number, primary = false) => {
        const start = tiff + relativeOffset
        if (relativeOffset < 8 || start + 2 > view.byteLength || visited.has(start)) return
        const count = view.getUint16(start, littleEndian)
        const end = start + 2 + count * 12
        if (end + 4 > view.byteLength) return
        visited.add(start)
        for (let index = 0; index < count; index++) {
            const entry = start + 2 + index * 12
            const tag = view.getUint16(entry, littleEndian)
            const type = view.getUint16(entry + 2, littleEndian)
            const entries = view.getUint32(entry + 4, littleEndian)
            if (tag === 0x8769 && type === 4 && entries === 1) updateIfd(view.getUint32(entry + 8, littleEndian))
            const value =
                tag === 0x0112 || tag === 0xa001
                    ? 1
                    : tag === 0x0100 || tag === 0xa002
                      ? width
                      : tag === 0x0101 || tag === 0xa003
                        ? height
                        : null
            if (value !== null && entries === 1) {
                if (type === 3) view.setUint16(entry + 8, value, littleEndian)
                if (type === 4) view.setUint32(entry + 8, value, littleEndian)
            }
        }
        // Drop the old embedded thumbnail: it depicts the unedited original.
        if (primary) {
            const thumbnailIfd = tiff + view.getUint32(end, littleEndian)
            if (thumbnailIfd >= tiff + 8 && thumbnailIfd + 2 < view.byteLength) {
                const thumbnailCount = view.getUint16(thumbnailIfd, littleEndian)
                let thumbnailStart = 0
                let thumbnailLength = 0
                if (thumbnailIfd + 2 + thumbnailCount * 12 + 4 <= view.byteLength) {
                    for (let index = 0; index < thumbnailCount; index++) {
                        const entry = thumbnailIfd + 2 + index * 12
                        const tag = view.getUint16(entry, littleEndian)
                        if (tag === 0x0201) thumbnailStart = tiff + view.getUint32(entry + 8, littleEndian)
                        if (tag === 0x0202) thumbnailLength = view.getUint32(entry + 8, littleEndian)
                    }
                    if (
                        thumbnailStart >= tiff + 8 &&
                        thumbnailLength > 0 &&
                        thumbnailStart + thumbnailLength <= exif!.length
                    ) {
                        exif!.fill(0, thumbnailStart, thumbnailStart + thumbnailLength)
                    }
                }
            }
            view.setUint32(end, 0, littleEndian)
        }
    }
    updateIfd(view.getUint32(tiff + 4, littleEndian), true)
    if (visited.size === 0) return undefined
    return exif
}
/** Copy normalized EXIF without changing any encoded image bytes. */
export default function restoreExportExif(original: string, output: string, width: number, height: number): string {
    const exif = normalizedExif(original, width, height)
    if (!exif) return output
    const jpeg = atob(output.slice(output.indexOf(',') + 1))
    if (jpeg.charCodeAt(0) !== 0xff || jpeg.charCodeAt(1) !== 0xd8) return output
    let header = ''
    for (const byte of exif) header += String.fromCharCode(byte)
    return output.slice(0, output.indexOf(',') + 1) + btoa(jpeg.slice(0, 2) + header + jpeg.slice(2))
}

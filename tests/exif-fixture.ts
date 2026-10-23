// Synthetic TIFF fixture retained from the EXIF Frame regression suite.
export function exifFixture(littleEndian: boolean, orientation: number) {
    const bytes = new Uint8Array(150)
    const view = new DataView(bytes.buffer)
    bytes.set([0xff, 0xe1, 0, 148, 69, 120, 105, 102, 0, 0])
    const tiff = 10
    view.setUint16(tiff, littleEndian ? 0x4949 : 0x4d4d)
    view.setUint16(tiff + 2, 42, littleEndian)
    view.setUint32(tiff + 4, 8, littleEndian)
    function entry(position: number, tag: number, type: number, value: number) {
        view.setUint16(position, tag, littleEndian)
        view.setUint16(position + 2, type, littleEndian)
        view.setUint32(position + 4, 1, littleEndian)
        if (type === 3) view.setUint16(position + 8, value, littleEndian)
        else view.setUint32(position + 8, value, littleEndian)
    }
    view.setUint16(18, 4, littleEndian)
    entry(20, 0x0112, 3, orientation)
    entry(32, 0x0100, 4, 6000)
    entry(44, 0x0101, 4, 4000)
    entry(56, 0x8769, 4, 62)
    view.setUint32(68, 92, littleEndian)
    view.setUint16(72, 2, littleEndian)
    entry(74, 0xa002, 4, 6000)
    entry(86, 0xa003, 4, 4000)
    view.setUint16(102, 2, littleEndian)
    entry(104, 0x0201, 4, 122)
    entry(116, 0x0202, 4, 10)
    bytes.fill(0x7f, 132, 142)
    return bytes
}

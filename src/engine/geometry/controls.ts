import { normalizeRotation, presetRatio, rotatedSize, type CropRect, type PhotoEdit } from './crop'
export type CropAxis = 'x' | 'y'
export const isRatioLocked = (edit: PhotoEdit) => edit.aspectRatioLocked ?? edit.preset !== 'free'
export const lockedCropRatio = (edit: PhotoEdit, width: number, height: number): number | null => {
    if (!isRatioLocked(edit)) return null
    const size = rotatedSize(width, height, edit.rotation)
    return (
        edit.lockedRatio ??
        presetRatio(edit.preset, width, height) ??
        (edit.crop.width * size.width) / (edit.crop.height * size.height)
    )
}
/** Choose the dominant direction in screen pixels, independently of the image's aspect ratio. */
export const dragAxis = (deltaX: number, deltaY: number, displayWidth: number, displayHeight: number): CropAxis =>
    Math.abs(deltaX * displayWidth) >= Math.abs(deltaY * displayHeight) ? 'x' : 'y'
/** Move along just one display axis, stopping at the actual rotated photo's edges. */
export const moveCropAxis = (
    width: number,
    height: number,
    rotation: number,
    crop: CropRect,
    axis: CropAxis,
    position: number,
): CropRect => {
    const size = rotatedSize(width, height, rotation)
    const angle = (normalizeRotation(rotation) * Math.PI) / 180
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const margin = normalizeRotation(rotation) % 90 === 0 ? 0 : Math.min(2, width / 4, height / 4)
    const cropWidth = crop.width * size.width
    const cropHeight = crop.height * size.height
    const limitX = Math.max(0, (width - margin * 2 - Math.abs(cosine) * cropWidth - Math.abs(sine) * cropHeight) / 2)
    const limitY = Math.max(0, (height - margin * 2 - Math.abs(sine) * cropWidth - Math.abs(cosine) * cropHeight) / 2)
    const dx = (crop.x + crop.width / 2 - 0.5) * size.width
    const dy = (crop.y + crop.height / 2 - 0.5) * size.height
    const sourceX = cosine * dx + sine * dy
    const sourceY = -sine * dx + cosine * dy
    let minDelta = -crop[axis]
    let maxDelta = 1 - (axis === 'x' ? crop.width : crop.height) - crop[axis]
    const constraints =
        axis === 'x'
            ? [
                  [cosine * size.width, sourceX, limitX],
                  [-sine * size.width, sourceY, limitY],
              ]
            : [
                  [sine * size.height, sourceX, limitX],
                  [cosine * size.height, sourceY, limitY],
              ]
    for (const [coefficient, center, limit] of constraints) {
        if (Math.abs(coefficient) < 1e-9) continue
        const first = (-limit - center) / coefficient
        const second = (limit - center) / coefficient
        minDelta = Math.max(minDelta, Math.min(first, second))
        maxDelta = Math.min(maxDelta, Math.max(first, second))
    }
    const delta = minDelta <= maxDelta ? Math.max(minDelta, Math.min(maxDelta, position - crop[axis])) : 0
    return { ...crop, [axis]: crop[axis] + delta }
}
export const centerCropAxis = (
    width: number,
    height: number,
    rotation: number,
    crop: CropRect,
    axis: CropAxis,
): CropRect => moveCropAxis(width, height, rotation, crop, axis, (1 - (axis === 'x' ? crop.width : crop.height)) / 2)

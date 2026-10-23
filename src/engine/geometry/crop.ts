export type CropRect = {
    x: number
    y: number
    width: number
    height: number
}
export type PhotoEdit = {
    rotation: number
    crop: CropRect
    preset: string
    aspectRatioLocked?: boolean
    lockedRatio?: number
    finalRatio?: string
    rotationReference?: {
        rotation: number
        crop: CropRect
    }
}
export const originalEdit = (): PhotoEdit => ({
    rotation: 0,
    crop: { x: 0, y: 0, width: 1, height: 1 },
    preset: 'free',
})
export const normalizeRotation = (rotation: number) => ((rotation % 360) + 360) % 360
/** Full bounding box of the original rotated about its center, including quarter turns exactly. */
export const rotatedSize = (width: number, height: number, rotation: number) => {
    const angle = (normalizeRotation(rotation) * Math.PI) / 180
    const snap = (value: number) => (Math.abs(value) < 1e-12 ? 0 : Math.abs(value))
    const cosine = snap(Math.cos(angle))
    const sine = snap(Math.sin(angle))
    return {
        width: Math.ceil(width * cosine + height * sine),
        height: Math.ceil(width * sine + height * cosine),
    }
}
/** Fit the crop inside the actual rotated photo, preserving its ratio and avoiding empty corners. */
export const constrainCrop = (width: number, height: number, rotation: number, crop: CropRect): CropRect => {
    const size = rotatedSize(width, height, rotation)
    const angle = (normalizeRotation(rotation) * Math.PI) / 180
    const cosine = Math.cos(angle)
    const sine = Math.sin(angle)
    const quarterTurn = normalizeRotation(rotation) % 90 === 0
    // Keep the interpolation footprint off the photo boundary at non-right angles.
    const margin = quarterTurn ? 0 : Math.min(2, width / 4, height / 4)
    const availableWidth = width - margin * 2
    const availableHeight = height - margin * 2
    let cropWidth = crop.width * size.width
    let cropHeight = crop.height * size.height
    const extentX = Math.abs(cosine) * cropWidth + Math.abs(sine) * cropHeight
    const extentY = Math.abs(sine) * cropWidth + Math.abs(cosine) * cropHeight
    const scale = Math.min(1, availableWidth / extentX, availableHeight / extentY)
    cropWidth *= scale
    cropHeight *= scale
    const dx = (crop.x + crop.width / 2) * size.width - size.width / 2
    const dy = (crop.y + crop.height / 2) * size.height - size.height / 2
    const limitX = Math.max(0, (availableWidth - Math.abs(cosine) * cropWidth - Math.abs(sine) * cropHeight) / 2)
    const limitY = Math.max(0, (availableHeight - Math.abs(sine) * cropWidth - Math.abs(cosine) * cropHeight) / 2)
    const sourceX = Math.max(-limitX, Math.min(limitX, cosine * dx + sine * dy))
    const sourceY = Math.max(-limitY, Math.min(limitY, -sine * dx + cosine * dy))
    const centerX = size.width / 2 + cosine * sourceX - sine * sourceY
    const centerY = size.height / 2 + sine * sourceX + cosine * sourceY
    return {
        x: Math.max(0, (centerX - cropWidth / 2) / size.width),
        y: Math.max(0, (centerY - cropHeight / 2) / size.height),
        width: cropWidth / size.width,
        height: cropHeight / size.height,
    }
}
export const cropPixels = (width: number, height: number, edit: PhotoEdit) => {
    const size = rotatedSize(width, height, edit.rotation)
    const crop = constrainCrop(width, height, edit.rotation, edit.crop)
    const quarterTurn = normalizeRotation(edit.rotation) % 90 === 0
    const roundStart = quarterTurn ? Math.round : Math.ceil
    const x = Math.max(0, Math.min(size.width - 1, roundStart(crop.x * size.width - (quarterTurn ? 0 : 1e-9))))
    const y = Math.max(0, Math.min(size.height - 1, roundStart(crop.y * size.height - (quarterTurn ? 0 : 1e-9))))
    return {
        x,
        y,
        width: Math.max(
            1,
            Math.min(
                size.width - x,
                quarterTurn
                    ? Math.round(crop.width * size.width)
                    : Math.floor((crop.x + crop.width) * size.width + 1e-9) - x,
            ),
        ),
        height: Math.max(
            1,
            Math.min(
                size.height - y,
                quarterTurn
                    ? Math.round(crop.height * size.height)
                    : Math.floor((crop.y + crop.height) * size.height + 1e-9) - y,
            ),
        ),
    }
}
export const cropForRatio = (width: number, height: number, ratio: number): CropRect => {
    const cropWidth = Math.min(1, ratio / (width / height))
    const cropHeight = Math.min(1, width / height / ratio)
    return {
        x: (1 - cropWidth) / 2,
        y: (1 - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
    }
}
export const presetRatio = (preset: string, width: number, height: number): number | null => {
    if (preset === 'free') return null
    if (preset === 'original') return width / height
    const [w, h] = preset.split(':').map(Number)
    return Number.isFinite(w / h) && w > 0 && h > 0 ? w / h : null
}
/** Resize around the selection's center, keeping any selected aspect ratio and staying inside the image. */
export const resizeCrop = (
    crop: CropRect,
    axis: 'width' | 'height',
    value: number,
    width: number,
    height: number,
    ratio: number | null,
): CropRect => {
    let nextWidth = axis === 'width' ? Math.max(1 / width, Math.min(1, value)) : crop.width
    let nextHeight = axis === 'height' ? Math.max(1 / height, Math.min(1, value)) : crop.height
    if (ratio) {
        const normalizedRatio = (Math.max(1 / height, Math.min(width, ratio)) * height) / width
        if (axis === 'width') {
            nextWidth = Math.max(nextWidth, normalizedRatio / height)
            nextHeight = nextWidth / normalizedRatio
        } else {
            nextHeight = Math.max(nextHeight, 1 / (width * normalizedRatio))
            nextWidth = nextHeight * normalizedRatio
        }
        const scale = Math.min(1, 1 / nextWidth, 1 / nextHeight)
        nextWidth *= scale
        nextHeight *= scale
    }
    return {
        x: Math.max(0, Math.min(1 - nextWidth, crop.x + (crop.width - nextWidth) / 2)),
        y: Math.max(0, Math.min(1 - nextHeight, crop.y + (crop.height - nextHeight) / 2)),
        width: nextWidth,
        height: nextHeight,
    }
}
/** Keep the chosen ratio while automatically trimming rotation edges, without cumulative shrinking. */
export const setRotation = (edit: PhotoEdit, rotation: number, width: number, height: number): PhotoEdit => {
    const reference = edit.rotationReference ?? {
        rotation: edit.rotation,
        crop: { ...edit.crop },
    }
    const previousSize = rotatedSize(width, height, reference.rotation)
    const nextRotation = normalizeRotation(rotation)
    const nextSize = rotatedSize(width, height, nextRotation)
    const previousAngle = (reference.rotation * Math.PI) / 180
    const nextAngle = (nextRotation * Math.PI) / 180
    const dx = (reference.crop.x + reference.crop.width / 2 - 0.5) * previousSize.width
    const dy = (reference.crop.y + reference.crop.height / 2 - 0.5) * previousSize.height
    const sourceX = Math.cos(previousAngle) * dx + Math.sin(previousAngle) * dy
    const sourceY = -Math.sin(previousAngle) * dx + Math.cos(previousAngle) * dy
    const cropWidth = reference.crop.width * previousSize.width
    const locked = edit.aspectRatioLocked ?? edit.preset !== 'free'
    const ratio =
        (locked ? (edit.lockedRatio ?? presetRatio(edit.preset, width, height)) : null) ??
        cropWidth / (reference.crop.height * previousSize.height)
    const cropHeight = cropWidth / ratio
    const centerX = nextSize.width / 2 + Math.cos(nextAngle) * sourceX - Math.sin(nextAngle) * sourceY
    const centerY = nextSize.height / 2 + Math.sin(nextAngle) * sourceX + Math.cos(nextAngle) * sourceY
    const requested = {
        x: (centerX - cropWidth / 2) / nextSize.width,
        y: (centerY - cropHeight / 2) / nextSize.height,
        width: cropWidth / nextSize.width,
        height: cropHeight / nextSize.height,
    }
    return {
        ...edit,
        rotation: nextRotation,
        crop: constrainCrop(width, height, nextRotation, requested),
        rotationReference: reference,
    }
}
/** Rotate the selection with the photo so turning never discards an existing crop. */
export const rotateEdit = (edit: PhotoEdit, clockwise: boolean): PhotoEdit => {
    const { x, y, width, height } = edit.crop
    return {
        rotation: normalizeRotation(edit.rotation + (clockwise ? 90 : -90)),
        crop: clockwise
            ? { x: 1 - y - height, y: x, width: height, height: width }
            : { x: y, y: 1 - x - width, width: height, height: width },
        preset: edit.preset.includes(':') ? edit.preset.split(':').reverse().join(':') : edit.preset,
    }
}

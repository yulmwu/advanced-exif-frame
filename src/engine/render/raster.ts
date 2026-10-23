import type Photo from '../../domain/photo'
import { cropPixels, normalizeRotation, rotatedSize, type PhotoEdit } from '../geometry/crop'
export const photoSize = (photo: Photo, edit: PhotoEdit = photo.edit) =>
    cropPixels(photo.image.naturalWidth || photo.image.width, photo.image.naturalHeight || photo.image.height, edit)
/** Draw directly from the original decoded image. Never encode an intermediate edited photo. */
export const drawPhoto = (
    context: CanvasRenderingContext2D,
    photo: Photo,
    x: number,
    y: number,
    width: number,
    height: number,
    edit: PhotoEdit = photo.edit,
) => {
    const image = photo.image
    const originalWidth = image.naturalWidth || image.width
    const originalHeight = image.naturalHeight || image.height
    const crop = photoSize(photo, edit)
    context.save()
    context.translate(x, y)
    context.scale(width / crop.width, height / crop.height)
    context.beginPath()
    context.rect(0, 0, crop.width, crop.height)
    context.clip()
    context.translate(-crop.x, -crop.y)
    const rotation = normalizeRotation(edit.rotation)
    const rotated = rotatedSize(originalWidth, originalHeight, rotation)
    context.translate(rotated.width / 2, rotated.height / 2)
    context.rotate((rotation * Math.PI) / 180)
    context.translate(-originalWidth / 2, -originalHeight / 2)
    // Quarter turns at native size stay pixel exact; arbitrary angles require interpolation.
    context.imageSmoothingEnabled = rotation % 90 !== 0 || width !== crop.width || height !== crop.height
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, originalWidth, originalHeight)
    context.restore()
}
/** Show the entire rotated source behind the crop overlay; exported pixels use drawPhoto instead. */
export const drawOriginal = (
    context: CanvasRenderingContext2D,
    photo: Photo,
    width: number,
    height: number,
    rotation: number,
) => {
    const imageWidth = photo.image.naturalWidth || photo.image.width
    const imageHeight = photo.image.naturalHeight || photo.image.height
    const size = rotatedSize(imageWidth, imageHeight, rotation)
    context.save()
    context.scale(width / size.width, height / size.height)
    context.translate(size.width / 2, size.height / 2)
    context.rotate((normalizeRotation(rotation) * Math.PI) / 180)
    context.imageSmoothingQuality = 'high'
    context.drawImage(photo.image, -imageWidth / 2, -imageHeight / 2, imageWidth, imageHeight)
    context.restore()
}

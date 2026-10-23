import { drawFrameBackground } from '../../render/outer-ratio'
import Photo from '../../../domain/photo'
import { ThemeFunc } from '../types'
import { ThemeOption } from '../../../domain/theme'
import { MAX_SIZE, setFrameScale } from '../../render/layout'
import { drawPhoto, photoSize } from '../../render/raster'
const cinemascopeOptions: ThemeOption[] = []
const cinemascopeFunc: ThemeFunc = (photo: Photo, _input, store) => {
    const canvas = document.createElement('canvas')
    const image = photoSize(photo)
    if (store.originalResolution) {
        canvas.width = Math.max(image.width, Math.ceil(image.height * 2.35))
        const pictureHeight = Math.max(image.height, Math.ceil(canvas.width / 2.35))
        const letterbox = Math.round((pictureHeight * 0.311875) / 2)
        canvas.height = pictureHeight + letterbox * 2
        setFrameScale(canvas, canvas.width / MAX_SIZE)
        const context = canvas.getContext('2d')!
        drawFrameBackground(context, photo, canvas.width, canvas.height, store.frameRatio, store.originalResolution)
        context.save()
        if (store.losslessExport) context.globalCompositeOperation = 'copy'
        drawPhoto(
            context,
            photo,
            Math.floor((canvas.width - image.width) / 2),
            letterbox + Math.floor((pictureHeight - image.height) / 2),
            image.width,
            image.height,
        )
        context.restore()
        return canvas
    }
    canvas.width = MAX_SIZE
    canvas.height = MAX_SIZE * (1 / 2.35) * 1.311875
    const letterbox = (canvas.height - MAX_SIZE * (1 / 2.35)) / 2
    const ratio = image.height / image.width
    const ctx = canvas.getContext('2d')!
    drawFrameBackground(ctx, photo, canvas.width, canvas.height, store.frameRatio, store.originalResolution)
    ctx.save()
    ctx.beginPath()
    ctx.rect(0, letterbox, canvas.width, canvas.height - letterbox * 2)
    ctx.clip()
    drawPhoto(ctx, photo, 0, -(canvas.width * ratio - canvas.height) / 2, canvas.width, canvas.width * ratio)
    ctx.restore()
    return canvas
}
export { cinemascopeFunc, cinemascopeOptions }

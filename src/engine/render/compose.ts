import Photo from '../../domain/photo'
import resize from './resize'
import { RenderSettings } from '../../domain/settings'
import { ThemeFunc } from '../themes/types'
import { ThemeOptionInput } from '../../domain/theme'
import fitRatio from './outer-ratio'
import { getBackgroundColor, getFrameScale } from './layout'
import free from './release'
import { usesOriginalResolution } from './format'
import { photoAppearance, drawThemeText } from './background'
import { finalFooterHeight, finalThemeInput, fitFinalRatio } from '../geometry/final-frame'
import sandbox from './layout'
const render = async (
    func: ThemeFunc,
    photo: Photo,
    option: ThemeOptionInput,
    store: RenderSettings,
): Promise<HTMLCanvasElement> => {
    const originalResolution = usesOriginalResolution(store)
    let settings = originalResolution ? { ...store, originalResolution: true, notCroppedMode: true } : store
    if (photo.edit.finalRatio) {
        option = finalThemeInput(store.selectedThemeName, option)
        const edit = fitFinalRatio(
            photo.edit,
            photo.image.naturalWidth || photo.image.width,
            photo.image.naturalHeight || photo.image.height,
            finalFooterHeight(store.selectedThemeName, option),
        )
        photo = Object.create(Object.getPrototypeOf(photo), Object.getOwnPropertyDescriptors(photo))
        photo.edit = edit
        settings = {
            ...settings,
            ratio: edit.finalRatio!,
            frameRatio: undefined,
            notCroppedMode: false,
            applyRatioToText: false,
        }
    }
    const applyRatioToFrame =
        !photo.edit.finalRatio && settings.ratio !== 'free' && settings.notCroppedMode && settings.applyRatioToText
    // Cinema Scope's letterboxes are intentionally suppressed by an explicit edge-to-edge crop.
    let canvas =
        photo.edit.finalRatio && store.selectedThemeName === 'Cinema Scope'
            ? sandbox(photo, {
                  backgroundColor: photoAppearance(photo).color,
                  padding: { top: 0, bottom: 0, left: 0, right: 0 },
                  targetRatio: settings.ratio,
                  notCroppedMode: false,
                  originalResolution,
                  preserveAlpha: store.losslessExport,
              })
            : func(
                  photo,
                  option,
                  applyRatioToFrame ? { ...settings, ratio: 'free', frameRatio: settings.ratio } : settings,
              )
    canvas.getContext('2d')!.resetTransform()
    if (store.fixWatermark && store.watermark) {
        const context = canvas.getContext('2d')!
        const fontSize = 100 * getFrameScale(canvas)
        const appearance = photoAppearance(photo)
        context.fillStyle = appearance.primary
        context.shadowColor = appearance.dark ? '#000000' : '#ffffff'
        context.shadowBlur = 10 * getFrameScale(canvas)
        context.lineWidth = 5 * getFrameScale(canvas)
        context.font = `normal 500 ${fontSize}px Barlow`
        context.textAlign = 'right'
        context.textBaseline = 'bottom'
        drawThemeText(context, store.watermark, canvas.width - fontSize / 2, canvas.height - fontSize / 2, true)
        context.shadowBlur = 0
    }
    if (applyRatioToFrame) {
        const source = canvas
        canvas = fitRatio(
            source,
            store.ratio,
            getBackgroundColor(source) ?? '#000000',
            originalResolution,
            store.losslessExport,
            photo,
        )
        free(source)
    }
    if (!originalResolution && store.fixImageWidth && store.imageWidth) {
        if (photo.edit.finalRatio) {
            const [rw, rh] = photo.edit.finalRatio.split(':').map(Number)
            const unit = Math.max(1, Math.floor(Math.min(4096, store.imageWidth) / Math.max(rw, rh)))
            const source = canvas
            canvas = resize(source, unit * rw, unit * rh)
            free(source)
        } else if (canvas.width > canvas.height) {
            const targetWidth = store.imageWidth > 4096 ? 4096 : store.imageWidth
            const targetHeight = (targetWidth * canvas.height) / canvas.width
            const source = canvas
            canvas = resize(source, targetWidth, targetHeight)
            free(source)
        } else {
            const targetHeight = store.imageWidth > 4096 ? 4096 : store.imageWidth // This is a naming bug
            const targetWidth = (targetHeight * canvas.width) / canvas.height
            const source = canvas
            canvas = resize(source, targetWidth, targetHeight)
            free(source)
        }
    }
    return canvas
}
export default render

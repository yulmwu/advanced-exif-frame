import { footerScale } from '../../render/footer-size'
import { photoAppearance, drawThemeText } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import Font from '../../assets'
const simpleOptions: ThemeOption[] = [
    {
        id: 'LABEL',
        type: 'string',
        default: '@username',
        description: 'ex. @username',
    },
    {
        id: 'FONT_FAMILY',
        type: 'select',
        options: ['Barlow', ...Object.values(Font)],
        default: 'Barlow',
        description: 'ex. din-alternate-bold, digital-7, Barlow, Arial, sans-serif',
    },
    {
        id: 'PADDING_INSIDE',
        type: 'boolean',
        default: false,
        description: 'enable to use inside padding',
    },
    { id: 'PADDING_TOP', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 400, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 100, description: 'px' },
]
const simpleFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const label = (input.get('LABEL') as string).trim()
    const fontFamily = (input.get('FONT_FAMILY') as string).trim()
    const paddingInside = input.get('PADDING_INSIDE') as boolean
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    const canvas = sandbox(photo, {
        footerScale: footerScale(input),
        originalResolution: store.originalResolution,
        preserveAlpha: store.losslessExport,
        targetRatio: store.ratio,
        frameRatio: store.frameRatio,
        notCroppedMode: store.notCroppedMode,
        backgroundColor: '#ffffff',
        padding: paddingInside
            ? { top: 0, right: 0, bottom: 0, left: 0 }
            : {
                  top: paddingTop,
                  right: paddingRight,
                  bottom: paddingBottom,
                  left: paddingLeft,
              },
    })
    const { context, width: frameWidth, height: frameHeight } = themeContext(canvas)
    const fillText = (text: string, x: number, y: number) => drawThemeText(context, text, x, y, paddingInside)
    context.fillStyle = photoAppearance(photo).secondary
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.font = `300 ${40}px ${fontFamily}`
    fillText(label, frameWidth / 2, frameHeight - 60)
    context.textAlign = 'left'
    context.fillStyle = photoAppearance(photo).primary
    context.font = `700 ${100}px ${fontFamily}`
    const makerWidth = context.measureText(photo.make + ' ').width
    context.font = `300 ${100}px ${fontFamily}`
    const modelWidth = context.measureText(photo.model).width
    context.font = `700 ${100}px ${fontFamily}`
    fillText(photo.make, frameWidth / 2 - (makerWidth + modelWidth) / 2, frameHeight - paddingBottom / 2 - 100)
    context.font = `300 ${100}px ${fontFamily}`
    fillText(
        photo.model,
        frameWidth / 2 - (makerWidth + modelWidth) / 2 + makerWidth,
        frameHeight - paddingBottom / 2 - 100,
    )
    context.textAlign = 'center'
    context.fillStyle = photoAppearance(photo).secondary
    context.font = `300 ${30}px ${fontFamily}`
    fillText(photo.takenAt, frameWidth / 2, frameHeight - paddingBottom / 2 + 80)
    if (!store.disableExposureMeter) {
        context.font = `300 ${50}px ${fontFamily}`
        fillText(
            [`${photo.iso}`, `${photo.focalLength}`, `${photo.fNumber}`, `${photo.exposureTime}`]
                .filter(Boolean)
                .join(' ∙ '),
            frameWidth / 2,
            frameHeight - paddingBottom / 2,
        )
    }
    return canvas
}
export { simpleFunc, simpleOptions }

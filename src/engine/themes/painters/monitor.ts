import { footerScale } from '../../render/footer-size'
import { photoAppearance, drawThemeText } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import Font from '../../assets'
const monitorOptions: ThemeOption[] = [
    {
        id: 'BACKGROUND_COLOR',
        type: 'color',
        default: '#000000',
        description: '#ffffff is white, #000000 is black',
    },
    {
        id: 'PADDING_INSIDE',
        type: 'boolean',
        default: false,
        description: 'enable to use inside padding',
    },
    {
        id: 'COMPACT',
        type: 'boolean',
        default: false,
        description: 'enable to reduce exif text width',
    },
    { id: 'PADDING_TOP', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 0, description: 'px' },
    {
        id: 'TEXT_COLOR',
        type: 'color',
        default: '#ffffff',
        description: '#ffffff is white, #000000 is black',
    },
    {
        id: 'FONT_STYLE',
        type: 'select',
        options: ['normal', 'italic'],
        default: 'normal',
        description: 'normal or italic',
    },
    {
        id: 'FONT_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 500,
        description: '100 - 900',
    },
    { id: 'FONT_SIZE', type: 'number', default: 70, description: 'px' },
    {
        id: 'FONT_FAMILY',
        type: 'select',
        options: ['Barlow', ...Object.values(Font)],
        default: 'Barlow',
        description: 'ex. din-alternate-bold, digital-7, Barlow, Arial, sans-serif',
    },
]
const monitorFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const backgroundColor = (input.get('BACKGROUND_COLOR') as string).trim()
    const paddingInside = input.get('PADDING_INSIDE') as boolean
    const compact = input.get('COMPACT') as boolean
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    const textColor = photoAppearance(photo).primary
    const fontStyle = (input.get('FONT_STYLE') as string).trim()
    const fontWeight = input.get('FONT_WEIGHT') as number
    const fontSize = input.get('FONT_SIZE') as number
    const fontFamily = (input.get('FONT_FAMILY') as string).trim()
    const canvas = sandbox(photo, {
        footerScale: footerScale(input),
        originalResolution: store.originalResolution,
        preserveAlpha: store.losslessExport,
        targetRatio: store.ratio,
        frameRatio: store.frameRatio,
        notCroppedMode: store.notCroppedMode,
        backgroundColor: backgroundColor,
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
    context.fillStyle = textColor
    context.textBaseline = 'middle'
    context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    context.textAlign = 'center'
    if (compact) {
        const targetWidth = frameWidth / 2
        if (!store.disableExposureMeter) {
            fillText(
                `${photo.fNumber?.replace('f/', 'F')}`,
                (frameWidth - targetWidth) / 2 + (targetWidth / 5) * 1,
                frameHeight - paddingBottom / 2,
            )
            fillText(
                `${photo.exposureTime}`,
                (frameWidth - targetWidth) / 2 + (targetWidth / 5) * 2,
                frameHeight - paddingBottom / 2,
            )
            fillText(
                `${photo.iso}`,
                (frameWidth - targetWidth) / 2 + (targetWidth / 5) * 3,
                frameHeight - paddingBottom / 2,
            )
            fillText(
                `${photo.focalLength}`,
                (frameWidth - targetWidth) / 2 + (targetWidth / 5) * 4,
                frameHeight - paddingBottom / 2,
            )
        }
    } else {
        if (!store.disableExposureMeter) {
            fillText(`${photo.fNumber?.replace('f/', 'F')}`, (frameWidth / 5) * 1, frameHeight - paddingBottom / 2)
            fillText(`${photo.exposureTime}`, (frameWidth / 5) * 2, frameHeight - paddingBottom / 2)
            fillText(`${photo.iso}`, (frameWidth / 5) * 3, frameHeight - paddingBottom / 2)
            fillText(`${photo.focalLength}`, (frameWidth / 5) * 4, frameHeight - paddingBottom / 2)
        }
    }
    return canvas
}
export { monitorFunc, monitorOptions }

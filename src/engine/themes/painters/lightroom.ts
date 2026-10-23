import { footerScale } from '../../render/footer-size'
import { photoAppearance } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import Font from '../../assets'
const lightroomOptions: ThemeOption[] = [
    {
        id: 'BACKGROUND_COLOR',
        type: 'color',
        default: '#1f1f1f',
        description: '#ffffff is white, #000000 is black',
    },
    { id: 'PADDING_TOP', type: 'number', default: 50, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 150, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 50, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 50, description: 'px' },
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
        default: 300,
        description: '100 - 900',
    },
    { id: 'FONT_SIZE', type: 'number', default: 50, description: 'px' },
    {
        id: 'FONT_FAMILY',
        type: 'select',
        options: ['Barlow', ...Object.values(Font)],
        default: 'Barlow',
        description: 'ex. din-alternate-bold, digital-7, Barlow, Arial, sans-serif',
    },
]
const lightroomFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const backgroundColor = (input.get('BACKGROUND_COLOR') as string).trim()
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
        padding: {
            top: paddingTop,
            right: paddingRight,
            bottom: paddingBottom,
            left: paddingLeft,
        },
    })
    const { context, width: frameWidth, height: frameHeight } = themeContext(canvas)
    context.fillStyle = textColor
    context.textBaseline = 'middle'
    context.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`
    context.textAlign = 'left'
    if (!store.disableExposureMeter) {
        context.fillText(
            [`${photo.iso}`, `${photo.exposureTime}`, photo.fNumber, `${photo.focalLength}`].join('    '),
            paddingLeft,
            frameHeight - paddingBottom / 2,
        )
    }
    context.textAlign = 'center'
    context.fillText(
        [photo.make, photo.model, photo.lensModel]
            .filter(Boolean)
            .map((value) => value!.trim())
            .join('    '),
        frameWidth / 2,
        frameHeight - paddingBottom / 2,
    )
    context.textAlign = 'right'
    context.fillText(photo.takenAt, frameWidth - paddingRight, frameHeight - paddingBottom / 2)
    return canvas
}
export { lightroomFunc, lightroomOptions }

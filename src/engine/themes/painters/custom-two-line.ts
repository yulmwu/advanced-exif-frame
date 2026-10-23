import { footerScale } from '../../render/footer-size'
import { photoAppearance, drawThemeText } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import Font from '../../assets'
const customTwoLineOptions: ThemeOption[] = [
    {
        id: 'BACKGROUND_COLOR',
        type: 'color',
        default: '#ffffff',
        description: '#ffffff is white, #000000 is black',
    },
    {
        id: 'PADDING_INSIDE',
        type: 'boolean',
        default: true,
        description: 'enable to use inside padding',
    },
    { id: 'PADDING_TOP', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 350, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 100, description: 'px' },
    {
        id: 'TEXT1',
        type: 'string',
        default: 'Your Text',
        description: 'ex. Hello, World!',
    },
    {
        id: 'TEXT2',
        type: 'string',
        default: 'Your Text',
        description: 'ex. Hello, World!',
    },
    {
        id: 'TEXT_ALPHA',
        type: 'range-slider',
        default: 1,
        min: 0,
        max: 1,
        step: 0.01,
        description: '0 - 1',
    },
    {
        id: 'TEXT_COLOR',
        type: 'color',
        default: '#ffffff',
        description: '#ffffff is white, #000000 is black',
    },
    {
        id: 'TEXT_ALIGN',
        type: 'select',
        options: ['center', 'right', 'left'],
        default: 'center',
        description: 'left or center or right',
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
    { id: 'FONT_SIZE', type: 'number', default: 70, description: 'px' },
    {
        id: 'FONT_FAMILY',
        type: 'select',
        options: ['Barlow', ...Object.values(Font)],
        default: 'Barlow',
        description: 'ex. din-alternate-bold, digital-7, Barlow, Arial, sans-serif',
    },
]
const customTwoLineFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const backgroundColor = (input.get('BACKGROUND_COLOR') as string).trim()
    const paddingInside = input.get('PADDING_INSIDE') as boolean
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    const text1 = input.get('TEXT1') as string
    const text2 = input.get('TEXT2') as string
    const textAlpha = 1
    const textColor = photoAppearance(photo).primary
    const textAlign = (input.get('TEXT_ALIGN') as string).trim() as CanvasTextAlign
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
    context.textAlign = textAlign as CanvasTextAlign
    context.globalAlpha = textAlpha
    fillText(
        text1,
        textAlign === 'left' ? paddingLeft : textAlign === 'center' ? frameWidth / 2 : frameWidth - paddingRight,
        frameHeight - paddingBottom / 2 - fontSize / 1.5,
    )
    fillText(
        text2,
        textAlign === 'left' ? paddingLeft : textAlign === 'center' ? frameWidth / 2 : frameWidth - paddingRight,
        frameHeight - paddingBottom / 2 + fontSize / 1.5,
    )
    context.globalAlpha = 1
    return canvas
}
export { customTwoLineFunc, customTwoLineOptions }

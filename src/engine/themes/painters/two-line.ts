import { footerScale } from '../../render/footer-size'
import { photoAppearance, drawThemeText } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import Font from '../../assets'
const twoLineOptions: ThemeOption[] = [
    {
        id: 'BACKGROUND_COLOR',
        type: 'color',
        default: '#ffffff',
        description: '#ffffff is white, #000000 is black',
    },
    {
        id: 'PADDING_INSIDE',
        type: 'boolean',
        default: false,
        description: 'enable to use inside padding',
    },
    { id: 'PADDING_TOP', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 350, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 100, description: 'px' },
    {
        id: 'TEXT_COLOR',
        type: 'color',
        default: '#000000',
        description: '#ffffff is white, #000000 is black',
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
    {
        id: 'TOP_LABEL',
        type: 'string',
        default: '',
        description: 'ex. @username',
    },
    { id: 'DIVIDER', type: 'string', default: '∙', description: 'ex. |' },
    { id: 'TEMPLATE1', type: 'string', default: '{MAKER}{BODY}{LENS}' },
    { id: 'TEMPLATE2', type: 'string', default: '{ISO}{MM}{F}{SEC}' },
]
const twoLineFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const backgroundColor = (input.get('BACKGROUND_COLOR') as string).trim()
    const paddingInside = input.get('PADDING_INSIDE') as boolean
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    const textColor = photoAppearance(photo).primary
    const textAlpha = 1
    const textAlign = (input.get('TEXT_ALIGN') as string).trim() as CanvasTextAlign
    const fontStyle = (input.get('FONT_STYLE') as string).trim()
    const fontWeight = input.get('FONT_WEIGHT') as number
    const fontSize = input.get('FONT_SIZE') as number
    const fontFamily = (input.get('FONT_FAMILY') as string).trim()
    const topLabel = (input.get('TOP_LABEL') as string).trim()
    const divider = (input.get('DIVIDER') as string).trim()
    const template1 = (input.get('TEMPLATE1') as string).trim()
    const template2 = (input.get('TEMPLATE2') as string).trim()
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
    context.globalAlpha = textAlpha
    context.save()
    const top = themeContext(canvas, false)
    fillText(topLabel, top.width / 2, paddingTop / 2)
    context.restore()
    const text1 = template1
        .split('}')
        .map((part) => `${part}}`)
        .map((part) =>
            part
                .replace(/{MAKER}/g, photo.make)
                .replace(/{BODY}/g, photo.model || '')
                .replace(/{LENS}/g, photo.lensModel || '')
                .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
                .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
                .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
                .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
                .replace(/{TAKEN_AT}/g, photo.takenAt || '')
                .replace(/}/g, ''),
        )
        .filter(Boolean)
        .join(' ' + divider + ' ')
    context.textAlign = textAlign as CanvasTextAlign
    fillText(
        text1,
        textAlign === 'left' ? paddingLeft : textAlign === 'center' ? frameWidth / 2 : frameWidth - paddingRight,
        frameHeight - paddingBottom / 2 - fontSize / 1.5,
    )
    if (!store.disableExposureMeter) {
        const text2 = template2
            .split('}')
            .map((part) => `${part}}`)
            .map((part) =>
                part
                    .replace(/{MAKER}/g, photo.make)
                    .replace(/{BODY}/g, photo.model || '')
                    .replace(/{LENS}/g, photo.lensModel || '')
                    .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
                    .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
                    .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
                    .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
                    .replace(/{TAKEN_AT}/g, photo.takenAt || '')
                    .replace(/}/g, ''),
            )
            .filter(Boolean)
            .join(' ' + divider + ' ')
        fillText(
            text2,
            textAlign === 'left' ? paddingLeft : textAlign === 'center' ? frameWidth / 2 : frameWidth - paddingRight,
            frameHeight - paddingBottom / 2 + fontSize / 1.5,
        )
    }
    context.globalAlpha = 1
    return canvas
}
export { twoLineFunc, twoLineOptions }

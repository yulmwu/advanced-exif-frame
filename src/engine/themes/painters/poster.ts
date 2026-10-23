import { photoAppearance, drawThemeText } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext, getFrameScale } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import Font from '../../assets'
const posterOptions: ThemeOption[] = [
    {
        id: 'DARK_MODE',
        type: 'boolean',
        default: false,
        description: 'enable to use dark mode',
    },
    { id: 'PADDING_TOP', type: 'number', default: 400, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 400, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 150, description: 'px' },
    { id: 'TEXT1', type: 'string', default: '2001.01.01' },
    { id: 'TEXT2', type: 'string', default: 'In the frame' },
    {
        id: 'TEXT3',
        type: 'string',
        default: 'A photograph to remember, consectetur',
    },
    { id: 'TEXT4', type: 'string', default: 'White House' },
    {
        id: 'TEXT5',
        type: 'string',
        default: '1600 Pennsylvania Avenue NW, Washington, DC 20500',
    },
    { id: 'TEXT1_SIZE', type: 'number', default: 80, description: 'px' },
    {
        id: 'TEXT1_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 300,
        description: '100 ~ 900',
    },
    { id: 'TEXT2_SIZE', type: 'number', default: 200, description: 'px' },
    {
        id: 'TEXT2_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 500,
        description: '100 ~ 900',
    },
    { id: 'TEXT3_SIZE', type: 'number', default: 200, description: 'px' },
    {
        id: 'TEXT3_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 500,
        description: '100 ~ 900',
    },
    { id: 'TEXT4_SIZE', type: 'number', default: 150, description: 'px' },
    {
        id: 'TEXT4_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 500,
        description: '100 ~ 900',
    },
    { id: 'TEXT5_SIZE', type: 'number', default: 80, description: 'px' },
    {
        id: 'TEXT5_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 300,
        description: '100 ~ 900',
    },
    {
        id: 'FONT_FAMILY',
        type: 'select',
        options: ['Barlow', ...Object.values(Font)],
        default: 'Barlow',
        description: 'ex. din-alternate-bold, digital-7, Barlow, Arial, sans-serif',
    },
    { id: 'SHADOW_SIZE', type: 'number', default: 10, description: '0 ~ 100' },
]
const posterFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const darkMode = !photoAppearance(photo).dark
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const paddingLeft = input.get('PADDING_LEFT') as number
    const text1 = (input.get('TEXT1') as string).trim()
    const text2 = (input.get('TEXT2') as string).trim()
    const text3 = (input.get('TEXT3') as string).trim()
    const text4 = (input.get('TEXT4') as string).trim()
    const text5 = (input.get('TEXT5') as string).trim()
    const text1Size = input.get('TEXT1_SIZE') as number
    const text1Weight = input.get('TEXT1_WEIGHT') as number
    const text2Size = input.get('TEXT2_SIZE') as number
    const text2Weight = input.get('TEXT2_WEIGHT') as number
    const text3Size = input.get('TEXT3_SIZE') as number
    const text3Weight = input.get('TEXT3_WEIGHT') as number
    const text4Size = input.get('TEXT4_SIZE') as number
    const text4Weight = input.get('TEXT4_WEIGHT') as number
    const text5Size = input.get('TEXT5_SIZE') as number
    const text5Weight = input.get('TEXT5_WEIGHT') as number
    const fontFamily = (input.get('FONT_FAMILY') as string).trim()
    const shadowSize = input.get('SHADOW_SIZE') as number
    const canvas = sandbox(photo, {
        originalResolution: store.originalResolution,
        preserveAlpha: store.losslessExport,
        targetRatio: store.ratio,
        frameRatio: store.frameRatio,
        notCroppedMode: store.notCroppedMode,
        backgroundColor: darkMode ? '#ffffff' : '#000000',
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    const { context, height: frameHeight } = themeContext(canvas)
    const fillText = (text: string, x: number, y: number) => drawThemeText(context, text, x, y, true)
    context.fillStyle = darkMode ? '#000000' : '#ffffff'
    context.shadowColor = darkMode ? '#ffffff' : '#000000'
    context.shadowBlur = shadowSize * getFrameScale(canvas)
    context.textBaseline = 'middle'
    context.textAlign = 'left'
    context.font = `normal ${text1Weight} ${text1Size}px ${fontFamily}`
    fillText(text1, paddingLeft, paddingTop)
    context.font = `normal ${text2Weight} ${text2Size}px ${fontFamily}`
    fillText(text2, paddingLeft, paddingTop + text1Size * 2)
    context.font = `normal ${text3Weight} ${text3Size}px ${fontFamily}`
    fillText(text3, paddingLeft, paddingTop + text1Size * 2 + text2Size * 1.2)
    context.font = `normal ${text4Weight} ${text4Size}px ${fontFamily}`
    fillText(text4, paddingLeft, frameHeight - paddingBottom - text5Size * 1.5)
    context.font = `normal ${text5Weight} ${text5Size}px ${fontFamily}`
    fillText(text5, paddingLeft, frameHeight - paddingBottom)
    return canvas
}
export { posterFunc, posterOptions }

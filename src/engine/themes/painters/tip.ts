import { photoAppearance, drawThemeText } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext, getFrameScale } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import Font from '../../assets'
const tipOptions: ThemeOption[] = [
    {
        id: 'DARK_MODE',
        type: 'boolean',
        default: false,
        description: 'enable to use dark mode',
    },
    {
        id: 'HIDE_TEXT',
        type: 'boolean',
        default: false,
        description: 'hide text',
    },
    { id: 'TAG', type: 'string', default: 'TIP' },
    { id: 'TITLE', type: 'string', default: '01. A moment in light' },
    {
        id: 'DESCRIPTION1',
        type: 'string',
        default: 'Pellentesque a pharetra justo',
    },
    {
        id: 'DESCRIPTION2',
        type: 'string',
        default: 'Light, place, and a moment in time',
    },
    { id: 'PADDING_TOP', type: 'number', default: 250, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 125, description: 'px' },
    { id: 'TAG_SIZE', type: 'number', default: 140, description: 'px' },
    {
        id: 'TAG_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 700,
        description: '100 ~ 900',
    },
    { id: 'TITLE_SIZE', type: 'number', default: 120, description: 'px' },
    {
        id: 'TITLE_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 500,
        description: '100 ~ 900',
    },
    { id: 'DESCRIPTION_SIZE', type: 'number', default: 95, description: 'px' },
    {
        id: 'DESCRIPTION_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 200,
        description: '100 ~ 900',
    },
    { id: 'EXIF_SIZE', type: 'number', default: 60, description: 'px' },
    {
        id: 'EXIF_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 500,
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
const tipFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const darkMode = !photoAppearance(photo).dark
    const hideText = input.get('HIDE_TEXT') as boolean
    const tag = (input.get('TAG') as string).trim()
    const title = (input.get('TITLE') as string).trim()
    const description1 = (input.get('DESCRIPTION1') as string).trim()
    const description2 = (input.get('DESCRIPTION2') as string).trim()
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const tagSize = input.get('TAG_SIZE') as number
    const tagWeight = input.get('TAG_WEIGHT') as number
    const titleSize = input.get('TITLE_SIZE') as number
    const titleWeight = input.get('TITLE_WEIGHT') as number
    const descriptionSize = input.get('DESCRIPTION_SIZE') as number
    const descriptionWeight = input.get('DESCRIPTION_WEIGHT') as number
    const exifSize = input.get('EXIF_SIZE') as number
    const exifWeight = input.get('EXIF_WEIGHT') as number
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
    const { context, width: frameWidth, height: frameHeight } = themeContext(canvas)
    const fillText = (text: string, x: number, y: number) => drawThemeText(context, text, x, y, true)
    context.fillStyle = darkMode ? '#000000' : '#ffffff'
    context.shadowColor = darkMode ? '#ffffff' : '#000000'
    context.shadowBlur = shadowSize * getFrameScale(canvas)
    context.textBaseline = 'middle'
    context.textAlign = 'center'
    if (!hideText) {
        context.font = `normal ${tagWeight} ${tagSize}px ${fontFamily}`
        fillText(tag, frameWidth / 2, paddingTop)
        context.font = `normal ${titleWeight} ${titleSize}px ${fontFamily}`
        fillText(title, frameWidth / 2, paddingTop + tagSize + titleSize / 2)
        context.font = `normal ${descriptionWeight} ${descriptionSize}px ${fontFamily}`
        fillText(description1, frameWidth / 2, frameHeight - paddingBottom - exifSize - descriptionSize * 2.2)
        fillText(description2, frameWidth / 2, frameHeight - paddingBottom - exifSize - descriptionSize)
    }
    if (!store.disableExposureMeter) {
        const exifWidth = frameWidth / 2
        context.font = `normal ${exifWeight} ${exifSize}px ${fontFamily}`
        fillText(
            `${photo.fNumber?.replace('f/', 'F')}`,
            frameWidth / 2 - exifWidth / 2 + (exifWidth / 5) * 1,
            frameHeight - paddingBottom,
        )
        fillText(
            `${photo.exposureTime}`,
            frameWidth / 2 - exifWidth / 2 + (exifWidth / 5) * 2,
            frameHeight - paddingBottom,
        )
        fillText(`${photo.iso}`, frameWidth / 2 - exifWidth / 2 + (exifWidth / 5) * 3, frameHeight - paddingBottom)
        fillText(
            `${photo.focalLength}`,
            frameWidth / 2 - exifWidth / 2 + (exifWidth / 5) * 4,
            frameHeight - paddingBottom,
        )
    }
    return canvas
}
export { tipFunc, tipOptions }

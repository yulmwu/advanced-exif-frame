import { photoAppearance, drawThemeText } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import Font from '../../assets'
const filmOptions: ThemeOption[] = [
    { id: 'ARTIST', type: 'string', default: '', description: 'your name' },
    {
        id: 'FONT_FAMILY',
        type: 'select',
        options: ['Barlow', ...Object.values(Font)],
        default: 'digital-7',
        description: 'ex. din-alternate-bold, digital-7, Barlow, Arial, sans-serif',
    },
    {
        id: 'TEXT_COLOR',
        type: 'color',
        default: '#FFA500',
        description: 'default is orange hex code',
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
        id: 'BACKGROUND_COLOR',
        type: 'color',
        default: '#000000',
        description: '#ffffff is white, #000000 is black',
    },
    { id: 'PADDING_TOP', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 0, description: 'px' },
]
const filmFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const artist = (input.get('ARTIST') as string).trim()
    const fontFamily = (input.get('FONT_FAMILY') as string).trim()
    const textColor = photoAppearance(photo).primary
    const textAlpha = 1
    const backgroundColor = (input.get('BACKGROUND_COLOR') as string).trim()
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    const canvas = sandbox(photo, {
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
    const fillText = (text: string, x: number, y: number) => drawThemeText(context, text, x, y, true)
    context.fillStyle = textColor
    context.textBaseline = 'bottom'
    context.globalAlpha = textAlpha
    if (!store.disableExposureMeter) {
        const datas = [
            ...(photo.iso ? [{ key: 'ISO', value: photo.iso.replace('ISO', '') }] : []),
            ...(photo.exposureTime ? [{ key: 'SEC', value: photo.exposureTime.replace('s', '') }] : []),
            ...(photo.fNumber ? [{ key: 'F', value: photo.fNumber.replace('F', '') }] : []),
        ]
        context.textAlign = 'right'
        context.font = `100px ${fontFamily}`
        for (let i = 0; i < datas.length; i++) {
            const data = datas[i]
            fillText(data.value, frameWidth - 100, frameHeight - 100 - i * 100)
            const width = context.measureText(data.value).width
            context.font = `60px ${fontFamily}`
            fillText(data.key, frameWidth - 100 - width - 20, frameHeight - 110 - i * 100)
            context.font = `100px ${fontFamily}`
        }
    }
    context.font = `70px ${fontFamily}`
    context.textAlign = 'left'
    fillText(
        [store.showLensModel ? store.overrideLensModel || photo.lensModel : null]
            .filter(Boolean)
            .map((value) => value!.trim())
            .join(' '),
        100,
        frameHeight - 105,
    )
    fillText(
        [
            store.showCameraMaker ? store.overrideCameraMaker || photo.make : null,
            store.showCameraModel ? store.overrideCameraModel || photo.model : null,
        ]
            .filter(Boolean)
            .map((value) => value!.trim())
            .join(' '),
        100,
        frameHeight - 205,
    )
    context.font = `50px ${fontFamily}`
    fillText(artist ? artist : photo.takenAt, 100, frameHeight - 305)
    context.globalAlpha = 1
    return canvas
}
export { filmFunc, filmOptions }

import { footerScale } from '../../render/footer-size'
import { photoAppearance } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
const shotOnOneLineOptions: ThemeOption[] = [
    {
        id: 'BACKGROUND_COLOR',
        type: 'color',
        default: '#ffffff',
        description: '#ffffff is white, #000000 is black',
    },
    {
        id: 'TEXT_COLOR',
        type: 'color',
        default: '#000000',
        description: '#ffffff is white, #000000 is black',
    },
    { id: 'PADDING_TOP', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 0, description: 'px' },
]
const shotOnOneLineFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const backgroundColor = (input.get('BACKGROUND_COLOR') as string).trim()
    const textColor = photoAppearance(photo).primary
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = (input.get('PADDING_BOTTOM') as number) + 200
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    const fontSize = 70
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
    context.font = `normal 100 ${fontSize}px Barlow`
    context.textAlign = 'right'
    if (!store.disableExposureMeter) {
        context.fillText(
            [`${photo.iso}`, `${photo.focalLength}`, `${photo.fNumber}`, `${photo.exposureTime}`]
                .filter(Boolean)
                .map((value) => value.trim())
                .join('  '),
            frameWidth - fontSize,
            frameHeight - paddingBottom / 2,
        )
    }
    context.textAlign = 'left'
    context.font = `normal 100 ${fontSize}px Barlow`
    context.fillText(`Shot on  `, fontSize, frameHeight - paddingBottom / 2)
    const shotOnWidth = context.measureText('Shot on  ').width
    context.font = `normal 500 ${fontSize}px Barlow`
    context.fillText(
        [photo.make, photo.model, photo.lensModel]
            .filter(Boolean)
            .map((value) => value!.trim())
            .join(' '),
        shotOnWidth + fontSize,
        frameHeight - paddingBottom / 2,
    )
    return canvas
}
export { shotOnOneLineFunc, shotOnOneLineOptions }

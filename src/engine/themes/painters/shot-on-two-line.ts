import { footerScale } from '../../render/footer-size'
import { photoAppearance } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
const shotOnTwoLineOptions: ThemeOption[] = [
    {
        id: 'BACKGROUND_COLOR',
        type: 'color',
        default: '#ffffff',
        description: '#ffffff is white, #000000 is black',
    },
    { id: 'PADDING_TOP', type: 'number', default: 200, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 300, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 50, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 50, description: 'px' },
    {
        id: 'TEXT_COLOR',
        type: 'color',
        default: '#000000',
        description: '#ffffff is white, #000000 is black',
    },
    {
        id: 'TOP_LABEL',
        type: 'string',
        default: '',
        description: 'ex. @username',
    },
]
const shotOnTwoLineFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const backgroundColor = (input.get('BACKGROUND_COLOR') as string).trim()
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    const textColor = photoAppearance(photo).primary
    const topLabel = (input.get('TOP_LABEL') as string).trim()
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
    context.textAlign = 'center'
    // DRAW TOP LABEL
    context.font = `normal 100 50px Barlow`
    context.save()
    const top = themeContext(canvas, false)
    context.fillText(topLabel, top.width / 2, paddingTop - 75)
    context.restore()
    // shot on ${MAKER} ${MODEL}
    context.font = `normal 500 80px Barlow`
    context.fillText(
        `shot on ${[photo.make, photo.model].filter(Boolean).join(' ')}`,
        frameWidth / 2,
        frameHeight - paddingBottom + 100,
    )
    if (!store.disableExposureMeter) {
        context.font = `normal 100 50px Barlow`
        context.fillText(
            [`${photo.iso}`, `${photo.focalLength}`, `${photo.fNumber}`, `${photo.exposureTime}`]
                .filter(Boolean)
                .join('    '),
            frameWidth / 2,
            frameHeight - paddingBottom + 200,
        )
    }
    return canvas
}
export { shotOnTwoLineFunc, shotOnTwoLineOptions }

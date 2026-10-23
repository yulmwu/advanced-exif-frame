import Photo from '../../../domain/photo'
import sandbox from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
const justFrameOptions: ThemeOption[] = [
    {
        id: 'BACKGROUND_COLOR',
        type: 'color',
        default: '#ffffff',
        description: '#ffffff is white, #000000 is black',
    },
    { id: 'PADDING_TOP', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_BOTTOM', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 100, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 100, description: 'px' },
]
const justFrameFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store) => {
    const backgroundColor = (input.get('BACKGROUND_COLOR') as string).trim()
    const paddingTop = input.get('PADDING_TOP') as number
    const paddingBottom = input.get('PADDING_BOTTOM') as number
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    return sandbox(photo, {
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
}
export { justFrameFunc, justFrameOptions }

import Photo from '../../../domain/photo'
import sandbox from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption } from '../../../domain/theme'
const noFrameOptions: ThemeOption[] = []
const noFrameThemeFunc: ThemeFunc = (photo: Photo, _input, store) => {
    return sandbox(photo, {
        originalResolution: store.originalResolution,
        preserveAlpha: store.losslessExport,
        targetRatio: store.ratio,
        frameRatio: store.frameRatio,
        notCroppedMode: store.notCroppedMode,
        backgroundColor: '#ffffff',
        padding: { top: 0, right: 0, bottom: 0, left: 0 },
    })
}
export { noFrameThemeFunc, noFrameOptions }

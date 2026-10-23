import type PhotoView from '../../domain/photo'
import type { RenderSettings } from '../../domain/settings'
import type { ThemeOption, ThemeOptionInput } from '../../domain/theme'
export type ThemeFunc = (photo: PhotoView, input: ThemeOptionInput, settings: RenderSettings) => HTMLCanvasElement
export interface FrameTheme {
    name: string
    category: 'minimal' | 'signature' | 'editorial'
    options: ThemeOption[]
    paint: ThemeFunc
}

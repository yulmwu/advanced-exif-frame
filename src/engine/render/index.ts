import PhotoView, { type PhotoRecord } from '../../domain/photo'
import type { Preferences } from '../../domain/settings'
import type { ThemeOptionInput } from '../../domain/theme'
import { themeByName } from '../themes/catalog'
import { ensureFonts, ensureLogos } from '../assets'
import compose from './compose'
export function themeInput(settings: Preferences): ThemeOptionInput {
    const theme = themeByName(settings.selectedThemeName)
    return new Map(
        theme.options.map((option) => [option.id, settings.themeOptions[theme.name]?.[option.id] ?? option.default]),
    )
}
export async function renderPhoto(
    photo: PhotoRecord,
    preferences: Preferences,
    signal?: AbortSignal,
): Promise<HTMLCanvasElement> {
    const settings = structuredClone(preferences),
        input = themeInput(settings),
        view = new PhotoView(photo, settings)
    await ensureFonts(String(input.get('FONT_FAMILY') ?? 'Barlow'))
    if (settings.selectedThemeName === 'Strap') await ensureLogos(view.logoMake, view.logoModel)
    signal?.throwIfAborted()
    return compose(themeByName(settings.selectedThemeName).paint, view, input, settings)
}

import { defaultPreferences, type Preferences } from '../domain/settings'
import { DATE_FORMATS } from '../domain/photo'
import { themes } from '../engine/themes/catalog'
import { normalizeAspectRatio } from '../engine/geometry/aspect'
export const STORAGE_KEY = 'advanced-exif-frame.preferences.v1'
export const MAX_SETTINGS_BYTES = 1024 * 1024
const record = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v)
function fail(): never {
    throw new Error('Invalid or incompatible settings JSON')
}
export function validatePreferences(input: unknown): Preferences {
    if (!record(input)) return fail()
    if (Object.keys(input).some((key) => !Object.hasOwn(defaultPreferences(), key))) fail()
    const defaults = defaultPreferences(),
        p = { ...defaults, ...input } as Preferences
    for (const [key, value] of Object.entries(defaults)) {
        if (key === 'themeOptions' || key === 'overridableMetadata' || key === 'overrideMetadataIndex') continue
        if (typeof (p as unknown as Record<string, unknown>)[key] !== typeof value) fail()
    }
    if (
        !themes.some((t) => t.name === p.selectedThemeName) ||
        !['ko', 'en', 'ja', 'zh-CN'].includes(p.language) ||
        !DATE_FORMATS.includes(p.dateNotation)
    )
        fail()
    if (
        !Number.isFinite(p.quality) ||
        p.quality < 1 ||
        p.quality > 100 ||
        !Number.isFinite(p.imageWidth) ||
        p.imageWidth < 1 ||
        p.imageWidth > 4096 ||
        !Number.isInteger(p.imageWidth) ||
        !Number.isFinite(p.focalLengthRatio) ||
        p.focalLengthRatio <= 0
    )
        fail()
    if (p.ratio !== 'free') {
        const ratio = normalizeAspectRatio(p.ratio)
        if (!ratio) fail()
        p.ratio = ratio
    }
    if (
        !Array.isArray(p.overridableMetadata) ||
        p.overridableMetadata.some(
            (item) =>
                !record(item) ||
                Object.entries(item).some(
                    ([key, value]) =>
                        ![
                            'name',
                            'make',
                            'model',
                            'lensModel',
                            'focalLength',
                            'focalLengthIn35mm',
                            'fNumber',
                            'iso',
                            'exposureTime',
                            'takenAt',
                        ].includes(key) || typeof value !== 'string',
                ),
        )
    )
        fail()
    if (
        p.overrideMetadataIndex !== null &&
        (!Number.isInteger(p.overrideMetadataIndex) ||
            p.overrideMetadataIndex < 0 ||
            p.overrideMetadataIndex >= p.overridableMetadata.length)
    )
        fail()
    if (!record(p.themeOptions)) fail()
    for (const [name, options] of Object.entries(p.themeOptions)) {
        const theme = themes.find((t) => t.name === name)
        if (!theme || !record(options)) fail()
        for (const [id, value] of Object.entries(options)) {
            const option = theme!.options.find((o) => o.id === id)
            if (!option) fail()
            if (typeof value !== typeof option!.default) fail()
            if (typeof value === 'number' && (!Number.isFinite(value) || (id.startsWith('PADDING_') && value < 0)))
                fail()
            if (option!.type === 'range-slider' && ((value as number) < option!.min || (value as number) > option!.max))
                fail()
            if (option!.type === 'select' && !option!.options.includes(String(value))) fail()
            if (option!.type === 'color' && !/^#[0-9a-f]{6}$/i.test(String(value))) fail()
        }
    }
    return p
}
export function serializeSettings(preferences: Preferences) {
    const { themeOptions, ...settings } = validatePreferences(preferences)
    const full = Object.fromEntries(
        themes.map((theme) => [
            theme.name,
            Object.fromEntries(
                theme.options.map((option) => [option.id, themeOptions[theme.name]?.[option.id] ?? option.default]),
            ),
        ]),
    )
    return JSON.stringify({ format: 'exif-frame-settings', version: 1, settings, themeOptions: full }, null, 2)
}
export function parseSettings(text: string): Preferences {
    if (new TextEncoder().encode(text).length > MAX_SETTINGS_BYTES) fail()
    const root: unknown = JSON.parse(text.replace(/^\uFEFF/, ''))
    if (
        !record(root) ||
        root.format !== 'exif-frame-settings' ||
        root.version !== 1 ||
        !record(root.settings) ||
        !record(root.themeOptions)
    )
        fail()
    if (Object.keys(root).some((key) => !['format', 'version', 'settings', 'themeOptions'].includes(key))) fail()
    const allowed = Object.keys(defaultPreferences()).filter((k) => k !== 'themeOptions')
    const settings = root.settings as Record<string, unknown>
    if (Object.keys(settings).some((k) => !allowed.includes(k)) || allowed.some((k) => !Object.hasOwn(settings, k)))
        fail()
    return validatePreferences({
        ...root.settings,
        themeOptions: root.themeOptions,
    })
}
export function loadPreferences(): Preferences {
    try {
        const raw = localStorage.getItem(STORAGE_KEY)
        return raw ? validatePreferences(JSON.parse(raw)) : defaultPreferences()
    } catch {
        return defaultPreferences()
    }
}
export function persistPreferences(p: Preferences) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validatePreferences(p)))
}

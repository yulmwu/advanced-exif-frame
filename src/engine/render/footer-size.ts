import type { ThemeOption, ThemeOptionInput } from '../../domain/theme'
export const EXIF_SCALE_OPTION: ThemeOption = {
    id: 'EXIF_SCALE',
    type: 'range-slider',
    default: 100,
    min: 75,
    max: 125,
    step: 5,
}
export function footerScale(input: ThemeOptionInput): number {
    const value = Number(input.get('EXIF_SCALE') ?? 100)
    return Number.isFinite(value) ? Math.max(75, Math.min(125, value)) / 100 : 1
}

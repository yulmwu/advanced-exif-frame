import { constrainCrop, cropPixels, resizeCrop, rotatedSize, type PhotoEdit } from './crop'
import type { ThemeOptionInput } from '../../domain/theme'
import { normalizeAspectRatio } from './aspect'
import { footerScale } from '../render/footer-size'
export const FINAL_RATIOS = ['3:4', '4:5', '1:1', '2:3', '3:2', '4:3', '5:4', '9:16', '16:9']
const FOOTER_THEMES = [
    'Simple',
    'Strap',
    'One line',
    'Two line',
    'Shot on one line',
    'Shot on two line',
    'Monitor',
    'Lightroom',
    'Custom One Line',
    'Custom Two Line',
]
export const hasFinalFooter = (theme: string) => FOOTER_THEMES.includes(theme)
/** Keep each theme's footer, but suppress top labels and optional surrounding spacing. */
export function finalThemeInput(theme: string, input: ThemeOptionInput): ThemeOptionInput {
    const result = new Map(input)
    result.set('AUTO_PADDING_TOP', false)
    if (!hasFinalFooter(theme)) {
        if (theme === 'Just frame' || theme === 'Film') result.set('PADDING_BOTTOM', 0)
        return result
    }
    result.set('PADDING_INSIDE', false)
    result.set('TOP_LABEL', '')
    const font = Number(input.get('FONT_SIZE') ?? (theme === 'Lightroom' ? 50 : 70))
    const minimum =
        theme === 'Simple'
            ? 400
            : theme === 'Strap'
              ? 300
              : theme === 'Shot on two line'
                ? 300
                : /Two [Ll]ine|two line/.test(theme)
                  ? Math.ceil(font * 3.5)
                  : Math.ceil(font * 2.2)
    const added = theme === 'Strap' ? 300 : theme === 'Shot on one line' ? 200 : 0
    const bottom = Number(input.get('PADDING_BOTTOM') ?? 0)
    if (!Number.isFinite(bottom) || bottom < 0 || !Number.isFinite(font) || font <= 0)
        throw new Error('Invalid footer settings')
    result.set('PADDING_BOTTOM', Math.max(bottom, minimum - added))
    return result
}
export function finalFooterHeight(theme: string, input: ThemeOptionInput): number {
    if (!hasFinalFooter(theme)) return 0
    const options = finalThemeInput(theme, input)
    return (
        (Number(options.get('PADDING_BOTTOM')) + (theme === 'Strap' ? 300 : theme === 'Shot on one line' ? 200 : 0)) *
        footerScale(options)
    )
}
export function finalRatioGeometry(ratio: string, bottom: number) {
    const normalized = normalizeAspectRatio(ratio)
    if (!normalized) throw new Error('Invalid final ratio')
    const [rw, rh] = normalized.split(':').map(Number)
    const unit = Math.floor(4096 / Math.max(rw, rh))
    const width = unit * rw
    const height = unit * rh
    if (!Number.isFinite(bottom) || bottom < 0 || bottom >= height - 1)
        throw new Error('Footer leaves no room for the photo')
    return {
        width,
        height,
        bottom,
        rw,
        rh,
        photoRatio: width / (height - bottom),
    }
}
/** Quantize the crop and footer together so native PNG stays pixel-exact AND the outer ratio is exact. */
export function fitFinalRatio(edit: PhotoEdit, width: number, height: number, bottom: number): PhotoEdit {
    if (!edit.finalRatio) return edit
    const normalized = normalizeAspectRatio(edit.finalRatio)
    if (!normalized) throw new Error('Invalid final ratio')
    edit = { ...edit, finalRatio: normalized }
    const geometry = finalRatioGeometry(normalized, bottom)
    const size = rotatedSize(width, height, edit.rotation)
    const existing = cropPixels(width, height, edit)
    if (
        (bottom === 0 || Math.round((bottom * existing.width) / geometry.width) >= 1) &&
        existing.width % geometry.rw === 0 &&
        existing.height ===
            (existing.width / geometry.rw) * geometry.rh - Math.round((bottom * existing.width) / geometry.width)
    ) {
        return {
            ...edit,
            crop: {
                x: existing.x / size.width,
                y: existing.y / size.height,
                width: existing.width / size.width,
                height: existing.height / size.height,
            },
            aspectRatioLocked: true,
            lockedRatio: existing.width / existing.height,
        }
    }
    const requested = resizeCrop(edit.crop, 'width', edit.crop.width, size.width, size.height, geometry.photoRatio)
    const crop = constrainCrop(width, height, edit.rotation, requested)
    const bounds = cropPixels(width, height, { ...edit, crop })
    let units = Math.floor(
        Math.min(bounds.width / geometry.rw, bounds.height / geometry.rh / (1 - bottom / geometry.height)) + 1e-9,
    )
    while (units > 0) {
        const w = units * geometry.rw
        const total = units * geometry.rh
        const footer = Math.round((bottom * w) / geometry.width)
        if (bottom > 0 && footer < 1) break
        const h = total - footer
        if (h > 0 && h <= bounds.height) {
            const x = bounds.x + Math.floor((bounds.width - w) / 2)
            const y = bounds.y + Math.floor((bounds.height - h) / 2)
            return {
                ...edit,
                crop: {
                    x: x / size.width,
                    y: y / size.height,
                    width: w / size.width,
                    height: h / size.height,
                },
                aspectRatioLocked: true,
                lockedRatio: w / h,
            }
        }
        units--
    }
    throw new Error('Crop is too small for the final ratio')
}

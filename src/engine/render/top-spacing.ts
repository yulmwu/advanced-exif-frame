import type Photo from '../../domain/photo'
import { MAX_SIZE, measureSandbox, type SandboxOptions } from './layout'
import { fitRatioSize } from './outer-ratio'
/** Make the top gap half the actual side gap, including whole-frame ratio padding. */
export default function autoTopPadding(photo: Photo, options: SandboxOptions, frameRatio?: string): number {
    const measure = (top: number) => {
        const layout = measureSandbox(photo, {
            ...options,
            padding: { ...options.padding, top },
        })
        let width = layout.width
        let offsetY = 0
        let scale = 1
        if (frameRatio && frameRatio !== 'free') {
            const frame = fitRatioSize(layout.width, layout.height, frameRatio, options.originalResolution)
            scale = options.originalResolution ? 1 : Math.min(frame.width / layout.width, frame.height / layout.height)
            width = frame.width
            offsetY = (frame.height - layout.height * scale) / 2
            if (options.originalResolution) offsetY = Math.floor(offsetY)
        }
        const sideGap = Math.max(0, (width - Math.min(layout.photo.width, layout.clip.width) * scale) / 2)
        const topGap = offsetY + Math.max(layout.photo.y, layout.clip.y) * scale
        return { difference: topGap - sideGap / 2, layout }
    }
    const initial = measure(0)
    if (initial.difference >= -1) return 0
    // Some output ratios cannot fit the desired top gap plus the text strip.
    // Keep at least half of the original photo area rather than collapsing the photo.
    const availableHeight =
        options.targetRatio === 'free' ? MAX_SIZE : initial.layout.height / initial.layout.frameScale
    const maxTop = Math.max(0, (availableHeight - options.padding.bottom * (options.footerScale ?? 1) - 1) / 2)
    const halfSideGap = Math.min(maxTop, Math.max(0, (options.padding.left + options.padding.right) / 4))
    if (Math.abs(measure(halfSideGap).difference) <= 1) return halfSideGap
    if (measure(maxTop).difference <= 0) return maxTop
    let low = 0
    let high = maxTop
    let best = high
    let error = Math.abs(measure(high).difference)
    for (let step = 0; step < 32; step++) {
        const top = (low + high) / 2
        const difference = measure(top).difference
        if (Math.abs(difference) < error) {
            best = top
            error = Math.abs(difference)
        }
        if (difference < 0) low = top
        else high = top
    }
    return best
}

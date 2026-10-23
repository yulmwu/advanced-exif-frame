import { create } from 'zustand'
import { defaultCollageOptions, type CollageOptions } from '../domain/collage'
import { normalizeAspectRatio } from '../engine/geometry/aspect'
const KEY = 'advanced-exif-frame.collage.v1'
function valid(value: CollageOptions): boolean {
    return (
        !!value &&
        !!normalizeAspectRatio(value.ratio) &&
        [value.rows, value.columns].every((n) => Number.isInteger(n) && n >= 1 && n <= 10) &&
        [value.gap, value.top, value.bottom, value.left, value.right].every(
            (n) => Number.isFinite(n) && n >= 0 && n <= 1000,
        ) &&
        /^#[0-9a-f]{6}$/i.test(value.background)
    )
}
function load(): CollageOptions {
    try {
        const parsed = JSON.parse(localStorage.getItem(KEY) ?? 'null')
        return valid(parsed) ? parsed : defaultCollageOptions()
    } catch {
        return defaultCollageOptions()
    }
}
interface CollageState {
    options: CollageOptions
    excludedIds: string[]
    setOptions: (options: CollageOptions) => void
    togglePhoto: (id: string) => void
}
export const useCollageSettings = create<CollageState>((set) => ({
    options: load(),
    excludedIds: [],
    setOptions: (options) => {
        set({ options })
        if (valid(options))
            try {
                localStorage.setItem(KEY, JSON.stringify(options))
            } catch {
                /* Keep current-session controls usable if storage is unavailable. */
            }
    },
    togglePhoto: (id) =>
        set((s) => ({
            excludedIds: s.excludedIds.includes(id)
                ? s.excludedIds.filter((other) => other !== id)
                : [...s.excludedIds, id],
        })),
}))

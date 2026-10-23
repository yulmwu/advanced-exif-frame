import { create } from 'zustand'
import type { PhotoRecord } from '../domain/photo'
import type { Preferences } from '../domain/settings'
import { loadPreferences, persistPreferences, validatePreferences } from './settings-codec'
import { makeThumbnail } from './photos'
export type Tool = 'frame' | 'edit' | 'background' | 'metadata' | 'export' | 'collage'
type Recipe = Pick<PhotoRecord, 'edit' | 'background' | 'metadata'>
interface Workspace {
    preferences: Preferences
    photos: PhotoRecord[]
    selectedId: string | null
    tool: Tool
    modal: 'preview' | 'about' | null
    job: { done: number; total: number; label: string } | null
    notice: string | null
    history: Record<string, { past: Recipe[]; future: Recipe[] }>
    patchPreferences: (patch: Partial<Preferences>) => void
    replacePreferences: (p: Preferences) => void
    setThemeOption: (id: string, value: string | number | boolean) => void
    resetTheme: () => void
    addPhotos: (photos: PhotoRecord[]) => void
    select: (id: string) => void
    remove: (id: string) => void
    clear: () => void
    applyRecipe: (id: string, recipe: Partial<Recipe>) => void
    undo: () => void
    redo: () => void
    setTool: (tool: Tool) => void
    setModal: (modal: Workspace['modal']) => void
    setNotice: (notice: string | null) => void
    setJob: (job: Workspace['job']) => void
}
const recipe = (p: PhotoRecord): Recipe => ({
    edit: structuredClone(p.edit),
    background: p.background,
    metadata: { ...p.metadata },
})
export const useWorkspace = create<Workspace>((set, get) => ({
    preferences: loadPreferences(),
    photos: [],
    selectedId: null,
    tool: 'frame',
    modal: null,
    job: null,
    notice: null,
    history: {},
    patchPreferences: (patch) => get().replacePreferences({ ...get().preferences, ...patch }),
    replacePreferences: (input) => {
        const p = validatePreferences(input)
        try {
            persistPreferences(p)
            set({ preferences: p })
        } catch {
            set({
                notice: '설정을 저장하지 못했습니다. 브라우저 저장 공간을 확인해주세요.',
            })
        }
    },
    setThemeOption: (id, value) => {
        const p = get().preferences
        get().patchPreferences({
            themeOptions: {
                ...p.themeOptions,
                [p.selectedThemeName]: {
                    ...p.themeOptions[p.selectedThemeName],
                    [id]: value,
                },
            },
        })
    },
    resetTheme: () => {
        const p = get().preferences
        const options = { ...p.themeOptions }
        delete options[p.selectedThemeName]
        get().patchPreferences({ themeOptions: options })
    },
    addPhotos: (incoming) =>
        set((s) => {
            const photos = [...s.photos.filter((p) => !p.demo), ...incoming]
            return { photos, selectedId: incoming[0]?.id ?? s.selectedId }
        }),
    select: (selectedId) => set({ selectedId }),
    remove: (id) =>
        set((s) => {
            const photos = s.photos.filter((p) => p.id !== id),
                history = { ...s.history }
            delete history[id]
            return {
                photos,
                history,
                selectedId: s.selectedId === id ? (photos[0]?.id ?? null) : s.selectedId,
            }
        }),
    clear: () => set({ photos: [], selectedId: null, history: {} }),
    applyRecipe: (id, patch) =>
        set((s) => {
            const photo = s.photos.find((p) => p.id === id)
            if (!photo) return s
            const previous = s.history[id] ?? { past: [], future: [] }
            const next = {
                ...photo,
                ...patch,
                edit: structuredClone(patch.edit ?? photo.edit),
                metadata: { ...(patch.metadata ?? photo.metadata) },
            }
            next.thumbnail = patch.edit ? makeThumbnail(next) : photo.thumbnail
            return {
                photos: s.photos.map((p) => (p.id === id ? next : p)),
                history: {
                    ...s.history,
                    [id]: {
                        past: [...previous.past, recipe(photo)].slice(-30),
                        future: [],
                    },
                },
            }
        }),
    undo: () =>
        set((s) => {
            const id = s.selectedId
            if (!id) return s
            const photo = s.photos.find((p) => p.id === id),
                h = s.history[id]
            if (!photo || !h?.past.length) return s
            const next = { ...photo, ...h.past.at(-1)! }
            next.thumbnail = makeThumbnail(next)
            return {
                photos: s.photos.map((p) => (p.id === id ? next : p)),
                history: {
                    ...s.history,
                    [id]: {
                        past: h.past.slice(0, -1),
                        future: [recipe(photo), ...h.future],
                    },
                },
            }
        }),
    redo: () =>
        set((s) => {
            const id = s.selectedId
            if (!id) return s
            const photo = s.photos.find((p) => p.id === id),
                h = s.history[id]
            if (!photo || !h?.future.length) return s
            const next = { ...photo, ...h.future[0] }
            next.thumbnail = makeThumbnail(next)
            return {
                photos: s.photos.map((p) => (p.id === id ? next : p)),
                history: {
                    ...s.history,
                    [id]: { past: [...h.past, recipe(photo)], future: h.future.slice(1) },
                },
            }
        }),
    setTool: (tool) => set({ tool }),
    setModal: (modal) => set({ modal }),
    setNotice: (notice) => set({ notice }),
    setJob: (job) => set({ job }),
}))
export const selectedPhoto = () => {
    const s = useWorkspace.getState()
    return s.photos.find((p) => p.id === s.selectedId)
}

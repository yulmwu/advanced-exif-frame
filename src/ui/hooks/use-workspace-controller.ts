import saveAs from 'file-saver'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { exportBatch, exportOne } from '../../application/export'
import { parsePhoto } from '../../application/photo-codec'
import { importPhoto, snapshotPhoto } from '../../application/photos'
import { parseSettings } from '../../application/settings-codec'
import { useWorkspace, type Tool } from '../../application/workspace'
import type { PhotoRecord } from '../../domain/photo'
import { originalEdit, type PhotoEdit } from '../../engine/geometry/crop'
import { finalFooterHeight, fitFinalRatio } from '../../engine/geometry/final-frame'
import { themeInput } from '../../engine/render'
export function useWorkspaceController() {
    const s = useWorkspace(),
        { t, i18n } = useTranslation(),
        input = useRef<HTMLInputElement>(null),
        globalInput = useRef<HTMLInputElement>(null),
        photoInput = useRef<HTMLInputElement>(null),
        jobAbort = useRef<AbortController | null>(null)
    const photo = s.photos.find((p) => p.id === s.selectedId),
        [draft, setDraft] = useState<PhotoEdit>(originalEdit),
        [zoom, setZoom] = useState(1),
        [original, setOriginal] = useState(false),
        [dragging, setDragging] = useState(false),
        dragDepth = useRef(0)
    useEffect(() => {
        void i18n.changeLanguage(s.preferences.language)
        document.documentElement.lang = s.preferences.language
        document.documentElement.classList.toggle('dark', s.preferences.darkMode)
    }, [s.preferences.language, s.preferences.darkMode])
    useEffect(() => {
        setDraft(photo ? structuredClone(photo.edit) : originalEdit())
        setOriginal(false)
        setZoom(1)
    }, [photo?.id, photo?.edit])
    useEffect(() => {
        if (!s.notice) return
        const timer = setTimeout(() => s.setNotice(null), 6000)
        return () => clearTimeout(timer)
    }, [s.notice])
    useEffect(() => {
        const c = new AbortController()
        void fetch('/sample.jpg', { signal: c.signal })
            .then((r) => r.blob())
            .then((blob) => importPhoto(new File([blob], 'Sample · Nara.jpg', { type: 'image/jpeg' }), true))
            .then((p) => {
                if (!c.signal.aborted && !useWorkspace.getState().photos.length) s.addPhotos([p])
            })
            .catch(() => {})
        return () => c.abort()
    }, [])
    const effective = useMemo(() => {
        if (!photo || !draft.finalRatio) return { edit: draft, error: undefined }
        try {
            return {
                edit: fitFinalRatio(
                    draft,
                    photo.image.naturalWidth || photo.image.width,
                    photo.image.naturalHeight || photo.image.height,
                    finalFooterHeight(s.preferences.selectedThemeName, themeInput(s.preferences)),
                ),
                error: undefined,
            }
        } catch (error) {
            return { edit: draft, error: t('photo.final-ratio-error') }
        }
    }, [draft, photo, s.preferences, t])
    const edit = effective.edit,
        editing = s.tool === 'edit'
    const add = async (files: FileList | File[]) => {
        if (s.job) return
        const selected = Array.from(files)
        if (!selected.length) return
        s.setJob({ done: 0, total: selected.length, label: t('workspace.import') })
        const loaded: PhotoRecord[] = [],
            errors: string[] = []
        try {
            for (const [i, file] of selected.entries()) {
                try {
                    loaded.push(await importPhoto(file))
                } catch {
                    errors.push(file.name)
                }
                s.setJob({
                    done: i + 1,
                    total: selected.length,
                    label: t('workspace.import'),
                })
            }
            if (loaded.length) s.addPhotos(loaded)
            if (errors.length) s.setNotice(t('fail-to-load-photos') + ': ' + errors.join(', '))
        } finally {
            s.setJob(null)
        }
    }
    const download = async (all = false) => {
        const state = useWorkspace.getState()
        if (state.job) return
        if (state.tool === 'edit' && effective.error) {
            state.setNotice(effective.error)
            return
        }
        let photos = all
            ? state.photos.filter((p) => !p.demo)
            : state.photos.filter((p) => p.id === state.selectedId && !p.demo)
        if (state.tool === 'edit' && !effective.error)
            photos = photos.map((p) => (p.id === state.selectedId ? { ...p, edit: structuredClone(edit) } : p))
        if (!photos.length) return
        const c = new AbortController()
        jobAbort.current = c
        state.setJob({
            done: 0,
            total: photos.length,
            label: t('workspace.progress'),
        })
        try {
            if (all)
                await exportBatch(
                    photos,
                    state.preferences,
                    (done) =>
                        state.setJob({
                            done,
                            total: photos.length,
                            label: t('workspace.progress'),
                        }),
                    c.signal,
                )
            else {
                const file = await exportOne(snapshotPhoto(photos[0]), state.preferences, c.signal)
                saveAs(file.data, file.filename)
            }
            state.setNotice(t('workspace.saved'))
        } catch (error) {
            if (!c.signal.aborted) state.setNotice(String(error))
        } finally {
            jobAbort.current = null
            state.setJob(null)
        }
    }
    const navigate = (direction: number) => {
        const index = s.photos.findIndex((p) => p.id === s.selectedId),
            next = s.photos[index + direction]
        if (next) s.select(next.id)
    }
    useEffect(() => {
        const key = (e: KeyboardEvent) => {
            if (
                e.defaultPrevented ||
                document.querySelector('dialog[open]') ||
                (e.target instanceof HTMLElement &&
                    e.target.closest('input,textarea,select,[contenteditable],.crop-selection'))
            )
                return
            if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
                e.preventDefault()
                e.shiftKey ? s.redo() : s.undo()
                return
            }
            if (e.key === 'ArrowLeft') navigate(-1)
            if (e.key === 'ArrowRight') navigate(1)
            const map: Record<string, Tool> = {
                e: 'edit',
                f: 'frame',
                b: 'background',
                m: 'metadata',
                x: 'export',
            }
            if (map[e.key]) s.setTool(map[e.key])
        }
        window.addEventListener('keydown', key)
        return () => window.removeEventListener('keydown', key)
    }, [s.selectedId, s.photos])
    const readSettings = async (file: File | undefined, perPhoto = false) => {
        if (!file) return
        try {
            if (file.size > 1024 * 1024) throw Error('Settings file too large')
            const text = await file.text()
            if (perPhoto && photo) s.applyRecipe(photo.id, parsePhoto(text, photo))
            else if (!perPhoto) s.replacePreferences(parseSettings(text))
            s.setNotice(t('workspace.saved'))
        } catch (error) {
            s.setNotice(String(error))
        }
    }
    const edited = photo && JSON.stringify(photo.edit) !== JSON.stringify(originalEdit())
    return {
        s,
        t,
        input,
        globalInput,
        photoInput,
        jobAbort,
        photo,
        edit,
        effective,
        setDraft,
        zoom,
        setZoom,
        original,
        setOriginal,
        dragging,
        setDragging,
        dragDepth,
        editing,
        add,
        download,
        navigate,
        readSettings,
        edited,
        dirty: !!photo && JSON.stringify(edit) !== JSON.stringify(photo.edit),
    }
}

import { useEffect, useRef, useState } from 'react'
import type { PhotoRecord } from '../domain/photo'
import type { Preferences } from '../domain/settings'
import { renderPhoto } from '../engine/render'
import release from '../engine/render/release'
export function usePreview(photo: PhotoRecord | undefined, preferences: Preferences) {
    const ref = useRef<HTMLCanvasElement>(null),
        [state, setState] = useState<'idle' | 'loading' | 'ready' | 'error'>('idle'),
        [size, setSize] = useState({ width: 0, height: 0 })
    useEffect(() => {
        const controller = new AbortController()
        if (!photo) {
            setState('idle')
            return
        }
        setState('loading')
        const timer = setTimeout(() => {
            renderPhoto(photo, preferences, controller.signal)
                .then((canvas) => {
                    try {
                        if (controller.signal.aborted) return
                        const target = ref.current
                        if (!target) return
                        const scale = Math.min(1, 1600 / Math.max(canvas.width, canvas.height))
                        target.width = Math.max(1, Math.round(canvas.width * scale))
                        target.height = Math.max(1, Math.round(canvas.height * scale))
                        const ctx = target.getContext('2d')!
                        ctx.imageSmoothingQuality = 'high'
                        ctx.drawImage(canvas, 0, 0, target.width, target.height)
                        setSize({ width: canvas.width, height: canvas.height })
                        setState('ready')
                    } finally {
                        release(canvas)
                    }
                })
                .catch((error) => {
                    if (!controller.signal.aborted) {
                        console.error(error)
                        setState('error')
                    }
                })
        }, 70)
        return () => {
            clearTimeout(timer)
            controller.abort()
        }
    }, [photo, preferences])
    return { ref, state, size }
}

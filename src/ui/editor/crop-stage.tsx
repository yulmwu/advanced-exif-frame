import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { PhotoRecord } from '../../domain/photo'
import type { CropRect, PhotoEdit } from '../../engine/geometry/crop'
import { rotatedSize, constrainCrop } from '../../engine/geometry/crop'
import { moveCropAxis } from '../../engine/geometry/controls'
import { drawOriginal } from '../../engine/render/raster'
import PhotoView from '../../domain/photo'
import { defaultPreferences } from '../../domain/settings'
interface Drag {
    x: number
    y: number
    rect: CropRect
    handle: string
    axis?: 'x' | 'y'
}
export function CropStage({
    photo,
    edit,
    ratio,
    onChange,
}: {
    photo: PhotoRecord
    edit: PhotoEdit
    ratio: number | null
    onChange: (rect: CropRect) => void
}) {
    const canvas = useRef<HTMLCanvasElement>(null),
        stage = useRef<HTMLDivElement>(null),
        drag = useRef<Drag | null>(null)
    const [display, setDisplay] = useState({ width: 0, height: 0 })
    const width = photo.image.naturalWidth || photo.image.width,
        height = photo.image.naturalHeight || photo.image.height,
        size = rotatedSize(width, height, edit.rotation)
    useLayoutEffect(() => {
        const parent = stage.current?.parentElement
        if (!parent) return
        const update = () => {
            const style = getComputedStyle(parent)
            const availableWidth = parent.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight)
            const availableHeight = parent.clientHeight - parseFloat(style.paddingTop) - parseFloat(style.paddingBottom)
            const width = Math.min(availableWidth, (availableHeight * size.width) / size.height)
            setDisplay({ width, height: (width * size.height) / size.width })
        }
        const observer = new ResizeObserver(update)
        observer.observe(parent)
        update()
        return () => observer.disconnect()
    }, [size.width, size.height])
    useEffect(() => {
        const target = canvas.current!
        const scale = Math.min(1, 1600 / Math.max(size.width, size.height))
        target.width = Math.max(1, Math.round(size.width * scale))
        target.height = Math.max(1, Math.round(size.height * scale))
        drawOriginal(
            target.getContext('2d')!,
            new PhotoView(photo, defaultPreferences()),
            target.width,
            target.height,
            edit.rotation,
        )
    }, [photo.image, edit.rotation, size.width, size.height])
    const start = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button !== 0) return
        const handle = (event.target as HTMLElement).dataset.handle ?? 'move'
        drag.current = {
            x: event.clientX,
            y: event.clientY,
            rect: { ...edit.crop },
            handle,
        }
        event.currentTarget.setPointerCapture(event.pointerId)
        event.preventDefault()
    }
    const move = (event: React.PointerEvent<HTMLDivElement>) => {
        const d = drag.current,
            box = stage.current?.getBoundingClientRect()
        if (!d || !box) return
        const dx = (event.clientX - d.x) / box.width,
            dy = (event.clientY - d.y) / box.height
        if (d.handle === 'move') {
            if (event.shiftKey) {
                d.axis ??= Math.abs(event.clientX - d.x) >= Math.abs(event.clientY - d.y) ? 'x' : 'y'
                onChange(
                    moveCropAxis(
                        width,
                        height,
                        edit.rotation,
                        d.rect,
                        d.axis,
                        d.rect[d.axis] + (d.axis === 'x' ? dx : dy),
                    ),
                )
            } else {
                d.axis = undefined
                onChange(
                    constrainCrop(width, height, edit.rotation, {
                        ...d.rect,
                        x: d.rect.x + dx,
                        y: d.rect.y + dy,
                    }),
                )
            }
            return
        }
        const left = d.handle.includes('w'),
            top = d.handle.includes('n')
        let w = Math.max(1 / size.width, d.rect.width + (left ? -dx : dx)),
            h = Math.max(1 / size.height, d.rect.height + (top ? -dy : dy))
        if (ratio) {
            const normalized = (ratio * size.height) / size.width
            if (Math.abs(dx) > Math.abs(dy)) h = w / normalized
            else w = h * normalized
        }
        const x = left ? d.rect.x + d.rect.width - w : d.rect.x,
            y = top ? d.rect.y + d.rect.height - h : d.rect.y
        onChange(
            constrainCrop(width, height, edit.rotation, {
                x,
                y,
                width: w,
                height: h,
            }),
        )
    }
    return (
        <div
            ref={stage}
            className="crop-stage"
            style={{
                flexShrink: 0,
                aspectRatio: `${size.width}/${size.height}`,
                width: display.width || undefined,
                height: display.height || undefined,
            }}
        >
            <canvas ref={canvas} />
            <div
                className="crop-selection"
                tabIndex={0}
                role="group"
                aria-label="Crop selection: drag to move, Shift to constrain, arrow keys for precise movement"
                style={{
                    left: edit.crop.x * 100 + '%',
                    top: edit.crop.y * 100 + '%',
                    width: edit.crop.width * 100 + '%',
                    height: edit.crop.height * 100 + '%',
                }}
                onPointerDown={start}
                onPointerMove={move}
                onPointerUp={() => {
                    drag.current = null
                }}
                onPointerCancel={() => {
                    drag.current = null
                }}
                onKeyDown={(e) => {
                    const axes: Record<string, ['x' | 'y', number]> = {
                        ArrowLeft: ['x', -1],
                        ArrowRight: ['x', 1],
                        ArrowUp: ['y', -1],
                        ArrowDown: ['y', 1],
                    }
                    const action = axes[e.key]
                    if (!action) return
                    e.preventDefault()
                    const [axis, sign] = action
                    onChange(
                        moveCropAxis(
                            width,
                            height,
                            edit.rotation,
                            edit.crop,
                            axis,
                            edit.crop[axis] +
                                (sign * (e.shiftKey ? 10 : 1)) / (axis === 'x' ? size.width : size.height),
                        ),
                    )
                }}
            >
                <div className="crop-thirds" aria-hidden="true" />
                {['nw', 'ne', 'sw', 'se'].map((handle) => (
                    <span key={handle} data-handle={handle} className={`crop-handle handle-${handle}`} />
                ))}
            </div>
        </div>
    )
}

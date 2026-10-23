import type { PhotoEdit } from '../engine/geometry/crop'
import type { PhotoBackground } from '../engine/render/background'
import type { RenderSettings } from './settings'
export interface Metadata {
    make?: string
    model?: string
    lensModel?: string
    focalLength?: string
    focalLengthIn35mm?: string
    fNumber?: string
    iso?: string
    exposureTime?: string
    takenAt?: string
    thumbnail?: string
}
export interface PhotoRecord {
    id: string
    file: File
    image: HTMLImageElement
    imageBase64: string
    thumbnail: string
    metadata: Metadata
    edit: PhotoEdit
    background: PhotoBackground
    demo?: boolean
}
/** Render-only view. Effective metadata is frozen before async rendering, independent of UI/storage. */
export default class PhotoView {
    readonly file: File
    readonly image: HTMLImageElement
    readonly imageBase64: string
    metadata: Metadata
    edit: PhotoEdit
    background: PhotoBackground
    readonly make: string
    readonly model: string
    readonly lensModel: string
    readonly logoMake: string
    readonly logoModel: string
    readonly iso: string
    readonly exposureTime: string
    readonly fNumber: string
    readonly focalLength: string
    readonly takenAt: string
    constructor(photo: PhotoRecord, settings: RenderSettings) {
        this.file = photo.file
        this.image = photo.image
        this.imageBase64 = photo.imageBase64
        this.edit = structuredClone(photo.edit)
        this.background = photo.background
        this.metadata = { ...photo.metadata }
        const preset =
            settings.overrideMetadataIndex === null
                ? undefined
                : settings.overridableMetadata[settings.overrideMetadataIndex]
        const explicit: Partial<Metadata> = {
            make: settings.overrideCameraMaker,
            model: settings.overrideCameraModel,
            lensModel: settings.overrideLensModel,
        }
        const value = (key: keyof Metadata) => explicit[key] || preset?.[key] || photo.metadata[key] || ''
        this.logoMake = value('make')
        this.logoModel = value('model')
        this.make = settings.showCameraMaker ? value('make') : ''
        this.model = settings.showCameraModel ? value('model') : ''
        this.lensModel = settings.showLensModel ? value('lensModel') : ''
        this.iso = value('iso')
        this.exposureTime = value('exposureTime')
        this.fNumber = value('fNumber')
        this.focalLength = value(settings.focalLength35mmMode ? 'focalLengthIn35mm' : 'focalLength')
        if (settings.focalLengthRatioMode) {
            const focal = parseFloat(value('focalLength'))
            this.focalLength =
                Number.isFinite(focal) && focal > 0 ? (focal * settings.focalLengthRatio).toFixed(0) + 'mm' : ''
        }
        this.takenAt = formatCaptureDate(value('takenAt'), settings.dateNotation)
    }
}
export const DATE_FORMATS = [
    '2001/01/01 01:01:01',
    '2001-01-01 01:01:01',
    '2001年01月01日 01時01分',
    '2001년 01월 01일 01시 01분',
    'Jan 1, 2001',
    '2001/01/01',
    '2001-01-01',
    '2001年01月01日',
    '2001년 01월 01일',
    'empty',
]
export function formatCaptureDate(raw: string, format: string): string {
    if (!raw || format === 'empty') return ''
    const d = new Date(raw.replace(/^(\d{4}-\d{2}-\d{2}) /, '$1T'))
    if (!Number.isFinite(d.getTime())) return ''
    const p = (n: number) => String(n).padStart(2, '0')
    const y = d.getFullYear(),
        m = p(d.getMonth() + 1),
        day = p(d.getDate()),
        h = p(d.getHours()),
        min = p(d.getMinutes())
    if (format === 'Jan 1, 2001')
        return `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getMonth()]} ${d.getDate()}, ${y}`
    if (format.startsWith('2001년')) return `${y}년 ${m}월 ${day}일${format.includes('01시') ? ` ${h}시 ${min}분` : ''}`
    if (format.startsWith('2001年')) return `${y}年${m}月${day}日${format.includes('01時') ? ` ${h}時${min}分` : ''}`
    return (
        [y, m, day].join(format.startsWith('2001-') ? '-' : '/') +
        (format.includes('01:01:01') ? ` ${h}:${min}:${p(d.getSeconds())}` : '')
    )
}

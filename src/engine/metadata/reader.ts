import type { ExpandedTags, Tags } from 'exifreader'
import captureDate from './date'
import { decimal, numericValue, tagValues, textValue } from './values'
type Group = Record<string, unknown>
const group = (value: unknown): Group =>
    value !== null && typeof value === 'object' && !Array.isArray(value) ? (value as Group) : {}
const BRANDS = [
    'OM SYSTEM',
    'HASSELBLAD',
    'PANASONIC',
    'FUJIFILM',
    'OLYMPUS',
    'SAMSUNG',
    'PENTAX',
    'CANON',
    'NIKON',
    'SONY',
    'LEICA',
    'RICOH',
    'APPLE',
    'SIGMA',
    'DJI',
]
class ExifMetadata {
    public make: string | undefined
    public model: string | undefined
    public lensModel: string | undefined
    public focalLength: string | undefined
    public focalLengthIn35mm: string | undefined
    public fNumber: string | undefined
    public iso: string | undefined
    public exposureTime: string | undefined
    public thumbnail: string | undefined
    public takenAt: string | undefined
    constructor(metadata: Tags | ExpandedTags) {
        const root = group(metadata)
        // Keep namespaces separate: merged tags let invalid XMP overwrite valid EXIF.
        const groups = [group(root.exif), group(root.xmp), group(root.iptc), root]
        const find = <T>(names: string[], convert: (tag: unknown) => T | undefined): T | undefined => {
            for (const name of names)
                for (const source of groups) {
                    const value = convert(source[name])
                    if (value !== undefined) return value
                }
        }
        const numeric = (names: string[], units = '') => find(names, (tag) => numericValue(tag, units))
        this.make = find(['Make', 'CameraMake'], textValue)
        this.model = find(['Model', 'CameraModel', 'UniqueCameraModel'], textValue)
        if (!this.make && this.model)
            this.make = BRANDS.find((brand) => this.model!.toUpperCase().startsWith(`${brand} `))
        if (this.make && this.model?.toUpperCase().startsWith(`${this.make.toUpperCase()} `))
            this.model = this.model.slice(this.make.length).trim()
        this.lensModel = find(['LensModel', 'Lens', 'LensID'], textValue)
        if (this.model && this.lensModel?.startsWith(`${this.model} `))
            this.lensModel = this.lensModel.slice(this.model.length).trim()
        const focal = numeric(['FocalLength'], 'mm')
        if (focal !== undefined) this.focalLength = `${decimal(focal)}mm`
        const equivalent = numeric(
            ['FocalLengthIn35mmFilm', 'FocalLengthIn35mmFormat', 'FocalLengthIn35mm', 'UprightFocalLength35mm'],
            'mm',
        )
        if (equivalent !== undefined) this.focalLengthIn35mm = `${decimal(equivalent)}mm`
        const fNumber = numeric(['FNumber'], 'f/|f')
        if (fNumber !== undefined) this.fNumber = `F${decimal(fNumber)}`
        else {
            // ApertureValue is APEX (Av), not an f-number.
            const aperture = find(['ApertureValue'], (tag) => {
                for (const value of tagValues(tag))
                    if (typeof value === 'string' && /^f\//i.test(value.trim())) return numericValue(value, 'f/')
                const apex = numericValue(group(tag).value ?? tag, '', false)
                const converted = apex === undefined ? undefined : 2 ** (apex / 2)
                return converted !== undefined && Number.isFinite(converted) && converted > 0 ? converted : undefined
            })
            if (aperture !== undefined && Number.isFinite(aperture) && aperture > 0)
                this.fNumber = `F${Number(aperture.toPrecision(4))}`
        }
        const iso = find(
            [
                'ISOSpeedRatings',
                'PhotographicSensitivity',
                'ISO',
                'ISOSpeed',
                'RecommendedExposureIndex',
                'StandardOutputSensitivity',
            ],
            (tag) => {
                const value = numericValue(tag, 'ISO', true, false)
                return value !== undefined && value !== 65535 ? value : undefined
            },
        )
        if (iso !== undefined) this.iso = `ISO${decimal(iso)}`
        let seconds = numeric(['ExposureTime'], 'seconds?|secs?|s')
        if (seconds === undefined) {
            seconds = find(['ShutterSpeedValue'], (tag) => {
                for (const value of tagValues(group(tag).description))
                    if (typeof value === 'string' && (/s\s*$/i.test(value) || value.includes('/')))
                        return numericValue(value, 'seconds?|secs?|s')
                const apex = numericValue(group(tag).value ?? tag, '', false)
                const converted = apex === undefined ? undefined : 2 ** -apex
                return converted !== undefined && Number.isFinite(converted) && converted > 0 ? converted : undefined
            })
        }
        if (seconds !== undefined && seconds > 0 && Number.isFinite(seconds)) {
            // Rational EXIF values are often approximate (33333/1000000 means 1/30).
            const inverse = 1 / seconds
            const denominator = Math.round(inverse)
            this.exposureTime =
                seconds < 1 && denominator > 1 && Math.abs(inverse - denominator) / inverse < 0.005
                    ? `1/${denominator}s`
                    : `${decimal(seconds)}s`
        }
        const thumbnail = group(root.Thumbnail)
        if (typeof thumbnail.base64 === 'string' && thumbnail.base64)
            this.thumbnail = `data:image/jpg;base64,${thumbnail.base64}`
        for (const name of ['DateTimeOriginal', 'DateTimeDigitized', 'CreateDate', 'DateCreated', 'CreationDate']) {
            const dates: string[] = []
            for (const source of groups)
                for (const value of tagValues(source[name])) {
                    if (typeof value !== 'string') continue
                    let date = captureDate(value)
                    if (!date) continue
                    const suffix =
                        name === 'DateTimeOriginal' ? 'Original' : name === 'DateTimeDigitized' ? 'Digitized' : ''
                    const offset = textValue(source[`OffsetTime${suffix}`])
                    const fraction = textValue(source[`SubSecTime${suffix}`])
                    if (fraction && /^\d+$/.test(fraction) && !date.includes('.'))
                        date = date.replace(/(\d{2}:\d{2}:\d{2})/, `$1.${fraction}`)
                    if (offset && !/(Z|[+-]\d{2}:\d{2})$/i.test(date)) date = captureDate(date + offset) ?? date
                    dates.push(date)
                }
            // XMP often retains the capture offset and subseconds lost during editing.
            this.takenAt = dates.find((date) => /(Z|[+-]\d{2}:\d{2})$/i.test(date)) ?? dates[0]
            if (this.takenAt) break
        }
        // IPTC stores capture date and time separately. Do not invent midnight for a date-only tag.
        if (!this.takenAt)
            for (const source of groups) {
                for (const [dateKey, timeKey] of [
                    ['Date Created', 'Time Created'],
                    ['Digital Creation Date', 'Digital Creation Time'],
                ]) {
                    const date = textValue(source[dateKey])
                    const time = textValue(source[timeKey])
                    if (date && time)
                        this.takenAt = captureDate(
                            `${date.replace(/^(\d{4})(\d{2})(\d{2})$/, '$1-$2-$3')}T${time.replace(/^(\d{2})(\d{2})(\d{2})/, '$1:$2:$3')}`,
                        )
                    if (this.takenAt) break
                }
                if (this.takenAt) break
            }
    }
}
export default ExifMetadata

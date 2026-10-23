/** Normalize EXIF and ISO 8601 capture dates without discarding offsets or fractions. */
export default function captureDate(value: string): string | undefined {
    const match = value
        .trim()
        .match(/^(\d{4})[:-](\d{2})[:-](\d{2})[T ](\d{2}):(\d{2}):(\d{2})(\.\d+)?\s*(Z|[+-]\d{2}:?\d{2})?$/i)
    if (!match) return
    const [, year, month, day, hour, minute, second, fraction = '', rawZone = ''] = match
    const zone = rawZone.toUpperCase().replace(/^([+-]\d{2})(\d{2})$/, '$1:$2')
    if (
        +year < 1 ||
        +month < 1 ||
        +month > 12 ||
        +day < 1 ||
        +day > new Date(Date.UTC(+year, +month, 0)).getUTCDate() ||
        +hour > 23 ||
        +minute > 59 ||
        +second > 59 ||
        (zone !== 'Z' && zone && (+zone.slice(1, 3) > 23 || +zone.slice(4) > 59))
    )
        return
    return `${year}-${month}-${day}T${hour}:${minute}:${second}${fraction}${zone}`
}

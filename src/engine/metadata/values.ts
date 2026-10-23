/** ExifReader returns scalars, rational pairs and nested XMP array items. */
export function* tagValues(tag: unknown, rational = false, depth = 0): Generator<string | number> {
    if (depth > 8 || tag === null || tag === undefined) return
    if (typeof tag === 'string' || typeof tag === 'number') yield tag
    else if (Array.isArray(tag)) {
        if (rational && tag.length === 2 && tag.every((value) => typeof value === 'number')) {
            if (tag[1] !== 0) yield tag[0] / tag[1]
            return
        }
        for (const item of tag) yield* tagValues(item, rational, depth + 1)
    } else if (typeof tag === 'object') {
        const value = tag as Record<string, unknown>
        yield* tagValues(value.description, rational, depth + 1)
        yield* tagValues(value.value, rational, depth + 1)
    }
}
export function textValue(tag: unknown): string | undefined {
    for (const value of tagValues(tag)) {
        if (typeof value !== 'string') continue
        const text = value.replace(/\0/g, '').trim()
        if (text && !/^(undefined|null|nan|unknown|\[object Object\])$/i.test(text)) return text
    }
}
export function numericValue(tag: unknown, units = '', positive = true, rational = true): number | undefined {
    const raw =
        tag !== null && typeof tag === 'object' && !Array.isArray(tag)
            ? (tag as Record<string, unknown>).value
            : undefined
    // Numeric descriptions can be rounded by the library; use the actual rational first.
    for (const value of [...tagValues(raw, rational), ...tagValues(tag, rational)]) {
        let result: number
        if (typeof value === 'number') result = value
        else {
            const text = value
                .trim()
                .replace(new RegExp(`^(?:${units || '(?!)'})\\s*|\\s*(?:${units || '(?!)'})$`, 'gi'), '')
                .trim()
            const part = '[+-]?(?:\\d+(?:\\.\\d*)?|\\.\\d+)(?:e[+-]?\\d+)?'
            if (!new RegExp(`^${part}(?:\\s*/\\s*${part})?$`, 'i').test(text)) continue
            const [numerator, denominator = 1] = text.split('/').map(Number)
            result = numerator / denominator
        }
        if (Number.isFinite(result) && (!positive || result > 0)) return result
    }
}
export const decimal = (value: number) => Number(value.toPrecision(8)).toString()

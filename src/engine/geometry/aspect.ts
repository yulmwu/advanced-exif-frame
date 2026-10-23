/** Canonical integer ratios keep native-size padding and final crops on a safe pixel grid. */
export function normalizeAspectRatio(value: unknown): string | undefined {
    if (typeof value !== 'string' || value.length > 64) return
    const parts = value
        .trim()
        .split(':')
        .map((part) => part.trim())
    if (parts.length !== 2 || parts.some((part) => !/^\d+(?:\.\d{1,2})?$/.test(part))) return
    const values = parts.map(Number)
    if (values.some((number) => !Number.isFinite(number) || number < 0.01 || number > 10000)) return
    let [width, height] = values.map((number) => Math.round(number * 100))
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a)
    const divisor = gcd(width, height)
    width /= divisor
    height /= divisor
    if (Math.max(width, height) > 4096 || Math.max(width / height, height / width) > 32) return
    return `${width}:${height}`
}

export interface CollageOptions {
    ratio: string
    rows: number
    columns: number
    gap: number
    top: number
    bottom: number
    left: number
    right: number
    background: string
}
export const defaultCollageOptions = (): CollageOptions => ({
    ratio: '4:5',
    rows: 2,
    columns: 2,
    gap: 50,
    top: 50,
    bottom: 50,
    left: 50,
    right: 50,
    background: '#ffffff',
})

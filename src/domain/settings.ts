export type Language = 'ko' | 'en' | 'ja' | 'zh-CN'
export type MetadataPreset = Record<string, string>
export interface RenderSettings {
    selectedThemeName: string
    quality: number
    losslessExport: boolean
    originalResolution: boolean
    exportToJpeg: boolean
    maintainExif: boolean
    fixImageWidth: boolean
    imageWidth: number
    ratio: string
    notCroppedMode: boolean
    applyRatioToText: boolean
    frameRatio?: string
    fixWatermark: boolean
    watermark: string
    disableExposureMeter: boolean
    showCameraMaker: boolean
    showCameraModel: boolean
    showLensModel: boolean
    overrideCameraMaker: string
    overrideCameraModel: string
    overrideLensModel: string
    focalLength35mmMode: boolean
    focalLengthRatioMode: boolean
    focalLengthRatio: number
    dateNotation: string
    overridableMetadata: MetadataPreset[]
    overrideMetadataIndex: number | null
}
export interface Preferences extends RenderSettings {
    language: Language
    darkMode: boolean
    themeOptions: Record<string, Record<string, string | number | boolean>>
}
export const defaultPreferences = (): Preferences => ({
    language: 'ko',
    darkMode: false,
    selectedThemeName: 'Strap',
    themeOptions: {},
    quality: 95,
    losslessExport: false,
    originalResolution: false,
    exportToJpeg: false,
    maintainExif: true,
    fixImageWidth: false,
    imageWidth: 1920,
    ratio: 'free',
    notCroppedMode: false,
    applyRatioToText: false,
    fixWatermark: false,
    watermark: '',
    disableExposureMeter: false,
    showCameraMaker: true,
    showCameraModel: true,
    showLensModel: true,
    overrideCameraMaker: '',
    overrideCameraModel: '',
    overrideLensModel: '',
    focalLength35mmMode: false,
    focalLengthRatioMode: false,
    focalLengthRatio: 1,
    dateNotation: '2001/01/01 01:01:01',
    overridableMetadata: [],
    overrideMetadataIndex: null,
})

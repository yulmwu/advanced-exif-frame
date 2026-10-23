import type { RenderSettings } from '../../domain/settings'
type ExportSettings = Pick<RenderSettings, 'losslessExport' | 'originalResolution' | 'exportToJpeg' | 'quality'>
/** JPEG quality 100 preserves source resolution, but its codec is still lossy. */
export const usesOriginalResolution = (store: ExportSettings) =>
    Boolean(store.losslessExport || store.originalResolution || (store.exportToJpeg && store.quality >= 100))
export const exportFormat = (store: Pick<RenderSettings, 'losslessExport' | 'exportToJpeg'>) =>
    store.losslessExport
        ? { type: 'image/png' as const, extension: 'png' }
        : store.exportToJpeg
          ? { type: 'image/jpeg' as const, extension: 'jpg' }
          : { type: 'image/webp' as const, extension: 'webp' }

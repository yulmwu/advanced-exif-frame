import { init } from '@jsquash/webp/encode.js'
import standardWasm from '@jsquash/webp/codec/enc/webp_enc.wasm?url'
import simdWasm from '@jsquash/webp/codec/enc/webp_enc_simd.wasm?url'
let pending: Promise<void> | undefined
/** Explicit asset URLs also work when Vite prebundles the encoder in development. */
export function ensureWebpEncoder(): Promise<void> {
    return (pending ??= init(undefined, {
        locateFile: (path: string) =>
            path.endsWith('.wasm') ? (path.includes('simd') ? simdWasm : standardWasm) : path,
    })
        .then(() => {})
        .catch((error) => {
            pending = undefined
            throw error
        }))
}

import './setup'
import { fixture, pixels } from './setup'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync } from 'node:fs'
import { loadImage, createCanvas } from '@napi-rs/canvas'
import ExifReader from 'exifreader'
import { init as initWebp } from '@jsquash/webp/encode.js'
import { simd } from 'wasm-feature-detect'
import { exifFixture } from './exif-fixture'
import { defaultPreferences } from '../src/domain/settings'
import { exportOne } from '../src/application/export'
import { renderPhoto } from '../src/engine/render'
import { setRotation, originalEdit } from '../src/engine/geometry/crop'
import restoreJpeg from '../src/engine/metadata/jpeg'
import restorePng from '../src/engine/metadata/png'

test('JPEG and WebP encoded exports preserve preview geometry at quarter and custom angles', async () => {
    const wasm = (await simd()) ? 'webp_enc_simd.wasm' : 'webp_enc.wasm'
    await initWebp(await WebAssembly.compile(readFileSync(`node_modules/@jsquash/webp/codec/enc/${wasm}`)))
    const photo = fixture(81, 63)
    for (const rotation of [90, 17.3])
        for (const exportToJpeg of [true, false]) {
            photo.edit = setRotation(originalEdit(), rotation, 81, 63)
            const settings = {
                ...defaultPreferences(),
                selectedThemeName: 'One line',
                ratio: '4:5',
                notCroppedMode: true,
                applyRatioToText: true,
                exportToJpeg,
                fixImageWidth: true,
                imageWidth: 240,
            }
            const preview = await renderPhoto(photo, settings)
            const exported = await exportOne(photo, settings)
            assert.equal(exported.filename, `original.${exportToJpeg ? 'jpg' : 'webp'}`)
            const decoded = await loadImage(Buffer.from(exported.data.split(',')[1], 'base64'))
            assert.equal(decoded.width, preview.width)
            assert.equal(decoded.height, preview.height)
            preview.width = preview.height = 1
        }
})

test('JPEG/PNG normalize all EXIF orientations and both TIFF byte orders without changing encoded pixels', async () => {
    const photo = fixture(83, 61)
    const jpg = photo.image.toDataURL('image/jpeg', 1)
    const encoded = Buffer.from(jpg.split(',')[1], 'base64')
    const png = photo.image.toDataURL('image/png')
    for (const little of [true, false])
        for (const orientation of [1, 2, 3, 4, 5, 6, 7, 8]) {
            const exif = exifFixture(little, orientation)
            const original =
                'data:image/jpeg;base64,' +
                Buffer.concat([encoded.subarray(0, 2), exif, encoded.subarray(2)]).toString('base64')
            for (const format of ['jpeg', 'png']) {
                const output =
                    format === 'jpeg' ? restoreJpeg(original, jpg, 83, 61) : restorePng(original, png, 83, 61)
                const bytes = Buffer.from(output.split(',')[1], 'base64')
                const tags = ExifReader.load(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength))
                assert.equal(tags.Orientation.value, 1)
                assert.equal(tags.PixelXDimension.value, 83)
                assert.equal(tags.PixelYDimension.value, 61)
                assert.equal(tags.Thumbnail, undefined)
                if (format === 'jpeg') assert.deepEqual(bytes.subarray(2 + exif.length), encoded.subarray(2))
                else {
                    // Every compressed image chunk after IHDR is untouched; decoder also validates eXIf CRC.
                    assert.deepEqual(
                        bytes.subarray(33 + exif.length + 2),
                        Buffer.from(png.split(',')[1], 'base64').subarray(33),
                    )
                    const decoded = await loadImage(bytes)
                    const target = createCanvas(decoded.width, decoded.height)
                    target.getContext('2d').drawImage(decoded, 0, 0)
                    assert.deepEqual(pixels(target), pixels(photo.image))
                    target.width = target.height = 1
                }
            }
        }
})

test('native PNG bypasses resize and preserves every source pixel; JPEG 100 keeps source dimensions', async () => {
    const photo = fixture(5003, 7)
    const settings = {
        ...defaultPreferences(),
        selectedThemeName: 'No frame',
        quality: 100,
        exportToJpeg: true,
        fixImageWidth: true,
        imageWidth: 50,
    }
    for (const losslessExport of [true, false]) {
        const result = await exportOne(photo, { ...settings, losslessExport })
        const decoded = await loadImage(Buffer.from(result.data.split(',')[1], 'base64'))
        assert.equal(decoded.width, 5003)
        assert.equal(decoded.height, 7)
        if (losslessExport) {
            const target = createCanvas(decoded.width, decoded.height)
            target.getContext('2d').drawImage(decoded, 0, 0)
            assert.deepEqual(pixels(target), pixels(photo.image))
            target.width = target.height = 1
        }
    }
})

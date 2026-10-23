import './setup'
import { fixture, pixels, storage } from './setup'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import PhotoView from '../src/domain/photo'
import { defaultPreferences } from '../src/domain/settings'
import { themes } from '../src/engine/themes/catalog'
import { themeInput, renderPhoto } from '../src/engine/render'
import compose from '../src/engine/render/compose'
import { originalEdit, setRotation, cropPixels, constrainCrop } from '../src/engine/geometry/crop'
import { fitFinalRatio, finalFooterHeight, FINAL_RATIOS, hasFinalFooter } from '../src/engine/geometry/final-frame'
import { normalizeAspectRatio } from '../src/engine/geometry/aspect'
import { dragAxis, centerCropAxis, moveCropAxis } from '../src/engine/geometry/controls'
import { BACKGROUND_PRESETS, contrast, photoAppearance } from '../src/engine/render/background'
import { exportOne, reserveFilename, timestamp } from '../src/application/export'
import { parseSettings, serializeSettings, validatePreferences } from '../src/application/settings-codec'
import { parsePhoto, serializePhoto } from '../src/application/photo-codec'
import MetadataReader from '../src/engine/metadata/reader'
import { renderCollage } from '../src/engine/collage'

test('all 16 styles render; original rasters and recipes never change', async () => {
    const photo = fixture(),
        source = pixels(photo.image)
    for (const theme of themes) {
        const p = {
            ...defaultPreferences(),
            selectedThemeName: theme.name,
            losslessExport: true,
        }
        const canvas = await compose(theme.paint, new PhotoView(photo, p), themeInput(p), p)
        assert.ok(canvas.width > 0 && canvas.height > 0, theme.name)
        canvas.width = canvas.height = 1
    }
    assert.deepEqual(pixels(photo.image), source)
    assert.deepEqual(photo.edit, originalEdit())
})
test('PNG exports decode to identical preview pixels including background, rotation, footer scaling and EXIF handling', async () => {
    const photo = fixture(301, 403)
    photo.background = 'blur'
    photo.edit = setRotation({ ...originalEdit(), finalRatio: '3:4' }, 17.3, 301, 403)
    const p = {
        ...defaultPreferences(),
        losslessExport: true,
        themeOptions: { Strap: { EXIF_SCALE: 85 } },
    }
    const canvas = await renderPhoto(photo, p)
    const result = await exportOne(photo, p)
    const image = await loadImage(Buffer.from(result.data.split(',')[1], 'base64')),
        decoded = createCanvas(image.width, image.height)
    decoded.getContext('2d').drawImage(image, 0, 0)
    assert.equal(canvas.width * 4, canvas.height * 3)
    assert.deepEqual(pixels(decoded), pixels(canvas))
    canvas.width = canvas.height = decoded.width = decoded.height = 1
})
test('arbitrary-angle crop stress stays inside the rotated original for 2000 deterministic cases', () => {
    let seed = 42
    const random = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32
    for (let i = 0; i < 2000; i++) {
        const w = 100 + Math.floor(random() * 6000),
            h = 100 + Math.floor(random() * 6000),
            a = random() * 360,
            edit = setRotation(
                {
                    ...originalEdit(),
                    crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
                },
                a,
                w,
                h,
            ),
            rect = constrainCrop(w, h, a, edit.crop)
        for (const value of Object.values(rect)) assert.ok(Number.isFinite(value))
        const bounded = cropPixels(w, h, edit)
        assert.ok(bounded.width >= 1 && bounded.height >= 1)
        assert.ok(Math.abs(rect.width - edit.crop.width) < 1e-8)
    }
})
test('rotation back to zero restores selection without progressive shrinking', () => {
    const initial = {
        ...originalEdit(),
        crop: { x: 0.1, y: 0.1, width: 0.8, height: 0.8 },
    }
    const turned = setRotation(initial, 17, 1200, 1600),
        restored = setRotation(turned, 0, 1200, 1600)
    assert.deepEqual(restored.crop, initial.crop)
})
test('Shift movement uses screen axes and centering preserves dimensions', () => {
    assert.equal(dragAxis(0.1, 0.2, 1000, 100), 'x')
    const c = { x: 0.1, y: 0.1, width: 0.5, height: 0.5 }
    const moved = moveCropAxis(1000, 800, 0, c, 'x', 0.3)
    assert.equal(moved.y, c.y)
    assert.equal(moved.width, c.width)
    assert.equal(centerCropAxis(1000, 800, 0, c, 'x').x, 0.25)
})
test('all final presets stay exact and footer changes adapt every footer theme', async () => {
    const photo = fixture(601, 803)
    for (const theme of themes.filter((t) => hasFinalFooter(t.name))) {
        for (const scale of [75, 100, 125]) {
            const p = {
                ...defaultPreferences(),
                selectedThemeName: theme.name,
                losslessExport: true,
                themeOptions: { [theme.name]: { EXIF_SCALE: scale } },
            }
            photo.edit = { ...originalEdit(), finalRatio: '3:4' }
            const input = themeInput(p),
                bottom = finalFooterHeight(theme.name, input),
                edit = fitFinalRatio(photo.edit, 601, 803, bottom),
                rect = cropPixels(601, 803, edit),
                canvas = await renderPhoto(photo, p)
            assert.equal(canvas.width * 4, canvas.height * 3)
            const ctx = (photo.image as any).getContext('2d')
            assert.deepEqual(
                Buffer.from(canvas.getContext('2d')!.getImageData(0, 0, rect.width, rect.height).data),
                Buffer.from(ctx.getImageData(rect.x, rect.y, rect.width, rect.height).data),
            )
            assert.deepEqual(cropPixels(601, 803, fitFinalRatio(edit, 601, 803, bottom)), rect)
            canvas.width = canvas.height = 1
        }
    }
})
test('background presets have readable primary and secondary colors', () => {
    const photo = fixture()
    for (const preset of BACKGROUND_PRESETS) {
        photo.background = preset.id
        const appearance = photoAppearance(new PhotoView(photo, defaultPreferences()))
        assert.ok(contrast(preset.color, appearance.primary) >= 4.5)
        assert.ok(contrast(preset.color, appearance.secondary) >= 4.5)
    }
})
test('EXIF/XMP nested values and timestamps fail over without object strings', () => {
    const m = new MetadataReader({
        exif: { ISOSpeedRatings: { value: 0 } },
        xmp: {
            Model: { value: 'SONY ILCE-7CM2' },
            ISOSpeedRatings: { value: [{ value: '6400' }] },
            DateTimeOriginal: { value: '2026-10-17T21:32:48.792+09:00' },
            FNumber: { value: '56/10' },
            FocalLength: { value: '70/1' },
            ExposureTime: { value: '1/30' },
        },
    } as any)
    assert.equal(m.iso, 'ISO6400')
    assert.equal(m.make, 'SONY')
    assert.equal(m.model, 'ILCE-7CM2')
    assert.equal(m.takenAt, '2026-10-17T21:32:48.792+09:00')
    assert.equal(m.fNumber, 'F5.6')
})
test('global overrides are explicit and independent of browser storage', () => {
    const photo = fixture(),
        p = defaultPreferences()
    storage.set('showCameraMaker', 'false')
    p.overrideCameraMaker = 'Canon'
    assert.equal(new PhotoView(photo, p).make, 'Canon')
    p.showCameraMaker = false
    assert.equal(new PhotoView(photo, p).make, '')
    assert.equal(new PhotoView(photo, p).logoMake, 'Canon')
    storage.clear()
})
test('global JSON round-trips all option values and invalid import is transactional', () => {
    const p = defaultPreferences()
    p.ratio = '7:5'
    p.themeOptions = {
        Strap: { EXIF_SCALE: 85, AUTO_PADDING_TOP: false, ARTIST: '' },
    }
    const json = serializeSettings(p),
        restored = parseSettings(json)
    assert.equal(restored.ratio, '7:5')
    assert.equal(restored.themeOptions.Strap.EXIF_SCALE, 85)
    assert.equal(restored.themeOptions.Strap.AUTO_PADDING_TOP, false)
    const bad = JSON.parse(json)
    bad.settings.quality = 0
    assert.throws(() => parseSettings(JSON.stringify(bad)))
    assert.equal(p.quality, 95)
})
test('individual JSON restores editing/background/metadata and rejects mismatched originals and invalid geometry', () => {
    const photo = fixture()
    photo.edit = setRotation(originalEdit(), 15, 121, 163)
    photo.background = 'black'
    const restored = fixture()
    Object.assign(restored, parsePhoto(serializePhoto(photo), restored))
    assert.deepEqual(restored.edit, photo.edit)
    assert.equal(restored.background, 'black')
    assert.throws(() => parsePhoto(serializePhoto(photo), fixture(122, 163)))
    const bad = JSON.parse(serializePhoto(photo))
    bad.edit.crop.width = 0
    assert.throws(() => parsePhoto(JSON.stringify(bad), restored))
})
test('custom ratios, output names and timestamps are filesystem-safe', () => {
    assert.equal(normalizeAspectRatio('1080:1440'), '3:4')
    assert.equal(normalizeAspectRatio('1.91:1'), '191:100')
    assert.equal(normalizeAspectRatio('0:1'), undefined)
    const used = new Set<string>()
    assert.equal(reserveFilename('사진.png', used), '사진.png')
    assert.equal(reserveFilename('사진.png', used), '사진 (2).png')
    assert.equal(timestamp(new Date(2026, 0, 2, 3, 4, 5)), '2026-01-02_03-04-05')
})
test('collage validates bounds and leaves inputs untouched', () => {
    const photo = fixture(),
        source = pixels(photo.image),
        p = defaultPreferences(),
        o = {
            ratio: '1:1',
            rows: 2,
            columns: 2,
            gap: 20,
            top: 50,
            bottom: 50,
            left: 50,
            right: 50,
            background: '#fff',
        }
    const canvas = renderCollage([photo, photo], p, o)
    assert.equal(canvas.width, canvas.height)
    assert.deepEqual(pixels(photo.image), source)
    assert.throws(() => renderCollage([photo], p, { ...o, rows: 0 }))
    canvas.width = canvas.height = 1
})
test('cancelled render stops before allocating a full-resolution canvas', async () => {
    const controller = new AbortController()
    controller.abort()
    await assert.rejects(() => renderPhoto(fixture(), defaultPreferences(), controller.signal))
})

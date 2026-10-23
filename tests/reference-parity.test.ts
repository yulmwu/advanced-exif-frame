import './setup'
import { fixture, pixels, storage } from './setup'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import fs from 'node:fs'
import path from 'node:path'
import { createRequire } from 'node:module'
import ts from 'typescript'
import PhotoView from '../src/domain/photo'
import { defaultPreferences } from '../src/domain/settings'
import { themes } from '../src/engine/themes/catalog'
import { themeInput } from '../src/engine/render'
import { renderCollage } from '../src/engine/collage'
import compose from '../src/engine/render/compose'
import { setRotation, originalEdit } from '../src/engine/geometry/crop'
const root = process.env.LEGACY_PROJECT_ROOT
if (root) {
    const require = createRequire(import.meta.url),
        cache = new Map<string, any>()
    function reference(file: string): any {
        let name = path.resolve(file)
        if (!fs.existsSync(name) || fs.statSync(name).isDirectory())
            name = fs.existsSync(name + '.ts') ? name + '.ts' : name + '/index.ts'
        if (cache.has(name)) return cache.get(name)
        const exports = {}
        cache.set(name, exports)
        const code = ts.transpileModule(fs.readFileSync(name, 'utf8'), {
            fileName: name,
            compilerOptions: {
                module: ts.ModuleKind.CommonJS,
                target: ts.ScriptTarget.ES2022,
                jsx: ts.JsxEmit.ReactJSX,
            },
        }).outputText
        new Function('require', 'exports', code)(
            (dependency: string) =>
                dependency.startsWith('.')
                    ? reference(path.resolve(path.dirname(name), dependency))
                    : require(dependency),
            exports,
        )
        return exports
    }
    test('all 16 frame painters match the reference output pixel-for-pixel across native backgrounds, crops and EXIF sizing', async () => {
        const oldThemes = reference(path.join(root, 'src/themes/index.ts')).default,
            oldCompose = reference(path.join(root, 'src/core/drawing/render.ts')).default,
            LegacyPhoto = reference(path.join(root, 'src/core/photo.ts')).default
        for (const mode of ['default', 'edited', 'footer'])
            for (const theme of themes) {
                const record = fixture(),
                    settings = {
                        ...defaultPreferences(),
                        selectedThemeName: theme.name,
                        losslessExport: true,
                    }
                if (mode === 'edited') {
                    record.edit = setRotation(originalEdit(), 17.3, 121, 163)
                    record.background = 'navy'
                }
                if (mode === 'footer') settings.themeOptions = { [theme.name]: { EXIF_SCALE: 125 } }
                storage.clear()
                for (const [key, value] of Object.entries(settings))
                    if (key !== 'themeOptions')
                        storage.set(key, typeof value === 'object' ? JSON.stringify(value) : String(value))
                const photo = Object.assign(new LegacyPhoto(), record),
                    oldTheme = oldThemes.find((t: any) => t.name === theme.name),
                    options = themeInput(settings)
                const expected = await oldCompose(oldTheme.func, photo, options, settings),
                    actual = await compose(theme.paint, new PhotoView(record, settings), options, settings)
                assert.equal(actual.width, expected.width, theme.name)
                assert.equal(actual.height, expected.height, theme.name)
                assert.deepEqual(pixels(actual), pixels(expected), `${theme.name}/${mode}`)
                actual.width = actual.height = expected.width = expected.height = 1
            }
        storage.clear()
    })
    test('collage retains reference dimensions and center crop placement for portrait, square and landscape layouts', () => {
        const paint = reference(path.join(root!, 'src/pages/lab/collage/theme/SIMPLE.ts')).default
        const LegacyPhoto = reference(path.join(root!, 'src/core/photo.ts')).default
        for (const ratio of ['4:5', '1:1', '16:9']) {
            const records = [fixture(51, 37), fixture(29, 43)]
            records[1].edit = setRotation(originalEdit(), 17.3, 29, 43)
            const options = {
                ratio,
                rows: 2,
                columns: 2,
                gap: 50,
                top: 60,
                bottom: 70,
                left: 80,
                right: 90,
                background: '#e2e4e7',
            }
            const expected = paint(
                records.map((record) => Object.assign(new LegacyPhoto(), record)),
                {
                    ratio,
                    numberOfRow: 2,
                    numberOfColumn: 2,
                    marginEach: 50,
                    paddingTop: 60,
                    paddingBottom: 70,
                    paddingLeft: 80,
                    paddingRight: 90,
                    backgroundColor: options.background,
                },
            )
            const actual = renderCollage(records, defaultPreferences(), options)
            assert.equal(actual.width, expected.width)
            assert.equal(actual.height, expected.height)
            const actualPixels = pixels(actual),
                expectedPixels = pixels(expected)
            const first = actualPixels.findIndex((value, index) => value !== expectedPixels[index])
            assert.equal(
                first,
                -1,
                `${ratio}: first pixel difference at ${first}, actual=${actualPixels[first]} expected=${expectedPixels[first]}`,
            )
            expected.width = expected.height = actual.width = actual.height = 1
        }
    })
} else {
    test(
        'legacy differential comparison',
        { skip: 'Run npm run test:parity with the legacy checkout available' },
        () => {},
    )
}

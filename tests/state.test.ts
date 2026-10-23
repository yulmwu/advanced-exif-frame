import './setup'
import { fixture, storage, pixels } from './setup'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { useWorkspace } from '../src/application/workspace'
import { defaultPreferences } from '../src/domain/settings'
import { loadPreferences, STORAGE_KEY } from '../src/application/settings-codec'
import { serializePhoto, parsePhoto } from '../src/application/photo-codec'

test('preferences persist completely while photos, backgrounds and history stay out of storage', () => {
    storage.clear()
    const state = useWorkspace.getState()
    state.clear()
    state.replacePreferences({
        ...defaultPreferences(),
        selectedThemeName: 'Film',
        ratio: '7:5',
        quality: 89,
        themeOptions: { Film: { PADDING_TOP: 42 } },
    })
    const photo = fixture()
    const original = pixels(photo.image)
    state.addPhotos([photo])
    state.applyRecipe(photo.id, { background: 'black' })
    assert.equal(useWorkspace.getState().photos[0].background, 'black')
    state.undo()
    assert.equal(useWorkspace.getState().photos[0].background, 'white')
    state.redo()
    assert.equal(useWorkspace.getState().photos[0].background, 'black')
    assert.deepEqual(loadPreferences(), useWorkspace.getState().preferences)
    const stored = JSON.parse(storage.get(STORAGE_KEY)!)
    assert.equal(stored.photos, undefined)
    assert.equal(stored.history, undefined)
    assert.deepEqual(pixels(photo.image), original)
    state.clear()
    assert.deepEqual(useWorkspace.getState().photos, [])
    assert.equal(loadPreferences().selectedThemeName, 'Film')
})

test('invalid photo JSON rejects unknown, missing, non-finite or malformed recipe fields without mutation', () => {
    const photo = fixture()
    const original = serializePhoto(photo)
    const mutations = [
        (v: any) => {
            delete v.edit.crop.width
        },
        (v: any) => {
            v.edit.crop.extra = 1
        },
        (v: any) => {
            v.edit.rotationReference = { rotation: 0 }
        },
        (v: any) => {
            v.edit.rotation = null
        },
        (v: any) => {
            v.edit.preset = 'broken'
        },
        (v: any) => {
            v.edit.finalRatio = ''
        },
        (v: any) => {
            v.metadata.iso = {}
        },
        (v: any) => {
            v.source.name = 1
        },
        (v: any) => {
            v.extra = true
        },
    ]
    for (const mutate of mutations) {
        const v = JSON.parse(original)
        mutate(v)
        assert.throws(() => parsePhoto(JSON.stringify(v), photo))
    }
    assert.equal(serializePhoto(photo), original)
})

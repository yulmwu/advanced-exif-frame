import { test, expect } from '@playwright/test'
test('desktop workspace renders a sample, changes frames and exports preferences', async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await expect(page.getByRole('heading', { name: '샘플 사진', exact: true })).toBeVisible()
    await expect(page.locator('.canvas-content .frame-preview')).toHaveAttribute('data-state', 'ready')
    expect(await page.evaluate(() => document.documentElement.scrollHeight)).toBeLessThanOrEqual(1000)
    await page.screenshot({ path: 'docs/workspace-desktop.png', fullPage: true })
    await page.getByRole('button', { name: 'One line', exact: true }).click()
    await expect(page.locator('.canvas-content .frame-preview')).toHaveAttribute('data-state', 'ready')
    await page.getByRole('button', { name: '사진 편집', exact: true }).click()
    await expect(page.locator('.crop-selection')).toBeVisible()
    await page.getByRole('button', { name: '배경', exact: true }).click()
    await page.getByRole('button', { name: '블랙', exact: true }).click()
    await page.getByRole('button', { name: '내보내기', exact: true }).first().click()
    await page.locator('.format-options').getByRole('button', { name: /^PNG/ }).first().click()
    await expect(page.getByRole('slider').first()).toBeDisabled()
    await page.screenshot({ path: 'docs/workspace-export.png', fullPage: true })
    expect(errors).toEqual([])
})
test('mobile has no horizontal overflow and all tools remain reachable', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')
    await expect(page.locator('.canvas-content .frame-preview')).toHaveAttribute('data-state', 'ready')
    await page.screenshot({ path: 'docs/workspace-mobile.png', fullPage: true })
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
    expect(overflow).toBe(false)
    await page.getByRole('button', { name: '사진 편집', exact: true }).click()
    await expect(page.locator('.crop-selection')).toBeVisible()
    await page.getByRole('button', { name: '배경', exact: true }).click()
    await expect(page.locator('.swatch-grid button')).toHaveCount(16)
})

test('real photo import, crop geometry, preview modal and paired ZIP export work together', async ({ page }) => {
    const { createCanvas } = await import('@napi-rs/canvas')
    const c = createCanvas(120, 160)
    c.getContext('2d').fillRect(0, 0, 120, 160)
    const buffer = c.toBuffer('image/png')
    await page.goto('/')
    await page.locator('input[type=file][multiple]').setInputFiles([
        { name: 'same.png', mimeType: 'image/png', buffer },
        { name: 'same.png', mimeType: 'image/png', buffer },
    ])
    await expect(page.locator('.film-item')).toHaveCount(2)
    await expect(page.locator('.job-toast')).toHaveCount(0)
    await page.getByRole('button', { name: '사진 편집', exact: true }).click()
    const box = await page.locator('.crop-stage').boundingBox()
    expect(box).not.toBeNull()
    expect(Math.abs(box!.width / box!.height - 120 / 160)).toBeLessThan(0.01)
    await page.locator('.inspector select').first().selectOption('1:1')
    await page.getByRole('button', { name: '적용', exact: true }).last().click()
    await page.getByRole('button', { name: '내보내기', exact: true }).first().click()
    await page.locator('.format-options').getByRole('button', { name: /^PNG/ }).first().click()
    const downloadEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: '전체 내보내기', exact: true }).click()
    const download = await downloadEvent
    expect(download.suggestedFilename()).toMatch(/^\d{4}-\d{2}-\d{2}_.*\.zip$/)
    const file = await download.path()
    const fs = await import('node:fs')
    const JSZip = (await import('jszip')).default
    const zip = await JSZip.loadAsync(fs.readFileSync(file!))
    expect(Object.keys(zip.files).sort()).toEqual(
        ['same (2).png', 'same (2).settings.json', 'same.png', 'same.settings.json'].sort(),
    )
    const first = JSON.parse(await zip.file('same.settings.json')!.async('string'))
    expect(first.edit.preset).toBe('1:1')
    await page.getByRole('button', { name: '전체 미리보기', exact: true }).first().click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('WebP WASM loads in the browser and the default export decodes correctly', async ({ page }) => {
    const { createCanvas, loadImage } = await import('@napi-rs/canvas')
    const errors: string[] = []
    page.on('pageerror', (error) => errors.push(error.message))
    await page.goto('/')
    await page.locator('input[type=file][multiple]').setInputFiles({
        name: 'webp-source.png',
        mimeType: 'image/png',
        buffer: createCanvas(120, 160).toBuffer('image/png'),
    })
    await expect(page.locator('.film-item')).toHaveCount(1)
    await expect(page.locator('.job-toast')).toHaveCount(0)
    await page.getByRole('button', { name: '내보내기', exact: true }).first().click()
    await page.locator('.toggle-row').filter({ hasText: '사진 너비 고정' }).click()
    await expect(page.getByLabel('사진 너비 고정')).toBeChecked()
    await page.getByRole('spinbutton', { name: '긴 변 크기' }).fill('240')
    const event = page.waitForEvent('download')
    await page.locator('.inspector').getByRole('button', { name: '내보내기', exact: true }).click()
    const download = await event
    expect(download.suggestedFilename()).toBe('webp-source.webp')
    const { readFileSync } = await import('node:fs')
    const decoded = await loadImage(readFileSync((await download.path())!))
    expect(Math.max(decoded.width, decoded.height)).toBe(240)
    expect(errors).toEqual([])
})

test('settings survive reload, photos reset, and global JSON backups restore the full configuration', async ({
    page,
}) => {
    await page.goto('/')
    await expect(page.locator('.canvas-content .frame-preview')).toHaveAttribute('data-state', 'ready')
    await page.getByRole('button', { name: 'Simple', exact: true }).click()
    await page.getByRole('slider', { name: 'EXIF 영역 크기' }).fill('85')
    await page.getByRole('button', { name: '내보내기', exact: true }).first().click()
    await page.locator('.format-options').getByRole('button', { name: /^PNG/ }).click()
    const previous = await page.evaluate(() => localStorage.getItem('advanced-exif-frame.preferences.v1'))
    await page.locator('.inspector summary').filter({ hasText: '설정 백업 / 복원' }).click()
    const event = page.waitForEvent('download')
    await page.locator('.inspector').getByRole('button', { name: '설정 저장', exact: true }).click()
    const download = await event
    const { readFileSync } = await import('node:fs')
    const buffer = readFileSync((await download.path())!)
    await page.reload()
    await expect(page.locator('.canvas-content .frame-preview')).toHaveAttribute('data-state', 'ready')
    expect(await page.evaluate(() => localStorage.getItem('advanced-exif-frame.preferences.v1'))).toBe(previous)
    await expect(page.locator('.film-item')).toHaveCount(1)
    await expect(page.locator('.film-item')).toContainText('샘플 사진')
    await page.getByRole('button', { name: 'Film', exact: true }).click()
    await page.getByRole('button', { name: '내보내기', exact: true }).first().click()
    await page.locator('.inspector input[type=file]').first().setInputFiles({
        name: 'settings.json',
        mimeType: 'application/json',
        buffer,
    })
    await expect
        .poll(() =>
            page.evaluate(
                () => JSON.parse(localStorage.getItem('advanced-exif-frame.preferences.v1')!).selectedThemeName,
            ),
        )
        .toBe('Simple')
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('advanced-exif-frame.preferences.v1')!))
    expect(restored.selectedThemeName).toBe('Simple')
    expect(restored.themeOptions.Simple.EXIF_SCALE).toBe(85)
    expect(restored.losslessExport).toBe(true)
})

test('crop keyboard and Shift movement stay on the selected photo; final ratio follows footer changes', async ({
    page,
}) => {
    const { createCanvas } = await import('@napi-rs/canvas')
    const buffer = createCanvas(600, 800).toBuffer('image/png')
    await page.goto('/')
    await page.locator('input[type=file][multiple]').setInputFiles([
        { name: 'first.png', mimeType: 'image/png', buffer },
        { name: 'second.png', mimeType: 'image/png', buffer },
    ])
    await expect(page.locator('.film-item')).toHaveCount(2)
    await expect(page.locator('.job-toast')).toHaveCount(0)
    await page.getByRole('button', { name: '사진 편집', exact: true }).click()
    await page.locator('.inspector select').first().selectOption('1:1')
    await page.getByRole('slider', { name: '범위 크기' }).fill('50')
    const selection = page.locator('.crop-selection')
    const before = await selection.evaluate((e) => ({
        left: parseFloat(e.style.left),
        top: parseFloat(e.style.top),
    }))
    await selection.focus()
    await page.keyboard.press('ArrowRight')
    await expect(page.locator('.canvas-heading h1')).toHaveText('first.png')
    const after = await selection.evaluate((e) => parseFloat(e.style.left))
    expect(after).toBeGreaterThan(before.left)
    const box = (await selection.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.keyboard.down('Shift')
    await page.mouse.down()
    await page.mouse.move(box.x + box.width / 2 + 40, box.y + box.height / 2 + 12, { steps: 4 })
    await page.mouse.up()
    await page.keyboard.up('Shift')
    expect(await selection.evaluate((e) => parseFloat(e.style.top))).toBeCloseTo(before.top, 4)
    await page.getByRole('button', { name: '가로 중앙 정렬', exact: true }).click()
    const center = await selection.evaluate((e) => parseFloat(e.style.left) + parseFloat(e.style.width) / 2)
    expect(center).toBeCloseTo(50, 4)
    await page.getByRole('spinbutton', { name: '회전 각도' }).fill('12.5')
    await page.getByRole('spinbutton', { name: '회전 각도' }).blur()
    await page.locator('.toggle-row').filter({ hasText: '최종 비율에 맞추기' }).click()
    await page.getByRole('button', { name: '적용', exact: true }).last().click()
    await page.getByRole('button', { name: '프레임', exact: true }).click()
    await page.getByRole('button', { name: 'One line', exact: true }).click()
    await page.getByRole('slider', { name: 'EXIF 영역 크기' }).fill('75')
    await expect(page.locator('.canvas-content .frame-preview')).toHaveAttribute('data-state', 'ready')
    const ratio = await page
        .locator('.canvas-content canvas')
        .evaluate((e) => Number(e.dataset.width) / Number(e.dataset.height))
    expect(ratio).toBeCloseTo(3 / 4, 3)
})

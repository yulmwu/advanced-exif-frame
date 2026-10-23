import { brandLogo } from '../../assets'
import { footerScale } from '../../render/footer-size'
import { photoAppearance } from '../../render/background'
import Photo from '../../../domain/photo'
import { RenderSettings } from '../../../domain/settings'
import sandbox, { themeContext } from '../../render/layout'
import { ThemeFunc } from '../types'
import { ThemeOption, ThemeOptionInput } from '../../../domain/theme'
import autoTopPadding from '../../render/top-spacing'
const strapOptions: ThemeOption[] = [
    { id: 'ARTIST', type: 'string', default: '', description: 'your name' },
    {
        id: 'DARK_MODE',
        type: 'boolean',
        default: false,
        description: 'enable to use dark mode',
    },
    {
        id: 'SECONDARY_TEXT_FONT_WEIGHT',
        type: 'range-slider',
        min: 100,
        max: 900,
        step: 100,
        default: 300,
        description: '100 - 900',
    },
    { id: 'PADDING_TOP', type: 'number', default: 0, description: 'px' },
    {
        id: 'AUTO_PADDING_TOP',
        type: 'boolean',
        default: false,
        description:
            'automatically set top spacing to half the average actual side gap, including ratio padding; no manual padding required. OFF uses PADDING_TOP',
    },
    { id: 'PADDING_BOTTOM', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_LEFT', type: 'number', default: 0, description: 'px' },
    { id: 'PADDING_RIGHT', type: 'number', default: 0, description: 'px' },
    { id: 'TEMPLATE1', type: 'string', default: '{ISO}{MM}{F}{SEC}' },
    { id: 'TEMPLATE2', type: 'string', default: '{MAKER}{BODY}' },
    { id: 'TEMPLATE3', type: 'string', default: '{TAKEN_AT}' },
    { id: 'TEMPLATE4', type: 'string', default: '{LENS}' },
]
const strapFunc: ThemeFunc = (photo: Photo, input: ThemeOptionInput, store: RenderSettings) => {
    const artist = (input.get('ARTIST') as string).trim()
    const darkMode = photoAppearance(photo).dark
    const secondaryTextFontWeight = input.get('SECONDARY_TEXT_FONT_WEIGHT') as number
    const paddingBottom = (input.get('PADDING_BOTTOM') as number) + 300
    const paddingLeft = input.get('PADDING_LEFT') as number
    const paddingRight = input.get('PADDING_RIGHT') as number
    const paddingTop = input.get('PADDING_TOP') as number
    const template1 = (input.get('TEMPLATE1') as string).trim()
    const template2 = (input.get('TEMPLATE2') as string).trim()
    const template3 = (input.get('TEMPLATE3') as string).trim()
    const template4 = (input.get('TEMPLATE4') as string).trim()
    const fontSize = 70
    const backgroundColor = photoAppearance(photo).color
    const primaryTextColor = darkMode ? '#ffffff' : '#000000'
    const secondaryTextColor = photoAppearance(photo).secondary
    const text1 = template1
        .split('}')
        .map((part) => `${part}}`)
        .map((part) =>
            part
                .replace(/{MAKER}/g, photo.make)
                .replace(/{BODY}/g, photo.model || '')
                .replace(/{LENS}/g, photo.lensModel || '')
                .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
                .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
                .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
                .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
                .replace(/{TAKEN_AT}/g, photo.takenAt || '')
                .replace(/}/g, ''),
        )
        .filter(Boolean)
        .join(' ')
    const text2 = template2
        .split('}')
        .map((part) => `${part}}`)
        .map((part) =>
            part
                .replace(/{MAKER}/g, photo.make)
                .replace(/{BODY}/g, photo.model || '')
                .replace(/{LENS}/g, photo.lensModel || '')
                .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
                .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
                .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
                .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
                .replace(/{TAKEN_AT}/g, photo.takenAt || '')
                .replace(/}/g, ''),
        )
        .filter(Boolean)
        .join(' ')
    const text3 = template3
        .split('}')
        .map((part) => `${part}}`)
        .map((part) =>
            part
                .replace(/{MAKER}/g, photo.make)
                .replace(/{BODY}/g, photo.model || '')
                .replace(/{LENS}/g, photo.lensModel || '')
                .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
                .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
                .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
                .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
                .replace(/{TAKEN_AT}/g, photo.takenAt || '')
                .replace(/}/g, ''),
        )
        .filter(Boolean)
        .join(' ')
    const text4 = template4
        .split('}')
        .map((part) => `${part}}`)
        .map((part) =>
            part
                .replace(/{MAKER}/g, photo.make)
                .replace(/{BODY}/g, photo.model || '')
                .replace(/{LENS}/g, photo.lensModel || '')
                .replace(/{ISO}/g, store.disableExposureMeter ? '' : photo.iso || '')
                .replace(/{MM}/g, store.disableExposureMeter ? '' : photo.focalLength || '')
                .replace(/{F}/g, store.disableExposureMeter ? '' : photo.fNumber || '')
                .replace(/{SEC}/g, store.disableExposureMeter ? '' : photo.exposureTime || '')
                .replace(/{TAKEN_AT}/g, photo.takenAt || '')
                .replace(/}/g, ''),
        )
        .filter(Boolean)
        .join(' ')
    const frameOptions = {
        footerScale: footerScale(input),
        originalResolution: store.originalResolution,
        preserveAlpha: store.losslessExport,
        targetRatio: store.ratio,
        frameRatio: store.frameRatio,
        notCroppedMode: store.notCroppedMode,
        backgroundColor: backgroundColor,
        padding: {
            top: paddingTop,
            right: paddingRight,
            bottom: paddingBottom,
            left: paddingLeft,
        },
    }
    if (input.get('AUTO_PADDING_TOP')) frameOptions.padding.top = autoTopPadding(photo, frameOptions, store.frameRatio)
    const canvas = sandbox(photo, frameOptions)
    const { context, width: frameWidth, height: frameHeight } = themeContext(canvas)
    context.textBaseline = 'middle'
    // LEFT FIRST
    context.textAlign = 'left'
    // ISO, Focal Length, F-Number, Exposure Time
    context.font = `normal 500 ${fontSize}px Barlow`
    context.fillStyle = primaryTextColor
    if (!store.disableExposureMeter) {
        context.fillText(text1, fontSize, frameHeight - paddingBottom / 2 - fontSize / 2)
    }
    // Shot by
    if (artist) {
        context.font = `normal ${secondaryTextFontWeight} ${fontSize}px Barlow`
        context.fillStyle = secondaryTextColor
        context.fillText(`Shot by © ${artist}`, fontSize, frameHeight - paddingBottom / 2 + fontSize / 2)
    } else {
        context.font = `normal ${secondaryTextFontWeight} ${fontSize}px Barlow`
        context.fillStyle = secondaryTextColor
        context.fillText(text3, fontSize, frameHeight - paddingBottom / 2 + fontSize / 2)
    }
    // RIGHT SECOND
    context.textAlign = 'right'
    // Maker, Model
    context.fillStyle = primaryTextColor
    context.font = `normal 500 ${fontSize}px Barlow`
    const makerModelText = text2
    const topWidth = context.measureText(makerModelText).width
    context.fillText(makerModelText, frameWidth - fontSize, frameHeight - paddingBottom / 2 - fontSize / 2)
    // Lens Model
    context.fillStyle = secondaryTextColor
    context.font = `normal ${secondaryTextFontWeight} ${fontSize}px Barlow`
    const lensModelText = text4
    const bottomWidth = context.measureText(lensModelText).width
    context.fillText(lensModelText, frameWidth - fontSize, frameHeight - paddingBottom / 2 + fontSize / 2)
    // DRAW LINE
    context.beginPath()
    context.moveTo(
        frameWidth - Math.max(topWidth, bottomWidth) - fontSize * 2,
        frameHeight - paddingBottom / 2 - fontSize,
    )
    context.lineTo(
        frameWidth - Math.max(topWidth, bottomWidth) - fontSize * 2,
        frameHeight - paddingBottom / 2 + fontSize,
    )
    context.strokeStyle = secondaryTextColor
    context.lineWidth = 2
    context.stroke()
    // DRAW ICON
    let targetLogoHeight = fontSize * 2
    const targetLogoWidth = 400
    const maker = photo.logoMake
    const logo = brandLogo(maker, photo.logoModel, darkMode)
    if (logo && logo.width > 0 && logo.height > 0) {
        let logoWidth = (logo.width / logo.height) * targetLogoHeight
        if (logoWidth > targetLogoWidth) {
            logoWidth = targetLogoWidth
            targetLogoHeight = (logo.height / logo.width) * targetLogoWidth
        }
        context.drawImage(
            logo,
            frameWidth - Math.max(topWidth, bottomWidth) - fontSize * 2 - fontSize - logoWidth,
            frameHeight - paddingBottom / 2 - targetLogoHeight / 2,
            logoWidth,
            targetLogoHeight,
        )
    } else if (logo) {
        context.font = `normal 700 ${fontSize}px Barlow`
        context.fillStyle = primaryTextColor
        context.textAlign = 'center'
        context.fillText(
            maker,
            frameWidth - Math.max(topWidth, bottomWidth) - fontSize * 3 - targetLogoWidth / 2,
            frameHeight - paddingBottom / 2,
            targetLogoWidth,
        )
    }
    return canvas
}
export { strapFunc, strapOptions }

import type { FrameTheme } from './types'
import { hasFinalFooter } from '../geometry/final-frame'
import { EXIF_SCALE_OPTION } from '../render/footer-size'
import { noFrameOptions, noFrameThemeFunc } from './painters/no-frame'
import { justFrameOptions, justFrameFunc } from './painters/just-frame'
import { oneLineOptions, oneLineFunc } from './painters/one-line'
import { twoLineOptions, twoLineFunc } from './painters/two-line'
import { shotOnOneLineOptions, shotOnOneLineFunc } from './painters/shot-on-one-line'
import { shotOnTwoLineOptions, shotOnTwoLineFunc } from './painters/shot-on-two-line'
import { strapOptions, strapFunc } from './painters/strap'
import { filmOptions, filmFunc } from './painters/film'
import { monitorOptions, monitorFunc } from './painters/monitor'
import { lightroomOptions, lightroomFunc } from './painters/lightroom'
import { customOneLineOptions, customOneLineFunc } from './painters/custom-one-line'
import { customTwoLineOptions, customTwoLineFunc } from './painters/custom-two-line'
import { tipOptions, tipFunc } from './painters/tip'
import { posterOptions, posterFunc } from './painters/poster'
import { cinemascopeOptions, cinemascopeFunc } from './painters/cinemascope'
import { simpleOptions, simpleFunc } from './painters/simple'
export const themes: FrameTheme[] = [
    {
        name: 'No frame',
        category: 'minimal',
        options: noFrameOptions,
        paint: noFrameThemeFunc,
    },
    {
        name: 'Just frame',
        category: 'minimal',
        options: justFrameOptions,
        paint: justFrameFunc,
    },
    {
        name: 'One line',
        category: 'minimal',
        options: oneLineOptions,
        paint: oneLineFunc,
    },
    {
        name: 'Two line',
        category: 'minimal',
        options: twoLineOptions,
        paint: twoLineFunc,
    },
    {
        name: 'Shot on one line',
        category: 'signature',
        options: shotOnOneLineOptions,
        paint: shotOnOneLineFunc,
    },
    {
        name: 'Shot on two line',
        category: 'signature',
        options: shotOnTwoLineOptions,
        paint: shotOnTwoLineFunc,
    },
    {
        name: 'Strap',
        category: 'signature',
        options: strapOptions,
        paint: strapFunc,
    },
    {
        name: 'Film',
        category: 'editorial',
        options: filmOptions,
        paint: filmFunc,
    },
    {
        name: 'Monitor',
        category: 'minimal',
        options: monitorOptions,
        paint: monitorFunc,
    },
    {
        name: 'Lightroom',
        category: 'signature',
        options: lightroomOptions,
        paint: lightroomFunc,
    },
    {
        name: 'Custom One Line',
        category: 'minimal',
        options: customOneLineOptions,
        paint: customOneLineFunc,
    },
    {
        name: 'Custom Two Line',
        category: 'minimal',
        options: customTwoLineOptions,
        paint: customTwoLineFunc,
    },
    { name: 'Tip', category: 'editorial', options: tipOptions, paint: tipFunc },
    {
        name: 'Poster',
        category: 'editorial',
        options: posterOptions,
        paint: posterFunc,
    },
    {
        name: 'Cinema Scope',
        category: 'editorial',
        options: cinemascopeOptions,
        paint: cinemascopeFunc,
    },
    {
        name: 'Simple',
        category: 'signature',
        options: simpleOptions,
        paint: simpleFunc,
    },
].map((theme) => ({
    ...theme,
    category: theme.category as FrameTheme['category'],
    options: hasFinalFooter(theme.name) ? [EXIF_SCALE_OPTION, ...theme.options] : theme.options,
}))
export function themeByName(name: string) {
    const theme = themes.find((t) => t.name === name)
    if (!theme) throw new Error('Unknown frame theme')
    return theme
}

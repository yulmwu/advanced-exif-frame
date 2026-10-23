enum Font {
    Digital7 = 'digital-7',
    Poxel = 'poxel',
    DINAlternateBold = 'din-alternate-bold',
    Pretendard = 'pretendard',
}
export default Font
const loadedFonts = new Map<string, Promise<void>>()
export async function ensureFonts(family = 'Barlow') {
    if (typeof document === 'undefined' || !document.fonts) return
    if (!loadedFonts.has(family)) {
        loadedFonts.set(
            family,
            (async () => {
                if (Object.values(Font).includes(family as Font)) {
                    try {
                        const font = await new FontFace(family, `url(/fonts/${family}.ttf)`).load()
                        document.fonts.add(font)
                    } catch {
                        /* Canvas uses its fallback if an optional font is unavailable. */
                    }
                }
                if (document.fonts.load)
                    await Promise.allSettled(
                        ['normal', 'italic'].flatMap((style) =>
                            [100, 200, 300, 400, 500, 600, 700, 800, 900].map((weight) =>
                                document.fonts.load(`${style} ${weight} 70px ${family}`),
                            ),
                        ),
                    )
                await document.fonts.ready
            })(),
        )
    }
    await loadedFonts.get(family)
}
const logoPromises = new Map<string, Promise<HTMLImageElement | undefined>>()
const logos = new Map<string, HTMLImageElement>()
export async function ensureLogos(maker?: string, model?: string) {
    const brands = [
        'apple',
        'canon',
        'contax',
        'dji',
        'epson',
        'fujifilm',
        'goldstar',
        'hasselblad',
        'leica',
        'lg',
        'mamiya',
        'nikon',
        'olympus',
        'om',
        'pentax',
        'lumix',
        'phaseone',
        'ricoh',
        'sigma',
        'sony',
        'samsung',
    ]
    const requested = maker !== undefined ? [brandKey(maker, model ?? '')].filter(Boolean) : brands
    await Promise.all(
        requested.flatMap((brand) =>
            ['light', 'dark'].map((mode) => {
                const key = `${brand}-${mode}`
                if (!logoPromises.has(key))
                    logoPromises.set(
                        key,
                        new Promise((resolve) => {
                            const image = new Image()
                            image.onload = () => {
                                logos.set(key, image)
                                resolve(image)
                            }
                            image.onerror = () => {
                                logos.set(key, image)
                                resolve(undefined)
                            }
                            image.src = `/maker/${mode}/${brand}.png`
                        }),
                    )
                return logoPromises.get(key)
            }),
        ),
    )
}
function brandKey(maker: string, model: string) {
    const text = (maker + ' ' + model).toUpperCase()
    let brand = ''
    for (const [word, file] of [
        ['APPLE', 'apple'],
        ['CANON', 'canon'],
        ['CONTAX', 'contax'],
        ['DJI', 'dji'],
        ['EPSON', 'epson'],
        ['FUJI', 'fujifilm'],
        ['GOLD', 'goldstar'],
        ['HASSEL', 'hasselblad'],
        ['LEICA', 'leica'],
        ['LG', 'lg'],
        ['MAMIYA', 'mamiya'],
        ['NIKON', 'nikon'],
        ['OLYMPUS', 'olympus'],
        ['OM SYSTEM', 'om'],
        ['PANASONIC', 'lumix'],
        ['PHASE', 'phaseone'],
        ['RICO', 'ricoh'],
        ['PENTAX', 'pentax'],
        ['SIGMA', 'sigma'],
        ['SONY', 'sony'],
        ['SAMSUNG', 'samsung'],
    ])
        if (text.includes(word)) brand = file
    return brand
}
export function brandLogo(maker: string, model: string, dark: boolean) {
    return logos.get(`${brandKey(maker, model)}-${dark ? 'dark' : 'light'}`)
}

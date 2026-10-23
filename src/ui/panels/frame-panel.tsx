import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiSearch, FiRotateCcw } from 'react-icons/fi'
import { themes, themeByName } from '../../engine/themes/catalog'
import { useWorkspace } from '../../application/workspace'
import type { ThemeOption } from '../../domain/theme'
import { Field, NumberField, Section, Toggle, IconButton } from '../components/primitives'
export function optionLabel(id: string, ko: boolean) {
    const names: Record<string, string> = {
        EXIF_SCALE: 'EXIF 영역 크기',
        ARTIST: '촬영자',
        AUTO_PADDING_TOP: '상단 여백 자동 조절',
        PADDING_TOP: '상단 여백',
        PADDING_BOTTOM: '하단 여백',
        PADDING_LEFT: '왼쪽 여백',
        PADDING_RIGHT: '오른쪽 여백',
        PADDING_INSIDE: '사진 안에 정보 표시',
        FONT_FAMILY: '글꼴',
        FONT_SIZE: '글자 크기',
        FONT_WEIGHT: '글자 굵기',
        FONT_STYLE: '글자 스타일',
        TEXT_ALIGN: '텍스트 정렬',
        SECONDARY_TEXT_FONT_WEIGHT: '보조 글자 굵기',
        TOP_LABEL: '상단 라벨',
        LABEL: '하단 라벨',
        DIVIDER: '정보 구분자',
        TEXT: '텍스트',
        HIDE_TEXT: '텍스트 숨기기',
        TAG: '태그',
        TITLE: '제목',
        SHADOW_SIZE: '그림자 크기',
    }
    if (ko) {
        if (names[id]) return names[id]
        if (id.startsWith('TEMPLATE')) return '정보 템플릿 ' + id.replace('TEMPLATE', '')
        if (id.startsWith('DESCRIPTION')) return '설명 ' + id.replace('DESCRIPTION', '')
    }
    return id
        .toLowerCase()
        .replaceAll('_', ' ')
        .replace(/\b\w/g, (c) => c.toUpperCase())
}
function OptionControl({ option }: { option: ThemeOption }) {
    const { preferences: p, setThemeOption } = useWorkspace()
    const { i18n, t } = useTranslation()
    const value = p.themeOptions[p.selectedThemeName]?.[option.id] ?? option.default,
        label = optionLabel(option.id, i18n.language === 'ko')
    if (option.type === 'boolean')
        return <Toggle label={label} checked={Boolean(value)} onChange={(v) => setThemeOption(option.id, v)} />
    if (option.type === 'range-slider')
        return (
            <Field
                label={
                    <span className="flex justify-between">
                        <span>{label}</span>
                        <span className="tabular-nums">
                            {value}
                            {option.id === 'EXIF_SCALE' ? '%' : ''}
                        </span>
                    </span>
                }
                hint={option.id === 'EXIF_SCALE' ? t('root.themes.exif-scale-help') : undefined}
            >
                <input
                    aria-label={label}
                    type="range"
                    min={option.min}
                    max={option.max}
                    step={option.step}
                    value={Number(value)}
                    onChange={(e) => setThemeOption(option.id, Number(e.target.value))}
                />
            </Field>
        )
    if (option.type === 'number')
        return (
            <NumberField
                label={label}
                value={Number(value)}
                min={0}
                max={10000}
                unit="px"
                onChange={(v) => setThemeOption(option.id, v)}
            />
        )
    if (option.type === 'select')
        return (
            <Field label={label}>
                <select value={String(value)} onChange={(e) => setThemeOption(option.id, e.target.value)}>
                    {option.options.map((v) => (
                        <option key={v}>{v}</option>
                    ))}
                </select>
            </Field>
        )
    return (
        <Field
            label={label}
            hint={
                option.id.startsWith('TEMPLATE') ? '{MAKER} {BODY} {LENS} {ISO} {MM} {F} {SEC} {TAKEN_AT}' : undefined
            }
        >
            <input
                type={option.type === 'color' ? 'color' : 'text'}
                value={String(value)}
                onChange={(e) => setThemeOption(option.id, e.target.value)}
            />
        </Field>
    )
}
export function FramePanel() {
    const { preferences: p, patchPreferences, resetTheme } = useWorkspace()
    const { t } = useTranslation()
    const [query, setQuery] = useState(''),
        [category, setCategory] = useState('all'),
        [expanded, setExpanded] = useState(false)
    const priority = ['Strap', 'Simple', 'One line', 'Two line', 'Lightroom', 'Film']
    const ordered = [...themes].sort(
        (a, b) =>
            (priority.indexOf(a.name) < 0 ? 99 : priority.indexOf(a.name)) -
            (priority.indexOf(b.name) < 0 ? 99 : priority.indexOf(b.name)),
    )
    const filtered = ordered.filter(
        (theme) =>
            (category === 'all' || theme.category === category) &&
            theme.name.toLowerCase().includes(query.toLowerCase()),
    )
    const visible = query || expanded || category !== 'all' ? filtered : filtered.slice(0, 6)
    const theme = themeByName(p.selectedThemeName),
        options = theme.options.filter(
            (o) => !['BACKGROUND_COLOR', 'TEXT_COLOR', 'TEXT_ALPHA', 'DARK_MODE'].includes(o.id),
        )
    const layout = options.filter((o) => o.id.startsWith('PADDING') || o.id === 'AUTO_PADDING_TOP'),
        type = options.filter((o) => /FONT|ALIGN|STYLE/.test(o.id)),
        remaining = options.filter((o) => ![...layout, ...type].includes(o) && o.id !== 'EXIF_SCALE')
    return (
        <>
            <Section title={t('workspace.frame')}>
                <div className="search">
                    <FiSearch />
                    <input
                        placeholder={t('workspace.search')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                </div>
                <div className="category-tabs">
                    {['all', 'minimal', 'signature', 'editorial'].map((c) => (
                        <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>
                            {t(`workspace.${c === 'all' ? 'allThemes' : c}`)}
                        </button>
                    ))}
                </div>
                <div className="theme-grid">
                    {visible.map((theme, index) => (
                        <button
                            key={theme.name}
                            className={`theme-card ${theme.name === p.selectedThemeName ? 'selected' : ''}`}
                            aria-pressed={theme.name === p.selectedThemeName}
                            onClick={() => patchPreferences({ selectedThemeName: theme.name })}
                        >
                            <div className={`theme-sketch sketch-${theme.name.replaceAll(' ', '-').toLowerCase()}`}>
                                <div
                                    className="sketch-photo"
                                    style={{ backgroundPosition: `${35 + index * 2}% center` }}
                                />
                                <div className="sketch-caption">
                                    <i />
                                    <i />
                                    <i />
                                </div>
                            </div>
                            <span>{theme.name}</span>
                            {theme.name === p.selectedThemeName && <span className="selected-dot" />}
                        </button>
                    ))}
                </div>
                {category === 'all' && !query && (
                    <button className="gallery-toggle" onClick={() => setExpanded((v) => !v)}>
                        {expanded ? t('close') : t('root.themes.list') + ' · 16'}
                    </button>
                )}
            </Section>
            {!!options.length && (
                <Section
                    title={t('workspace.customize')}
                    action={
                        <IconButton
                            label={t('workspace.reset')}
                            onClick={(e) => {
                                e.preventDefault()
                                resetTheme()
                            }}
                        >
                            <FiRotateCcw />
                        </IconButton>
                    }
                >
                    {options
                        .filter((o) => o.id === 'EXIF_SCALE')
                        .map((o) => (
                            <OptionControl key={o.id} option={o} />
                        ))}
                    <p className="field-hint">{t('workspace.backgroundNote')}</p>
                </Section>
            )}
            {!!layout.length && (
                <Section title={t('workspace.padding')}>
                    {layout.map((o) => (
                        <OptionControl key={o.id} option={o} />
                    ))}
                </Section>
            )}
            {!!type.length && (
                <Section title={t('workspace.dimensions') + ' / Aa'} defaultOpen={false}>
                    {type.map((o) => (
                        <OptionControl key={o.id} option={o} />
                    ))}
                </Section>
            )}
            {!!remaining.length && (
                <Section title={t('workspace.metadata')} defaultOpen={false}>
                    {remaining.map((o) => (
                        <OptionControl key={o.id} option={o} />
                    ))}
                </Section>
            )}
        </>
    )
}

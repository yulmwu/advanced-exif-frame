import { useTranslation } from 'react-i18next'
import {
    FiDownload,
    FiInfo,
    FiMoon,
    FiMoreHorizontal,
    FiPlus,
    FiRotateCcw,
    FiRotateCw,
    FiSun,
    FiUpload,
} from 'react-icons/fi'
import { downloadText } from '../../application/export'
import { serializeSettings } from '../../application/settings-codec'
import { useWorkspace } from '../../application/workspace'
import type { Language } from '../../domain/settings'
import { Button, IconButton } from '../components/primitives'
export function WorkspaceHeader({
    onImport,
    onExportAll,
    onLoadSettings,
}: {
    onImport: () => void
    onExportAll: () => void
    onLoadSettings: () => void
}) {
    const s = useWorkspace(),
        { t } = useTranslation(),
        photo = s.photos.find((p) => p.id === s.selectedId)
    return (
        <header className="app-header">
            <a
                className="brand"
                href="/"
                aria-label="Advanced EXIF Frame"
                onClick={(event) => {
                    event.preventDefault()
                    s.setTool('frame')
                }}
            >
                <span className="brand-symbol">
                    <svg viewBox="0 0 32 32" aria-hidden="true">
                        <path
                            d="M5 12V5h7M20 5h7v7M27 20v7h-7M12 27H5v-7"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.4"
                        />
                        <path d="m10 21 6-12 6 12m-9-4h6" fill="none" stroke="currentColor" strokeWidth="2" />
                    </svg>
                </span>
                <span>
                    <strong>
                        Advanced <span>EXIF Frame</span>
                    </strong>
                </span>
            </a>
            <div className="session-title">{photo && !photo.demo ? photo.file.name : t('workspace.workspace')}</div>
            <div className="header-actions">
                <div className="undo-group">
                    <IconButton
                        label={t('workspace.undo') + ' ⌘Z'}
                        disabled={!photo || !s.history[photo.id]?.past.length}
                        onClick={s.undo}
                    >
                        <FiRotateCcw />
                    </IconButton>
                    <IconButton
                        label={t('workspace.redo') + ' ⇧⌘Z'}
                        disabled={!photo || !s.history[photo.id]?.future.length}
                        onClick={s.redo}
                    >
                        <FiRotateCw />
                    </IconButton>
                </div>
                <Button onClick={onImport} disabled={!!s.job}>
                    <FiPlus />
                    <span>{t('workspace.import')}</span>
                </Button>
                <Button variant="primary" disabled={!!s.job || !s.photos.some((p) => !p.demo)} onClick={onExportAll}>
                    <FiDownload />
                    <span>{t('workspace.all')}</span>
                </Button>
                <details className="app-menu">
                    <summary aria-label={t('workspace.settings')}>
                        <FiMoreHorizontal />
                    </summary>
                    <div>
                        <button onClick={() => s.patchPreferences({ darkMode: !s.preferences.darkMode })}>
                            {s.preferences.darkMode ? <FiSun /> : <FiMoon />}
                            {t('workspace.appearance')} ·{' '}
                            {t(s.preferences.darkMode ? 'workspace.light' : 'workspace.dark')}
                        </button>
                        <label>
                            {t('workspace.language')}
                            <select
                                aria-label={t('workspace.language')}
                                value={s.preferences.language}
                                onChange={(e) => s.patchPreferences({ language: e.target.value as Language })}
                            >
                                {[
                                    ['ko', '한국어'],
                                    ['en', 'English'],
                                    ['ja', '日本語'],
                                    ['zh-CN', '简体中文'],
                                ].map(([value, label]) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <hr />
                        <button
                            onClick={() =>
                                downloadText(serializeSettings(s.preferences), 'advanced-exif-frame-settings.json')
                            }
                        >
                            <FiDownload />
                            {t('workspace.saveSettings')}
                        </button>
                        <button onClick={onLoadSettings}>
                            <FiUpload />
                            {t('workspace.loadSettings')}
                        </button>
                        <button onClick={() => s.setModal('about')}>
                            <FiInfo />
                            {t('workspace.about')}
                        </button>
                    </div>
                </details>
            </div>
        </header>
    )
}

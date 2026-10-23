import {
    FiCamera,
    FiCrop,
    FiDownload,
    FiDroplet,
    FiEye,
    FiFile,
    FiGrid,
    FiImage,
    FiInfo,
    FiMaximize2,
    FiMoreHorizontal,
    FiPlus,
    FiShield,
    FiSliders,
    FiTrash2,
    FiUpload,
    FiZoomIn,
    FiZoomOut,
} from 'react-icons/fi'
import { downloadText } from '../application/export'
import { serializePhoto, settingsFilename } from '../application/photo-codec'
import { type Tool } from '../application/workspace'
import { lockedCropRatio } from '../engine/geometry/controls'
import { FramePreview } from './components/frame-preview'
import { Button, IconButton } from './components/primitives'
import { CropStage } from './editor/crop-stage'
import { useWorkspaceController } from './hooks/use-workspace-controller'
import { BackgroundPanel } from './panels/background-panel'
import { CollagePanel } from './panels/collage-panel'
import { EditPanel } from './panels/edit-panel'
import { ExportPanel } from './panels/export-panel'
import { FramePanel } from './panels/frame-panel'
import { MetadataPanel } from './panels/metadata-panel'
import { Filmstrip } from './workspace/filmstrip'
import { WorkspaceHeader } from './workspace/workspace-header'
import { WorkspaceOverlays } from './workspace/workspace-overlays'
const tools: { id: Tool; icon: typeof FiImage; key: string }[] = [
    { id: 'frame', icon: FiSliders, key: 'frame' },
    { id: 'edit', icon: FiCrop, key: 'edit' },
    { id: 'background', icon: FiDroplet, key: 'background' },
    { id: 'metadata', icon: FiCamera, key: 'metadata' },
    { id: 'export', icon: FiDownload, key: 'export' },
    { id: 'collage', icon: FiGrid, key: 'collage' },
]
export function App() {
    const controller = useWorkspaceController()
    const {
        s,
        t,
        input,
        globalInput,
        photoInput,
        photo,
        edit,
        effective,
        setDraft,
        zoom,
        setZoom,
        original,
        setOriginal,
        dragging,
        setDragging,
        dragDepth,
        editing,
        add,
        download,
        navigate,
        readSettings,
        edited,
        dirty,
    } = controller
    return (
        <div
            className={`app ${dragging ? 'drop-active' : ''}`}
            onDragEnter={(e) => {
                if (e.dataTransfer.types.includes('Files')) {
                    e.preventDefault()
                    dragDepth.current++
                    setDragging(true)
                }
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => {
                dragDepth.current--
                if (dragDepth.current <= 0) {
                    dragDepth.current = 0
                    setDragging(false)
                }
            }}
            onDrop={(e) => {
                e.preventDefault()
                dragDepth.current = 0
                setDragging(false)
                void add(e.dataTransfer.files)
            }}
        >
            <WorkspaceHeader
                onImport={() => input.current?.click()}
                onExportAll={() => void download(true)}
                onLoadSettings={() => globalInput.current?.click()}
            />

            <input
                ref={input}
                type="file"
                hidden
                accept="image/*"
                multiple
                onChange={(e) => {
                    if (e.target.files) void add(e.target.files)
                    e.target.value = ''
                }}
            />
            <input
                ref={globalInput}
                type="file"
                hidden
                accept=".json,application/json"
                onChange={(e) => {
                    void readSettings(e.target.files?.[0])
                    e.target.value = ''
                }}
            />
            <input
                ref={photoInput}
                type="file"
                hidden
                accept=".json,application/json"
                onChange={(e) => {
                    void readSettings(e.target.files?.[0], true)
                    e.target.value = ''
                }}
            />
            <div className="workspace-grid">
                <nav className="tool-rail" aria-label={t('workspace.workspace')}>
                    {tools.map((tool) => (
                        <button
                            key={tool.id}
                            className={s.tool === tool.id ? 'active' : ''}
                            aria-label={t('workspace.' + tool.key)}
                            aria-pressed={s.tool === tool.id}
                            title={t('workspace.' + tool.key)}
                            onClick={() => s.setTool(tool.id)}
                        >
                            <tool.icon />
                            <span>{t('workspace.' + tool.key)}</span>
                        </button>
                    ))}
                    <div className="rail-spacer" />
                    <button title={t('workspace.about')} onClick={() => s.setModal('about')}>
                        <FiInfo />
                        <span>{t('workspace.about')}</span>
                    </button>
                </nav>
                <main className="main-zone">
                    <div className="canvas-heading">
                        <div>
                            <h1>
                                {photo ? (photo.demo ? t('workspace.sample') : photo.file.name) : t('workspace.empty')}
                            </h1>
                            {photo && (
                                <p className="capture-summary">
                                    {[
                                        photo.metadata.model,
                                        photo.metadata.focalLength,
                                        photo.metadata.fNumber,
                                        photo.metadata.iso,
                                    ]
                                        .filter(Boolean)
                                        .join(' · ') || t('workspace.noExif')}
                                </p>
                            )}
                        </div>
                        <div className="canvas-heading-actions">
                            {photo && (
                                <>
                                    <span className="photo-type">
                                        {photo.image.naturalWidth} × {photo.image.naturalHeight}
                                    </span>
                                    <IconButton label={t('workspace.preview')} onClick={() => s.setModal('preview')}>
                                        <FiMaximize2 />
                                    </IconButton>
                                    <details className="photo-menu">
                                        <summary aria-label={t('workspace.settings')}>
                                            <FiMoreHorizontal />
                                        </summary>
                                        <div>
                                            <button
                                                onClick={() =>
                                                    downloadText(
                                                        serializePhoto(editing ? { ...photo, edit } : photo),
                                                        settingsFilename(photo.file.name),
                                                    )
                                                }
                                            >
                                                <FiFile />
                                                {t('workspace.photoSave')}
                                            </button>
                                            <button onClick={() => photoInput.current?.click()}>
                                                <FiUpload />
                                                {t('workspace.photoLoad')}
                                            </button>
                                            <button onClick={() => s.remove(photo.id)}>
                                                <FiTrash2 />
                                                {t('workspace.remove')}
                                            </button>
                                        </div>
                                    </details>
                                </>
                            )}
                        </div>
                    </div>
                    <div className={`canvas-well ${editing ? 'editing' : ''}`}>
                        <div className="canvas-content" style={{ transform: `scale(${zoom})` }}>
                            {photo ? (
                                original ? (
                                    <img
                                        className="original-image"
                                        src={photo.imageBase64}
                                        alt={t('workspace.original')}
                                    />
                                ) : editing ? (
                                    <CropStage
                                        photo={photo}
                                        edit={edit}
                                        ratio={lockedCropRatio(
                                            edit,
                                            photo.image.naturalWidth,
                                            photo.image.naturalHeight,
                                        )}
                                        onChange={(crop) => setDraft({ ...edit, crop, rotationReference: undefined })}
                                    />
                                ) : (
                                    <FramePreview photo={photo} preferences={s.preferences} />
                                )
                            ) : (
                                <div className="empty-state">
                                    <div className="empty-frame">
                                        <FiImage />
                                        <span>AEF</span>
                                    </div>
                                    <h2>{t('workspace.empty')}</h2>
                                    <p>{t('workspace.emptyHelp')}</p>
                                    <Button variant="primary" onClick={() => input.current?.click()}>
                                        <FiPlus />
                                        {t('workspace.import')}
                                    </Button>
                                    <small>JPEG · PNG · WebP · TIFF · HEIC*</small>
                                </div>
                            )}
                        </div>
                        {photo && (
                            <div className="canvas-toolbar">
                                <button onClick={() => setZoom(1)}>{t('workspace.fit')}</button>
                                <span className="toolbar-divider" />
                                <IconButton
                                    label={t('workspace.zoom') + ' −'}
                                    onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))}
                                >
                                    <FiZoomOut />
                                </IconButton>
                                <span className="zoom-value">{Math.round(zoom * 100)}%</span>
                                <IconButton
                                    label={t('workspace.zoom') + ' +'}
                                    onClick={() => setZoom((z) => Math.min(3, z + 0.25))}
                                >
                                    <FiZoomIn />
                                </IconButton>
                                <span className="toolbar-divider" />
                                <button className={original ? 'active' : ''} onClick={() => setOriginal((v) => !v)}>
                                    <FiEye />
                                    <span>{t('workspace.original')}</span>
                                </button>
                                <IconButton label={t('workspace.preview')} onClick={() => s.setModal('preview')}>
                                    <FiMaximize2 />
                                </IconButton>
                            </div>
                        )}
                    </div>
                    <Filmstrip onImport={() => input.current?.click()} navigate={navigate} />
                </main>
                <aside className="inspector" aria-label={t('workspace.' + s.tool)}>
                    <div className="inspector-heading">
                        <h2>{t('workspace.' + s.tool)}</h2>
                        <p>
                            {photo
                                ? s.preferences.selectedThemeName +
                                  ' · ' +
                                  (photo.demo ? t('workspace.sample') : t('workspace.selected'))
                                : t('workspace.emptyHelp')}
                        </p>
                    </div>
                    {editing && dirty && (
                        <p className="draft-notice" role="status">
                            {t('workspace.changes')}
                        </p>
                    )}
                    <div className="inspector-body">
                        {s.tool === 'frame' ? (
                            <FramePanel />
                        ) : s.tool === 'export' ? (
                            <ExportPanel onExport={() => void download()} />
                        ) : s.tool === 'collage' ? (
                            <CollagePanel />
                        ) : !photo ? (
                            <div className="panel-empty">
                                <FiImage />
                                <p>{t('workspace.emptyHelp')}</p>
                            </div>
                        ) : s.tool === 'edit' ? (
                            <EditPanel photo={photo} edit={edit} error={effective.error} onChange={setDraft} />
                        ) : s.tool === 'background' ? (
                            <BackgroundPanel />
                        ) : (
                            <MetadataPanel />
                        )}
                    </div>
                    <div className="inspector-footer">
                        <FiShield />
                        <span>{t('workspace.local')}</span>
                    </div>
                </aside>
            </div>
            <footer className="status-bar">
                <span>
                    {photo ? photo.file.name : 'Advanced EXIF Frame'}
                    {edited ? ' (EDITED)' : ''}
                </span>
                <span>
                    {s.preferences.losslessExport ? 'PNG / LOSSLESS' : s.preferences.exportToJpeg ? 'JPEG' : 'WEBP'}
                    {!s.preferences.losslessExport && <> · {s.preferences.quality}%</>}
                </span>
            </footer>
            <WorkspaceOverlays controller={controller} />
        </div>
    )
}

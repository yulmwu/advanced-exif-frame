import { FiCheck, FiDownload, FiUpload, FiX } from 'react-icons/fi'
import { FramePreview } from '../components/frame-preview'
import { Button, IconButton, Modal } from '../components/primitives'
import type { useWorkspaceController } from '../hooks/use-workspace-controller'
export function WorkspaceOverlays({ controller }: { controller: ReturnType<typeof useWorkspaceController> }) {
    const { s, t, photo, edit, editing, original, setOriginal, download, jobAbort, dragging } = controller
    return (
        <>
            {' '}
            {dragging && (
                <div className="drop-overlay">
                    <FiUpload />
                    <h2>{t('workspace.drop')}</h2>
                    <p>JPEG · PNG · WebP</p>
                </div>
            )}
            {s.notice && (
                <div className="toast" role="status">
                    <FiCheck />
                    <span>{s.notice}</span>
                    <IconButton label={t('workspace.close')} onClick={() => s.setNotice(null)}>
                        <FiX />
                    </IconButton>
                </div>
            )}
            {s.job && (
                <div className="job-toast" role="status">
                    <span className="spinner" />
                    <div>
                        <strong>{s.job.label}</strong>
                        <progress max={s.job.total} value={s.job.done} />
                        <small>
                            {s.job.done} / {s.job.total}
                        </small>
                    </div>
                    {jobAbort.current && (
                        <IconButton label={t('workspace.cancel')} onClick={() => jobAbort.current?.abort()}>
                            <FiX />
                        </IconButton>
                    )}
                </div>
            )}
            {s.modal === 'preview' && photo && (
                <Modal title={t('workspace.preview')} wide onClose={() => s.setModal(null)}>
                    <FramePreview photo={editing ? { ...photo, edit } : photo} preferences={s.preferences} />
                    <div className="flex gap-2 justify-center mt-5">
                        <Button onClick={() => setOriginal((v) => !v)}>{t('workspace.original')}</Button>
                        <Button variant="primary" disabled={photo.demo} onClick={() => void download()}>
                            <FiDownload />
                            {t('workspace.export')}
                        </Button>
                    </div>
                    {original && (
                        <img className="modal-original" src={photo.imageBase64} alt={t('workspace.original')} />
                    )}
                </Modal>
            )}
            {s.modal === 'about' && (
                <Modal title="Advanced EXIF Frame" onClose={() => s.setModal(null)}>
                    <div className="about-content">
                        <h3>
                            Made for the photograph.
                            <br />
                            Built around the original.
                        </h3>
                        <p>
                            {t('workspace.local')}. Original files are never overwritten. All processing happens in your
                            browser. Preferences are stored locally; photo sessions are not.
                        </p>
                        <p>
                            Lossless PNG preserves decoded pixels. JPEG recompresses at every quality setting, and
                            arbitrary-angle rotation requires interpolation. Color depth and browser color management
                            follow Canvas capabilities.
                        </p>
                        <p>
                            HEIC/TIFF import depends on browser decoding support. Unsupported files show a clear import
                            error.
                        </p>
                        <a href="https://github.com/yulmwu/advanced-exif-frame" target="_blank" rel="noreferrer">
                            GitHub ↗
                        </a>
                        <a href="https://github.com/yulmwu/exif-frame/releases" target="_blank" rel="noreferrer">
                            Release history ↗
                        </a>
                        <p className="field-hint">
                            Built on EXIF Frame’s image rendering mathematics. Photography tools, thoughtfully rebuilt.
                            v1.0.0
                        </p>
                    </div>
                </Modal>
            )}
        </>
    )
}

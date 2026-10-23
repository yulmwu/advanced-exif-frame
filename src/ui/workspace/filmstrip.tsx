import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiArrowRight, FiCheck, FiFolder, FiPlus, FiTrash2 } from 'react-icons/fi'
import { useWorkspace } from '../../application/workspace'
import { IconButton } from '../components/primitives'
export function Filmstrip({ onImport, navigate }: { onImport: () => void; navigate: (direction: number) => void }) {
    const s = useWorkspace(),
        { t } = useTranslation(),
        photo = s.photos.find((p) => p.id === s.selectedId)
    return (
        <>
            {' '}
            <div className="filmstrip-heading">
                <span>
                    <FiFolder />
                    {t('workspace.library')} <b>{s.photos.filter((p) => !p.demo).length}</b>
                </span>
                <div>
                    {photo && (
                        <>
                            <IconButton label="Previous" onClick={() => navigate(-1)}>
                                <FiArrowLeft />
                            </IconButton>
                            <IconButton label="Next" onClick={() => navigate(1)}>
                                <FiArrowRight />
                            </IconButton>
                        </>
                    )}
                    {s.photos.length > 0 && (
                        <IconButton label={t('workspace.clear')} onClick={s.clear}>
                            <FiTrash2 />
                        </IconButton>
                    )}
                </div>
            </div>
            <div className="filmstrip">
                {s.photos.map((p, index) => (
                    <button
                        className={`film-item ${p.id === s.selectedId ? 'selected' : ''}`}
                        key={p.id}
                        onClick={() => s.select(p.id)}
                        title={p.file.name}
                    >
                        <span className="film-image">
                            <img src={p.thumbnail} alt={p.file.name} />
                            <b>{index + 1}</b>
                            {p.id === s.selectedId && <FiCheck />}
                        </span>
                        <span>{p.demo ? t('workspace.sample') : p.file.name}</span>
                        {p.edit.rotation !== 0 && <small>{p.edit.rotation}°</small>}
                    </button>
                ))}
                <button className="film-add" onClick={onImport}>
                    <FiPlus />
                    <span>{t('workspace.import')}</span>
                </button>
            </div>
        </>
    )
}

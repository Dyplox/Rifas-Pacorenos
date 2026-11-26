import { memo, useCallback, useState } from 'react';
import { useRaffle } from '../context/RaffleContext';
import { downloadHistoryCsv, formatEntryDate } from '../utils/historyExport';
import UndoToast from './UndoToast';

const HistoryItem = memo(({ record, index, onUpdateName, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(record.winnerName || '');

    const handleSave = () => {
        onUpdateName(record.id, name.trim());
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            e.stopPropagation();
            setName(record.winnerName || '');
            setIsEditing(false);
        }
    };

    const date = formatEntryDate(record);

    return (
        <li className={`history-item ${index === 0 ? 'latest' : ''}`}>
            <button
                type="button"
                className="history-delete"
                onClick={() => onDelete(record, index)}
                aria-label={`Eliminar el número ${record.number} del historial`}
                title="Eliminar del historial"
            >
                ✕
            </button>
            <div className="history-main">
                <span className="history-number">
                    {record.number}
                </span>
                <span className="history-time">
                    {date ? `${date} · ${record.timestamp}` : record.timestamp}
                </span>
            </div>
            <div className="history-winner-name">
                {isEditing ? (
                    <input
                        type="text"
                        className="winner-name-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onBlur={handleSave}
                        onKeyDown={handleKeyDown}
                        placeholder="Nombre del ganador"
                        aria-label={`Nombre del ganador del número ${record.number}`}
                        autoFocus
                    />
                ) : (
                    <button
                        type="button"
                        className="winner-name-display"
                        onClick={() => setIsEditing(true)}
                        aria-label={record.winnerName
                            ? `Editar nombre del ganador del número ${record.number}: ${record.winnerName}`
                            : `Agregar nombre al ganador del número ${record.number}`}
                    >
                        {record.winnerName || '+ Agregar nombre'}
                    </button>
                )}
            </div>
        </li>
    );
});

HistoryItem.displayName = 'HistoryItem';

const RaffleHistory = memo(() => {
    const { history, updateWinnerName, deleteHistoryEntry, restoreHistoryEntry } = useRaffle();
    // Last deleted entry, kept so it can be restored
    const [deleted, setDeleted] = useState(null);

    const handleUpdateName = useCallback((id, name) => {
        updateWinnerName(id, name);
    }, [updateWinnerName]);

    const handleDelete = useCallback((record, index) => {
        deleteHistoryEntry(record.id);
        setDeleted({ record, index });
    }, [deleteHistoryEntry]);

    const handleUndo = useCallback(() => {
        if (deleted) restoreHistoryEntry(deleted.record, deleted.index);
        setDeleted(null);
    }, [deleted, restoreHistoryEntry]);

    const handleDismiss = useCallback(() => setDeleted(null), []);

    const handleExport = useCallback(() => {
        downloadHistoryCsv(history);
    }, [history]);

    const hasHistory = history && history.length > 0;

    return (
        <aside className="history-sidebar" aria-labelledby="history-title">
            <div className="history-header">
                <h2 id="history-title" className="history-title">
                    📋 Historial
                    {hasHistory && <span className="history-count">{history.length}</span>}
                </h2>
                <button
                    type="button"
                    className="history-export"
                    onClick={handleExport}
                    disabled={!hasHistory}
                    title="Descargar historial en CSV"
                    aria-label="Descargar historial en CSV"
                >
                    ⬇ CSV
                </button>
            </div>

            {hasHistory ? (
                <ol className="history-list">
                    {history.map((record, index) => (
                        <HistoryItem
                            key={record.id}
                            record={record}
                            index={index}
                            onUpdateName={handleUpdateName}
                            onDelete={handleDelete}
                        />
                    ))}
                </ol>
            ) : (
                <p className="history-empty">
                    Aún no hay resultados
                </p>
            )}

            {deleted && (
                <UndoToast
                    key={deleted.record.id}
                    message={`Número ${deleted.record.number} eliminado`}
                    onUndo={handleUndo}
                    onDismiss={handleDismiss}
                />
            )}
        </aside>
    );
});

RaffleHistory.displayName = 'RaffleHistory';

export default RaffleHistory;

import { memo, useCallback, useState } from 'react';
import { useRaffle } from '../context/RaffleContext';
import { downloadHistoryCsv, formatEntryDate } from '../utils/historyExport';

const HistoryItem = memo(({ record, index, onUpdateName, onDelete }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [name, setName] = useState(record.winnerName || '');

    const handleSave = () => {
        onUpdateName(record.id, name);
        setIsEditing(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSave();
        } else if (e.key === 'Escape') {
            setName(record.winnerName || '');
            setIsEditing(false);
        }
    };

    const date = formatEntryDate(record);

    return (
        <div className={`history-item ${index === 0 ? 'latest' : ''}`}>
            <button
                type="button"
                className="history-delete"
                onClick={() => onDelete(record)}
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
                        autoFocus
                    />
                ) : (
                    <span
                        className="winner-name-display"
                        onClick={() => setIsEditing(true)}
                        title="Clic para editar"
                    >
                        {record.winnerName || '+ Agregar nombre'}
                    </span>
                )}
            </div>
        </div>
    );
});

HistoryItem.displayName = 'HistoryItem';

const RaffleHistory = memo(() => {
    const { history, updateWinnerName, deleteHistoryEntry } = useRaffle();

    const handleUpdateName = useCallback((id, name) => {
        updateWinnerName(id, name);
    }, [updateWinnerName]);

    const handleDelete = useCallback((record) => {
        if (window.confirm(`¿Eliminar el número ${record.number} del historial?`)) {
            deleteHistoryEntry(record.id);
        }
    }, [deleteHistoryEntry]);

    const handleExport = useCallback(() => {
        downloadHistoryCsv(history);
    }, [history]);

    const hasHistory = history && history.length > 0;

    return (
        <aside className="history-sidebar">
            <div className="history-header">
                <h3 className="history-title">
                    📋 Historial
                </h3>
                <button
                    type="button"
                    className="history-export"
                    onClick={handleExport}
                    disabled={!hasHistory}
                    title="Descargar historial en CSV"
                >
                    ⬇ CSV
                </button>
            </div>

            <div className="history-list">
                {hasHistory ? (
                    history.map((record, index) => (
                        <HistoryItem
                            key={record.id}
                            record={record}
                            index={index}
                            onUpdateName={handleUpdateName}
                            onDelete={handleDelete}
                        />
                    ))
                ) : (
                    <div className="history-empty">
                        Aún no hay resultados
                    </div>
                )}
            </div>
        </aside>
    );
});

RaffleHistory.displayName = 'RaffleHistory';

export default RaffleHistory;

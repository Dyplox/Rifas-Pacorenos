import { memo, useCallback } from 'react';
import { useRaffle } from '../context/RaffleContext';

const RaffleHistory = memo(() => {
    const { history } = useRaffle();

    const renderHistoryItem = useCallback((record, index) => (
        <div
            key={record.id}
            className={`history-item ${index === 0 ? 'latest' : ''}`}
        >
            <span className="history-number">
                {record.number}
            </span>
            <span className="history-time">
                {record.timestamp}
            </span>
        </div>
    ), []);

    return (
        <aside className="history-sidebar">
            <h3 className="history-title">
                📋 Historial
            </h3>

            <div className="history-list">
                {history && history.length > 0 ? (
                    history.map(renderHistoryItem)
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

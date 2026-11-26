import { useEffect } from 'react';
import useLatestCallback from '../hooks/useLatestCallback';

export const UNDO_TIMEOUT_MS = 6000;

/**
 * Temporary notice with an "undo" action. Announced politely to screen readers.
 * Re-mount it (via `key`) to restart the timer for a new action.
 */
const UndoToast = ({ message, onUndo, onDismiss }) => {
    const dismiss = useLatestCallback(() => onDismiss());

    useEffect(() => {
        const timer = setTimeout(dismiss, UNDO_TIMEOUT_MS);
        return () => clearTimeout(timer);
    }, [dismiss]);

    return (
        <div className="toast" role="status">
            <span className="toast-message">{message}</span>
            <button type="button" className="toast-action" onClick={onUndo}>
                Deshacer
            </button>
            <button type="button" className="toast-close" onClick={onDismiss} aria-label="Cerrar aviso">
                ✕
            </button>
        </div>
    );
};

export default UndoToast;

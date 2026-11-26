import { useRef } from 'react';
import Modal from './Modal';

/**
 * Styled replacement for window.confirm().
 * Focus starts on "Cancelar" so Enter never confirms a destructive action by accident.
 */
const ConfirmDialog = ({ isOpen, title, message, confirmLabel = 'Confirmar', onConfirm, onCancel }) => {
    const cancelRef = useRef(null);

    return (
        <Modal isOpen={isOpen} onClose={onCancel} title={title} className="confirm-dialog" initialFocusRef={cancelRef}>
            <p className="confirm-message">{message}</p>
            <div className="modal-actions">
                <button ref={cancelRef} type="button" className="btn-secondary" onClick={onCancel}>
                    Cancelar
                </button>
                <button type="button" className="btn-danger" onClick={onConfirm}>
                    {confirmLabel}
                </button>
            </div>
        </Modal>
    );
};

export default ConfirmDialog;

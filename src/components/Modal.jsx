import { useEffect, useId, useRef } from 'react';
import useLatestCallback from '../hooks/useLatestCallback';

const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
].join(',');

/**
 * Accessible modal dialog:
 * - role="dialog" + aria-modal, labelled by its title
 * - Escape and clicking the backdrop close it
 * - Focus moves inside on open, Tab is trapped, and focus returns to the opener on close
 */
const Modal = ({ isOpen, onClose, title, children, className = '', initialFocusRef }) => {
    const dialogRef = useRef(null);
    const titleId = useId();

    const handleClose = useLatestCallback(() => onClose());

    useEffect(() => {
        if (!isOpen) return;
        const dialog = dialogRef.current;
        const previouslyFocused = document.activeElement;

        const target = initialFocusRef?.current ?? dialog.querySelector(FOCUSABLE) ?? dialog;
        target.focus();

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                e.stopPropagation();
                handleClose();
                return;
            }
            if (e.key !== 'Tab') return;

            const focusable = [...dialog.querySelectorAll(FOCUSABLE)];
            if (focusable.length === 0) {
                e.preventDefault();
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };

        dialog.addEventListener('keydown', handleKeyDown);
        return () => {
            dialog.removeEventListener('keydown', handleKeyDown);
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [isOpen, initialFocusRef, handleClose]);

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                ref={dialogRef}
                className={`card modal-content ${className}`}
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                tabIndex={-1}
                onClick={(e) => e.stopPropagation()}
            >
                <h2 id={titleId} className="modal-title">{title}</h2>
                {children}
            </div>
        </div>
    );
};

export default Modal;

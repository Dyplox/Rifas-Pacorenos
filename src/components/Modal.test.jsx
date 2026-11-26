import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import Modal from './Modal';

const Harness = ({ onClose = () => {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
        <>
            <button onClick={() => setIsOpen(true)}>Abrir</button>
            <Modal isOpen={isOpen} title="Prueba" onClose={() => { onClose(); setIsOpen(false); }}>
                <button>Primero</button>
                <button>Último</button>
            </Modal>
        </>
    );
};

describe('Modal', () => {
    it('is an accessible dialog labelled by its title, focusing the first control', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('Abrir'));
        const dialog = screen.getByRole('dialog', { name: 'Prueba' });
        expect(dialog.getAttribute('aria-modal')).toBe('true');
        expect(document.activeElement).toBe(screen.getByText('Primero'));
    });

    it('closes with Escape and returns focus to the opener', () => {
        const onClose = vi.fn();
        render(<Harness onClose={onClose} />);
        const opener = screen.getByText('Abrir');
        opener.focus();
        fireEvent.click(opener);

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
        expect(onClose).toHaveBeenCalledOnce();
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(document.activeElement).toBe(opener);
    });

    it('traps Tab inside the dialog', () => {
        render(<Harness />);
        fireEvent.click(screen.getByText('Abrir'));
        const first = screen.getByText('Primero');
        const last = screen.getByText('Último');

        last.focus();
        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab' });
        expect(document.activeElement).toBe(first);

        fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Tab', shiftKey: true });
        expect(document.activeElement).toBe(last);
    });

    it('closes when clicking the backdrop but not the content', () => {
        const onClose = vi.fn();
        render(<Harness onClose={onClose} />);
        fireEvent.click(screen.getByText('Abrir'));
        fireEvent.click(screen.getByRole('dialog'));
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.click(document.querySelector('.modal-overlay'));
        expect(onClose).toHaveBeenCalledOnce();
    });
});

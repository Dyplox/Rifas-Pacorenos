import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { UNDO_TIMEOUT_MS } from './components/UndoToast';
import { TRADITIONAL_SHUFFLE_MS, DIGIT_STEP_MS } from './context/RaffleContext';

// jsdom has no canvas: stub the confetti library
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const raffleButton = () => document.querySelector('.btn-raffle');

beforeEach(() => {
    vi.useFakeTimers();
    localStorage.setItem('raffle_isCountdownEnabled', 'false');
});

afterEach(() => {
    vi.useRealTimers();
});

describe('App', () => {
    it('starts a raffle with the Space key', () => {
        render(<App />);
        expect(raffleButton().textContent).toBe('Iniciar Rifa');

        fireEvent.keyDown(window, { key: ' ' });
        expect(raffleButton().textContent).toBe('Rifando...');

        act(() => { vi.advanceTimersByTime(TRADITIONAL_SHUFFLE_MS); });
        expect(raffleButton().textContent).toBe('Rifar de Nuevo');
        expect(screen.getByText('¡Tenemos un Ganador!')).toBeTruthy();
    });

    it('reveals the next digit (not a new raffle) on each key press in manual mode', () => {
        localStorage.setItem('raffle_isManualRevealEnabled', 'true');
        localStorage.setItem('raffle_digitCount', '2');
        render(<App />);
        const boxes = () => [...document.querySelectorAll('.digit-box')].map(box => box.textContent);

        fireEvent.keyDown(window, { key: 'Enter' });
        act(() => { vi.advanceTimersByTime(DIGIT_STEP_MS); });
        const [first] = boxes();
        expect(first).toMatch(/\d/);
        expect(raffleButton().textContent).toBe('Revelar Siguiente');

        fireEvent.keyDown(window, { key: 'Enter' });
        act(() => { vi.advanceTimersByTime(DIGIT_STEP_MS); });
        expect(boxes()[0]).toBe(first);
        expect(boxes()[1]).toMatch(/\d/);
        expect(raffleButton().textContent).toBe('Rifar de Nuevo');
    });

    it('ignores the shortcut while settings are open', () => {
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Abrir configuración' }));
        fireEvent.keyDown(window, { key: ' ' });
        expect(raffleButton().textContent).toBe('Iniciar Rifa');
    });

    it('disables the button when every number has been drawn', () => {
        localStorage.setItem('raffle_digitCount', '1');
        localStorage.setItem('raffle_history', JSON.stringify(
            Array.from({ length: 10 }, (_, n) => ({ id: String(n), number: String(n), winnerName: '', timestamp: '' }))
        ));
        render(<App />);
        expect(raffleButton().textContent).toBe('Sin números disponibles');
        expect(raffleButton().disabled).toBe(true);
        expect(screen.getByText('Quedan 0 números disponibles')).toBeTruthy();
    });

    it('deletes a history entry with undo instead of a confirm prompt', () => {
        const confirm = vi.spyOn(window, 'confirm');
        localStorage.setItem('raffle_history', JSON.stringify([
            { id: 'a', number: '111', winnerName: '', timestamp: '' },
            { id: 'b', number: '222', winnerName: '', timestamp: '' },
        ]));
        render(<App />);
        const numbers = () => [...document.querySelectorAll('.history-number')].map(n => n.textContent);

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar el número 222 del historial' }));
        expect(numbers()).toEqual(['111']);
        fireEvent.click(screen.getByRole('button', { name: 'Deshacer' }));
        expect(numbers()).toEqual(['111', '222']);

        fireEvent.click(screen.getByRole('button', { name: 'Eliminar el número 111 del historial' }));
        act(() => { vi.advanceTimersByTime(UNDO_TIMEOUT_MS); });
        expect(screen.queryByRole('button', { name: 'Deshacer' })).toBeNull();
        expect(numbers()).toEqual(['222']);
        expect(confirm).not.toHaveBeenCalled();
    });

    it('asks for confirmation in a dialog before clearing the history', () => {
        localStorage.setItem('raffle_history', JSON.stringify([{ id: 'a', number: '111', winnerName: '', timestamp: '' }]));
        render(<App />);
        fireEvent.click(screen.getByRole('button', { name: 'Abrir configuración' }));
        fireEvent.click(screen.getByRole('button', { name: /Borrar Historial/ }));

        const confirmDialog = screen.getByRole('dialog', { name: 'Borrar historial' });
        expect(document.activeElement.textContent).toBe('Cancelar');
        fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
        expect(document.querySelectorAll('.history-item')).toHaveLength(1);
        expect(confirmDialog.isConnected).toBe(false);

        fireEvent.click(screen.getByRole('button', { name: /Borrar Historial/ }));
        fireEvent.click(screen.getByRole('button', { name: 'Borrar todo' }));
        expect(document.querySelectorAll('.history-item')).toHaveLength(0);
    });
});

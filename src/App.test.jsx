import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import { TRADITIONAL_SHUFFLE_MS } from './context/RaffleContext';

// jsdom has no canvas: stub the confetti library
vi.mock('canvas-confetti', () => ({ default: vi.fn() }));

const raffleButton = () => screen.getByRole('button', { name: /rifa|rifando|sin números/i });

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
});

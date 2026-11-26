import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import App from './App';
import * as sound from './utils/sound';
import { GO_MESSAGE_MS, POST_COUNTDOWN_SHUFFLE_MS, SUSPENSE_MS } from './context/RaffleContext';

vi.mock('canvas-confetti', () => ({ default: vi.fn() }));
vi.mock('./utils/sound', () => ({
    playHeartbeat: vi.fn(),
    startDrumRoll: vi.fn(),
    stopDrumRoll: vi.fn(),
    playReveal: vi.fn(),
    playWinnerSound: vi.fn(),
    preloadSounds: vi.fn(),
}));

const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });
const COUNTDOWN = 3;
// Advance one phase at a time, so React renders every phase like in a real browser
// (a single big advance batches the intermediate states and skips their effects)
const advanceCountdown = () => {
    for (let i = 0; i < COUNTDOWN; i++) advance(1000);
    advance(SUSPENSE_MS);
    advance(GO_MESSAGE_MS);
    advance(POST_COUNTDOWN_SHUFFLE_MS);
};

beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
    localStorage.setItem('raffle_isSoundEnabled', 'true');
    localStorage.setItem('raffle_isCountdownEnabled', 'true');
    localStorage.setItem('raffle_countdownDuration', String(COUNTDOWN));
});

afterEach(() => {
    vi.useRealTimers();
});

describe('countdown soundtrack', () => {
    it('heartbeats, drum roll from the dark pause until the number, then crash + applause', () => {
        render(<App />);
        fireEvent.keyDown(window, { key: ' ' });
        expect(sound.playHeartbeat).toHaveBeenCalledTimes(1);

        for (let i = 1; i < COUNTDOWN; i++) advance(1000);
        expect(sound.playHeartbeat).toHaveBeenCalledTimes(COUNTDOWN);
        expect(sound.startDrumRoll).not.toHaveBeenCalled();

        // Dark pause: the roll starts…
        advance(1000);
        expect(sound.startDrumRoll).toHaveBeenCalledOnce();
        // (a no-op stopDrumRoll on mount is expected: only count calls after the roll starts)
        sound.stopDrumRoll.mockClear();

        // …keeps going through "¡MATRACA!" and the short shuffle…
        advance(SUSPENSE_MS);
        advance(GO_MESSAGE_MS);
        expect(sound.stopDrumRoll).not.toHaveBeenCalled();
        expect(sound.playWinnerSound).not.toHaveBeenCalled();

        // …and ends when the number is shown
        advance(POST_COUNTDOWN_SHUFFLE_MS);
        expect(screen.getByText('¡Tenemos un Ganador!')).toBeTruthy();
        expect(sound.playWinnerSound).toHaveBeenCalledOnce();
    });

    it('stops the roll (no applause) if the raffle is cancelled during the pause', () => {
        render(<App />);
        fireEvent.keyDown(window, { key: ' ' });
        for (let i = 0; i < COUNTDOWN; i++) advance(1000);
        expect(sound.startDrumRoll).toHaveBeenCalledOnce();

        // Changing the digit count resets the raffle
        fireEvent.click(screen.getByRole('button', { name: 'Abrir configuración' }));
        fireEvent.change(screen.getByLabelText('Cantidad de Dígitos'), { target: { value: '4' } });

        expect(sound.stopDrumRoll).toHaveBeenCalled();
        advance(5000);
        expect(sound.playWinnerSound).not.toHaveBeenCalled();
    });

    it('stops the roll when sound is turned off', () => {
        render(<App />);
        fireEvent.keyDown(window, { key: ' ' });
        for (let i = 0; i < COUNTDOWN; i++) advance(1000);
        expect(sound.startDrumRoll).toHaveBeenCalledOnce();
        sound.stopDrumRoll.mockClear();

        fireEvent.click(screen.getByRole('button', { name: 'Abrir configuración' }));
        fireEvent.click(screen.getByLabelText('Activar sonido'));
        expect(sound.stopDrumRoll).toHaveBeenCalled();
    });

    it('manual mode: intermediate digits end the roll with a blip, the last one with applause', () => {
        localStorage.setItem('raffle_isManualRevealEnabled', 'true');
        localStorage.setItem('raffle_digitCount', '2');
        render(<App />);
        const step = () => {
            fireEvent.keyDown(window, { key: 'Enter' });
            advanceCountdown();
        };

        step();
        expect(sound.startDrumRoll).toHaveBeenCalledTimes(1);
        expect(sound.playReveal).toHaveBeenCalledTimes(1);
        expect(sound.playWinnerSound).not.toHaveBeenCalled();

        step();
        expect(sound.startDrumRoll).toHaveBeenCalledTimes(2);
        expect(sound.playWinnerSound).toHaveBeenCalledOnce();
    });

    it('no sound at all when sound is disabled', () => {
        localStorage.setItem('raffle_isSoundEnabled', 'false');
        render(<App />);
        fireEvent.keyDown(window, { key: ' ' });
        advanceCountdown();
        expect(screen.getByText('¡Tenemos un Ganador!')).toBeTruthy();
        expect(sound.playHeartbeat).not.toHaveBeenCalled();
        expect(sound.startDrumRoll).not.toHaveBeenCalled();
        expect(sound.playWinnerSound).not.toHaveBeenCalled();
    });
});

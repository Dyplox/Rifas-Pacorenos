import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import {
    RaffleProvider,
    useRaffle,
    TRADITIONAL_SHUFFLE_MS,
    DIGIT_STEP_MS,
    GO_MESSAGE,
    GO_MESSAGE_MS,
    SUSPENSE,
    SUSPENSE_MS,
    POST_COUNTDOWN_SHUFFLE_MS,
} from './RaffleContext';

const setup = (settings = {}) => {
    const defaults = { raffle_isCountdownEnabled: 'false', ...settings };
    Object.entries(defaults).forEach(([key, value]) => localStorage.setItem(key, value));
    return renderHook(() => useRaffle(), { wrapper: RaffleProvider }).result;
};

const advance = (ms) => act(() => { vi.advanceTimersByTime(ms); });

beforeEach(() => {
    vi.useFakeTimers();
});

afterEach(() => {
    vi.useRealTimers();
});

describe('traditional raffle', () => {
    it('reveals a full winner and records it in history', () => {
        const raffle = setup();
        act(() => raffle.current.runTraditionalRaffle());
        expect(raffle.current.isRaffling).toBe(true);

        // Without countdown the shuffle carries the suspense: full duration
        advance(TRADITIONAL_SHUFFLE_MS - 1);
        expect(raffle.current.winner).toBeNull();
        advance(1);
        expect(raffle.current.isRaffling).toBe(false);
        expect(raffle.current.winner).toMatch(/^\d{3}$/);
        expect(raffle.current.revealedCount).toBe(3);
        expect(raffle.current.history).toHaveLength(1);
        expect(raffle.current.history[0]).toMatchObject({
            number: raffle.current.winner,
            winnerName: '',
        });
        expect(raffle.current.history[0].createdAt).toBeTruthy();
    });

    it('runs the countdown before drawing', () => {
        const raffle = setup({ raffle_isCountdownEnabled: 'true', raffle_countdownDuration: '3' });
        act(() => raffle.current.runTraditionalRaffle());
        expect(raffle.current.currentCount).toBe(3);

        advance(1000);
        expect(raffle.current.currentCount).toBe(2);
        advance(2000);
        // Dramatic pause after the last number, then the GO message
        expect(raffle.current.currentCount).toBe(SUSPENSE);
        expect(raffle.current.isRaffling).toBe(false);
        advance(SUSPENSE_MS);
        expect(raffle.current.currentCount).toBe(GO_MESSAGE);
        advance(GO_MESSAGE_MS);
        expect(raffle.current.currentCount).toBeNull();
        expect(raffle.current.isRaffling).toBe(true);
        // Right after "¡MATRACA!" the number shows almost at once
        advance(POST_COUNTDOWN_SHUFFLE_MS);
        expect(raffle.current.winner).toMatch(/^\d{3}$/);
        expect(raffle.current.history).toHaveLength(1);
    });
});

describe('manual raffle', () => {
    it('reveals one digit per step and records the winner at the end', () => {
        const raffle = setup({ raffle_isManualRevealEnabled: 'true', raffle_digitCount: '2' });

        act(() => raffle.current.runDigitRaffleStep());
        advance(DIGIT_STEP_MS);
        expect(raffle.current.revealedCount).toBe(1);
        expect(raffle.current.history).toHaveLength(0);

        act(() => raffle.current.runDigitRaffleStep());
        advance(DIGIT_STEP_MS);
        expect(raffle.current.revealedCount).toBe(2);
        expect(raffle.current.history).toHaveLength(1);
    });

    it('uses the short reveal for each step that follows a countdown', () => {
        const raffle = setup({
            raffle_isManualRevealEnabled: 'true',
            raffle_digitCount: '2',
            raffle_isCountdownEnabled: 'true',
            raffle_countdownDuration: '3',
        });
        const countdownMs = 3000 + SUSPENSE_MS + GO_MESSAGE_MS;

        act(() => raffle.current.runDigitRaffleStep());
        advance(countdownMs + POST_COUNTDOWN_SHUFFLE_MS);
        expect(raffle.current.revealedCount).toBe(1);

        act(() => raffle.current.runDigitRaffleStep());
        advance(countdownMs + POST_COUNTDOWN_SHUFFLE_MS);
        expect(raffle.current.revealedCount).toBe(2);
        expect(raffle.current.history).toHaveLength(1);
    });

    it('records the winner when there is a single digit', () => {
        const raffle = setup({ raffle_isManualRevealEnabled: 'true', raffle_digitCount: '1' });
        act(() => raffle.current.runDigitRaffleStep());
        advance(DIGIT_STEP_MS);
        expect(raffle.current.history).toHaveLength(1);
    });
});

describe('reset', () => {
    it('cancels a raffle in progress', () => {
        const raffle = setup();
        act(() => raffle.current.runTraditionalRaffle());
        act(() => raffle.current.resetRaffle());
        advance(TRADITIONAL_SHUFFLE_MS * 2);
        expect(raffle.current.winner).toBeNull();
        expect(raffle.current.history).toHaveLength(0);
    });

    it('cancels a countdown during the dramatic pause', () => {
        const raffle = setup({ raffle_isCountdownEnabled: 'true', raffle_countdownDuration: '3' });
        act(() => raffle.current.runTraditionalRaffle());
        advance(3000);
        expect(raffle.current.currentCount).toBe(SUSPENSE);
        act(() => raffle.current.resetRaffle());
        advance(5000);
        expect(raffle.current.currentCount).toBeNull();
        expect(raffle.current.history).toHaveLength(0);
    });

    it('cancels a countdown, including the final message', () => {
        const raffle = setup({ raffle_isCountdownEnabled: 'true', raffle_countdownDuration: '3' });
        act(() => raffle.current.runTraditionalRaffle());
        advance(3000 + SUSPENSE_MS);
        expect(raffle.current.currentCount).toBe(GO_MESSAGE);
        act(() => raffle.current.resetRaffle());
        advance(5000);
        expect(raffle.current.currentCount).toBeNull();
        expect(raffle.current.isRaffling).toBe(false);
        expect(raffle.current.history).toHaveLength(0);
    });
});

describe('no-repeat', () => {
    const drawAll = (raffle, times) => {
        for (let i = 0; i < times; i++) {
            act(() => raffle.current.runTraditionalRaffle());
            advance(TRADITIONAL_SHUFFLE_MS);
        }
    };

    it('never repeats a number and stops when all are drawn', () => {
        const raffle = setup({ raffle_digitCount: '1' });
        expect(raffle.current.availableCount).toBe(10);

        drawAll(raffle, 10);
        const numbers = raffle.current.history.map(entry => entry.number);
        expect(new Set(numbers).size).toBe(10);
        expect(raffle.current.availableCount).toBe(0);

        drawAll(raffle, 1);
        expect(raffle.current.history).toHaveLength(10);
    });

    it('makes a number available again when its entry is deleted', () => {
        const raffle = setup({ raffle_digitCount: '1' });
        drawAll(raffle, 1);
        expect(raffle.current.availableCount).toBe(9);
        act(() => raffle.current.deleteHistoryEntry(raffle.current.history[0].id));
        expect(raffle.current.availableCount).toBe(10);
    });

    it('allows repeats when disabled', () => {
        const raffle = setup({ raffle_digitCount: '1', raffle_isNoRepeatEnabled: 'false' });
        drawAll(raffle, 15);
        expect(raffle.current.history).toHaveLength(15);
        expect(raffle.current.availableCount).toBe(10);
    });
});

describe('history', () => {
    it('updates a winner name and clears everything', () => {
        const raffle = setup();
        act(() => raffle.current.runTraditionalRaffle());
        advance(TRADITIONAL_SHUFFLE_MS);

        const { id } = raffle.current.history[0];
        act(() => raffle.current.updateWinnerName(id, 'Ana'));
        expect(raffle.current.history[0].winnerName).toBe('Ana');

        act(() => raffle.current.clearHistory());
        expect(raffle.current.history).toEqual([]);
        expect(raffle.current.winner).toBeNull();
    });
});

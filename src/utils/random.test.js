import { describe, expect, it } from 'vitest';
import { generateId, pickWinner, randomInt } from './random';

describe('randomInt', () => {
    it('returns integers within [0, max)', () => {
        for (let i = 0; i < 1000; i++) {
            const value = randomInt(7);
            expect(Number.isInteger(value)).toBe(true);
            expect(value).toBeGreaterThanOrEqual(0);
            expect(value).toBeLessThan(7);
        }
    });

    it('covers every value of a small range', () => {
        const seen = new Set();
        for (let i = 0; i < 500; i++) seen.add(randomInt(5));
        expect([...seen].sort()).toEqual([0, 1, 2, 3, 4]);
    });

    it('rejects invalid max values', () => {
        expect(() => randomInt(0)).toThrow(RangeError);
        expect(() => randomInt(1.5)).toThrow(RangeError);
    });
});

describe('pickWinner', () => {
    it('returns a zero-padded number with the requested digits', () => {
        for (let i = 0; i < 200; i++) {
            expect(pickWinner(3)).toMatch(/^\d{3}$/);
        }
    });

    it('never returns an excluded number', () => {
        const excluded = new Set(['0', '1', '2', '3', '4', '5', '6', '7', '8']);
        for (let i = 0; i < 50; i++) {
            expect(pickWinner(1, excluded)).toBe('9');
        }
    });

    it('returns null when every number is excluded', () => {
        const all = new Set(Array.from({ length: 10 }, (_, n) => String(n)));
        expect(pickWinner(1, all)).toBeNull();
    });
});

describe('generateId', () => {
    it('produces unique ids', () => {
        const ids = new Set(Array.from({ length: 1000 }, generateId));
        expect(ids.size).toBe(1000);
    });
});

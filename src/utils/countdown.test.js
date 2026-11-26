import { describe, expect, it } from 'vitest';
import { countdownTension } from './countdown';

describe('countdownTension', () => {
    it('goes from 0 on the first number to 1 on the last', () => {
        expect(countdownTension(5, 5)).toBe(0);
        expect(countdownTension(3, 5)).toBe(0.5);
        expect(countdownTension(1, 5)).toBe(1);
    });

    it('treats non-numeric phases and 1-second countdowns as full tension', () => {
        expect(countdownTension('suspense', 5)).toBe(1);
        expect(countdownTension(1, 1)).toBe(1);
    });

    it('stays within [0, 1]', () => {
        expect(countdownTension(10, 5)).toBe(0);
        expect(countdownTension(0, 5)).toBe(1);
    });
});

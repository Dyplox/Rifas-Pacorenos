import { describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import useLocalStorage from './useLocalStorage';

const render = (...args) => renderHook(() => useLocalStorage(...args)).result;

describe('useLocalStorage', () => {
    it('returns the default when nothing is stored, and persists it', () => {
        const result = render('k', 3);
        expect(result.current[0]).toBe(3);
        expect(localStorage.getItem('k')).toBe('3');
    });

    it('parses stored values according to the default type', () => {
        localStorage.setItem('num', '5');
        localStorage.setItem('bool', 'false');
        localStorage.setItem('arr', '[1,2]');
        expect(render('num', 3).current[0]).toBe(5);
        expect(render('bool', true).current[0]).toBe(false);
        expect(render('arr', []).current[0]).toEqual([1, 2]);
    });

    it('falls back to the default for corrupted values', () => {
        const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem('num', 'abc');
        localStorage.setItem('bool', 'yes');
        localStorage.setItem('arr', '{not json');
        localStorage.setItem('shape', '{"a":1}');
        expect(render('num', 3).current[0]).toBe(3);
        expect(render('bool', true).current[0]).toBe(true);
        expect(render('arr', []).current[0]).toEqual([]);
        expect(render('shape', []).current[0]).toEqual([]);
        expect(warn).toHaveBeenCalled();
        warn.mockRestore();
    });

    it('falls back to the default when validation fails', () => {
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        localStorage.setItem('digits', '99');
        const result = render('digits', 3, { validate: (v) => v >= 1 && v <= 5 });
        expect(result.current[0]).toBe(3);
        expect(localStorage.getItem('digits')).toBe('3');
    });

    it('writes updates back to localStorage', () => {
        const result = render('k', [], {});
        act(() => result.current[1](['x']));
        expect(localStorage.getItem('k')).toBe('["x"]');
    });
});

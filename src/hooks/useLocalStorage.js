import { useState, useEffect } from 'react';

const parseStored = (saved, defaultValue) => {
    if (typeof defaultValue === 'boolean') {
        if (saved === 'true') return true;
        if (saved === 'false') return false;
        throw new Error(`invalid boolean "${saved}"`);
    }
    if (typeof defaultValue === 'number') {
        const number = Number(saved);
        if (saved.trim() === '' || !Number.isFinite(number)) {
            throw new Error(`invalid number "${saved}"`);
        }
        return number;
    }
    if (typeof defaultValue === 'object' && defaultValue !== null) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(defaultValue) !== Array.isArray(parsed) || typeof parsed !== 'object' || parsed === null) {
            throw new Error('stored value has the wrong shape');
        }
        return parsed;
    }
    return saved;
};

/**
 * Custom hook for persisting state in localStorage.
 * The stored value is deserialized according to the type of `defaultValue`.
 * Invalid or corrupted values fall back to `defaultValue`.
 *
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value if nothing (valid) is stored
 * @param {object} [options]
 * @param {(value: any) => boolean} [options.validate] - Extra check; returning false falls back to the default
 */
export const useLocalStorage = (key, defaultValue, { validate } = {}) => {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved === null) return defaultValue;

            const parsed = parseStored(saved, defaultValue);
            if (validate && !validate(parsed)) {
                throw new Error(`value ${saved} failed validation`);
            }
            return parsed;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}", using default:`, error);
            return defaultValue;
        }
    });

    useEffect(() => {
        try {
            const valueToStore = typeof value === 'object'
                ? JSON.stringify(value)
                : String(value);
            localStorage.setItem(key, valueToStore);
        } catch (error) {
            console.warn(`Error writing localStorage key "${key}":`, error);
        }
    }, [key, value]);

    return [value, setValue];
};

export default useLocalStorage;

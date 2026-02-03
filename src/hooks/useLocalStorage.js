import { useState, useEffect } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value if nothing is stored
 * @param {function} [parser] - Optional parser for the stored value (default: JSON.parse for objects, direct for primitives)
 */
export const useLocalStorage = (key, defaultValue, parser = null) => {
    const [value, setValue] = useState(() => {
        try {
            const saved = localStorage.getItem(key);
            if (saved === null) return defaultValue;

            // Use custom parser if provided
            if (parser) return parser(saved);

            // Auto-detect type based on defaultValue
            if (typeof defaultValue === 'boolean') {
                return saved === 'true';
            }
            if (typeof defaultValue === 'number') {
                return parseInt(saved, 10);
            }
            if (typeof defaultValue === 'object') {
                return JSON.parse(saved);
            }
            return saved;
        } catch (error) {
            console.warn(`Error reading localStorage key "${key}":`, error);
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

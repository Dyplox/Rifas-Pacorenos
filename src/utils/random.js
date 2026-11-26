const UINT32_RANGE = 2 ** 32;

/**
 * Returns a cryptographically secure, uniformly distributed integer in [0, max).
 * Uses rejection sampling to avoid modulo bias.
 */
export const randomInt = (max) => {
    if (!Number.isInteger(max) || max <= 0 || max > UINT32_RANGE) {
        throw new RangeError(`randomInt: max must be an integer in (0, 2^32], got ${max}`);
    }
    const limit = UINT32_RANGE - (UINT32_RANGE % max);
    const buffer = new Uint32Array(1);
    let value;
    do {
        crypto.getRandomValues(buffer);
        value = buffer[0];
    } while (value >= limit);
    return value % max;
};

/**
 * Picks a random zero-padded number with `digitCount` digits,
 * skipping any number contained in `excluded`.
 * Returns null when every possible number is excluded.
 */
export const pickWinner = (digitCount, excluded = new Set()) => {
    const max = 10 ** digitCount;
    const format = (n) => n.toString().padStart(digitCount, '0');

    if (excluded.size === 0) return format(randomInt(max));

    const available = [];
    for (let n = 0; n < max; n++) {
        const candidate = format(n);
        if (!excluded.has(candidate)) available.push(candidate);
    }
    if (available.length === 0) return null;
    return available[randomInt(available.length)];
};

/**
 * Unique id for history entries.
 */
export const generateId = () => {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const buffer = new Uint32Array(4);
    crypto.getRandomValues(buffer);
    return Array.from(buffer, (n) => n.toString(16).padStart(8, '0')).join('-');
};

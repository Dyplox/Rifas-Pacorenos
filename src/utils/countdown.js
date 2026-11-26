/**
 * How close the countdown is to the end: 0 on the first number, 1 on the last ("1").
 * Drives color, size, pulse speed and heartbeat pitch. Non-numeric phases count as 1.
 */
export const countdownTension = (count, duration) => {
    if (typeof count !== 'number') return 1;
    if (duration <= 1) return 1;
    return Math.min(1, Math.max(0, (duration - count) / (duration - 1)));
};

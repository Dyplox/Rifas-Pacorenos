// Synthesized sound effects with the Web Audio API (no audio files needed).

let audioContext = null;

const getContext = () => {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!audioContext) audioContext = new AudioCtx();
    // Browsers suspend the context until a user gesture; raffles start from one
    if (audioContext.state === 'suspended') audioContext.resume();
    return audioContext;
};

const playTone = (ctx, { frequency, start = 0, duration = 0.15, type = 'sine', volume = 0.2 }) => {
    const time = ctx.currentTime + start;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, time);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(volume, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.05);
};

const withContext = (play) => (...args) => {
    try {
        const ctx = getContext();
        if (ctx) play(ctx, ...args);
    } catch (error) {
        console.warn('Error playing sound:', error);
    }
};

/**
 * Heartbeat ("lub-dub") for each countdown number.
 * `tension` goes from 0 (first number) to 1 (last): higher pitch, louder, closer beats.
 */
export const playHeartbeat = withContext((ctx, tension = 0) => {
    const base = 95 + tension * 70;
    const volume = 0.3 + tension * 0.25;
    const gap = 0.22 - tension * 0.08;
    playTone(ctx, { frequency: base, duration: 0.16, type: 'sine', volume });
    playTone(ctx, { frequency: base * 4, duration: 0.04, type: 'triangle', volume: volume * 0.3 });
    playTone(ctx, { frequency: base * 0.85, start: gap, duration: 0.2, type: 'sine', volume: volume * 0.8 });
});

/** Rising sound for the dramatic pause before "¡MATRACA!" */
export const playRiser = withContext((ctx, durationMs = 1200) => {
    const duration = durationMs / 1000;
    const time = ctx.currentTime;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(140, time);
    oscillator.frequency.exponentialRampToValueAtTime(1100, time + duration);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.12, time + duration * 0.9);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.05);
});

/** "¡MATRACA!" moment */
export const playGo = withContext((ctx) => {
    playTone(ctx, { frequency: 880, duration: 0.25, type: 'sawtooth', volume: 0.15 });
    playTone(ctx, { frequency: 1320, start: 0.05, duration: 0.3, type: 'square', volume: 0.1 });
});

/** Single digit revealed in manual mode */
export const playReveal = withContext((ctx) => {
    playTone(ctx, { frequency: 520, duration: 0.18, type: 'triangle', volume: 0.2 });
});

/** Winner fanfare (rising arpeggio) */
export const playFanfare = withContext((ctx) => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((frequency, i) => {
        playTone(ctx, { frequency, start: i * 0.12, duration: 0.3, type: 'triangle', volume: 0.22 });
    });
    playTone(ctx, { frequency: 1046.5, start: notes.length * 0.12, duration: 0.8, type: 'triangle', volume: 0.25 });
});

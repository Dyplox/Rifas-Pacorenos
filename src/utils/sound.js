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

const withContext = (play) => () => {
    try {
        const ctx = getContext();
        if (ctx) play(ctx);
    } catch (error) {
        console.warn('Error playing sound:', error);
    }
};

/** Short tick for each countdown number */
export const playTick = withContext((ctx) => {
    playTone(ctx, { frequency: 660, duration: 0.12, type: 'square', volume: 0.12 });
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

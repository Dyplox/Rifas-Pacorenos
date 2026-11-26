// Sound effects.
//
// Recorded clips (played with howler.js, files in public/sounds/, credits in soundCredits.js):
//   - drum-roll.mp3: the most intense part of the roll. Starts at the dark pause and loops until
//     the number is revealed (≈2.3s: pause + ¡MATRACA! + short shuffle, so normally no loop).
//   - drum-hit.mp3: the final hit with its ring-out, played exactly when the number shows.
//   - applause.mp3: right after the hit (fade-out already in the file).
//   How they were cut and leveled: docs/DEVELOPMENT.md → "Sonidos".
// Synthesized with the Web Audio API (simple tones that synthesize well):
//   - Heartbeat on each countdown number, blip on each intermediate digit in manual mode.

import { Howl } from 'howler';

const BASE = import.meta.env.BASE_URL;

// The crowd reacts a beat after the hit (also keeps the two attacks from adding up and clipping)
export const APPLAUSE_DELAY_MS = 150;
const APPLAUSE_VOLUME = 0.8;

export const SOUND_FILES = {
    drumRoll: `${BASE}sounds/drum-roll.mp3`,
    drumHit: `${BASE}sounds/drum-hit.mp3`,
    applause: `${BASE}sounds/applause.mp3`,
};

// ---------- Recorded clips (howler.js) ----------

const howls = {};

/** Created on first use (after a user gesture or once sound is enabled), not at import time */
const getHowl = (name) => {
    if (!howls[name]) {
        howls[name] = new Howl({
            src: [SOUND_FILES[name]],
            preload: true,
            loop: name === 'drumRoll',
            volume: name === 'applause' ? APPLAUSE_VOLUME : 1,
        });
    }
    return howls[name];
};

/** Loads the files ahead of time so the first raffle doesn't wait for them */
export const preloadSounds = () => {
    try {
        Object.keys(SOUND_FILES).forEach(getHowl);
    } catch (error) {
        console.warn('Error preloading sounds:', error);
    }
};

let rollId = null;

/** Starts the drum roll (no-op if it is already rolling) */
export const startDrumRoll = () => {
    if (rollId !== null) return;
    try {
        const roll = getHowl('drumRoll');
        rollId = roll.play();
        roll.volume(1, rollId);
    } catch (error) {
        console.warn('Error playing drum roll:', error);
        rollId = null;
    }
};

/** Stops the drum roll with a short fade (safe to call any time) */
export const stopDrumRoll = (fadeMs = 120) => {
    if (rollId === null || !howls.drumRoll) return;
    const roll = howls.drumRoll;
    const id = rollId;
    rollId = null;
    try {
        roll.once('fade', () => roll.stop(id), id);
        roll.fade(roll.volume(id), 0, fadeMs, id);
    } catch (error) {
        console.warn('Error stopping drum roll:', error);
        roll.stop(id);
    }
};

/** Winner shown: the roll ends in the recorded final hit, followed by applause */
export const playWinnerSound = () => {
    try {
        stopDrumRoll(40);
        getHowl('drumHit').play();
        const applause = getHowl('applause');
        setTimeout(() => applause.play(), APPLAUSE_DELAY_MS);
    } catch (error) {
        console.warn('Error playing winner sound:', error);
    }
};

// ---------- Synthesized tones (Web Audio) ----------

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
    const t = ctx.currentTime + start;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.05);
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

/** Intermediate digit in manual mode: the roll stops on a short blip */
export const playReveal = () => {
    stopDrumRoll(60);
    withContext((ctx) => {
        playTone(ctx, { frequency: 520, duration: 0.18, type: 'triangle', volume: 0.2 });
    })();
};

// Synthesized sound effects with the Web Audio API (no audio files needed).
//
// Countdown soundtrack:
//   numbers      → heartbeat ("lub-dub"), faster and higher as it ends
//   dark pause   → snare drum roll starts (crescendo) and keeps going…
//   ¡MATRACA!    → tom accent on top of the roll
//   number shown → roll stops with a cymbal crash + bass drum, blending into applause
//
// Each sound is built by a `build*` function that takes (ctx, destination, time), so it can also be
// rendered with an OfflineAudioContext (see `soundBuilders`).

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

const withContext = (play) => (...args) => {
    try {
        const ctx = getContext();
        if (ctx) return play(ctx, ...args);
    } catch (error) {
        console.warn('Error playing sound:', error);
    }
    return undefined;
};

// ---------- Master bus ----------

const outputs = new WeakMap();
/**
 * Shared output: every sound goes through a compressor/limiter, so overlapping sounds
 * (crash + bass drum + applause + the end of the roll) never clip and distort.
 */
const getOutput = (ctx) => {
    if (!outputs.has(ctx)) {
        const limiter = ctx.createDynamicsCompressor();
        limiter.threshold.value = -12;
        limiter.knee.value = 6;
        limiter.ratio.value = 12;
        limiter.attack.value = 0.003;
        limiter.release.value = 0.25;
        const level = ctx.createGain();
        level.gain.value = 0.9;
        limiter.connect(level).connect(ctx.destination);
        outputs.set(ctx, limiter);
    }
    return outputs.get(ctx);
};

// ---------- Building blocks ----------

const playTone = (ctx, destination, time, { frequency, start = 0, duration = 0.15, type = 'sine', volume = 0.2 }) => {
    const t = time + start;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(volume, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    oscillator.connect(gain).connect(destination);
    oscillator.start(t);
    oscillator.stop(t + duration + 0.05);
};

const noiseBuffers = new WeakMap();
/** 2 seconds of white noise, cached per context */
const getNoise = (ctx) => {
    if (!noiseBuffers.has(ctx)) {
        const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
        noiseBuffers.set(ctx, buffer);
    }
    return noiseBuffers.get(ctx);
};

const noiseSource = (ctx, loop = false) => {
    const source = ctx.createBufferSource();
    source.buffer = getNoise(ctx);
    source.loop = loop;
    return source;
};

const filter = (ctx, type, frequency, Q = 0.7) => {
    const node = ctx.createBiquadFilter();
    node.type = type;
    node.frequency.value = frequency;
    node.Q.value = Q;
    return node;
};

/** Bass drum: a sine that drops in pitch */
const buildKick = (ctx, destination, time, { volume = 0.9, from = 120, to = 42, duration = 0.45 } = {}) => {
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(from, time);
    oscillator.frequency.exponentialRampToValueAtTime(to, time + duration * 0.6);
    gain.gain.setValueAtTime(volume, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    oscillator.connect(gain).connect(destination);
    oscillator.start(time);
    oscillator.stop(time + duration + 0.05);
};

// ---------- Countdown numbers ----------

/**
 * Heartbeat ("lub-dub") for each countdown number.
 * `tension` goes from 0 (first number) to 1 (last): higher pitch, louder, closer beats.
 */
const buildHeartbeat = (ctx, destination, time, tension = 0) => {
    const base = 95 + tension * 70;
    const volume = 0.3 + tension * 0.25;
    const gap = 0.22 - tension * 0.08;
    playTone(ctx, destination, time, { frequency: base, duration: 0.16, type: 'sine', volume });
    playTone(ctx, destination, time, { frequency: base * 4, duration: 0.04, type: 'triangle', volume: volume * 0.3 });
    playTone(ctx, destination, time, { frequency: base * 0.85, start: gap, duration: 0.2, type: 'sine', volume: volume * 0.8 });
};

// ---------- Drum roll ----------

const ROLL_MAX_SECONDS = 20; // safety net: never roll forever

/**
 * Snare drum roll: filtered noise whose volume is chopped into fast strokes (sawtooth LFO:
 * sharp attack, quick decay), plus a soft drum body. Crescendo over ~1.8s, strokes speed up.
 * Returns a `stop(at)` that fades it out quickly.
 */
const buildDrumRoll = (ctx, destination, time) => {
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, time);
    master.gain.exponentialRampToValueAtTime(0.12, time + 0.25);
    master.gain.exponentialRampToValueAtTime(0.32, time + 1.8);
    master.connect(destination);

    // Snare wires: bright noise
    const snare = noiseSource(ctx, true);
    const highpass = filter(ctx, 'highpass', 1400);
    const presence = filter(ctx, 'peaking', 3800, 1);
    presence.gain.value = 5;

    // Strokes: gain = 0.5 - 0.5 * sawtooth → jumps to 1 on each stroke, then decays
    const strokes = ctx.createGain();
    strokes.gain.value = 0.5;
    const lfo = ctx.createOscillator();
    lfo.type = 'sawtooth';
    lfo.frequency.setValueAtTime(15, time);
    lfo.frequency.linearRampToValueAtTime(22, time + 2);
    const lfoDepth = ctx.createGain();
    lfoDepth.gain.value = -0.5;
    lfo.connect(lfoDepth).connect(strokes.gain);

    snare.connect(highpass).connect(presence).connect(strokes).connect(master);

    // Drum body: low noise rumble under the strokes
    const body = noiseSource(ctx, true);
    const lowpass = filter(ctx, 'lowpass', 220);
    const bodyGain = ctx.createGain();
    bodyGain.gain.value = 0.35;
    body.connect(lowpass).connect(bodyGain).connect(strokes);

    const sources = [snare, body, lfo];
    sources.forEach(source => source.start(time));
    const safetyStop = time + ROLL_MAX_SECONDS;
    sources.forEach(source => source.stop(safetyStop));

    let stopped = false;
    return {
        stop(at = ctx.currentTime) {
            if (stopped) return;
            stopped = true;
            master.gain.cancelScheduledValues(at);
            master.gain.setValueAtTime(Math.max(master.gain.value, 0.0001), at);
            master.gain.exponentialRampToValueAtTime(0.0001, at + 0.08);
            sources.forEach(source => {
                try { source.stop(at + 0.12); } catch { /* already stopped */ }
            });
        },
    };
};

/** "¡MATRACA!" accent on top of the roll: a deep tom hit */
const buildTomAccent = (ctx, destination, time) => {
    buildKick(ctx, destination, time, { volume: 0.7, from: 190, to: 85, duration: 0.35 });
    const click = noiseSource(ctx);
    const bandpass = filter(ctx, 'bandpass', 2500, 1.2);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, time);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.06);
    click.connect(bandpass).connect(gain).connect(destination);
    click.start(time);
    click.stop(time + 0.1);
};

// ---------- Reveal ----------

/** Cymbal crash + bass drum: the end of the roll */
const buildCrash = (ctx, destination, time) => {
    buildKick(ctx, destination, time, { volume: 0.75 });
    const cymbal = noiseSource(ctx);
    const highpass = filter(ctx, 'highpass', 5000);
    const shimmer = filter(ctx, 'peaking', 8000, 0.8);
    shimmer.gain.value = 6;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.5, time + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 1.9);
    cymbal.connect(highpass).connect(shimmer).connect(gain).connect(destination);
    cymbal.start(time);
    cymbal.stop(time + 2);
};

export const APPLAUSE_SECONDS = 4.2;
const applauseBuffers = new WeakMap();

/**
 * Crowd applause rendered once into a buffer: hundreds of short noise "claps" at random
 * times over a soft crowd wash. Swells in, sustains, then fades out.
 */
const getApplause = (ctx) => {
    if (applauseBuffers.has(ctx)) return applauseBuffers.get(ctx);

    const rate = ctx.sampleRate;
    const length = Math.floor(rate * APPLAUSE_SECONDS);
    const buffer = ctx.createBuffer(1, length, rate);
    const data = buffer.getChannelData(0);

    // Crowd intensity over time: fast swell, sustain, long fade
    const envelope = (t) => {
        if (t < 0.25) return t / 0.25;
        if (t < 2.2) return 1;
        return Math.max(0, 1 - (t - 2.2) / (APPLAUSE_SECONDS - 2.2)) ** 1.5;
    };

    const claps = 1000;
    for (let c = 0; c < claps; c++) {
        const t = Math.random() * APPLAUSE_SECONDS;
        const env = envelope(t);
        if (env <= 0 || Math.random() > env) continue;
        const start = Math.floor(t * rate);
        const clapLength = Math.floor(rate * (0.008 + Math.random() * 0.02));
        const amplitude = 0.25 + Math.random() * 0.75;
        for (let i = 0; i < clapLength && start + i < length; i++) {
            data[start + i] += (Math.random() * 2 - 1) * amplitude * Math.exp(-i / (clapLength * 0.25));
        }
    }
    for (let i = 0; i < length; i++) {
        data[i] += (Math.random() * 2 - 1) * 0.12 * envelope(i / rate);
    }

    let peak = 0;
    for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(data[i]));
    if (peak > 0) for (let i = 0; i < length; i++) data[i] *= 0.9 / peak;

    applauseBuffers.set(ctx, buffer);
    return buffer;
};

const buildApplause = (ctx, destination, time) => {
    const source = ctx.createBufferSource();
    source.buffer = getApplause(ctx);
    const highpass = filter(ctx, 'highpass', 350);
    const tone = filter(ctx, 'peaking', 1800, 0.7);
    tone.gain.value = 4;
    const gain = ctx.createGain();
    gain.gain.value = 0.8;
    source.connect(highpass).connect(tone).connect(gain).connect(destination);
    source.start(time);
};

/** Single digit revealed in manual mode */
const buildRevealBlip = (ctx, destination, time) => {
    playTone(ctx, destination, time, { frequency: 520, duration: 0.18, type: 'triangle', volume: 0.2 });
};

/** For rendering with an OfflineAudioContext (checks and previews); not used by the app */
export const soundBuilders = {
    output: getOutput,
    heartbeat: buildHeartbeat,
    drumRoll: buildDrumRoll,
    tomAccent: buildTomAccent,
    crash: buildCrash,
    applause: buildApplause,
    revealBlip: buildRevealBlip,
};

// ---------- Public API (live AudioContext) ----------

let activeRoll = null;

export const playHeartbeat = withContext((ctx, tension = 0) => {
    buildHeartbeat(ctx, getOutput(ctx), ctx.currentTime, tension);
});

/** Starts the drum roll (no-op if one is already rolling) */
export const startDrumRoll = withContext((ctx) => {
    if (activeRoll) return;
    activeRoll = buildDrumRoll(ctx, getOutput(ctx), ctx.currentTime);
});

/** Stops the drum roll if it is playing (safe to call any time) */
export const stopDrumRoll = () => {
    if (!activeRoll) return;
    try {
        activeRoll.stop();
    } catch (error) {
        console.warn('Error stopping drum roll:', error);
    }
    activeRoll = null;
};

/** "¡MATRACA!" accent */
export const playGo = withContext((ctx) => {
    buildTomAccent(ctx, getOutput(ctx), ctx.currentTime);
});

/** Intermediate digit in manual mode: the roll stops on a short blip */
export const playReveal = withContext((ctx) => {
    stopDrumRoll();
    buildRevealBlip(ctx, getOutput(ctx), ctx.currentTime);
});

/** Winner shown: the roll ends in a crash that blends into applause */
export const playWinnerSound = withContext((ctx) => {
    stopDrumRoll();
    const now = ctx.currentTime;
    const output = getOutput(ctx);
    buildCrash(ctx, output, now);
    buildApplause(ctx, output, now + 0.05);
});

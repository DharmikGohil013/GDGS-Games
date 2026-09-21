// ─── Shared WebAudio synth ───
// One AudioContext for every game. Replaces the three near-identical SoundFX
// classes that used to live inside color-switch, hextris and infinite-runner.

import { getSettings, setSetting } from './progress.js';

let ctx = null;
let master = null;

function ensureContext() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.6;
      master.connect(ctx.destination);
    } catch (e) {
      ctx = null;
      return null;
    }
  }
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});
  return ctx;
}

export function isSoundOn() {
  return getSettings().sound !== false;
}

export function setSoundOn(on) {
  setSetting('sound', Boolean(on));
  if (master) master.gain.value = on ? 0.6 : 0;
  return on;
}

export function toggleSound() {
  return setSoundOn(!isSoundOn());
}

/** Unlock audio from a user gesture — browsers require this before any sound. */
export function unlockAudio() {
  ensureContext();
}

/**
 * One-shot oscillator tone.
 * @param {object} o { type, from, to, dur, vol, delay, curve }
 */
export function tone(o = {}) {
  if (!isSoundOn()) return;
  const c = ensureContext();
  if (!c) return;

  const type = o.type || 'sine';
  const from = o.from || 440;
  const to = o.to == null ? from : o.to;
  const dur = o.dur || 0.12;
  const vol = o.vol == null ? 0.18 : o.vol;
  const start = c.currentTime + (o.delay || 0);

  try {
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(from, start);
    if (to !== from) {
      // exponentialRamp cannot touch zero, so clamp the target.
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), start + dur);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, vol), start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + dur + 0.03);
  } catch (e) { /* audio is best-effort; never break gameplay over it */ }
}

/** Filtered white noise — impacts, explosions, whooshes. */
export function noise(o = {}) {
  if (!isSoundOn()) return;
  const c = ensureContext();
  if (!c) return;

  const dur = o.dur || 0.18;
  const vol = o.vol == null ? 0.16 : o.vol;
  const freq = o.freq || 1200;

  try {
    const frames = Math.max(1, Math.floor(c.sampleRate * dur));
    const buffer = c.createBuffer(1, frames, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frames; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / frames);
    }

    const src = c.createBufferSource();
    src.buffer = buffer;

    const filter = c.createBiquadFilter();
    filter.type = o.filter || 'lowpass';
    filter.frequency.setValueAtTime(freq, c.currentTime);
    if (o.freqEnd) filter.frequency.exponentialRampToValueAtTime(Math.max(1, o.freqEnd), c.currentTime + dur);

    const gain = c.createGain();
    gain.gain.setValueAtTime(vol, c.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start();
  } catch (e) { /* ignore */ }
}

/* ───────────────────────── named game cues ─────────────────────────
   Games call these instead of hand-rolling oscillator math, which keeps
   the whole catalogue sounding like one product.                       */

export const sfx = {
  jump()      { tone({ type: 'sine',     from: 260,  to: 620,  dur: 0.11, vol: 0.16 }); },
  hop()       { tone({ type: 'triangle', from: 380,  to: 720,  dur: 0.09, vol: 0.14 }); },
  land()      { noise({ dur: 0.10, vol: 0.10, freq: 700, freqEnd: 180 }); },
  pickup()    { tone({ type: 'square',   from: 880,  to: 1320, dur: 0.09, vol: 0.12 }); },

  coin() {
    tone({ type: 'square', from: 988,  to: 988,  dur: 0.06, vol: 0.10 });
    tone({ type: 'square', from: 1319, to: 1319, dur: 0.10, vol: 0.10, delay: 0.055 });
  },

  /** Rising pitch as the combo climbs — the core "keep going" feedback. */
  combo(step = 1) {
    const base = 520 + Math.min(step, 16) * 55;
    tone({ type: 'triangle', from: base, to: base * 1.5, dur: 0.12, vol: 0.15 });
  },

  powerup() {
    tone({ type: 'sawtooth', from: 300, to: 900,  dur: 0.18, vol: 0.13 });
    tone({ type: 'sine',     from: 600, to: 1500, dur: 0.22, vol: 0.10, delay: 0.05 });
  },

  perfect() {
    tone({ type: 'sine', from: 784,  to: 784,  dur: 0.07, vol: 0.14 });
    tone({ type: 'sine', from: 1047, to: 1047, dur: 0.07, vol: 0.14, delay: 0.06 });
    tone({ type: 'sine', from: 1319, to: 1319, dur: 0.16, vol: 0.14, delay: 0.12 });
  },

  merge(level = 1) {
    const base = 300 + Math.min(level, 10) * 60;
    tone({ type: 'triangle', from: base, to: base * 1.6, dur: 0.14, vol: 0.16 });
  },

  hit()  { noise({ dur: 0.22, vol: 0.20, freq: 1800, freqEnd: 120 }); },
  crash() {
    noise({ dur: 0.40, vol: 0.24, freq: 2400, freqEnd: 80 });
    tone({ type: 'sawtooth', from: 180, to: 40, dur: 0.38, vol: 0.14 });
  },

  gameOver() {
    tone({ type: 'sawtooth', from: 400, to: 300, dur: 0.16, vol: 0.14 });
    tone({ type: 'sawtooth', from: 300, to: 220, dur: 0.16, vol: 0.14, delay: 0.15 });
    tone({ type: 'sawtooth', from: 220, to: 110, dur: 0.38, vol: 0.14, delay: 0.30 });
  },

  levelUp() {
    [523, 659, 784, 1047].forEach((f, i) => {
      tone({ type: 'triangle', from: f, to: f, dur: 0.16, vol: 0.15, delay: i * 0.09 });
    });
  },

  reward() {
    [659, 880, 1175].forEach((f, i) => {
      tone({ type: 'square', from: f, to: f, dur: 0.11, vol: 0.11, delay: i * 0.07 });
    });
  },

  ui()     { tone({ type: 'sine', from: 660, to: 880, dur: 0.06, vol: 0.09 }); },
  uiBack() { tone({ type: 'sine', from: 660, to: 440, dur: 0.07, vol: 0.09 }); },
  error()  { tone({ type: 'square', from: 200, to: 120, dur: 0.16, vol: 0.12 }); },
};

/** Short haptic buzz on devices that support it. */
export function haptic(pattern = 12) {
  if (!getSettings().haptics) return;
  try { navigator.vibrate?.(pattern); } catch (e) { /* ignore */ }
}

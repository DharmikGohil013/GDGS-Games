/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BiomeType } from './rules';

export class AmbientAudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public isMuted: boolean = false;
  public volume: number = 0.4;
  public isPaused: boolean = false;

  private currentBiome: BiomeType = 'plains';
  private isDaytime: boolean = true;
  private isInitialized: boolean = false;

  // Continuous soundscape channel gain nodes
  private channelGains: Map<BiomeType, GainNode> = new Map();

  // Cave binaural oscillators
  private caveOsc1: OscillatorNode | null = null;
  private caveOsc2: OscillatorNode | null = null;

  // LFO for mountain / desert wind whistling
  private lfoOsc: OscillatorNode | null = null;

  // Procedural random event timer
  private eventTimer: number | null = null;

  public init() {
    if (this.isInitialized || typeof window === 'undefined') return;

    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupNoiseAndChannels();
      this.startEventLoop();
      this.isInitialized = true;
    } catch {
      // Audio context may be restricted before user gesture
    }
  }

  private ensureAudioContextRunning() {
    if (!this.ctx) {
      this.init();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private setupNoiseAndChannels() {
    if (!this.ctx || !this.masterGain) return;

    // 1. Generate 5 seconds of procedural white/pink noise buffer
    const bufferDuration = 5.0;
    const sampleRate = this.ctx.sampleRate;
    const bufferSize = sampleRate * bufferDuration;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = noiseBuffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise approximation for a warmer, natural acoustic bed
      b0 = 0.99765 * b0 + white * 0.0990460;
      b1 = 0.96300 * b1 + white * 0.1243600;
      b2 = 0.87000 * b2 + white * 0.2500000;
      const pink = (b0 + b1 + b2 + white * 0.5362) * 0.15;
      data[i] = pink;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // --- Channel 1: Plains (Gentle open breeze) ---
    const plainsFilter = this.ctx.createBiquadFilter();
    plainsFilter.type = 'bandpass';
    plainsFilter.frequency.setValueAtTime(600, this.ctx.currentTime);
    plainsFilter.Q.setValueAtTime(0.8, this.ctx.currentTime);

    const plainsGain = this.ctx.createGain();
    plainsGain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    noiseSource.connect(plainsFilter);
    plainsFilter.connect(plainsGain);
    plainsGain.connect(this.masterGain);
    this.channelGains.set('plains', plainsGain);

    // --- Channel 2: Forest (Leaf flutter whisper) ---
    const forestFilter = this.ctx.createBiquadFilter();
    forestFilter.type = 'bandpass';
    forestFilter.frequency.setValueAtTime(1150, this.ctx.currentTime);
    forestFilter.Q.setValueAtTime(1.2, this.ctx.currentTime);

    const forestGain = this.ctx.createGain();
    forestGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    noiseSource.connect(forestFilter);
    forestFilter.connect(forestGain);
    forestGain.connect(this.masterGain);
    this.channelGains.set('forest', forestGain);

    // --- Channel 3: Desert (Dry, raspy desert wind whistle) ---
    const desertFilter = this.ctx.createBiquadFilter();
    desertFilter.type = 'bandpass';
    desertFilter.frequency.setValueAtTime(950, this.ctx.currentTime);
    desertFilter.Q.setValueAtTime(3.2, this.ctx.currentTime);

    const desertGain = this.ctx.createGain();
    desertGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    noiseSource.connect(desertFilter);
    desertFilter.connect(desertGain);
    desertGain.connect(this.masterGain);
    this.channelGains.set('desert', desertGain);

    // --- Channel 4: Mountain (Alpine howling cold wind) ---
    const mountainFilter = this.ctx.createBiquadFilter();
    mountainFilter.type = 'bandpass';
    mountainFilter.frequency.setValueAtTime(750, this.ctx.currentTime);
    mountainFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

    const mountainGain = this.ctx.createGain();
    mountainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    noiseSource.connect(mountainFilter);
    mountainFilter.connect(mountainGain);
    mountainGain.connect(this.masterGain);
    this.channelGains.set('mountain', mountainGain);

    // --- Channel 5: Underwater (Muffled low-pass oceanic abyss) ---
    const underwaterFilter = this.ctx.createBiquadFilter();
    underwaterFilter.type = 'lowpass';
    underwaterFilter.frequency.setValueAtTime(180, this.ctx.currentTime);
    underwaterFilter.Q.setValueAtTime(2.0, this.ctx.currentTime);

    const underwaterGain = this.ctx.createGain();
    underwaterGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    noiseSource.connect(underwaterFilter);
    underwaterFilter.connect(underwaterGain);
    underwaterGain.connect(this.masterGain);
    this.channelGains.set('underwater', underwaterGain);

    // --- Channel 6: Cave (Binaural beating drone + low subterranean rumble) ---
    const caveGain = this.ctx.createGain();
    caveGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);
    caveGain.connect(this.masterGain);
    this.channelGains.set('cave', caveGain);

    // Cave low rumble from noise
    const caveNoiseFilter = this.ctx.createBiquadFilter();
    caveNoiseFilter.type = 'lowpass';
    caveNoiseFilter.frequency.setValueAtTime(110, this.ctx.currentTime);
    noiseSource.connect(caveNoiseFilter);
    caveNoiseFilter.connect(caveGain);

    // Cave binaural detuned drones (55 Hz and 58 Hz produce an ominous 3 Hz subterranean pulse)
    this.caveOsc1 = this.ctx.createOscillator();
    this.caveOsc1.type = 'sine';
    this.caveOsc1.frequency.setValueAtTime(55, this.ctx.currentTime);

    this.caveOsc2 = this.ctx.createOscillator();
    this.caveOsc2.type = 'sine';
    this.caveOsc2.frequency.setValueAtTime(58.2, this.ctx.currentTime);

    const droneSubGain = this.ctx.createGain();
    droneSubGain.gain.setValueAtTime(0.35, this.ctx.currentTime);

    this.caveOsc1.connect(droneSubGain);
    this.caveOsc2.connect(droneSubGain);
    droneSubGain.connect(caveGain);

    this.caveOsc1.start();
    this.caveOsc2.start();

    // Start continuous looping noise source
    noiseSource.start();

    // Slow LFO to modulate mountain and desert wind filter frequencies
    this.lfoOsc = this.ctx.createOscillator();
    this.lfoOsc.type = 'sine';
    this.lfoOsc.frequency.setValueAtTime(0.12, this.ctx.currentTime); // ~8s cycle

    const lfoGainMountain = this.ctx.createGain();
    lfoGainMountain.gain.setValueAtTime(220, this.ctx.currentTime);
    this.lfoOsc.connect(lfoGainMountain);
    lfoGainMountain.connect(mountainFilter.frequency);

    const lfoGainDesert = this.ctx.createGain();
    lfoGainDesert.gain.setValueAtTime(300, this.ctx.currentTime);
    this.lfoOsc.connect(lfoGainDesert);
    lfoGainDesert.connect(desertFilter.frequency);

    this.lfoOsc.start();
  }

  /**
   * Smoothly cross-fade to the new biome soundscape over 2.5 seconds.
   */
  public setBiome(newBiome: BiomeType, isDay: boolean = true) {
    this.ensureAudioContextRunning();
    if (!this.ctx) return;

    this.isDaytime = isDay;
    if (this.currentBiome === newBiome && this.isInitialized) return;

    this.currentBiome = newBiome;
    const now = this.ctx.currentTime;
    const fadeDuration = 2.5;

    // Target volume targets per biome
    const targetLevels: Record<BiomeType, number> = {
      plains: 0.18,
      forest: 0.22,
      desert: 0.24,
      mountain: 0.28,
      cave: 0.32,
      underwater: 0.35,
    };

    this.channelGains.forEach((gainNode, biome) => {
      gainNode.gain.cancelScheduledValues(now);
      const currentVal = Math.max(0.0001, gainNode.gain.value);
      gainNode.gain.setValueAtTime(currentVal, now);

      if (biome === newBiome) {
        gainNode.gain.linearRampToValueAtTime(targetLevels[biome], now + fadeDuration);
      } else {
        gainNode.gain.linearRampToValueAtTime(0.0001, now + fadeDuration);
      }
    });
  }

  public getCurrentBiome(): BiomeType {
    return this.currentBiome;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (!this.ctx || !this.masterGain) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    if (muted || this.isPaused) {
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.1);
    } else {
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.2);
    }
  }

  public toggleMute(): boolean {
    this.setMuted(!this.isMuted);
    return this.isMuted;
  }

  public setMasterVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;
    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.1);
  }

  public pause() {
    this.isPaused = true;
    if (this.ctx && this.masterGain) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
    }
  }

  public resume() {
    this.isPaused = false;
    this.ensureAudioContextRunning();
    if (this.ctx && this.masterGain && !this.isMuted) {
      const now = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 0.3);
    }
  }

  /**
   * Periodic procedural one-shot triggers:
   * - Cave: Water drip pings with subtle echo
   * - Forest: Daytime bird chirps / Nighttime crickets
   * - Mountain: Cold gust howl
   * - Underwater: Bubbles
   */
  private startEventLoop() {
    const triggerNext = () => {
      if (this.eventTimer) clearTimeout(this.eventTimer);

      const delayMs = 3000 + Math.random() * 5000; // 3 to 8 seconds
      this.eventTimer = window.setTimeout(() => {
        if (!this.isPaused && !this.isMuted && this.ctx && this.ctx.state === 'running') {
          this.playBiomeProceduralEvent();
        }
        triggerNext();
      }, delayMs);
    };

    triggerNext();
  }

  private playBiomeProceduralEvent() {
    if (!this.ctx || !this.masterGain) return;

    switch (this.currentBiome) {
      case 'cave':
        this.playCaveDrip();
        break;
      case 'forest':
        if (this.isDaytime) {
          this.playBirdChirp();
        } else {
          this.playCricketChirp();
        }
        break;
      case 'mountain':
        this.playMountainGust();
        break;
      case 'underwater':
        this.playUnderwaterBubble();
        break;
      case 'desert':
        this.playDesertGust();
        break;
      case 'plains':
        if (this.isDaytime && Math.random() < 0.4) {
          this.playBirdChirp();
        }
        break;
    }
  }

  /**
   * Procedural Cave Water Drip:
   * Fast frequency sweep down (1600 Hz -> 850 Hz) + trailing echo ping
   */
  public playCaveDrip() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 1400 + Math.random() * 400;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 0.52, t + 0.06);

    gain.gain.setValueAtTime(this.volume * 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.08);

    // Distant cave reverb / echo reflection ping
    if (Math.random() > 0.3) {
      const echoT = t + 0.16 + Math.random() * 0.08;
      const echoOsc = this.ctx.createOscillator();
      const echoGain = this.ctx.createGain();

      echoOsc.type = 'sine';
      echoOsc.frequency.setValueAtTime(startFreq * 0.48, echoT);
      echoOsc.frequency.exponentialRampToValueAtTime(startFreq * 0.35, echoT + 0.05);

      echoGain.gain.setValueAtTime(this.volume * 0.08, echoT);
      echoGain.gain.exponentialRampToValueAtTime(0.0005, echoT + 0.12);

      echoOsc.connect(echoGain);
      echoGain.connect(this.masterGain);

      echoOsc.start(echoT);
      echoOsc.stop(echoT + 0.12);
    }
  }

  /**
   * Procedural Forest Bird Song:
   * 2 to 3 melodic chirps with swift pitch glides
   */
  public playBirdChirp() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const chirpCount = 2 + Math.floor(Math.random() * 2);
    const baseFreq = 2200 + Math.random() * 800;
    let t = this.ctx.currentTime + 0.05;

    for (let i = 0; i < chirpCount; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      const f1 = baseFreq + (i % 2 === 0 ? 0 : 350) + (Math.random() * 200 - 100);
      const f2 = f1 + (Math.random() > 0.5 ? 400 : -350);

      osc.frequency.setValueAtTime(f1, t);
      osc.frequency.linearRampToValueAtTime(f2, t + 0.06);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(this.volume * 0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.09);

      t += 0.11 + Math.random() * 0.06;
    }
  }

  /**
   * Procedural Night Crickets:
   * High-pitch rhythmic clicks
   */
  public playCricketChirp() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const t = this.ctx.currentTime;
    const pulseCount = 3;
    const freq = 4600 + Math.random() * 300;

    for (let i = 0; i < pulseCount; i++) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + i * 0.05);

      gain.gain.setValueAtTime(this.volume * 0.08, t + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.05 + 0.035);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + i * 0.05);
      osc.stop(t + i * 0.05 + 0.035);
    }
  }

  /**
   * Procedural Mountain Wind Gust:
   * High resonant whistling swell
   */
  public playMountainGust() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.linearRampToValueAtTime(1100, t + 1.2);
    filter.frequency.linearRampToValueAtTime(380, t + 2.8);
    filter.Q.setValueAtTime(3.5, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(this.volume * 0.18, t + 1.2);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.8);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 2.8);
  }

  /**
   * Procedural Desert Sand Swirl:
   * Soft bandpass airy whistle
   */
  public playDesertGust() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, t);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(750, t);
    filter.frequency.linearRampToValueAtTime(1350, t + 1.0);
    filter.frequency.linearRampToValueAtTime(600, t + 2.2);
    filter.Q.setValueAtTime(4.0, t);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(this.volume * 0.16, t + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 2.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 2.2);
  }

  /**
   * Procedural Underwater Bubble Glug:
   * Ascending bubble "bloop"
   */
  public playUnderwaterBubble() {
    if (!this.ctx || !this.masterGain || this.isMuted || this.isPaused) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    const startFreq = 220 + Math.random() * 80;
    osc.type = 'sine';
    osc.frequency.setValueAtTime(startFreq, t);
    osc.frequency.exponentialRampToValueAtTime(startFreq * 2.3, t + 0.08);

    gain.gain.setValueAtTime(this.volume * 0.22, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  public destroy() {
    if (this.eventTimer) {
      clearTimeout(this.eventTimer);
      this.eventTimer = null;
    }
    if (this.caveOsc1) {
      try { this.caveOsc1.stop(); } catch {}
      this.caveOsc1 = null;
    }
    if (this.caveOsc2) {
      try { this.caveOsc2.stop(); } catch {}
      this.caveOsc2 = null;
    }
    if (this.lfoOsc) {
      try { this.lfoOsc.stop(); } catch {}
      this.lfoOsc = null;
    }
    if (this.ctx) {
      try { this.ctx.close(); } catch {}
      this.ctx = null;
    }
    this.isInitialized = false;
  }
}

export const ambientAudio = new AmbientAudioManager();

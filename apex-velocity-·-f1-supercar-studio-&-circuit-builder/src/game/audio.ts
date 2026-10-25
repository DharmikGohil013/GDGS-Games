// Procedural Web Audio API sound generator for F1/Supercar
class SoundManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private isMuted: boolean = false;

  // Engine oscillators
  private engineOsc1: OscillatorNode | null = null;
  private engineOsc2: OscillatorNode | null = null;
  private engineOsc3: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;

  // Gearbox whine
  private gearWhineOsc: OscillatorNode | null = null;
  private gearWhineGain: GainNode | null = null;

  // Tire screech noise
  private tireScreechNode: AudioBufferSourceNode | null = null;
  private tireScreechGain: GainNode | null = null;

  // Kerb rumble
  private kerbRumbleOsc: OscillatorNode | null = null;
  private kerbRumbleGain: GainNode | null = null;

  // Rain ambience
  private rainNoiseNode: AudioBufferSourceNode | null = null;
  private rainGain: GainNode | null = null;

  private isInitialized: boolean = false;

  public init() {
    if (this.isInitialized) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.4, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.setupEngine();
      this.setupGearWhine();
      this.setupTireScreech();
      this.setupKerbRumble();
      this.setupRainAmbience();

      this.isInitialized = true;
    } catch {
      // AudioContext unavailable in some headless environments
    }
  }

  private setupEngine() {
    if (!this.ctx || !this.masterGain) return;

    this.engineGain = this.ctx.createGain();
    this.engineGain.gain.setValueAtTime(0.01, this.ctx.currentTime);

    // Filter to give deep throatiness
    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3200, this.ctx.currentTime);

    // 3 harmonic sawtooth oscillators mimicking V10 / Hybrid engine roar
    this.engineOsc1 = this.ctx.createOscillator();
    this.engineOsc1.type = 'sawtooth';
    this.engineOsc1.frequency.setValueAtTime(80, this.ctx.currentTime);

    this.engineOsc2 = this.ctx.createOscillator();
    this.engineOsc2.type = 'sawtooth';
    this.engineOsc2.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.engineOsc3 = this.ctx.createOscillator();
    this.engineOsc3.type = 'triangle';
    this.engineOsc3.frequency.setValueAtTime(40, this.ctx.currentTime);

    this.engineOsc1.connect(this.engineGain);
    this.engineOsc2.connect(this.engineGain);
    this.engineOsc3.connect(this.engineGain);
    this.engineGain.connect(lowpass);
    lowpass.connect(this.masterGain);

    this.engineOsc1.start();
    this.engineOsc2.start();
    this.engineOsc3.start();
  }

  private setupGearWhine() {
    if (!this.ctx || !this.masterGain) return;
    this.gearWhineGain = this.ctx.createGain();
    this.gearWhineGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    this.gearWhineOsc = this.ctx.createOscillator();
    this.gearWhineOsc.type = 'sine';
    this.gearWhineOsc.frequency.setValueAtTime(400, this.ctx.currentTime);

    this.gearWhineOsc.connect(this.gearWhineGain);
    this.gearWhineGain.connect(this.masterGain);
    this.gearWhineOsc.start();
  }

  private setupTireScreech() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1400, this.ctx.currentTime);
    bandpass.Q.setValueAtTime(4.0, this.ctx.currentTime);

    this.tireScreechGain = this.ctx.createGain();
    this.tireScreechGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.tireScreechNode = this.ctx.createBufferSource();
    this.tireScreechNode.buffer = buffer;
    this.tireScreechNode.loop = true;

    this.tireScreechNode.connect(bandpass);
    bandpass.connect(this.tireScreechGain);
    this.tireScreechGain.connect(this.masterGain);
    this.tireScreechNode.start();
  }

  private setupKerbRumble() {
    if (!this.ctx || !this.masterGain) return;
    this.kerbRumbleGain = this.ctx.createGain();
    this.kerbRumbleGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.kerbRumbleOsc = this.ctx.createOscillator();
    this.kerbRumbleOsc.type = 'sawtooth';
    this.kerbRumbleOsc.frequency.setValueAtTime(32, this.ctx.currentTime);

    this.kerbRumbleOsc.connect(this.kerbRumbleGain);
    this.kerbRumbleGain.connect(this.masterGain);
    this.kerbRumbleOsc.start();
  }

  private setupRainAmbience() {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4;
    }

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(1800, this.ctx.currentTime);

    this.rainGain = this.ctx.createGain();
    this.rainGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    this.rainNoiseNode = this.ctx.createBufferSource();
    this.rainNoiseNode.buffer = buffer;
    this.rainNoiseNode.loop = true;

    this.rainNoiseNode.connect(lowpass);
    lowpass.connect(this.rainGain);
    this.rainGain.connect(this.masterGain);
    this.rainNoiseNode.start();
  }

  public updateEngine(rpm: number, throttle: number, speedMs: number, slipAmount: number, isKerb: boolean, isRain: boolean) {
    if (!this.ctx || this.isMuted) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const t = this.ctx.currentTime;

    // RPM frequencies
    const baseFreq = 60 + (rpm / 12000) * 440;
    if (this.engineOsc1) this.engineOsc1.frequency.setTargetAtTime(baseFreq, t, 0.04);
    if (this.engineOsc2) this.engineOsc2.frequency.setTargetAtTime(baseFreq * 1.5, t, 0.04);
    if (this.engineOsc3) this.engineOsc3.frequency.setTargetAtTime(baseFreq * 0.5, t, 0.04);

    // Engine volume: higher when on throttle
    const targetEngineVol = 0.06 + throttle * 0.16 + (speedMs / 90) * 0.08;
    if (this.engineGain) this.engineGain.gain.setTargetAtTime(targetEngineVol, t, 0.04);

    // Gear whine
    const whineFreq = 300 + (speedMs / 90) * 2200;
    if (this.gearWhineOsc) this.gearWhineOsc.frequency.setTargetAtTime(whineFreq, t, 0.05);
    const whineVol = Math.min(0.04, (speedMs / 90) * 0.04);
    if (this.gearWhineGain) this.gearWhineGain.gain.setTargetAtTime(whineVol, t, 0.05);

    // Tire screech
    const screechVol = Math.min(0.2, Math.abs(slipAmount) * 0.4);
    if (this.tireScreechGain) this.tireScreechGain.gain.setTargetAtTime(screechVol, t, 0.05);

    // Kerb rumble
    const kerbVol = isKerb && speedMs > 5 ? Math.min(0.18, 0.08 + (speedMs / 90) * 0.1) : 0.0001;
    if (this.kerbRumbleGain) this.kerbRumbleGain.gain.setTargetAtTime(kerbVol, t, 0.04);

    // Rain ambience
    const rainVol = isRain ? 0.09 : 0.0001;
    if (this.rainGain) this.rainGain.gain.setTargetAtTime(rainVol, t, 0.1);
  }

  public playExhaustPop() {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + Math.random() * 80, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.14, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.1);
    } catch {
      // ignore
    }
  }

  public playLapChime(isFastest: boolean) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const notes = isFastest ? [523.25, 659.25, 783.99, 1046.50] : [440, 554.37, 659.25];
      notes.forEach((freq, idx) => {
        if (!this.ctx || !this.masterGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const startTime = this.ctx.currentTime + idx * 0.09;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.25);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      });
    } catch {
      // ignore
    }
  }

  public playCollisionSound(intensity: number = 0.5) {
    if (!this.ctx || !this.masterGain || this.isMuted) return;
    try {
      const clampedInt = Math.max(0.1, Math.min(1.0, intensity));
      const t = this.ctx.currentTime;

      // 1. Heavy bass impact thud (body collision shock)
      const thudOsc = this.ctx.createOscillator();
      const thudGain = this.ctx.createGain();
      thudOsc.type = 'triangle';
      thudOsc.frequency.setValueAtTime(110 + clampedInt * 50, t);
      thudOsc.frequency.exponentialRampToValueAtTime(25, t + 0.18);

      thudGain.gain.setValueAtTime(0.35 * clampedInt, t);
      thudGain.gain.exponentialRampToValueAtTime(0.001, t + 0.22);

      thudOsc.connect(thudGain);
      thudGain.connect(this.masterGain);
      thudOsc.start(t);
      thudOsc.stop(t + 0.25);

      // 2. High-frequency metallic crunch & guardrail scrape
      const bufferSize = Math.floor(this.ctx.sampleRate * 0.15);
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.3));
      }

      const noiseNode = this.ctx.createBufferSource();
      noiseNode.buffer = noiseBuffer;

      const bandpass = this.ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(1800, t);
      bandpass.Q.setValueAtTime(2.5, t);

      const crunchGain = this.ctx.createGain();
      crunchGain.gain.setValueAtTime(0.28 * clampedInt, t);
      crunchGain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

      noiseNode.connect(bandpass);
      bandpass.connect(crunchGain);
      crunchGain.connect(this.masterGain);
      noiseNode.start(t);
    } catch {
      // ignore
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.05);
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.isMuted ? 0 : 0.4, this.ctx.currentTime, 0.05);
    }
    return this.isMuted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }
}

export const soundManager = new SoundManager();

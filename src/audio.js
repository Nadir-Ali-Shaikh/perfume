// Luxury Web Audio API Sound Generator (No external audio file dependencies)
class LuxuryAudio {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.ambientGain = null;
    this.droneOsc1 = null;
    this.droneOsc2 = null;
    this.filter = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();
  }

  toggleSound() {
    this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    if (!this.isMuted) {
      this.startAmbience();
    } else {
      this.stopAmbience();
    }
    return !this.isMuted;
  }

  startAmbience() {
    if (!this.ctx || this.droneOsc1) return;

    // Soft celestial luxury drone
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
    this.ambientGain.gain.exponentialRampToValueAtTime(0.04, this.ctx.currentTime + 3);

    this.filter = this.ctx.createBiquadFilter();
    this.filter.type = 'lowpass';
    this.filter.frequency.setValueAtTime(320, this.ctx.currentTime);

    // Deep harmonic warm drone (F# / C# chord)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(92.5, this.ctx.currentTime); // F#2

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(138.59, this.ctx.currentTime); // C#3

    const subOsc = this.ctx.createOscillator();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(46.25, this.ctx.currentTime); // F#1

    const subGain = this.ctx.createGain();
    subGain.gain.value = 0.5;
    subOsc.connect(subGain);
    subGain.connect(this.filter);

    this.droneOsc1.connect(this.filter);
    this.droneOsc2.connect(this.filter);
    this.filter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    this.droneOsc1.start();
    this.droneOsc2.start();
    subOsc.start();
    this.subOsc = subOsc;
  }

  stopAmbience() {
    if (!this.ambientGain || !this.ctx) return;
    this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 1);
    setTimeout(() => {
      try {
        if (this.droneOsc1) this.droneOsc1.stop();
        if (this.droneOsc2) this.droneOsc2.stop();
        if (this.subOsc) this.subOsc.stop();
      } catch (e) {}
      this.droneOsc1 = null;
      this.droneOsc2 = null;
      this.subOsc = null;
    }, 1100);
  }

  // Chime sound when interacting with crystal / 3D bottle
  playCrystalChime(pitchMultiplier = 1.0) {
    if (this.isMuted) return;
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(880 * pitchMultiplier, now);
    osc.frequency.exponentialRampToValueAtTime(1760 * pitchMultiplier, now + 0.15);

    gain.gain.setValueAtTime(0.03, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 1.3);
  }

  // Realistic perfume spray mist sound (white noise burst + soft whoosh + glass click)
  playSpraySound() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;

    // 1. Sprayer nozzle mechanical micro-click
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(420, now);
    clickGain.gain.setValueAtTime(0.05, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);

    // 2. High pressure fine aerosol mist hiss
    const bufferSize = this.ctx.sampleRate * 0.9;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3200, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.8);
    filter.Q.value = 1.8;

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.001, now);
    noiseGain.gain.linearRampToValueAtTime(0.12, now + 0.08);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

    whiteNoise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(now);
    whiteNoise.stop(now + 0.9);
  }

  // Elegant golden confirmation chime
  playGoldChime() {
    this.init();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, index) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + index * 0.08);

      gain.gain.setValueAtTime(0.0001, now + index * 0.08);
      gain.gain.linearRampToValueAtTime(0.035, now + index * 0.08 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.08 + 1.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + index * 0.08);
      osc.stop(now + index * 0.08 + 1.6);
    });
  }
}

export const luxuryAudio = new LuxuryAudio();

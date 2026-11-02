/**
 * High-performance Web Audio API Sound Generator with Audio Packs
 * Procedurally generates tactile, responsive card sound effects without external audio assets.
 */

import { AudioPackId } from '../types/solitaire';
import { haptics } from './haptics';

export interface AudioPackMetadata {
  id: AudioPackId;
  name: string;
  tagline: string;
  description: string;
  badge: string;
  keyCharacteristics: string[];
}

export const AUDIO_PACKS: AudioPackMetadata[] = [
  {
    id: 'modern',
    name: 'Modern Crisp',
    tagline: 'Dynamic & Snappy',
    description: 'Crisp cardboard snaps, responsive friction flicks, and vibrant brassy chimes.',
    badge: 'Default',
    keyCharacteristics: ['Crisp Snap', 'Textured Felt', 'Bright Chimes'],
  },
  {
    id: 'vintage',
    name: 'Vintage Mechanical',
    tagline: 'Warm Wooden & Parlor',
    description: 'Satisfying wooden knocks, mechanical clockwork clicks, and antique music box bells.',
    badge: 'Tactile',
    keyCharacteristics: ['Wooden Thuds', 'Spring Clicks', 'Music Box Bells'],
  },
  {
    id: 'minimalist',
    name: 'Minimalist Zen',
    tagline: 'Gentle & Low Fatigue',
    description: 'Ultra-soft micro pops, whispering air slides, and pure crystalline glass droplets.',
    badge: 'Subtle',
    keyCharacteristics: ['Whisper Slides', 'Micro Pops', 'Glass Droplets'],
  },
];

class SoundEffects {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;
  private currentPack: AudioPackId = 'modern';
  private masterGain: GainNode | null = null;
  private volume: number = 0.8;

  constructor() {
    // Lazily initialized on user interaction
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      try {
        this.masterGain.gain.setValueAtTime(this.volume, this.ctx.currentTime);
      } catch {}
    }
  }

  public getVolume(): number {
    return this.volume;
  }

  public setAudioPack(pack: AudioPackId) {
    this.currentPack = pack;
  }

  public getAudioPack(): AudioPackId {
    return this.currentPack;
  }

  private getDestination(ctx: AudioContext): AudioNode {
    if (!this.masterGain || this.masterGain.context !== ctx) {
      this.masterGain = ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.volume, ctx.currentTime);
      this.masterGain.connect(ctx.destination);
    }
    return this.masterGain;
  }

  private getContext(): AudioContext | null {
    if (!this.isEnabled) return null;
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Preview an audio pack with a rapid representative sequence
   */
  public playPreview(pack: AudioPackId) {
    const prevPack = this.currentPack;
    this.currentPack = pack;

    const ctx = this.getContext();
    if (!ctx) {
      this.currentPack = prevPack;
      return;
    }

    try {
      this.playCardFlip();
      setTimeout(() => {
        this.playCardPlace();
      }, 90);
      setTimeout(() => {
        this.playSuccess();
        this.currentPack = prevPack;
      }, 210);
    } catch {
      this.currentPack = prevPack;
    }
  }

  // Realistic card snap / place sound
  public playCardPlace() {
    haptics.cardPlace();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentPack === 'vintage') {
        // Deep wooden knock / solid mahogany table thud
        const osc = ctx.createOscillator();
        const subOsc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, now);
        filter.Q.setValueAtTime(2.0, now);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(95, now);
        osc.frequency.exponentialRampToValueAtTime(32, now + 0.08);

        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(60, now);
        subOsc.frequency.exponentialRampToValueAtTime(28, now + 0.09);

        gain.gain.setValueAtTime(0.45, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(filter);
        subOsc.connect(filter);
        filter.connect(gain);
        gain.connect(this.getDestination(ctx));

        osc.start(now);
        subOsc.start(now);
        osc.stop(now + 0.1);
        subOsc.stop(now + 0.1);

        // Tactile wood friction tap
        this.playFrictionBurst(ctx, now, 0.05, 0.22, 600, 'bandpass');
      } else if (this.currentPack === 'minimalist') {
        // Soft rounded micro-pop, zero harshness
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(240, now);
        osc.frequency.exponentialRampToValueAtTime(120, now + 0.035);

        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.038);

        osc.connect(gain);
        gain.connect(this.getDestination(ctx));

        osc.start(now);
        osc.stop(now + 0.045);
      } else {
        // Modern Crisp (default)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const filter = ctx.createBiquadFilter();

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.06);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.getDestination(ctx));

        osc.start(now);
        osc.stop(now + 0.08);

        this.playFrictionBurst(ctx, now, 0.04, 0.15, 1200, 'bandpass');
      }
    } catch {}
  }

  // Crisp card flip / deal sound
  public playCardFlip() {
    haptics.cardFlip();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentPack === 'vintage') {
        // Mechanical clockwork / tactile spring click
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.025);

        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

        osc.connect(gain);
        gain.connect(this.getDestination(ctx));

        osc.start(now);
        osc.stop(now + 0.04);

        // Heavy paper slap
        this.playFrictionBurst(ctx, now, 0.06, 0.25, 900, 'lowpass');
      } else if (this.currentPack === 'minimalist') {
        // Delicate airy whisper flick
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(480, now);
        osc.frequency.linearRampToValueAtTime(720, now + 0.03);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

        osc.connect(gain);
        gain.connect(this.getDestination(ctx));

        osc.start(now);
        osc.stop(now + 0.045);

        this.playFrictionBurst(ctx, now, 0.03, 0.05, 3000, 'highpass');
      } else {
        // Modern Crisp (default)
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(640, now + 0.05);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

        osc.connect(gain);
        gain.connect(this.getDestination(ctx));

        osc.start(now);
        osc.stop(now + 0.07);

        this.playFrictionBurst(ctx, now, 0.05, 0.2, 1400, 'bandpass');
      }
    } catch {}
  }

  // Card slide on felt table
  public playCardSlide() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentPack === 'vintage') {
        // Heavy wool felt friction
        this.playFrictionBurst(ctx, now, 0.12, 0.24, 750, 'lowpass');
      } else if (this.currentPack === 'minimalist') {
        // Whisper-quiet silk slide
        this.playFrictionBurst(ctx, now, 0.06, 0.06, 2200, 'bandpass');
      } else {
        // Modern crisp slide
        this.playFrictionBurst(ctx, now, 0.1, 0.18, 1200, 'bandpass');
      }
    } catch {}
  }

  // Success chime for sending card to foundation
  public playSuccess() {
    haptics.success();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentPack === 'vintage') {
        // Antique music box / warm chime with acoustic resonance
        const notes = [440, 554.37, 659.25]; // A4, C#5, E5 (Major warm triad)
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const overtone = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.05);

          overtone.type = 'triangle';
          overtone.frequency.setValueAtTime(freq * 2.01, now + idx * 0.05);

          gain.gain.setValueAtTime(0.18, now + idx * 0.05);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.45);

          osc.connect(gain);
          overtone.connect(gain);
          gain.connect(this.getDestination(ctx));

          osc.start(now + idx * 0.05);
          overtone.start(now + idx * 0.05);
          osc.stop(now + idx * 0.05 + 0.48);
          overtone.stop(now + idx * 0.05 + 0.48);
        });
      } else if (this.currentPack === 'minimalist') {
        // Pure crystalline glass droplets (very soft, bell-like)
        const notes = [659.25, 880.0]; // E5, A5 pure glass interval
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.06);

          gain.gain.setValueAtTime(0.12, now + idx * 0.06);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.28);

          osc.connect(gain);
          gain.connect(this.getDestination(ctx));

          osc.start(now + idx * 0.06);
          osc.stop(now + idx * 0.06 + 0.32);
        });
      } else {
        // Modern Crisp (C5, E5, G5 arpeggio)
        const freqs = [523.25, 659.25, 783.99];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.04);

          gain.gain.setValueAtTime(0.2, now + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.25);

          osc.connect(gain);
          gain.connect(this.getDestination(ctx));

          osc.start(now + idx * 0.04);
          osc.stop(now + idx * 0.04 + 0.3);
        });
      }
    } catch {}
  }

  // Invalid move / bump sound
  public playInvalid() {
    haptics.invalid();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentPack === 'vintage') {
        // Muffled wooden tap / dull knock
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(110, now);
        osc.frequency.exponentialRampToValueAtTime(55, now + 0.08);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

        osc.connect(gain);
        gain.connect(this.getDestination(ctx));
        osc.start(now);
        osc.stop(now + 0.1);
      } else if (this.currentPack === 'minimalist') {
        // Ultra-soft micro blip, never obnoxious
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(160, now);
        osc.frequency.linearRampToValueAtTime(120, now + 0.06);

        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

        osc.connect(gain);
        gain.connect(this.getDestination(ctx));
        osc.start(now);
        osc.stop(now + 0.08);
      } else {
        // Modern Crisp sawtooth buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, now);
        osc.frequency.linearRampToValueAtTime(75, now + 0.1);

        gain.gain.setValueAtTime(0.15, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

        osc.connect(gain);
        gain.connect(this.getDestination(ctx));

        osc.start(now);
        osc.stop(now + 0.14);
      }
    } catch {}
  }

  // Victory fanfare celebration
  public playWinFanfare() {
    haptics.victory();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentPack === 'vintage') {
        // Grand parlor acoustic bell carillon
        const notes = [
          { f: 392.00, t: 0.00 }, // G4
          { f: 523.25, t: 0.14 }, // C5
          { f: 659.25, t: 0.28 }, // E5
          { f: 783.99, t: 0.44 }, // G5
          { f: 1046.5, t: 0.62 }, // C6
        ];

        notes.forEach(({ f, t }) => {
          const osc = ctx.createOscillator();
          const bell = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + t);

          bell.type = 'triangle';
          bell.frequency.setValueAtTime(f * 2.76, now + t); // Characteristic bell partial

          gain.gain.setValueAtTime(0.24, now + t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.7);

          osc.connect(gain);
          bell.connect(gain);
          gain.connect(this.getDestination(ctx));

          osc.start(now + t);
          bell.start(now + t);
          osc.stop(now + t + 0.75);
          bell.stop(now + t + 0.75);
        });
      } else if (this.currentPack === 'minimalist') {
        // Celestial ambient pad chord wash
        const chords = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C Major 9 lush pad
        chords.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);

          gain.gain.setValueAtTime(0.01, now);
          gain.gain.linearRampToValueAtTime(0.08, now + 0.12 + idx * 0.04);
          gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

          osc.connect(gain);
          gain.connect(this.getDestination(ctx));

          osc.start(now);
          osc.stop(now + 1.25);
        });
      } else {
        // Modern Crisp triumphant arpeggio
        const notes = [
          { f: 523.25, t: 0.00 }, // C5
          { f: 659.25, t: 0.12 }, // E5
          { f: 783.99, t: 0.24 }, // G5
          { f: 1046.5, t: 0.38 }, // C6
          { f: 1318.5, t: 0.52 }, // E6
          { f: 1567.98, t: 0.66 }, // G6
        ];

        notes.forEach(({ f, t }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + t);

          gain.gain.setValueAtTime(0.25, now + t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.4);

          osc.connect(gain);
          gain.connect(this.getDestination(ctx));

          osc.start(now + t);
          osc.stop(now + t + 0.45);
        });
      }
    } catch {}
  }

  // Realistic deck riffle shuffle sound
  public playShuffle() {
    haptics.shuffle();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const count = this.currentPack === 'minimalist' ? 8 : 14;

      for (let i = 0; i < count; i++) {
        const t = now + i * 0.024 + Math.random() * 0.008;
        if (this.currentPack === 'vintage') {
          this.playFrictionBurst(ctx, t, 0.035, 0.15 + Math.random() * 0.09, 800, 'lowpass');
        } else if (this.currentPack === 'minimalist') {
          this.playFrictionBurst(ctx, t, 0.02, 0.04 + Math.random() * 0.03, 2200, 'bandpass');
        } else {
          this.playFrictionBurst(ctx, t, 0.03, 0.1 + Math.random() * 0.08, 1300, 'bandpass');
        }
      }
    } catch {}
  }

  // Sparkling achievement unlock fanfare
  public playAchievementUnlock() {
    haptics.success();
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      if (this.currentPack === 'vintage') {
        // Antique clock chime roll
        const notes = [
          { f: 587.33, t: 0.00 },
          { f: 739.99, t: 0.10 },
          { f: 880.00, t: 0.20 },
          { f: 1174.66, t: 0.32 },
        ];

        notes.forEach(({ f, t }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(f, now + t);

          gain.gain.setValueAtTime(0.24, now + t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.5);

          osc.connect(gain);
          gain.connect(this.getDestination(ctx));
          osc.start(now + t);
          osc.stop(now + t + 0.55);
        });
      } else if (this.currentPack === 'minimalist') {
        // Glass bell cascade
        const notes = [880, 1174.66, 1760.0];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);

          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);

          osc.connect(gain);
          gain.connect(this.getDestination(ctx));
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.4);
        });
      } else {
        // Modern Crisp sparkling ascending shimmer
        const notes = [
          { f: 587.33, t: 0.00 }, // D5
          { f: 739.99, t: 0.08 }, // F#5
          { f: 880.00, t: 0.16 }, // A5
          { f: 1174.66, t: 0.26 }, // D6
          { f: 1479.98, t: 0.36 }, // F#6
          { f: 1760.00, t: 0.48 }, // A6
        ];

        notes.forEach(({ f, t }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now + t);

          gain.gain.setValueAtTime(0.22, now + t);
          gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.35);

          osc.connect(gain);
          gain.connect(this.getDestination(ctx));

          osc.start(now + t);
          osc.stop(now + t + 0.4);
        });
      }
    } catch {}
  }

  private playFrictionBurst(
    ctx: AudioContext,
    time: number,
    duration: number,
    volume: number,
    filterFreq: number = 1200,
    filterType: BiquadFilterType = 'bandpass'
  ) {
    try {
      const bufferSize = Math.max(1, Math.floor(ctx.sampleRate * duration));
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = filterType;
      filter.frequency.setValueAtTime(filterFreq, time);
      filter.Q.setValueAtTime(1.5, time);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(volume, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.getDestination(ctx));

      noise.start(time);
      noise.stop(time + duration);
    } catch {}
  }
}

export const sound = new SoundEffects();

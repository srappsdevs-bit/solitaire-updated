/**
 * Tactile Haptic Feedback Utility for Solitaire Deluxe
 * Provides device vibration effects with adjustable intensity levels (Low, Medium, High).
 */

import { HapticIntensity } from '../types/solitaire';

export type HapticType =
  | 'tap'
  | 'cardPlace'
  | 'cardFlip'
  | 'success'
  | 'invalid'
  | 'victory'
  | 'shuffle';

const HAPTIC_PATTERNS: Record<HapticIntensity, Record<HapticType, number | number[]>> = {
  low: {
    tap: 10,
    cardPlace: 14,
    cardFlip: 12,
    success: [15, 35, 20],
    invalid: [20, 40, 20],
    victory: [25, 40, 25, 40, 40],
    shuffle: [10, 25, 10, 25, 12],
  },
  medium: {
    tap: 22,
    cardPlace: 32,
    cardFlip: 25,
    success: [30, 50, 45],
    invalid: [40, 50, 40],
    victory: [50, 60, 50, 60, 100],
    shuffle: [20, 30, 20, 30, 25],
  },
  high: {
    tap: 45,
    cardPlace: 65,
    cardFlip: 50,
    success: [60, 50, 85],
    invalid: [70, 60, 70],
    victory: [90, 70, 90, 70, 180],
    shuffle: [35, 35, 35, 35, 45],
  },
};

const PREVIEW_PATTERNS: Record<HapticIntensity, number | number[]> = {
  low: [14, 40, 18],
  medium: [28, 50, 38],
  high: [60, 50, 80],
};

class HapticsManager {
  private isEnabled: boolean = true;
  private currentIntensity: HapticIntensity = 'medium';

  public configure(enabled: boolean, intensity: HapticIntensity = 'medium') {
    this.isEnabled = enabled;
    this.currentIntensity = intensity || 'medium';
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public setIntensity(intensity: HapticIntensity) {
    this.currentIntensity = intensity;
  }

  public getIntensity(): HapticIntensity {
    return this.currentIntensity;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function';
  }

  private vibrate(pattern: number | number[]) {
    if (!this.isEnabled) return;
    if (typeof navigator === 'undefined' || typeof navigator.vibrate !== 'function') return;

    try {
      navigator.vibrate(pattern);
    } catch {
      // Safe fallback if user gesture / device restriction rejects vibration
    }
  }

  public trigger(type: HapticType = 'tap') {
    const intensity = this.currentIntensity || 'medium';
    const pattern = HAPTIC_PATTERNS[intensity]?.[type] ?? HAPTIC_PATTERNS.medium[type];
    this.vibrate(pattern);
  }

  public preview(intensity: HapticIntensity) {
    const pattern = PREVIEW_PATTERNS[intensity] || PREVIEW_PATTERNS.medium;
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      try {
        navigator.vibrate(pattern);
      } catch {}
    }
  }

  // Convenient semantic triggers
  public tap() {
    this.trigger('tap');
  }

  public cardPlace() {
    this.trigger('cardPlace');
  }

  public cardFlip() {
    this.trigger('cardFlip');
  }

  public success() {
    this.trigger('success');
  }

  public invalid() {
    this.trigger('invalid');
  }

  public victory() {
    this.trigger('victory');
  }

  public shuffle() {
    this.trigger('shuffle');
  }
}

export const haptics = new HapticsManager();

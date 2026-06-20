/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SoundAlert } from '../types';

let audioContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume();
  }
  return audioContext;
}

// Preset synthesizers
export function playSound(type: SoundAlert, volume: number = 0.5) {
  if (type === SoundAlert.Silence) return;

  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Master gain node
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(volume * 0.4, now); // scale to comfortable volume
    masterGain.connect(ctx.destination);

    switch (type) {
      case SoundAlert.GentleChime: {
        // High quality digital bell chime (additive synthesis)
        const frequencies = [523.25, 783.99, 1046.50, 1318.51]; // C5, G5, C6, E6
        const gains = [0.5, 0.3, 0.2, 0.1];

        frequencies.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          
          // Fast attack, slow decay bell envelope
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(gains[idx], now + 0.02);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 1.8 + idx * 0.2);
          
          osc.connect(gainNode);
          gainNode.connect(masterGain);
          
          osc.start(now);
          osc.stop(now + 2.5);
        });
        break;
      }
      
      case SoundAlert.WarmHarmonium: {
        // Warm rich multi-oscillator chord (C major: C3, G3, C4, E4)
        const notes = [130.81, 196.00, 261.63, 329.63];
        const types: OscillatorType[] = ['triangle', 'sine', 'triangle', 'sine'];

        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const filter = ctx.createBiquadFilter();
          const gain = ctx.createGain();

          osc.type = types[idx];
          osc.frequency.setValueAtTime(freq, now);

          // Low pass filter to make it warm
          filter.type = 'lowpass';
          filter.frequency.setValueAtTime(600, now);
          filter.Q.setValueAtTime(1, now);

          // Slow swell, warm hold, slow fade
          gain.gain.setValueAtTime(0, now);
          gain.gain.linearRampToValueAtTime(0.3, now + 0.4);
          gain.gain.setValueAtTime(0.3, now + 1.2);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

          osc.connect(filter);
          filter.connect(gain);
          gain.connect(masterGain);

          osc.start(now);
          osc.stop(now + 2.8);
        });
        break;
      }

      case SoundAlert.VibratingBuzzer: {
        // Classical dual-frequency alert beep
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gain = ctx.createGain();

        osc1.type = 'sawtooth';
        osc2.type = 'sine';

        osc1.frequency.setValueAtTime(800, now);
        osc2.frequency.setValueAtTime(804, now); // creates beating vibration

        // Low-pass filter to avoid harshness
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1200, now);

        // Three quick modern notification pulses
        const playBeep = (startOffset: number) => {
          gain.gain.setValueAtTime(0, now + startOffset);
          gain.gain.linearRampToValueAtTime(0.4, now + startOffset + 0.02);
          gain.gain.setValueAtTime(0.4, now + startOffset + 0.15);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + 0.22);
        };

        playBeep(0.0);
        playBeep(0.28);
        playBeep(0.56);

        osc1.connect(filter);
        osc2.connect(filter);
        filter.connect(gain);
        gain.connect(masterGain);

        osc1.start(now);
        osc2.start(now);
        osc1.stop(now + 1.0);
        osc2.stop(now + 1.0);
        break;
      }

      case SoundAlert.SoftDistantAdhan: {
        // A gorgeous synthesized ambient sound mimicking a distant melodious prayer call.
        // It uses soft FM oscillators playing a traditional modal melody (Hijaz scale vibe / Phrygian) with reverb emulation.
        const scale = [293.66, 311.13, 369.99, 392.00, 440.00, 466.16, 523.25]; // D Phrygian dominant (Fajr/traditional vibe)
        
        // Melody sequence of delays and notes
        const melody = [
          { note: 0, duration: 0.8, delay: 0.0 },  // D4
          { note: 1, duration: 0.6, delay: 0.8 },  // Eb4
          { note: 2, duration: 1.2, delay: 1.4 },  // F#4 (melodious hold)
          { note: 1, duration: 0.5, delay: 2.6 },  // Eb4
          { note: 0, duration: 1.0, delay: 3.1 },  // D4
          { note: 3, duration: 0.7, delay: 4.1 },  // G4
          { note: 2, duration: 1.4, delay: 4.8 },  // F#4 (second spiritual swell)
          { note: 1, duration: 0.8, delay: 6.2 },  // Eb4
          { note: 0, duration: 1.5, delay: 7.0 },  // D4 resolved
        ];

        melody.forEach((p) => {
          const osc1 = ctx.createOscillator();
          const osc2 = ctx.createOscillator(); // detune for choir/reverb feel
          const gainNode = ctx.createGain();
          const filterNode = ctx.createBiquadFilter();

          const freq = scale[p.note];
          osc1.frequency.setValueAtTime(freq, now + p.delay);
          osc2.frequency.setValueAtTime(freq * 1.008, now + p.delay); // lush chorusing

          osc1.type = 'triangle';
          osc2.type = 'sine';

          // Warm vowel-like filter
          filterNode.type = 'lowpass';
          filterNode.frequency.setValueAtTime(750, now + p.delay);

          // Swelling vocal-type envelope
          gainNode.gain.setValueAtTime(0, now + p.delay);
          gainNode.gain.linearRampToValueAtTime(0.25, now + p.delay + 0.15); // soft swelling attack
          gainNode.gain.setValueAtTime(0.25, now + p.delay + p.duration - 0.2);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + p.delay + p.duration);

          osc1.connect(filterNode);
          osc2.connect(filterNode);
          filterNode.connect(gainNode);
          gainNode.connect(masterGain);

          osc1.start(now + p.delay);
          osc2.start(now + p.delay);
          
          osc1.stop(now + p.delay + p.duration + 0.1);
          osc2.stop(now + p.delay + p.duration + 0.1);
        });

        // Background spiritual humming pad under the melody
        const padNotes = [146.83, 220.00]; // D3, A3 perfect fifth drone
        padNotes.forEach((f) => {
          const osc = ctx.createOscillator();
          const gainNode = ctx.createGain();
          
          osc.type = 'sine';
          osc.frequency.setValueAtTime(f, now);
          
          gainNode.gain.setValueAtTime(0, now);
          gainNode.gain.linearRampToValueAtTime(0.06, now + 1.0);
          gainNode.gain.setValueAtTime(0.06, now + 7.5);
          gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 9.0);
          
          osc.connect(gainNode);
          gainNode.connect(masterGain);
          
          osc.start(now);
          osc.stop(now + 9.5);
        });
        break;
      }
    }
  } catch (err) {
    console.error('Synthesizer failed to play sound:', err);
  }
}

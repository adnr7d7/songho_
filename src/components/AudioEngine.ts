/**
 * Masterpiece Web Audio API synthesizer for premium tribal sound effects
 * Synthesizes organic wooden taps, African bells, and reward fanfares.
 */

class SongoAudioEngine {
  private ctx: AudioContext | null = null;
  private soundVolume: number = 0.5; // default 50%
  private musicVolume: number = 0.3; // default 30%
  private ambientOscillator: OscillatorNode | null = null;
  private ambientGain: GainNode | null = null;

  init() {
    if (this.ctx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.ctx = new AudioContextClass();
      }
    } catch (e) {
      console.error('Failed to init Web Audio context', e);
    }
  }

  setSoundVolume(v: number) {
    this.soundVolume = v;
  }

  setMusicVolume(v: number) {
    this.musicVolume = v;
    if (this.ambientGain) {
      this.ambientGain.gain.setValueAtTime(v * 0.1, this.ctx?.currentTime || 0);
    }
  }

  private playWoodBeat(frequency: number, duration: number, pitchOffset: number = 0) {
    this.init();
    if (!this.ctx || this.soundVolume === 0) return;
    
    // Resume to avoid audio context lock-out
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    
    // Create oscillator and noise filter to simulate hollow wood block
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency + pitchOffset, now);
    // pitch bend for organic wood tap sound
    osc.frequency.exponentialRampToValueAtTime(frequency * 0.6 + pitchOffset, now + duration);

    // Filter to sweeten
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1000, now);

    gain.gain.setValueAtTime(this.soundVolume, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + duration);
  }

  /**
   * Sound played when seeds are scooped up
   */
  playScoop() {
    this.playWoodBeat(150, 0.15, 20);
    setTimeout(() => this.playWoodBeat(220, 0.15, 40), 50);
  }

  /**
   * Sound played for every index sowed (wood click!)
   */
  playSow(stepIndex: number) {
    // scale frequency up slightly at each step to indicate progression
    const baseFreq = 180 + (stepIndex % 14) * 15;
    this.playWoodBeat(baseFreq, 0.1);
  }

  /**
   * Sound played when seeds are captured successfully (tribal chime)
   */
  playCapture() {
    this.init();
    if (!this.ctx || this.soundVolume === 0) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C major arpeggio
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(this.soundVolume * 0.4, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.3);
    });
  }

  /**
   * Sound played on victory
   */
  playVictory() {
    this.init();
    if (!this.ctx || this.soundVolume === 0) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // Bright high notes
    
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(this.soundVolume * 0.5, now + idx * 0.12);
      gain.gain.linearRampToValueAtTime(0, now + idx * 0.12 + 0.6);
      osc.connect(gain);
      gain.connect(this.ctx!.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.6);
    });
  }

  /**
   * Sound played when clicking buttons
   */
  playClick() {
    this.playWoodBeat(400, 0.08);
  }

  /**
   * Starts a low-pass, meditative ambient drone using synthesized low chords
   */
  startAmbientMusic() {
    this.init();
    if (!this.ctx || this.musicVolume === 0 || this.ambientOscillator) return;
    
    try {
      const now = this.ctx.currentTime;
      this.ambientOscillator = this.ctx.createOscillator();
      this.ambientGain = this.ctx.createGain();

      this.ambientOscillator.type = 'sine';
      // Low F chord resonance
      this.ambientOscillator.frequency.setValueAtTime(87.31, now); // F2 note
      
      this.ambientGain.gain.setValueAtTime(0, now);
      this.ambientGain.gain.linearRampToValueAtTime(this.musicVolume * 0.15, now + 2); // gradual fade in

      this.ambientOscillator.connect(this.ambientGain);
      this.ambientGain.connect(this.ctx.destination);
      
      this.ambientOscillator.start();
    } catch (e) {
      console.error('Ambient music failed to start', e);
    }
  }

  stopAmbientMusic() {
    if (this.ambientOscillator) {
      try {
        this.ambientOscillator.stop();
        this.ambientOscillator.disconnect();
      } catch (e) {}
      this.ambientOscillator = null;
    }
  }
}

export const soundEngine = new SongoAudioEngine();

/**
 * PC Speaker Sound Synthesizer (MS-DOS 8253 PIT sound emulation)
 * Uses Web Audio API to create authentic square-wave retro beeps and clicks.
 */

class PcSpeaker {
  private ctx: AudioContext | null = null;
  public enabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  // Play a square wave tone for a specified duration in seconds
  public beep(frequency: number, duration: number = 0.04, volume: number = 0.05) {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square'; // Authentic PC Speaker 1-bit sound
      osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);

      gain.gain.setValueAtTime(volume, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Ignore audio autoplay restrictions
    }
  }

  // Key / button click sound (low pitch tap)
  public click() {
    this.beep(880, 0.015, 0.03);
  }

  // Palette color select sound
  public select() {
    this.beep(1200, 0.025, 0.04);
  }

  // Action / apply ramp sound (arpeggio chirp)
  public chirp() {
    if (!this.enabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;
      const notes = [659, 880, 1174]; // E5, A5, D6
      notes.forEach((freq, idx) => {
        setTimeout(() => {
          this.beep(freq, 0.035, 0.04);
        }, idx * 35);
      });
    } catch {}
  }

  // Reset / clear error buzz
  public buzz() {
    this.beep(180, 0.08, 0.05);
  }
}

export const sound = new PcSpeaker();

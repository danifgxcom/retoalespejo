type Cue = 'touch' | 'move' | 'turn' | 'reflect' | 'success' | 'error' | 'transition';
const KEY = 'reflejo-sound';
/** Paired tones: a dry wooden attack and its quieter glass reflection. */
export class SoundService {
  private context?: AudioContext;
  private master?: GainNode;
  private ambient?: { oscillator: OscillatorNode; gain: GainNode };
  private voices = new Set<OscillatorNode>();
  enabled = false;
  constructor() {
    try { this.enabled = localStorage.getItem(KEY) === 'on'; } catch { /* Optional storage. */ }
  }
  async unlock() {
    if (!this.enabled || typeof AudioContext === 'undefined') return;
    try {
      if (!this.context) {
        this.context = new AudioContext();
        this.master = this.context.createGain();
        this.master.gain.value = 0.16;
        this.master.connect(this.context.destination);
      }
      if (this.context.state === 'suspended') await this.context.resume();
    } catch { /* Audio is optional. */ }
  }
  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try { localStorage.setItem(KEY, enabled ? 'on' : 'off'); } catch { /* Optional. */ }
    if (!enabled) { this.setAmbient(false); this.suspend(); }
    else void this.unlock().then(() => this.play('reflect'));
  }
  play(cue: Cue) {
    const ctx = this.context;
    if (!this.enabled || !ctx || ctx.state !== 'running' || !this.master || document.hidden) return;
    const notes: Record<Cue, number[]> = { touch: [440], move: [330, 660], turn: [392, 523], reflect: [440, 880], success: [330, 440, 660, 880], error: [311, 294], transition: [660, 440, 660] };
    notes[cue].forEach((frequency, i) => {
      const start = ctx.currentTime + i * 0.085;
      const oscillator = ctx.createOscillator();
      const gain = ctx.createGain();
      oscillator.type = i % 2 ? 'sine' : 'triangle';
      oscillator.frequency.setValueAtTime(frequency, start);
      oscillator.frequency.exponentialRampToValueAtTime(frequency * .995, start + .18);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(i ? .22 : .35, start + .006);
      gain.gain.exponentialRampToValueAtTime(.001, start + .22);
      oscillator.connect(gain); gain.connect(this.master!);
      oscillator.start(start); oscillator.stop(start + .25);
      this.voices.add(oscillator);
      oscillator.onended = () => { this.voices.delete(oscillator); oscillator.disconnect(); gain.disconnect(); };
    });
  }
  setAmbient(active: boolean) {
    if (this.ambient) {
      this.ambient.oscillator.stop(); this.ambient.oscillator.disconnect(); this.ambient.gain.disconnect();
      this.ambient = undefined;
    }
    if (!active || !this.enabled || !this.context || !this.master) return;
    const oscillator = this.context.createOscillator();
    const gain = this.context.createGain();
    oscillator.frequency.value = 110;
    gain.gain.setValueAtTime(0, this.context.currentTime);
    gain.gain.linearRampToValueAtTime(.055, this.context.currentTime + 2);
    oscillator.connect(gain); gain.connect(this.master); oscillator.start();
    this.ambient = { oscillator, gain };
  }
  suspend() {
    this.voices.forEach(voice => { voice.stop(); voice.disconnect(); });
    this.voices.clear();
    void this.context?.suspend();
  }
}
export const sound = new SoundService();

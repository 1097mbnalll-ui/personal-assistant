// All sound is synthesised with WebAudio (no audio files to license or download).
export class Audio {
  private ctx: AudioContext | null = null; private master!: GainNode; private hum: { g: GainNode } | null = null; private alarmTimer = 0;
  enabled = true; volume = .8;
  /** must be called from a user gesture (browser autoplay rules) */
  unlock() { if (this.ctx) { if (this.ctx.state === 'suspended') void this.ctx.resume(); return; }
    try { const C = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext; this.ctx = new C(); this.master = this.ctx.createGain(); this.master.gain.value = this.volume; this.master.connect(this.ctx.destination); this.ambience(); } catch { this.ctx = null; } }
  setVolume(v: number) { this.volume = v; if (this.ctx) this.master.gain.value = this.enabled ? v : 0; }
  private noise(dur: number) { const c = this.ctx!, b = c.createBuffer(1, Math.max(1, Math.floor(c.sampleRate * dur)), c.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; const s = c.createBufferSource(); s.buffer = b; return s; }
  private env(g: GainNode, t: number, a: number, peak: number, d: number) { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  private tone(f: number, dur: number, type: OscillatorType, vol: number, f2?: number, at = 0) { const c = this.ctx; if (!c || !this.enabled) return; const t = c.currentTime + at, o = c.createOscillator(), g = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur); this.env(g, t, .01, vol, dur); o.connect(g); g.connect(this.master); o.start(t); o.stop(t + dur + .1); }
  private burst(dur: number, vol: number, freq: number, q = .7, type: BiquadFilterType = 'lowpass', at = 0, f2?: number) { const c = this.ctx; if (!c || !this.enabled) return; const t = c.currentTime + at, s = this.noise(dur + .1), f = c.createBiquadFilter(), g = c.createGain();
    f.type = type; f.frequency.setValueAtTime(freq, t); if (f2) f.frequency.exponentialRampToValueAtTime(f2, t + dur); f.Q.value = q; this.env(g, t, .008, vol, dur); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + dur + .1); }
  /** constant low ventilation hum of the facility */
  private ambience() { const c = this.ctx!; const s = this.noise(4); s.loop = true; const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 170; const g = c.createGain(); g.gain.value = .11; s.connect(f); f.connect(g); g.connect(this.master); s.start();
    const o = c.createOscillator(); o.type = 'sine'; o.frequency.value = 58; const og = c.createGain(); og.gain.value = .018; o.connect(og); og.connect(this.master); o.start(); this.hum = { g }; }
  setAmbience(level: number) { if (this.hum && this.ctx) this.hum.g.gain.setTargetAtTime(.11 * level, this.ctx.currentTime, .4); }
  step(run: boolean) { this.burst(.07, run ? .2 : .12, 420 + Math.random() * 260, 1.2, 'bandpass'); this.tone(90, .05, 'sine', run ? .1 : .05, 55); }
  land() { this.burst(.12, .3, 300, 1); this.tone(80, .1, 'sine', .14, 45); }
  door() { this.burst(.55, .16, 900, .8, 'bandpass', 0, 350); this.tone(140, .5, 'sawtooth', .025, 90); this.burst(.06, .22, 1800, 2, 'bandpass', .5); }
  denied() { this.tone(180, .16, 'square', .06); this.tone(140, .22, 'square', .06, undefined, .16); }
  ui() { this.tone(880, .05, 'sine', .07); }
  confirm() { this.tone(660, .08, 'sine', .09); this.tone(990, .14, 'sine', .08, undefined, .08); }
  talk() { this.tone(300 + Math.random() * 120, .05, 'triangle', .035); }
  notify() { this.tone(740, .1, 'sine', .1); this.tone(1110, .2, 'sine', .08, undefined, .1); }
  upgrade() { [392, 523, 659, 784].forEach((f, i) => this.tone(f, .35, 'triangle', .09, undefined, i * .09)); }
  alarm(seconds: number) { const c = this.ctx; if (!c || !this.enabled) return; const n = Math.floor(seconds / .9); for (let i = 0; i < n; i++) { this.tone(520, .42, 'sawtooth', .07, 760, i * .9); this.tone(760, .42, 'sawtooth', .07, 520, i * .9 + .45); } this.alarmTimer = c.currentTime + seconds; }
  countdown(at: number) { this.tone(1000, .09, 'square', .06, undefined, at); }
  launch() { const c = this.ctx; if (!c || !this.enabled) return; const t = c.currentTime, s = this.noise(9), f = c.createBiquadFilter(), g = c.createGain(); f.type = 'lowpass'; f.frequency.setValueAtTime(220, t); f.frequency.linearRampToValueAtTime(1500, t + 1.2); f.frequency.exponentialRampToValueAtTime(260, t + 8.5);
    g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.95, t + .5); g.gain.setValueAtTime(.95, t + 3); g.gain.exponentialRampToValueAtTime(.001, t + 8.8); s.connect(f); f.connect(g); g.connect(this.master); s.start(t); s.stop(t + 9);
    this.tone(48, 7, 'sine', .3, 30); this.burst(.5, .7, 3000, .5, 'highpass'); }
  impact() { this.burst(1.6, .9, 600, .6, 'lowpass', 0, 90); this.tone(60, 1.3, 'sine', .4, 28); }
  intercept() { this.burst(.4, .5, 2600, .8, 'bandpass'); this.tone(1400, .3, 'square', .05, 500); }
}

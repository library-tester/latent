/* The whole soundtrack, synthesised on the fly. No audio files ship with the game. */

/* ══════════ sound — everything synthesised, no files ══════════ */
export const Snd = {
ctx:null, mg:null, on:true, nb:null, drone:null,
boot(){
  if(this.ctx) return;
  const AC = window.AudioContext || window.webkitAudioContext;
  if(!AC) return;
  try{ this.ctx = new AC(); }catch(e){ return; }
  this.mg = this.ctx.createGain();
  this.mg.gain.value = this.on ? 0.8 : 0;
  this.mg.connect(this.ctx.destination);
  const len = Math.floor(this.ctx.sampleRate * 1.5);
  this.nb = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
  const d = this.nb.getChannelData(0);
  for(let i=0;i<len;i++) d[i] = Math.random()*2-1;
},
resume(){ if(this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); },
mute(on){
  this.on = on;
  if(this.mg) this.mg.gain.setTargetAtTime(on ? 0.8 : 0, this.ctx.currentTime, 0.02);
  try{ if(window.storage) window.storage.set('latent:snd', on ? '1' : '0'); }catch(e){}
},
t(){ return this.ctx.currentTime; },
tone(f, dur, o){
  o = o || {};
  if(!this.ctx || !this.on) return;
  const osc = this.ctx.createOscillator(), g = this.ctx.createGain();
  const t0 = this.t() + (o.delay || 0);
  osc.type = o.type || 'sine';
  osc.frequency.setValueAtTime(f, t0);
  if(o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(o.gain || 0.12, t0 + (o.atk || 0.006));
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g); g.connect(this.mg);
  osc.start(t0); osc.stop(t0 + dur + 0.03);
},
noise(dur, o){
  o = o || {};
  if(!this.ctx || !this.on) return;
  const src = this.ctx.createBufferSource(); src.buffer = this.nb;
  const bp = this.ctx.createBiquadFilter();
  const g = this.ctx.createGain();
  const t0 = this.t() + (o.delay || 0);
  bp.type = o.type || 'bandpass';
  bp.frequency.setValueAtTime(o.f || 1200, t0);
  bp.Q.value = o.q || 1;
  if(o.to) bp.frequency.exponentialRampToValueAtTime(Math.max(60, o.to), t0 + dur);
  g.gain.setValueAtTime(o.gain || 0.1, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp); bp.connect(g); g.connect(this.mg);
  src.start(t0); src.stop(t0 + dur + 0.03);
},
startDrone(){
  if(!this.ctx || this.drone || !this.on) return;
  const g = this.ctx.createGain(); g.gain.value = 0.0001; g.connect(this.mg);
  const f = this.ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 200; f.Q.value = 3; f.connect(g);
  const o1 = this.ctx.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
  const o2 = this.ctx.createOscillator(); o2.type = 'sine'; o2.frequency.value = 82.5;
  o1.connect(f); o2.connect(f); o1.start(); o2.start();
  g.gain.setTargetAtTime(0.035, this.t(), 1.5);
  this.drone = { g, f, o1, o2 };
},
stopDrone(){
  const d = this.drone; if(!d) return;
  this.drone = null;
  try{ d.g.gain.setTargetAtTime(0.0001, this.t(), 0.25);
       d.o1.stop(this.t() + 1.2); d.o2.stop(this.t() + 1.2); }catch(e){}
},
glow(v){ if(this.drone) this.drone.f.frequency.setTargetAtTime(200 + v*70, this.t(), 0.4); },
play(k, v){
  if(!this.ctx || !this.on) return;
  v = v || 0;
  switch(k){
  case 'ui':    this.tone(620, .05, {type:'triangle', gain:.05}); break;
  case 'select':this.tone(880, .05, {type:'square', gain:.035}); break;
  case 'error': this.tone(150, .14, {type:'square', gain:.05, to:110}); break;
  case 'card':  this.noise(.15, {f:2800, q:.7, gain:.05, to:900}); break;
  case 'draw':  this.noise(.2, {f:1600, q:.5, gain:.045, to:600}); break;
  case 'shuffle': this.noise(.4, {f:900, q:.4, gain:.06, to:2800}); break;
  case 'exhaust': this.noise(.34, {f:3200, q:.6, gain:.05, to:380}); break;
  case 'hit':
    this.noise(.09, {f:380 + Math.min(340, v*9), q:.9, gain:.13, to:130});
    this.tone(160, .13, {type:'triangle', gain:.11, to:58});
    if(v >= 15) this.tone(70, .3, {type:'sine', gain:.13, to:40});
    break;
  case 'block': this.tone(300, .2, {type:'triangle', gain:.09, to:540});
                this.noise(.09, {f:2600, q:2.4, gain:.04}); break;
  case 'light': this.tone(430 + Math.min(v,14)*22, .34, {type:'sine', gain:.075, to:900 + v*24});
                this.tone(660 + Math.min(v,14)*30, .28, {type:'triangle', gain:.03, delay:.04}); break;
  case 'spend': this.tone(900, .3, {type:'sine', gain:.09, to:220});
                this.noise(.3, {f:2400, q:.6, gain:.07, to:400}); break;
  case 'flash': this.noise(.55, {f:500, q:.5, gain:.15, to:7000});
                this.tone(1300, .5, {type:'sine', gain:.09, to:180}); break;
  case 'hurt':  this.tone(120, .26, {type:'sawtooth', gain:.11, to:48});
                this.noise(.16, {f:320, q:.7, gain:.11, to:90}); break;
  case 'death': this.tone(280, .5, {type:'triangle', gain:.09, to:64});
                this.noise(.45, {f:1000, q:.5, gain:.07, to:130}); break;
  case 'enemy': this.tone(88, .32, {type:'sine', gain:.11, to:58}); break;
  case 'boss':  this.tone(60, 1.4, {type:'sawtooth', gain:.12, to:180});
                this.noise(1.2, {f:200, q:.5, gain:.08, to:2600}); break;
  case 'coin':  this.tone(1180, .07, {type:'square', gain:.045});
                this.tone(1560, .09, {type:'square', gain:.04, delay:.06}); break;
  case 'relic': [523,784,1046].forEach((f,i) => this.tone(f, .55 + i*.1, {type:'sine', gain:.075 - i*.02, delay:i*.06})); break;
  case 'pot':   this.tone(680, .2, {type:'sine', gain:.07, to:1500});
                this.noise(.14, {f:2200, q:1.2, gain:.04}); break;
  case 'win':   [523,659,880].forEach((f,i) => this.tone(f, .5, {type:'triangle', gain:.08, delay:i*.11})); break;
  case 'lose':  [330,262,196].forEach((f,i) => this.tone(f, .8, {type:'sawtooth', gain:.06, delay:i*.16})); break;
  }
}};
export const SPK = on => on
  ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg>'
  : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 10l4 4M21 10l-4 4"/></svg>';

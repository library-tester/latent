/* Floating numbers, banners, the shutter flash and the exposure glow. */

import { Snd } from '../core/audio.js';
import { C } from '../core/state.js';
import { clamp } from '../core/util.js';

/* ══════════════ fx ══════════════ */
export function fxAt(x, y, text, cls){
  const n = document.createElement('div');
  n.className = 'fxn ' + cls; n.textContent = text;
  n.style.left = x + 'px'; n.style.top = y + 'px';
  document.getElementById('fx').appendChild(n);
  setTimeout(() => n.remove(), 1000);
}
export function fxOn(el, text, cls){
  if(!el) return;
  const r = el.getBoundingClientRect();
  fxAt(r.left + r.width/2, r.top + r.height*0.35, text, cls);
}
export function fxSelf(text, cls){
  const s = document.getElementById('strip');
  if(!s) return;
  const r = s.getBoundingClientRect();
  fxAt(r.left + r.width*0.5, r.top - 6, text, cls);
}
export function banner(t){
  const n = document.createElement('div');
  n.className = 'banner'; n.textContent = t;
  document.getElementById('fx').appendChild(n);
  setTimeout(() => n.remove(), 1400);
}
export function flash(){
  Snd.play('flash');
  const f = document.getElementById('flash');
  f.classList.remove('go'); void f.offsetWidth; f.classList.add('go');
}
export function paintLight(){
  const v = C ? clamp(C.light/14, 0, 1) : 0;
  if(C) Snd.glow(C.light);
  document.documentElement.style.setProperty('--exposure', v);
  const bar = document.querySelector('#lightbar i');
  if(bar) bar.style.transform = 'scaleX(' + v + ')';
  const num = document.getElementById('lnum');
  if(num) num.textContent = C ? C.light : 0;
}

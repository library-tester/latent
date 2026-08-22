/* The floating description bubble for the relic strip.

   The strip only ever had a native `title`, which a phone never shows at all.
   A mouse gets the bubble on hover; a touch gets it by holding the relic past
   LONG_MS, which then swallows the click so the press does not also throw the
   full relic sheet open on top of the answer. */

import { RELICS } from '../data/relics.js';

const LONG_MS = 380;
let timer = null, swallow = false;

export function showTip(anchor, name, desc){
  const t = document.getElementById('tip');
  if(!t || !anchor) return;
  t.innerHTML = `<div class="tn">${name}</div><div class="td">${desc}</div>`;
  t.classList.add('on');
  /* measured after the text is in, and clamped so a relic at either end of the
     strip does not push its bubble off the screen */
  const r = anchor.getBoundingClientRect(), b = t.getBoundingClientRect();
  const w = window.innerWidth || 360;
  t.style.left = Math.min(Math.max(8, r.left + r.width/2 - b.width/2), Math.max(8, w - b.width - 8)) + 'px';
  t.style.top = (r.bottom + 8) + 'px';
}
export function hideTip(){
  const t = document.getElementById('tip');
  if(t) t.classList.remove('on');
  if(timer){ clearTimeout(timer); timer = null; }
}
export function bindTips(){
  const bar = document.getElementById('relicbar');
  if(!bar) return;
  /* paintBar() rewrites the strip's children constantly, so everything is
     delegated off the bar itself, which never gets replaced. */
  const relicAt = ev => {
    const el = ev.target.closest && ev.target.closest('#relicbar > span');
    return el && RELICS[el.dataset.i] ? el : null;
  };
  const pop = el => { const d = RELICS[el.dataset.i]; showTip(el, d.n, d.d); };

  bar.addEventListener('pointerover', ev => {
    if(ev.pointerType && ev.pointerType !== 'mouse') return;
    const el = relicAt(ev); if(el) pop(el);
  });
  bar.addEventListener('pointerout', ev => {
    if(ev.pointerType && ev.pointerType !== 'mouse') return;
    hideTip();
  });
  bar.addEventListener('pointerdown', ev => {
    if(ev.pointerType === 'mouse') return;
    const el = relicAt(ev); if(!el) return;
    swallow = false;
    if(timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; swallow = true; pop(el); }, LONG_MS);
  });
  ['pointerup','pointercancel','pointerleave'].forEach(k =>
    bar.addEventListener(k, ev => { if(ev.pointerType !== 'mouse') hideTip(); }));
  /* the hold already answered the question — don't open the sheet on release */
  bar.addEventListener('click', ev => {
    if(!swallow) return;
    swallow = false; ev.stopPropagation(); ev.preventDefault();
  }, true);
  bar.addEventListener('scroll', hideTip);
}

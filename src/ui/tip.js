/* The floating description bubble for the icon strips — relics in the top bar,
   ampoules beside the piles during a fight.

   The strips only ever had a native `title`, which a phone never shows at all,
   and an ampoule is worse than a relic for this: tapping one drinks it, so
   there was no way to check what it did without spending it. A mouse gets the
   bubble on hover; a touch gets it by holding past LONG_MS, which then
   swallows the click so the press cannot also use the thing it described.

   Everything is delegated off `document` rather than the strips themselves —
   #potbar is rebuilt by setScene() on every screen change, so there is no
   stable element to bind to. */

import { G } from '../core/state.js';
import { POTS } from '../data/potions.js';
import { RELICS } from '../data/relics.js';

const LONG_MS = 380;
let timer = null, swallow = false;

/* Each strip: how to spot one of its icons, and what that icon describes. */
const STRIPS = [
  { sel: '#relicbar > span[data-i]', of: el => RELICS[el.dataset.i] },
  { sel: '#potbar > span[data-a="pot"]', of: el => POTS[(G && G.pots) ? G.pots[+el.dataset.i] : null] },
];
function find(target){
  if(!target || !target.closest) return null;
  for(const s of STRIPS){
    const el = target.closest(s.sel);
    if(!el) continue;
    const d = s.of(el);
    if(d) return { el, d };
  }
  return null;
}

export function showTip(anchor, name, desc){
  const t = document.getElementById('tip');
  if(!t || !anchor) return;
  t.innerHTML = `<div class="tn">${name}</div><div class="td">${desc}</div>`;
  t.classList.add('on');
  /* measured after the text is in: clamped sideways so an icon at either end
     of a strip keeps its bubble on screen, and flipped above the anchor when
     there is no room below — which is always the case for the ampoule row. */
  const r = anchor.getBoundingClientRect(), b = t.getBoundingClientRect();
  const vw = window.innerWidth || 360, vh = window.innerHeight || 640;
  t.style.left = Math.min(Math.max(8, r.left + r.width/2 - b.width/2), Math.max(8, vw - b.width - 8)) + 'px';
  const below = r.bottom + 8;
  t.style.top = (below + b.height <= vh - 8 ? below : Math.max(8, r.top - b.height - 8)) + 'px';
}
export function hideTip(){
  const t = document.getElementById('tip');
  if(t) t.classList.remove('on');
  if(timer){ clearTimeout(timer); timer = null; }
}
export function bindTips(){
  const pop = hit => showTip(hit.el, hit.d.n, hit.d.d);

  document.addEventListener('pointerover', ev => {
    if(ev.pointerType && ev.pointerType !== 'mouse') return;
    const hit = find(ev.target); if(hit) pop(hit);
  });
  document.addEventListener('pointerout', ev => {
    if(ev.pointerType && ev.pointerType !== 'mouse') return;
    if(find(ev.target)) hideTip();
  });
  document.addEventListener('pointerdown', ev => {
    if(ev.pointerType === 'mouse') return;
    const hit = find(ev.target); if(!hit) return;
    swallow = false;
    if(timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; swallow = true; pop(hit); }, LONG_MS);
  });
  ['pointerup','pointercancel'].forEach(k =>
    document.addEventListener(k, ev => { if(ev.pointerType !== 'mouse') hideTip(); }));
  /* The hold already answered the question. Capture phase, so this lands before
     the game's own click handler drinks the ampoule or opens the relic sheet. */
  document.addEventListener('click', ev => {
    if(!swallow) return;
    swallow = false;
    if(!find(ev.target)) return;
    ev.stopPropagation(); ev.preventDefault();
  }, true);
  document.addEventListener('scroll', hideTip, true);
}

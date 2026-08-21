/* The persistent frame: top bar, scene swapping, modal sheets. */

import { SPK, Snd } from '../core/audio.js';
import { G } from '../core/state.js';
import { glyph } from '../data/glyphs.js';
import { RELICS } from '../data/relics.js';
import { fitText } from './card-view.js';

/* ══════════════ chrome ══════════════ */
export function paintBar(){
  document.getElementById('bar').classList.toggle('norun', !G);
  document.getElementById('sndbtn').innerHTML = SPK(Snd.on);
  document.getElementById('s-hp').textContent = (G ? G.hp + '/' + G.maxHp : '—');
  document.getElementById('s-gold').textContent = G ? G.gold : 0;
  document.getElementById('relicbar').innerHTML = G ? G.relics.map(r =>
    `<span data-a="relic" data-i="${r}" title="${RELICS[r].n}">${glyph(RELICS[r].g)}</span>`).join('') : '';
  document.getElementById('deckbtn').style.display = G ? '' : 'none';
}
export const setScene = h => { document.getElementById('scene').innerHTML = h; paintBar(); };
export function openSheet(h){
  const s = document.getElementById('sheet');
  s.innerHTML = h; document.getElementById('modal').classList.add('on');
  fitText(s);   // after .on, so the cards have real dimensions to measure
}
export function closeSheet(){ document.getElementById('modal').classList.remove('on'); }

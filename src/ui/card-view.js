/* Drawing a card face, and fitting its rules text to the card. */

import { CARDS, costOf } from '../data/cards.js';
import { glyph } from '../data/glyphs.js';

/* ══════════════ card faces ══════════════ */
export function cardHTML(c, cls, extra, live){
  const d = CARDS[c.id];
  const dots = d.r==='rare' ? '◆◆◆' : d.r==='uncommon' ? '◆◆' : d.r==='common' ? '◆' : '';
  const body = d.x(c);
  const plain = body.replace(/<[^>]+>/g, '');
  // first guess only — fitText() measures and corrects once it is in the document
  const sz = plain.length > 88 ? ' xs' : plain.length > 58 ? ' sm' : '';
  return `<div class="card type-${d.t} ${d.t==='curse'?'curse':''} ${c.lvl?'up':''} ${cls||''}" ${extra||''}>
    <span class="cost">${d.un?'—':d.xc?'X':costOf(c, live)}</span><span class="rar">${dots}</span>
    <div class="cart">${glyph(d.g)}</div>
    <div class="cname">${d.n}${c.lvl?'+':''}</div>
    <div class="ctext${sz}"><span>${body}</span></div></div>`;
}
/* Rules text is centred inside a flex box that can outgrow the card, and the card
   clips. Card width, name wrapping and viewport all move the goalposts, so pick
   the largest size that actually fits by measuring rather than counting letters. */
const TSZ = ['ctext', 'ctext sm', 'ctext xs'];
export function fitText(root){
  (root || document).querySelectorAll('.card .ctext').forEach(t => {
    const card = t.closest('.card'), s = t.firstElementChild;
    if(!card || !s) return;
    for(let i = 0; i < TSZ.length; i++){
      t.className = TSZ[i];
      if(i === TSZ.length - 1) break;
      if(s.getBoundingClientRect().bottom <= card.getBoundingClientRect().bottom - 1) break;
    }
  });
}

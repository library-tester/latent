/* Modal flows that operate on the deck: view, pick, remove, copy, refine. */

import { save } from '../core/persist.js';
import { C, G, PENDING, setPENDING } from '../core/state.js';
import { CARDS } from '../data/cards.js';
import { glyph } from '../data/glyphs.js';
import { POTS } from '../data/potions.js';
import { RELICS } from '../data/relics.js';
import { cardHTML } from './card-view.js';
import { openSheet } from './chrome.js';
import { toMap } from './map-view.js';

/* ══════════════ deck, choices, removal ══════════════ */
export function showDeck(){
  const d = [...G.deck].sort((a,b) => CARDS[a.id].t.localeCompare(CARDS[b.id].t) || CARDS[a.id].n.localeCompare(CARDS[b.id].n));
  openSheet(`<header><span class="title">Deck</span><span class="tag">${G.deck.length} cards</span></header>
    <div class="body"><div class="grid">${d.map(c => cardHTML(c)).join('')}</div></div>
    <footer><button class="btn" data-a="close">Close</button></footer>`);
}
export function showRelics(){
  openSheet(`<header><span class="title">Relics</span></header><div class="body">
    ${G.relics.map(r => `<div class="relic">${glyph(RELICS[r].g)}<div><div class="rn">${RELICS[r].n}</div>
      <div class="rd">${RELICS[r].d}</div></div></div>`).join('')}
    ${G.pots.length ? '<div class="tag" style="margin-top:14px">Ampoules</div>' + G.pots.map((p,i) =>
      `<div class="relic ${!POTS[p].combat || C ? 'pickable' : ''}" ${!POTS[p].combat || C ? `data-a="usepot" data-i="${i}"` : ''}>
        ${glyph(POTS[p].g)}<div><div class="rn">${POTS[p].n}</div><div class="rd">${POTS[p].d}</div>
        ${!POTS[p].combat || C ? '<div class="tag" style="margin-top:2px">tap to use</div>' : '<div class="tag" style="margin-top:2px">combat only</div>'}</div></div>`).join('') : ''}
    </div><footer><button class="btn" data-a="close">Close</button></footer>`);
}
export function grantChoice(cards, flavor, opts){
  if(typeof opts === 'number') opts = { all:true };
  opts = opts || {};
  if(opts.all){
    cards.forEach(c => G.deck.push(c));
    openSheet(`<header><span class="tag">Added to deck</span></header>
      <div class="body"><div class="flavor">${flavor||''}</div><div class="grid">${cards.map(c => cardHTML(c)).join('')}</div></div>
      <footer><button class="btn primary" data-a="close-map">Continue</button></footer>`);
    save(); return;
  }
  setPENDING({ cards, then: opts.then || toMap, skip: opts.skip !== false });
  openSheet(`<header><span class="title">Choose a card</span></header>
    <div class="body">${flavor ? `<div class="flavor">${flavor}</div>` : ''}
      <div class="grid">${cards.map((c,i) => cardHTML(c,'pickable',`data-a="pick" data-i="${i}"`)).join('')}</div></div>
    <footer>${PENDING.skip ? '<button class="btn ghost" data-a="skipcard">Take none</button>' : ''}</footer>`);
}
export function removeFlow(then){
  setPENDING({ then: then || toMap });
  openSheet(`<header><span class="title">Remove a card</span><span class="tag">tap to destroy</span></header>
    <div class="body"><div class="grid">${G.deck.map((c,i) => cardHTML(c,'pickable',`data-a="rem" data-i="${i}"`)).join('')}</div></div>
    <footer><button class="btn ghost" data-a="cancel">Cancel</button></footer>`);
}
export function duplicateFlow(then){
  setPENDING({ then: then || toMap });
  openSheet(`<header><span class="title">Duplicate a card</span><span class="tag">tap to copy</span></header>
    <div class="body"><div class="grid">${G.deck.map((c,i) => cardHTML(c,'pickable',`data-a="dup" data-i="${i}"`)).join('')}</div></div>
    <footer><button class="btn ghost" data-a="cancel">Cancel</button></footer>`);
}
export function upgradeFlow(then){
  const up = G.deck.map((c,i) => ({c,i})).filter(o => !o.c.lvl && CARDS[o.c.id].r !== 'curse');
  if(!up.length){ toMap(); return; }
  setPENDING({ then: then || toMap });
  openSheet(`<header><span class="title">Refine a card</span><span class="tag">tap to improve</span></header>
    <div class="body"><div class="grid">${up.map(o => cardHTML(o.c,'pickable',`data-a="up" data-i="${o.i}"`)).join('')}</div></div>
    <footer><button class="btn ghost" data-a="cancel">Cancel</button></footer>`);
}

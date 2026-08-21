/* Non-combat rooms: the darkroom, the sealed cabinet, events, the shop roll. */

import { save } from '../core/persist.js';
import { EV, G, setEV } from '../core/state.js';
import { ROMAN, pick, rr } from '../core/util.js';
import { CARDS } from '../data/cards.js';
import { EVENTS } from '../data/events.js';
import { glyph } from '../data/glyphs.js';
import { POTS } from '../data/potions.js';
import { RELICS, hasR } from '../data/relics.js';
import { nodeAt } from '../game/map.js';
import { offerCards, rollRelic } from '../game/run.js';
import { setScene } from './chrome.js';
import { renderShop } from './shop.js';

/* ══════════════ rooms ══════════════ */
export function restScene(){
  const amt = Math.floor(G.maxHp * (hasR('darkkey') ? .50 : .35));
  setScene(`<div class="pad scroll">
    <div class="tag">Plate ${ROMAN[nodeAt(G.at).r]}</div>
    <h2 class="title" style="margin:6px 0 4px;font-size:19px">Darkroom</h2>
    <div class="flavor">A red bulb, a stool, a tray of cold fixer. Nothing here is hunting you.</div>
    <button class="opt" data-a="rest-heal"><div class="oh">Rest</div>
      <div class="od">Heal ${amt} HP.</div></button>
    <button class="opt" data-a="rest-up"><div class="oh">Refine</div>
      <div class="od">Permanently improve one card in your deck.</div></button>
  </div>`);
}
export function treasureScene(){
  const relic = rollRelic();
  const gold = rr(25,60);
  setScene(`<div class="pad scroll">
    <div class="tag">Plate ${ROMAN[nodeAt(G.at).r]}</div>
    <h2 class="title" style="margin:6px 0 4px;font-size:19px">Sealed cabinet</h2>
    <div class="flavor">Brass fittings, no dust on the lock. Someone has been maintaining it.</div>
    <div class="deckline"><span>Loose gold</span><span style="color:var(--sun)">+${gold}</span></div>
    ${relic ? `<div class="relic" style="margin-top:12px">${glyph(RELICS[relic].g)}<div>
      <div class="rn">${RELICS[relic].n}</div><div class="rd">${RELICS[relic].d}</div></div></div>` : ''}
    <div class="row" style="margin-top:18px;justify-content:flex-start">
      <button class="btn primary" data-a="take-treasure" data-i="${relic||''}" data-g="${gold}">Take it all</button></div>
  </div>`);
}
export function eventScene(){
  if(!G.seenEv) G.seenEv = [];
  const unseen = EVENTS.filter(e => !G.seenEv.includes(e.id));
  setEV(unseen.length ? pick(unseen) : pick(EVENTS));
  G.seenEv.push(EV.id);
  setScene(`<div class="pad scroll">
    <div class="tag">Plate ${ROMAN[nodeAt(G.at).r]}</div>
    <h2 class="title" style="margin:6px 0 4px;font-size:19px">${EV.n}</h2>
    <div class="flavor">${EV.f}</div>
    ${EV.o.map((o,i) => `<button class="opt" data-a="opt" data-i="${i}" ${o.cost && G.gold < o.cost ? 'disabled' : ''}>
      <div class="oh">${o.h}</div>${o.d ? `<div class="od">${o.d}</div>` : ''}</button>`).join('')}
  </div>`);
}
export function priceOf(c){
  const r = CARDS[c.id].r;
  return r === 'rare' ? rr(120,160) : r === 'uncommon' ? rr(72,96) : rr(42,58);
}
export function shopScene(node){
  if(!node.shop){
    const cards = offerCards(4, 10);
    const relics = [];
    for(let i=0;i<2;i++){ const r = rollRelic(nodeAt(G.at).r >= 8); if(r && !relics.includes(r)) relics.push(r); }
    node.shop = {
      cards: cards.map(c => ({ c, price: priceOf(c), sold:false })),
      relics: relics.map(r => ({ r, price: rr(140,190), sold:false })),
      pots: [0,1].map(() => ({ p: pick(Object.keys(POTS)), price: rr(45,72), sold:false })),
      removed: false };
    save();
  }
  renderShop(node.shop);
}

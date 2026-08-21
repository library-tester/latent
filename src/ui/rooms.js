/* Non-combat rooms: the darkroom, the sealed cabinet, events, the shop roll. */

import { save } from '../core/persist.js';
import { EV, G, setEV } from '../core/state.js';
import { ROMAN, pick, rr } from '../core/util.js';
import { CARDS } from '../data/cards.js';
import { EVENTS } from '../data/events.js';
import { glyph } from '../data/glyphs.js';
import { rollPotion } from '../data/potions.js';
import { RELICS } from '../data/relics.js';
import { fire, mod } from '../game/hooks.js';
import { nodeAt } from '../game/map.js';
import { offerCards, rollRelic } from '../game/run.js';
import { setScene } from './chrome.js';
import { renderShop } from './shop.js';

/* ══════════════ rooms ══════════════ */
/* What a night in the darkroom is worth, after Darkroom Key and Eternal Feather. */
export const restHeal = () => Math.max(0, Math.round(mod('restHeal', Math.floor(G.maxHp * 0.35))));

const REST_LABEL = {
  'rest-card':   ['Sift the sleeve', 'Take a card from a sleeve of old negatives.'],
  'rest-lift':   ['Lift', 'Gain 3 Strength for the rest of the run.'],
  'rest-remove': ['Scrape a plate', 'Remove one card from your deck.'],
  'rest-dig':    ['Dig', 'Turn over the floor for a relic.'],
};
export function restScene(){
  fire('enterRoom', 'rest');
  const amt = restHeal();
  const extra = mod('restExtra', []);
  setScene(`<div class="pad scroll">
    <div class="tag">Plate ${ROMAN[nodeAt(G.at).r]}</div>
    <h2 class="title" style="margin:6px 0 4px;font-size:19px">Darkroom</h2>
    <div class="flavor">A red bulb, a stool, a tray of cold fixer. Nothing here is hunting you.</div>
    ${mod('restBlocked', false) ? '<div class="flavor">The dripper keeps you awake. You cannot rest here.</div>'
      : `<button class="opt" data-a="rest-heal"><div class="oh">Rest</div>
      <div class="od">Heal ${amt} HP.</div></button>`}
    ${mod('smithBlocked', false) ? ''
      : `<button class="opt" data-a="rest-up"><div class="oh">Refine</div>
      <div class="od">Permanently improve one card in your deck.</div></button>`}
    ${extra.map(k => `<button class="opt" data-a="${k}"><div class="oh">${REST_LABEL[k][0]}</div>
      <div class="od">${REST_LABEL[k][1]}</div></button>`).join('')}
    <div class="row" style="margin-top:18px;justify-content:flex-start">
      <button class="btn ghost" data-a="tomap">Move on</button></div>
  </div>`);
}
export function treasureScene(){
  fire('enterRoom', 'treasure');
  const empty = mod('chestEmpty', false);
  const n = empty ? 0 : Math.max(0, Math.round(mod('chestRelics', 1)));
  const relics = [];
  for(let i=0;i<n;i++){ const r = rollRelic(); if(r && !relics.includes(r)) relics.push(r); }
  const gold = empty ? 0 : rr(25,60);
  const curse = !empty && mod('chestCurse', false);
  setScene(`<div class="pad scroll">
    <div class="tag">Plate ${ROMAN[nodeAt(G.at).r]}</div>
    <h2 class="title" style="margin:6px 0 4px;font-size:19px">Sealed cabinet</h2>
    <div class="flavor">${empty ? 'The lock is already sprung. Something got here first, and left nothing.'
      : 'Brass fittings, no dust on the lock. Someone has been maintaining it.'}</div>
    ${gold ? `<div class="deckline"><span>Loose gold</span><span style="color:var(--sun)">+${gold}</span></div>` : ''}
    ${relics.map(r => `<div class="relic" style="margin-top:12px">${glyph(RELICS[r].g)}<div>
      <div class="rn">${RELICS[r].n}</div><div class="rd">${RELICS[r].d}</div></div></div>`).join('')}
    ${curse ? '<div class="flavor" style="margin-top:12px">The key turns, and something turns with it.</div>' : ''}
    <div class="row" style="margin-top:18px;justify-content:flex-start">
      <button class="btn primary" data-a="take-treasure" data-i="${relics.join(',')}" data-g="${gold}"
        data-c="${curse ? 1 : ''}">${empty ? 'Close it' : 'Take it all'}</button></div>
  </div>`);
}
export function eventScene(){
  fire('enterRoom', 'event');
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
export const shopPrice = p => Math.max(1, Math.round(mod('shopPrice', p)));
export const removalPrice = () => Math.max(0, Math.round(mod('removalPrice', 75)));
export function shopScene(node){
  fire('enterRoom', 'shop');
  /* The Courier restocks the shelves every visit; otherwise the roll sticks. */
  if(!node.shop || mod('restocks', false)){
    const cards = offerCards(4, 10);
    const relics = [];
    for(let i=0;i<3;i++){ const r = rollRelic(i === 2 ? 'shop' : undefined); if(r && !relics.includes(r)) relics.push(r); }
    node.shop = {
      cards: cards.map(c => ({ c, price: priceOf(c), sold:false })),
      relics: relics.map(r => ({ r, price: rr(140,190), sold:false })),
      pots: [0,1,2].map(() => ({ p: rollPotion(), price: rr(45,72), sold:false })),
      removed: false };
    save();
  }
  renderShop(node.shop);
}

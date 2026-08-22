/* Modal flows that operate on the deck: view, pick, remove, copy, refine. */

import { save } from '../core/persist.js';
import { C, G, PENDING, setPENDING } from '../core/state.js';
import { CARDS } from '../data/cards.js';
import { glyph } from '../data/glyphs.js';
import { POTS } from '../data/potions.js';
import { RELICS } from '../data/relics.js';
import { cardHTML } from './card-view.js';
import { openSheet } from './chrome.js';
import { gainCard, offerCards } from '../game/run.js';
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
    cards.forEach(c => gainCard(c));
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
/* The boss hoard: several relics on the table, exactly one comes home. */
export function relicChoice(ids, opts){
  opts = opts || {};
  if(!ids || !ids.length){ (opts.then || toMap)(); return; }
  setPENDING({ relics: ids, then: opts.then || toMap });
  openSheet(`<header><span class="title">Choose a relic</span><span class="tag">one only</span></header>
    <div class="body">${opts.flavor ? `<div class="flavor">${opts.flavor}</div>` : ''}
      ${ids.map((id,i) => `<div class="relic pickable" data-a="rpick" data-i="${i}">${glyph(RELICS[id].g)}
        <div><div class="rn">${RELICS[id].n}</div><div class="rd">${RELICS[id].d}</div></div></div>`).join('')}
    </div><footer>${opts.skip ? '<button class="btn ghost" data-a="skiprelic">Take none</button>' : ''}</footer>`);
}
/* `onCancel` marks a flow that can genuinely be abandoned — the shop's paid
   scrape, where nothing has been charged yet. Without it, backing out resolves
   through `then` instead, so the room the flow came from is still consumed. */
export function removeFlow(then, onCancel){
  setPENDING({ then: then || toMap, cancel: onCancel });
  openSheet(`<header><span class="title">Remove a card</span><span class="tag">tap to destroy</span></header>
    <div class="body"><div class="grid">${G.deck.map((c,i) => cardHTML(c,'pickable',`data-a="rem" data-i="${i}"`)).join('')}</div></div>
    <footer><button class="btn ghost" data-a="cancel">${onCancel ? 'Cancel' : 'Remove none'}</button></footer>`);
}
export function duplicateFlow(then){
  setPENDING({ then: then || toMap });
  openSheet(`<header><span class="title">Duplicate a card</span><span class="tag">tap to copy</span></header>
    <div class="body"><div class="grid">${G.deck.map((c,i) => cardHTML(c,'pickable',`data-a="dup" data-i="${i}"`)).join('')}</div></div>
    <footer><button class="btn ghost" data-a="cancel">Copy none</button></footer>`);
}
export function upgradeFlow(then){
  const up = G.deck.map((c,i) => ({c,i})).filter(o => !o.c.lvl && CARDS[o.c.id].r !== 'curse');
  if(!up.length){ toMap(); return; }
  setPENDING({ then: then || toMap });
  openSheet(`<header><span class="title">Refine a card</span><span class="tag">tap to improve</span></header>
    <div class="body"><div class="grid">${up.map(o => cardHTML(o.c,'pickable',`data-a="up" data-i="${o.i}"`)).join('')}</div></div>
    <footer><button class="btn ghost" data-a="cancel">Improve none</button></footer>`);
}

/* ── flows a relic opens once its acquisition sheet is dismissed ── */

/* Bottled Flame / Lightning / Tornado: mark one card of a type to open in hand. */
export function bottleFlow(t, then){
  const up = G.deck.map((c,i) => ({c,i})).filter(o => CARDS[o.c.id].t === t);
  if(!up.length){ (then || toMap)(); return; }
  G.deck.forEach(c => { if(c.bottle === t) delete c.bottle; });
  setPENDING({ then: then || toMap });
  openSheet(`<header><span class="title">Bottle a card</span><span class="tag">it opens in your hand</span></header>
    <div class="body"><div class="grid">${up.map(o => cardHTML(o.c,'pickable',`data-a="bottle" data-i="${o.i}" data-k="${t}"`)).join('')}</div></div>
    <footer></footer>`);
}
/* Empty Cage and friends: run a removal n times, then hand control back. */
export function removeChain(n, then){
  const step = k => () => (k >= n ? (then || toMap)() : removeFlow(step(k+1)));
  step(0)();
}
/* Astrolabe: transform and upgrade n cards, one pick at a time. */
export function transformChain(n, then){
  const step = k => () => {
    if(k >= n || !G.deck.length){ (then || toMap)(); return; }
    setPENDING({ then: step(k+1) });
    openSheet(`<header><span class="title">Transform a card</span><span class="tag">${n-k} left</span></header>
      <div class="body"><div class="grid">${G.deck.map((c,i) => cardHTML(c,'pickable',`data-a="xform" data-i="${i}"`)).join('')}</div></div>
      <footer></footer>`);
  };
  step(0)();
}
/* Orrery and Tiny House: choose from a fresh roll, n times over. */
export function cardGiftChain(n, then){
  const step = k => () => {
    if(k >= n){ (then || toMap)(); return; }
    grantChoice(offerCards(3, 10), '', { then: step(k+1), skip: false });
  };
  step(0)();
}

/* ── ampoule flows ── */

/* Plate / Solution / Developer / Archive Ampoule: three cards, one comes free. */
export function potionPick(cards, flavor){
  if(!C || !cards.length) return;
  setPENDING({ cards });
  openSheet(`<header><span class="title">Choose a card</span><span class="tag">costs 0 this turn</span></header>
    <div class="body">${flavor ? `<div class="flavor">${flavor}</div>` : ''}
      <div class="grid">${cards.map((c,i) => cardHTML(c,'pickable',`data-a="potcard" data-i="${i}"`)).join('')}</div></div>
    <footer><button class="btn ghost" data-a="close">Take none</button></footer>`);
}
/* Gambler's Brew and Elixir: tick off any number of cards, then confirm. */
export function handSelect(mode){
  if(!C || !C.hand.length) return;
  setPENDING({ mode, sel: [] });
  renderHandSelect();
}
export function renderHandSelect(){
  const P = PENDING; if(!P || !C) return;
  const verb = P.mode === 'discard' ? 'Discard' : 'Exhaust';
  openSheet(`<header><span class="title">${verb} any number</span>
      <span class="tag">${P.mode === 'discard' ? 'then draw that many' : 'gone for the fight'}</span></header>
    <div class="body"><div class="grid">${C.hand.map((c,i) =>
      cardHTML(c, 'pickable' + (P.sel.includes(i) ? ' sel' : ''), `data-a="hsel" data-i="${i}"`)).join('')}</div></div>
    <footer><button class="btn primary" data-a="hdone">${verb} ${P.sel.length}</button></footer>`);
}
/* Liquid Memories: one card back out of the spent pile, free. */
export function discardPick(){
  if(!C || !C.disc.length) return;
  setPENDING({});
  openSheet(`<header><span class="title">Spent pile</span><span class="tag">tap to recover</span></header>
    <div class="body"><div class="grid">${C.disc.map((c,i) =>
      cardHTML(c,'pickable',`data-a="dpick" data-i="${i}"`)).join('')}</div></div>
    <footer><button class="btn ghost" data-a="close">Leave it</button></footer>`);
}

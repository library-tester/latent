/* The Fixer's stock, drawn from the shop rolled onto the map node. */

import { G } from '../core/state.js';
import { ROMAN } from '../core/util.js';
import { glyph } from '../data/glyphs.js';
import { POTS } from '../data/potions.js';
import { RELICS } from '../data/relics.js';
import { nodeAt } from '../game/map.js';
import { removalPrice, shopPrice } from './rooms.js';
import { cardHTML } from './card-view.js';
import { setScene } from './chrome.js';

export function renderShop(S){
  setScene(`<div class="pad scroll">
    <div class="tag">Plate ${ROMAN[nodeAt(G.at).r]}</div>
    <h2 class="title" style="margin:6px 0 4px;font-size:19px">The Fixer</h2>
    <div class="flavor">He does not look up. "Everything here was salvaged. Some of it was mine."</div>
    <div class="tag" style="margin:14px 0 8px">Plates</div>
    <div class="grid">${S.cards.map((o,i) => `<div>
      ${cardHTML(o.c, 'pickable ' + (o.sold ? 'sold' : ''), `data-a="buy" data-k="card" data-i="${i}"`)}
      <div class="price">${o.sold ? 'sold' : shopPrice(o.price) + 'g'}</div></div>`).join('')}</div>
    ${S.relics.length ? `<div class="tag" style="margin:18px 0 4px">Relics</div>
      ${S.relics.map((o,i) => `<div class="relic ${o.sold ? 'sold' : 'pickable'}" data-a="buy" data-k="relic" data-i="${i}">
        ${glyph(RELICS[o.r].g)}<div style="flex:1"><div class="rn">${RELICS[o.r].n}</div>
        <div class="rd">${RELICS[o.r].d}</div></div>
        <span class="price" style="margin:0">${o.sold ? 'sold' : shopPrice(o.price) + 'g'}</span></div>`).join('')}` : ''}
    <div class="tag" style="margin:18px 0 4px">Ampoules</div>
    ${S.pots.map((o,i) => `<div class="relic ${o.sold ? 'sold' : 'pickable'}" data-a="buy" data-k="pot" data-i="${i}">
      ${glyph(POTS[o.p].g)}<div style="flex:1"><div class="rn">${POTS[o.p].n}</div>
      <div class="rd">${POTS[o.p].d}</div></div>
      <span class="price" style="margin:0">${o.sold ? 'sold' : shopPrice(o.price) + 'g'}</span></div>`).join('')}
    <div class="tag" style="margin:18px 0 4px">Service</div>
    <button class="opt" data-a="buy" data-k="remove" ${S.removed || G.gold < removalPrice() ? 'disabled' : ''}>
      <div class="oh">Scrape a plate — ${removalPrice()}g</div><div class="od">Remove one card from your deck.</div></button>
    <div class="row" style="margin:16px 0 0;justify-content:flex-start">
      <button class="btn primary" data-a="tomap">Leave</button></div>
  </div>`);
}

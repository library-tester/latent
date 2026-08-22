/* The post-combat spoils screen, and the pause between acts. */

import { save } from '../core/persist.js';
import { G, RW, setRW } from '../core/state.js';
import { ROMAN, rr } from '../core/util.js';
import { ACTS } from '../data/acts.js';
import { ENEMIES } from '../data/enemies.js';
import { POTS, rollPotion } from '../data/potions.js';
import { RELICS } from '../data/relics.js';
import { mod } from '../game/hooks.js';
import { addGold, beginAct, offerCards, rollRelic, rollRelics } from '../game/run.js';
import { paintBar, setScene } from './chrome.js';

/* ══════════════ rewards ══════════════ */
export function rewards(kind, row){
  const gold = kind === 'boss' ? rr(85,115) : kind === 'elite' ? rr(40,62) : rr(12,20) + row;
  addGold(gold);
  /* A boss pays in the top tier outright; elites merely nudge the roll upward. */
  const cards = kind === 'boss' ? offerCards(3, 0, 'rare') : offerCards(3, kind === 'fight' ? 0 : 14);
  /* Prayer Wheel hangs a second pile of plates on ordinary fights. */
  const cards2 = mod('extraCardReward', false, kind) ? offerCards(3, 0) : null;
  const relics = [];
  /* The boss hoard lays out three and keeps two; elites hand theirs over. */
  const bossRelics = kind === 'boss' ? rollRelics('boss', 3) : null;
  if(kind === 'elite'){
    const n = Math.max(1, Math.round(mod('eliteRelics', 1)));
    for(let i=0;i<n;i++){ const r = rollRelic(); if(r && !relics.includes(r)) relics.push(r); }
  }
  const potChance = mod('potChance', kind === 'elite' ? 0.6 : 0.34);
  const blocked = mod('potionBlocked', false);
  setRW({ gold, cards, cardTaken:false, rare: kind === 'boss', cards2, card2Taken:false,
         relics: relics.filter(Boolean), relicTaken:0,
         bossRelics, bossRelicTaken:false,
         pot: (!blocked && Math.random() < potChance) ? rollPotion() : null, potTaken:false,
         bowl: mod('bowl', false),
         actEnd: kind === 'boss' });
  renderRewards();
}
export function renderRewards(){
  const r = RW;
  setScene(`<div class="pad scroll">
    <div class="tag">Spoils</div>
    <h2 class="title" style="margin:6px 0 14px;font-size:19px">The plate clears</h2>
    <div class="deckline"><span>Gold recovered</span><span style="color:var(--sun)">+${r.gold}</span></div>
    <div style="height:14px"></div>
    ${r.cardTaken ? '' : `<button class="opt" data-a="rw-card"><div class="oh">Take a card</div>
      <div class="od">${r.cards.length} ${r.rare ? 'rare plates came up out of the fixer bath' : 'plates surfaced in the wash'}.</div></button>`}
    ${r.cards2 && !r.card2Taken ? `<button class="opt" data-a="rw-card2"><div class="oh">Take a second card</div>
      <div class="od">The wheel turned twice.</div></button>` : ''}
    ${r.bowl && !r.cardTaken ? `<button class="opt" data-a="rw-bowl"><div class="oh">Ring the bowl instead</div>
      <div class="od">Refuse the plates and raise Max HP by 2.</div></button>` : ''}
    ${(r.bossRelics || []).length && !r.bossRelicTaken ? `<button class="opt" data-a="rw-bossrelic">
      <div class="oh">Choose a boss relic</div>
      <div class="od">${r.bossRelics.length} came out of the hoard. Only one leaves with you.</div></button>` : ''}
    ${(r.relics || []).slice(r.relicTaken).map(id => `<button class="opt" data-a="rw-relic"><div class="oh">Take the relic</div>
      <div class="od">${RELICS[id].n}</div></button>`).join('')}
    ${r.pot && !r.potTaken ? `<button class="opt" data-a="rw-pot"><div class="oh">Take an ampoule</div>
      <div class="od">${POTS[r.pot].n} — ${POTS[r.pot].d}</div></button>` : ''}
    <div class="row" style="margin-top:18px;justify-content:flex-start">
      <button class="btn primary" data-a="${r.actEnd ? 'actdone' : 'tomap'}">${r.actEnd ? 'Go deeper' : 'Descend'}</button></div></div>`);
  save();
}
/* Between acts: patch the player up, then hand them the next map. */
export function actComplete(){
  const nxt = G.act + 1, A = ACTS[nxt];
  const healed = Math.floor(G.maxHp * 0.30);
  G.hp = Math.min(G.maxHp, G.hp + healed);
  beginAct(nxt);
  save(); paintBar();
  setScene(`<div class="center pad">
    <div class="tag">Act ${ROMAN[nxt-1]}</div>
    <div id="titlemark" style="font-size:clamp(24px,8vw,38px);color:var(--sun)">${A.n.toUpperCase()}</div>
    <div class="sub">${A.sub}</div>
    <div style="width:min(340px,82vw)">
      <div class="deckline"><span>Bound wounds</span><span style="color:var(--sun)">+${healed} HP</span></div>
      <div class="deckline"><span>Waiting at the top</span><span>${ENEMIES[G.boss].n}</span></div>
    </div>
    <div class="row"><button class="btn primary" data-a="tomap">Open the doors</button></div></div>`);
}

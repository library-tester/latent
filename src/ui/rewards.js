/* The post-combat spoils screen, and the pause between acts. */

import { save } from '../core/persist.js';
import { G, RW, setRW } from '../core/state.js';
import { ROMAN, pick, rr } from '../core/util.js';
import { ACTS } from '../data/acts.js';
import { ENEMIES } from '../data/enemies.js';
import { POTS } from '../data/potions.js';
import { RELICS } from '../data/relics.js';
import { addGold, beginAct, offerCards, rollRelic } from '../game/run.js';
import { paintBar, setScene } from './chrome.js';

/* ══════════════ rewards ══════════════ */
export function rewards(kind, row){
  const gold = kind === 'boss' ? rr(85,115) : kind === 'elite' ? rr(40,62) : rr(12,20) + row;
  addGold(gold);
  const cards = offerCards(3, kind === 'fight' ? 0 : 14);   // elites and bosses surface better plates
  setRW({ gold, cards, cardTaken:false,
         relic: kind === 'boss' ? rollRelic(true) : kind === 'elite' ? rollRelic(row >= 9) : null,
         relicTaken:false, pot: Math.random() < (kind === 'elite' ? .6 : .34) ? pick(Object.keys(POTS)) : null, potTaken:false,
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
      <div class="od">Three plates surfaced in the wash.</div></button>`}
    ${r.relic && !r.relicTaken ? `<button class="opt" data-a="rw-relic"><div class="oh">Take the relic</div>
      <div class="od">${RELICS[r.relic].n}</div></button>` : ''}
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

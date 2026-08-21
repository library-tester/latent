/* Run-level state: starting a run, moving between acts, and everything that changes
   HP, gold, relics or the deck outside of a fight. */

import { Snd } from '../core/audio.js';
import { save } from '../core/persist.js';
import { C, G, NEXT, setG, setNEXT } from '../core/state.js';
import { mk, pick, shuffle } from '../core/util.js';
import { ACTS } from '../data/acts.js';
import { CARDS, POOL } from '../data/cards.js';
import { ENEMIES } from '../data/enemies.js';
import { glyph } from '../data/glyphs.js';
import { RELICS, hasR } from '../data/relics.js';
import { genMap } from './map.js';
import { openSheet, paintBar } from '../ui/chrome.js';
import { gameOver } from '../ui/endings.js';
import { fxSelf } from '../ui/fx.js';
import { toMap } from '../ui/map-view.js';

export function newRun(){
  setG({ hp:72, maxHp:72, gold:55, deck:[], relics:[], pots:[], at:null, seen:[], seenEv:[], won:0, act:1,
        recent:[], pity:0 });
  for(let i=0;i<5;i++) G.deck.push(mk('burn'));
  for(let i=0;i<4;i++) G.deck.push(mk('dodge'));
  G.deck.push(mk('flare'));
  G.relics.push('safelamp');
  beginAct(1);
  save(); toMap();
}
/* A run saved before the archive split into acts has no act or boss on it;
   fill those in rather than dropping the player into an empty boss fight. */
export function adoptRun(r){
  if(!r) return r;
  if(!ACTS[r.act]) r.act = 1;
  if(!r.boss || !ENEMIES[r.boss]) r.boss = pick(ACTS[r.act].boss);
  return r;
}
/* Pick this act's boss up front so the map can name what waits at the top. */
export function beginAct(n){
  G.act = n;
  G.at = null; G.seen = [];
  G.boss = pick(ACTS[n].boss.filter(k => k !== G.lastBoss)) || pick(ACTS[n].boss);
  G.lastBoss = G.boss;
  G.map = genMap();
}

/* ══════════════ run-level effects ══════════════ */
export function addGold(n){ G.gold += hasR('purse') ? Math.round(n*1.25) : n; Snd.play('coin'); paintBar(); }
export function damageRun(n){ G.hp = Math.max(0, G.hp - n); paintBar(); if(G.hp<=0) gameOver(); }
export function heal(n){ const b=G.hp; G.hp = Math.min(G.maxHp, G.hp + n); paintBar(); if(C) fxSelf('+'+(G.hp-b)+' HP','heal'); }
export function loseHp(n){ G.hp = Math.max(0, G.hp - n); paintBar(); if(C) fxSelf('-'+n+' HP','dmg'); if(G.hp<=0) gameOver(); }
export function grantRelic(id, then){
  setNEXT(then || toMap);
  if(id && hasR(id)) id = rollRelic(true);
  if(!id){ NEXT(); return; }
  G.relics.push(id); Snd.play('relic');
  if(id==='ferro'){ G.maxHp += 12; G.hp += 12; }
  if(id==='blackglass'){ G.maxHp -= 10; G.hp = Math.min(G.hp, G.maxHp); }
  openSheet(`<header><span class="tag">Acquired</span></header><div class="body">
    <div class="relic">${glyph(RELICS[id].g)}<div><div class="rn">${RELICS[id].n}</div><div class="rd">${RELICS[id].d}</div></div></div>
    </div><footer><button class="btn primary" data-a="close-next">Continue</button></footer>`);
}
export function rollRelic(deep){
  const p = Object.keys(RELICS).filter(k => (deep || !RELICS[k].boss) && !hasR(k));
  return p.length ? pick(p) : null;
}
export const potMax = () => hasR('vellum') ? 4 : 3;
/* Roll one card. `avoid` steers away from ids already offered lately — but only
   while the tier still has something else to give, so it can never dead-end.
   G.pity nudges rarity up after each offer that came back without a rare. */
export function rollCard(bonus, avoid){
  const r = Math.random()*100 - (bonus||0) - ((G && G.pity) || 0);
  // 6/37/57 — Spire's uncommon share. The old 32% starved half the collection:
  // 36 of the 72 cards are uncommon, and they were seeing a third of the slots.
  const rar = r < 6 ? 'rare' : r < 43 ? 'uncommon' : 'common';
  let pool = POOL(rar);
  if(avoid && avoid.size){
    const fresh = pool.filter(k => !avoid.has(k));
    if(fresh.length) pool = fresh;
  }
  return mk(pick(pool));
}
/* Offer n distinct cards. Without the memory 62% of every roll chases the same
   twenty commons, so the same faces kept turning up two fights apart. */
const RECENT_MAX = 15;
export function offerCards(n, bonus){
  const avoid = new Set((G && G.recent) || []);
  const out = [];
  for(let guard = 0; out.length < n && guard < 80; guard++){
    const c = rollCard(bonus, avoid);
    if(out.some(x => x.id === c.id)) continue;
    out.push(c); avoid.add(c.id);
  }
  for(let guard = 0; out.length < n && guard < 80; guard++){   // pool exhausted: take repeats
    const c = rollCard(bonus);
    if(!out.some(x => x.id === c.id)) out.push(c);
  }
  if(G){
    G.recent = [...(G.recent || []), ...out.map(c => c.id)].slice(-RECENT_MAX);
    G.pity = out.some(c => CARDS[c.id].r === 'rare') ? 0 : Math.min(6, (G.pity || 0) + 2);
  }
  return out;
}
export function upgradeRandom(n){
  const up = G.deck.filter(c => !c.lvl && CARDS[c.id].r !== 'curse');
  shuffle(up).slice(0,n).forEach(c => c.lvl = 1);
}

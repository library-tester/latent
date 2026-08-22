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
import { rollPotion } from '../data/potions.js';
import { RELICS, hasR } from '../data/relics.js';
import { fire, mod } from './hooks.js';
import { genMap } from './map.js';
import { openSheet, paintBar } from '../ui/chrome.js';
import { gameOver } from '../ui/endings.js';
import { fxSelf } from '../ui/fx.js';
import { toMap } from '../ui/map-view.js';

export function newRun(){
  setG({ hp:72, maxHp:72, gold:55, deck:[], relics:[], pots:[], at:null, seen:[], seenEv:[], won:0, act:1,
        recent:[], pity:0, rc:{} });
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
  if(!r.rc) r.rc = {};                       // relic counters arrived after some saves
  if(r.relics) r.relics = r.relics.filter(k => RELICS[k]);
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
export function addGold(n){
  n = Math.max(0, Math.round(mod('gold', n)));
  if(!n) return;
  G.gold += n; Snd.play('coin'); fire('goldGained', n); paintBar();
}
export function spendGold(n){ G.gold -= n; fire('goldSpent', n); paintBar(); }
export function damageRun(n){
  G.hp = Math.max(0, G.hp - Math.max(0, Math.round(mod('hpLoss', n)))); paintBar();
  if(G.hp<=0 && !mod('cheatDeath', false)) gameOver();
  else if(G.hp<=0) G.hp = Math.max(1, Math.floor(G.maxHp*0.5));
}
export function heal(n){
  n = Math.max(0, Math.round(mod('healAmt', n)));
  const b=G.hp; G.hp = Math.min(G.maxHp, G.hp + n); paintBar();
  if(C && G.hp !== b) fxSelf('+'+(G.hp-b)+' HP','heal');
}
export function raiseMaxHp(n){ G.maxHp += n; G.hp += n; paintBar(); }
export function loseHp(n){
  n = Math.max(0, Math.round(mod('hpLoss', n)));
  if(!n) return;
  G.hp = Math.max(0, G.hp - n); paintBar();
  if(C) fxSelf('-'+n+' HP','dmg');
  fire('hpLost', n);
  if(G.hp<=0){
    if(mod('cheatDeath', false)) G.hp = Math.max(1, Math.floor(G.maxHp*0.5));
    else if(!C) gameOver();
  }
}
/* Every route a card enters the deck by, so the eggs, Omamori and the
   curse-watchers all see it. Returns the card actually added, or null. */
export function gainCard(c){
  if(!c) return null;
  const d = CARDS[c.id];
  if(d.r === 'curse'){
    if(mod('curseBlocked', false, c)){ fxSelf('warded','blk'); return null; }
    fire('curseGained', c);
  }
  c = mod('cardAdded', c) || c;
  G.deck.push(c);
  fire('cardGained', c);
  return c;
}
export function grantRelic(id, then){
  setNEXT(then || toMap);
  if(id && hasR(id)) id = rollRelic();
  if(!id){ NEXT(); return; }
  G.relics.push(id); Snd.play('relic');
  const d = RELICS[id];
  if(d.onGain) d.onGain();
  paintBar();
  openSheet(`<header><span class="tag">Acquired</span></header><div class="body">
    <div class="relic">${glyph(d.g)}<div><div class="rn">${d.n}</div><div class="rd">${d.d}</div></div></div>
    </div><footer><button class="btn primary" data-a="close-next">Continue</button></footer>`);
}
/* Spire's drop split: half common, a third uncommon, the rest rare. `tier`
   forces a pool — boss rewards and shop shelves have their own. `avoid` holds
   ids already spoken for by an offer being built alongside this roll. */
export const RELIC_TIERS = ['common','uncommon','rare','boss','shop','event'];
export function rollRelic(tier, avoid){
  const want = tier || (() => { const r = Math.random()*100;
    return r < 50 ? 'common' : r < 83 ? 'uncommon' : 'rare'; })();
  const of = t => Object.keys(RELICS).filter(k => (RELICS[k].r || 'common') === t
    && !hasR(k) && !(avoid && avoid.has(k)));
  let p = of(want);
  if(!p.length && !tier) p = ['common','uncommon','rare'].flatMap(of);
  if(!p.length && tier === 'shop') p = ['common','uncommon','rare'].flatMap(of);
  if(!p.length && tier === 'boss') p = ['rare','uncommon'].flatMap(of);
  return p.length ? pick(p) : null;
}
/* n distinct relics from one tier. Short if the tier runs dry — the boss hoard
   offers whatever is left rather than repeating itself. */
export function rollRelics(tier, n){
  const out = [], avoid = new Set();
  for(let i=0;i<n;i++){
    const r = rollRelic(tier, avoid);
    if(!r) break;
    out.push(r); avoid.add(r);
  }
  return out;
}
export const potMax = () => Math.max(0, mod('potMax', 3));
/* Room for one more ampoule? Entropic Brew and the shelves both ask. */
export const potRoom = () => G.pots.length < potMax() && !mod('potionBlocked', false);
export function fillPotions(){
  if(mod('potionBlocked', false)) return 0;
  let added = 0;
  while(G.pots.length < potMax()){ G.pots.push(rollPotion()); added++; }
  paintBar();
  return added;
}
/* Roll one card. `avoid` steers away from ids already offered lately — but only
   while the tier still has something else to give, so it can never dead-end.
   G.pity nudges rarity up after each offer that came back without a rare.
   `force` pins the rarity outright, for offers that are meant to be a tier. */
export function rollCard(bonus, avoid, force){
  const r = Math.random()*100 - (bonus||0) - ((G && G.pity) || 0);
  // 6/37/57 — Spire's uncommon share. The old 32% starved half the collection:
  // 36 of the 72 cards are uncommon, and they were seeing a third of the slots.
  const rareAt = mod('rareChance', 6);
  const rar = force || (r < rareAt ? 'rare' : r < 43 ? 'uncommon' : 'common');
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
export function offerCards(n, bonus, force){
  n = Math.max(1, Math.round(mod('cardOptions', n)));
  const avoid = new Set((G && G.recent) || []);
  const out = [];
  for(let guard = 0; out.length < n && guard < 80; guard++){
    const c = rollCard(bonus, avoid, force);
    if(out.some(x => x.id === c.id)) continue;
    out.push(c); avoid.add(c.id);
  }
  for(let guard = 0; out.length < n && guard < 80; guard++){   // pool exhausted: take repeats
    const c = rollCard(bonus, null, force);
    if(!out.some(x => x.id === c.id)) out.push(c);
  }
  if(G){
    G.recent = [...(G.recent || []), ...out.map(c => c.id)].slice(-RECENT_MAX);
    G.pity = out.some(c => CARDS[c.id].r === 'rare') ? 0 : Math.min(6, (G.pity || 0) + 2);
  }
  fire('offerMade', out);
  return out;
}
export function upgradeRandom(n){
  const up = G.deck.filter(c => !c.lvl && CARDS[c.id].r !== 'curse');
  shuffle(up).slice(0,n).forEach(c => c.lvl = 1);
}
/* Upgrade n random cards of one type — War Paint and Whetstone. */
export function upgradeType(t, n){
  const up = G.deck.filter(c => !c.lvl && CARDS[c.id].t === t);
  shuffle(up).slice(0,n).forEach(c => c.lvl = 1);
}
/* Replace a card with a random other of the same type, keeping curses out. */
export function transformCard(i){
  const old = G.deck[i]; if(!old) return;
  const t = CARDS[old.id].t;
  const pool = Object.keys(CARDS).filter(k => CARDS[k].t === t && CARDS[k].r !== 'curse'
    && CARDS[k].r !== 'starter' && k !== old.id);
  if(!pool.length) return;
  G.deck[i] = mk(pick(pool), old.lvl);
}

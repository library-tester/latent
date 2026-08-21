/* The combat engine: turn order, damage, status, and how a card resolves.

   Relic effects are not written here. The engine announces what happened via
   fire()/mod() from ./hooks.js and the relics in data/relics.js answer. */

import { Snd } from '../core/audio.js';
import { BUSY, C, G, setBUSY, setC, setDEAD, setSEL } from '../core/state.js';
import { mk, pick, rr, shuffle, sleep } from '../core/util.js';
import { ACTS } from '../data/acts.js';
import { CARDS, costOf } from '../data/cards.js';
import { ENEMIES } from '../data/enemies.js';
import { fire, mod } from './hooks.js';
import { heal, loseHp } from './run.js';
import { paintBar } from '../ui/chrome.js';
import { buildCombat, paintEnemies, paintPlayer, renderCombat, renderField } from '../ui/combat-view.js';
import { gameOver, victory } from '../ui/endings.js';
import { banner, flash, fxOn, fxSelf, paintLight } from '../ui/fx.js';
import { rewards } from '../ui/rewards.js';

/* ══════════════ combat ══════════════ */
export function startCombat(kind, row){
  const A = ACTS[G.act] || ACTS[1], rows = (G.map && G.map.rows) || 15;
  const list = kind==='boss' ? [G.boss] : pick(
      kind==='elite' ? A.elite
    : row <= rows*0.22 ? A.easy : row <= rows*0.62 ? A.mid : A.hard);
  setC({ foes:[], hand:[], draw:[], disc:[], exh:[], energy:3, maxEnergy:3, block:0, light:0,
        str:0, dex:0, st:{weak:0,vuln:0,tarnish:0,frail:0,artifact:0}, powers:{}, turn:0, kind, row, over:false,
        retal:0, thorns:0, tempStr:0, tempDex:0, dbl:0, dup:0, leech:null,
        plated:0, intangible:0, carry:0, rc:{}, played:0, tAtk:0, tSkill:0, tPower:0, tPlayed:0 });
  list.forEach((k,i) => {
    const d = ENEMIES[k];
    let hp = rr(d.hp[0], d.hp[1]) + (d.boss ? 0 : Math.floor(row*0.7));
    hp = Math.max(1, Math.round(mod('foeHp', hp, d, kind)));
    C.foes.push({ key:k, n:d.n, pl:d.pl, art:d.art, hp, maxHp:hp, block:0, str:0, thorns:d.thorns||0,
      st:{weak:0,vuln:0,tarnish:0,frail:0,artifact:0}, alive:true, turn:0, last:null, intent:null, phase2:false, idx:i });
  });
  G.deck.forEach(c => C.draw.push({ ...c }));
  shuffle(C.draw);
  fire('combatStart', kind);
  /* bottled cards ride out of the draw pile and into the opening hand */
  const bottled = C.draw.filter(c => c.bottle);
  if(bottled.length){
    C.draw = C.draw.filter(c => !c.bottle);
    bottled.forEach(c => C.hand.push(c));
  }
  C.foes.forEach(e => rollIntent(e));
  setDEAD(false);
  Snd.boot(); Snd.startDrone();
  buildCombat();
  startTurn(true);
}
export function splitFoe(parent){
  const d = ENEMIES[parent.key], key = d.split, sd = ENEMIES[key];
  C.foes = C.foes.filter(f => f.alive);
  for(let i=0;i<2;i++){
    const hp = rr(sd.hp[0], sd.hp[1]);
    const f = { key, n:sd.n, pl:sd.pl, art:sd.art, hp, maxHp:hp, block:0, str:parent.str, thorns:sd.thorns||0,
      st:{weak:0,vuln:0,tarnish:0,frail:0,artifact:0}, alive:true, turn:0, last:null, intent:null, phase2:false, idx:C.foes.length };
    C.foes.push(f); rollIntent(f);
  }
  banner('It divides');
  renderField();
}
export function rollIntent(e){
  const d = ENEMIES[e.key];
  const key = d.ai(e, e.turn);
  e.intent = key;
}
export function startTurn(first){
  if(!C || C.over) return;
  C.turn++;
  /* Barricade keeps everything; Calipers and friends keep a slice of it. The
     first turn keeps it too, or Block granted at combat start would be zeroed
     the instant it was handed out. */
  if(!first && !C.powers.barricade) C.block = Math.max(0, mod('blockCarry', 0, C.block));
  C.ghostUsed = false; C.playedThisTurn = false; C.atkThisTurn = false; C.bonus = 0;
  /* retal is this turn's Thorns — Sear Plate's kind. C.thorns is the standing
     kind an ampoule grants, and relics top it up through thornsBase. */
  C.retal = C.thorns + mod('thornsBase', 0); C.dbl = 0;
  C.tAtk = 0; C.tSkill = 0; C.tPower = 0; C.tPlayed = 0;
  if(C.plated > 0) blk(C.plated, true);
  if(C.st.tarnish > 0){ const t = C.st.tarnish; C.st.tarnish--; loseHp(t); if(!C || C.over) return; }
  if(C.powers.recip) C.str += C.powers.recip;
  if(C.powers.fixb) blk(C.powers.fixb);
  if(C && C.powers.fixl) light(C.powers.fixl);
  if(C && C.powers.odl) light(C.powers.odl);
  if(!C || C.over) return;   // a start-of-turn power can finish the fight
  C.energy = mod('energyStart', C.maxEnergy, first) + (C.carry || 0);
  C.carry = 0;
  fire('turnStart', first);
  if(!C || C.over) return;
  drawC(mod('drawCount', 5, first));
  setSEL(null); setBUSY(false);
  renderCombat();
}
export function drawC(n){
  if(!C) return;
  if(n > 0) Snd.play('draw');
  for(let i=0;i<n;i++){
    if(C.draw.length === 0){
      if(C.disc.length === 0) break;
      C.draw = shuffle(C.disc); C.disc = []; Snd.play('shuffle');
      fire('shuffle');
      if(!C) return;
    }
    if(C.hand.length >= 10) break;
    const c = C.draw.pop();
    fire('cardDrawn', c);
    C.hand.push(c);
  }
}
/* effects */
export function blk(n, raw){
  if(!C || n<=0) return;
  if(!raw){                       // Dexterity and Frail shape Block gained from cards
    n += C.dex;
    if(C.st.frail > 0) n = Math.floor(n * 0.75);
  }
  n = Math.max(0, Math.round(mod('blockGain', n, raw)));
  if(n <= 0) return;
  Snd.play('block'); C.block += n; fxSelf('+'+n,'blk'); paintPlayer();
  // Anvil answers every plate laid down — the guard keeps it from answering itself
  if(C.powers.jugg && !C.inJugg){
    C.inJugg = true;
    const a = C.foes.filter(f => f.alive);
    if(a.length) dmgEnemy(pick(a), C.powers.jugg);
    if(C) C.inJugg = false;
  }
}
export function light(n){
  if(!C || n<=0) return;
  Snd.play('light', n);
  C.light += n;
  fire('lightGain', n);
  if(!C) return;
  if(C.powers.bloom){ const a = C.foes.filter(f=>f.alive); if(a.length) dmgEnemy(pick(a), C.powers.bloom); if(!C) return; }
  fxSelf('+'+n+' LIGHT','lit'); paintLight(); paintPlayer();
}
export function spendLight(){
  if(!C) return 0;
  const l = C.light; C.light = 0; paintLight();
  if(l > 0){ Snd.play('spend'); fire('lightSpend', l); }
  return l;
}
export function pow(k,n){ if(!C) return; C.powers[k] = (C.powers[k]||0) + n; fxSelf('POWER','lit'); }
/* A debuff on the player. Artifact eats one outright; Ginger and Turnip refuse
   their own. Buffs routed here (dex, str) skip all of that. */
export function pst(k,n){
  if(!C || n<=0) return;
  if(mod('debuffBlocked', false, k)) { fxSelf('resisted','blk'); return; }
  if(C.st.artifact > 0 && (k==='weak' || k==='vuln' || k==='frail')){
    C.st.artifact--; fxSelf('ARTIFACT','blk'); paintPlayer(); return;
  }
  C.st[k] += n; fxSelf('+'+n+' '+k.toUpperCase(),'dmg'); paintPlayer();
}
export function est(e,k,n){
  if(!C || !e || !e.alive || n<=0) return;
  if(e.st.artifact > 0 && k!=='tarnish'){ e.st.artifact--; fxOn(e.el,'ARTIFACT','blk'); paintEnemies(); return; }
  n = Math.round(mod('debuffOut', n, k, e));
  if(n <= 0) return;
  e.st[k] += n; fxOn(e.el, '+'+n+' '+k.toUpperCase(), 'dmg');
  fire('debuffApplied', e, k, n);
  paintEnemies();
}
export function allSt(k,n){ if(!C) return; C.foes.filter(e=>e.alive).forEach(e => est(e,k,n)); }
export function hitAll(n){ if(!C) return; C.foes.filter(e=>e.alive).forEach(e => hit(e,n)); }
export function hit(e, base){
  if(!C || !e || !e.alive) return;
  let d = base + C.str + (C.bonus || 0);
  d = mod('dmgOut', d, e, base);
  if(C.st.weak > 0) d = Math.floor(d * (1 - mod('weakBite', 0.25)));
  if(e.st.vuln > 0) d = Math.floor(d * (1 + mod('vulnBite', 0.5, e)));
  dmgEnemy(e, Math.max(0,d));
  if(C && e.thorns && e.alive) hitPlayer(e.thorns);
}
export function dmgEnemy(e, d){
  if(!C) return;
  const hadBlock = e.block > 0;
  const ab = Math.min(e.block, d);
  e.block -= ab; const rest = d - ab;
  e.hp -= rest;
  if(C.leech != null) C.leech += rest;   // Harvest counts only what got through
  if(e.el){ e.el.classList.remove('hurt'); void e.el.offsetWidth; e.el.classList.add('hurt'); }
  if(d > 0) Snd.play('hit', d);
  fxOn(e.el, ab && !rest ? String(d) : String(rest), 'dmg');
  if(hadBlock && e.block === 0 && e.alive) fire('blockBroken', e);
  const bd = ENEMIES[e.key];
  if(bd.boss && !e.phase2 && e.hp <= e.maxHp*0.5 && e.hp > 0){
    e.phase2 = true; e.str += 3; e.block = 0; e.turn = 0;
    banner('Second Exposure'); flash(); Snd.play('boss'); rollIntent(e);
  }
  if(e.hp <= 0){
    e.hp = 0; e.alive = false; if(e.el) e.el.classList.add('dead');
    Snd.play('death');
    fire('enemyDied', e);
    if(C && ENEMIES[e.key].split && C.foes.length < 5) splitFoe(e);
  }
  if(!C) return;
  paintEnemies();
  if(!C.over && C.foes.every(f => !f.alive)) winCombat();
}
export function eAtk(e, base){
  if(!C) return;
  let d = base + e.str;
  if(e.st.weak > 0) d = Math.floor(d * (1 - mod('weakBite', 0.25)));
  if(C.st.vuln > 0) d = Math.floor(d * (1 + mod('vulnTaken', 0.5)));
  hitPlayer(d);
  if(C && !C.over && C.retal > 0 && e.alive) dmgEnemy(e, C.retal);
}
export function hitPlayer(d){
  if(!C) return;
  if(C.powers.ghost && !C.ghostUsed && d > 0){
    C.ghostUsed = true; fxSelf('ghosted','blk'); Snd.play('block'); return;
  }
  d = Math.max(0, Math.round(mod('dmgIn', d)));
  if(C.intangible > 0 && d > 1) d = 1;
  const ab = Math.min(C.block, d);
  C.block -= ab; let rest = d - ab;
  if(rest > 0 && C.plated > 0){ C.plated--; }
  if(rest > 0) rest = playerHpLoss(rest, true);
  Snd.play(rest > 0 ? 'hurt' : 'block');
  fxSelf(rest > 0 ? '-'+rest : 'blocked', rest > 0 ? 'dmg' : 'blk');
  paintPlayer(); paintBar();
  if(G.hp <= 0 && !C.over) checkDeath();
}
/* Every route the player's HP goes down by, so Tungsten Rod and the once-per-combat
   guards see all of them. Returns the HP actually lost. */
export function playerHpLoss(n, inCombat){
  n = Math.max(0, Math.round(mod('hpLoss', n)));
  if(n <= 0) return 0;
  G.hp = Math.max(0, G.hp - n);
  if(inCombat) document.getElementById('app').animate(
    [{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],
    {duration:180});
  if(C) C.lostHpThisTurn = (C.lostHpThisTurn || 0) + n;
  fire('hpLost', n);
  return n;
}
/* Lizard Tail and its kind get one last word before the run ends. */
export function checkDeath(){
  /* An unopened Moth in a Bottle breaks itself before anything else is asked. */
  const fairy = G.pots ? G.pots.indexOf('fairypot') : -1;
  if(fairy >= 0){
    G.pots.splice(fairy, 1);
    G.hp = Math.max(1, Math.floor(G.maxHp * 0.3));
    banner('The moth stirs'); flash(); paintBar();
    return false;
  }
  if(mod('cheatDeath', false)){
    G.hp = Math.max(1, Math.floor(G.maxHp * 0.5));
    banner('The tail parts'); flash(); paintBar();
    return false;
  }
  if(C) C.over = true;
  setTimeout(gameOver, 700);
  return true;
}
/* What an incoming hit would come to after relics — the intent readout needs the
   same arithmetic hitPlayer() does, without actually dealing it. */
export function previewIn(d){
  d = Math.max(0, Math.round(mod('dmgIn', d)));
  return (C && C.intangible > 0 && d > 1) ? 1 : d;
}
export function eBlk(e,n){ if(!C) return; Snd.play('block'); e.block += n; fxOn(e.el,'+'+n,'blk'); paintEnemies(); }
export function eHeal(e,n){ if(!C) return; e.hp = Math.min(e.maxHp, e.hp+n); fxOn(e.el,'+'+n,'heal'); paintEnemies(); }
/* the gallery and the aperture fight you for the resource itself */
export function eDrain(n){ if(!C) return; const t = Math.min(C.light, n); if(!t) return;
  C.light -= t; paintLight(); fxSelf('-'+t+' LIGHT','dmg'); }
export function eCurse(id){ if(!C) return; C.disc.push(mk(id)); fxSelf('CURSED','dmg'); paintPlayer(); }
/* buff every living ally (several act II/III enemies rally the room) */
export function eRally(e,str,blk){ if(!C) return;
  C.foes.filter(x => x.alive).forEach(x => { x.str += str; });
  if(blk) eBlk(e,blk); fxOn(e.el,'+'+str+' STR ALL','lit'); paintEnemies(); }

/* play a card */
export function canPlay(c){
  if(!C || !c) return false;
  const d = CARDS[c.id];
  if(d.un && !mod('canPlayUnplayable', false, c, d)) return false;
  if(mod('playLimit', 0) && C.tPlayed >= mod('playLimit', 0)) return false;
  if(d.xc){ if(C.energy < 1) return false; }
  else if(costOf(c, true) > C.energy) return false;
  if(d.req && !d.req(c)) return false;
  return true;
}
export function playCard(i, target){
  if(!C || C.over || BUSY) return;
  const c = C.hand[i], d = c && CARDS[c.id];
  if(!c || !canPlay(c)) return;
  const cc = C;
  const x = d.xc ? cc.energy + mod('xBonus', 0) : 0;   // X-cost cards drink the whole pool
  cc.energy -= d.xc ? (x - mod('xBonus', 0)) : costOf(c, true);
  cc.playedThisTurn = true;
  cc.hand.splice(i,1);
  setSEL(null);
  const wasAtk = d.t === 'attack';
  cc.played++; cc.tPlayed++;
  if(wasAtk){ cc.tAtk++; } else if(d.t === 'skill'){ cc.tSkill++; } else if(d.t === 'power'){ cc.tPower++; }
  Snd.play('card');
  /* Second Pass doubles an attack; Necronomicon doubles one expensive one a turn */
  let reps = wasAtk && cc.dbl > 0 ? 2 : 1;
  if(reps === 2) cc.dbl--;
  else if(cc.dup > 0){ reps = 2; cc.dup--; }
  if(reps === 1 && mod('repeatCard', false, c, d)) reps = 2;
  fire('cardPlayed', c, d);
  if(wasAtk) fire('attackPlayed', c, d);
  if(d.t === 'skill') fire('skillPlayed', c, d);
  if(d.t === 'power') fire('powerPlayed', c, d);
  if(!C || C.over){ if(C) cc.disc.push(c); return; }
  for(let k = 0; k < reps; k++){
    if(k && (!C || C.over)) break;
    d.p(c, target, x);
  }
  if(C) fire('cardResolved', c, d);
  if(C && !C.over && wasAtk && C.powers.fbreath) hitAll(C.powers.fbreath);
  if(C && (d.ex || (C.powers.corrupt && d.t === 'skill'))) exhaustC(c);
  else cc.disc.push(c);
  cc.bonus = 0; if(wasAtk) cc.atkThisTurn = true;
  if(C && !C.over) renderCombat();
}
/* every route a card can leave play by, so exhaust-triggered powers see them all */
export function exhaustC(c){
  if(!C) return;
  /* Strange Spoon: half the time the plate survives into the spent pile instead */
  if(mod('exhaustDodge', false, c)){ C.disc.push(c); fxSelf('spared','blk'); return; }
  C.exh.push(c); Snd.play('exhaust');
  const d = CARDS[c.id];
  if(d.onEx) d.onEx(c);
  if(C && C.powers.fnp) blk(C.powers.fnp);
  if(C && C.powers.embrace) drawC(C.powers.embrace);
  if(C && !C.over) fire('exhaust', c);
}
export function toHand(id, lvl, free){
  if(!C || C.hand.length >= 10) return null;
  const c = mk(id, lvl);
  if(free) c.free = C.turn;
  C.hand.push(c);
  return c;
}
export async function endTurn(){
  if(BUSY || C.over) return;
  setBUSY(true); setSEL(null);
  Snd.play('card');
  fire('turnEnd');
  if(!C || C.over) return;
  const rot = C.hand.filter(c => c.id === 'rot').length;
  if(rot){ loseHp(rot); if(!C || C.over) return; }
  // Ethereal cards burn off rather than returning to the pile; anything a
  // burn draws (Dark Slide) lands in the now-empty hand and rides to next turn
  const keep = mod('keepHand', false);
  const toss = [], burn = [];
  C.hand.forEach(c => (CARDS[c.id].eth ? burn : toss).push(c));
  if(keep){ C.hand = toss; } else { C.hand = []; C.disc.push(...toss); }
  for(const c of burn){ exhaustC(c); if(!C || C.over) return; }
  if(C.tempStr){ C.str -= C.tempStr; C.tempStr = 0; paintPlayer(); }
  if(C.tempDex){ C.dex -= C.tempDex; C.tempDex = 0; paintPlayer(); }
  if(C.powers.regen){ heal(C.powers.regen); C.powers.regen--; }
  renderCombat();
  if(C.powers.latent) light(C.powers.latent);
  if(C && C.powers.halation && C.light >= 5) hitAll(C.powers.halation);
  if(C && !C.over && C.powers.combust){ loseHp(1); if(C && !C.over) hitAll(C.powers.combust); }
  if(!C || C.over) return;
  ['weak','vuln','frail'].forEach(k => { if(C.st[k] > 0) C.st[k]--; });
  if(C.intangible > 0) C.intangible--;
  fire('turnEnded');
  if(!C || C.over) return;
  C.lostHpThisTurn = 0;
  paintPlayer();
  await sleep(240);
  if(!C || C.over) return;   // the fight can end (or be torn down) across the pause
  Snd.play('enemy');
  const foes = C.foes;
  for(const e of foes){
    if(!C || C.over) return;
    if(!e.alive) continue;
    if(e.st.tarnish > 0){ const t = e.st.tarnish; e.st.tarnish--; dmgEnemy(e, t); if(!C || C.over) return; if(!e.alive) continue; }
    e.block = 0;
    if(e.el){ e.el.style.transform = 'translateY(-6px)'; }
    await sleep(160);
    if(!C || C.over) return;
    const mv = ENEMIES[e.key].m[e.intent];
    mv.f(e);
    if(e.el) e.el.style.transform = '';
    if(!C || C.over) return;
    ['weak','vuln','frail'].forEach(k => { if(e.st[k] > 0) e.st[k]--; });
    e.turn++; e.last = e.intent;
    rollIntent(e);
    paintEnemies();
    await sleep(320);
  }
  if(!C || C.over) return;
  startTurn(false);
}
/* Smoke Bomb: leave an ordinary fight with nothing to show for it. */
export function escapeCombat(){
  if(!C || C.over || C.kind === 'boss') return false;
  C.over = true;
  Snd.stopDrone(); Snd.play('exhaust');
  banner('Gone');
  setTimeout(() => { setC(null); paintBar(); import('../ui/map-view.js').then(m => m.toMap()); }, 700);
  return true;
}
/* Distilled Chaos: run the top of the draw pile straight into play, free. */
export function playTopCards(n){
  for(let i = 0; i < n; i++){
    if(!C || C.over) return;
    if(!C.draw.length){
      if(!C.disc.length) return;
      C.draw = shuffle(C.disc); C.disc = []; Snd.play('shuffle'); fire('shuffle');
      if(!C || !C.draw.length) return;
    }
    if(C.hand.length >= 10) return;
    const c = C.draw.pop(), d = CARDS[c.id];
    if(d.un){ C.disc.push(c); continue; }
    c.free = C.turn;
    C.hand.push(c);
    playCard(C.hand.length - 1, d.tg ? C.foes.find(f => f.alive) : null);
  }
}
export function winCombat(){
  if(C.over) return;
  C.over = true;
  const kind = C.kind, row = C.row;
  fire('combatWon', kind);
  Snd.stopDrone(); Snd.play('win');
  const last = kind === 'boss' && G.act >= 3;
  banner(kind === 'boss' ? 'Fixed' : 'Developed');
  setTimeout(() => { setC(null); paintBar(); if(last) victory(); else rewards(kind, row); }, 1200);
}

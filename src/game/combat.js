/* The combat engine: turn order, damage, status, and how a card resolves. */

import { Snd } from '../core/audio.js';
import { BUSY, C, G, setBUSY, setC, setDEAD, setSEL } from '../core/state.js';
import { mk, pick, rr, shuffle, sleep } from '../core/util.js';
import { ACTS } from '../data/acts.js';
import { CARDS, costOf } from '../data/cards.js';
import { ENEMIES } from '../data/enemies.js';
import { hasR } from '../data/relics.js';
import { addGold, loseHp } from './run.js';
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
        str:0, st:{weak:0,vuln:0,tarnish:0}, powers:{}, turn:0, kind, row, over:false,
        retal:0, tempStr:0, dbl:0, leech:null });
  list.forEach((k,i) => {
    const d = ENEMIES[k];
    const hp = rr(d.hp[0], d.hp[1]) + (d.boss ? 0 : Math.floor(row*0.7));
    C.foes.push({ key:k, n:d.n, pl:d.pl, art:d.art, hp, maxHp:hp, block:0, str:0, thorns:d.thorns||0,
      st:{weak:0,vuln:0,tarnish:0}, alive:true, turn:0, last:null, intent:null, phase2:false, idx:i });
  });
  if(hasR('blackglass')) C.maxEnergy = 4;
  G.deck.forEach(c => C.draw.push({ ...c }));
  shuffle(C.draw);
  if(hasR('nitrate')) C.light += 8;
  if(hasR('safelamp')) C.light += 3;
  if(hasR('brass')) C.block += 6;
  if(hasR('needle')) C.str += 1;
  if(hasR('belljar')) C.foes.forEach(e => e.st.weak += 1);
  if(hasR('foggedlens')) C.foes.forEach(e => e.st.vuln += 1);
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
      st:{weak:0,vuln:0,tarnish:0}, alive:true, turn:0, last:null, intent:null, phase2:false, idx:C.foes.length };
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
  if(!C.powers.barricade) C.block = 0;
  C.ghostUsed = false; C.playedThisTurn = false; C.atkThisTurn = false; C.bonus = 0;
  C.retal = 0; C.dbl = 0;
  if(C.st.tarnish > 0){ const t = C.st.tarnish; C.st.tarnish--; loseHp(t); if(!C || C.over) return; }
  if(C.powers.recip) C.str += C.powers.recip;
  if(C.powers.fixb) blk(C.powers.fixb);
  if(C && C.powers.fixl) light(C.powers.fixl);
  if(C && C.powers.odl) light(C.powers.odl);
  if(!C || C.over) return;   // a start-of-turn power can finish the fight
  C.energy = C.maxEnergy + (first && hasR('cell') ? 1 : 0);
  drawC(5 + (hasR('loupe') ? 1 : 0));
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
    }
    if(C.hand.length >= 10) break;
    C.hand.push(C.draw.pop());
  }
}
/* effects */
export function blk(n){
  if(!C || n<=0) return;
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
  C.light += n; if(hasR('bath')){ C.block += 1; }
  if(C.powers.bloom){ const a = C.foes.filter(f=>f.alive); if(a.length) dmgEnemy(pick(a), C.powers.bloom); if(!C) return; }
  fxSelf('+'+n+' LIGHT','lit'); paintLight(); paintPlayer();
}
export function spendLight(){
  if(!C) return 0;
  const l = C.light; C.light = 0; paintLight();
  if(l > 0){ Snd.play('spend'); if(hasR('sunlens')) hitAll(4); }
  return l;
}
export function pow(k,n){ if(!C) return; C.powers[k] = (C.powers[k]||0) + n; fxSelf('POWER','lit'); }
export function pst(k,n){ if(!C || n<=0) return; C.st[k] += n; fxSelf('+'+n+' '+k.toUpperCase(),'dmg'); paintPlayer(); }
export function est(e,k,n){ if(!C || !e || !e.alive || n<=0) return; e.st[k] += n; fxOn(e.el, '+'+n+' '+k.toUpperCase(), 'dmg'); paintEnemies(); }
export function allSt(k,n){ if(!C) return; C.foes.filter(e=>e.alive).forEach(e => est(e,k,n)); }
export function hitAll(n){ if(!C) return; C.foes.filter(e=>e.alive).forEach(e => hit(e,n)); }
export function hit(e, base){
  if(!C || !e || !e.alive) return;
  let d = base + C.str + (C.bonus || 0);
  if(C.st.weak > 0) d = Math.floor(d*0.75);
  if(e.st.vuln > 0) d = Math.floor(d*1.5);
  dmgEnemy(e, Math.max(0,d));
  if(C && e.thorns && e.alive) hitPlayer(e.thorns);
}
export function dmgEnemy(e, d){
  if(!C) return;
  const ab = Math.min(e.block, d);
  e.block -= ab; const rest = d - ab;
  e.hp -= rest;
  if(C.leech != null) C.leech += rest;   // Harvest counts only what got through
  if(e.el){ e.el.classList.remove('hurt'); void e.el.offsetWidth; e.el.classList.add('hurt'); }
  if(d > 0) Snd.play('hit', d);
  fxOn(e.el, ab && !rest ? String(d) : String(rest), 'dmg');
  const bd = ENEMIES[e.key];
  if(bd.boss && !e.phase2 && e.hp <= e.maxHp*0.5 && e.hp > 0){
    e.phase2 = true; e.str += 3; e.block = 0; e.turn = 0;
    banner('Second Exposure'); flash(); Snd.play('boss'); rollIntent(e);
  }
  if(e.hp <= 0){
    e.hp = 0; e.alive = false; if(e.el) e.el.classList.add('dead');
    Snd.play('death');
    if(ENEMIES[e.key].split && C.foes.length < 5) splitFoe(e);
  }
  paintEnemies();
  if(!C.over && C.foes.every(f => !f.alive)) winCombat();
}
export function eAtk(e, base){
  if(!C) return;
  let d = base + e.str;
  if(e.st.weak > 0) d = Math.floor(d*0.75);
  if(C.st.vuln > 0) d = Math.floor(d*1.5);
  if(hasR('apron')) d = Math.max(0, d-2);
  hitPlayer(d);
  if(C && !C.over && C.retal > 0 && e.alive) dmgEnemy(e, C.retal);
}
export function hitPlayer(d){
  if(!C) return;
  if(C.powers.ghost && !C.ghostUsed && d > 0){
    C.ghostUsed = true; fxSelf('ghosted','blk'); Snd.play('block'); return;
  }
  const ab = Math.min(C.block, d);
  C.block -= ab; const rest = d - ab;
  if(rest > 0){ G.hp = Math.max(0, G.hp - rest); document.getElementById('app').animate(
    [{transform:'translateX(0)'},{transform:'translateX(-6px)'},{transform:'translateX(5px)'},{transform:'translateX(0)'}],
    {duration:180}); }
  Snd.play(rest > 0 ? 'hurt' : 'block');
  fxSelf(rest > 0 ? '-'+rest : 'blocked', rest > 0 ? 'dmg' : 'blk');
  paintPlayer(); paintBar();
  if(hasR('pinhole') && !C.pinhole && G.hp > 0 && G.hp <= G.maxHp*0.3){
    C.pinhole = true; blk(20); banner('Pinhole'); }
  if(G.hp <= 0 && !C.over){ C.over = true; setTimeout(gameOver, 700); }
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
  if(d.un) return false;
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
  const x = d.xc ? cc.energy : 0;          // X-cost cards drink the whole pool
  cc.energy -= d.xc ? x : costOf(c, true);
  cc.playedThisTurn = true;
  cc.hand.splice(i,1);
  setSEL(null);
  const wasAtk = d.t === 'attack';
  if(wasAtk && hasR('ratstooth') && !cc.atkThisTurn) cc.bonus = 3;
  Snd.play('card');
  const reps = wasAtk && cc.dbl > 0 ? 2 : 1;   // Second Pass
  if(reps === 2) cc.dbl--;
  for(let k = 0; k < reps; k++){
    if(k && (!C || C.over)) break;
    d.p(c, target, x);
  }
  if(C && !C.over && wasAtk && C.powers.fbreath) hitAll(C.powers.fbreath);
  if(C && (d.ex || (C.powers.corrupt && d.t === 'skill'))) exhaustC(c);
  else cc.disc.push(c);
  cc.bonus = 0; if(wasAtk) cc.atkThisTurn = true;
  if(C && !C.over) renderCombat();
}
/* every route a card can leave play by, so exhaust-triggered powers see them all */
export function exhaustC(c){
  if(!C) return;
  C.exh.push(c); Snd.play('exhaust');
  const d = CARDS[c.id];
  if(d.onEx) d.onEx(c);
  if(C && C.powers.fnp) blk(C.powers.fnp);
  if(C && C.powers.embrace) drawC(C.powers.embrace);
  if(hasR('specpin') && C && !C.over){ const alive = C.foes.filter(f=>f.alive); if(alive.length) dmgEnemy(pick(alive), 3); }
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
  if(hasR('bonefolder')) blk(3);
  const rot = C.hand.filter(c => c.id === 'rot').length;
  if(rot){ loseHp(rot); if(!C || C.over) return; }
  // Ethereal cards burn off rather than returning to the pile; anything a
  // burn draws (Dark Slide) lands in the now-empty hand and rides to next turn
  const toss = [], burn = [];
  C.hand.forEach(c => (CARDS[c.id].eth ? burn : toss).push(c));
  C.hand = []; C.disc.push(...toss);
  for(const c of burn){ exhaustC(c); if(!C || C.over) return; }
  if(C.tempStr){ C.str -= C.tempStr; C.tempStr = 0; paintPlayer(); }
  renderCombat();
  if(C.powers.latent) light(C.powers.latent);
  if(C && C.powers.halation && C.light >= 5) hitAll(C.powers.halation);
  if(C && !C.over && C.powers.combust){ loseHp(1); if(C && !C.over) hitAll(C.powers.combust); }
  if(!C || C.over) return;
  ['weak','vuln'].forEach(k => { if(C.st[k] > 0) C.st[k]--; });
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
    ['weak','vuln'].forEach(k => { if(e.st[k] > 0) e.st[k]--; });
    e.turn++; e.last = e.intent;
    rollIntent(e);
    paintEnemies();
    await sleep(320);
  }
  if(!C || C.over) return;
  startTurn(false);
}
export function winCombat(){
  if(C.over) return;
  C.over = true;
  const kind = C.kind, row = C.row;
  if(hasR('balsam')) G.hp = Math.min(G.maxHp, G.hp + 6);
  if(hasR('ledger')) addGold(10);
  Snd.stopDrone(); Snd.play('win');
  const last = kind === 'boss' && G.act >= 3;
  banner(kind === 'boss' ? 'Fixed' : 'Developed');
  setTimeout(() => { setC(null); paintBar(); if(last) victory(); else rewards(kind, row); }, 1200);
}

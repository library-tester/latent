/* Everything the fight draws, and every tap it answers. */

import { Snd } from '../core/audio.js';
import { save } from '../core/persist.js';
import { BUSY, C, G, SEL, setSEL } from '../core/state.js';
import { artSvg } from '../data/art.js';
import { CARDS } from '../data/cards.js';
import { ENEMIES } from '../data/enemies.js';
import { IC, glyph } from '../data/glyphs.js';
import { POTS } from '../data/potions.js';
import { hasR } from '../data/relics.js';
import { canPlay, playCard } from '../game/combat.js';
import { potMax } from '../game/run.js';
import { cardHTML, fitText } from './card-view.js';
import { openSheet, paintBar, setScene } from './chrome.js';
import { paintLight } from './fx.js';

/* ══════════════ combat view ══════════════ */
export function buildCombat(){
  setScene(`<div id="field"></div>
    <div id="strip">
      <div id="orb"><span id="enum">3</span></div>
      <div id="lightwrap"><div class="tag" style="display:flex;justify-content:space-between">
        <span>Light</span><span id="lnum" style="color:var(--sun)">0</span></div>
        <div id="lightbar"><i></i></div></div>
      <div id="pchips" class="chips" style="min-height:0"></div>
      <div id="pblock">${glyph('shield')}<span id="bnum">0</span></div>
    </div>
    <div id="handwrap"><div id="hand"></div></div>
    <div id="actions">
      <span class="pile" data-a="pile" data-p="draw">Draw <b id="dnum">0</b></span>
      <span class="pile" data-a="pile" data-p="disc">Spent <b id="xnum">0</b></span>
      <div id="potbar"></div>
      <button class="btn primary" id="endturn" data-a="end">End turn</button>
    </div>`);
  renderField();
}
export function renderField(){
  const fl = document.getElementById('field');
  fl.className = 'f' + Math.min(3, C.foes.length);
  fl.innerHTML = C.foes.map((e,i) =>
    `<div class="enemy" data-a="foe" data-i="${i}">
      <div class="intent" data-r="int"></div>
      <div class="ename" style="opacity:.45;font-size:8px">${e.pl}</div>
      ${artSvg(e.art)}
      <div class="blockbadge" data-r="blk" style="display:none"></div>
      <div class="ename">${e.n}</div>
      <div class="bar"><i data-r="bar"></i></div>
      <div class="hpnum" data-r="hp"></div>
      <div class="chips" data-r="chips"></div>
    </div>`).join('');
  C.foes.forEach((e,i) => e.el = document.querySelector(`.enemy[data-i="${i}"]`));
  paintEnemies();
}
export function intentHTML(e){
  const d = ENEMIES[e.key], mv = d.m[e.intent];
  if(!mv) return '';
  const I = typeof mv.i === 'function' ? mv.i(e) : mv.i;
  if(I.t === 'atk'){
    let dm = I.d + e.str;
    if(e.st.weak > 0) dm = Math.floor(dm*0.75);
    if(C.st.vuln > 0) dm = Math.floor(dm*1.5);
    if(hasR('apron')) dm = Math.max(0, dm-2);
    return `<span class="i atk">${IC.atk}${dm}${I.x ? '<span style="opacity:.7">×'+I.x+'</span>' : ''}${I.deb ? '<span style="opacity:.7">▾</span>' : ''}</span>`;
  }
  if(I.t === 'def'){
    let dm = I.d ? Math.max(0, (hasR('apron') ? -2 : 0) + I.d + e.str) : 0;
    return IC.def + (I.v || '') + (I.d ? '<span style="color:var(--rust);margin-left:4px">' + IC.atk + dm + '</span>' : '');
  }
  if(I.t === 'buff') return IC.buff;
  return IC.deb;
}
export function paintEnemies(){
  if(!C) return;
  C.foes.forEach(e => {
    const el = e.el; if(!el) return;
    el.classList.toggle('dead', !e.alive);
    el.classList.toggle('target', e.alive && SEL !== null);
    const box = el.querySelector('[data-r="int"]');
    const d = ENEMIES[e.key], mv = d.m[e.intent];
    const I = mv ? (typeof mv.i === 'function' ? mv.i(e) : mv.i) : null;
    box.className = 'intent ' + (I ? (I.t === 'atk' ? 'atk' : I.t === 'def' ? 'def' : 'buff') : '');
    box.innerHTML = intentHTML(e);
    el.querySelector('[data-r="bar"]').style.transform = 'scaleX(' + (e.hp/e.maxHp) + ')';
    el.querySelector('[data-r="hp"]').textContent = e.hp + '/' + e.maxHp;
    const b = el.querySelector('[data-r="blk"]');
    b.style.display = e.block > 0 ? '' : 'none'; b.textContent = e.block;
    el.querySelector('[data-r="chips"]').innerHTML = chipsHTML(e.st, e.str, e.thorns);
  });
}
export function chipsHTML(st, str, thorns){
  let h = '';
  if(str) h += `<span class="chip c-str">STR ${str > 0 ? '+' : ''}${str}</span>`;
  if(thorns) h += `<span class="chip c-thorn">THORNS ${thorns}</span>`;
  if(st.weak) h += `<span class="chip c-weak">WEAK ${st.weak}</span>`;
  if(st.vuln) h += `<span class="chip c-vuln">VULN ${st.vuln}</span>`;
  if(st.tarnish) h += `<span class="chip c-tarnish">TARN ${st.tarnish}</span>`;
  return h;
}
export function paintPlayer(){
  if(!C) return;
  const e = document.getElementById('enum'); if(e) e.textContent = C.energy;
  const b = document.getElementById('bnum'); if(b) b.textContent = C.block;
  const d = document.getElementById('dnum'); if(d) d.textContent = C.draw.length;
  const x = document.getElementById('xnum'); if(x) x.textContent = C.disc.length;
  const p = document.getElementById('pchips'); if(p) p.innerHTML = chipsHTML(C.st, C.str, C.retal);
  const pot = document.getElementById('potbar');
  if(pot) pot.innerHTML = Array.from({length:potMax()}, (_,i) => i).map(i => G.pots[i]
    ? `<span class="pot" data-a="pot" data-i="${i}">${glyph(POTS[G.pots[i]].g)}</span>`
    : `<span class="pot empty"></span>`).join('');
  paintBar();
}
export function renderHand(){
  const h = document.getElementById('hand'); if(!h) return;
  h.innerHTML = C.hand.map((c,i) =>
    cardHTML(c, (SEL===i?'sel ':'') + (canPlay(c)?'':'cant'), `data-a="card" data-i="${i}"`, true)).join('');
  fitText(h);
  paintEnemies();
}
export function renderCombat(){ renderHand(); paintPlayer(); paintLight(); }
export function tapCard(i){
  if(BUSY || !C || C.over) return;
  const c = C.hand[i], d = CARDS[c.id];
  if(!canPlay(c)){
    const el = document.querySelector(`.card[data-i="${i}"]`);
    if(el){ el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); }
    Snd.play('error');
    return;
  }
  const alive = C.foes.filter(f => f.alive);
  if(d.tg && alive.length > 1){ setSEL(SEL === i ? null : i); Snd.play('select'); renderHand(); }
  else playCard(i, d.tg ? alive[0] : null);
}
export function tapFoe(i){
  if(BUSY || !C) return;
  const e = C.foes[i];
  if(!e.alive || SEL === null) return;
  playCard(SEL, e);
}
export function usePot(i){
  const k = G.pots[i]; if(!k) return;
  const p = POTS[k];
  if(p.combat && !C) return;
  G.pots.splice(i,1);
  Snd.play('pot');
  p.use();
  if(C) renderCombat(); else paintBar();
  save();
}
export function showPile(which){
  const list = which === 'draw' ? [...C.draw].sort((a,b) => CARDS[a.id].n.localeCompare(CARDS[b.id].n)) : C.disc;
  openSheet(`<header><span class="title">${which === 'draw' ? 'Draw pile' : 'Spent pile'}</span>
    <span class="tag">${list.length} cards</span></header>
    <div class="body"><div class="grid">${list.map(c => cardHTML(c)).join('') || '<span class="tag">empty</span>'}</div></div>
    <footer><button class="btn" data-a="close">Close</button></footer>`);
}

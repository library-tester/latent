/* Everything the fight draws, and every tap it answers. */

import { Snd } from '../core/audio.js';
import { save } from '../core/persist.js';
import { BUSY, C, G, POTSEL, SEL, setPOTSEL, setSEL } from '../core/state.js';
import { artSvg } from '../data/art.js';
import { CARDS } from '../data/cards.js';
import { ENEMIES } from '../data/enemies.js';
import { IC, glyph } from '../data/glyphs.js';
import { POTS } from '../data/potions.js';
import { mod, fire } from '../game/hooks.js';
import { canPlay, playCard, previewIn } from '../game/combat.js';
import { potMax } from '../game/run.js';
import { cardHTML, fitText } from './card-view.js';
import { openSheet, paintBar, setScene } from './chrome.js';
import { banner, paintLight } from './fx.js';

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
      <div class="ename">${e.n}</div>
      <div class="bar"><i data-r="bar"></i></div>
      <div class="hprow"><span class="blockbadge" data-r="blk" style="display:none">${glyph('shield')}<b data-r="blknum"></b></span>
        <span class="hpnum" data-r="hp"></span></div>
      <div class="chips" data-r="chips"></div>
    </div>`).join('');
  C.foes.forEach((e,i) => e.el = document.querySelector(`.enemy[data-i="${i}"]`));
  paintEnemies();
}
/* What a listed attack actually lands for, once Strength, Weak, Vulnerable and
   the player's damage-reducing relics have all had their say. Never a range. */
export function intentDmg(e, base){
  let dm = base + e.str;
  if(e.st.weak > 0) dm = Math.floor(dm * (1 - mod('weakBite', 0.25)));
  if(C.st.vuln > 0) dm = Math.floor(dm * (1 + mod('vulnTaken', 0.5)));
  return previewIn(dm);
}
/* The readout is composed, not enumerated: a move declares any of damage (`d`,
   optionally `x` times), block (`v`), a buff (`buff`) and a debuff (`deb`, or
   `sdeb` for one worth bracing for), and each present part draws its own icon.
   That covers every Spire intent combination — attack+block, attack+buff,
   block+debuff and so on — without a case per pairing. `t` still names the
   dominant part, which is what colours the box, and doubles as the implicit
   flag for the older buff-only / debuff-only moves.
   Four states stand alone and replace the whole readout: sleep, stun, flee
   and unknown. */
export function intentParts(I){
  return { dmg: I.d || 0, hits: I.x || 1, blk: I.v || 0,
           buff: !!(I.buff || I.t === 'buff'),
           deb:  !!(I.deb  || I.t === 'deb'),
           sdeb: !!(I.sdeb || I.t === 'sdeb') };
}
const SOLO = { sleep:'sleep', stun:'stun', flee:'flee', unknown:'unk' };
export function intentHTML(e){
  const d = ENEMIES[e.key], mv = d.m[e.intent];
  if(!mv) return '';
  if(mod('intentHidden', false)) return `<span class="i">${IC.unk}</span>`;
  const I = typeof mv.i === 'function' ? mv.i(e) : mv.i;
  if(SOLO[I.t]) return `<span class="i">${IC[SOLO[I.t]]}</span>`;

  const p = intentParts(I);
  let h = '';
  if(p.dmg) h += `<span class="i atk">${IC.atk}${intentDmg(e, p.dmg)}${
    p.hits > 1 ? `<span class="ix">×${p.hits}</span>` : ''}</span>`;
  if(p.blk) h += `<span class="i def">${IC.def}${p.blk}</span>`;
  if(p.buff) h += `<span class="i buf">${IC.buff}</span>`;
  if(p.sdeb) h += `<span class="i deb">${IC.sdeb}</span>`;
  else if(p.deb) h += `<span class="i deb">${IC.deb}</span>`;
  return h || `<span class="i buf">${IC.buff}</span>`;
}
/* Which colour the intent box takes, per dominant part. */
const INTENT_TONE = { atk:'atk', def:'def', buff:'buff', deb:'deb', sdeb:'deb',
                      sleep:'quiet', stun:'quiet', flee:'quiet', unknown:'quiet' };
export function paintEnemies(){
  if(!C) return;
  C.foes.forEach(e => {
    const el = e.el; if(!el) return;
    el.classList.toggle('dead', !e.alive);
    el.classList.toggle('target', e.alive && (SEL !== null || POTSEL !== null));
    const box = el.querySelector('[data-r="int"]');
    const d = ENEMIES[e.key], mv = d.m[e.intent];
    const I = mv ? (typeof mv.i === 'function' ? mv.i(e) : mv.i) : null;
    box.className = 'intent ' + (I ? (INTENT_TONE[I.t] || 'buff') : '');
    box.innerHTML = intentHTML(e);
    el.querySelector('[data-r="bar"]').style.transform = 'scaleX(' + (e.hp/e.maxHp) + ')';
    el.querySelector('[data-r="hp"]').textContent = e.hp + '/' + e.maxHp;
    const b = el.querySelector('[data-r="blk"]');
    b.style.display = e.block > 0 ? '' : 'none';
    el.querySelector('[data-r="blknum"]').textContent = e.block;
    el.querySelector('[data-r="chips"]').innerHTML = chipsHTML(e.st, e.str, e.thorns);
  });
}
export function chipsHTML(st, str, thorns, who){
  let h = '';
  if(str) h += `<span class="chip c-str">STR ${str > 0 ? '+' : ''}${str}</span>`;
  if(who && who.dex) h += `<span class="chip c-dex">DEX ${who.dex > 0 ? '+' : ''}${who.dex}</span>`;
  if(thorns) h += `<span class="chip c-thorn">THORNS ${thorns}</span>`;
  if(who && who.plated) h += `<span class="chip c-plated">PLATE ${who.plated}</span>`;
  if(who && who.intangible) h += `<span class="chip c-intan">INTANG ${who.intangible}</span>`;
  if(st.artifact) h += `<span class="chip c-art">ARTIFACT ${st.artifact}</span>`;
  if(st.weak) h += `<span class="chip c-weak">WEAK ${st.weak}</span>`;
  if(st.vuln) h += `<span class="chip c-vuln">VULN ${st.vuln}</span>`;
  if(st.frail) h += `<span class="chip c-frail">FRAIL ${st.frail}</span>`;
  if(st.tarnish) h += `<span class="chip c-tarnish">TARN ${st.tarnish}</span>`;
  return h;
}
export function paintPlayer(){
  if(!C) return;
  const e = document.getElementById('enum'); if(e) e.textContent = C.energy;
  const b = document.getElementById('bnum'); if(b) b.textContent = C.block;
  const d = document.getElementById('dnum'); if(d) d.textContent = C.draw.length;
  const x = document.getElementById('xnum'); if(x) x.textContent = C.disc.length;
  const p = document.getElementById('pchips'); if(p) p.innerHTML = chipsHTML(C.st, C.str, C.retal, C);
  const pot = document.getElementById('potbar');
  if(pot) pot.innerHTML = Array.from({length:potMax()}, (_,i) => i).map(i => G.pots[i]
    ? `<span class="pot${POTSEL === i ? ' sel' : ''}" data-a="pot" data-i="${i}">${glyph(POTS[G.pots[i]].g)}</span>`
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
  if(!e.alive) return;
  if(POTSEL !== null){ const p = POTSEL; setPOTSEL(null); usePot(p, e); return; }
  if(SEL === null) return;
  playCard(SEL, e);
}
export function usePot(i, target){
  const k = G.pots[i]; if(!k) return;
  const p = POTS[k];
  if(p.combat && !C) return;
  /* the Moth spends itself when the run would end; tapping it does nothing */
  if(p.passive){ banner('It waits for the worst'); return; }
  if(p.tg && C){
    const live = C.foes.filter(f => f.alive);
    if(!live.length) return;
    if(live.length > 1 && !target){        // more than one plate on the table: ask
      setPOTSEL(i); setSEL(null); Snd.play('select'); renderCombat(); return;
    }
    target = target || live[0];
  }
  setPOTSEL(null);
  G.pots.splice(i,1);
  Snd.play('pot');
  p.use(Math.max(1, mod('potPotency', 1)), target);
  fire('potionUsed', k);
  if(C) renderCombat(); else paintBar();
  save();
}
export function showPile(which){
  const list = which === 'draw'
    ? (mod('drawOrder', false) ? [...C.draw].reverse() : [...C.draw].sort((a,b) => CARDS[a.id].n.localeCompare(CARDS[b.id].n)))
    : C.disc;
  openSheet(`<header><span class="title">${which === 'draw' ? 'Draw pile' : 'Spent pile'}</span>
    <span class="tag">${list.length} cards</span></header>
    <div class="body"><div class="grid">${list.map(c => cardHTML(c)).join('') || '<span class="tag">empty</span>'}</div></div>
    <footer><button class="btn" data-a="close">Close</button></footer>`);
}

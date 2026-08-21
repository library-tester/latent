/* The two ways a run stops. */

import { Snd } from '../core/audio.js';
import { best, clearRun } from '../core/persist.js';
import { DEAD, G, setC, setDEAD } from '../core/state.js';
import { ROMAN } from '../core/util.js';
import { ACTS } from '../data/acts.js';
import { ENEMIES } from '../data/enemies.js';
import { nodeAt } from '../game/map.js';
import { closeSheet, paintBar, setScene } from './chrome.js';

/* ══════════════ endings ══════════════ */
export function gameOver(){
  if(DEAD) return; setDEAD(true);
  Snd.stopDrone(); Snd.play('lose');
  setC(null); clearRun(); closeSheet();
  const depth = G.at !== null ? nodeAt(G.at).r + 1 : 1;
  const score = G.act*1000 + depth;
  best().then(b => { if(score > b) best(score); });
  paintBar();
  setScene(`<div class="center pad">
    <div class="tag">The plate fogs</div>
    <div id="titlemark" style="font-size:clamp(30px,11vw,48px);color:var(--rust)">FOGGED</div>
    <div class="sub">You went dark on plate ${ROMAN[depth-1]} of ${(ACTS[G.act]||ACTS[1]).n}. The archive keeps what it takes.</div>
    <div class="row"><button class="btn primary" data-a="new">Descend again</button>
      <button class="btn ghost" data-a="title">Title</button></div></div>`);
}
export function victory(){
  const slain = ENEMIES[G.boss] ? ENEMIES[G.boss].n : 'The Aperture';
  setC(null); clearRun(); best(4000);
  paintBar();
  setScene(`<div class="center pad">
    <div class="tag">Three acts</div>
    <div id="titlemark" style="font-size:clamp(30px,11vw,48px);color:var(--sun)">FIXED</div>
    <div class="sub">${slain} is pinned to its own plate. The image holds — for now.</div>
    <div class="tag">${G.deck.length} cards · ${G.relics.length} relics · ${G.gold} gold</div>
    <div class="row"><button class="btn primary" data-a="new">Descend again</button>
      <button class="btn ghost" data-a="title">Title</button></div></div>`);
}

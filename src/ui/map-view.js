/* Drawing the act map, and walking onto a node. */

import { Snd } from '../core/audio.js';
import { save } from '../core/persist.js';
import { G, setC, setEV, setPENDING, setRW } from '../core/state.js';
import { ROMAN } from '../core/util.js';
import { ACTS } from '../data/acts.js';
import { startCombat } from '../game/combat.js';
import { nodeAt, openNodes } from '../game/map.js';
import { closeSheet, paintBar, setScene } from './chrome.js';
import { eventScene, restScene, shopScene, treasureScene } from './rooms.js';

/* ══════════════ map ══════════════ */
export const NODEGLYPH = {
  fight:'<path d="M2 2l6 6M8 2l-6 6"/>',
  elite:'<path d="M5 0.6l1.4 3 3.1.4-2.3 2.2.6 3.2L5 7.8 2.2 9.4l.6-3.2L.5 4l3.1-.4z"/>',
  rest:'<circle cx="5" cy="4.2" r="2.6"/><path d="M3.6 7.6h2.8M4.1 9h1.8"/>',
  shop:'<path d="M1.8 3.6h6.4l-.7 5.4H2.5z"/><path d="M3.4 3.6V2.4a1.6 1.6 0 0 1 3.2 0v1.2"/>',
  treasure:'<path d="M1.4 4h7.2v5H1.4z"/><path d="M1.4 4l1-2h5.2l1 2M5 4v5"/>',
  event:'<path d="M3.2 3.4a1.8 1.8 0 1 1 1.8 2.1v1.1"/><path d="M5 8.8v.3"/>',
  boss:'<path d="M1.9 5.1a3.1 3.1 0 1 1 6.2 0v1.8l-1 .9v1.4H2.9V7.8l-1-.9z"/><circle cx="3.7" cy="5.1" r=".9"/><circle cx="6.3" cy="5.1" r=".9"/>',
};
export function toMap(){ setC(null); setRW(null); setEV(null); setPENDING(null); Snd.stopDrone(); closeSheet(); paintBar(); save(); renderMap(); }
export function renderMap(){
  const M = G.map, W = 20 + (M.cols-1)*17 + 20, RH = 17, TOP = 12;
  const H = TOP + M.rows*RH;
  const px = n => 20 + n.c*17, py = n => H - (TOP + n.r*RH);
  const open = openNodes(), here = G.at;
  const passed = i => G.seen.includes(i);
  let s = `<svg id="mapsvg" viewBox="0 0 ${W} ${H}" style="height:${H*3.4}px">`;
  M.edges.forEach(([a,b]) => {
    const A = nodeAt(a), B = nodeAt(b);
    const live = (here === a && open.includes(b)) || (passed(a) && passed(b));
    s += `<path class="edge ${live?'live':''}" d="M${px(A)} ${py(A)-5} L${px(B)} ${py(B)+5}"/>`;
  });
  for(let r=0; r<M.rows; r++)
    s += `<text class="rowlab" x="2" y="${H-(TOP+r*RH)+1}">${ROMAN[r]}</text>`;
  M.nodes.forEach((n,i) => {
    const st = here===i ? 'here' : open.includes(i) ? 'open' : passed(i) ? 'done' : '';
    const x = px(n), y = py(n);
    s += `<g class="nd-hit ${st}" data-a="node" data-i="${i}">
      ${st==='open' ? `<circle class="nd-pulse" cx="${x}" cy="${y}" r="5"/>` : ''}
      <circle class="nd-ring" cx="${x}" cy="${y}" r="5.2"/>
      <g class="nd-glyph" transform="translate(${x-3},${y-3}) scale(0.6)">${NODEGLYPH[n.type]}</g>
      <circle cx="${x}" cy="${y}" r="8" fill="transparent"/></g>`;
  });
  s += '</svg>';
  const A = ACTS[G.act] || ACTS[1];
  setScene(`<div class="pad" style="padding-bottom:4px;display:flex;align-items:baseline;gap:10px">
      <span class="tag">${A.n}</span><span class="sp" style="flex:1"></span>
      <span class="tag">${here===null ? 'choose an entry' : 'plate ' + ROMAN[nodeAt(here).r] + ' of ' + ROMAN[M.rows-1]}</span></div>
    <div id="mapwrap">${s}</div>`);
  const wrap = document.getElementById('mapwrap');
  const cur = document.querySelector('.nd-hit.here') || document.querySelector('.nd-hit.open');
  if(cur){ const r = cur.getBoundingClientRect(), w = wrap.getBoundingClientRect();
    wrap.scrollTop += (r.top - w.top) - w.height*0.62; }
}
export function enterNode(i){
  const open = openNodes();
  if(!open.includes(i)) return;
  G.seen.push(i); G.at = i; save();
  const n = nodeAt(i);
  if(n.type === 'fight' || n.type === 'elite' || n.type === 'boss') startCombat(n.type === 'fight' ? 'fight' : n.type, n.r);
  else if(n.type === 'rest') restScene();
  else if(n.type === 'shop') shopScene(n);
  else if(n.type === 'treasure') treasureScene();
  else eventScene();
}

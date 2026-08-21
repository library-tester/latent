/* Map generation. Edges are laid left to right so that two of them can never cross. */

import { G } from '../core/state.js';
import { R, pick, shuffle } from '../core/util.js';
import { ROW_PLAN } from '../data/acts.js';

export function genMap(){
  const plan = ROW_PLAN[G.act] || ROW_PLAN[1];
  const ROWS = plan.length, COLS = 7;
  const nodes = [], edges = [];
  const addNode = (r,c) => { nodes.push({r,c,type:null}); return nodes.length-1; };
  // build edges one row-transition at a time, left to right, so that every
  // edge's target column is >= the previous source's target column — that
  // invariant is what makes two edges cross, so enforcing it rules crossings
  // out by construction instead of generating paths and hoping they miss.
  const startCols = shuffle([0,1,2,3,4,5,6]).slice(0,4).sort((a,b) => a-b);
  let cur = startCols.map(c => ({ c, i: addNode(0,c) }));
  for(let r=0; r<ROWS-1; r++){
    const toBoss = r+1 === ROWS-1;
    const base = []; let lastTarget = -1;
    cur.forEach(src => {
      const t = toBoss ? 3 : (() => {
        const lo = Math.max(0, src.c-1, lastTarget), hi = Math.min(COLS-1, src.c+1);
        return lo + R(hi-lo+1);
      })();
      base.push(t); lastTarget = t;
    });
    const extra = base.map(() => []);
    if(!toBoss) cur.forEach((src, idx) => {
      // cap how far right a branch can reach: it must stay left of wherever
      // the next source's own edge lands, or the two would cross.
      const cap = Math.min(COLS-1, src.c+2, idx+1 < base.length ? base[idx+1] : COLS-1);
      if(base[idx] >= cap) return;
      if(Math.random() < 0.42){
        const t2 = base[idx] + 1 + (base[idx]+2<=cap && Math.random()<0.4 ? 1 : 0);
        extra[idx].push(t2);
        // occasionally a node splits three ways, like Spire's busier junctions
        if(t2 < cap && Math.random() < 0.15) extra[idx].push(t2+1);
      }
    });
    const nextByCol = new Map();
    const colFor = c => { if(!nextByCol.has(c)) nextByCol.set(c, addNode(r+1, c)); return nextByCol.get(c); };
    cur.forEach((src, idx) => {
      edges.push([src.i, colFor(base[idx])]);
      extra[idx].forEach(t => edges.push([src.i, colFor(t)]));
    });
    cur = [...nextByCol.entries()].sort((a,b) => a[0]-b[0]).map(([c,i]) => ({c,i}));
  }
  nodes.forEach(n => n.type = pick(plan[n.r]));
  // guarantee the run always contains places to spend gold and things to find
  const force = (type, lo, hi) => {
    const band = nodes.filter(n => n.r >= lo && n.r <= hi);
    if(band.some(n => n.type === type)) return;
    const free = band.filter(n => n.type === 'fight');
    if(free.length) pick(free).type = type;
  };
  const at = f => Math.round((ROWS-2) * f);   // bands scale with the act's height
  force('shop', at(.15), at(.55)); force('shop', at(.6), at(.95));
  force('event', at(.07), at(.42)); force('event', at(.47), at(.85));
  return { nodes, edges, rows:ROWS, cols:COLS };
}
export const nodeAt = i => G.map.nodes[i];
export const openNodes = () => G.at === null
  ? G.map.nodes.map((n,i)=>i).filter(i => nodeAt(i).r === 0)
  : G.map.edges.filter(e => e[0] === G.at).map(e => e[1]);

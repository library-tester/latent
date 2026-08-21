/* The relic trigger bus.

   Relics used to be 23 hardcoded `hasR('id')` checks scattered through combat,
   the shop, the map and the rest rooms. That does not scale past a handful, so
   a relic is now data with handlers on it, and the engine announces what just
   happened. A relic that wants to know about it defines a method of that name.

   Two shapes:
     fire(ev, ...args)      — announce; every listener runs for its side effects
     mod(ev, value, ...)    — thread a value through; each handler returns a new
                              one (or undefined to leave it alone)

   Handlers run in the order the relics were collected, which is the order they
   sit in the top bar, so a player can always see why a number came out as it did. */

import { G } from '../core/state.js';
import { RELICS } from '../data/relics.js';

export function fire(ev, ...args){
  if(!G || !G.relics) return;
  for(const id of G.relics){
    const d = RELICS[id];
    if(d && d[ev]) d[ev](...args);
  }
}

export function mod(ev, v, ...args){
  if(!G || !G.relics) return v;
  for(const id of G.relics){
    const d = RELICS[id];
    if(d && d[ev]){
      const r = d[ev](v, ...args);
      if(r !== undefined) v = r;
    }
  }
  return v;
}

/* Counters a relic needs to keep. `rc` on the combat resets every fight;
   `rc` on the run persists for the whole descent. */
export const tick = (bag, k, every) => {
  bag[k] = (bag[k] || 0) + 1;
  if(bag[k] < every) return false;
  bag[k] = 0;
  return true;
};

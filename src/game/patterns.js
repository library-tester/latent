/* Enemy AI patterns.

   An enemy's `ai(e, t)` returns the key of the move it will take next turn,
   where `t` is how many turns that enemy has already acted. Written inline
   these were all bespoke ternaries, which kept every bestiary entry to two or
   three moves and one shape of behaviour. These are the shapes the Spire
   actually uses, as composable pieces:

     cycle('a','b','c')            fixed loop
     opener('a', rest)             a scripted first turn, then `rest`
     weighted({a:70, b:30})        roll, by weight
     limit(2, roll)                ...but never the same move 3 turns running
     wounded(.5, hurt, healthy)    a different pattern once it is bloodied
     once('a', when, rest)         one scripted move, the first time it applies

   `limit` is the important one: the Spire's enemies almost all roll from a
   weighted table under a "not more than N in a row" rule, which is what stops
   a random pattern from feeling either scripted or unfair. It needs `e.streak`,
   which game/combat.js maintains as each enemy acts. */

/* Fixed loop, indexed by the enemy's own turn count. */
export const cycle = (...keys) => (e, t) => keys[t % keys.length];

/* A scripted opening move, then hand the rest of the fight to another pattern.
   `t` is rebased so a cycle after the opener starts at its own first entry. */
export const opener = (first, then) => (e, t) => (t === 0 ? first : then(e, t - 1));

/* Roll one key by weight. Weights are relative; they need not sum to anything. */
export function weighted(table){
  const keys = Object.keys(table);
  const total = keys.reduce((n, k) => n + table[k], 0);
  return () => {
    let r = Math.random() * total;
    for(const k of keys){ r -= table[k]; if(r < 0) return k; }
    return keys[keys.length - 1];
  };
}

/* Wrap a roll so one move never lands more than `max` times in a row. Re-rolls
   rather than substituting, so the underlying weights stay honest; if every
   option is the blocked one, it gives up and lets the repeat through rather
   than deadlocking. */
export function limit(max, roll){
  return (e, t) => {
    for(let i = 0; i < 40; i++){
      const k = roll(e, t);
      if(k !== e.last || (e.streak || 0) < max) return k;
    }
    return roll(e, t);
  };
}

/* Two patterns, switched on a share of remaining health. */
export const wounded = (pct, hurt, healthy) => (e, t) =>
  (e.hp <= e.maxHp * pct ? hurt : healthy)(e, t);

/* Fire `key` the first turn `when(e, t)` holds, once per fight, then fall
   through to `rest` for good. */
export function once(key, when, rest){
  return (e, t) => {
    if(!e.spent) e.spent = {};
    if(!e.spent[key] && when(e, t)){ e.spent[key] = 1; return key; }
    return rest(e, t);
  };
}

/* ── conditions, for `once` and for hand-written ai() ─────────── */
export const hurt = e => !!e.hurt;                       // has taken any damage
export const atTurn = n => (e, t) => t >= n;
export const below = pct => e => e.hp <= e.maxHp * pct;

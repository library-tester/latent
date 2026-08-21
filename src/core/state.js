/* The mutable heart of the game: the run, the fight, and the UI scratch state. */

/* Reassigning an imported binding is not allowed, so every one of these gets a
   setter. Reading is free — ES module bindings are live, so `G` seen from any
   module is always the current run. Mutating a field (`G.hp`, `C.energy`) needs
   no setter at all; only swapping the whole object does. */
export let G = null;        /* the run: deck, relics, gold, map, act */
export let C = null;        /* the fight in progress, or null outside combat */
export let SEL = null;      /* hand index of a card waiting for a target */
export let BUSY = false;    /* true while the enemy turn resolves */
export let PENDING = null;  /* an open card picker and where it returns to */
export let EV = null;       /* the event room on screen */
export let RW = null;       /* the spoils rolled for the reward screen */
export let DEAD = false;    /* guards gameOver() against firing twice */
export let NEXT = null;     /* where the relic sheet's Continue button leads */

export const setG       = v => (G = v);
export const setC       = v => (C = v);
export const setSEL     = v => (SEL = v);
export const setBUSY    = v => (BUSY = v);
export const setPENDING = v => (PENDING = v);
export const setEV      = v => (EV = v);
export const setRW      = v => (RW = v);
export const setDEAD    = v => (DEAD = v);
export const setNEXT    = v => (NEXT = v);

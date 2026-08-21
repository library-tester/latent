/* Ampoules: one-shot consumables, at most three (four with Vellum). */

import { C } from '../core/state.js';
import { blk, drawC, hitAll, light } from '../game/combat.js';
import { heal } from '../game/run.js';

/* ── ampoules (potions) ───────────────────────────────────────── */
export const POTS = {
flashp:{n:'Flash Powder',g:'burst',d:'Deal 12 damage to ALL enemies.',combat:1,use:()=>hitAll(12)},
balm:{n:'Balm Ampoule',g:'drop',d:'Heal 15 HP.',use:()=>heal(15)},
lux:{n:'Lux Ampoule',g:'sun',d:'Gain 12 Light.',combat:1,use:()=>light(12)},
collodion:{n:'Collodion',g:'shield',d:'Gain 18 Block.',combat:1,use:()=>blk(18)},
pushamp:{n:'Push Ampoule',g:'bolt',d:'Gain 2 Energy. Draw 2.',combat:1,use:()=>{if(C)C.energy+=2;drawC(2);}},
};

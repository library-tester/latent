/* Relics: permanent, passive run modifiers. */

import { G } from '../core/state.js';

/* ── relics ───────────────────────────────────────────────────── */
export const RELICS = {
safelamp:{n:'Cracked Safelight',g:'eye',d:'Start each combat with 3 Light.'},
nitrate:{n:'Silver Nitrate',g:'vial',d:'Start each combat with 8 Light.'},
apron:{n:'Lead Apron',g:'shield',d:'Attacks against you deal 2 less damage.'},
brass:{n:'Brass Shutter',g:'plate',d:'Start each combat with 6 Block.'},
needle:{n:'Etching Needle',g:'pin',d:'Start each combat with 1 Strength.'},
belljar:{n:'Cracked Bell Jar',g:'fog',d:'Enemies start combat with 1 Weak.'},
loupe:{n:'Loupe',g:'lens',d:'Draw 1 additional card each turn.'},
balsam:{n:'Balsam Tin',g:'drop',d:'Heal 6 HP after each combat.'},
purse:{n:"Collector's Purse",g:'hand',d:'Gain 25% more gold.'},
specpin:{n:'Specimen Pin',g:'swarm',d:'When you Exhaust a card, deal 3 damage to a random enemy.'},
ferro:{n:'Ferrotype Plate',g:'plate',d:'Raise Max HP by 12.'},
cell:{n:'Spare Cell',g:'bolt',d:'Gain 1 extra Energy on your first turn.'},
bath:{n:'Fixer Bath',g:'drop',d:'Whenever you gain Light, gain 1 Block.'},
darkkey:{n:'Darkroom Key',g:'key',d:'Resting heals an extra 15% of Max HP.'},
contactframe:{n:'Contact Frame',g:'plate',d:'The first card you play each turn costs 1 less.'},
sunlens:{n:'Sun Lens',g:'lens',d:'Whenever you spend Light, deal 4 damage to ALL enemies.'},
bonefolder:{n:'Bone Folder',g:'hand',d:'Gain 3 Block at the end of your turn.'},
ratstooth:{n:"Rat's Tooth",g:'pin',d:'Your first attack each turn deals 3 more damage.'},
vellum:{n:'Vellum Sleeve',g:'cards',d:'You can carry a fourth ampoule.'},
foggedlens:{n:'Fogged Lens',g:'fog',d:'Enemies start each combat with 1 Vulnerable.'},
ledger:{n:"Archivist's Ledger",g:'key',d:'Gain 10 gold after each combat.'},
pinhole:{n:'Pinhole',g:'eye',d:'The first time you drop below 30% HP in a combat, gain 20 Block.'},
blackglass:{n:'Black Glass',g:'burst',d:'Gain 1 Energy each turn. Lose 10 Max HP.',boss:1},
};
export const hasR = id => G.relics.includes(id);

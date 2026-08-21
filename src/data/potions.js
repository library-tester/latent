/* Ampoules: one-shot consumables, three at a time (four with a Vellum Sleeve).

   An entry is data plus a `use` function:

     n  name          g  glyph        d  description
     r  drop tier     common | uncommon | rare
     combat:1         only usable inside a fight
     tg:1             needs an enemy picked first
     use(m, e)        m is the potency multiplier (Sacred Bark doubles it),
                      e is the chosen enemy for a targeted ampoule

   Each notes the Spire potion it is modelled on; the names are the archive's own.
   Ampoules that ask the player something open a flow from ui/sheets.js. */

import { C, G } from '../core/state.js';
import { R, mk, pick } from '../core/util.js';
import { CARDS } from './cards.js';
import { blk, drawC, escapeCombat, est, hit, hitAll, light, playTopCards, pow } from '../game/combat.js';
import { fillPotions, heal, raiseMaxHp } from '../game/run.js';
import { banner, fxSelf } from '../ui/fx.js';

/* card pools the choice ampoules draw from */
const ofType = t => Object.keys(CARDS).filter(k => CARDS[k].t === t
  && CARDS[k].r !== 'curse' && CARDS[k].r !== 'starter');
const anyCard = () => Object.keys(CARDS).filter(k => CARDS[k].r !== 'curse' && CARDS[k].r !== 'starter');
const three = pool => { const p = [...pool]; const out = [];
  for(let i = 0; i < 3 && p.length; i++) out.push(mk(p.splice(R(p.length), 1)[0]));
  return out; };
/* the sheets live in the UI; pulled in on use so this stays a data module */
const flow = (name, ...args) => import('../ui/sheets.js').then(m => m[name](...args));

export const POTS = {

/* ══════════════ common ══════════════ */
collodion:{n:'Collodion',g:'shield',r:'common',d:'Gain 18 Block.',combat:1,   // Block Potion
  use:m=>blk(18*m,true)},
flashp:{n:'Flash Powder',g:'burst',r:'common',d:'Deal 12 damage to ALL enemies.',combat:1,   // Explosive Potion
  use:m=>hitAll(12*m)},
lux:{n:'Lux Ampoule',g:'sun',r:'common',d:'Gain 12 Light.',combat:1,
  use:m=>light(12*m)},
balm:{n:'Balm Ampoule',g:'drop',r:'common',d:'Heal 15 HP.',
  use:m=>heal(15*m)},
bloodpot:{n:'Blood Ampoule',g:'heart',r:'common',d:'Heal 20% of your Max HP.',   // Blood Potion
  use:m=>heal(Math.floor(G.maxHp*0.2)*m)},
firepot:{n:'Fire Ampoule',g:'flame',r:'common',d:'Deal 20 damage to one enemy.',combat:1,tg:1,   // Fire Potion
  use:(m,e)=>hit(e,20*m)},
fearpot:{n:'Fogging Ampoule',g:'fog',r:'common',d:'Apply 3 Vulnerable to one enemy.',combat:1,tg:1,   // Fear Potion
  use:(m,e)=>est(e,'vuln',3*m)},
weakpot:{n:'Bleach Ampoule',g:'drop',r:'common',d:'Apply 3 Weak to one enemy.',combat:1,tg:1,   // Weak Potion
  use:(m,e)=>est(e,'weak',3*m)},
poisonpot:{n:'Verdigris Ampoule',g:'vial',r:'common',d:'Apply 6 Tarnish to one enemy.',combat:1,tg:1,   // Poison Potion
  use:(m,e)=>est(e,'tarnish',6*m)},
strpot:{n:'Etchant',g:'pin',r:'common',d:'Gain 2 Strength.',combat:1,   // Strength Potion
  use:m=>{C.str+=2*m;fxSelf('+'+(2*m)+' STR','lit');}},
dexpot:{n:'Gum Arabic',g:'ingot',r:'common',d:'Gain 2 Dexterity.',combat:1,   // Dexterity Potion
  use:m=>{C.dex+=2*m;fxSelf('+'+(2*m)+' DEX','lit');}},
flexpot:{n:'Quick Etch',g:'bolt',r:'common',d:'Gain 5 Strength. Lose it at the end of your turn.',combat:1,   // Flex Potion
  use:m=>{C.str+=5*m;C.tempStr+=5*m;fxSelf('+'+(5*m)+' STR','lit');}},
speedpot:{n:'Quick Gum',g:'wave',r:'common',d:'Gain 5 Dexterity. Lose it at the end of your turn.',combat:1,   // Speed Potion
  use:m=>{C.dex+=5*m;C.tempDex+=5*m;fxSelf('+'+(5*m)+' DEX','lit');}},
swiftpot:{n:'Draw Ampoule',g:'cards',r:'common',d:'Draw 3 cards.',combat:1,   // Swift Potion
  use:m=>drawC(3*m)},
bronzepot:{n:'Liquid Bronze',g:'anvil',r:'common',d:'Gain 3 Thorns for the rest of the combat.',combat:1,   // Liquid Bronze
  use:m=>{C.thorns+=3*m;C.retal+=3*m;fxSelf('+'+(3*m)+' THORNS','lit');}},
atkpot:{n:'Plate Ampoule',g:'blade',r:'common',d:'Choose 1 of 3 Attacks. It costs 0 this turn.',combat:1,   // Attack Potion
  use:()=>flow('potionPick', three(ofType('attack')), 'Three plates rise in the tray.')},
skillpot:{n:'Solution Ampoule',g:'drop',r:'common',d:'Choose 1 of 3 Skills. It costs 0 this turn.',combat:1,   // Skill Potion
  use:()=>flow('potionPick', three(ofType('skill')), 'The solution clears.')},
powerpot:{n:'Developer Ampoule',g:'burst',r:'common',d:'Choose 1 of 3 Powers. It costs 0 this turn.',combat:1,   // Power Potion
  use:()=>flow('potionPick', three(ofType('power')), 'Something latent comes forward.')},
gamblerpot:{n:"Gambler's Brew",g:'twin',r:'common',d:'Discard any number of cards, then draw that many.',combat:1,   // Gambler's Brew
  use:()=>flow('handSelect','discard')},

/* ══════════════ uncommon ══════════════ */
pushamp:{n:'Push Ampoule',g:'bolt',r:'uncommon',d:'Gain 2 Energy. Draw 2.',combat:1,   // Energy Potion
  use:m=>{if(C)C.energy+=2*m;drawC(2*m);}},
ancientpot:{n:'Ancient Varnish',g:'plate',r:'uncommon',d:'Gain 1 Artifact.',combat:1,   // Ancient Potion
  use:m=>{C.st.artifact+=1*m;fxSelf('ARTIFACT','blk');}},
steelpot:{n:'Essence of Steel',g:'shield',r:'uncommon',d:'Gain 4 Plated Armour.',combat:1,   // Essence of Steel
  use:m=>{C.plated+=4*m;fxSelf('+'+(4*m)+' PLATE','blk');}},
regenpot:{n:'Regen Ampoule',g:'heart',r:'uncommon',d:'Gain 5 Regeneration.',combat:1,   // Regen Potion
  use:m=>{pow('regen',5*m);}},
duppot:{n:'Duplication Ampoule',g:'twin',r:'uncommon',d:'Your next card is played twice.',combat:1,   // Duplication Potion
  use:m=>{C.dup+=1*m;banner('Doubled');}},
chaospot:{n:'Distilled Chaos',g:'crack',r:'uncommon',d:'Play the top 3 cards of your draw pile.',combat:1,   // Distilled Chaos
  use:m=>playTopCards(3*m)},
forgepot:{n:'Blessing of the Forge',g:'anvil',r:'uncommon',d:'Refine every card in your hand for this combat.',combat:1,   // Blessing of the Forge
  use:()=>{C.hand.forEach(c=>{if(CARDS[c.id].r!=='curse')c.lvl=1;});banner('Refined');}},
memorypot:{n:'Liquid Memories',g:'spool',r:'uncommon',d:'Return a card from your spent pile to your hand. It costs 0.',combat:1,   // Liquid Memories
  use:()=>flow('discardPick')},
elixirpot:{n:'Elixir',g:'vial',r:'uncommon',d:'Exhaust any number of cards in your hand.',combat:1,   // Elixir
  use:()=>flow('handSelect','exhaust')},
colorlesspot:{n:'Archive Ampoule',g:'cards',r:'uncommon',d:'Choose 1 of 3 cards of any kind. It costs 0 this turn.',combat:1,   // Colorless Potion
  use:()=>flow('potionPick', three(anyCard()), 'The archive offers three at random.')},

/* ══════════════ rare ══════════════ */
cultistpot:{n:'Cultist Brew',g:'skull',r:'rare',d:'Gain 3 Strength at the start of each turn.',combat:1,   // Cultist Potion
  use:m=>{pow('recip',3*m);}},
ironpot:{n:'Heart of Iron',g:'ingot',r:'rare',d:'Gain 6 Block at the start of each turn.',combat:1,   // Heart of Iron
  use:m=>{pow('fixb',6*m);}},
ghostpot:{n:'Ghost in a Jar',g:'fog',r:'rare',d:'Gain 3 Intangible.',combat:1,   // Ghost in a Jar
  use:m=>{C.intangible+=3*m;banner('Intangible');}},
sneckopot:{n:'Snecko Oil',g:'eye',r:'rare',d:'Draw 5 cards and scramble the cost of your hand.',combat:1,   // Snecko Oil
  use:m=>{drawC(5*m);if(C)C.hand.forEach(c=>{if(!CARDS[c.id].xc)c.rnd=R(4);});}},
smokepot:{n:'Smoke Bomb',g:'fog',r:'rare',d:'Escape from a combat that is not a boss.',combat:1,   // Smoke Bomb
  use:()=>{ if(!escapeCombat()) banner('It will not let you go'); }},
fruitpot:{n:'Fruit Juice',g:'heart',r:'rare',d:'Raise Max HP by 5.',   // Fruit Juice
  use:m=>raiseMaxHp(5*m)},
entropicpot:{n:'Entropic Brew',g:'burst',r:'rare',d:'Fill every empty ampoule slot.',   // Entropic Brew
  use:()=>{ const n = fillPotions(); banner(n ? 'Brewed ' + n : 'No room'); }},
fairypot:{n:'Moth in a Bottle',g:'moth',r:'rare',d:'When you would die, this breaks and heals 30% of your Max HP.',
  passive:1,   // Fairy in a Bottle — spends itself, never tapped
  use:()=>banner('It waits')},
};

/* Spire's split: two thirds common, a quarter uncommon, the rest rare. */
export function rollPotion(){
  const r = Math.random()*100;
  const want = r < 65 ? 'common' : r < 90 ? 'uncommon' : 'rare';
  const p = Object.keys(POTS).filter(k => POTS[k].r === want);
  return p.length ? pick(p) : pick(Object.keys(POTS));
}

/* Relics: permanent, passive run modifiers.

   A relic is data plus handlers. The engine announces events through
   game/hooks.js and any relic defining a method of that name answers, so no
   relic effect is written into the engine itself. Two handler shapes:

     listener:  combatStart(kind){...}      run for the side effect
     modifier:  dmgIn(v){ return v-2; }     thread a value through

   `r` is the drop tier — common / uncommon / rare / boss / shop / event, and
   'starter' for the one you begin with. Each entry notes the Spire relic it
   is modelled on; names are this archive's own.

   Counters live on C.rc (cleared every combat) and G.rc (kept for the run). */

import { C, G, NEXT, setNEXT } from '../core/state.js';
import { R, mk, pick, shuffle } from '../core/util.js';
import { CARDS } from './cards.js';
import { rollPotion } from './potions.js';
import { tick } from '../game/hooks.js';
import { blk, dmgEnemy, drawC, est, hitAll, toHand } from '../game/combat.js';
import { addGold, gainCard, grantRelic, heal, raiseMaxHp, rollRelic,
         transformCard, upgradeRandom, upgradeType } from '../game/run.js';
import { banner, fxSelf } from '../ui/fx.js';

export const hasR = id => !!(G && G.relics && G.relics.includes(id));

/* Queue a flow to run when the "Acquired" sheet is dismissed, keeping whatever
   was going to happen next. Relics that ask the player something use this. */
const after = fn => { const nxt = NEXT; setNEXT(() => fn(nxt)); };
const alive = () => (C ? C.foes.filter(f => f.alive) : []);
const typePool = t => Object.keys(CARDS).filter(k => CARDS[k].t === t && CARDS[k].r !== 'curse'
  && CARDS[k].r !== 'starter');

export const RELICS = {

/* ══════════════ starter ══════════════ */
safelamp:{n:'Cracked Safelight',g:'eye',r:'starter',d:'Start each combat with 3 Light.',
  combatStart(){ C.light += 3; }},

/* ══════════════ common ══════════════ */
brass:{n:'Brass Shutter',g:'plate',r:'common',d:'Start each combat with 6 Block.',   // Anchor
  combatStart(){ blk(6, true); }},
needle:{n:'Etching Needle',g:'pin',r:'common',d:'Start each combat with 1 Strength.',   // Vajra
  combatStart(){ C.str += 1; }},
belljar:{n:'Cracked Bell Jar',g:'fog',r:'common',d:'Enemies start combat with 1 Weak.',   // Red Mask
  combatStart(){ C.foes.forEach(e => e.st.weak += 1); }},
foggedlens:{n:'Fogged Lens',g:'fog',r:'common',d:'Enemies start each combat with 1 Vulnerable.',   // Bag of Marbles
  combatStart(){ C.foes.forEach(e => e.st.vuln += 1); }},
apron:{n:'Lead Apron',g:'shield',r:'common',d:'Attacks against you deal 2 less damage.',
  dmgIn(v){ return Math.max(0, v - 2); }},
balsam:{n:'Balsam Tin',g:'drop',r:'common',d:'Heal 6 HP after each combat.',   // Burning Blood
  combatWon(){ heal(6); }},
purse:{n:"Collector's Purse",g:'hand',r:'common',d:'Gain 25% more gold.',   // Golden Idol
  gold(v){ return Math.round(v * 1.25); }},
ferro:{n:'Ferrotype Plate',g:'plate',r:'common',d:'Raise Max HP by 12.',   // Strawberry
  onGain(){ raiseMaxHp(12); }},
cell:{n:'Spare Cell',g:'bolt',r:'common',d:'Gain 1 extra Energy on your first turn.',   // Lantern
  energyStart(v, first){ return first ? v + 1 : v; }},
darkkey:{n:'Darkroom Key',g:'key',r:'common',d:'Resting heals an extra 15% of Max HP.',   // Regal Pillow
  restHeal(v){ return v + Math.floor(G.maxHp * 0.15); }},
bonefolder:{n:'Bone Folder',g:'hand',r:'common',d:'Gain 3 Block at the end of your turn.',
  turnEnd(){ blk(3, true); }},
ratstooth:{n:"Rat's Tooth",g:'pin',r:'common',d:'Your first attack each turn deals 3 more damage.',
  attackPlayed(){ if(!C.atkThisTurn) C.bonus = 3; }},
bellows:{n:'Bellows',g:'wave',r:'common',d:'Your first attack each combat deals 8 more damage.',   // Akabeko
  attackPlayed(){ if(!C.rc.bellows){ C.rc.bellows = 1; C.bonus = (C.bonus||0) + 8; } }},
teaset:{n:'Ash Tin',g:'vial',r:'common',d:'On leaving a darkroom, start the next combat with 2 extra Energy.',   // Ancient Tea Set
  rested(){ G.rc.teaset = 1; },
  energyStart(v, first){ if(first && G.rc.teaset){ G.rc.teaset = 0; return v + 2; } return v; }},
artofwar:{n:'Idle Bath',g:'drop',r:'common',d:'If you played no Attacks last turn, gain 1 Energy.',   // Art of War
  turnEnded(){ C.rc.war = C.tAtk === 0 ? 1 : 0; },
  energyStart(v, first){ if(!first && C.rc.war) return v + 1; return v; }},
prepbag:{n:'Loading Bag',g:'cards',r:'common',d:'Draw 2 additional cards on your first turn.',   // Bag of Preparation
  drawCount(v, first){ return first ? v + 2 : v; }},
redampoule:{n:'Red Ampoule',g:'vial',r:'common',d:'Heal 2 HP at the start of each combat.',   // Blood Vial
  combatStart(){ heal(2); }},
scales:{n:'Brass Scales',g:'anvil',r:'common',d:'Start each combat with 3 Thorns.',   // Bronze Scales
  thornsBase(v){ return v + 3; }},
puzzle:{n:'Sealed Puzzle Box',g:'plate',r:'common',d:'The first time you lose HP each combat, draw 3.',   // Centennial Puzzle
  hpLost(){ if(C && !C.rc.puzzle){ C.rc.puzzle = 1; drawC(3); } }},
ceramicfish:{n:'Porcelain Fish',g:'drop',r:'common',d:'Gain 9 gold whenever a card enters your deck.',   // Ceramic Fish
  cardGained(){ addGold(9); }},
dreamcatcher:{n:'Sleeve of Negatives',g:'cards',r:'common',d:'Resting also lets you take a card.',   // Dream Catcher
  restExtra(list){ list.push('rest-card'); return list; }},
happyflower:{n:'Paper Flower',g:'sun',r:'common',d:'Every 3 turns, gain 1 Energy.',   // Happy Flower
  energyStart(v){ return tick(C.rc, 'flower', 3) ? v + 1 : v; }},
mawbank:{n:'Coin Press',g:'ingot',r:'common',d:'Gain 12 gold on each plate you climb, until you spend gold.',   // Maw Bank
  floorClimbed(){ if(!G.rc.mawSpent) addGold(12); },
  goldSpent(){ G.rc.mawSpent = 1; }},
mealticket:{n:'Ration Card',g:'hand',r:'common',d:'Heal 15 HP whenever you enter a shop.',   // Meal Ticket
  enterRoom(t){ if(t === 'shop') heal(15); }},
nunchaku:{n:'Crank Handle',g:'spool',r:'common',d:'Every 10 Attacks you play, gain 1 Energy.',   // Nunchaku
  attackPlayed(){ if(tick(C.rc, 'crank', 10)){ C.energy += 1; fxSelf('+1 ENERGY','lit'); } }},
smoothstone:{n:'Polished Stone',g:'ingot',r:'common',d:'Start each combat with 1 Dexterity.',   // Oddly Smooth Stone
  combatStart(){ C.dex += 1; }},
omamori:{n:'Warding Slip',g:'plate',r:'common',d:'Negate the next 2 Curses you would gain.',   // Omamori
  onGain(){ G.rc.omamori = 2; },
  curseBlocked(v){ if(G.rc.omamori > 0){ G.rc.omamori--; return true; } return v; }},
orichalcum:{n:'Verdigris Plate',g:'shield',r:'common',d:'If you end your turn with no Block, gain 6 Block.',   // Orichalcum
  turnEnd(){ if(C.block === 0) blk(6, true); }},
pennib:{n:'Steel Nib',g:'pin',r:'common',d:'Every 10th Attack you play deals double damage.',   // Pen Nib
  attackPlayed(){ if(tick(C.rc, 'nib', 10)){ C.rc.nibArmed = 1; banner('Nib'); } },
  dmgOut(v){ return C.rc.nibArmed ? v * 2 : v; },
  cardResolved(){ C.rc.nibArmed = 0; }},
vellum:{n:'Vellum Sleeve',g:'cards',r:'common',d:'You can carry a fourth ampoule.',   // Potion Belt
  potMax(v){ return v + 1; }},
preserved:{n:'Preserved Specimen',g:'swarm',r:'common',d:'Elites have 25% less HP.',   // Preserved Insect
  foeHp(v, d, kind){ return kind === 'elite' ? v * 0.75 : v; }},
smilingmask:{n:"Fixer's Grin",g:'skull',r:'common',d:'Scraping a plate at the shop always costs 50 gold.',   // Smiling Mask
  removalPrice(){ return 50; }},
boot:{n:'Lead Boot',g:'blade',r:'common',d:'Attack damage of 4 or less becomes 5.',   // The Boot
  dmgOut(v){ return v > 0 && v <= 4 ? 5 : v; }},
tinychest:{n:'Tin Chest',g:'key',r:'common',d:'Every 4th unmarked room is a sealed cabinet instead.',   // Tiny Chest
  roomSwap(v, t){
    if(t !== 'event') return v;
    G.rc.chest = (G.rc.chest || 0) + 1;
    return G.rc.chest % 4 === 0 ? 'treasure' : v; }},
ornithopter:{n:'Clockwork Moth',g:'moth',r:'common',d:'Heal 5 HP whenever you use an ampoule.',   // Toy Ornithopter
  potionUsed(){ heal(5); }},
warpaint:{n:'Retouching Kit',g:'drop',r:'common',d:'Upgrade 2 random Skills.',   // War Paint
  onGain(){ upgradeType('skill', 2); }},
whetstone:{n:'Hone',g:'blade',r:'common',d:'Upgrade 2 random Attacks.',   // Whetstone
  onGain(){ upgradeType('attack', 2); }},
redskull:{n:'Red Skull',g:'skull',r:'common',d:'While at or below 50% HP, gain 3 Strength.',   // Red Skull
  combatStart(){ if(G.hp <= G.maxHp * 0.5){ C.str += 3; C.rc.skull = 1; } },
  hpLost(){ if(C && !C.rc.skull && G.hp <= G.maxHp * 0.5){ C.rc.skull = 1; C.str += 3; fxSelf('+3 STR','lit'); } }},
tarnishskull:{n:'Verdigris Skull',g:'skull',r:'common',d:'Tarnish you apply is 1 stronger.',   // Snecko Skull
  debuffOut(v, k){ return k === 'tarnish' ? v + 1 : v; }},

/* ══════════════ uncommon ══════════════ */
nitrate:{n:'Silver Nitrate',g:'vial',r:'uncommon',d:'Start each combat with 8 Light.',
  combatStart(){ C.light += 8; }},
loupe:{n:'Loupe',g:'lens',r:'uncommon',d:'Draw 1 additional card each turn.',
  drawCount(v){ return v + 1; }},
bath:{n:'Fixer Bath',g:'drop',r:'uncommon',d:'Whenever you gain Light, gain 1 Block.',
  lightGain(){ C.block += 1; }},
sunlens:{n:'Sun Lens',g:'lens',r:'uncommon',d:'Whenever you spend Light, deal 4 damage to ALL enemies.',
  lightSpend(){ hitAll(4); }},
specpin:{n:'Specimen Pin',g:'swarm',r:'uncommon',d:'When you Exhaust a card, deal 3 damage to a random enemy.',
  exhaust(){ const a = alive(); if(a.length) dmgEnemy(pick(a), 3); }},
contactframe:{n:'Contact Frame',g:'plate',r:'uncommon',d:'The first card you play each turn costs 1 less.',
  cardCost(v){ return C.playedThisTurn ? v : Math.max(0, v - 1); }},
ledger:{n:"Archivist's Ledger",g:'key',r:'uncommon',d:'Gain 10 gold after each combat.',
  combatWon(){ addGold(10); }},
bluecandle:{n:'Blue Candle',g:'flame',r:'uncommon',d:'Curses can be played. Doing so Exhausts them and costs 1 HP.',   // Blue Candle
  canPlayUnplayable(v, c, d){ return d.r === 'curse' ? true : v; }},
bottleflame:{n:'Bottled Flame',g:'flame',r:'uncommon',d:'An Attack of your choice starts each combat in your hand.',   // Bottled Flame
  onGain(){ after(nxt => bottleFlow('attack', nxt)); }},
bottlelight:{n:'Bottled Lightning',g:'bolt',r:'uncommon',d:'A Skill of your choice starts each combat in your hand.',   // Bottled Lightning
  onGain(){ after(nxt => bottleFlow('skill', nxt)); }},
bottlestorm:{n:'Bottled Tornado',g:'wave',r:'uncommon',d:'A Power of your choice starts each combat in your hand.',   // Bottled Tornado
  onGain(){ after(nxt => bottleFlow('power', nxt)); }},
periapt:{n:'Darkstone Periapt',g:'crack',r:'uncommon',d:'Whenever you gain a Curse, raise Max HP by 6.',   // Darkstone Periapt
  curseGained(){ raiseMaxHp(6); }},
feather:{n:'Eternal Feather',g:'moth',r:'uncommon',d:'At a darkroom, heal 3 HP for every 5 cards in your deck.',   // Eternal Feather
  restHeal(v){ return v + Math.floor(G.deck.length / 5) * 3; }},
frozenegg:{n:'Frozen Egg',g:'burst',r:'uncommon',d:'Powers added to your deck are upgraded.',   // Frozen Egg
  cardAdded(c){ if(CARDS[c.id].t === 'power') c.lvl = 1; return c; }},
moltenegg:{n:'Molten Egg',g:'flame',r:'uncommon',d:'Attacks added to your deck are upgraded.',   // Molten Egg
  cardAdded(c){ if(CARDS[c.id].t === 'attack') c.lvl = 1; return c; }},
toxicegg:{n:'Toxic Egg',g:'vial',r:'uncommon',d:'Skills added to your deck are upgraded.',   // Toxic Egg
  cardAdded(c){ if(CARDS[c.id].t === 'skill') c.lvl = 1; return c; }},
gremlinhorn:{n:'Gremlin Horn',g:'swarm',r:'uncommon',d:'When an enemy dies, gain 1 Energy and draw 1.',   // Gremlin Horn
  enemyDied(){ if(C && !C.over){ C.energy += 1; drawC(1); } }},
horncleat:{n:'Horn Cleat',g:'anvil',r:'uncommon',d:'At the start of your 2nd turn, gain 14 Block.',   // Horn Cleat
  turnStart(){ if(C.turn === 2) blk(14, true); }},
inkbottle:{n:'Ink Bottle',g:'vial',r:'uncommon',d:'Every 10 cards you play, draw 1.',   // Ink Bottle
  cardPlayed(){ if(tick(C.rc, 'ink', 10)) drawC(1); }},
kunai:{n:'Etching Kunai',g:'blade',r:'uncommon',d:'Every 3 Attacks in a turn, gain 1 Dexterity.',   // Kunai
  attackPlayed(){ if(C.tAtk % 3 === 0){ C.dex += 1; fxSelf('+1 DEX','lit'); } }},
letteropener:{n:'Letter Opener',g:'blade',r:'uncommon',d:'Every 3 Skills in a turn, deal 5 damage to ALL enemies.',   // Letter Opener
  skillPlayed(){ if(C.tSkill % 3 === 0) hitAll(5); }},
matryoshka:{n:'Nesting Case',g:'plate',r:'uncommon',d:'The next 2 sealed cabinets hold an extra relic.',   // Matryoshka
  onGain(){ G.rc.nest = 2; },
  chestRelics(v){ if(G.rc.nest > 0){ G.rc.nest--; return v + 1; } return v; }},
meat:{n:'Meat on the Bone',g:'heart',r:'uncommon',d:'If you end a combat at or below 50% HP, heal 12.',   // Meat on the Bone
  combatWon(){ if(G.hp <= G.maxHp * 0.5) heal(12); }},
hourglass:{n:'Mercury Hourglass',g:'clock',r:'uncommon',d:'Deal 3 damage to ALL enemies at the start of your turn.',   // Mercury Hourglass
  turnStart(){ hitAll(3); }},
mummyhand:{n:'Mummified Hand',g:'hand',r:'uncommon',d:'When you play a Power, a random card in your hand costs 0.',   // Mummified Hand
  powerPlayed(){ if(C.hand.length) pick(C.hand).free = C.turn; }},
fan:{n:'Ornamental Fan',g:'wave',r:'uncommon',d:'Every 3 Attacks in a turn, gain 4 Block.',   // Ornamental Fan
  attackPlayed(){ if(C.tAtk % 3 === 0) blk(4, true); }},
pantograph:{n:'Pantograph',g:'spool',r:'uncommon',d:'Heal 25 HP at the start of a boss combat.',   // Pantograph
  combatStart(kind){ if(kind === 'boss') heal(25); }},
pear:{n:'Pear',g:'heart',r:'uncommon',d:'Raise Max HP by 10.',   // Pear
  onGain(){ raiseMaxHp(10); }},
questioncard:{n:'Question Card',g:'cards',r:'uncommon',d:'One additional card option in rewards.',   // Question Card
  cardOptions(v){ return v + 1; }},
shuriken:{n:'Shuriken',g:'pin',r:'uncommon',d:'Every 3 Attacks in a turn, gain 1 Strength.',   // Shuriken
  attackPlayed(){ if(C.tAtk % 3 === 0){ C.str += 1; fxSelf('+1 STR','lit'); } }},
singingbowl:{n:'Singing Bowl',g:'wave',r:'uncommon',d:'You may refuse a card reward to raise Max HP by 2 instead.',   // Singing Bowl
  bowl(){ return true; }},
strikedummy:{n:'Strike Dummy',g:'anvil',r:'uncommon',d:'Plain attacks deal 3 additional damage.',   // Strike Dummy
  dmgOut(v, e, base){ return C.rc.plainCard ? v + 3 : v; },
  cardPlayed(c, d){ C.rc.plainCard = d.stk ? 1 : 0; }},
sundial:{n:'Sundial',g:'clock',r:'uncommon',d:'Every 3 times your draw pile shuffles, gain 2 Energy.',   // Sundial
  shuffle(){ if(tick(C.rc, 'sundial', 3)){ C.energy += 2; fxSelf('+2 ENERGY','lit'); } }},
courier:{n:'The Courier',g:'hand',r:'uncommon',d:'The Fixer restocks his shelves, and charges 20% less.',   // The Courier
  shopPrice(v){ return Math.round(v * 0.8); },
  restocks(){ return true; }},
whitebeast:{n:'White Beast Statue',g:'ingot',r:'uncommon',d:'Ampoules always drop after combat.',   // White Beast Statue
  potChance(){ return 1; }},
papercrane:{n:'Paper Crane',g:'moth',r:'uncommon',d:'Weak reduces damage by 40% instead of 25%.',   // Paper Krane
  weakBite(){ return 0.4; }},
paperphrog:{n:'Paper Frog',g:'swarm',r:'uncommon',d:'Vulnerable makes enemies take 75% more damage.',   // Paper Phrog
  vulnBite(){ return 0.75; }},
clay:{n:'Self-Forming Clay',g:'drop',r:'uncommon',d:'Whenever you lose HP in a turn, gain 3 Block next turn.',   // Self-Forming Clay
  hpLost(){ if(C) C.rc.clay = (C.rc.clay || 0) + 3; },
  turnStart(){ if(C.rc.clay){ blk(C.rc.clay, true); C.rc.clay = 0; } }},

/* ══════════════ rare ══════════════ */
pinhole:{n:'Pinhole',g:'eye',r:'rare',d:'The first time you drop below 30% HP in a combat, gain 20 Block.',
  hpLost(){ if(C && !C.rc.pinhole && G.hp > 0 && G.hp <= G.maxHp * 0.3){ C.rc.pinhole = 1; blk(20, true); banner('Pinhole'); } }},
urn:{n:'Bird-Faced Urn',g:'vial',r:'rare',d:'When you play a Power, heal 2 HP.',   // Bird-Faced Urn
  powerPlayed(){ heal(2); }},
calipers:{n:'Calipers',g:'anvil',r:'rare',d:'You lose only 15 Block at the start of your turn.',   // Calipers
  blockCarry(v, cur){ return Math.max(v, cur - 15); }},
wheel:{n:"Captain's Wheel",g:'spool',r:'rare',d:'At the start of your 3rd turn, gain 18 Block.',   // Captain's Wheel
  turnStart(){ if(C.turn === 3) blk(18, true); }},
deadbranch:{n:'Dead Branch',g:'crack',r:'rare',d:'When you Exhaust a card, add a random card to your hand.',   // Dead Branch
  exhaust(){ const p = Object.keys(CARDS).filter(k => CARDS[k].r !== 'curse' && CARDS[k].r !== 'starter');
    if(p.length) toHand(pick(p), 0, false); }},
duvu:{n:'Du-Vu Doll',g:'skull',r:'rare',d:'Gain 1 Strength for each Curse in your deck.',   // Du-Vu Doll
  combatStart(){ C.str += G.deck.filter(c => CARDS[c.id].r === 'curse').length; }},
helix:{n:'Fossilised Helix',g:'spool',r:'rare',d:'Prevent the first time you would lose HP in a combat.',   // Fossilized Helix
  hpLoss(v){ if(C && !C.rc.helix && v > 0){ C.rc.helix = 1; fxSelf('HELD','blk'); return 0; } return v; }},
ginger:{n:'Ginger',g:'drop',r:'rare',d:'You can no longer become Weak.',   // Ginger
  debuffBlocked(v, k){ return k === 'weak' ? true : v; }},
girya:{n:'Girya',g:'ingot',r:'rare',d:'You can lift at darkrooms for permanent Strength, three times.',   // Girya
  restExtra(list){ if((G.rc.girya || 0) < 3) list.push('rest-lift'); return list; },
  combatStart(){ C.str += (G.liftStr || 0); }},
icecream:{n:'Ice Cream',g:'drop',r:'rare',d:'Energy is now carried over between turns.',   // Ice Cream
  turnEnded(){ if(C) C.carry = C.energy; }},
incense:{n:'Incense Burner',g:'fog',r:'rare',d:'Every 6 turns, gain 1 Intangible.',   // Incense Burner
  turnStart(){ if(tick(C.rc, 'incense', 6)){ C.intangible += 1; banner('Intangible'); } }},
lizardtail:{n:'Lizard Tail',g:'crack',r:'rare',d:'Once per run, dying instead restores you to half your Max HP.',   // Lizard Tail
  cheatDeath(v){ if(!G.rc.tail){ G.rc.tail = 1; return true; } return v; }},
magicflower:{n:'Magic Flower',g:'sun',r:'rare',d:'Healing in combat is 50% more effective.',   // Magic Flower
  healAmt(v){ return C ? Math.round(v * 1.5) : v; }},
mango:{n:'Mango',g:'heart',r:'rare',d:'Raise Max HP by 14.',   // Mango
  onGain(){ raiseMaxHp(14); }},
oldcoin:{n:'Old Coin',g:'ingot',r:'rare',d:'Gain 300 gold.',   // Old Coin
  onGain(){ addGold(300); }},
peacepipe:{n:'Peace Pipe',g:'fog',r:'rare',d:'You can scrape a plate at darkrooms.',   // Peace Pipe
  restExtra(list){ list.push('rest-remove'); return list; }},
pocketwatch:{n:'Pocketwatch',g:'clock',r:'rare',d:'If you play 3 or fewer cards in a turn, draw 3 next turn.',   // Pocketwatch
  turnEnded(){ if(C) C.rc.watch = C.tPlayed <= 3 ? 1 : 0; },
  drawCount(v, first){ if(!first && C.rc.watch) return v + 3; return v; }},
prayerwheel:{n:'Prayer Wheel',g:'spool',r:'rare',d:'Ordinary combats offer an additional card reward.',   // Prayer Wheel
  extraCardReward(v, kind){ return kind === 'fight' ? true : v; }},
shovel:{n:'Shovel',g:'anvil',r:'rare',d:'You can dig for a relic at darkrooms.',   // Shovel
  restExtra(list){ list.push('rest-dig'); return list; }},
calendar:{n:'Stone Calendar',g:'clock',r:'rare',d:'At the end of your 7th turn, deal 52 damage to ALL enemies.',   // Stone Calendar
  turnEnd(){ if(C.turn === 7){ banner('Calendar'); hitAll(52); } }},
thread:{n:'Thread and Needle',g:'pin',r:'rare',d:'Start each combat with 4 Plated Armour.',   // Thread and Needle
  combatStart(){ C.plated += 4; }},
torii:{n:'Torii',g:'plate',r:'rare',d:'Damage of 5 or less is reduced to 1.',   // Torii
  dmgIn(v){ return v > 0 && v <= 5 ? 1 : v; }},
tungsten:{n:'Tungsten Rod',g:'ingot',r:'rare',d:'Whenever you lose HP, lose 1 less.',   // Tungsten Rod
  hpLoss(v){ return Math.max(0, v - 1); }},
turnip:{n:'Turnip',g:'drop',r:'rare',d:'You can no longer become Frail.',   // Turnip
  debuffBlocked(v, k){ return k === 'frail' ? true : v; }},
top:{n:'Unceasing Top',g:'spool',r:'rare',d:'Whenever your hand is empty during your turn, draw 1.',   // Unceasing Top
  cardResolved(){ if(C && !C.over && C.hand.length === 0) drawC(1); }},
champbelt:{n:'Champion Belt',g:'anvil',r:'rare',d:'Applying Vulnerable also applies 1 Weak.',   // Champion Belt
  debuffApplied(e, k){ if(k === 'vuln' && !C.rc.belt){ C.rc.belt = 1; est(e, 'weak', 1); C.rc.belt = 0; } }},
charon:{n:"Charon's Ashes",g:'flame',r:'rare',d:'When you Exhaust a card, deal 3 damage to ALL enemies.',   // Charon's Ashes
  exhaust(){ hitAll(3); }},
thespecimen:{n:'The Specimen',g:'swarm',r:'rare',d:'When an enemy dies, its Tarnish passes to a random other enemy.',   // The Specimen
  enemyDied(e){ const t = e.st.tarnish; if(!t) return; const a = alive(); if(a.length) est(pick(a), 'tarnish', t); }},

/* ══════════════ boss ══════════════ */
blackglass:{n:'Black Glass',g:'burst',r:'boss',d:'Gain 1 Energy each turn. Lose 10 Max HP.',
  onGain(){ G.maxHp -= 10; G.hp = Math.min(G.hp, G.maxHp); },
  combatStart(){ C.maxEnergy += 1; }},
astrolabe:{n:'Astrolabe',g:'lens',r:'boss',d:'Transform and upgrade 3 cards.',   // Astrolabe
  onGain(){ after(nxt => transformFlow(3, nxt)); }},
blackstar:{n:'Black Star',g:'burst',r:'boss',d:'Elites drop an additional relic.',   // Black Star
  eliteRelics(v){ return v + 1; }},
bustedcrown:{n:'Busted Crown',g:'up',r:'boss',d:'Gain 1 Energy each turn. Two fewer card options in rewards.',   // Busted Crown
  combatStart(){ C.maxEnergy += 1; },
  cardOptions(v){ return Math.max(1, v - 2); }},
callingbell:{n:'Calling Bell',g:'wave',r:'boss',d:'Gain 3 Curses and 3 relics.',   // Calling Bell
  onGain(){ for(let i=0;i<3;i++) gainCard(mk(pick(['leak','rot'])));
    after(nxt => chainRelics(3, nxt)); }},
dripper:{n:'Coffee Dripper',g:'drop',r:'boss',d:'Gain 1 Energy each turn. You can no longer rest.',   // Coffee Dripper
  combatStart(){ C.maxEnergy += 1; },
  restBlocked(){ return true; }},
cursedkey:{n:'Cursed Key',g:'key',r:'boss',d:'Gain 1 Energy each turn. Sealed cabinets also hold a Curse.',   // Cursed Key
  combatStart(){ C.maxEnergy += 1; },
  chestCurse(){ return true; }},
ectoplasm:{n:'Ectoplasm',g:'fog',r:'boss',d:'Gain 1 Energy each turn. You can no longer gain gold.',   // Ectoplasm
  combatStart(){ C.maxEnergy += 1; },
  gold(){ return 0; }},
emptycage:{n:'Empty Cage',g:'plate',r:'boss',d:'Remove 2 cards from your deck.',   // Empty Cage
  onGain(){ after(nxt => removeChain(2, nxt)); }},
fusionhammer:{n:'Fusion Hammer',g:'anvil',r:'boss',d:'Gain 1 Energy each turn. You can no longer refine at darkrooms.',   // Fusion Hammer
  combatStart(){ C.maxEnergy += 1; },
  smithBlocked(){ return true; }},
markofpain:{n:'Mark of Pain',g:'crack',r:'boss',d:'Gain 1 Energy each turn. Two Silver Rot enter your draw pile each combat.',   // Mark of Pain
  combatStart(){ C.maxEnergy += 1; C.draw.push(mk('rot'), mk('rot')); shuffle(C.draw); }},
pandora:{n:"Pandora's Box",g:'plate',r:'boss',d:'Transform all your starting cards.',   // Pandora's Box
  onGain(){ G.deck.forEach((c, i) => { if(CARDS[c.id].r === 'starter') transformCard(i); }); }},
philstone:{n:"Philosopher's Stone",g:'ingot',r:'boss',d:'Gain 1 Energy each turn. ALL enemies start with 1 Strength.',   // Philosopher's Stone
  combatStart(){ C.maxEnergy += 1; C.foes.forEach(e => e.str += 1); }},
runiccube:{n:'Runic Cube',g:'plate',r:'boss',d:'Whenever you lose HP, draw 1 card.',   // Runic Cube
  hpLost(){ if(C && !C.over) drawC(1); }},
runicdome:{n:'Runic Dome',g:'fog',r:'boss',d:'Gain 1 Energy each turn. You can no longer see enemy intent.',   // Runic Dome
  combatStart(){ C.maxEnergy += 1; },
  intentHidden(){ return true; }},
runicpyramid:{n:'Runic Pyramid',g:'plate',r:'boss',d:'You no longer discard your hand at the end of your turn.',   // Runic Pyramid
  keepHand(){ return true; }},
sacredbark:{n:'Sacred Bark',g:'vial',r:'boss',d:'Ampoules are twice as effective.',   // Sacred Bark
  potPotency(v){ return v * 2; }},
collar:{n:"Slaver's Collar",g:'key',r:'boss',d:'Gain 1 Energy each turn in elite and boss combats.',   // Slaver's Collar
  combatStart(kind){ if(kind === 'elite' || kind === 'boss') C.maxEnergy += 1; }},
sneckoeye:{n:'Snecko Eye',g:'eye',r:'boss',d:'Draw 2 additional cards each turn. Card costs are scrambled.',   // Snecko Eye
  drawCount(v){ return v + 2; },
  cardDrawn(c){ if(!CARDS[c.id].xc) c.rnd = R(4); }},
sozu:{n:'Sozu',g:'vial',r:'boss',d:'Gain 1 Energy each turn. You can no longer obtain ampoules.',   // Sozu
  combatStart(){ C.maxEnergy += 1; },
  potionBlocked(){ return true; }},
tinyhouse:{n:'Tiny House',g:'plate',r:'boss',d:'Raise Max HP by 5, gain 50 gold, an ampoule, a card and an upgrade.',   // Tiny House
  onGain(){ raiseMaxHp(5); addGold(50); upgradeRandom(1);
    if(G.pots.length < 4) G.pots.push(rollPotion());
    after(nxt => cardGiftFlow(nxt)); }},
choker:{n:'Velvet Choker',g:'crack',r:'boss',d:'Gain 1 Energy each turn. You cannot play more than 6 cards a turn.',   // Velvet Choker
  combatStart(){ C.maxEnergy += 1; },
  playLimit(v){ return 6; }},
wristblade:{n:'Wrist Blade',g:'blade',r:'boss',d:'Attacks that cost 0 deal 4 additional damage.',   // Wrist Blade
  cardPlayed(c, d){ C.rc.freeAtk = (d.t === 'attack' && d.c === 0) ? 1 : 0; },
  dmgOut(v){ return C.rc.freeAtk ? v + 4 : v; }},

/* ══════════════ shop ══════════════ */
brimstone:{n:'Brimstone',g:'flame',r:'shop',d:'At the start of your turn, gain 2 Strength. ALL enemies gain 1.',   // Brimstone
  turnStart(){ C.str += 2; C.foes.filter(f => f.alive).forEach(e => e.str += 1); }},
cauldron:{n:'Cauldron',g:'vial',r:'shop',d:'Brew five ampoules at once.',   // Cauldron
  onGain(){ const m = 3 + (hasR('vellum') ? 1 : 0);
    for(let i=0;i<5 && G.pots.length < m;i++) G.pots.push(rollPotion()); }},
chemx:{n:'Chemical X',g:'burst',r:'shop',d:'Cards that cost X spend 2 more.',   // Chemical X
  xBonus(v){ return v + 2; }},
clockwork:{n:'Clockwork Souvenir',g:'clock',r:'shop',d:'Start each combat with 1 Artifact.',   // Clockwork Souvenir
  combatStart(){ C.st.artifact += 1; }},
dollymirror:{n:"Dolly's Mirror",g:'twin',r:'shop',d:'Duplicate a card in your deck.',   // Dolly's Mirror
  onGain(){ after(nxt => dupFlow(nxt)); }},
frozeneye:{n:'Frozen Eye',g:'eye',r:'shop',d:'You can see the order of your draw pile.',   // Frozen Eye
  drawOrder(){ return true; }},
handdrill:{n:'Hand Drill',g:'pin',r:'shop',d:"Breaking an enemy's Block applies 2 Vulnerable.",   // Hand Drill
  blockBroken(e){ est(e, 'vuln', 2); }},
waffle:{n:"Lee's Waffle",g:'heart',r:'shop',d:'Raise Max HP by 7 and heal all of it.',   // Lee's Waffle
  onGain(){ raiseMaxHp(7); heal(G.maxHp); }},
membership:{n:'Membership Card',g:'cards',r:'shop',d:'Everything at the shop costs half.',   // Membership Card
  shopPrice(v){ return Math.round(v * 0.5); }},
pellets:{n:'Orange Pellets',g:'burst',r:'shop',d:'Playing an Attack, a Skill and a Power in one turn removes all your debuffs.',   // Orange Pellets
  cardResolved(){ if(C && C.tAtk && C.tSkill && C.tPower && !C.rc.pellets){
    C.rc.pellets = 1; C.st.weak = C.st.vuln = C.st.frail = C.st.tarnish = 0;
    fxSelf('CLEARED','blk'); } },
  turnStart(){ C.rc.pellets = 0; }},
orrery:{n:'Orrery',g:'lens',r:'shop',d:'Choose five cards to add to your deck.',   // Orrery
  onGain(){ after(nxt => cardGiftFlow(nxt, 5)); }},
sling:{n:'Sling of Courage',g:'anvil',r:'shop',d:'Start each elite combat with 2 Strength.',   // Sling of Courage
  combatStart(kind){ if(kind === 'elite') C.str += 2; }},
spoon:{n:'Strange Spoon',g:'hand',r:'shop',d:'Cards that Exhaust are spent instead half the time.',   // Strange Spoon
  exhaustDodge(v){ return Math.random() < 0.5 ? true : v; }},
abacus:{n:'The Abacus',g:'cards',r:'shop',d:'Gain 6 Block whenever your draw pile shuffles.',   // The Abacus
  shuffle(){ blk(6, true); }},
toolbox:{n:'Toolbox',g:'anvil',r:'shop',d:'Start each combat with a random card in hand.',   // Toolbox
  combatStart(){ const p = Object.keys(CARDS).filter(k => CARDS[k].r !== 'curse' && CARDS[k].r !== 'starter');
    if(p.length) C.hand.push(mk(pick(p))); }},
funnel:{n:'Twisted Funnel',g:'drop',r:'shop',d:'Start each combat applying 4 Tarnish to ALL enemies.',   // Twisted Funnel
  combatStart(){ C.foes.forEach(e => e.st.tarnish += 4); }},

/* ══════════════ event ══════════════ */
bloodyidol:{n:'Bloody Idol',g:'heart',r:'event',d:'Whenever you gain gold, heal 5 HP.',   // Bloody Idol
  goldGained(){ heal(5); }},
headpiece:{n:'Cultist Headpiece',g:'skull',r:'event',d:'Strange whispers echo from the plates. Nothing else happens.'},   // Cultist Headpiece
poop:{n:'Spirit Poop',g:'crack',r:'event',d:'It smells like the archive gave up on you. Nothing else happens.'},   // Spirit Poop
enchiridion:{n:'Enchiridion',g:'cards',r:'event',d:'Start each combat with a random Power in hand. It costs 0.',   // Enchiridion
  combatStart(){ const p = typePool('power'); if(!p.length) return;
    const c = mk(pick(p)); c.free = 1; C.hand.push(c); },
  turnStart(first){ if(first) C.hand.forEach(c => { if(c.free === 1) c.free = C.turn; }); }},
cleric:{n:'Face of the Cleric',g:'heart',r:'event',d:'Raise Max HP by 1 after each combat.',   // Face of Cleric
  combatWon(){ raiseMaxHp(1); }},
visage:{n:'Gremlin Visage',g:'fog',r:'event',d:'Start each combat with 1 Weak.',   // Gremlin Visage
  combatStart(){ C.st.weak += 1; }},
bloom:{n:'Mark of the Bloom',g:'crack',r:'event',d:'You can no longer heal.',   // Mark of the Bloom
  healAmt(){ return 0; }},
mutagen:{n:'Mutagenic Strength',g:'burst',r:'event',d:'Start each combat with 3 Strength, lost at the end of your first turn.',   // Mutagenic Strength
  combatStart(){ C.str += 3; C.rc.mutagen = 1; },
  turnEnded(){ if(C && C.rc.mutagen && C.turn === 1){ C.rc.mutagen = 0; C.str -= 3; } }},
nlothgift:{n:"N'loth's Gift",g:'hand',r:'event',d:'Triple the chance of a rare card in your next reward.',   // N'loth's Gift
  rareChance(v){ return G.rc.nloth ? v : v * 3; },
  offerMade(){ G.rc.nloth = 1; }},
nlothface:{n:"N'loth's Hungry Face",g:'skull',r:'event',d:'The next sealed cabinet you open is empty.',   // N'loth's Hungry Face
  onGain(){ G.rc.hungry = 1; },
  chestEmpty(v){ if(G.rc.hungry){ G.rc.hungry = 0; return true; } return v; }},
necronomicon:{n:'Necronomicon',g:'cards',r:'event',d:'The first Attack costing 2 or more each turn is played twice.',   // Necronomicon
  repeatCard(v, c, d){ if(d.t === 'attack' && d.c >= 2 && !C.rc.necro){ C.rc.necro = 1; return true; } return v; },
  turnStart(){ C.rc.necro = 0; }},
lament:{n:"Neow's Lament",g:'moth',r:'event',d:'Enemies in your next three combats have 1 HP.',   // Neow's Lament
  onGain(){ G.rc.lament = 3; },
  foeHp(v){ return G.rc.lament > 0 ? 1 : v; },
  combatWon(){ if(G.rc.lament > 0) G.rc.lament--; }},
mushroom:{n:'Odd Mushroom',g:'fog',r:'event',d:'While Vulnerable you take 25% more damage instead of 50%.',   // Odd Mushroom
  vulnTaken(){ return 0.25; }},
serpenthead:{n:"Ssserpent Head",g:'swarm',r:'event',d:'Gain 50 gold whenever you enter an unmarked room.',   // Ssserpent Head
  enterRoom(t){ if(t === 'event') addGold(50); }},
tongs:{n:'Warped Tongs',g:'hand',r:'event',d:'At the start of your turn, upgrade a random card in your hand.',   // Warped Tongs
  turnStart(){ if(!C) return; const up = C.hand.filter(c => !c.lvl && CARDS[c.id].r !== 'curse');
    if(up.length){ pick(up).lvl = 1; fxSelf('REFINED','lit'); } }},
};

/* Flows a relic can open once its acquisition sheet is dismissed. Imported
   lazily so this data module does not pull the whole UI in at load. */
function bottleFlow(t, nxt){ import('../ui/sheets.js').then(m => m.bottleFlow(t, nxt)); }
function removeChain(n, nxt){ import('../ui/sheets.js').then(m => m.removeChain(n, nxt)); }
function dupFlow(nxt){ import('../ui/sheets.js').then(m => m.duplicateFlow(nxt)); }
function transformFlow(n, nxt){ import('../ui/sheets.js').then(m => m.transformChain(n, nxt)); }
function cardGiftFlow(nxt, n){ import('../ui/sheets.js').then(m => m.cardGiftChain(n || 1, nxt)); }
function chainRelics(n, nxt){
  let i = 0;
  const step = () => { if(i++ >= n){ nxt(); return; } grantRelic(rollRelic(), step); };
  step();
}

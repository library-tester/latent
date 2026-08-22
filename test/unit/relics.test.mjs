/* Two layers of relic coverage:
     1. Every one of the 160 relics' handlers actually runs, inside a real
        combat, without throwing — a broad regression net.
     2. A representative sample per subsystem (combat-start stats, damage-chain
        modifiers, status interactions, turn economy, run economy, room
        pricing) asserts the handler does the *right* thing, not just that it
        doesn't crash. Exhaustive per-relic assertions live in git history from
        the relic-pool session, not here — this is regression coverage, not a
        design spec. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, freshRun } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const CB = await import('../../src/game/combat.js');
const RUN = await import('../../src/game/run.js');
const HK = await import('../../src/game/hooks.js');
const RM = await import('../../src/ui/rooms.js');
const { RELICS } = await import('../../src/data/relics.js');
const { CARDS } = await import('../../src/data/cards.js');
const { mk } = await import('../../src/core/util.js');

function withRelic(id, kind = 'fight', row = 3){
  RUN.newRun();
  state.G.relics = [id];
  state.G.gold = 999;
  CB.startCombat(kind, row);
  return state.C;
}

// plausible arguments for every hook event a relic might declare a handler for
const card = () => mk('scorch');
const def = () => CARDS.scorch;
const ARGS = {
  onGain: [], combatStart: ['fight'], turnStart: [true], turnEnd: [], turnEnded: [],
  cardPlayed: [card(), def()], attackPlayed: [card(), def()], skillPlayed: [card(), CARDS.dodge],
  powerPlayed: [card(), def()], cardResolved: [card(), def()], cardDrawn: [card()],
  exhaust: [card()], shuffle: [], hpLost: [3], lightGain: [3], lightSpend: [5],
  combatWon: ['fight'], goldGained: [10], goldSpent: [10], rested: [], floorClimbed: [0],
  potionUsed: ['balm'], curseGained: [mk('rot')], cardGained: [card()], cardAdded: [card()],
  enterRoom: ['shop'], offerMade: [[card()]],
  dmgIn: [10], dmgOut: [10, null, 10], hpLoss: [3], healAmt: [5], gold: [10],
  cardCost: [1, card(), def()], potMax: [3], cardOptions: [3], rareChance: [6],
  foeHp: [20, { hp: [10, 20] }, 'elite'], weakBite: [0.25], vulnBite: [0.5, null], vulnTaken: [0.5],
  debuffBlocked: [false, 'weak'], debuffOut: [2, 'tarnish', null], blockGain: [5, false],
  blockCarry: [0, 10], keepHand: [false], playLimit: [0], repeatCard: [false, card(), def()],
  exhaustDodge: [false, card()], canPlayUnplayable: [false, card(), def()], xBonus: [0],
  energyStart: [3, true], drawCount: [5, true], thornsBase: [0], restHeal: [10], restExtra: [[]],
  restBlocked: [false], smithBlocked: [false], shopPrice: [100], removalPrice: [75],
  chestRelics: [1], chestEmpty: [false], chestCurse: [false], roomSwap: ['event', 'event'],
  intentHidden: [false], drawOrder: [false], potPotency: [1], potionBlocked: [false],
  potChance: [0.3], eliteRelics: [1], extraCardReward: [false, 'fight'], bowl: [false],
  restocks: [false], cheatDeath: [false], curseBlocked: [false, mk('rot')],
  blockBroken: [null], enemyDied: [null], debuffApplied: [null, 'vuln', 2],
};
const NEEDS_FOE = new Set(['blockBroken', 'enemyDied', 'debuffApplied', 'dmgOut', 'vulnBite', 'debuffOut']);

test('160 relics total, split 1 starter / 39 common / 38 uncommon / 28 rare / 23 boss / 16 shop / 15 event', () => {
  const byTier = {};
  for(const id in RELICS) byTier[RELICS[id].r || 'common'] = (byTier[RELICS[id].r || 'common'] || 0) + 1;
  assert.equal(Object.values(byTier).reduce((a,b)=>a+b,0), 160);
  assert.equal(byTier.starter, 1);
  assert.equal(byTier.common, 39);
  assert.equal(byTier.uncommon, 38);
  assert.equal(byTier.rare, 28);
  assert.equal(byTier.boss, 23);
  assert.equal(byTier.shop, 16);
  assert.equal(byTier.event, 15);
});

test('every relic handler runs without throwing, inside a live combat', () => {
  const problems = [];
  for(const id in RELICS){
    const handlers = Object.keys(RELICS[id]).filter(k => typeof RELICS[id][k] === 'function');
    for(const h of handlers){
      const C = withRelic(id);
      if(!(h in ARGS)){ problems.push(`${id}.${h}: no arg spec in this test — add one to ARGS`); continue; }
      let args = ARGS[h].slice();
      if(NEEDS_FOE.has(h)) args = args.map(a => (a === null ? C.foes[0] : a));
      try{ RELICS[id][h](...args); }
      catch(e){ problems.push(`${id}.${h} -> ${e.message}`); }
    }
  }
  assert.deepEqual(problems, []);
});

test('combat-start relics grant exactly what they say', () => {
  assert.equal(withRelic('brass').block, 6, 'Brass Shutter: 6 Block');
  assert.equal(withRelic('needle').str, 1, 'Etching Needle: 1 Strength');
  assert.equal(withRelic('smoothstone').dex, 1, 'Polished Stone: 1 Dexterity');
  assert.equal(withRelic('thread').plated, 4, 'Thread and Needle: 4 Plated Armour');
  assert.equal(withRelic('clockwork').st.artifact, 1, 'Clockwork Souvenir: 1 Artifact');
  assert.equal(withRelic('philstone').maxEnergy, 4, 'Philosopher\'s Stone: +1 max Energy');
  const collar = withRelic('collar', 'fight');
  assert.equal(collar.maxEnergy, 3, 'Slaver\'s Collar: no bonus in an ordinary fight');
  assert.equal(withRelic('collar', 'elite').maxEnergy, 4, 'Slaver\'s Collar: +1 in an elite');
});

test('damage-chain relics modify the pipeline correctly', () => {
  withRelic('apron'); assert.equal(CB.previewIn(10), 8, 'Lead Apron: -2 flat, via previewIn');
  withRelic('torii'); assert.equal(CB.previewIn(5), 1, 'Torii: 5 or less becomes 1');
  withRelic('torii'); assert.equal(CB.previewIn(6), 6, 'Torii: 6 is untouched');
  const C = withRelic('tungsten');
  const hp = state.G.hp; C.block = 0; CB.hitPlayer(5);
  assert.equal(hp - state.G.hp, 4, 'Tungsten Rod: always 1 less HP lost');
});

test('status-interaction relics behave as documented', () => {
  const C = withRelic('ginger'); CB.pst('weak', 2);
  assert.equal(C.st.weak, 0, 'Ginger: full Weak immunity');
  const C2 = withRelic('champbelt'); const f = C2.foes[0];
  CB.est(f, 'vuln', 2);
  assert.equal(f.st.weak, 1, 'Champion Belt: applying Vulnerable also applies 1 Weak');
});

test('turn-economy relics behave as documented', async () => {
  const C = withRelic('icecream'); C.energy = 2;
  HK.fire('turnEnded');
  assert.equal(C.carry, 2, 'Ice Cream: Energy carries to next turn');
  const C2 = withRelic('calipers'); C2.block = 40;
  CB.startTurn(false);
  assert.equal(C2.block, 25, 'Calipers: keep 25 max, not all of it');
});

test('run-economy relics behave as documented', () => {
  withRelic('purse');
  assert.equal(HK.mod('gold', 100), 125, 'Collector\'s Purse: +25% gold');
  withRelic('ectoplasm');
  assert.equal(HK.mod('gold', 100), 0, 'Ectoplasm: no gold at all');
  const before = state.G.deck.length;
  withRelic('moltenegg');
  const c = RUN.gainCard(mk('scorch'));
  assert.equal(c.lvl, 1, 'Molten Egg: Attacks enter the deck upgraded');
});

test('room-pricing relics behave as documented', () => {
  withRelic('membership');
  assert.equal(RM.shopPrice(100), 50, 'Membership Card: half price');
  withRelic('smilingmask');
  assert.equal(RM.removalPrice(), 50, 'Fixer\'s Grin: removal is always 50g');
});

test('Cauldron widens the ampoule rack to five and brews every slot full', () => {
  RUN.newRun();
  assert.equal(RUN.potMax(), 3, 'the rack is three slots to start with');
  RUN.grantRelic('cauldron');
  assert.equal(RUN.potMax(), 5, 'Cauldron: two more slots, so five');
  assert.equal(state.G.pots.length, 5, 'and all five arrive filled, not three');

  RUN.newRun();
  state.G.relics.push('vellum');
  RUN.grantRelic('cauldron');
  assert.equal(RUN.potMax(), 6, 'Cauldron stacks with Vellum Sleeve rather than capping it');
  assert.equal(state.G.pots.length, 6);
});

test('nothing brews ampoules while Sozu blocks them', () => {
  RUN.newRun();
  state.G.relics.push('sozu');
  RUN.grantRelic('cauldron');
  assert.equal(state.G.pots.length, 0, 'Cauldron cannot smuggle ampoules past Sozu');
  assert.equal(RUN.fillPotions(), 0);
});

test('Tiny House drops its ampoule into a wide rack instead of discarding it', () => {
  RUN.newRun();
  state.G.relics.push('cauldron');        // rack of five, but empty
  RUN.grantRelic('tinyhouse');
  assert.equal(state.G.pots.length, 1, 'the old hardcoded cap of 4 used to swallow this');
});

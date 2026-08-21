/* Card-level mechanics from game/docs/cards.md: exhaust, ethereal, upgrade,
   X-cost, and cost resolution (costOf's free/Total-Solarization/Snecko-scramble
   precedence). */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, freshRun } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const CB = await import('../../src/game/combat.js');
const { CARDS, costOf, V } = await import('../../src/data/cards.js');
const { mk } = await import('../../src/core/util.js');

async function combat(kind = 'boss', row = 14){
  const { state: st } = await freshRun();
  CB.startCombat(kind, row);
  st.C.foes.forEach(f => { f.hp = f.maxHp = 9999; }); // isolate card tests from kill/split side effects
  return st.C;
}

test('77 cards total, split 3 starter / 20 common / 36 uncommon / 16 rare / 2 curse', () => {
  const byRarity = {};
  for(const id in CARDS) byRarity[CARDS[id].r] = (byRarity[CARDS[id].r] || 0) + 1;
  assert.equal(Object.values(byRarity).reduce((a,b)=>a+b,0), 77);
  assert.equal(byRarity.starter, 3);
  assert.equal(byRarity.common, 20);
  assert.equal(byRarity.uncommon, 36);
  assert.equal(byRarity.rare, 16);
  assert.equal(byRarity.curse, 2);
});

test('an Exhaust card leaves play into the exhaust pile, not the discard pile', async () => {
  const C = await combat();
  C.hand = [mk('snapshot')]; // common, tg:1, ex:1
  C.energy = 5;
  CB.playCard(0, C.foes[0]);
  assert.equal(C.exh.length, 1);
  assert.equal(C.disc.length, 0);
});

test('an Ethereal card left in hand self-Exhausts at end of turn, not discarded', async () => {
  const C = await combat();
  C.hand = [mk('carnage')]; // ethereal
  await CB.endTurn();
  assert.equal(state.C ? state.C.exh.some(c => c.id === 'carnage') : true, true, 'exhausted');
  assert.equal(state.C ? state.C.disc.some(c => c.id === 'carnage') : false, false, 'never discarded');
});

test('upgrading a card advances which value tier it reads', () => {
  const c = mk('burn');
  const before = V(c, 'd');
  c.lvl = 1;
  const after = V(c, 'd');
  assert.ok(after > before, `upgraded value (${after}) should exceed base (${before})`);
});

test('a card made free-for-this-turn costs 0 regardless of its printed cost', async () => {
  const C = await combat();
  const c = mk('gaslight'); // printed cost 2
  c.free = C.turn;
  assert.equal(costOf(c, true), 0);
});

test('Snecko Eye\'s scrambled cost overrides the printed cost but not a free-this-turn flag', async () => {
  const C = await combat();
  const c = mk('gaslight');
  c.rnd = 3;
  assert.equal(costOf(c, true), 3, 'scrambled cost wins over the printed cost');
  c.free = C.turn;
  assert.equal(costOf(c, true), 0, 'free-this-turn still overrides the scramble');
});

test('Total Solarization (corrupt power) makes Skills cost 0 but does not touch Attacks', async () => {
  const C = await combat();
  C.powers.corrupt = 1;
  assert.equal(costOf(mk('shutter'), true), 0, 'Skill');
  assert.equal(costOf(mk('scorch'), true) > 0, true, 'Attack unaffected');
});

test('an X-cost card spends the entire remaining Energy pool', async () => {
  const C = await combat();
  C.hand = [mk('whirlwind')]; // the one xc card
  C.energy = 4;
  CB.playCard(0, null);
  assert.equal(C.energy, 0);
});

test('hand cap of 10 also applies to "add a card to hand" effects (toHand)', async () => {
  const C = await combat();
  C.hand = Array.from({ length: 10 }, () => mk('burn'));
  const result = CB.toHand('scorch');
  assert.equal(result, null);
  assert.equal(C.hand.length, 10);
});

test('canPlay refuses curses (unplayable) and refuses anything over the Energy budget', async () => {
  const C = await combat();
  C.energy = 0;
  assert.equal(CB.canPlay(mk('leak')), false, 'curse is unplayable');
  assert.equal(CB.canPlay(mk('scorch')), false, 'no energy for a costed card');
});

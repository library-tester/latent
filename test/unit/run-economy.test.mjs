/* Run-level state and map generation invariants from game/docs/progression.md
   and game/docs/enemies.md. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, freshRun } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const RUN = await import('../../src/game/run.js');
const { CARDS } = await import('../../src/data/cards.js');
const { ENEMIES } = await import('../../src/data/enemies.js');
const { ACTS } = await import('../../src/data/acts.js');
const { mk } = await import('../../src/core/util.js');

test('62 enemies total: 44 ordinary, 9 elite, 9 boss', () => {
  let ordinary = 0, elite = 0, boss = 0;
  for(const id in ENEMIES){
    if(ENEMIES[id].boss) boss++;
    else if(ENEMIES[id].elite) elite++;
    else ordinary++;
  }
  assert.equal(ordinary, 44);
  assert.equal(elite, 9);
  assert.equal(boss, 9);
});

test('each of the 3 acts has exactly 3 boss candidates, and no boss is shared across acts', () => {
  const all = [];
  for(const act of [1, 2, 3]){
    assert.equal(ACTS[act].boss.length, 3, `act ${act}`);
    all.push(...ACTS[act].boss);
  }
  assert.equal(new Set(all).size, all.length, 'boss pools are disjoint across acts');
});

test('newRun() sets the documented starting state: 72/72 HP, 55 gold, a 10-card deck, 1 relic', async () => {
  RUN.newRun();
  assert.equal(state.G.hp, 72);
  assert.equal(state.G.maxHp, 72);
  assert.equal(state.G.gold, 55);
  assert.equal(state.G.deck.length, 10);
  assert.equal(state.G.deck.filter(c => c.id === 'burn').length, 5);
  assert.equal(state.G.deck.filter(c => c.id === 'dodge').length, 4);
  assert.equal(state.G.deck.filter(c => c.id === 'flare').length, 1);
  assert.deepEqual(state.G.relics, ['safelamp']);
});

test('map generation: act row counts are 15/16/17, always 7 columns, and the last row is always the boss', async () => {
  for(const [act, rows] of [[1, 15], [2, 16], [3, 17]]){
    await freshRun();
    state.G.act = act;
    RUN.beginAct(act);
    assert.equal(state.G.map.rows, rows, `act ${act}`);
    assert.equal(state.G.map.cols, 7);
    const lastRowNodes = state.G.map.nodes.filter(n => n.r === rows - 1);
    assert.ok(lastRowNodes.every(n => n.type === 'boss'), `act ${act} last row is all boss nodes`);
  }
});

test('map generation: every act guarantees at least one Shop and one Event node', async () => {
  for(let trial = 0; trial < 10; trial++){
    await freshRun();
    const types = new Set(state.G.map.nodes.map(n => n.type));
    assert.ok(types.has('shop'), 'a shop exists somewhere in the map');
    assert.ok(types.has('event'), 'an event exists somewhere in the map');
    assert.ok(types.has('rest'), 'a rest site exists somewhere in the map');
    assert.ok(types.has('treasure'), 'a treasure exists somewhere in the map');
  }
});

test('map generation: no edge in one row-transition ever crosses another (the stated invariant)', async () => {
  for(let trial = 0; trial < 5; trial++){
    await freshRun();
    const M = state.G.map;
    // group edges by their source row, then confirm targets are monotonic in
    // source order — this is exactly the invariant genMap()'s own comment
    // claims makes crossings structurally impossible.
    const byRow = new Map();
    for(const [a, b] of M.edges){
      const row = M.nodes[a].r;
      if(!byRow.has(row)) byRow.set(row, []);
      byRow.get(row).push({ srcCol: M.nodes[a].c, dstCol: M.nodes[b].c });
    }
    for(const edges of byRow.values()){
      edges.sort((x, y) => x.srcCol - y.srcCol);
      for(let i = 1; i < edges.length; i++){
        assert.ok(edges[i].dstCol >= edges[i-1].dstCol,
          'a later (more-rightward) source should never target a column left of an earlier source\'s target');
      }
    }
  }
});

test('offerCards() never offers the same card id twice in one roll', async () => {
  await freshRun();
  for(let trial = 0; trial < 20; trial++){
    const offer = RUN.offerCards(5, 0);
    const ids = offer.map(c => c.id);
    assert.equal(new Set(ids).size, ids.length);
  }
});

test('rollCard() rarity only ever returns common/uncommon/rare, never starter/curse', async () => {
  await freshRun();
  for(let i = 0; i < 200; i++){
    const c = RUN.rollCard();
    assert.ok(['common', 'uncommon', 'rare'].includes(CARDS[c.id].r), `rolled ${c.id} (${CARDS[c.id].r})`);
  }
});

test('gainCard() blocks a curse when a relic vetoes it, and does not add it to the deck', async () => {
  await freshRun();
  state.G.relics.push('omamori');
  state.G.rc.omamori = 2;
  const before = state.G.deck.length;
  const result = RUN.gainCard(mk('rot'));
  assert.equal(result, null);
  assert.equal(state.G.deck.length, before);
});

test('gainCard() adds an ordinary card normally', async () => {
  await freshRun();
  const before = state.G.deck.length;
  const c = RUN.gainCard(mk('scorch'));
  assert.notEqual(c, null);
  assert.equal(state.G.deck.length, before + 1);
});

test('rollRelic() never re-offers a relic the player already owns', async () => {
  await freshRun();
  const { RELICS } = await import('../../src/data/relics.js');
  // own everything except one common relic, then roll many times — it must
  // always return that one. (The starter relic is excluded on purpose: it's
  // never offered by a normal reward roll at all, by design — see cards.md.)
  const ids = Object.keys(RELICS);
  const keep = ids.find(id => RELICS[id].r === 'common');
  state.G.relics = ids.filter(id => id !== keep);
  for(let i = 0; i < 20; i++){
    assert.equal(RUN.rollRelic(), keep);
  }
});

test('a boss reward offers three rare cards and three distinct boss relics to choose from', async () => {
  await freshRun();
  const REWARDS = await import('../../src/ui/rewards.js');
  const { RELICS } = await import('../../src/data/relics.js');
  for(let trial = 0; trial < 10; trial++){
    await freshRun();
    REWARDS.rewards('boss', 12);
    const r = state.RW;
    assert.equal(r.cards.length, 3);
    for(const c of r.cards) assert.equal(CARDS[c.id].r, 'rare', `${c.id} should be rare`);
    assert.equal(r.bossRelics.length, 3);
    assert.equal(new Set(r.bossRelics).size, 3, 'the three on offer must be distinct');
    for(const id of r.bossRelics) assert.equal(RELICS[id].r, 'boss');
  }
});

test('an ordinary fight reward is unchanged: weighted card roll, no relic choice', async () => {
  await freshRun();
  const REWARDS = await import('../../src/ui/rewards.js');
  REWARDS.rewards('fight', 4);
  assert.equal(state.RW.bossRelics, null);
  assert.equal(state.RW.relics.length, 0);
  REWARDS.rewards('elite', 6);
  assert.equal(state.RW.bossRelics, null, 'elites hand their relic over, they do not offer a choice');
  assert.equal(state.RW.relics.length, 1);
});

test('rollRelics() returns distinct relics and comes up short rather than repeating', async () => {
  await freshRun();
  const { RELICS } = await import('../../src/data/relics.js');
  const boss = Object.keys(RELICS).filter(id => RELICS[id].r === 'boss');
  state.G.relics = boss.slice(2);                       // only two boss relics left unowned
  const two = RUN.rollRelics('boss', 2);
  assert.equal(new Set(two).size, 2);
  state.G.relics = Object.keys(RELICS);                 // own every relic in the game
  assert.deepEqual(RUN.rollRelics('boss', 3), []);
});

test('clearing a boss fully heals the player on the way into the next act', async () => {
  await freshRun();
  const REWARDS = await import('../../src/ui/rewards.js');
  state.G.hp = 4;
  REWARDS.actComplete();
  assert.equal(state.G.hp, state.G.maxHp, 'a boss is worth the whole bar, not 30% of it');
  assert.equal(state.G.act, 2);
});

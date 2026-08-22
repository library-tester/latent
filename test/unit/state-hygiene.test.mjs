/* Regressions for state that outlived the thing it belonged to.

   All four bugs below shipped and none of them threw — they were silent
   wrong-outcome bugs, which is why they survived a suite that mostly asserts
   "does not crash". Each test drives the exact sequence a player would. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, freshRun, q, click } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const CB = await import('../../src/game/combat.js');
const CV = await import('../../src/ui/combat-view.js');
const rooms = await import('../../src/ui/rooms.js');
const { EVENTS } = await import('../../src/data/events.js');

/* usePot() only arms a target picker when there is more than one enemy to aim at */
function twoFoeFight(){
  for(let i = 0; i < 40; i++){
    CB.startCombat('fight', 3);
    if(state.C.foes.filter(f => f.alive).length >= 2) return true;
  }
  return false;
}

test('an armed ampoule does not survive the end of the turn', async () => {
  const { state: st } = await freshRun();
  st.G.pots = ['firepot', 'lux'];
  assert.ok(twoFoeFight(), 'needed a fight with two targets');

  CV.usePot(0);                       // targeted ampoule, two foes -> waits for a pick
  assert.equal(state.POTSEL, 0, 'the ampoule is armed');
  await CB.endTurn();
  assert.equal(state.POTSEL, null,
    'ending the turn must disarm it — otherwise the next enemy tap drinks it');
});

test('an armed ampoule does not survive into the next fight', async () => {
  const { state: st } = await freshRun();
  st.G.pots = ['firepot', 'lux'];
  assert.ok(twoFoeFight());
  CV.usePot(0);
  assert.equal(state.POTSEL, 0);

  state.C.foes.forEach(f => f.alive = false);   // the fight ends while it is still armed
  CB.winCombat();
  assert.equal(state.POTSEL, null, 'nothing armed may outlive the fight');

  assert.ok(twoFoeFight());
  const held = st.G.pots.length;
  CV.tapFoe(0);                                  // the player just wants to attack
  assert.equal(st.G.pots.length, held, 'tapping an enemy drank an ampoule nobody selected');
});

test('ending a turn with no combat running is a no-op, not a crash', async () => {
  await freshRun();
  CB.startCombat('fight', 3);
  state.setC(null);
  await assert.doesNotReject(async () => CB.endTurn());
});

test('backing out of the shop\'s scrape costs nothing and leaves it for sale', async () => {
  const { state: st } = await freshRun();
  st.G.at = st.G.map.nodes.findIndex(n => n.type === 'shop');
  if(st.G.at < 0){ st.G.map.nodes[1].type = 'shop'; st.G.at = 1; }
  st.G.gold = 500;
  rooms.shopScene(st.G.map.nodes[st.G.at]);

  const gold = st.G.gold, deck = st.G.deck.length;
  click(q('[data-a="buy"][data-k="remove"]'));
  assert.ok(q('#modal').classList.contains('on'), 'the picker opened');

  click(q('#sheet [data-a="cancel"]'));
  assert.equal(st.G.gold, gold, 'the Fixer is paid for a card actually scraped, not for opening the drawer');
  assert.equal(st.G.deck.length, deck, 'and nothing was removed');
  assert.equal(st.G.map.nodes[st.G.at].shop.removed, false, 'the service is still on offer');
});

test('paying the shop\'s scrape and going through with it does charge', async () => {
  const { state: st } = await freshRun();
  st.G.at = st.G.map.nodes.findIndex(n => n.type === 'shop');
  if(st.G.at < 0){ st.G.map.nodes[1].type = 'shop'; st.G.at = 1; }
  st.G.gold = 500;
  rooms.shopScene(st.G.map.nodes[st.G.at]);

  const gold = st.G.gold, deck = st.G.deck.length;
  click(q('[data-a="buy"][data-k="remove"]'));
  click(q('#sheet [data-a="rem"]'));
  assert.ok(st.G.gold < gold, 'the scrape was charged for');
  assert.equal(st.G.deck.length, deck - 1, 'and a card actually went');
  assert.equal(st.G.map.nodes[st.G.at].shop.removed, true);
});

test('backing out of an event option consumes the room — one payout per room', async () => {
  const { state: st } = await freshRun();
  st.G.at = 0; st.G.gold = 999;
  st.G.act = 1;
  st.G.seenEv = EVENTS.map(e => e.id).filter(id => id !== 'apprentice');
  rooms.eventScene();
  assert.equal(state.EV.id, 'apprentice', 'test setup: expected the Apprentice');

  const relics = st.G.relics.length;
  click(q('[data-a="opt"][data-i="1"]'));       // the paid scrape
  assert.ok(q('#modal').classList.contains('on'));
  click(q('#sheet [data-a="cancel"]'));         // ...then think better of it

  assert.equal(state.EV, null, 'the event was resolved, not merely hidden');
  assert.equal(state.PENDING, null, 'and the flow was cleared');
  // the room is gone, so its other options cannot also be taken
  assert.equal(q('[data-a="opt"][data-i="2"]'), null,
    'the event screen was still live — a second option could be taken from one room');
  assert.equal(st.G.relics.length, relics);
});

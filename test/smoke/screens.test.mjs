/* Every major screen renders without throwing, and a scripted playthrough
   covering the map, a full combat turn, the deck/relic sheets, and both
   endings survives end to end. This is deliberately broad and shallow — it
   catches "missing DOM id" / "null-ref on a screen transition" class bugs
   that the focused unit tests above don't touch, not fine-grained behavior. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, click, q, qa, freshRun, sleep } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const RUN = await import('../../src/game/run.js');
const CB = await import('../../src/game/combat.js');
const rooms = await import('../../src/ui/rooms.js');
const rewards = await import('../../src/ui/rewards.js');
const sheets = await import('../../src/ui/sheets.js');
const endings = await import('../../src/ui/endings.js');
const mapView = await import('../../src/ui/map-view.js');
const title = await import('../../src/ui/title.js');

const rendered = () => q('#scene').innerHTML.length > 40;
const sheetOpen = () => q('#modal').classList.contains('on');

test('title screen renders and offers "Begin descent" with no run in progress', async () => {
  await title.title();
  assert.ok(rendered());
  assert.ok(q('[data-a="new"]'));
});

test('clicking "new" starts a run and lands on the map', async () => {
  await title.title();
  click(q('[data-a="new"]'));
  await sleep(20);
  assert.ok(state.G, 'a run exists');
  assert.ok(qa('.nd-hit.open').length >= 1, 'at least one open map node');
});

test('every room screen renders without throwing', async () => {
  await freshRun();
  state.G.at = 0;

  rooms.restScene();       assert.ok(rendered(), 'rest');
  rooms.treasureScene();   assert.ok(rendered(), 'treasure');
  rooms.eventScene();      assert.ok(rendered(), 'event');
  rooms.shopScene(state.G.map.nodes[0]); assert.ok(rendered(), 'shop');
  rewards.rewards('elite', 4); assert.ok(rendered(), 'rewards');
  rewards.actComplete();   assert.ok(rendered(), 'act transition');
  mapView.renderMap();     assert.ok(rendered(), 'map');
});

test('every deck/relic sheet opens without throwing', async () => {
  await freshRun();
  state.G.pots = ['balm', 'lux'];
  state.G.relics.push('loupe');

  sheets.showDeck();    assert.ok(sheetOpen(), 'deck');
  sheets.showRelics();  assert.ok(sheetOpen(), 'relics');
  sheets.removeFlow(() => {});    assert.ok(sheetOpen(), 'remove');
  sheets.duplicateFlow(() => {}); assert.ok(sheetOpen(), 'duplicate');
  sheets.upgradeFlow(() => {});   assert.ok(sheetOpen(), 'upgrade');
  await title.howTo();  assert.ok(sheetOpen(), 'how to play');
});

test('both endings render without throwing', async () => {
  await freshRun();
  endings.victory();
  assert.ok(rendered(), 'victory');
  await freshRun();
  endings.gameOver();
  assert.ok(rendered(), 'game over');
});

test('a scripted turn: enter combat, play every playable card, use an ampoule, end the turn', async () => {
  await freshRun();
  state.G.pots = ['balm'];
  CB.startCombat('fight', 3);
  assert.ok(q('#hand'), 'combat screen built');

  let guard = 0;
  while(guard++ < 8){
    const i = state.C.hand.findIndex(c => CB.canPlay(c));
    if(i < 0) break;
    const card = q(`.card[data-i="${i}"]`);
    click(card);
    await sleep(10);
    // a targeted card with multiple enemies needs a second tap
    if(state.SEL !== null){ click(q('.enemy')); await sleep(10); }
  }
  if(state.G.pots.length) click(q('.pot:not(.empty)'));

  await CB.endTurn();
  assert.ok(!state.BUSY || state.C === null, 'the turn resolved (BUSY cleared or the fight ended)');
});

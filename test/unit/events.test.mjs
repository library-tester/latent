/* Regression coverage for the exact defect the audit found and fixed: a
   stale call signature (rollRelic(true)) that silently returned null instead
   of throwing, so a room event charged the player Max HP for nothing. See
   game/docs/mechanics.md and game/docs/roadmap.md ("Already done"). A test
   asserting only "does not throw" would not have caught that bug — it has to
   assert the actual outcome. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, freshRun } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const RUN = await import('../../src/game/run.js');
const rooms = await import('../../src/ui/rooms.js');
const { EVENTS } = await import('../../src/data/events.js');
const { q, click } = await import('../helpers/boot.mjs');

/* Every event option assumes G.at points at a real map node (it reads the
   node's row for flavor text, and some options read the node itself) — set
   the way ui/map-view.js's enterNode() would set it, not left null the way a
   fresh run starts. */
async function enterAnEventRoom(){
  const { state: st } = await freshRun();
  const anyNode = st.G.map.nodes.findIndex(() => true);
  st.G.at = anyNode >= 0 ? anyNode : 0;
  st.G.gold = 999;
  return st;
}

test('12 events, each with 2 or 3 options', () => {
  assert.equal(EVENTS.length, 12);
  for(const ev of EVENTS) assert.ok(ev.o.length === 2 || ev.o.length === 3, `${ev.id} has ${ev.o.length} options`);
});

test('"Specimen Drawer" — reaching into the empty slot always grants a relic (the fixed bug)', async () => {
  // this is the exact regression the fix addresses: rollRelic(true) — a call
  // signature stale since relic tiers were introduced — silently returned
  // null, so this option cost Max HP for nothing. 100 trials, not 1, because
  // the failure mode was "usually fine, sometimes nothing" only insofar as it
  // was *always* nothing before the fix — but the roll itself is random, so
  // many trials also incidentally cover a wide slice of the 160-relic pool.
  const drawer = EVENTS.find(e => e.id === 'drawer');
  let grants = 0;
  for(let i = 0; i < 100; i++){
    const st = await enterAnEventRoom();
    const relicsBefore = st.G.relics.length;
    drawer.o[0].go();
    if(st.G.relics.length > relicsBefore) grants++;
  }
  assert.equal(grants, 100, 'grants a relic every single time (100 trials)');
});

test('"Specimen Drawer" costs exactly 8 Max HP, independent of what the rolled relic itself does', async () => {
  const drawer = EVENTS.find(e => e.id === 'drawer');
  const st = await enterAnEventRoom();
  // pre-own every relic whose own onGain() also touches Max HP, so the random
  // roll can't land on one and confound this specific assertion — that
  // confound is exactly what made an earlier draft of this test flaky.
  const { RELICS } = await import('../../src/data/relics.js');
  const maxHpRelics = Object.keys(RELICS).filter(id => {
    const src = RELICS[id].onGain ? RELICS[id].onGain.toString() : '';
    return /raiseMaxHp|maxHp\s*[-+]=/.test(src);
  });
  st.G.relics.push(...maxHpRelics);
  const maxBefore = st.G.maxHp;
  drawer.o[0].go();
  assert.equal(st.G.maxHp, maxBefore - 8);
});

test('every event option runs without throwing, from a real map position', async () => {
  const problems = [];
  for(const ev of EVENTS){
    for(const opt of ev.o){
      const st = await enterAnEventRoom();
      try{ opt.go(); }
      catch(e){ problems.push(`${ev.id} / "${opt.h}" -> ${e.message}`); }
    }
  }
  assert.deepEqual(problems, []);
});

test('a cost-gated event option is unreachable through the real UI when unaffordable', async () => {
  // "Chemist's Cart" always rolls the same three options in the same order.
  // eventScene() draws without replacement, so marking every other event as
  // already seen leaves exactly one candidate — no retry loop, no flake. (It
  // used to spin up to 50 random draws, which missed roughly 1 run in 80.)
  const st = await enterAnEventRoom();
  st.G.gold = 10; // below every costed option in this event pool
  st.G.seenEv = EVENTS.map(e => e.id).filter(id => id !== 'chemist');
  rooms.eventScene();
  assert.equal(state.EV.id, 'chemist', 'test setup: failed to land on the Chemist event');

  const tonicIdx = state.EV.o.findIndex(o => o.cost === 45);
  const btn = q(`[data-a="opt"][data-i="${tonicIdx}"]`);
  assert.equal(btn.hasAttribute('disabled'), true, 'the button itself is rendered disabled');

  const goldBefore = st.G.gold;
  click(btn);
  assert.equal(st.G.gold, goldBefore, 'clicking a disabled/unaffordable option changes nothing');
});

/* Every ampoule exercised in a live combat (via the real usePot() UI entry
   point, not use() directly, so targeting/potency/save-on-use all run too),
   plus representative behavior per ampoule category. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, freshRun } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const CB = await import('../../src/game/combat.js');
const RUN = await import('../../src/game/run.js');
const CV = await import('../../src/ui/combat-view.js');
const { POTS, rollPotion } = await import('../../src/data/potions.js');
const { mk } = await import('../../src/core/util.js');

function withPot(id, kind = 'boss', row = 4){
  RUN.newRun();
  state.G.relics = [];
  state.G.pots = [id];
  state.G.gold = 999;
  state.G.hp = state.G.maxHp;
  CB.startCombat(kind, row);
  state.C.foes.forEach(f => { f.hp = f.maxHp = 9999; }); // isolate ampoule tests from kill side effects
  return state.C;
}

test('37 ampoules total, split 19 common / 10 uncommon / 8 rare', () => {
  const byRarity = {};
  for(const id in POTS) byRarity[POTS[id].r] = (byRarity[POTS[id].r] || 0) + 1;
  assert.equal(Object.values(byRarity).reduce((a,b)=>a+b,0), 37);
  assert.equal(byRarity.common, 19);
  assert.equal(byRarity.uncommon, 10);
  assert.equal(byRarity.rare, 8);
});

test('every ampoule resolves via usePot() without throwing, against 1 and against several enemies', () => {
  const problems = [];
  for(const id of Object.keys(POTS)){
    if(POTS[id].passive) continue; // the Moth is never manually tapped — covered in combat-math.test.mjs
    for(const multi of [false, true]){
      const C = withPot(id, multi ? 'fight' : 'boss');
      if(multi && C.foes.length < 2) C.foes.push({ ...C.foes[0], idx: 1, el: null });
      try{
        CV.usePot(0);
        if(state.POTSEL !== null) CV.tapFoe(0); // a targeted ampoule with >1 foe waits for a tap
      }catch(e){ problems.push(`${id} (${multi ? 'multi' : 'single'}-target) -> ${e.message}`); }
    }
  }
  assert.deepEqual(problems, []);
});

test('a targeted ampoule with one enemy fires immediately; with several, it waits for a tap', () => {
  const C = withPot('firepot', 'fight');
  while(C.foes.length < 2) C.foes.push({ ...C.foes[0], idx: C.foes.length, el: null, hp: 9999, maxHp: 9999 });
  CV.usePot(0);
  assert.equal(state.POTSEL, 0, 'waits for a target');
  assert.equal(state.G.pots.length, 1, 'not spent yet');
  const target = C.foes[1], hp = target.hp;
  CV.tapFoe(1);
  assert.equal(state.G.pots.length, 0, 'spent once a foe is tapped');
  assert.equal(hp - target.hp, 20, 'hits the one that was tapped');
});

test('direct-effect ampoules grant exactly what they say', () => {
  const C1 = withPot('collodion'); CV.usePot(0);
  assert.equal(C1.block, 18, 'Collodion Ampoule: 18 Block');
  const C2 = withPot('strpot'); CV.usePot(0);
  assert.equal(C2.str, 2, 'Etchant: 2 Strength');
  const C3 = withPot('ghostpot'); CV.usePot(0);
  assert.equal(C3.intangible, 3, 'Ghost in a Jar: 3 Intangible');
  const C4 = withPot('flexpot'); CV.usePot(0);
  assert.equal(C4.str, 5, 'Quick Etch: +5 Strength');
  assert.equal(C4.tempStr, 5, 'marked temporary');
});

test('Sacred Bark doubles ampoule potency without any ampoule knowing it exists', () => {
  RUN.newRun();
  state.G.relics = ['sacredbark'];
  state.G.pots = ['collodion'];
  CB.startCombat('boss', 4);
  CV.usePot(0);
  assert.equal(state.C.block, 36, '18 Block doubled to 36');
});

test('Smoke Bomb ends an ordinary fight but is refused by a boss fight', () => {
  const C1 = withPot('smokepot', 'fight');
  CV.usePot(0);
  assert.equal(C1.over, true);
  const C2 = withPot('smokepot', 'boss');
  CV.usePot(0);
  assert.equal(C2.over, false);
});

test('rollPotion() is weighted toward common (roughly 65/25/10)', () => {
  const seen = { common: 0, uncommon: 0, rare: 0 };
  for(let i = 0; i < 3000; i++) seen[POTS[rollPotion()].r]++;
  const frac = k => seen[k] / 3000;
  assert.ok(frac('common') > 0.55 && frac('common') < 0.75, `common share was ${frac('common')}`);
  assert.ok(frac('rare') > 0.04 && frac('rare') < 0.17, `rare share was ${frac('rare')}`);
});

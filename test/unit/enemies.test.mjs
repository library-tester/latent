/* The bestiary's own invariants.

   Two failure modes matter here and neither throws at import time:

     1. An ai() that returns a move key the enemy does not have. The engine
        looks up `m[e.intent]` on the enemy's turn, so this crashes mid-fight,
        on one branch, sometimes — the worst shape of bug this game can have.
     2. An intent that lies. The readout promises exact numbers ("never a
        range", per game/docs/ui.md), so a move whose `i` says 9×2 while its
        `f` deals 12 is a correctness bug even though nothing errors. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, freshRun } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const CB = await import('../../src/game/combat.js');
const { ENEMIES } = await import('../../src/data/enemies.js');
const P = await import('../../src/game/patterns.js');

const ids = Object.keys(ENEMIES);

/* A stand-in specimen the AI can be driven against without a real fight. */
const dummy = (over) => Object.assign({
  key:'fish', hp:40, maxHp:40, block:0, str:0, turn:0, last:null, streak:0,
  st:{weak:0,vuln:0,tarnish:0,frail:0,artifact:0}, alive:true, hurt:false, phase2:false,
}, over);

test('every enemy declares at least 3 moves, and elites and bosses more', () => {
  for(const id of ids){
    const d = ENEMIES[id], n = Object.keys(d.m).length;
    const floor = d.boss ? 4 : d.elite ? 4 : 3;
    assert.ok(n >= floor, `${id} has only ${n} moves (needs ${floor})`);
  }
});

test('no ai() can ever name a move its enemy does not have', () => {
  // drive each AI across a long fight, in both health states and both phases,
  // enough times that a weighted table's rare branches all come up
  for(const id of ids){
    const d = ENEMIES[id], keys = new Set(Object.keys(d.m));
    for(const opts of [{}, { hurt:true }, { phase2:true }, { hp:5, hurt:true }, { hp:5, phase2:true }, { stole:20 }]){
      for(let trial = 0; trial < 40; trial++){
        const e = dummy({ key:id, ...opts });
        for(let t = 0; t < 24; t++){
          const key = d.ai(e, e.turn);
          assert.ok(keys.has(key), `${id}: ai() returned "${key}", which is not one of ${[...keys].join('/')}`);
          e.streak = key === e.last ? e.streak + 1 : 1;
          e.last = key; e.turn++;
        }
      }
    }
  }
});

test('every move reachable by ai() is actually used, and every declared move is reachable', () => {
  const orphans = [];
  for(const id of ids){
    const d = ENEMIES[id], seen = new Set();
    for(const opts of [{}, { hurt:true }, { phase2:true }, { hp:5, hurt:true }, { stole:20 }]){
      for(let trial = 0; trial < 60; trial++){
        const e = dummy({ key:id, ...opts });
        for(let t = 0; t < 24; t++){
          const key = d.ai(e, e.turn);
          seen.add(key);
          e.streak = key === e.last ? e.streak + 1 : 1;
          e.last = key; e.turn++;
        }
      }
    }
    for(const key of Object.keys(d.m)) if(!seen.has(key)) orphans.push(`${id}.${key}`);
  }
  assert.deepEqual(orphans, [], `move(s) defined but no ai() branch reaches them: ${orphans.join(', ')}`);
});

/* Read the damage a move's f() actually deals straight out of its source: the
   two shapes the bestiary uses are eAtk(e, N) and hits(e, N, TIMES). */
function declaredDamage(fn){
  const src = fn.toString();
  const out = [];
  for(const m of src.matchAll(/\beAtk\(\s*\w+\s*,\s*(\d+)\s*\)/g)) out.push(+m[1]);
  for(const m of src.matchAll(/\bhits\(\s*\w+\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/g)){
    for(let i = 0; i < +m[2]; i++) out.push(+m[1]);
  }
  return out;
}

test('an intent never lies about the damage its move deals', () => {
  const lies = [];
  for(const id of ids){
    const d = ENEMIES[id];
    for(const key in d.m){
      const mv = d.m[key];
      if(typeof mv.i === 'function') continue;   // computed intents are checked at runtime
      const real = declaredDamage(mv.f);
      const shownEach = mv.i.d || 0, shownHits = mv.i.x || (shownEach ? 1 : 0);
      if(!real.length && !shownEach) continue;
      if(real.length !== shownHits){
        lies.push(`${id}.${key}: intent shows ${shownHits} hit(s), f() lands ${real.length}`);
        continue;
      }
      if(real.some(v => v !== shownEach))
        lies.push(`${id}.${key}: intent shows ${shownEach} per hit, f() deals ${real.join('+')}`);
    }
  }
  assert.deepEqual(lies, [], lies.join('\n'));
});

test('a move that declares block actually applies some, and vice versa', () => {
  const wrong = [];
  for(const id of ids){
    const d = ENEMIES[id];
    for(const key in d.m){
      const mv = d.m[key];
      if(typeof mv.i === 'function') continue;
      const src = mv.f.toString();
      // eRally(e, str, blk) applies its block through eBlk internally
      const blocks = /\beBlk\(/.test(src) || /\beRally\(\s*\w+\s*,\s*\d+\s*,\s*[1-9]/.test(src);
      if(!!mv.i.v !== blocks)
        wrong.push(`${id}.${key}: intent ${mv.i.v ? 'promises' : 'omits'} block, f() ${blocks ? 'applies' : 'does not apply'} it`);
    }
  }
  assert.deepEqual(wrong, [], wrong.join('\n'));
});

test('the full Spire intent vocabulary is in use, not just attack/defend', () => {
  const kinds = new Set();
  for(const id of ids){
    for(const key in ENEMIES[id].m){
      const i = ENEMIES[id].m[key].i;
      if(typeof i === 'function') continue;
      if(i.d) kinds.add('attack');
      if(i.x > 1) kinds.add('multi-hit');
      if(i.v) kinds.add('block');
      if(i.d && i.v) kinds.add('attack+block');
      if(i.d && (i.buff || i.t === 'buff')) kinds.add('attack+buff');
      if(i.v && (i.buff || i.t === 'buff')) kinds.add('block+buff');
      if(i.d && (i.deb || i.sdeb)) kinds.add('attack+debuff');
      if(i.t === 'buff') kinds.add('buff');
      if(i.t === 'deb') kinds.add('debuff');
      if(i.t === 'sdeb' || i.sdeb) kinds.add('strong debuff');
      if(i.t === 'sleep') kinds.add('sleep');
      if(i.t === 'stun') kinds.add('stun');
      if(i.t === 'flee') kinds.add('flee');
    }
  }
  for(const want of ['attack','multi-hit','block','attack+block','attack+buff','block+buff',
                     'attack+debuff','buff','debuff','strong debuff','sleep','stun','flee']){
    assert.ok(kinds.has(want), `no enemy anywhere uses the "${want}" intent`);
  }
});

test('limit() never lets a move land more times in a row than it allows', () => {
  const roll = P.limit(2, P.weighted({ a:50, b:30, c:20 }));
  for(let trial = 0; trial < 200; trial++){
    const e = dummy({});
    let run = 0, prev = null;
    for(let t = 0; t < 60; t++){
      const k = roll(e, t);
      run = k === prev ? run + 1 : 1;
      assert.ok(run <= 3, `"${k}" landed ${run} turns running under limit(2)`);
      e.streak = k === e.last ? e.streak + 1 : 1;
      e.last = k; prev = k;
    }
  }
});

test('limit() degrades to letting the repeat through rather than deadlocking', () => {
  // a table with one option can never satisfy the rule — it must still return
  const roll = P.limit(1, P.weighted({ only:1 }));
  const e = dummy({ last:'only', streak:9 });
  assert.equal(roll(e, 0), 'only');
});

test('every move of every enemy resolves in a real combat without throwing', async () => {
  const { state: st } = await freshRun();
  const problems = [];
  for(const id of ids){
    const d = ENEMIES[id];
    for(const key in d.m){
      st.G.hp = 9999; st.G.maxHp = 9999; st.G.gold = 500;
      CB.startCombat('fight', 5);
      const e = state.C.foes[0];
      e.key = id;                        // stand this specimen in and let it act
      e.intent = key;
      try{
        const mv = d.m[key];
        const shown = typeof mv.i === 'function' ? mv.i(e) : mv.i;
        assert.ok(shown && typeof shown === 'object', 'intent must resolve to an object');
        mv.f(e);
      }catch(err){
        problems.push(`${id}.${key} -> ${err.message}`);
      }
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

test('every enemy survives a full scripted fight, move after move', async () => {
  const { state: st } = await freshRun();
  const problems = [];
  for(const id of ids){
    const d = ENEMIES[id];
    st.G.hp = 9999; st.G.maxHp = 9999;
    CB.startCombat('fight', 5);
    const e = state.C.foes[0];
    e.key = id; e.hp = e.maxHp = 400;
    try{
      for(let t = 0; t < 16; t++){
        CB.rollIntent(e);
        d.m[e.intent].f(e);
        e.streak = e.intent === e.last ? e.streak + 1 : 1;
        e.last = e.intent; e.turn++;
        if(t === 6) e.hurt = true;        // trip the wake-on-damage branches
        if(t === 10) e.phase2 = true;     // and the boss second-phase ones
      }
    }catch(err){
      problems.push(`${id} broke on turn: ${err.message}`);
    }
  }
  assert.deepEqual(problems, [], problems.join('\n'));
});

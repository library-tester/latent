/* The damage/block pipeline, status effects, and the combat edge cases written
   down in game/docs/mechanics.md — each assertion here is that document's
   claim, made executable. If this file and mechanics.md disagree, one of them
   is wrong; see vision.md's Design Authority section. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { boot, freshRun } from '../helpers/boot.mjs';

await boot();
const state = await import('../../src/core/state.js');
const CB = await import('../../src/game/combat.js');
const { mk } = await import('../../src/core/util.js');

async function combat(kind = 'fight', row = 3){
  const { state: st, run } = await freshRun();
  st.G.hp = st.G.maxHp;
  CB.startCombat(kind, row);
  return st.C;
}
/* Real encounters roll a random enemy with random HP (see game/docs/enemies.md),
   so a fixed test hit can occasionally kill it outright — clamping its HP to 0
   and corrupting a "damage dealt" measurement that assumed survival. Padding
   HP here is safe for every pure-math assertion in this file; tests that
   specifically care about death/splitting/phase transitions set hp themselves
   afterward (or build a synthetic foe), so this never masks what they check. */
const foe = C => { const f = C.foes.find(f => f.alive); f.hp = f.maxHp = 9999; return f; };

test('outgoing damage: base + Strength, floored, clamped >= 0', async () => {
  const C = await combat();
  C.str = 4;
  const f = foe(C), hp = f.hp;
  CB.hit(f, 5);
  assert.equal(hp - f.hp, 9);
});

test('outgoing damage: Weak cuts by 25%, floored', async () => {
  const C = await combat();
  C.st.weak = 1;
  const f = foe(C), hp = f.hp;
  CB.hit(f, 10); // floor(10 * 0.75) = 7
  assert.equal(hp - f.hp, 7);
});

test('outgoing damage: Vulnerable on the target adds 50%, floored', async () => {
  const C = await combat();
  const f = foe(C); f.st.vuln = 1;
  const hp = f.hp;
  CB.hit(f, 10); // floor(10 * 1.5) = 15
  assert.equal(hp - f.hp, 15);
});

test('outgoing damage never goes negative', async () => {
  const C = await combat();
  C.str = -999;
  const f = foe(C), hp = f.hp;
  CB.hit(f, 1);
  assert.equal(f.hp, hp);
});

test('Block absorbs before HP', async () => {
  const C = await combat();
  const f = foe(C);
  f.block = 100;
  const hp = f.hp;
  CB.dmgEnemy(f, 10);
  assert.equal(f.block, 90);
  assert.equal(f.hp, hp);
});

test('enemy Thorns retaliates when the player attacks it', async () => {
  const C = await combat();
  const f = foe(C);
  f.thorns = 5;
  const hpBefore = state.G.hp;
  C.block = 0;
  CB.hit(f, 1);
  assert.equal(hpBefore - state.G.hp, 5);
});

test('incoming damage: Ghost Image negates exactly the first hit each turn', async () => {
  const C = await combat();
  C.powers.ghost = 1;
  C.block = 0;
  const hp = state.G.hp;
  CB.hitPlayer(50);
  assert.equal(state.G.hp, hp, 'first hit negated');
  CB.hitPlayer(5);
  assert.equal(hp - state.G.hp, 5, 'second hit lands normally');
});

test('incoming damage: Intangible caps any hit above 1 to exactly 1', async () => {
  const C = await combat();
  C.intangible = 1;
  C.block = 0;
  const hp = state.G.hp;
  CB.hitPlayer(999);
  assert.equal(hp - state.G.hp, 1);
});

test('Plated Armour sheds one stack per hit that gets through, refreshes at turn start', async () => {
  const C = await combat();
  C.block = 0;
  C.plated = 3;
  CB.hitPlayer(5);
  assert.equal(C.plated, 2);
  const before = C.block;
  CB.startTurn(false);
  assert.equal(C.block, before + 2, 'Plated Armour grants its remaining value as Block at turn start');
});

test('player Thorns retaliates when an enemy attacks', async () => {
  const C = await combat();
  C.retal = 7;
  const f = foe(C);
  const fhp = f.hp;
  C.block = 999; // absorb the incoming hit so only the retaliation moves foe HP
  CB.eAtk(f, 3);
  assert.equal(fhp - f.hp, 7);
});

test('Block from a card: Dexterity adds, Frail multiplies by 0.75, in that order', async () => {
  const C = await combat();
  C.block = 0; C.dex = 2; C.st.frail = 1;
  CB.blk(10); // (10 + 2) * 0.75 = 9
  assert.equal(C.block, 9);
});

test('Block granted "raw" (combat-start / Plated Armour) skips Dexterity and Frail', async () => {
  const C = await combat();
  C.block = 0; C.dex = 5; C.st.frail = 1;
  CB.blk(10, true);
  assert.equal(C.block, 10);
});

test('Artifact negates the next Weak/Vulnerable/Frail on the player, one charge', async () => {
  const C = await combat();
  C.st.artifact = 1;
  CB.pst('weak', 3);
  assert.equal(C.st.weak, 0);
  assert.equal(C.st.artifact, 0);
  CB.pst('weak', 3); // charge spent, this one lands
  assert.equal(C.st.weak, 3);
});

test('Tarnish deals its stack as HP loss at the start of the holder\'s turn, then decrements', async () => {
  const C = await combat();
  C.st.tarnish = 4;
  const hp = state.G.hp;
  CB.startTurn(false);
  assert.equal(hp - state.G.hp, 4);
  assert.equal(C.st.tarnish, 3);
});

test('Weak/Vulnerable/Frail on the player decay by 1 at end of the player\'s turn', async () => {
  const C = await combat();
  // a live enemy's own move could re-apply Weak/Vuln this same turn (that's
  // correct game behavior) — marking foes dead isolates the decay rule being
  // tested from that unrelated randomness, without going through dmgEnemy
  // and triggering the win check.
  C.foes.forEach(f => { f.alive = false; });
  C.st.weak = 2; C.st.vuln = 2; C.st.frail = 2;
  await CB.endTurn();
  assert.equal(C.st.weak, 1);
  assert.equal(C.st.vuln, 1);
  assert.equal(C.st.frail, 1);
});

test('hand cap is 10: drawing does not exceed it', async () => {
  const C = await combat();
  C.hand = Array.from({ length: 9 }, () => mk('burn'));
  C.draw = Array.from({ length: 5 }, () => mk('scorch'));
  CB.drawC(5);
  assert.equal(C.hand.length, 10);
});

test('a boss transitions to Second Exposure at exactly 50% HP, unconditionally', async () => {
  const C = await combat('boss', 14);
  const boss = C.foes[0];
  boss.hp = Math.floor(boss.maxHp * 0.5) + 1;
  const strBefore = boss.str;
  CB.dmgEnemy(boss, 1); // crosses the 50% line
  assert.equal(boss.phase2, true);
  assert.equal(boss.str, strBefore + 3);
  assert.equal(boss.block, 0);
});

test('an enemy that splits spawns two weaker copies on death, capped at 5 combatants', async () => {
  const C = await combat('fight', 5);
  // force a splitting enemy onto the field directly, since encounter rolls are random
  C.foes = [{ key: 'blot', n: 'Blot', pl: '', art: 'blot', hp: 1, maxHp: 30, block: 0, str: 2,
              thorns: 0, st: { weak:0, vuln:0, tarnish:0, frail:0, artifact:0 },
              alive: true, turn: 0, last: null, intent: null, phase2: false, idx: 0, el: null }];
  CB.dmgEnemy(C.foes[0], 1);
  assert.equal(C.foes.filter(f => f.key === 'blotlet').length, 2, 'splits into two blotlets');
  assert.ok(C.foes.every(f => f.key !== 'blotlet' || f.str === 2), 'inherits parent Strength');
});

test('Smoke Bomb-style escape refuses to work in a boss fight', async () => {
  await combat('boss', 14);
  assert.equal(CB.escapeCombat(), false);
  assert.equal(state.C.over, false);
});

test('cheat-death priority: an unopened Moth in a Bottle spends itself before anything else', async () => {
  const C = await combat();
  state.G.pots = ['fairypot'];
  C.block = 0;
  state.G.hp = 5;
  CB.hitPlayer(999);
  assert.ok(state.G.hp > 0, 'run survives');
  assert.equal(state.G.pots.length, 0, 'the ampoule is consumed');
  assert.equal(C.over, false);
});

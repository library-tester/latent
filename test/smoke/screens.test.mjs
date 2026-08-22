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

test('an enemy\'s block badge sits below the health bar, never across it', async () => {
  await freshRun();
  CB.startCombat('fight', 3);
  const combatView = await import('../../src/ui/combat-view.js');
  state.C.foes[0].block = 12;
  combatView.paintEnemies();

  const en = q('.enemy');
  const badge = en.querySelector('.blockbadge');
  assert.ok(badge, 'the badge exists');
  assert.equal(en.querySelector('[data-r="blknum"]').textContent, '12');
  assert.notEqual(badge.style.display, 'none', 'and is visible while the enemy holds block');
  // the fix: in normal flow inside .hprow, which follows .bar as a sibling —
  // it used to be position:absolute at bottom:26px, landing on top of the bar
  assert.ok(en.querySelector('.hprow > .blockbadge'), 'badge lives in the HP row');
  assert.equal(en.querySelector('.bar').nextElementSibling.className, 'hprow',
    'the HP row comes after the bar rather than overlapping it');

  state.C.foes[0].block = 0;
  combatView.paintEnemies();
  assert.equal(badge.style.display, 'none', 'and disappears at zero block');
});

test('hovering a relic in the top bar pops its description, and leaving clears it', async () => {
  await freshRun();
  const span = q('#relicbar > span');
  assert.ok(span, 'the run\'s starting relic is in the strip');
  assert.equal(span.hasAttribute('title'), false, 'no duplicate native tooltip');

  const tip = q('#tip');
  assert.equal(tip.classList.contains('on'), false, 'nothing showing to begin with');
  span.dispatchEvent(new window.MouseEvent('pointerover', { bubbles: true }));
  assert.equal(tip.classList.contains('on'), true, 'hover pops the bubble');
  assert.match(tip.textContent, /Cracked Safelight/, 'it names the relic');
  assert.match(tip.textContent, /3 Light/, 'and says what it does');

  span.dispatchEvent(new window.MouseEvent('pointerout', { bubbles: true }));
  assert.equal(tip.classList.contains('on'), false, 'leaving clears it');
});

test('a long press pops the same bubble on a touchscreen and swallows the tap', async () => {
  await freshRun();
  const span = q('#relicbar > span');
  const tip = q('#tip');
  const touch = type => Object.assign(new window.MouseEvent(type, { bubbles: true }), { pointerType: 'touch' });

  span.dispatchEvent(touch('pointerdown'));
  assert.equal(tip.classList.contains('on'), false, 'a brief touch shows nothing yet');
  await sleep(450);
  assert.equal(tip.classList.contains('on'), true, 'holding past the threshold pops it');

  // the press already answered the question — the relic sheet must stay shut
  click(span);
  assert.equal(sheetOpen(), false, 'the swallowed tap did not also open the relic sheet');
  span.dispatchEvent(touch('pointerup'));
  assert.equal(tip.classList.contains('on'), false, 'releasing clears it');

  // a short tap still opens the sheet normally
  span.dispatchEvent(touch('pointerdown'));
  span.dispatchEvent(touch('pointerup'));
  click(span);
  assert.equal(sheetOpen(), true, 'a plain tap still opens the relic sheet');
  click(q('[data-a="close"]'));
});

test('an event that picks a fight drops you straight into combat with elite spoils', async () => {
  const { EVENTS } = await import('../../src/data/events.js');
  await freshRun();
  state.G.at = 0;
  EVENTS.find(e => e.id === 'colosseum').o[0].go();
  assert.ok(state.C, 'a combat is running');
  assert.equal(state.C.kind, 'elite', 'and it pays out as an elite when won');
  assert.ok(q('#field'), 'the combat field rendered');
  assert.ok(state.C.foes.length >= 1);
});

test('an event can hand over a relic and then start the fight once the sheet is dismissed', async () => {
  const { EVENTS } = await import('../../src/data/events.js');
  await freshRun();
  state.G.at = 0;
  const before = state.G.relics.length;
  EVENTS.find(e => e.id === 'sphere').o[0].go();
  assert.ok(sheetOpen(), 'the acquisition sheet is up first');
  assert.equal(state.G.relics.length, before + 1, 'the relic is banked before the fight, win or lose');

  click(q('#sheet [data-a="close-next"]'));
  assert.ok(state.C, 'dismissing the sheet starts the queued combat');
  assert.equal(state.C.kind, 'elite');
});

test('Calling Bell hands over all 3 relics, not just the first of the chain', async () => {
  const { CARDS } = await import('../../src/data/cards.js');
  await freshRun();
  state.G.at = 0;
  const before = state.G.relics.length;
  RUN.grantRelic('callingbell');

  // work through the chain the way a player does: one "Continue" per sheet
  let sheets = 0;
  while(sheetOpen() && sheets < 12){
    const btn = q('#sheet [data-a="close-next"]');
    if(!btn) break;
    click(btn); sheets++;
  }
  assert.equal(state.G.relics.length - before, 4, 'the Bell itself plus its 3 relics');
  assert.equal(state.G.deck.filter(c => CARDS[c.id].r === 'curse').length, 3, 'and exactly 3 curses');
});

test('a sealed cabinet holding several relics hands over every one', async () => {
  await freshRun();
  state.G.at = 0;
  const before = state.G.relics.length;
  // the markup ui/rooms.js emits for a multi-relic cabinet
  q('#scene').innerHTML = '<button data-a="take-treasure" data-g="40" data-i="brass,needle,apron">open</button>';
  click(q('[data-a="take-treasure"]'));
  let sheets = 0;
  while(sheetOpen() && sheets < 10){
    const btn = q('#sheet [data-a="close-next"]');
    if(!btn) break;
    click(btn); sheets++;
  }
  assert.equal(state.G.relics.length - before, 3);
  for(const id of ['brass', 'needle', 'apron']) assert.ok(state.G.relics.includes(id), `missing ${id}`);
});

test('hovering an ampoule beside the piles describes it without spending it', async () => {
  await freshRun();
  state.G.pots = ['lux', 'balm'];
  CB.startCombat('fight', 3);

  const span = q('#potbar > span[data-a="pot"]');
  assert.ok(span, 'the ampoule row rendered an icon');
  const tip = q('#tip');
  span.dispatchEvent(new window.MouseEvent('pointerover', { bubbles: true }));
  assert.equal(tip.classList.contains('on'), true, 'hover pops the bubble');
  assert.match(tip.textContent, /Lux Ampoule/, 'it names the ampoule');
  assert.match(tip.textContent, /Light/, 'and says what it does');
  assert.equal(state.G.pots.length, 2, 'reading about it does not drink it');

  span.dispatchEvent(new window.MouseEvent('pointerout', { bubbles: true }));
  assert.equal(tip.classList.contains('on'), false);
});

test('holding an ampoule describes it and swallows the tap, so a long press never drinks it', async () => {
  await freshRun();
  state.G.pots = ['lux', 'balm'];
  CB.startCombat('fight', 3);
  const touch = type => Object.assign(new window.MouseEvent(type, { bubbles: true }), { pointerType: 'touch' });
  const tip = q('#tip');

  let span = q('#potbar > span[data-a="pot"]');
  span.dispatchEvent(touch('pointerdown'));
  assert.equal(tip.classList.contains('on'), false, 'a brief touch shows nothing yet');
  await sleep(450);
  assert.equal(tip.classList.contains('on'), true, 'holding past the threshold describes it');

  click(span);
  assert.equal(state.G.pots.length, 2, 'the swallowed tap did NOT drink the ampoule');
  span.dispatchEvent(touch('pointerup'));

  // a plain short tap still uses it
  span = q('#potbar > span[data-a="pot"]');
  span.dispatchEvent(touch('pointerdown'));
  span.dispatchEvent(touch('pointerup'));
  click(span);
  assert.equal(state.G.pots.length, 1, 'a plain tap still spends it');
});

test('a sleeping enemy does nothing until it is struck, then wakes for good', async () => {
  const { ENEMIES } = await import('../../src/data/enemies.js');
  await freshRun();
  CB.startCombat('fight', 3);
  const jar = ENEMIES.jar;
  // an untouched Bell Jar sits sealed
  let e = { key:'jar', hp:30, maxHp:30, turn:0, last:null, streak:0, hurt:false };
  assert.equal(jar.ai(e, 0), 'settle');
  assert.equal(jar.m.settle.i.t, 'sleep', 'and reads as asleep, not as an attack');

  // being hit wakes it, and it never settles again
  e.hurt = true;
  const woke = jar.ai(e, 0);
  assert.notEqual(woke, 'settle', 'damage wakes it');
  assert.ok(e.woke, 'and the waking is permanent');
  for(let t = 1; t < 12; t++){
    e.turn = t;
    assert.notEqual(jar.ai(e, t), 'settle', `it went back to sleep on turn ${t}`);
  }
});

test('damage sets the hurt flag that sleepers read', async () => {
  await freshRun();
  CB.startCombat('fight', 3);
  const foe = state.C.foes[0];
  assert.equal(foe.hurt, false, 'starts untouched');
  CB.dmgEnemy(foe, 3);
  assert.equal(foe.hurt, true, 'and remembers being hit');
});

test('an enemy can flee, and the fight is won once the table is clear', async () => {
  await freshRun();
  CB.startCombat('fight', 3);
  state.C.foes.forEach((f, i) => { if(i) f.alive = false; });   // leave exactly one
  const foe = state.C.foes[0];
  CB.foeFlee(foe);
  assert.equal(foe.alive, false);
  assert.equal(foe.fled, true, 'it left rather than died');
  assert.equal(state.C.over, true, 'and an empty table ends the fight');
});

test('a thief takes real gold, and it does not come back when it leaves', async () => {
  await freshRun();
  state.G.gold = 200;
  CB.startCombat('fight', 3);
  const foe = state.C.foes[0];
  CB.eSteal(foe, 30);
  assert.equal(state.G.gold, 170);
  assert.equal(foe.stole, 30, 'the enemy is carrying it');
  CB.foeFlee(foe);
  assert.equal(state.G.gold, 170, 'fleeing does not refund it');
});

test('eSteal cannot take more gold than the player has', async () => {
  await freshRun();
  state.G.gold = 5;
  CB.startCombat('fight', 3);
  CB.eSteal(state.C.foes[0], 40);
  assert.equal(state.G.gold, 0, 'never goes negative');
});

test('a summoner puts more on the table, up to the field cap', async () => {
  await freshRun();
  CB.startCombat('fight', 3);
  const before = state.C.foes.filter(f => f.alive).length;
  CB.summonFoe('platerat', 1);
  assert.equal(state.C.foes.filter(f => f.alive).length, before + 1);
  const fresh = state.C.foes[state.C.foes.length - 1];
  assert.equal(fresh.key, 'platerat');
  assert.ok(fresh.intent, 'and it arrives with an intent already rolled');

  CB.summonFoe('platerat', 9);   // far past the cap
  assert.ok(state.C.foes.filter(f => f.alive).length <= 5, 'the field never exceeds 5');
});

test('an enemy that watches for Skills gains Strength when one is played', async () => {
  await freshRun();
  CB.startCombat('fight', 3);
  // Twin Halide enrages, then grows on every Skill
  const foe = state.C.foes[0];
  foe.key = 'halide'; foe.enraged = 1;
  const before = foe.str;
  CB.foeSaw('sawSkill', { id:'dodge' }, { t:'skill' });
  assert.equal(foe.str, before + 2, 'the Skill fed it');

  // and an un-enraged one is untouched
  foe.enraged = 0;
  const after = foe.str;
  CB.foeSaw('sawSkill', { id:'dodge' }, { t:'skill' });
  assert.equal(foe.str, after);
});

test('the composed intent readout shows every part of a move', async () => {
  const combatView = await import('../../src/ui/combat-view.js');
  await freshRun();
  CB.startCombat('fight', 3);
  const foe = state.C.foes[0];

  // an attack-and-block move must render both an attack and a block figure
  foe.key = 'grub'; foe.intent = 'render'; foe.str = 0;
  const html = combatView.intentHTML(foe);
  assert.match(html, /class="i atk"/, 'the attack half is drawn');
  assert.match(html, /class="i def"/, 'and so is the block half');
  assert.match(html, />6</, 'showing the actual block value');

  // a standalone state replaces the whole readout
  foe.key = 'jar'; foe.intent = 'settle';
  const asleep = combatView.intentHTML(foe);
  assert.doesNotMatch(asleep, /class="i atk"/, 'a sleeping enemy shows no attack number');
});

/* The card hover lift is a transform, and every strip a card sits in is a
   scrollport (`overflow-x:auto` on the hand, `overflow-y:auto` on the sheet
   body and the shop). A scrollport clips at its padding edge, so a card whose
   resting top is flush with that edge loses its top border the moment it
   lifts. The fix is spacing — and the only thing keeping it correct is that
   the buffer stays >= the largest lift, which is what this asserts.

   This is a static check on the stylesheet, not a layout check: jsdom does no
   layout, so a real geometry assertion is not available here. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const css = f => fs.readFileSync(path.join(ROOT, 'css', f), 'utf8');
const combat = css('combat.css'), chrome = css('chrome.css'), responsive = css('responsive.css');

/** Largest upward translate any card can take on. */
function maxLift(){
  const lifts = [...(combat + responsive).matchAll(/\.card[^{}]*\{[^}]*?transform:translateY\(-(\d+(?:\.\d+)?)px\)/g)]
    .map(m => +m[1]);
  assert.ok(lifts.length >= 2, 'expected both the hover lift and the selected lift to be found');
  return Math.max(...lifts);
}
/** The `padding-top` of a rule, in px. */
function padTop(sheet, selector){
  const rule = new RegExp(selector.replace(/[.#*]/g, '\\$&') + '\\s*\\{([^}]*)\\}').exec(sheet);
  assert.ok(rule, `no rule found for ${selector}`);
  const p = /(?:^|;)\s*padding(-top)?:\s*([^;]+)/.exec(rule[1]);
  assert.ok(p, `no padding declared on ${selector}`);
  return parseFloat(p[1] ? p[2] : p[2].trim().split(/\s+/)[0]);
}

test('the hand strip leaves room for a card to lift without losing its top border', () => {
  assert.ok(padTop(combat, '#hand') >= maxLift(),
    `#hand padding-top must cover the ${maxLift()}px lift, or overflow-x:auto clips the card top`);
});

test('the card grid leaves room for its top row to lift inside a scrolling sheet', () => {
  // covers the deck view, draw/spent piles, every pick/remove/upgrade sheet and
  // the shop shelf — they all lay cards out with .grid
  const hoverLift = +/\.card:not\(\.cant\):not\(\.sel\):hover\{transform:translateY\(-(\d+)px\)/.exec(responsive)[1];
  assert.ok(padTop(chrome, '.grid') >= hoverLift,
    `.grid padding-top must cover the ${hoverLift}px hover lift`);
});

test('the relic strip leaves room for its own smaller lift', () => {
  const lift = +/#relicbar>span:hover[^{]*\{[^}]*translateY\(-(\d+)px\)/.exec(responsive)[1];
  assert.ok(padTop(chrome, '#relicbar') >= lift,
    `#relicbar padding-top must cover the ${lift}px lift`);
});

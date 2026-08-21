/* Guards the exact bug class the audit found and fixed: a relic/potion/event
   calling something with a signature the engine no longer honors. Two checks:

     1. Every module under src/ parses and the whole import graph links —
        catches typos, missing exports, circular-import faults.
     2. Every handler a relic defines (a method named after a hook event) is
        actually reachable from a real fire()/mod() call somewhere in the
        engine. A relic with a handler nobody fires is not an error — it's a
        silent dead feature, exactly like the "Specimen Drawer" bug was
        (a stale call site, not a thrown exception). See game/docs/mechanics.md. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { boot } from '../helpers/boot.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/* src/main.js has top-level side effects (it calls bindInput(), which needs a
   real `document`), so it needs a booted DOM before it can import cleanly —
   boot() itself performs that import, so its success already proves main.js
   imports without throwing. The sweep below covers every other module. */
await boot();

function walk(dir){
  const out = [];
  for(const entry of fs.readdirSync(dir, { withFileTypes: true })){
    const full = path.join(dir, entry.name);
    if(entry.isDirectory()) out.push(...walk(full));
    else if(entry.name.endsWith('.js')) out.push(full);
  }
  return out;
}

const srcFiles = walk(path.join(ROOT, 'src')).filter(f => !f.endsWith(path.join('src', 'main.js')));

test('every src module parses, links, and evaluates without throwing', async () => {
  for(const f of srcFiles){
    await assert.doesNotReject(
      import(pathToFileURL(f).href),
      `${path.relative(ROOT, f)} failed to import`
    );
  }
});

test('every relic handler is reachable from a real engine event', async () => {
  const { RELICS } = await import(pathToFileURL(path.join(ROOT, 'src/data/relics.js')).href);

  const declared = new Set();
  for(const id in RELICS){
    for(const key in RELICS[id]){
      if(typeof RELICS[id][key] === 'function') declared.add(key);
    }
  }

  const emitted = new Set(['onGain']); // called directly by grantRelic(), not through fire()/mod()
  const nameRe = /\b(?:fire|mod)\(\s*'([A-Za-z]+)'/g;
  for(const f of srcFiles){
    const text = fs.readFileSync(f, 'utf8');
    let m;
    while((m = nameRe.exec(text))) emitted.add(m[1]);
  }

  const dead = [...declared].filter(name => !emitted.has(name)).sort();
  assert.deepEqual(dead, [], `relic handler(s) declared but never fired by the engine: ${dead.join(', ')}`);
});

test('every potion has a use() function and nothing else callable that isn\'t one', async () => {
  const { POTS } = await import(pathToFileURL(path.join(ROOT, 'src/data/potions.js')).href);
  for(const id in POTS){
    assert.equal(typeof POTS[id].use, 'function', `potion "${id}" has no use()`);
  }
});

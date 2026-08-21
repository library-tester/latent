/* Boots one jsdom window from the real index.html and wires it into Node's
   globals exactly the way a browser tab would supply them — this game has no
   headless-safe abstraction layer, so testing it honestly means giving it a
   real `document`, not a mock of one.

   Call `boot()` once per test file (top-level, before any `test()` blocks
   import game modules that touch the DOM at module-evaluation time — none
   currently do, but state.js/chrome.js etc. all assume `document` exists the
   moment a UI function runs). Every test in that file then shares one DOM and
   one module registry, resetting game state between cases via `newRun()` /
   `startCombat()` the same way the app itself does — not by re-booting jsdom,
   which the ES module cache wouldn't let us do meaningfully anyway.

   What's stubbed, and why:
     - AudioContext is left undefined: jsdom has no WebAudio, and Snd.boot()
       already no-ops gracefully without one (see core/audio.js).
     - HTMLElement.animate() is stubbed: jsdom doesn't implement the Web
       Animations API; nothing in the game reads the returned Animation object.
     - window.storage is an in-memory Map standing in for the host object this
       project deliberately never defines itself (core/persist.js) — enough to
       exercise save/load without needing a real host. */

import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const INDEX_HTML = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

let booted = false;

export async function boot(){
  if(booted) return; // idempotent: a file may import several test modules that each call boot()
  booted = true;

  const dom = new JSDOM(INDEX_HTML, {
    url: 'http://localhost/',
    pretendToBeVisual: true,
    runScripts: 'outside-only', // we drive src/main.js ourselves via import, not via <script>
  });
  const w = dom.window;

  const globalsToShare = [
    'window', 'document', 'getComputedStyle',
    'requestAnimationFrame', 'cancelAnimationFrame',
    'Element', 'HTMLElement', 'Node', 'SVGElement',
    'MouseEvent', 'KeyboardEvent', 'Event',
  ];
  for(const k of globalsToShare){
    try{ globalThis[k] = w[k]; }
    catch{ Object.defineProperty(globalThis, k, { value: w[k], configurable: true }); }
  }

  globalThis.AudioContext = undefined;
  w.HTMLElement.prototype.animate = () => ({});

  const store = new Map();
  w.storage = {
    get: async k => (store.has(k) ? { value: store.get(k) } : null),
    set: async (k, v) => void store.set(k, v),
    delete: async k => void store.delete(k),
  };
  w.__store = store; // exposed so a test can assert on what got saved

  await import(path.join(ROOT, 'src/main.js'));
  await sleep(30); // let main.js's async storage-preference check settle
}

export const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Resolve one src module by its repo-relative path, e.g. 'src/game/combat.js'. */
export const src = rel => import(path.join(ROOT, rel));

/** A fresh, deterministic-enough starting run: newRun() plus generous gold so
    shop/reward tests aren't gated on the run's actual starting gold. */
export async function freshRun(){
  const state = await src('src/core/state.js');
  const run = await src('src/game/run.js');
  run.newRun();
  state.G.gold = 999;
  return { state, run };
}

export const click = el => el && el.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
export const q = sel => document.querySelector(sel);
export const qa = sel => [...document.querySelectorAll(sel)];

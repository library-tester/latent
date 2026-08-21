/* ══════════════════════════════════════════════════════════════
   LATENT — a small deckbuilder in twelve plates
   ══════════════════════════════════════════════════════════════
   Entry point. Everything below this file is imported, never run
   on its own: this is the only module with top-level side effects.

   The tree, roughly outside-in:
     core/   things the game is built out of — state, sound, storage
     data/   the content: cards, relics, enemies, acts, events
     game/   the rules: map generation, run progression, combat
     ui/     everything that touches the DOM
*/
import { Snd } from './core/audio.js';
import { paintBar } from './ui/chrome.js';
import { bindInput } from './ui/input.js';
import { title } from './ui/title.js';

bindInput();

/* The sound preference outlives a run, so it is restored before the first paint. */
(async () => {
  try{
    if(window.storage){
      const r = await window.storage.get('latent:snd');
      if(r && r.value === '0'){ Snd.on = false; paintBar(); }
    }
  }catch(e){}
})();

paintBar();
title();

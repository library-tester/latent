# latent

A Slay the Spire clone. No dependencies and no build step — the art is inline SVG and
the entire soundtrack is synthesised at runtime, so nothing but source ships.

## Running it

The game loads as ES modules, so it has to be served over HTTP. Opening `index.html`
straight off disk (`file://`) will be blocked by the browser.

    python3 -m http.server 8000     # then open http://localhost:8000

## Layout

    index.html        markup only — the shell the game paints into
    css/
      base.css        design tokens, reset, the plate backdrop, the app shell
      chrome.css      top bar, scene container, buttons, fx, modal sheets
      screens.css     title screen and act map
      combat.css      the field, the player strip, the hand, card faces
      responsive.css  viewport- and pointer-dependent rules; loaded last so it wins
    src/
      main.js         entry point; the only module with top-level side effects
      core/           what the game is built from
        state.js      the run, the fight, and the UI scratch state
        util.js       randomness, arrays, timing
        audio.js      the synthesiser
        persist.js    saving, which is silently optional
      data/           the content
        cards.js  relics.js  potions.js  enemies.js  acts.js  events.js
        glyphs.js     card glyphs and intent icons
        art.js        one drawing per enemy
      game/           the rules
        map.js        map generation
        run.js        run progression, rewards, gold, HP, relics
        combat.js     turn order, damage, status, card resolution
      ui/             everything that touches the DOM
        chrome.js  fx.js  card-view.js  title.js  map-view.js
        combat-view.js  sheets.js  rooms.js  shop.js  rewards.js
        endings.js  input.js

### A note on state

`core/state.js` holds the handful of bindings that get *reassigned* — `G` (the run),
`C` (the current fight), and the UI scratch state. ES module bindings are live, so
reading `G` from any module always sees the current run. Reassigning an import is not
allowed, though, so each one has a setter: `setG(...)`, `setC(...)`, and so on.
Mutating a field (`G.hp`, `C.energy`) needs no setter — only swapping the whole object.

### Adding things

A new card, relic, potion, enemy or event is one entry in the matching `data/` file;
nothing else needs to know about it. An enemy's `art` key points at `data/art.js`, a
card's or relic's `g` key at `data/glyphs.js`, and `data/acts.js` decides which act
draws from which specimens.

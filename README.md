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

### Relics

160 relics across seven tiers — starter, common, uncommon, rare, boss, shop and event —
modelled on Slay the Spire's pool. Each entry in `data/relics.js` notes the Spire relic
it comes from; the names are this archive's own.

A relic is **data plus handlers**. The engine never mentions a relic by name: it
announces what just happened through `game/hooks.js`, and any relic that defines a
method of that name answers.

    fire('exhaust', card)        // announce — every listener runs
    mod('dmgIn', 10)             // thread a value — each handler returns a new one

So a relic is written the way it reads:

    torii:{n:'Torii', g:'plate', r:'rare', d:'Damage of 5 or less is reduced to 1.',
      dmgIn(v){ return v > 0 && v <= 5 ? 1 : v; }},

    charon:{n:"Charon's Ashes", g:'flame', r:'rare', d:'When you Exhaust a card, deal 3 damage to ALL enemies.',
      exhaust(){ hitAll(3); }},

There are 76 events. Counters live on `C.rc` (cleared each combat) and `G.rc` (kept for
the run); `tick(bag, key, every)` handles the "every 10th attack" shape. Relics that need
to ask the player something — Astrolabe, Empty Cage, the Bottled trio — queue a flow to
run when their acquisition sheet is dismissed.

Adding a relic means adding one entry. If it needs a trigger that does not exist yet, add
one `fire()`/`mod()` call at the right point in the engine and every future relic can use it.

Supporting mechanics added for the pool: Dexterity, Frail, Artifact, Intangible and
Plated Armour, plus relic rarity tiers, energy carry-over, hand retention, scrambled card
costs, potion potency, shop pricing and the darkroom's extra options.

### Ampoules

37 ampoules across three tiers, modelled on Slay the Spire's potions and rolled
65/25/10 the way the Spire rolls them. An entry in `data/potions.js` is data plus
a `use` function:

    firepot:{n:'Fire Ampoule', g:'flame', r:'common', combat:1, tg:1,
      d:'Deal 20 damage to one enemy.',
      use:(m,e)=>hit(e,20*m)},

`m` is the potency multiplier — Sacred Bark passes 2 and every ampoule doubles
without knowing the relic exists. `tg:1` means it needs an enemy: with one plate on
the table it fires straight away, with several it waits for a tap, exactly like a
targeted card. `combat:1` keeps it sheathed outside a fight.

Ampoules that ask a question open a flow from `ui/sheets.js` — `potionPick` (one of
three, free this turn), `handSelect` (tick off any number to discard or Exhaust) and
`discardPick` (pull one back out of the spent pile). One ampoule is never tapped at
all: the Moth in a Bottle spends itself inside `checkDeath()` when the run would end.

Supporting mechanics added for the pool: Regeneration, temporary Dexterity,
whole-card duplication, playing off the top of the draw pile, and fleeing a fight.

### Adding things

A new card, ampoule, enemy or event is one entry in the matching `data/` file;
nothing else needs to know about it. An enemy's `art` key points at `data/art.js`, a
card's or relic's `g` key at `data/glyphs.js`, and `data/acts.js` decides which act
draws from which specimens.

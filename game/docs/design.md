# Design — LATENT

## Core loop (implemented)

**Session:** Title → begin/resume run → walk act map node by node → (fight | rest |
shop | event | treasure) → repeat until act boss dies → healed into next act's map →
repeat ×3 → victory or death returns to title, run cleared.

**Combat turn:** draw hand → spend Energy playing cards, targeting as needed → end
turn → enemies each execute their already-telegraphed intent in sequence → statuses
tick → next turn. Ends the instant either side's HP hits 0.

**Deck:** most rooms offer a way to add, remove, upgrade, or transform cards — the
deck is the one thing actively curated across a whole run; relics/potions are additive.

## Structure

```
title.js ─ newRun()/adoptRun() ─> run.js (G: the run) ─> map.js (generates act map)
                                       │
                              map-view.js: enterNode(i)
                    ├─ fight/elite/boss ─> combat.js (C: the fight)
                    ├─ rest/shop/treasure/event ─> rooms.js (+ data/events.js)
```

State lives in two module bindings (`core/state.js`): **`G`** (the run) and **`C`**
(the current fight, or `null`). Both are mutated via exported setters since ES module
bindings can't be reassigned by importers; reading is always live.

## Architecture: data + hooks, not special cases

No `if (relicId === 'x')` anywhere in the engine. `game/hooks.js` exports `fire(event,
...args)` (run every listener) and `mod(event, value, ...args)` (thread a value
through every listener). The engine calls these at meaningful points (`combatStart`,
`dmgIn`, `cardPlayed`, `exhaust`, `enterRoom`, `shopPrice`, ...). A relic or potion is
a plain object; if it defines a method named after an event, that runs. **New content
should never require touching the engine** — unless it needs a trigger that doesn't
exist yet, in which case one `fire()`/`mod()` call is added at the right point and
every future piece of content can use it. Cards follow a simpler pattern: each has a
`p(card, target, x)` play function calling shared combat primitives directly — not
routed through the hook bus, since a card's effect is only ever that card's business.

## Randomness (implemented)

Plain `Math.random()` (`core/util.js`: `R`, `pick`, `rr`, `shuffle`). No seeding, no
deterministic replay; a resumed run does not reproduce the sequence it would have had
uninterrupted, since only game state is saved, not RNG state.

## Save/load (implemented, host-dependent)

Optional and depends on an **external host object, `window.storage`**, which this
codebase never defines — injected by whatever embeds `index.html`. Async
get/set/delete on three keys: `latent:run` (full `G`, JSON), `latent:best` (score
int), `latent:snd` (mute flag). Without `window.storage`, every call is a caught
no-op — the run lives only in memory. No versioning beyond `adoptRun()` patching a
few fields added after some saves already existed.

## Testing

No test suite exists — no `package.json`, no runner, no test files. Verification has
been ad hoc and disposable, never committed as regression coverage. **Gap** — see
`roadmap.md`.

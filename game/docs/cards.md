# Cards, Relics, Ampoules — LATENT

**Implemented.** `data/cards.js`, `data/relics.js`, `data/potions.js`. Architecture
(the hook bus) is in `design.md` and, in more depth, the top-level `README.md` —
not duplicated here.

## Cards

**77 total**: 3 starter, 20 common, 36 uncommon, 16 rare, 2 curse. By type: 28
Attack, 32 Skill, 15 Power, 2 Curse.

**Starting deck** (10 cards): 5× Burn (Attack), 4× Dodge (Skill, Block), 1× Flare
(Skill, cost 0, Light) — plus the starting relic, +3 Light at combat start.

A card: name, type, rarity, glyph, cost, target flag, level-0/1 value array, text
function, and a `p(card, target, x)` play function calling combat primitives directly.
One upgrade tier only; 5 cards additionally get cheaper on upgrade rather than just
stronger for the same cost.

**Tags in use**: `tg` targeted (most Attacks + some Skills); `ex` self-Exhausts after
play (8 cards); `eth` Ethereal (1 card); `xc` X-cost (1 card); `req` conditionally
unplayable (2 cards); `un` unplayable (the 2 curses); `stk` "plain Attack, no attached
effect" (used by a few relic/ampoule interactions that care about that distinction).

**Light** is separate from Energy: cards bank it, a smaller set spend it all at once
for an effect scaled by however much was saved — almost always burst damage,
occasionally Block/Strength. Not currently a passive damage/defense multiplier by
itself — `todo/todo.md` explicitly asks for that; see `roadmap.md`.

**Powers** (15 cards) are persistent per-combat effects checked at fixed points in
the turn loop (start of turn, on Block gained, on Exhaust, on Attack played, end of
turn) — hard-coded call sites, unlike the relic hook bus.

## Relics

**160** across 7 tiers: 1 starter, 39 common, 38 uncommon, 28 rare, 23 boss, 16 shop,
15 event. Each is data plus zero or more handler methods named after an engine event.
Relics needing a pickup decision (bottle a card, transform N cards, choose from a
fresh offer) queue that flow right after the "Acquired" sheet closes. Unforced roll
weight: 50/33/17 common/uncommon/rare; boss rewards and the shop's third relic slot
pull dedicated pools; an owned relic never re-rolls, and an exhausted forced tier
widens rather than returning nothing. The 15 `event` relics sit outside every roll —
each is named directly by the room event it belongs to, and `events.test.mjs` asserts
none of them is left undroppable.

## Ampoules

**37** across 3 tiers (19/10/8), rolled 65/25/10. Data plus `use(potency, target)`.
Most combat-only; a few work anywhere. Targeted ones follow the same
auto-fire-with-one-enemy rule as cards. A few open a modal choice instead of
resolving immediately (pick 1 of 3 free cards; tick off hand cards to discard-redraw
or Exhaust; pull one card back from the spent pile). One is never manually used — it
sits inert until the run would otherwise end, then spends itself.

## Curses

2 exist: one is inert dead weight in hand; the other costs 1 HP/copy held at end of
turn on top of that. Enter the deck only via specific events, one relic, and a couple
of high-risk effects — never the normal reward roll.

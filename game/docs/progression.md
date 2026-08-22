# Progression — LATENT

**Implemented** unless marked otherwise. `game/map.js`, `game/run.js`,
`data/acts.js`, `ui/rooms.js`, `ui/rewards.js`, `ui/shop.js`, `data/events.js`.

## Run structure

Exactly **3 acts**, each its own generated map ending in that act's boss. No
branching between acts. Between acts, heal to full automatically before the next
map opens.

## Map generation

7 columns, **15/16/17 rows** (Act I/II/III). 4 random entry columns at row 0; edges
built left-to-right under an invariant that makes crossings structurally impossible;
occasional 2–3-way branches. Final row before the boss always collapses to one node.

Each row is a *list of possible types*; most nodes roll independently from that list.
Two exceptions are forced 100%: the Rest row and the Treasure row contain only that
type — every act guarantees **exactly 2 Rest rows and 2 Treasure rows** at fixed
depths. The generator additionally guarantees at least one Shop and one Event within
two depth bands each (roughly first/second half), converting a fight node if the roll
didn't naturally produce one — position within the band isn't fixed, only presence.

## Node types

- **Fight** — ordinary combat from the depth-appropriate pool.
- **Elite** — tougher optional fight, better rewards.
- **Boss** — the act's one boss, always last.
- **Rest** ("Darkroom") — heal 35% Max HP (relic-tunable) or refine (permanently
  upgrade) one card. Relics can add more options here (take a card, permanent
  Strength, scrape a card, dig for a relic). **Fully implemented already** — see
  `roadmap.md` for a note on possible discoverability issues.
- **Shop** ("The Fixer") — buy cards/relics/ampoules, or pay to remove a card.
  Restocks only if a relic says so.
- **Treasure** ("Sealed cabinet") — free gold and usually a free relic, no choice.
- **Event** — 1 of 12 authored encounters, 2–3 real-tradeoff options each. Drawn
  without replacement until exhausted, then the pool resets.

## Rewards

Gold: fight 12–20 (+row), elite 40–62, boss 85–115, treasure 25–60 (pre-relic).
Cards: choice of 3 per combat (relic-tunable count/odds), declinable; a boss offers
3 **rare** cards rather than a weighted roll. Relics: a boss lays out 3 from the boss
pool and you keep one; elites usually drop one outright. Ampoules: a chance per reward
(higher after elite), capped by current capacity (3 default, relic-extendable).

## Economy

Start: **72/72 HP, 55 gold**, 10-card deck, 1 relic. Shop: cards 42–58g (common) /
72–96g (uncommon) / 120–160g (rare); relics 140–190g; ampoules 45–72g; removal 75g
base (all relic-tunable). No gold cap, no banking mechanic.

## Scoring & ending

Score = `act×1000 + depth reached`, tracked as one persisted "best" across all runs.
Winning Act III sets it to a fixed 4000 ("the image held — all three acts"). Any
other death shows furthest act/depth. Win or loss both clear the saved run — no run
history beyond the one best-score integer.

## Save/load

Full detail in `design.md`. Auto-saves after nearly every state change, but only if
`window.storage` (a host-provided object this project never defines) exists.
Without it, closing the tab loses the run. One save slot; a new run overwrites it.

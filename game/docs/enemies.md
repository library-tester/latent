# Enemies — LATENT

**Implemented.** Data: `data/enemies.js` (bestiary), `data/acts.js` (per-act rosters).
This describes the system; see source for exact per-enemy numbers.

## Inventory

**62 enemies**: 44 ordinary, 9 elite, 9 boss (3 of each per act × 3 acts). Each has
name, flavor label, HP range, art key, an `ai()` function, and a move table where
every move carries both a shown intent and an effect function that always matches it
exactly — no fake/misleading intents.

## Encounter selection

Each act has `easy`/`mid`/`hard` group pools (a group = one or several enemies).
Which pool an ordinary fight draws from depends on row depth as a fraction of the
act's total rows (~0–22% easy, ~22–62% mid, rest hard). Elite nodes draw from a
separate per-act elite pool. Boss nodes always fight the boss rolled once at
act-start — never a random pick per fight. Non-boss HP additionally scales
`+floor(row×0.7)`; boss HP does not.

## AI patterns

No single shared algorithm — recurring shapes: weighted coin-flip, fixed rotation
(`turn % n`), no-immediate-repeat, and phase-dependent rotation (different sequence
before/after a boss's Second Exposure). Difficulty curve is driven by pool selection
(depth) plus authored numbers, not a difficulty toggle.

## Elites & bosses

Elites are ordinary encounters flagged `elite:1` with higher HP/damage than the
`hard` pool; better rewards are decided in `ui/rewards.js`, not in the bestiary.
Bosses get the automatic Second Exposure transition unconditionally (see
`mechanics.md`) — not something individual boss data opts into. Boss pools are one
per act (3 candidates), disjoint across acts; excluding the previous act's boss from
the next roll is defensive code with no current visible effect (the pools never
overlap anyway).

## Special mechanics (not universal)

- **Splitting**: two enemies spawn weaker copies on death, inheriting Strength.
- **Thorns**: a handful of tanks/one boss retaliate fixed damage when attacked.
- **Rally**: a few Act II enemies buff every *other* living enemy's Strength.
- **Resource drain**: several Act II/III enemies and bosses reduce banked Light
  directly, concentrated in the later acts.
- **Curse infliction**: only the final boss can push a curse into the discard pile.

## By act

- **Act I — The Archive**: vermin/archival hazards (moths, grubs, silverfish, jars,
  beetles). Bosses: The Collector, The Emulsion, The Plate Press.
- **Act II — The Gallery**: exhibit-themed (frames, prints, twins, cabinets, a rat's
  nest). Bosses: Salon, Argentine, Long Gallery.
- **Act III — The Aperture**: light/optics abstractions (caustics, shards, penumbra,
  overexposure). Bosses: The Aperture, Daguerre the First, The Latent Image.

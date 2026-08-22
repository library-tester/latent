# Enemies — LATENT

**Implemented.** Data: `data/enemies.js` (bestiary), `data/acts.js` (per-act rosters).
This describes the system; see source for exact per-enemy numbers.

## Inventory

**62 enemies**: 44 ordinary, 9 elite, 9 boss (3 of each per act × 3 acts). Each has
name, flavor label, HP range, art key, an `ai()` function, and a move table where
every move carries both a shown intent and an effect function that always matches it
exactly — no fake/misleading intents. **219 moves**, minimum 3 per ordinary enemy and
4 per elite/boss; `enemies.test.mjs` asserts the floor, that no `ai()` can name a
move its enemy lacks, that no declared move is unreachable, and that no intent
misstates its own damage or block.

## Encounter selection

Each act has `easy`/`mid`/`hard` group pools (a group = one or several enemies).
Which pool an ordinary fight draws from depends on row depth as a fraction of the
act's total rows (~0–22% easy, ~22–62% mid, rest hard). Elite nodes draw from a
separate per-act elite pool. Boss nodes always fight the boss rolled once at
act-start — never a random pick per fight. Non-boss HP additionally scales
`+floor(row×0.7)`; boss HP does not.

## Intents

The readout is composed, not enumerated. A move declares any combination of damage
(`d`, optionally `x` times), block (`v`), `buff`, and `deb`/`sdeb`, and each part
present draws its own icon in its own colour — so attack+block, attack+buff,
block+debuff and the rest need no case per pairing. `t` names the dominant part and
colours the box. Four values of `t` stand alone and replace the readout entirely:
`sleep`, `stun`, `flee`, `unknown`. Attack figures are always the exact resolved
number after Strength, Weak, Vulnerable and the player's relics.

## AI patterns

Built from `game/patterns.js` rather than written out per enemy:

| | |
|---|---|
| `cycle('a','b','c')` | fixed rotation |
| `opener('a', rest)` | scripted first turn, then another pattern |
| `weighted({a:70,b:30})` | roll by relative weight |
| `limit(2, roll)` | ...but never the same move 3 turns running |
| `wounded(.5, hurt, well)` | a different pattern once bloodied |
| `once(key, when, rest)` | one scripted move, the first time it applies |

`limit` is the default shape and the Spire's real rule; it reads `e.streak`, which
`game/combat.js` maintains as each enemy acts and nothing else may write. Bosses
additionally swap rotation at their Second Exposure. Difficulty comes from pool
selection (depth) plus authored numbers, not a difficulty toggle.

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
- **Curse infliction**: a late-act enemy and the final boss push curses into the
  discard pile.
- **Sleep**: the Bell Jar and Vitrine do nothing until damaged (or until a couple of
  turns pass), then wake with a bonus and never settle again. `dmgEnemy` sets
  `e.hurt`; the AI reads it.
- **Stun**: the Plate Press spends a turn winding up, defenceless, before its
  heaviest attack.
- **Fleeing and theft**: the Plate Rat steals gold with `eSteal` and leaves with
  `foeFlee` on the following turn. Fleeing clears it off the table; once the table
  is clear the fight is won and pays out normally — the spoils are for surviving it,
  not for kills.
- **Summoning**: the Rat Nest calls in live reinforcements with `summonFoe` (field
  capped at 5), on top of splitting when it dies.
- **Reacting to the player**: an entry may define `sawCard` / `sawAttack` /
  `sawSkill` / `sawPower`, run by `foeSaw()` when the player plays one. Twin Halide
  gains Strength from every Skill once enraged; the Glass Beetle hardens once per
  turn. This is how a specimen punishes a category of card rather than only acting
  on its own turn.

## By act

- **Act I — The Archive**: vermin/archival hazards (moths, grubs, silverfish, jars,
  beetles). Bosses: The Collector, The Emulsion, The Plate Press.
- **Act II — The Gallery**: exhibit-themed (frames, prints, twins, cabinets, a rat's
  nest). Bosses: Salon, Argentine, Long Gallery.
- **Act III — The Aperture**: light/optics abstractions (caustics, shards, penumbra,
  overexposure). Bosses: The Aperture, Daguerre the First, The Latent Image.

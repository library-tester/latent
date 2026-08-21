# Mechanics — LATENT

All **implemented** unless marked otherwise (verified against `game/combat.js`,
`game/run.js`, `data/cards.js`).

## Turn structure

1. **Player turn starts**: turn counter++; Block clears unless Barricade is active or
   it's the very first turn (so combat-start Block survives to be seen); Plated
   Armour grants its stored value as Block; player Tarnish deals its stack then
   decrements; per-turn powers resolve (free Strength/Block/Light); Energy resets
   (plus any carried-over Energy); hand draws (5 by default).
2. **Player acts**: play any cards that fit remaining Energy, targeting as required.
3. **End turn**: end-of-turn powers resolve (Light gain, AOE-if-Light≥5, self-damage
   AOE); Silver Rot in hand costs 1 HP/copy; Ethereal cards in hand Exhaust;
   this-turn-only Strength/Dexterity is removed; Regeneration heals then decrements;
   player Weak/Vuln/Frail/Intangible decrement; hand discards (unless something is
   keeping it).
4. **Enemy turn**: each living enemy — its own Tarnish ticks first, then it executes
   its already-shown intent, then its own Weak/Vuln decrement, then it rolls its
   *next* intent.
5. Repeat. Combat ends the instant HP hits 0 on either side, checked after every hit.

## Energy & cost

Default 3 Energy/turn. Cost resolves through one function (`costOf`): base cost, or
upgraded cost if defined, overridden to 0 if made free-this-turn or if it's a Skill
under Total Solarization, otherwise passed through relic `cardCost` modifiers; Snecko
Eye can scramble a drawn card's cost to random 0–3, which still yields to the free/
Total-Solarization checks. **X-cost** cards spend the entire remaining pool and scale
by however much that was (one base card does this). **Hand cap is 10** — draws and
add-to-hand effects silently stop, nothing is discarded to make room. A card can
resolve twice if Second Pass (marks the next Attack), a duplication effect (marks the
next card of any type), or a relic's `repeatCard` hook applies — checked in that order.

## Targeting

Cards/ampoules flagged `tg`: with exactly one enemy alive, target is automatic; with
more than one, tapping selects and a living enemy must then be tapped. Cancel via
re-tap, empty space, or Escape — no cost.

## Damage pipeline (exact order)

**Outgoing** (`hit`→`dmgEnemy`): `base + Strength + this-play bonus` → relic `dmgOut`
mods → if player Weak, ×0.75 (relic-tunable) → if target Vulnerable, ×1.5
(relic-tunable) → floor, clamp ≥0 → absorbed by enemy Block, remainder is HP loss →
enemy Thorns retaliates if present.

**Incoming** (`eAtk`→`hitPlayer`): `base + enemy Strength` → if enemy Weak, ×0.75
(**same modifier as outgoing** — symmetric by relic) → if player Vulnerable, ×1.5 via
a **separate** modifier from the outgoing case (asymmetric by design) → Ghost Image
can negate the first hit each turn entirely, before any of this → relic `dmgIn` mods →
Intangible caps result at 1 → absorbed by Block, then Plated Armour loses one stack if
anything got through, then HP loss (routed through one shared function so every
HP-loss source — combat, curses, event costs — is visible to relics reacting to "lose
HP") → player Thorns retaliates if present.

**Block from a card**: Dexterity adds, Frail ×0.75, then relic `blockGain` mods.
Block granted directly (combat/turn-start, Plated Armour refresh) skips Dexterity/
Frail — it isn't "from a card."

## Statuses

| Status | Holder | Effect | Decay |
|---|---|---|---|
| Weak | either | −25% dmg dealt (shared modifier both directions) | −1/turn |
| Vulnerable | either | +50% dmg taken (separate modifier per side) | −1/turn |
| Tarnish | either | loses stack as HP at start of its turn, stack −1 | self-consuming |
| Frail | structurally either | −25% Block from cards | **implemented, never granted by anything currently in the game** |
| Strength | either | + dmg per Attack hit | persists unless explicitly temporary |
| Dexterity | player only | + Block per card | persists unless explicitly temporary |
| Artifact | player (enemies structurally support it, unused) | negates next Weak/Vuln/Frail, one charge, checked after full-immunity relics | consumed |
| Intangible | player | any hit >1 capped to 1 | −1/turn |
| Plated Armour | player | Block refresh each turn; −1 stack per hit that gets through | shed by damage |
| Thorns (enemy) | enemy | fixed retaliation when attacked | permanent |
| Thorns (player) | player | fixed retaliation when attacked; standing amount persists, one-turn top-ups don't | mixed |
| Regeneration | player | heals stack at end of turn, stack −1 | self-consuming |

## Edge cases

- **Boss "Second Exposure"**: every boss, unconditionally, transitions the instant HP
  first drops ≤50%: +3 Strength, Block→0, own turn counter resets, re-rolls intent.
  Each boss's move table branches on this flag for a harder second half.
- **Splitting**: 2 enemies spawn two weaker copies on death (inheriting Strength),
  capped so the field never exceeds 5 combatants.
- **Escaping combat**: one ampoule can end a fight without winning/dying; explicitly
  refuses in a boss fight.
- **Cheat death**: fixed priority — an unopened Moth-in-Bottle ampoule breaks itself
  first (→30% Max HP), then a run-long cheat-death relic if any (→50% Max HP, once),
  then the run ends.
- **Curses**: unplayable; one costs 1 HP/copy held at end of turn. A relic can ward
  off the *next* curse the run would grant — not curses already in the deck.
- **Draw pile reshuffles** from discard the instant it runs dry mid-draw; can happen
  more than once in one big draw if the deck is small.

## Known implementation gap (audit finding, not fixed here)

`data/events.js`'s "Specimen Drawer" event calls `rollRelic(true)` — a stale call from
before relic tiers existed. The current `rollRelic(tier)` treats a truthy non-string
argument as an unmatchable tier and returns `null`. The event's "Reach into the empty
slot" option currently costs 8 Max HP and grants **no relic**. Verified by direct
reproduction. See `roadmap.md` (P0).

# Vision — LATENT

## Design Authority

`/game/docs/` is the current source of truth for LATENT's design. Where these docs
and the running code disagree, that's a bug in one of the two — check `src/`. Any
*intentional* design change must update the relevant doc in the same change.

## What it is

A single-player, turn-based deckbuilding roguelike, browser-based, no build step, no
external assets (SVG art, synthesised WebAudio). One run climbs three acts, each a
branching node map ending in a boss. Between fights: build a deck, collect passive
relics, drink one-shot ampoules, manage HP/gold across the whole descent.

## Player fantasy

Developing photographic plates in a darkroom that's become a hostile archive. Cards
are darkroom processes; **Light** is the deck's own resource, banked then spent in a
burst. Enemies escalate from physical infestation (Act I) to curated menace (Act II)
to optical/photonic abstraction (Act III). Win a fight: "the plate clears." Lose the
run: "FOGGED." Beat all three acts: "FIXED."

## Design pillars (read off the implementation, not aspirational)

1. **Deterministic combat math the player can learn** — one ordered damage pipeline,
   intent shows the exact post-modifier number before you act.
2. **Content is data; the engine only announces events** — relics/potions are plain
   objects with handler methods, the engine never special-cases an id. See `design.md`.
3. **A run is short enough to finish** — three acts, no infinite scaling, no
   meta-progression beyond one best-depth number.
4. **No off-loop content** — no images/audio files, no build pipeline, no server.

## Unique identity

Visibly Slay-the-Spire-shaped (energy/cards/relics/potions/map). What's not assumed
copied is listed under Non-goals and checked mechanic-by-mechanic in `mechanics.md`.
The one clearly original subsystem is **Light** — see `cards.md` for its current
scope and `roadmap.md` for where the player has asked it to matter more.

## Non-goals (current state, not permanent policy)

- No orb/stance/mantra subsystems, no character-class card pools.
- No meta-progression beyond the single best-depth number.
- No native/mobile packaging — a page, served over HTTP.
- No automated test suite (**undecided** whether one should exist).

## Reading order

`design.md` (loop/architecture) → `mechanics.md` (exact combat rules) →
`cards.md`/`enemies.md` (content inventory) → `progression.md` (run structure,
save/load) → `ui.md` (player-facing surface) → `roadmap.md` (what's next). Every claim
is tagged **implemented**, **intended** (stated as a goal, usually in `todo/todo.md`,
but not in code), or **undecided**.

# Roadmap — LATENT

Sourced from `todo/todo.md` plus this audit's direct code inspection. Every item is
either an explicit owner request or a concrete defect found by reading the source —
nothing invented.

## Already done

- Multi-module split (today's file layout — `design.md`).
- Relic pool expansion to 160 + the hook-bus architecture that made it maintainable.
- Ampoule pool expansion to 37.
- **This documentation set** — satisfies the "make a game design docs directory" ask.

## P0 — required

- **Fix the Specimen Drawer event's broken relic grant.** `data/events.js` calls
  `rollRelic(true)`, a stale pre-tier-system signature; the current `rollRelic(tier)`
  treats any truthy non-string as an unmatchable tier and returns `null`. The event's
  "Reach into the empty slot" option currently costs 8 Max HP for **nothing**.
  Verified by direct reproduction — see `mechanics.md`. The clearest actual defect
  found in this audit.

## P1 — important

- **Card-hover top-border clipping** — reported directly; a CSS spacing fix in
  `css/combat.css`'s hand/card-hover rules.
- **Sweep for the same bug class as the P0 fix.** The hook-bus model means a stale
  call signature fails *silently* — nothing throws, a reward just quietly doesn't
  happen. A pass cross-checking every relic/potion handler name against real call
  sites, and every direct helper call in `data/events.js`/`ui/rooms.js` against
  current signatures, directly answers "check the whole game for bugs" and is cheap
  next to the risk (a broken reward is invisible in normal play).
- **Confirm Rest-site ("Darkroom") discoverability.** The owner asked why there's no
  heal/upgrade site — but it's fully implemented (`progression.md`). Either the
  comment predates the feature, or its presentation (small map glyph, apparent
  frequency, the "Darkroom" naming) is hiding an existing feature. Check before
  assuming it's missing.

## P2 — polish

- **Replace the "Developed" post-victory banner text** — one line in
  `game/combat.js`'s `winCombat()`; just needs a word choice consistent with the
  darkroom fiction ("Fixed" is already the boss-win word).
- **Make Light matter more broadly** — owner wants it able to boost attack/
  resistance, not just gate burst payoffs. A real balance decision (a passive
  `dmgOut`/`dmgIn` modifier scaled by current Light fits the existing pipeline) that
  should be written into `mechanics.md` once decided, per the Design Authority rule.
- **Longer map** — row counts are fixed (15/16/17). A pacing/scope decision, not a
  quick bump, since it changes run length and card-economy pacing together.
- **Some committed regression coverage** — no test suite exists (`design.md`); the
  P0/P1 bug class is exactly what automated coverage catches for free.
- **A written Spire comparison** — `vision.md`'s Non-goals and this roadmap cover the
  structural half; a dedicated balance/feel comparison is still open.

## P3 — future / undecided

- **Decide what Frail is for** — fully implemented end-to-end but nothing currently
  grants it to anyone (verified by search — `mechanics.md`). Either give something a
  reason to apply it, or leave it as deliberate headroom; currently undecided.
- **Seeded/deterministic RNG** — not requested anywhere, but a resumed save doesn't
  reproduce what an uninterrupted session would have rolled.
- **Native/offline packaging** — explicit non-goal today; nothing pushes toward it.

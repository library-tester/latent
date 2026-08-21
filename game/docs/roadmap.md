# Roadmap — LATENT

Sourced from `todo/todo.md` plus this audit's direct code inspection. Every item is
either an explicit owner request or a concrete defect found by reading the source —
nothing invented.

## Already done

- Multi-module split (today's file layout — `design.md`).
- Relic pool expansion to 160 + the hook-bus architecture that made it maintainable.
- Ampoule pool expansion to 37.
- **This documentation set** — satisfies the "make a game design docs directory" ask.
- **Fixed the Specimen Drawer event's broken relic grant.** `data/events.js` called
  `rollRelic(true)`, a stale pre-tier-system signature that made the "Reach into the
  empty slot" option cost 8 Max HP for nothing. Changed to `rollRelic()`, matching
  how every sibling call site was migrated during the relic-tier rewrite. Verified
  with a 500-trial reproduction (100% now grant a relic) and a full 28-option event
  pool sweep (0 failures) — see `mechanics.md`.
- **A committed test suite** (`test/`, `npm test`) — 71 tests on Node's built-in
  runner plus jsdom, no framework. Covers the damage/status/turn pipeline, card/
  relic/potion/event behavior, map-generation invariants, and end-to-end screen
  smoke tests. Full description in the top-level `README.md` and `design.md`'s
  Testing section. While writing it, `test/unit/run-economy.test.mjs`/
  `events.test.mjs` caught that `progression.md` had miscounted the event pool as
  11 when it's actually 12 — fixed there too, a small demonstration of exactly the
  doc-drift the Design Authority rule in `vision.md` exists to catch.

## P0 — required

*(none open)*

## P1 — important

- **Card-hover top-border clipping** — reported directly; a CSS spacing fix in
  `css/combat.css`'s hand/card-hover rules.
- **Sweep for the same bug class as the P0 fix — partially done by the test suite.**
  `test/unit/module-graph.test.mjs` now permanently asserts every relic handler is
  reachable from a real `fire()`/`mod()` call, which is the exact shape of the P0
  bug and will catch a recurrence automatically. What's *not* yet covered: a stale
  direct call (a helper called with an argument its current signature no longer
  expects, the way `rollRelic(true)` was) that returns a wrong-but-non-throwing
  value elsewhere in `data/events.js`/`ui/rooms.js`, rather than the one instance
  already fixed and regression-tested. A manual read-through of those two files'
  call sites against their targets' current signatures is still open.
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
- **A written Spire comparison** — `vision.md`'s Non-goals and this roadmap cover the
  structural half; a dedicated balance/feel comparison is still open.

## P3 — future / undecided

- **Decide what Frail is for** — fully implemented end-to-end but nothing currently
  grants it to anyone (verified by search — `mechanics.md`). Either give something a
  reason to apply it, or leave it as deliberate headroom; currently undecided.
- **Seeded/deterministic RNG** — not requested anywhere, but a resumed save doesn't
  reproduce what an uninterrupted session would have rolled.
- **Native/offline packaging** — explicit non-goal today; nothing pushes toward it.

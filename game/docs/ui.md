# UI & Player Information — LATENT

**Implemented** unless marked otherwise. `index.html`, `css/*.css`, `ui/chrome.js`,
`ui/combat-view.js`, `ui/map-view.js`, `ui/input.js`, `core/audio.js`.

## Screens

One `#scene` element is fully replaced per major screen (title, map, combat, rest,
shop, treasure, event, act-transition, game over, victory), plus a reusable modal
`#sheet` for the deck/relic/ampoule viewers, how-to-play, and every pick/remove/
choose flow. No screen-transition animation system — swaps are instant.

## Chrome

Top bar (once a run exists, hidden on title): HP, gold, relic strip, sound toggle,
a "Deck" button open at any time in or out of combat. A relic in the strip describes
itself on mouse hover, or on a press held ~380ms on a touchscreen (which then
swallows the tap so the full relic sheet does not also open); a plain tap opens the
sheet as before.

## Combat display

Each enemy shows art, name/label, an intent icon with **the exact resolved number**
(post-relic-modifier, never a range), an HP bar, a row carrying the Block badge (when
relevant) beside the HP number, and one status chip per active status (Strength, Thorns, Weak, Vuln, Tarnish, Artifact). The
player strip mirrors this plus player-only statuses (Dexterity, Plated Armour,
Intangible). A pending card/ampoule target is visually marked; every living enemy
gets a hover/target affordance while a selection is open; re-tap/empty-space/Escape
cancels for free. Card text auto-shrinks in three measured steps so it never overflows
regardless of final wording length.

## Input

- **Pointer**: tap a card, then tap an enemy if targeting is ambiguous; tap End Turn;
  tap an ampoule.
- **Keyboard**: 1–9 plays that hand slot; E/Enter ends turn; Escape cancels a
  selection or closes the open sheet.
- **Wheel**: vertical scroll moves the horizontal hand/relic strips on pointer-fine
  devices.
- No gamepad, no drag-and-drop — tap-to-select, tap-to-target only.

## Audio

100% synthesised via WebAudio (oscillators + filtered noise), no files. A drone plays
during combat. Mute toggle persists across sessions if host storage exists. Audio
only initializes after the first user interaction (autoplay policy).

## Visual identity

Dark cool-toned palette, amber for Light/gold/positive, rust for damage, mono for
numbers, serif italic for flavor. A screen-wide bloom/color-wash is driven directly
by currently-banked Light (0 = none, capped near 14) — the one place Light's fiction
shows outside combat math. Constant subtle film grain; a full-screen flash on "the
plate burns" moments (spending Light, boss phase transition). Respects
`prefers-reduced-motion`.

## Responsive framing

Authored mobile-first (stated directly in the CSS). Above 720px, rather than
stretching edge-to-edge, the app frames as a fixed-width card over the ambient
background and pointer-fine affordances switch on. **A deliberate middle ground, not
a from-scratch desktop redesign** — relevant given `prompts.md`'s history of wanting
a more desktop-native feel.

## Known issues (player-reported, unfixed)

- Hovering a card can clip its top edge/shadow against the hand strip.
- The post-victory banner text ("Developed") is explicitly flagged for replacement.

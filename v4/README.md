# IRONFORGE v4

Built on v2 (the layered, colour-themed direction), with the fixes from a
Playwright critique of v2 against the high-end-visual-design,
frontend-design and design-taste-frontend skills.

Static site, no build step:

```
python -m http.server 8127
```

## What changed from v2

- **Double-bezel depth.** The hero product card, equipment panels, process
  cards, showroom card and form sit in an outer tray with a hairline ring
  and an inner core with its own lit edge.
- **Process is a timeline, not an accordion.** All 3 steps are visible, the
  numbers are a real sequence, and the rail fills as you scroll.
- **Showroom facts are ruled rows** instead of an icon-in-circle grid.
- **The quote form works.** v2 showed "Request received" after a fake
  timeout without sending anything. v4 opens the visitor's email app with
  the request drafted to `sales@ironforgefitness.com`, and posts through a
  native `mailto:` action when scripting is off.
- **Hero** gains a short tick row under the actions and a shorter collage,
  so the lower left no longer reads as an empty hole.
- **Mobile menu** is a full-screen overlay with a hamburger that morphs
  into an X and links that stagger in. The page scroll locks while open.
- **Footer** closes on an outlined wordmark.
- **Scroll reveals** on the key blocks, opacity and transform only, so
  content that has not scrolled in is still reachable by keyboard.

## Kept from v2

Four plate-colour themes (Turf, Cobalt, Brick, Night) with the swatch
picker and circular View Transition reveal, the self-hosted Archivo
variable font, the pinned horizontal equipment pan, the bento, hero
parallax and load choreography, and the full reduced-motion fallback.

## Content still to confirm

- Photography is hotlinked from Unsplash. Swap in real product shots.
- Specifications are carried over from the previous site and should be
  checked against the real product sheet.
- Client names in the "Installed for" row are placeholders.
- Address, hours and phone number are carried over from the previous site.

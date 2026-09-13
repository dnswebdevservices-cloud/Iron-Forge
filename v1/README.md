# IRONFORGE

A redesign of the IronForge commercial gym equipment site. Static, no build step:
open `index.html`, or serve the folder.

```
python -m http.server 8124
```

## Files

```
index.html        markup and copy
assets/styles.css design system and layout
assets/main.js    behaviour (no dependencies, no framework)
favicon.svg
```

## Design direction

The concept is **the equipment schedule**. The page borrows the language of a
fit-out drawing set rather than a fitness brochure, because planning the floor is
what this business actually sells.

**Colour.** Ground is cool poured concrete (`#e7e9e4`), not warm paper. Ink is
`#191d1c`. There is one accent, `#2b52c4`, taken from the IWF 20 kg competition
plate. Category dots on the equipment entries follow the rest of that code
(blue 20 kg, yellow 15 kg, red 25 kg), so the colour carries real information
that buyers in this trade already read. There are no gradients anywhere.

**Type.** One family, Archivo, loaded as a variable font. Display and body are
separated by optical **width** (`wdth` 125 against 100) instead of a second
typeface. Numerals use tabular figures in the same family; there is deliberately
no monospace face for small data labels.

**Structure.** Rules and dividers appear only where they organise a real
schedule. No card kit, no border radius, no drop shadows.

## Motion

Two things move without being asked:

1. The hero plays one orchestrated load sequence. The headline, lede and actions
   settle in turn while the photograph wipes in from the outer edge, so it reads
   as a single composed move rather than four separate fades.
2. The capability figures count up once when they arrive.

Everything else answers a click, a key or a drag: the disclosure list, the
equipment rail, the theme toggle, the form.

There is **no scroll event listener** in the codebase. Positional state comes
from `IntersectionObserver`, which the browser batches off the scroll path. Every
animation runs on `transform`, `opacity` or `clip-path`, and the whole system
collapses to static under `prefers-reduced-motion`.

## Accessibility

Skip link, visible `:focus-visible` rings on everything interactive, labels above
every field, inline errors wired to `aria-live`, focus sent to the first failing
field on submit, `aria-expanded` on the menu, Escape to close it, and
`aria-hidden` on decorative icons. Both themes were checked for contrast: the
accent carries white text on light at about 4.9:1, and the dark theme lifts the
accent to `#7d9bf5` so the CTA keeps the same prominence in both.

## Before this goes live

- **Product photography.** Images are hotlinked from Unsplash as stand-ins.
  Swap them for real product shots. Each `<img>` already carries explicit
  `width`/`height`, so replacing the `src` will not cause layout shift.
- **Specifications.** Gauges, capacities and warranty figures are carried over
  from the previous site's copy and are marked as sample values in an HTML
  comment above the rail. Replace them with the real product sheet.
- **Client names.** The five names in the trust row are placeholders. Use real
  clients or remove the row.
- **Form endpoint.** `assets/main.js` simulates the submit with a timeout. Point
  it at the real endpoint and keep the existing busy and status handling.
- **Address and phone** are carried over from the previous site. Confirm they are
  current.

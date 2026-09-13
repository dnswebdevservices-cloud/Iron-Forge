# IRONFORGE v3 / Industrial

Static site. No build step. Open `index.html` through any local server:

```
python -m http.server 8126
```

## Stack

- HTML, CSS and vanilla JavaScript
- GSAP 3.13 and ScrollTrigger from cdnjs
- Anton, Archivo and JetBrains Mono from Google Fonts

## Design system

| Role | Value |
|---|---|
| Ground | `#0e0e0d` |
| Ink | `#edece6` |
| Accent | `#ffd100` signal yellow, used only for the CTA, the nav underline and the spec-card tick |
| Hairlines | `rgb(237 236 230 / 0.1)`, drawn with `gap: 1px` grids |
| Corners | 0 everywhere |
| Display | Anton, uppercase, leading 0.86 |
| Body | Archivo |
| Labels and specs | JetBrains Mono, uppercase, tracked 0.08em |

The hero headline is fitted by `main.js` so its widest line ends about 20px short
of the photograph at any desktop width, capped by viewport height so the call to
action stays above the fold.

## Motion

All motion is created inside `gsap.matchMedia("(prefers-reduced-motion: no-preference)")`.
With reduced motion set, nothing is staged, no ScrollTriggers are created, and the
client marquee becomes a static list.

- Headline lines wipe upward through `clip-path`, staggered
- Hero photograph settles from `scale(1.15)` to `1` over 2.6s, `power3.out`
- Client marquee loops, pausing on hover, keyboard focus, and when off screen
- Sections reveal once; stats count up once
- Photographs drift against their frames while scrolling
- Buttons invert and the nav underline slides in, both CSS at 150ms linear

Reveals animate opacity only, never `visibility`, so content that has not
scrolled into view is still reachable by keyboard.

## Quote form

With JavaScript on, the form validates inline and then opens the visitor's email
app with the request drafted to `sales@ironforgefitness.com`. With JavaScript off,
the same form posts through its native `mailto:` action. The success panel also
lists the email address and phone number for visitors with no email app set up.

## Content still to confirm

- **Photography** is hotlinked from Unsplash. Swap in real product shots; every
  image already carries explicit `width` and `height`.
- **Specifications** (gauges, capacities, warranty lengths) are carried over from
  the previous site and should be checked against the real product sheet.
- **Client names** in the "Installed for" strip are placeholders.
- **Address, hours and phone number** are carried over from the previous site.

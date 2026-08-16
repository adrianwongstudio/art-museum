# The Long Room

A first-person 3D art gallery. Eight works hang in one rectangular hall with a
papier-mâché sculpture in the middle. Click a piece and the camera walks you to
it over about three seconds; an information panel arrives with you, carrying the
medium, dimensions, price and an enquiry link, because the work is for sale.

Built with Three.js and Vite. No physics engine, no framework, no runtime
network calls.

## Running it

```bash
npm install
npm run dev
```

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm test` | Unit tests for the camera maths, routing and catalogue |
| `npm run art` | Regenerate the placeholder artwork |
| `npm run deploy` | Build and publish to Cloudflare |

## Moving around

- **Click or tap a work** — walks you to it and opens its panel
- **Click or tap the floor** — walks you there
- **Drag** — look around (a drag under 6 px counts as a click)
- **WASD / arrow keys** — walk freely, desktop only
- **Dots along the bottom** — jump to any of the eight; they fill in as you go
- Any drag or key press interrupts a walk and hands control straight back

Links are shareable: `#/artwork/gulf-weather` opens standing in front of that
work, `#/artist/banks` opens that artist.

## Replacing the placeholder content

Everything in the exhibition is invented — four fictional artists, twenty-one
generated SVG "paintings" — so the room has something coherent to show. There
are exactly four places to change:

1. **`src/data/artists.js`** — the roster. `style` only selects a placeholder
   drawing language and can be dropped once real images are in.
2. **`src/data/works.js`** — the catalogue. `dimensions` are in **metres** and
   are used verbatim to size the canvas on the wall, so they must be honest.
   `image` points at anything in `public/`; drop a JPEG in `public/artworks/` and
   change one line.
3. **`src/data/gallery.js`** — which eight works hang where, the room's
   dimensions, and the centre sculpture.
4. **`src/data/site.js`** — the gallery's name and, importantly, the email
   address behind every **Inquire** button.

`npm test` checks the catalogue for you: missing images, works too big for the
wall, two works hung in the same spot, neighbours closer than 80 cm, artists who
do not exist.

## How it fits together

```
src/
  main.js          wiring: picker → travel controller → panel
  data/            artists, works, placements, gallery details
  camera/          bounds, viewpoints, path planning, travel timing, controls
  core/            Three.js scene: room, frames, placards, sculpture, lighting
  interaction/     raycasting, hash routing, viewed-works progress
  ui/              loading, panel, artist view, lightbox, dots, hints, fallback
```

Everything in `camera/`, `interaction/router.js`, `interaction/progress.js` and
`data/` is pure — no Three.js, no DOM — which is why it can be unit tested. The
Three.js-facing code lives in `core/` and the controller in `main.js`.

The design spec is in
[docs/superpowers/specs](docs/superpowers/specs/2026-08-15-first-person-gallery-design.md).

## Accessibility and search engines

The whole exhibition is also rendered as an ordinary HTML catalogue behind the
canvas: hidden while the 3D room is running, and promoted to the visible page
when WebGL is unavailable. `prefers-reduced-motion` shortens every walk to 0.4 s
and switches off the head bob.

## Deployment

Static output. `wrangler.jsonc` is set up for Cloudflare Workers static assets:

```bash
npm run deploy
```

For Cloudflare Pages instead, point the project at build command `npm run build`
and output directory `dist`.

## Performance

Pixel ratio is capped at 2 (1.5 on touch), antialiasing is desktop-only, and
exactly one light casts shadows — the wall spots light flat planes, where a
shadow map would cost frames and show nothing. Contact shadows under the pedestal
and bench are painted gradients.

The JavaScript bundle is ~528 kB (138 kB gzipped), almost all of it Three.js.

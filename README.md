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

The whole piece answers to a click — canvas, frame or wall placard — as does the
sculpture's plinth. While an overlay is open the room ignores input, and the walk
keys stand down whenever focus is inside the panel or an overlay, so arrow keys
belong to whatever the visitor is actually reading.

Links are shareable: `#/artwork/gulf-weather` opens standing in front of that
work, `#/artist/banks` opens that artist.

## The four pages

The bar in the top-right corner holds the site: **Exhibition**, **Artists**,
**Artwork**, **Contact**, then the light/dark toggle. On a phone the four fold
behind a menu button.

| Page | Hash | What it is |
|---|---|---|
| Exhibition | `#/` | The 3D room |
| Artists | `#/artists` | Featured banner, artist cards, browse by medium, an A–Z |
| Artwork | `#/artwork` | The whole catalogue with a filter rail and sorting |
| Contact | `#/contact` | The gallery in writing, plus a working enquiry form |

Note the singular and plural: `#/artwork` is the catalogue page,
`#/artwork/gulf-weather` is a work in the room. Same for `#/artists` against
`#/artist/banks`.

A page replaces the room rather than floating over it — the canvas is hidden and
**rendering stops** while one is open, so reading the opening hours does not cost
a phone battery a 3D gallery. Coming back puts the visitor where they stood.

Everything cross-links: an artist card or a hung work takes you into the room and
walks you to it; a work that is not on the walls opens flat instead.

### The contact form

It validates in the browser — every problem at once, inline, with focus moved to
the first one — and carries a honeypot field that bots fill and people never see.

With `site.contactEndpoint` left `null`, a valid enquiry is handed to the
visitor's own mail client, already composed. That needs no backend and no third
party, and it is the honest default for a static site. Set `contactEndpoint` to a
URL that accepts JSON — a Cloudflare Worker, Formspree, anything — and the same
form POSTs there instead, with success and failure states already written. That
is the only change required.

## Light and dark

The button in the top-right corner switches between two hangs of the same room.
Light is the white cube — daylight through the skylights, work lit evenly. Dark
is the hall after hours: the skylights go down, the walls fall back to charcoal,
and the spots carry the room. It is a different hang, not an inverted screenshot,
so the walls, floor, frames, plinth and every light change along with the UI.

A visitor's choice outranks their system's `prefers-color-scheme`, which outranks
the white cube default, and the choice is remembered. An inline script in
`index.html` settles the theme before the first paint so nobody gets a white
flash on the way into a dark gallery — it repeats the rule in
`src/ui/theme.js`, and the storage key has to stay the same in both.

Both palettes live in one place each: `src/core/palette.js` for the room,
`[data-theme='dark']` in `src/styles/main.css` for the page. The room is built
once and repainted, so switching costs nothing and works mid-walk.

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

The gallery's own details — address, phone, opening hours, and the email behind
every enquiry — are all in `src/data/site.js`.

## How it fits together

```
src/
  main.js          wiring: picker → travel controller → panel
  data/            artists, works, placements, gallery details
  camera/          bounds, viewpoints, path planning, travel timing, controls
  core/            Three.js scene: room, frames, sculpture, lighting, palette
  interaction/     raycasting, hash routing, progress, catalogue filters, form rules
  ui/              loading, panel, artist view, lightbox, dots, hints, theme, nav, fallback
  ui/pages/        artists, artwork and contact — the standing pages
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

The artist view and lightbox are proper modal dialogs: focus is trapped inside
while they are open, Escape closes them, and closing returns focus to whatever
opened them. The progress dots are ordinary buttons, so the eight works are
reachable — and walkable to — by keyboard alone.

## Deployment

The build is entirely static — `npm run build` writes `dist/`, and there is no
server side to it.

### Connecting the repo to Cloudflare

In the dashboard: **Workers & Pages → Create → Pages → Connect to Git**, pick
`adrianwongstudio/art-museum`, and use:

| Setting | Value |
|---|---|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Node version | 20 or newer (`.nvmrc` pins 22) |

Every push to `main` then builds and deploys itself, the same way betm-club does.

### Deploying by hand

`wrangler.jsonc` is already configured to serve `dist/` as Workers static assets,
so this works without the dashboard:

```bash
npm run deploy
```

`not_found_handling` is set to `single-page-application` because the site routes
on the hash and every URL must return `index.html`.

## Performance

Pixel ratio is capped at 2 (1.5 on touch), antialiasing is desktop-only, and
exactly one light casts shadows — the wall spots light flat planes, where a
shadow map would cost frames and show nothing. Contact shadows under the pedestal
and bench are painted gradients.

JavaScript ships as two chunks: the gallery itself (~47 kB, 17 kB gzipped) and
Three.js (~482 kB, 121 kB gzipped). Three.js is split out deliberately — editing
the catalogue then expires 47 kB of cache rather than half a megabyte.

There is no `og:image` yet. When real photography arrives, add one: a photograph
of an actual work makes a far better share card than anything generated.

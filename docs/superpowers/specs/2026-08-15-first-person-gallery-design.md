# First-Person 3D Art Gallery — Design Spec

**Date:** 2026-08-15
**Status:** Approved (all open questions answered by client)

## 1. Purpose

A single-page 3D website that puts the visitor *inside* a rectangular art gallery in
first person. Eight works hang on the walls, a papier-mâché sculpture stands in the
centre. The visitor clicks a piece, the camera walks to it over roughly three seconds,
and an information panel presents the work — including price and availability, because
**the works are for sale**. Each work links to more by the same artist and to similar
works by others.

Inspiration is bruno-simon.com — 3D space as the navigation model — but the vehicle and
the top-down chase camera are replaced by a first-person visitor in a bounded room.

## 2. Non-goals

- No physics engine. The room is a box; collision is coordinate clamping.
- No multiplayer, no CMS, no checkout. "Inquire" is a mailto link.
- No audio.
- No top-down or orbit camera at any point.
- No multiple rooms. One hall.

## 3. Stack and deployment

- **Vite** + **Three.js** (r180+), plain ES modules (no framework, no TypeScript —
  matches the client's other projects).
- **Vitest** for the pure-logic modules.
- Build output `dist/`, deployed to **Cloudflare Pages** via `wrangler.jsonc`.
- No runtime network dependencies. All assets are local and generated at scaffold time.

## 4. The room

Right-handed Y-up coordinates, metres.

| Element | Value |
|---|---|
| Floor | 20 m (x) × 10 m (z), centred on origin |
| Ceiling height | 5 m |
| Long walls | z = −5 (north) and z = +5 (south), each 20 m |
| End walls | x = −10 (west) and x = +10 (east), each 10 m |
| Entrance | Doorway centred in the **west** wall (x = −10), 1.6 m wide × 2.6 m tall |
| Eye height | 1.60 m, constant — the camera never changes height |

**Placement of the eight works** (entrance wall stays free of art):

| Wall | Count | Slots |
|---|---|---|
| North (z = −5, faces +z) | 3 | x = −6.5, 0, +6.5 |
| South (z = +5, faces −z) | 3 | x = −6.5, 0, +6.5 |
| East (x = +10, faces −x) | 2 | z = −2.6, +2.6 |

**Centre sculpture:** papier-mâché piece on a 0.9 m pedestal at the origin. It is
selectable and has its own panel, but it is *not* one of the eight progress dots.

**Style:** white cube. Off-white walls (#f2f0ec), pale oak floor, warm spotlights per
work, emissive skylight strips in the ceiling for fill, a bench near the west end.

**Dark hang (added 2026-08-16).** A toggle in the top-right corner switches the room
between the white cube and the same hall after hours: charcoal walls, dimmed skylights,
darker boards, and brighter, tighter spots carrying the room. Both palettes live in
`core/palette.js`; the scene keeps references to its materials and lights so a switch is
assignment rather than a rebuild, and therefore works mid-walk. The page's own palette
mirrors it under `[data-theme='dark']`.

Precedence is stored choice → `prefers-color-scheme` → light, remembered in
`localStorage`. An inline script in `index.html` applies it before first paint to avoid a
flash; it duplicates the rule deliberately and is commented on both sides.

The toggle sits above the panel and the entrance screen so it is reachable throughout,
and below the modal overlays, which trap focus. On a desktop it steps aside when the
panel opens, as the progress dots do; on a phone the sheet is at the bottom, so it stays
in the corner.

## 5. Movement — the hybrid model

Three input paths, all sharing one camera state.

### 5.1 Guided travel (primary)

Clicking or tapping a work, a progress dot, or the floor starts a **travel**: the camera
follows a planned path to a target position and facing.

- **Duration:** 3.0 s for a travel to an artwork viewpoint, regardless of distance, so the
  pacing is consistent. Floor travels scale with distance at ~2.2 m/s, clamped to
  1.2 s–3.0 s, so short hops do not crawl and a walk across the whole hall does not drag.
- **Easing:** `easeInOutCubic` on path parameter t.
- **Viewpoint for a work:** standing on the wall's normal through the work's centre, at
  `distance = clamp(artworkHeight * 1.6, 2.0, 4.0)` metres from the wall, eye at 1.60 m,
  facing the work's centre.
- **Path planning:** a straight segment from A to B is used unless it passes within
  1.6 m of the origin (the sculpture). In that case one waypoint is inserted on the
  shorter side, tangent to a 2.4 m radius circle, and the path becomes a quadratic
  Bézier through it. Pure function, unit-tested.
- **Facing during travel:** yaw follows the direction of travel for the first 45 % of t,
  then blends via `smoothstep(0.45, 1.0, t)` into the final facing quaternion. This reads
  as "walk over, then look at it" rather than "strafe while staring".
- **Head bob:** vertical sine, amplitude 0.035 m, ~1.9 Hz, plus 0.4° of roll, both
  enveloped to zero at the start and end of the travel. This is what sells walking rather
  than flying.
- **Interruption:** any free-look drag or key press cancels the travel in place and
  returns control immediately.

### 5.2 Free look

Mouse drag (not pointer lock — a plain click must remain "select") or one-finger touch
drag rotates the view. Yaw unlimited, pitch clamped to ±60°. Sensitivity tuned so a
full screen width drag is about 180°.

A press that moves less than the drag threshold before release counts as a **click**, not
a drag, and is routed to the raycaster. The threshold is 6 px for a mouse and 14 px for
touch — a fingertip is less precise than a cursor, and a tap that wanders 8 px is still
a tap.

### 5.3 Free walk (desktop only)

WASD / arrow keys, 1.4 m/s, accelerating over 0.15 s, relative to current yaw. Position
is clamped to the room interior with a 0.5 m wall margin and pushed out of the
sculpture's 1.6 m radius. Head bob applies while moving.

## 6. Interaction and raycasting

A click ray takes the **nearest** thing it hits, and that hit says what it is:

- **A work** (its canvas, frame or placard — all three carry the same hanging) → travel
  to that work's viewpoint; on arrival open the panel, mark viewed, update the hash.
- **The sculpture** (body or plinth) → travel to its viewpoint, 2.8 m out on the side the
  visitor is already standing, and open its panel.
- **The floor** → travel to that point, keeping current facing. Closes any open panel.
- Nothing → ignored.

Nearest wins rather than a fixed category order: the sculpture is frequently silhouetted
against a work on the far wall, and ranking works first would select the painting behind
whatever the visitor actually clicked.

Hovering an artwork on desktop brightens its spotlight slightly and shows a cursor
change; touch has no hover state.

## 7. Content model

Three data files, all plain exported arrays/objects, so adding work is a data edit.

- **`data/artists.js`** — four artists: `{ id, name, born, location, bio, statement }`.
- **`data/works.js`** — ~20 works: `{ id, slug, title, artistId, year, medium,
  dimensions: { w, h } (metres), price, status: 'available' | 'reserved' | 'sold',
  description, image, tags: [] }`. Only some are hung; the rest exist for the artist and
  similar-works views.
- **`data/gallery.js`** — placement of the eight hung works
  (`{ workId, wall, slot }`) plus the sculpture entry.

**Similar works** are derived at runtime: works sharing the most `tags` with the current
one, excluding the same artist, top four.

**Placeholder imagery** is generated by `scripts/generate-placeholder-art.mjs` — a seeded,
deterministic script writing standalone SVGs to `public/artworks/`. Each artist gets a
distinct visual language (colour fields / organic forms / line grids / gradient washes)
so the room reads as four hands, not one. Replacing a placeholder with a real photograph
is a single `image` path change.

## 8. UI

- **Loading screen** — progress bar driven by Three.js `LoadingManager`, then an
  "Enter the gallery" button.
- **Entrance walk** — 2.5 s travel from outside the west doorway to the centre of the
  room, with a **Skip** control that jumps straight to the centre.
- **Info panel** — slides in from the right on desktop, bottom sheet on mobile. Shows
  title, artist (button → artist view), year, medium, dimensions, price, availability
  badge, description, **Inquire** button (mailto with the work pre-filled in the
  subject), a "More by this artist" thumbnail row, and a "Similar works" row.
- **Artist view** — full-screen overlay: name, bio, statement, grid of all their works.
  Clicking a work that hangs in the room closes the overlay and walks there; clicking one
  that does not opens a lightbox detail with the same metadata and Inquire button.
- **Wall placards** — a small canvas-texture placard beside each frame carrying title,
  artist, year, medium and price, legible from the viewpoint.
- **Progress dots** — eight dots, bottom centre, filled once viewed, clickable to travel.
  Viewed state persists in `localStorage`.
- **Hint** — "Click a painting to walk up to it · drag to look around" on first entry,
  fading after the first successful interaction, with a `?` button to bring it back.

## 9. Routing

Hash-based, no history pollution during travel.

- `#/artwork/<slug>` — opens on that work; on cold load the entrance walk is replaced by
  a direct travel to it.
- `#/artist/<id>` — opens the artist overlay.
- Empty hash — the room, no selection.

Hash updates on arrival, not on click, so the URL always reflects where the visitor is.

## 10. Accessibility and fallback

A semantic HTML list of every hung work (heading, image, metadata, description, inquire
link) is always in the DOM behind the canvas: visually hidden when WebGL is available,
and promoted to the visible page when WebGL is missing or the user prefers reduced
motion. This is the SEO surface and the screen-reader surface. `prefers-reduced-motion`
also shortens all travels to 0.4 s and disables head bob when the 3D view is used.

## 11. Performance budget

- Pixel ratio capped at 2 (1.5 on touch devices); antialias on desktop only.
- One shadow-casting light (the sculpture key). Artwork spotlights cast no shadows —
  they light flat wall planes. Soft contact shadows under the pedestal and bench are
  painted gradient planes.
- sRGB output, ACES Filmic tone mapping, anisotropy 4.
- Target 60 fps on a 2021 mid-range laptop and 30 fps on a mid-range phone.

## 12. Module layout

```
src/
  main.js                     bootstrap and wiring
  data/{artists,works,gallery,site}.js
  core/{renderer,scene,room,frames,sculpture,lighting,textures}.js
  camera/{viewpoints,path,travel,travelController,controls,bounds,visitor}.js
  interaction/{picker,router,progress}.js
  ui/{loading,panel,artistView,lightbox,dots,hints,fallback,dom}.js
  styles/*.css
scripts/generate-placeholder-art.mjs
test/*.test.js
```

Boundary rule: everything under `camera/`, `interaction/router.js`,
`interaction/progress.js` and the data files is **pure** — no Three.js scene access, no
DOM — so it is unit-testable. Three.js touching code stays in `core/` and the thin
controller in `main.js`.

## 13. Test plan (Vitest, pure modules only)

- `bounds` — clamping inside walls, ejection from the sculpture radius, corners.
- `viewpoints` — distance scales with height and clamps; facing quaternion is correct for
  each of the three walls.
- `path` — straight when clear; inserts a waypoint when the segment crosses the
  sculpture; the waypoint is on the shorter side; the resulting curve never enters the
  1.6 m circle (sampled).
- `travel` — duration rules (fixed 3.0 s for artworks, distance-scaled for floor between
  1.2 s and 3.0 s), easing endpoints, facing blend at t = 0, 0.45, 1.
- `picker` — nearest hit wins: the sculpture beats a work behind it, a work beats the
  floor behind it, frame and placard resolve to their work, floor points come back
  clamped, and an empty ray returns nothing. Cast against real geometry — a Raycaster
  needs no WebGL.
- `theme` — precedence order, persistence, corrupt or hostile storage, subscriber
  notification, and refusal of themes that do not exist.
- `router` — parse and format for both routes, unknown and malformed hashes.
- `progress` — add, dedupe, persist, restore, corrupt-storage tolerance.
- `data` — every placement references an existing work, no duplicate wall+slot, every
  artist referenced exists, every `image` file exists on disk, dimensions are positive.

Rendering is not unit-tested; it is verified by running the app in a browser.

## 14. Decisions taken during implementation

- **An open panel would cover the work it describes.** Rather than move the visitor off
  the viewpoint, the camera's frustum is shifted (`setViewOffset`) so the work slides
  into the space the panel leaves — sideways on a desktop, upward on a phone. This is
  off-axis projection, so the perspective stays correct.
- **A deep link skips the entrance walk.** Someone following `#/artwork/…` asked for that
  work, not for the walk in, so they are placed inside the door and walked to it.
- **The entrance walk cannot be interrupted.** Free walking clamps to the room's
  interior, so accepting input while the visitor is still out in the vestibule would
  teleport them through the wall. Only *Skip* interrupts it.
- **Starting a new walk dismisses the panel**, which otherwise spent the three-second
  walk describing the work being walked away from. The content is replaced on arrival.
- **The tab title follows the visitor**, so browser history and shared links carry the
  name of the work rather than the name of the site.
- **The sculpture is a catalogue work like any other** (`w-reyes-sculpture`), so the
  panel, artist view and similar-works logic treat it uniformly. It is simply excluded
  from the eight progress dots.

## 15. Definition of done

`npm run build` succeeds, `npm test` passes, the gallery loads to the entrance screen,
the entrance walk plays, all eight works and the sculpture are selectable and open
correct panels, travel reads as a smooth ~3 s walk, artist and similar-works navigation
works, deep links resolve, dots persist, the site works on a phone with touch, and the
fallback list renders without WebGL.

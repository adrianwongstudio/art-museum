/**
 * The Long Room — bootstrap and wiring.
 *
 * Everything with logic in it lives in a module of its own; this file is the
 * controller that holds them together: build the room, hand input to the picker,
 * hand the picker's answer to the travel controller, and open the panel when the
 * visitor arrives.
 */

import { Clock } from 'three';

import { getHangingBySlug, hangings, isHung, room, sculpture } from './data/gallery.js';
import { getWork, getWorkBySlug } from './data/works.js';

import { createControls } from './camera/controls.js';
import { createTravelController } from './camera/travelController.js';
import { prefersReducedMotion } from './camera/travel.js';
import { viewpointForHanging, viewpointForSculpture } from './camera/viewpoints.js';
import { applyToCamera, createVisitor } from './camera/visitor.js';

import { createRenderer, isWebGLAvailable } from './core/renderer.js';
import { buildScene } from './core/scene.js';

import { createPicker } from './interaction/picker.js';
import { createProgress } from './interaction/progress.js';
import { artistHash, artworkHash, parseHash, replaceHash, roomHash } from './interaction/router.js';

import { createArtistView } from './ui/artistView.js';
import { createDots } from './ui/dots.js';
import { renderFallback } from './ui/fallback.js';
import { createHints } from './ui/hints.js';
import { createLightbox } from './ui/lightbox.js';
import { createLoading } from './ui/loading.js';
import { createPanel } from './ui/panel.js';

const dom = {
  canvas: document.getElementById('scene'),
  loading: document.getElementById('loading'),
  skip: document.getElementById('skip'),
  hint: document.getElementById('hint'),
  hintToggle: document.getElementById('hint-toggle'),
  dots: document.getElementById('dots'),
  panel: document.getElementById('panel'),
  artistView: document.getElementById('artist-view'),
  lightbox: document.getElementById('lightbox'),
  fallback: document.getElementById('fallback'),
};

/** Where the visitor stands once they are through the door. */
const ARRIVAL = { x: -5, z: 0, yaw: -Math.PI / 2 };
/** Where the entrance walk begins, out in the vestibule. */
const OUTSIDE = { x: -13, z: room.doorway.center, yaw: -Math.PI / 2 };

const webgl = isWebGLAvailable();
renderFallback(dom.fallback, { webgl });

if (!webgl) {
  dom.loading.hidden = true;
  dom.canvas.hidden = true;
  dom.fallback.focus();
} else {
  document.body.classList.add('is-3d');
  start();
}

function start() {
  const reducedMotion = prefersReducedMotion();

  const loading = createLoading({ root: dom.loading, onEnter: () => enterGallery() });

  const { renderer, camera } = createRenderer(dom.canvas);
  const { scene, lighting, targets } = buildScene({
    onProgress: (value) => loading.setProgress(value),
  });

  const visitor = createVisitor();
  visitor.x = OUTSIDE.x;
  visitor.z = OUTSIDE.z;
  visitor.yaw = OUTSIDE.yaw;
  applyToCamera(camera, visitor);

  const travel = createTravelController({ visitor, reducedMotion });
  const picker = createPicker({ camera, targets });
  const progress = createProgress();

  let entering = false; // the walk in from the vestibule, which nothing may interrupt

  // ── UI ──────────────────────────────────────────────────────────────────────

  const panel = createPanel({
    root: dom.panel,
    onArtist: (artistId) => openArtist(artistId),
    onWork: (work) => openWork(work),
    onClose: () => closePanel(),
  });

  const artistView = createArtistView({
    root: dom.artistView,
    onWork: (work) => {
      artistView.hide();
      openWork(work);
    },
    onClose: () => {
      artistView.hide();
      restoreHash();
    },
  });

  const lightbox = createLightbox({
    root: dom.lightbox,
    onArtist: (artistId) => {
      lightbox.hide();
      openArtist(artistId);
    },
    onClose: () => {
      lightbox.hide();
      restoreHash();
    },
  });

  const dots = createDots({
    root: dom.dots,
    progress,
    onSelect: (hanging) => walkTo(hanging),
  });

  const hints = createHints({ root: dom.hint, toggle: dom.hintToggle });

  // ── input ───────────────────────────────────────────────────────────────────

  const controls = createControls({
    canvas: dom.canvas,
    visitor,
    reducedMotion,
    onSelect: (ndc) => onSelect(ndc),
    onHover: (ndc) => onHover(ndc),
    onInterrupt: () => {
      if (!entering) travel.cancel();
    },
  });

  dom.skip.addEventListener('click', () => skipEntrance());

  window.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (lightbox.open) lightbox.hide();
    else if (artistView.open) artistView.hide();
    else closePanel();
    restoreHash();
  });

  window.addEventListener('hashchange', () => applyRoute(parseHash(window.location.hash)));

  // ── actions ─────────────────────────────────────────────────────────────────

  function enterGallery() {
    dots.show();
    hints.show();

    const route = parseHash(window.location.hash);

    // Someone who followed a link to a particular work asked for that work, not
    // for the walk in. Put them inside the door and walk them straight to it.
    if (route.route === 'artwork' && getHangingBySlug(route.slug)) {
      standAtArrival();
      applyRoute(route, { fromEntrance: true });
      return;
    }

    entering = true;
    dom.skip.hidden = false;

    travel.go(
      { position: { x: ARRIVAL.x, z: ARRIVAL.z }, yaw: ARRIVAL.yaw, pitch: 0 },
      {
        kind: 'entrance',
        onArrive: () => {
          entering = false;
          dom.skip.hidden = true;
          applyRoute(route, { fromEntrance: true });
        },
      },
    );
  }

  function standAtArrival() {
    visitor.x = ARRIVAL.x;
    visitor.z = ARRIVAL.z;
    visitor.yaw = ARRIVAL.yaw;
    visitor.pitch = 0;
    visitor.bobY = 0;
    visitor.bobRoll = 0;
  }

  function skipEntrance() {
    travel.cancel();
    entering = false;
    dom.skip.hidden = true;
    standAtArrival();
    applyRoute(parseHash(window.location.hash), { fromEntrance: true });
  }

  /** Walk to a hung work and open its panel on arrival. */
  function walkTo(hanging) {
    hints.retire();
    closeOverlays();

    const viewpoint = viewpointForHanging(hanging);
    dots.setCurrent(hanging.work.slug);

    travel.go(viewpoint, {
      kind: 'artwork',
      meta: hanging,
      onArrive: () => {
        panel.show(hanging.work);
        frameAroundPanel();
        progress.markViewed(hanging.work.slug);
        dots.setCurrent(hanging.work.slug);
        replaceHash(artworkHash(hanging.work.slug));
      },
    });
  }

  function walkToSculpture() {
    hints.retire();
    closeOverlays();

    const work = getWork(sculpture.workId);
    const viewpoint = viewpointForSculpture({ x: visitor.x, z: visitor.z });
    dots.setCurrent(null);

    travel.go(viewpoint, {
      kind: 'artwork',
      meta: { sculpture: true },
      onArrive: () => {
        panel.show(work);
        frameAroundPanel();
        replaceHash(artworkHash(work.slug));
      },
    });
  }

  function walkToFloor(point) {
    closePanel();
    dots.setCurrent(null);
    const distance = Math.hypot(point.x - visitor.x, point.z - visitor.z);
    if (distance < 0.4) return;

    travel.go(
      { position: point, yaw: visitor.yaw, pitch: visitor.pitch },
      { kind: 'floor' },
    );
    replaceHash(roomHash());
  }

  /** A work chosen from a thumbnail: walk to it if it is here, show it flat if not. */
  function openWork(work) {
    if (isHung(work.id)) {
      lightbox.hide();
      const hanging = hangings.find((h) => h.work.id === work.id);
      if (hanging) {
        walkTo(hanging);
        return;
      }
      if (work.id === sculpture.workId) {
        walkToSculpture();
        return;
      }
    }
    lightbox.show(work);
  }

  function openArtist(artistId) {
    artistView.show(artistId);
    replaceHash(artistHash(artistId));
  }

  function closePanel() {
    panel.hide();
    frameAroundPanel();
    dots.setCurrent(null);
    lighting.highlight(null);
    replaceHash(roomHash());
  }

  function closeOverlays() {
    artistView.hide();
    lightbox.hide();
  }

  /** After closing an overlay, put the URL back to wherever the visitor is standing. */
  function restoreHash() {
    replaceHash(panel.work ? artworkHash(panel.work.slug) : roomHash());
  }

  function applyRoute(route, { fromEntrance = false } = {}) {
    if (route.route === 'artwork') {
      const hanging = getHangingBySlug(route.slug);
      if (hanging) {
        if (panel.work?.slug !== route.slug || fromEntrance) walkTo(hanging);
        return;
      }

      const work = getWorkBySlug(route.slug);
      if (work?.id === sculpture.workId) {
        walkToSculpture();
        return;
      }
      if (work) lightbox.show(work);
      return;
    }

    if (route.route === 'artist') {
      artistView.show(route.id);
      return;
    }

    closeOverlays();
    if (!fromEntrance) panel.hide();
    frameAroundPanel();
  }

  // ── picking ─────────────────────────────────────────────────────────────────

  function onSelect(ndc) {
    if (entering) return;

    const hit = picker.pick(ndc);
    if (!hit) return;

    if (hit.type === 'artwork') walkTo(hit.hanging);
    else if (hit.type === 'sculpture') walkToSculpture();
    else if (hit.type === 'floor') walkToFloor(hit.point);
  }

  let hovered = null;
  function onHover(ndc) {
    if (entering) return;
    const hanging = picker.pickArtwork(ndc);
    const slug = hanging?.work.slug ?? null;
    if (slug === hovered) return;

    hovered = slug;
    lighting.highlight(slug);
    dom.canvas.classList.toggle('is-pointing', Boolean(slug));
  }

  // ── framing ─────────────────────────────────────────────────────────────────

  // An open panel would otherwise sit on top of the work it is describing. Rather
  // than move the visitor, shift the camera's frustum so the work slides into the
  // space that is left — off-axis projection, so the perspective stays honest.
  const framing = { x: 0, y: 0, targetX: 0, targetY: 0 };

  function frameAroundPanel() {
    const open = Boolean(panel.work);
    document.body.classList.toggle('is-panel-open', open);
    if (!open) {
      framing.targetX = 0;
      framing.targetY = 0;
      return;
    }

    const rect = dom.panel.getBoundingClientRect();
    if (window.innerWidth > 720) {
      framing.targetX = Math.min(rect.width, window.innerWidth * 0.45) / 2;
      framing.targetY = 0;
    } else {
      framing.targetX = 0;
      framing.targetY = Math.min(rect.height, window.innerHeight * 0.5) / 2;
    }
  }

  function applyFraming(dt) {
    const k = Math.min(1, 6 * dt);
    framing.x += (framing.targetX - framing.x) * k;
    framing.y += (framing.targetY - framing.y) * k;

    if (Math.abs(framing.x) < 0.5 && Math.abs(framing.y) < 0.5) {
      if (camera.view?.enabled) camera.clearViewOffset();
      return;
    }

    camera.setViewOffset(
      window.innerWidth,
      window.innerHeight,
      framing.x,
      framing.y,
      window.innerWidth,
      window.innerHeight,
    );
  }

  window.addEventListener('resize', frameAroundPanel);

  // ── frame loop ──────────────────────────────────────────────────────────────

  const clock = new Clock();

  function frame() {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, clock.getDelta()); // a long tab-switch must not teleport anyone

    if (travel.active) travel.update(dt);
    else controls.update(dt);

    applyToCamera(camera, visitor);
    applyFraming(dt);
    renderer.render(scene, camera);
  }

  frame();

  // A window onto the gallery's state while developing: `__gallery.visitor` is
  // where the visitor is standing. Stripped from production builds.
  if (import.meta.env?.DEV) {
    window.__gallery = { visitor, travel, progress, walkTo, hangings };
  }

  // The bar should show something immediately, and must never strand a visitor
  // at the door if a texture quietly fails to report back.
  loading.setProgress(0.06);
  setTimeout(() => loading.setProgress(1), 6000);
}

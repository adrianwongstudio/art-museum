/**
 * Turning a click into an intention.
 *
 * Whatever is nearest along the ray is what the visitor meant. An earlier version
 * ranked works above the sculpture above the floor regardless of distance, which
 * quietly selected a painting on the far wall when the visitor had clicked the
 * sculpture standing in front of it.
 *
 * A work's canvas, frame and placard all carry the same `hanging`, so which of
 * the three the ray happens to strike first does not matter.
 */

import { Raycaster, Vector2 } from 'three';

import { clampToRoom } from '../camera/bounds.js';

export function createPicker({ camera, targets }) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  /** Nearest intersection across everything worth hitting, or null. */
  function nearest(ndc) {
    pointer.set(ndc.x, ndc.y);
    raycaster.setFromCamera(pointer, camera);

    const objects = [...targets.artworks, ...targets.sculpture, ...targets.floor];
    return raycaster.intersectObjects(objects, false)[0] ?? null;
  }

  return {
    /** @returns {{type:'artwork', hanging:any} | {type:'sculpture'} | {type:'floor', point:{x:number,z:number}} | null} */
    pick(ndc) {
      const hit = nearest(ndc);
      if (!hit) return null;

      const { type, hanging } = hit.object.userData ?? {};
      if (type === 'artwork' && hanging) return { type: 'artwork', hanging };
      if (type === 'sculpture') return { type: 'sculpture' };

      if (targets.floor.includes(hit.object)) {
        return { type: 'floor', point: clampToRoom({ x: hit.point.x, z: hit.point.z }) };
      }

      return null;
    },

    /** Hover: a work only lights up when nothing stands between it and the cursor. */
    pickArtwork(ndc) {
      const hit = nearest(ndc);
      return hit?.object.userData?.type === 'artwork' ? hit.object.userData.hanging : null;
    },
  };
}

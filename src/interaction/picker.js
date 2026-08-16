/**
 * Turning a click into an intention.
 *
 * Works first, then the sculpture, then the floor — so a work in front of a
 * patch of floor always wins, and a click into empty space does nothing rather
 * than walking the visitor into a wall.
 */

import { Raycaster, Vector2 } from 'three';

import { clampToRoom } from '../camera/bounds.js';

export function createPicker({ camera, targets }) {
  const raycaster = new Raycaster();
  const pointer = new Vector2();

  function cast(ndc, objects) {
    pointer.set(ndc.x, ndc.y);
    raycaster.setFromCamera(pointer, camera);
    return raycaster.intersectObjects(objects, false)[0] ?? null;
  }

  return {
    /** @returns {{type:'artwork', hanging:any} | {type:'sculpture'} | {type:'floor', point:{x:number,z:number}} | null} */
    pick(ndc) {
      const artwork = cast(ndc, targets.artworks);
      if (artwork) return { type: 'artwork', hanging: artwork.object.userData.hanging };

      const sculpture = cast(ndc, targets.sculpture);
      if (sculpture) return { type: 'sculpture' };

      const floor = cast(ndc, targets.floor);
      if (floor) {
        return { type: 'floor', point: clampToRoom({ x: floor.point.x, z: floor.point.z }) };
      }

      return null;
    },

    /** Cheaper test used on hover: only the works matter for highlighting. */
    pickArtwork(ndc) {
      const hit = cast(ndc, targets.artworks);
      return hit ? hit.object.userData.hanging : null;
    },
  };
}

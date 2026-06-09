/* helpers.js
   pure functions
*/

import * as THREE from 'three';
import core from './webhammer.js';

const X = 0;
const Y = 1;
const Z = 2;

export function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

// converts movement input vector into a world space vector rotated in the player's direction
export function get_wish_vec(dir, y_rot) {
    return [
        dir[X] * Math.cos(-y_rot) - dir[Y] * Math.sin(-y_rot),
        dir[X] * Math.sin(-y_rot) + dir[Y] * Math.cos(-y_rot)
    ]
}

// return the first hit or return null
export function raycast(e, list, recursive=true) {
    let mouse_pos = core.pointer_locked ? new THREE.Vector2(0,0): new THREE.Vector2(e.clientX/window.innerWidth*2-1,-e.clientY/window.innerHeight*2+1);
    core.raycaster.setFromCamera(mouse_pos, core.camera);
    const hits = core.raycaster.intersectObjects(list, recursive)
    if (hits.length > 0) return hits[0];
    return null;
}
import { raycast } from '../helpers.js'
import * as THREE from 'three';
import core from '../webhammer.js';

export default {
    on_start(e) {
        const hit = raycast(e, core.brush_group.children, false);
        if (!hit) return;
        const brush = hit.object.brushRef;
        const planeIndex = brush._tri_to_plane[hit.faceIndex];
        brush._planes[planeIndex].material_id = core.current_material;
        brush._generateMesh();
    }
}
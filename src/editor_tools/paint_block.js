import { raycast } from '../helpers.js'
import * as THREE from 'three';
import core from '../webhammer.js';

export default {
    on_start(e) {
        const hit = raycast(e, core.brush_group.children, false);
        if (!hit) return;

        for (let plane of hit.object.brushRef._planes) {
        	plane.material_id = core.current_material
        }
        hit.object.brushRef._generateMesh()
    }
}
import { raycast } from '../helpers.js'
import * as THREE from 'three';
import core from '../webhammer.js';
import icon from './icons/paint_block.svg';

export default {
    icon,
    description:"tap on brushes to apply the currently selected material to all faces of the brush.",
    on_start(e) {
        const hit = raycast(e, core.brush_group.children, false);
        if (!hit) return;

        for (let plane of hit.object.brushRef._planes) {
        	plane.material_id = core.current_material
        }
        hit.object.brushRef._generateMesh()
    }
}
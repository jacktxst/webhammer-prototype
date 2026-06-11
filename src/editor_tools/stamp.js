
import * as THREE from 'three';
import { raycast } from '../helpers.js';
import { PlaneBrush } from '../brush.js'
import core from '../webhammer.js';

const X = 0;
const Y = 1;
const Z = 2;

export default {
    description: "the stamp tool",
    init() {
        // create hologram
        this.hologram = new THREE.Object3D()
        let offset = core.tools.multiselect.get_selection_aabb().position

        for (let object of core.tools.multiselect.selected_brushes) {
            let edges_mesh = object.highlight_mesh.edges_mesh.clone()
            edges_mesh.position.sub(offset)
            this.hologram.add(edges_mesh)
        }
        core.scene.add(this.hologram)
        
    },
    on_move(e) {

        let hit = raycast(e, [core.grid._hitplane_mesh, ...core.brush_group.children]);

        if(hit?.object) {
            this.hologram.position.copy(hit.point)
        }

    },
    on_end(e) {
        // actually do the paste
    },
    cleanup() {

        for (let child of this.hologram.children) {
            child.geometry.dispose()
        }
        core.scene.remove(this.hologram)
        
    },

}
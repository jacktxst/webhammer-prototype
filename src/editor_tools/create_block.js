/* create_block.js
// the create block tool allows the user to tap on the currently shown
// 3D grid and drag across it to create a cuboid shaped brush.
*/

import * as THREE from 'three';
import { raycast } from '../helpers.js';
import { PlaneBrush } from '../brush.js'
import core from '../webhammer.js';

const X = 0;
const Y = 1;
const Z = 2;

export default {
    new_box: null,
    corners: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)],
    init() {

    },
    on_start(e) {
        let hit = raycast(e, [core.grid.hitplane]);
        if (!hit) return;
        hit.point = core.grid.snap_to_grid(hit.point);
        this.corners[0].copy(hit.point)
        this.dragging = true;
    },
    on_move(e) {
        if (!this.dragging) return;
        let hit = raycast(e, [core.grid.hitplane]);
        if (!hit) return;
        hit.point = core.grid.snap_to_grid(hit.point);
        this.corners[1].copy(hit.point)

        let offset = new THREE.Vector3(
            core.grid.axis === X ? 1 : 0,
            core.grid.axis === Y ? 1 : 0,
            core.grid.axis === Z ? 1 : 0,
        )

        offset.multiplyScalar(core.grid.cell_size * core.grid.dir);
        this.corners[1].add(offset);

        /*
        this.corners[1][core.grid.axis] += core.grid.cell_size * core.grid.dir
        */

        let size = new THREE.Vector3().subVectors(this.corners[1],this.corners[0]);
        let position = new THREE.Vector3().addVectors(this.corners[0],this.corners[1]).divideScalar(2);
        size.set(Math.abs(size.x), Math.abs(size.y), Math.abs(size.z));
        if (size.x > 0 && size.y > 0 && size.z > 0) {
            if (!this.new_box) this.new_box = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshNormalMaterial());
            this.new_box.position.copy(position);
            this.new_box.scale.copy(size);
            if (!core.scene.children.includes(this.new_box)) core.scene.add(this.new_box);
        } else {
            if (!this.new_box) return
            if (core.scene.children.includes(this.new_box)) core.scene.remove(this.new_box);
            this.new_box = null;
        }

    },
    on_end(e) {
        if (!this.dragging) return;
        this.dragging = false;
        if (!this.new_box) return;
        let brush = new PlaneBrush(this.new_box.position, this.new_box.scale, core.current_material);
        core.scene.remove(this.new_box);
        this.new_box = null;
    },

}
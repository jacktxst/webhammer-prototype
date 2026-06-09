/* select_brush.js
   this tool allows the user to tap on a brush to select it. 
   they can then drag the resize handles to change the brush's size.

   heavily related to the cuboid selection tool. whats the overlap?

   in the future id like to add multi select capability.
   and different select modes, like box select.
*/

import { raycast } from '../helpers.js'
import * as THREE from 'three';
import core from '../webhammer.js';

export default {
    selected_brush: null,
    dragged_handle: null,

    on_start(e) {
        const hit = raycast(
            e,
            this.selected_brush ? [core.brush_group, core.tools.cuboid_selection.handle_group] : core.brush_group.children,
            true
        );

        // Dragging handle
        if (core.tools.cuboid_selection.handle_group.children.includes(hit?.object)) {
            this.dragged_handle = hit.object;
            this.dragged_handle.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            core.grid.set_position(this.dragged_handle.position);
            core.grid.align_to_camera()
            return;
        }

        // Deselect previous brush
        this.selected_brush = null;

        if (!hit) {
            core.tools.cuboid_selection.handle_group.visible = false;
            core.tools.cuboid_selection.selection_box.visible = false;
            return;
        }

        // Select new brush
        const brush = hit.object.brushRef;
        if (!brush) {console.log('error: no brushref'); return;}

        this.selected_brush = brush;

        // Update cuboid selection visuals

        console.log(brush.getBoundingBox().position.x + " " + brush.getBoundingBox().position.y + " " + brush.getBoundingBox().position.z);

        core.tools.cuboid_selection.selection_box.position.copy(brush.getBoundingBox().position);
        core.tools.cuboid_selection.selection_box.scale.copy(brush.getBoundingBox().size);
        core.tools.cuboid_selection.valid = false;
        core.tools.cuboid_selection.update_handle_positions(brush.getBoundingBox().position, brush.getBoundingBox().size);

        if (!core.scene.children.includes(core.tools.cuboid_selection.selection_box)) core.scene.add(core.tools.cuboid_selection.selection_box);
        if (!core.scene.children.includes(core.tools.cuboid_selection.handle_group)) core.scene.add(core.tools.cuboid_selection.handle_group);

        core.tools.cuboid_selection.handle_group.visible = true;
        core.tools.cuboid_selection.selection_box.visible = false;
    },

    on_move(e) {
        if (!this.dragged_handle) return;

        let hit = raycast(e, [core.grid.hitplane]);
        if (!hit) return;
        /*
        {
            hit.point.sub(this.dragged_handle.position);
            hit.point.multiply(this.dragged_handle.handle_magnitude);
            this.selection_box.scale.add(hit.point);
            hit.point.multiplyScalar(0.5);
            hit.point.multiply(this.dragged_handle.handle_magnitude);
            this.selection_box.position.add(hit.point);
            this.update_handle_positions(this.selection_box.position, this.selection_box.scale);
            return;
        }
        */
        hit.point = core.grid.snap_to_grid(hit.point).clone();
        hit.point.sub(this.dragged_handle.position); // difference
        hit.point.multiply(this.dragged_handle.handle_magnitude); // axis restricted

        // never let the selection box collapse onto a zero-size axis —
        // it would collapse the brush and the next move would divide by 0
        const sel_scale = core.tools.cuboid_selection.selection_box.scale;
        if (sel_scale.x + hit.point.x === 0) hit.point.x = 0;
        if (sel_scale.y + hit.point.y === 0) hit.point.y = 0;
        if (sel_scale.z + hit.point.z === 0) hit.point.z = 0;

        core.tools.cuboid_selection.selection_box.scale.add(hit.point);

        let vec = hit.point.clone()
        vec.add   (core.tools.cuboid_selection.selection_box.scale);
        vec.divide(core.tools.cuboid_selection.selection_box.scale);

        //this.selected_brush.scale(vec);

        hit.point.multiplyScalar(0.5);
        hit.point.multiply(this.dragged_handle.handle_magnitude);
        core.tools.cuboid_selection.selection_box.position.add(hit.point);
        core.tools.cuboid_selection.update_handle_positions(core.tools.cuboid_selection.selection_box.position, core.tools.cuboid_selection.selection_box.scale);

        let brush_bb = this.selected_brush.getBoundingBox();
        const sb_scale = core.tools.cuboid_selection.selection_box.scale;
        let factor = new THREE.Vector3(
            Math.abs(sb_scale.x) / brush_bb.size.x,
            Math.abs(sb_scale.y) / brush_bb.size.y,
            Math.abs(sb_scale.z) / brush_bb.size.z,
        );
        this.selected_brush.scale(factor);
        let offset =
            new THREE.Vector3()
                .copy(core.tools.cuboid_selection.selection_box.position)
                .sub(brush_bb.position);
        this.selected_brush.translate(offset);


        //core.tools.cuboid.selection_box.position.copy(this.selected_brush.getBoundingBox().position) ;
        //core.tools.cuboid.selection_box.scale.copy( this.selected_brush.getBoundingBox().size);
        //core.tools.cuboid.update_handle_positions(this.selected_brush.getBoundingBox().position, this.selected_brush.getBoundingBox().size);
    },

    on_end(e) {
        if (!this.dragged_handle) return;
        this.dragged_handle.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.dragged_handle = null;
        core.grid.set_position(new THREE.Vector3(0, 0, 0));
    }
}
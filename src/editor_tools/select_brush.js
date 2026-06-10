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
import icon from './icons/select_brush.svg';

export default {

    params: {
        preserve_uv: { type: 'toggle', value: false },
        select_multiple: { type: 'toggle', value: false }
    },

    icon,
    selected_brush: null,
    dragged_handle: null,
    // click+drag on a brush body translates it in grid-snapped increments;
    // translate_anchor is the last snapped point on the drag plane.
    translating: false,
    translate_anchor: null,
    // light-blue translucent overlay + white wireframe of the selected brush.
    // these reference the brush's CURRENT geometry; whenever the brush is
    // regenerated (scale/translate -> _generateMesh) we rebuild them.
    highlight_mesh: null,
    highlight_edges: null,

    build_highlight(brush) {
        this.clear_highlight();
        const geom = brush.mesh.geometry;

        this.highlight_mesh = new THREE.Mesh(
            geom,
            new THREE.MeshBasicMaterial({
                color: 0xaaccff,
                transparent: true,
                opacity: 0.25,
                depthWrite: false
            })
        );
        // sit just on top of the brush surface so we don't z-fight
        this.highlight_mesh.renderOrder = 1;
        core.scene.add(this.highlight_mesh);

        // EdgesGeometry pulls only edges where the dihedral angle exceeds
        // ~1° (its default), so coplanar triangulation seams within a face
        // stay hidden and we only see the brush silhouette
        const edge_geom = new THREE.EdgesGeometry(geom);
        this.highlight_edges = new THREE.LineSegments(
            edge_geom,
            new THREE.LineBasicMaterial({ color: 0xffffff })
        );
        this.highlight_edges.renderOrder = 2;
        core.scene.add(this.highlight_edges);
    },

    clear_highlight() {
        if (this.highlight_mesh) {
            core.scene.remove(this.highlight_mesh);
            this.highlight_mesh.material.dispose();
            this.highlight_mesh = null;
        }
        if (this.highlight_edges) {
            core.scene.remove(this.highlight_edges);
            this.highlight_edges.geometry.dispose();
            this.highlight_edges.material.dispose();
            this.highlight_edges = null;
        }
    },

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
        this.clear_highlight();

        if (!hit) {
            core.tools.cuboid_selection.handle_group.visible = false;
            core.tools.cuboid_selection.selection_box.visible = false;
            return;
        }

        // Select new brush
        const brush = hit.object.brushRef;
        if (!brush) {console.log('error: no brushref'); return;}

        this.selected_brush = brush;
        this.build_highlight(brush);

        // prepare for a translate-drag: park the grid hitplane on the snapped
        // click point (so the drag projects on a plane through where the user
        // actually grabbed the brush) and re-raycast to seat the anchor on
        // that same plane
        hit.point = core.grid.snap_to_grid(hit.point)
        core.grid.set_position(hit.point);
        
        this.translate_anchor = hit.point;
        this.translating = true;
        

        // Update cuboid selection visuals


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
        // brush-body drag: translate the selected brush in grid-snapped steps
        if (this.translating && this.selected_brush && !this.dragged_handle) {
            const hit = raycast(e, [core.grid._hitplane_mesh]);
            if (!hit) return;
            const snapped = core.grid.snap_to_grid(hit.point);
            const delta = new THREE.Vector3().subVectors(snapped, this.translate_anchor);
            if (delta.lengthSq() === 0) return;

            this.selected_brush.translate(delta);
            this.translate_anchor = snapped;

            // brush.translate() ran _generateMesh() and disposed the geometry
            // our highlight was holding — rebuild
            this.build_highlight(this.selected_brush);

            // selection_box + handles ride along with the brush so a follow-up
            // resize starts from the correct bounding box
            const bb = this.selected_brush.getBoundingBox();
            core.tools.cuboid_selection.selection_box.position.copy(bb.position);
            core.tools.cuboid_selection.update_handle_positions(bb.position, bb.size);
            return;
        }

        if (!this.dragged_handle) return;

        let hit = raycast(e, [core.grid._hitplane_mesh]);
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

        // the brush's geometry was regenerated by scale()/translate(); our
        // overlay was pointing at the now-disposed buffer, so rebuild it
        this.build_highlight(this.selected_brush);


        //core.tools.cuboid.selection_box.position.copy(this.selected_brush.getBoundingBox().position) ;
        //core.tools.cuboid.selection_box.scale.copy( this.selected_brush.getBoundingBox().size);
        //core.tools.cuboid.update_handle_positions(this.selected_brush.getBoundingBox().position, this.selected_brush.getBoundingBox().size);
    },

    on_end(e) {
        if (this.translating) {
            this.translating = false;
            this.translate_anchor = null;
            core.grid.set_to_default();
        }
        if (!this.dragged_handle) return;
        this.dragged_handle.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.dragged_handle = null;
        core.grid.set_to_default();
    }
}
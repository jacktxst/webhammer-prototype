/*

    this tool allows the user to create a singular persistent cuboid shaped selection box by
    dragging across the 3D grid helper.

    a cuboid selection box appears as a transluscent green object.

    once a selection box has been created, it will persist and display, even when the tool is
    not selected, until it is overwritten by a new selection box or destroyed / invalidated.

    while the cuboid selection tool is active, resize handles will appear on all corners, edges
    and faces of the current selection box. the user can drag these resize handles to resize the selection box.

    while the tool is active, if the user taps anywhere besides a resize handle,
    the current cuboid selection box will be overwritten by a new selection box.

    if the user does not drag out the box after doing this, the new box will have a size of 0 and will thus be invalidated, meaning that
    tapping without dragging anywhere on the screen besides the resize handle will destroy the selection box.

*/

import * as THREE from 'three';
import { raycast } from '../helpers.js'
import core from '../webhammer.js';
import icon from './icons/cuboid_selection.svg';

const X = 0;
const Y = 1;
const Z = 2;

export default {
    icon,
    description: "this tool doesn't really do anything useful yet.",
    selection_box: (() => {
        const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(),
            new THREE.MeshBasicMaterial({ color: 0xccffcc, transparent: true, opacity: 0.5 })
        );
        mesh.visible = false;
        return mesh;
    })(),
    corners: [new THREE.Vector3(), new THREE.Vector3()],
    valid: false,
    handle_scale: 0.125,
    dragging: false,
    dragged_handle: null,
    handle_group: (() => {
        const group = new THREE.Object3D();
        const magnitudes = [-1, 0, 1];
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                for (let z = 0; z < 3; z++) {
                    const handle_magnitude = new THREE.Vector3(magnitudes[x], magnitudes[y], magnitudes[z]);
                    if (!handle_magnitude.length()) continue;

                    const sprite = new THREE.Mesh(
                        new THREE.BoxGeometry(),
                        new THREE.MeshBasicMaterial({ color: 0xffffff })
                    );
                    sprite.handle_magnitude = handle_magnitude;
                    sprite.scale.multiplyScalar(0.125);
                    group.add(sprite);
                }
            }
        }
        return group;
    })(),

    init() { core.scene.add(this.handle_group); },

    on_start(e) {
        if (this.dragged_handle) {
            this.dragged_handle.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            this.dragged_handle = null;
        }
        const list = [core.grid.hitplane];
        if (this.valid) list.push(this.handle_group);

        core.grid.setDir();
        const hit = raycast(e, list, true);

        if (this.handle_group.children.includes(hit?.object)) {
            this.dragged_handle = hit.object;
            this.dragging = true;
            hit.object.material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            core.grid.set_position(hit.object.position);
            core.grid.align_to_camera();
            return;
        }

        if (core.scene.children.includes(this.selection_box)) core.scene.remove(this.selection_box);
        this.handle_group.visible = false;
        this.selection_box.visible = false;
        this.valid = false;

        if (!hit) return;
        this.dragging = true;
        hit.point = core.grid.snap_to_grid(hit.point);
        this.corners[0] = hit.point;
    },

    on_move(e) {
        if (!this.dragging) return;
        const hit = raycast(e, [core.grid.hitplane]);
        if (!hit) return;

        hit.point = core.grid.snap_to_grid(hit.point);

        if (this.dragged_handle) {
            hit.point.sub(this.dragged_handle.position);
            hit.point.multiply(this.dragged_handle.handle_magnitude);
            this.selection_box.scale.add(hit.point);
            hit.point.multiplyScalar(0.5);
            hit.point.multiply(this.dragged_handle.handle_magnitude);
            this.selection_box.position.add(hit.point);
            this.update_handle_positions(this.selection_box.position, this.selection_box.scale);
            return;
        }

        this.corners[1] = hit.point;
        switch (core.grid.axis) {
            case X: this.corners[1].x += core.grid.cell_size * core.grid.dir; break;
            case Y: this.corners[1].y += core.grid.cell_size * core.grid.dir; break;
            case Z: this.corners[1].z += core.grid.cell_size * core.grid.dir; break;
        }

        const cuboid_size = new THREE.Vector3().subVectors(this.corners[1], this.corners[0]);
        if (cuboid_size.x && cuboid_size.y && cuboid_size.z) {
            this.valid = true;
            this.selection_box.visible = true;
            this.selection_box.position.set(
                (this.corners[0].x + this.corners[1].x) / 2,
                (this.corners[0].y + this.corners[1].y) / 2,
                (this.corners[0].z + this.corners[1].z) / 2
            );
            this.selection_box.scale.copy(cuboid_size);
            if (!core.scene.children.includes(this.selection_box)) core.scene.add(this.selection_box);
        } else {
            this.valid = false;
            this.selection_box.visible = false;
            if (core.scene.children.includes(this.selection_box)) core.scene.remove(this.selection_box);
        }
    },

    on_end(e) {
        if (this.dragged_handle) {
            this.dragged_handle.material = new THREE.MeshBasicMaterial({ color: 0xffffff });
            this.dragged_handle = null;
            core.grid.set_position(new THREE.Vector3(0, 0, 0));
            core.grid.default_plane();
        }

        if (this.dragging) this.dragging = false;

        if (this.valid) {
            core.grid.set_position(this.selection_box.position);
            this.selection_box.scale.set(
                Math.abs(this.selection_box.scale.x),
                Math.abs(this.selection_box.scale.y),
                Math.abs(this.selection_box.scale.z)
            );
            this.update_handle_positions(this.selection_box.position, this.selection_box.scale);
            this.handle_group.visible = true;
        } else {
            core.grid.set_position(new THREE.Vector3(0, 0, 0));
        }
    },

    update_handle_positions(center = new THREE.Vector3(), size = new THREE.Vector3()) {
        const half_size = size.clone().multiplyScalar(0.5);
        for (let handle of this.handle_group.children) {
            const handle_offset = handle.handle_magnitude.clone().multiply(half_size);
            const handle_position = center.clone().add(handle_offset);
            handle.position.copy(handle_position);
            handle.scale.copy(size).multiplyScalar(0.125);
        }
    },

    cleanup() {
        core.scene.remove(this.handle_group);
    }
}
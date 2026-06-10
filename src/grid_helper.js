/* grid_helper.js

   the grid: serves as a visual, and a solid plane that tools
   are aware of and can interact with. tools snap to the grid, 
   or extrude things off the grid.

*/

import * as THREE from 'three';
import core from './webhammer.js';

const X = 0;
const Y = 1;
const Z = 2;

export default {

    _divisions: 16,
    _axis: Y,
    _default_axis: Y,
    _default_position: new THREE.Vector3(),
    _default_divisions: 16, // unused field
    _cell_size: 64/16,
    _polarity: 1,

    _grid_mesh: new THREE.GridHelper(64,16,0xFFFFFFFF, 0x44444444),

    _hitplane_mesh: (()=>{
        let mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1024,1024),
            new THREE.MeshNormalMaterial());
        mesh.material.transparent = true;
        mesh.material.opacity = 0.1;
        mesh.visible = true;
        return mesh;})(),


    set_position(position) {
        this._hitplane_mesh.position.copy(position);
        this._grid_mesh.position.copy(position);
    },


    /* axis in [0, 1, 2] */
    set_axis(axis) {

        /* the grid helper and plane have different initial rotations, 
        so they need to be rotated differently to match */
        const vecs = [
            new THREE.Euler(0,0,Math.PI/2),
            new THREE.Euler(0,0,0),
            new THREE.Euler(Math.PI/2,0,0)
        ];
        this._grid_mesh.rotation.copy(vecs[axis]);
        
        const vecs2 = [
            new THREE.Euler(0,  Math.PI / 2, 0),
            new THREE.Euler(-Math.PI / 2, 0, 0),
            new THREE.Euler(0, 0, 0)
        ];
        this._hitplane_mesh.rotation.copy(vecs2[axis]);

        this._axis = axis;
        this.set_polarity()
    },



    /* sets the polarity of the grid depending on whether the player is in front or behind */
    set_polarity() {
        this._polarity = 1;
        const planeNormal = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(this._hitplane_mesh.quaternion)
            .normalize();
        const planeToCam = new THREE.Vector3()
            .subVectors(core.camera.position, this._hitplane_mesh.position);
        if (planeNormal.dot(planeToCam) < 0) {
            this._polarity = -1;
            this._hitplane_mesh.rotateY(Math.PI);
        }
    },



    set_default_axis(axis) {
        this._default_axis = axis;
        this.set_to_default();
    },



    set_default_position(position) {
        this._default_position = position
    },



    set_to_default() {
        this.set_axis(this._default_axis);
        this.set_position(this._default_position)
    },



    grow_cells() {
        this.set_subdivisions(this._divisions/2);
    },



    shrink_cells() {
        this.set_subdivisions(this._divisions*2);
    },



    snap_to_grid(point) {
        const cell_size = this._cell_size;
        return new THREE.Vector3(
            Math.round(point.x / (cell_size)) * (cell_size),
            Math.round(point.y / (cell_size)) * (cell_size),
            Math.round(point.z / (cell_size)) * (cell_size)
        )
    },



    set_subdivisions(n) {
        this._divisions = n;
        this._cell_size = 64 / n;
        core.scene.remove(this._grid_mesh);
        this._grid_mesh.dispose();
        this._grid_mesh = new THREE.GridHelper(64,n,0xFFFFFFFF, 0x44444444);
        this.set_axis(this._axis);
        core.scene.add(this._grid_mesh);
    },



    align_to_camera() {
        let distance = new THREE.Vector3()
        distance.subVectors( this._grid_mesh.position, core.camera.position )
        distance.x = Math.abs(distance.x)
        distance.y = Math.abs(distance.y)
        distance.z = Math.abs(distance.z)
        let largest_dot = 0
        let closest_axis = null
        let axes = [
            new THREE.Vector3(1,0,0),
            new THREE.Vector3(0,1,0),
            new THREE.Vector3(0,0,1),
        ]
        for (let axis of [ X, Y, Z ]) {
            let dot = axes[axis].dot(distance)
            if ( dot > largest_dot ) { largest_dot = dot;
                closest_axis = axis
            }
        }
        this.set_axis(closest_axis)
        this.set_polarity()

    }
}
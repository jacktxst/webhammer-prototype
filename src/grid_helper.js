// the grid: serves as a visual, and a solid plane that tools
// are aware of and can interact with. tools snap to the grid, or extrude things off the grid.

import * as THREE from 'three';
import core from './webhammer.js';

const X = 0;
const Y = 1;
const Z = 2;

export default {
    dir: 1, // what is this?
    object: new THREE.GridHelper(64,16,0xFFFFFFFF, 0x44444444),
    hitplane: (()=>{
        let mesh = new THREE.Mesh(
            new THREE.PlaneGeometry(1024,1024),
            new THREE.MeshNormalMaterial());
        mesh.material.transparent = true;
        mesh.material.opacity = 0.2;
        mesh.visible = true;
        return mesh;})(),
    divisions: 16,
    axis: Y,
    default_axis: Y,
    default_div: 16,
    cell_size: 64/16,
    set_position(pos) {
        this.hitplane.position.copy(pos);
        this.object.position.copy(pos);
    },
    set_default(axis) {
        this.default_axis = axis;
        this.default_plane();
    },
    default_plane() {
        this.setAxis(this.default_axis);
    },
    setAxis(axis) {
        const vecs = [
            new THREE.Euler(0,0,Math.PI/2),
            new THREE.Euler(0,0,0),
            new THREE.Euler(Math.PI/2,0,0)
        ];
        this.object.rotation.copy(vecs[axis]);
        this.axis = axis;
        const r = [
            [0,  Math.PI / 2, 0],   // X (YZ plane)
            [-Math.PI / 2, 0, 0],   // Y (XZ plane)
            [0, 0, 0]               // Z (XY plane)
        ];
        const arr = r[this.axis];
        this.hitplane.rotation.set(arr[X], arr[Y], arr[Z]);
        this.setDir()
    },
    setDir() {
        this.dir = 1;
        const planeNormal = new THREE.Vector3(0, 0, 1)
            .applyQuaternion(this.hitplane.quaternion)
            .normalize();
        const planeToCam = new THREE.Vector3()
            .subVectors(core.camera.position, this.hitplane.position);
        if (planeNormal.dot(planeToCam) < 0) {
            this.dir = -1;
            this.hitplane.rotateY(Math.PI);
        }
    },
    grow_cells() {
        this.set_subdivisions(this.divisions/2);
    },
    shrink_cells() {
        this.set_subdivisions(this.divisions*2);
    },
    snap_to_grid(point) {
        const cell_size = this.cell_size;
        return new THREE.Vector3(
            Math.round(point.x / (cell_size)) * (cell_size),
            Math.round(point.y / (cell_size)) * (cell_size),
            Math.round(point.z / (cell_size)) * (cell_size)
        )
    },
    set_subdivisions(n) {
        this.divisions = n;
        this.cell_size = 64 / n;
        core.scene.remove(this.object);
        this.object.dispose();
        this.object = new THREE.GridHelper(64,n,0xFFFFFFFF, 0x44444444);
        this.setAxis(this.axis);
        core.scene.add(this.object);
    },
    align_to_camera() {
        let distance = new THREE.Vector3()
        distance.subVectors( this.object.position, core.camera.position )
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
        this.setAxis(closest_axis)
        this.setDir()

    }
}
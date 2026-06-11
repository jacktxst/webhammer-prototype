import * as THREE from 'three';


export default class Body {


	constructor(options = {}) {
        Object.assign(this, {
            size: new THREE.Vector3(),
            position: new THREE.Vector3(),
            _on_ground: false
        }, options);
    }

    do_world_collision(motion_vec, colliders) {

        this.position.add(motion_vec);

        const half = this.size.clone().multiplyScalar(0.5);

        const aabb_verts = new Array(8);
        const refresh_aabb_verts = () => {
            const min_x = this.position.x - half.x;
            const min_y = this.position.y - half.y;
            const min_z = this.position.z - half.z;
            const max_x = this.position.x + half.x;
            const max_y = this.position.y + half.y;
            const max_z = this.position.z + half.z;
            for (let i = 0; i < 8; i++) {
                aabb_verts[i] = new THREE.Vector3(
                    (i & 1) ? max_x : min_x,
                    (i & 2) ? max_y : min_y,
                    (i & 4) ? max_z : min_z,
                );
            }
        };
        refresh_aabb_verts();

        const project = (verts, axis) => {
            let lo = Infinity, hi = -Infinity;
            for (const v of verts) {
                const p = v.dot(axis);
                if (p < lo) lo = p;
                if (p > hi) hi = p;
            }
            return [lo, hi];
        };

        for (const collider of colliders) {
            const brush = collider.brushRef;
            if (!brush) continue;

            const brush_verts = brush._computeVertices();
            if (brush_verts.length === 0) continue;

            const axes = [
                new THREE.Vector3(1, 0, 0),
                new THREE.Vector3(0, 1, 0),
                new THREE.Vector3(0, 0, 1),
            ];
            for (const plane of brush._planes) {
                axes.push(plane.normal.clone());
            }

            let min_overlap = Infinity;
            let min_axis = null;
            let separated = false;

            for (const axis of axes) {
                const [a_lo, a_hi] = project(aabb_verts, axis);
                const [b_lo, b_hi] = project(brush_verts, axis);

                if (a_hi <= b_lo || b_hi <= a_lo) {
                    separated = true;
                    break;
                }

                const overlap = Math.min(a_hi, b_hi) - Math.max(a_lo, b_lo);
                if (overlap < min_overlap) {
                    min_overlap = overlap;
                    const a_center = (a_lo + a_hi) * 0.5;
                    const b_center = (b_lo + b_hi) * 0.5;
                    min_axis = (a_center < b_center) ? axis.clone().negate() : axis.clone();
                }
            }

            if (!separated && min_axis) {
                this.position.addScaledVector(min_axis, min_overlap);
                refresh_aabb_verts();
            }
        }

    }

}

/* brush.js

    brushes are the fundamental building blocks of maps. 

    in practice, they define the individual shapes that make up a level's geometry.

    they can be a lot more complicated than just simple cubes, prisms and other
    primitive shapes.

    a brush can define any finite-faced convex polyhedron, or any shape
    with no holes or dents. of course, shapes with holes or dents can always be made
    out of two or more brushes.

    brushes defined this way allow for a rich set of ways to manipulate the primitives of level design,
    and they also work well with the BSP algorithm.

    


    PlaneBrush class definition

    this type is a set of planes
    and functions for generating a 3d mesh at the intersection of those planes

    allows the user to construct brush based geometry and manipulate it with planar operations

    could also return a list of surfaces

    as well as methods for serialization and deserialization

    we will want a mesh for each face actually so that raycast hits tell us which face was selected maybe?

    multiple meshes actually may need to be generated if multiple materials used?

*/


import * as THREE from 'three';

// very small epsilon value for getting rid of glitches related to floating point precision (sort of)
const EPS = 1e-5;

class BrushPlane {

    constructor(options = {}) {
        Object.assign(this, {
            normal: new THREE.Vector3(),
            distance: 0,
            material_id: 0,
            uv_scale: new THREE.Vector2(1, 1),
            uv_offset: new THREE.Vector2(),
            uv_rotation: 0
        }, options);
    }

    // points is a list of 2 Vector3 points
    // this function returns a plane { normal, distance }
    // that represents the cutting plane defined by the given line segment
    //
    // the cutting plane contains the segment and is perpendicular to this
    // BrushPlane, so cutting a brush by this plane slices straight down
    // through the face the user drew on
    getKnifePlane( points ) {
        const [a, b] = points;
        const lineDir = b.clone().sub(a);
        const normal = new THREE.Vector3()
            .crossVectors(this.normal, lineDir)
            .normalize();
        const distance = normal.dot(a);
        return { normal, distance };
    }

    // return a point projected onto the plane
    projectPointToPlane( point ) {
        const d = this.normal.dot(point) - this.distance;
        return point.clone().addScaledVector(this.normal, -d);
    }

}

export class PlaneBrush {

    // create a cuboid shaped brush
    constructor(position, size, material_id) {
        this._planes = [];

        for (let axis of ['x', 'y', 'z']) {
            const i = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;

            for (let sign of [-1, 1]) {
                const normal = new THREE.Vector3();
                normal.setComponent(i, sign);

                const distance =
                    sign * position[axis] + Math.abs(size[axis]) / 2;

                this._planes.push(new BrushPlane({
                    normal,
                    distance,
                    material_id
                }));
            }
        }
        this._generateMesh();
    }

    to_string() {

        let object = { planes : []}

        for (let plane of this._planes) {

            object.planes.push({
                normal: { x: plane.normal.x, y: plane.normal.y, z: plane.normal.z },
                distance: plane.distance,
                material_id: plane.material_id,
                uv_scale: { x: plane.uv_scale.x, y: plane.uv_scale.y },
                uv_offset: { x: plane.uv_offset.x, y: plane.uv_offset.y },
                uv_rotation: plane.uv_rotation
            })

        }

        return JSON.stringify(object)

    }

    from_string(str) {
        this._planes = []
        let object = JSON.parse(str)
        for (let plane_data of object.planes) {

            // legacy saves may have uv_scale = (0,0) from the old default; treat as (1,1)
            const sx = plane_data.uv_scale.x || 1;
            const sy = plane_data.uv_scale.y || 1;

            this._planes.push(
                new BrushPlane({
                    normal: new THREE.Vector3(plane_data.normal.x, plane_data.normal.y, plane_data.normal.z),
                    distance: plane_data.distance,
                    material_id: plane_data.material_id,
                    uv_scale: new THREE.Vector2(sx, sy),
                    uv_offset: new THREE.Vector2(plane_data.uv_offset.x, plane_data.uv_offset.y),
                    uv_rotation: plane_data.uv_rotation
                })
            );

        }

        this._generateMesh()

    }

    // -------------------------
    // CSG knife split
    // -------------------------
    knife(pnormal, pdistance, material_id) {
        const n = pnormal.clone().normalize();

        const frontPlanes = this._clonePlanes();
        frontPlanes.push(new BrushPlane({
            normal: n.clone(),
            distance: pdistance,
            material_id: material_id
        }));

        const backPlanes = this._clonePlanes();
        backPlanes.push(new BrushPlane({
            normal: n.clone().negate(),
            distance: -pdistance,
            material_id: material_id
        }));

        const front = new PlaneBrush(new THREE.Vector3(), new THREE.Vector3(1, 1, 1), 0);
        front._planes = frontPlanes;
        front._generateMesh();

        const back = new PlaneBrush(new THREE.Vector3(), new THREE.Vector3(1, 1, 1), 0);
        back._planes = backPlanes;
        back._generateMesh();

        return [back, front];
    }

    // -------------------------
    // Transformations
    // -------------------------
    scale(vec, uv_lock = false) {
        // when uv_lock is on, snapshot per-face state so we can re-anchor the texture
        // after the planes (and therefore their basis vectors) change
        let old_state = null;
        if (uv_lock) {
            old_state = this._planes.map(p => {
                const u = new THREE.Vector3(), v = new THREE.Vector3();
                this._buildBasis(p.normal, u, v);
                return {
                    u, v,
                    center: p.normal.clone().multiplyScalar(p.distance),
                    uv_scale: p.uv_scale.clone(),
                    uv_offset: p.uv_offset.clone()
                };
            });
        }

        for (const p of this._planes) {
            // transform a plane { n, d } where n.P = d under axis scaling S = diag(vec):
            //   new equation is (S^-T n) . P' = d
            //   normalize so new_n stays unit length
            const nx = p.normal.x / vec.x;
            const ny = p.normal.y / vec.y;
            const nz = p.normal.z / vec.z;
            const L = Math.hypot(nx, ny, nz);
            p.normal.set(nx / L, ny / L, nz / L);
            p.distance = p.distance / L;
        }

        if (uv_lock) {
            for (let i = 0; i < this._planes.length; i++) {
                const p = this._planes[i];
                const old = old_state[i];
                const new_u = new THREE.Vector3(), new_v = new THREE.Vector3();
                this._buildBasis(p.normal, new_u, new_v);

                // how much the face stretches along its U/V axes:
                // a unit step along the old basis becomes (old_basis * vec) in world space after scale;
                // project that onto the new basis to get the signed stretch factor.
                // exact for axis-aligned scaling of axis-aligned faces; approximate otherwise.
                const u_after = new THREE.Vector3(old.u.x * vec.x, old.u.y * vec.y, old.u.z * vec.z);
                const v_after = new THREE.Vector3(old.v.x * vec.x, old.v.y * vec.y, old.v.z * vec.z);
                const u_factor = u_after.dot(new_u);
                const v_factor = v_after.dot(new_v);

                p.uv_scale.x = old.uv_scale.x * u_factor;
                p.uv_scale.y = old.uv_scale.y * v_factor;

                // re-anchor uv_offset so the plane center samples the same texel before/after
                const cos_r = Math.cos(p.uv_rotation);
                const sin_r = Math.sin(p.uv_rotation);
                const new_center = p.normal.clone().multiplyScalar(p.distance);

                const old_uw = old.center.dot(old.u);
                const old_vw = old.center.dot(old.v);
                const old_ur = old_uw * cos_r - old_vw * sin_r;
                const old_vr = old_uw * sin_r + old_vw * cos_r;
                const old_final_u = old_ur / old.uv_scale.x + old.uv_offset.x;
                const old_final_v = old_vr / old.uv_scale.y + old.uv_offset.y;

                const new_uw = new_center.dot(new_u);
                const new_vw = new_center.dot(new_v);
                const new_ur = new_uw * cos_r - new_vw * sin_r;
                const new_vr = new_uw * sin_r + new_vw * cos_r;
                p.uv_offset.x = old_final_u - new_ur / p.uv_scale.x;
                p.uv_offset.y = old_final_v - new_vr / p.uv_scale.y;
            }
        }

        this._generateMesh();
    }

    translate(vec, uv_lock = false) {
        for (const p of this._planes) {
            if (uv_lock) {
                // translation leaves normals (and basis) unchanged, so we just need
                // to subtract the world-UV shift at any vertex from uv_offset
                const u = new THREE.Vector3(), v = new THREE.Vector3();
                this._buildBasis(p.normal, u, v);
                const du = vec.dot(u);
                const dv = vec.dot(v);
                const cos_r = Math.cos(p.uv_rotation);
                const sin_r = Math.sin(p.uv_rotation);
                p.uv_offset.x -= (du * cos_r - dv * sin_r) / p.uv_scale.x;
                p.uv_offset.y -= (du * sin_r + dv * cos_r) / p.uv_scale.y;
            }
            p.distance += p.normal.dot(vec);
        }
        this._generateMesh();
    }

    rotate(euler) {
        const q = new THREE.Quaternion().setFromEuler(euler);

        for (const p of this._planes) {
            const point = p.normal.clone().multiplyScalar(p.distance);
            p.normal.applyQuaternion(q).normalize();
            p.distance = p.normal.dot(point.applyQuaternion(q));
        }

        this._generateMesh();
    }

    // -------------------------
    // Bounding box
    // -------------------------
    getBoundingBox() {
        const verts = this._computeVertices();
        const min = new THREE.Vector3(+Infinity, +Infinity, +Infinity);
        const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        for (const v of verts) {
            min.min(v);
            max.max(v);
        }

        return {
            position: min.clone().add(max).multiplyScalar(0.5),
            size: max.clone().sub(min).multiplyScalar(1)
        };
    }

    /*  _generateMesh() -> void

        modifies this.mesh to reflect this._planes
        frees previous geometry and removes old mesh from the scene

        adds the mesh to the scene

        problems:
            uv transform untested for more complex brushes
            multiple materials not currently supported
            can raycast detect which face was hit?
            unclear mesh lifetime management

    */
    _generateMesh() {
        const positions = [];
        const normals = [];
        const uvs = [];
        const indices = [];

        let materials = []
        let face_lengths = []
        this._tri_to_plane = []

        let indexOffset = 0;

        for (let i = 0; i < this._planes.length; i++) {

            const face = this._buildFace(i);
            if (!face || face.length < 3) continue;

            materials.push( core.materials[ this._planes[i].material_id ] )

            const plane = this._planes[i];
            const normal = plane.normal;

            const basisU = new THREE.Vector3();
            const basisV = new THREE.Vector3();
            this._buildBasis(normal, basisU, basisV);

            const cos_r = Math.cos(plane.uv_rotation);
            const sin_r = Math.sin(plane.uv_rotation);

            for (const v of face) {
                positions.push(v.x, v.y, v.z);
                normals.push(normal.x, normal.y, normal.z);

                const uw = v.dot(basisU);
                const vw = v.dot(basisV);
                const ur = uw * cos_r - vw * sin_r;
                const vr = uw * sin_r + vw * cos_r;
                uvs.push(
                    ur / plane.uv_scale.x + plane.uv_offset.x,
                    vr / plane.uv_scale.y + plane.uv_offset.y
                );
            }

            for (let t = 1; t < face.length - 1; t++) {
                indices.push(
                    indexOffset,
                    indexOffset + t,
                    indexOffset + t + 1
                );
                this._tri_to_plane.push(i);
            }

            indexOffset += face.length;

            face_lengths.push((face.length - 2) * 3)


        }

        const geom = new THREE.BufferGeometry();
        geom.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geom.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geom.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geom.setIndex(indices);

        
        let index_accumulate = 0
        for (let i = 0; i < materials.length; i++) {
            geom.addGroup(index_accumulate, face_lengths[i], i)
            index_accumulate += face_lengths[i]
        }
        

        geom.computeBoundingSphere();

        if (this.mesh) {
            this.mesh.geometry.dispose();
            this.mesh.geometry = geom 
            this.mesh.material = materials
        } else {
            this.mesh = new THREE.Mesh(geom , materials )
            this.mesh.brushRef = this
            core.brush_group.add(this.mesh);
        }
        

    }

    // -------------------------
    // Face construction
    // -------------------------
    _buildFace(planeIndex) {
        const plane = this._planes[planeIndex];

        let poly = this._initialHugePolygon(plane);

        for (let i = 0; i < this._planes.length; i++) {
            if (i === planeIndex) continue;
            poly = this._clipPolygon(poly, this._planes[i]);
            if (poly.length === 0) return null;
        }

        return this._sortPolygon(poly, plane.normal);
    }

    _initialHugePolygon(plane) {
        const center = plane.normal.clone().multiplyScalar(plane.distance);

        const u = new THREE.Vector3();
        const v = new THREE.Vector3();
        this._buildBasis(plane.normal, u, v);

        const s = 10000;

        return [
            center.clone().addScaledVector(u, -s).addScaledVector(v, -s),
            center.clone().addScaledVector(u,  s).addScaledVector(v, -s),
            center.clone().addScaledVector(u,  s).addScaledVector(v,  s),
            center.clone().addScaledVector(u, -s).addScaledVector(v,  s),
        ];
    }

    _clipPolygon(poly, plane) {
        const out = [];

        for (let i = 0; i < poly.length; i++) {
            const a = poly[i];
            const b = poly[(i + 1) % poly.length];

            const da = plane.normal.dot(a) - plane.distance;
            const db = plane.normal.dot(b) - plane.distance;

            // keep INSIDE
            if (da <= EPS) out.push(a.clone());

            // edge crosses plane
            if ((da <= 0 && db > 0) || (da > 0 && db <= 0)) {
                const t = da / (da - db);
                out.push(a.clone().lerp(b, t));
            }
        }

        return out;
    }

    _sortPolygon(poly, normal) {
        const center = new THREE.Vector3();
        for (const v of poly) center.add(v);
        center.multiplyScalar(1 / poly.length);

        const u = new THREE.Vector3();
        const v = new THREE.Vector3();
        this._buildBasis(normal, u, v);

        return poly.sort((a, b) => {
            const da = Math.atan2(
                a.clone().sub(center).dot(v),
                a.clone().sub(center).dot(u)
            );
            const db = Math.atan2(
                b.clone().sub(center).dot(v),
                b.clone().sub(center).dot(u)
            );
            return da - db;
        });
    }

    _buildBasis(n, u, v) {
        const up = Math.abs(n.z) < 0.99
            ? new THREE.Vector3(0, 0, 1)
            : new THREE.Vector3(0, 1, 0);

        u.crossVectors(up, n).normalize();
        v.crossVectors(n, u).normalize();
    }

    _computeVertices() {
        const verts = [];
        for (let i = 0; i < this._planes.length; i++) {
            const face = this._buildFace(i);
            if (!face) continue;
            for (const v of face) verts.push(v);
        }
        return verts;
    }

    _clonePlanes() {
        return this._planes.map(p => new BrushPlane({
            normal: p.normal.clone(),
            distance: p.distance,
            material_id: p.material_id,
            uv_scale: p.uv_scale.clone(),
            uv_offset: p.uv_offset.clone(),
            uv_rotation: p.uv_rotation
        }));
    }
}



import { raycast } from '../helpers.js'
import * as THREE from 'three';
import core from '../webhammer.js';

export default {

	dragging : null,
	start : null,
	end : null,
	cut_line_mesh : null,
	cut_plane_mesh : null,


    on_start(e) {
        const hit = raycast(e, core.brush_group.children, false);
        if (!hit) return;
        const brush = hit.object.brushRef;
        this.dragging = brush._planes[brush._tri_to_plane[hit.faceIndex]];
        this.dragged_brush = brush

        this.start = this.dragging.projectPointToPlane(core.grid.snap_to_grid(hit.point))

    },
    on_move(e) {

    	if( !this.dragging ) return;

    	const hit = raycast(e, core.brush_group.children, false);
        if (!hit) return;

        this.end = this.dragging.projectPointToPlane(core.grid.snap_to_grid(hit.point))

        // tear down last frame's helpers
        if (this.cut_line_mesh)  core.scene.remove(this.cut_line_mesh)
        if (this.cut_plane_mesh) core.scene.remove(this.cut_plane_mesh)

        // line connecting the two snapped points on the face
        const line_geom = new THREE.BufferGeometry().setFromPoints([this.start, this.end]);
        const line_mat = new THREE.LineBasicMaterial({ color: 0xffffff });
        this.cut_line_mesh = new THREE.Line(line_geom, line_mat);
        core.scene.add(this.cut_line_mesh);

        // cutting plane: red translucent quad
        // getKnifePlane gives us { normal, distance } for the infinite cut plane.
        // To draw it, we build a quad on that plane using two in-plane basis
        // vectors:
        //   u = unit direction along the segment   (the cut plane contains the segment)
        //   v = this face's normal                  (the cut plane is perpendicular to the face)
        // Both u and v are perpendicular to cut_plane.normal by construction.
        const segDir = this.end.clone().sub(this.start);
        const segLen = segDir.length();
        if (segLen < 1e-5) {
            this.cut_plane_mesh = null;
            return;
        }
        segDir.divideScalar(segLen);

        const cut_plane = this.dragging.getKnifePlane([this.start, this.end]);

        const u = segDir;
        const v = this.dragging.normal.clone().normalize();

        const center = this.start.clone().add(this.end).multiplyScalar(0.5);
        const half_along  = segLen / 2 + 0.5;   // pad past each segment end
        const half_normal = 2;                  // depth above/below the face

        const a = center.clone().addScaledVector(u, -half_along).addScaledVector(v, -half_normal);
        const b = center.clone().addScaledVector(u,  half_along).addScaledVector(v, -half_normal);
        const c = center.clone().addScaledVector(u,  half_along).addScaledVector(v,  half_normal);
        const d = center.clone().addScaledVector(u, -half_along).addScaledVector(v,  half_normal);

        const plane_geom = new THREE.BufferGeometry();
        plane_geom.setAttribute('position', new THREE.Float32BufferAttribute([
            a.x, a.y, a.z,
            b.x, b.y, b.z,
            c.x, c.y, c.z,
            d.x, d.y, d.z
        ], 3));
        plane_geom.setIndex([0, 1, 2, 0, 2, 3]);
        plane_geom.computeVertexNormals();

        const plane_mat = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.4,
            side: THREE.DoubleSide,
            depthWrite: false
        });
        this.cut_plane_mesh = new THREE.Mesh(plane_geom, plane_mat);
        core.scene.add(this.cut_plane_mesh);

        // cut_plane is { normal, distance } — ready to hand to brush.knife() on commit
        void cut_plane;
    },
    on_end(e) {

        // commit the cut if we have a real segment
        if (this.dragging && this.dragged_brush && this.start && this.end) {
            const segLen = this.end.clone().sub(this.start).length();
            if (segLen >= 1e-5) {
                const cut_plane = this.dragging.getKnifePlane([this.start, this.end]);
                const old_mesh = this.dragged_brush.mesh;

                // knife() builds two new PlaneBrushes; _generateMesh on each
                // adds their meshes to brush_group automatically
                this.dragged_brush.knife(cut_plane.normal, cut_plane.distance, this.dragging.material_id);

                // the original brush's mesh is still in the scene — kill it
                if (old_mesh) {
                    old_mesh.geometry.dispose();
                    core.brush_group.remove(old_mesh);
                }
            }
        }

        // clear the on-screen guides
        if (this.cut_line_mesh)  { core.scene.remove(this.cut_line_mesh);  this.cut_line_mesh  = null; }
        if (this.cut_plane_mesh) { core.scene.remove(this.cut_plane_mesh); this.cut_plane_mesh = null; }

        this.dragging = null
        this.dragged_brush = null
        this.start = null
        this.end = null
    }
}

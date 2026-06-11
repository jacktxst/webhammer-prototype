import { raycast } from '../helpers.js'
import * as THREE from 'three';
import core from '../webhammer.js';

class ResizeHandleGroup {

	static handle_material = new THREE.MeshBasicMaterial({ color: 0xffffff })
	static handle_geom = new THREE.BoxGeometry()
	static selected_handle_material = new THREE.MeshBasicMaterial({ color: 0xff0000 })
	constructor(){

		const group = new THREE.Object3D();
        const magnitudes = [-1, 0, 1];
        for (let x = 0; x < 3; x++) {
            for (let y = 0; y < 3; y++) {
                for (let z = 0; z < 3; z++) {
                    const handle_magnitude = new THREE.Vector3(magnitudes[x], magnitudes[y], magnitudes[z]);
                    if (!handle_magnitude.length()) continue;

                    const sprite = new THREE.Mesh(
                        ResizeHandleGroup.handle_geom,
                        ResizeHandleGroup.handle_material
                    );
                    sprite.handle_magnitude = handle_magnitude;
                    sprite.scale.multiplyScalar(0.1);
                    group.add(sprite);
                }
            }
        }

        this.object = group

	}
    
    update_handle_positions(center = new THREE.Vector3(), size = new THREE.Vector3()) {
        const half_size = size.clone().multiplyScalar(0.5);
        for (let handle of this.object.children) {
            const handle_offset = handle.handle_magnitude.clone().multiply(half_size);
            const handle_position = center.clone().add(handle_offset);
            handle.position.copy(handle_position);
            handle.scale.copy(size).multiplyScalar(0.125);
        }
    }

}



export default {

	handle_group: new ResizeHandleGroup(),

	init() {
		core.scene.add(this.handle_group.object)
		this.aabb = core.tools.multiselect.get_selection_aabb()
		this.handle_group.update_handle_positions( this.aabb.position, this.aabb.size )
	},

	cleanup() {
		core.scene.remove(this.handle_group.object)
	},

	on_start(e) {

		let hit = raycast(e, this.handle_group.object.children, false);

		if (hit?.object) {

			this.dragged_handle = hit.object;
            this.scaling = true;
            hit.object.material = ResizeHandleGroup.selected_handle_material;
            core.grid.set_position(core.grid.snap_to_grid(hit.object.position));
            core.grid.align_to_camera();

			return;
		}

		hit = raycast(e, core.tools.multiselect.selected_brushes, false);

		if (hit?.object) {

			// find the closest cardinal plane

			function dominant_axis(v) {
			    const ax = Math.abs(v.x), ay = Math.abs(v.y), az = Math.abs(v.z);
			    return ax >= ay ? (ax >= az ? 0 : 2) : (ay >= az ? 1 : 2);
			}

        	let hit_normal = hit.object.brushRef._planes[hit.object.brushRef._tri_to_plane[hit.faceIndex]].normal;

			core.grid.set_axis(dominant_axis(hit_normal))
			core.grid.set_position(core.grid.snap_to_grid(hit.point))
			this.translating = true
		}


	},

	on_move(e) {

		if (this.translating) {

			const hit = raycast(e, [core.grid._hitplane_mesh], false);
			
			if (hit?.object) {
				hit.point = core.grid.snap_to_grid(hit.point)
				let translation = new THREE.Vector3().subVectors(hit.point, core.grid.get_position())
				this.aabb.position.add(translation)
				core.grid.set_position(hit.point)
				for (let object of core.tools.multiselect.selected_brushes) {
					object.brushRef.translate(translation)
					object.highlight_mesh.highlight_mesh.position.add(translation)
					object.highlight_mesh.edges_mesh.position.add(translation)
				}

				this.handle_group.update_handle_positions( this.aabb.position, this.aabb.size )


			} else {
				core.grid.set_to_default()
				this.translating = false
			}

		} else if (this.scaling) {

			const hit = raycast(e, [core.grid._hitplane_mesh], false);

			if (!hit?.point) return;

			hit.point = core.grid.snap_to_grid(hit.point) // .clone();
	        hit.point.sub(this.dragged_handle.position); // difference
	        hit.point.multiply(this.dragged_handle.handle_magnitude); // axis restricted
	        
	        if (this.aabb.size.x + hit.point.x === 0) hit.point.x = 0;
	        if (this.aabb.size.y + hit.point.y === 0) hit.point.y = 0;
	        if (this.aabb.size.z + hit.point.z === 0) hit.point.z = 0;

	        let old = this.aabb.size.clone()

	        this.aabb.size.add(hit.point);

	        let scale_factor = this.aabb.size.clone()
	        scale_factor.divide(old);



	        hit.point.multiplyScalar(0.5);
	        hit.point.multiply(this.dragged_handle.handle_magnitude);
	        this.aabb.position.add(hit.point);
			this.handle_group.update_handle_positions( this.aabb.position, this.aabb.size )

			const half_size = this.aabb.size.clone().multiplyScalar(0.5);
			const anchor = this.aabb.position.clone().sub(half_size.multiply(this.dragged_handle.handle_magnitude));
			const translation_amount = anchor.multiply(new THREE.Vector3(1, 1, 1).sub(scale_factor));

			for (let object of core.tools.multiselect.selected_brushes) {
				object.brushRef.scale(scale_factor)
				object.brushRef.translate(translation_amount)

				// re-point the highlight at the brush's freshly-regenerated geometry
				// so they share bit-identical vertex data — the Object3D scale path on
				// the original vertices diverges from the brush's plane-clipping path
				// under non-uniform scale, which makes the brush surface z-fight with
				// the overlay
				const hl = object.highlight_mesh;
				hl.highlight_mesh.geometry = object.brushRef.mesh.geometry;
				hl.highlight_mesh.position.set(0, 0, 0);
				hl.highlight_mesh.scale.set(1, 1, 1);
				hl.edges_mesh.geometry.dispose();
				hl.edges_mesh.geometry = new THREE.EdgesGeometry(object.brushRef.mesh.geometry);
				hl.edges_mesh.position.set(0, 0, 0);
				hl.edges_mesh.scale.set(1, 1, 1);
			}
		}

	},

	on_end(e) {
		if (this.scaling) {
			this.dragged_handle.material = ResizeHandleGroup.handle_material;
			this.dragged_handle = null
			this.scaling = false
		} else {
			this.translating = false

		}
		core.grid.set_to_default()
	}

}
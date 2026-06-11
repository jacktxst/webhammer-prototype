
import { raycast } from '../helpers.js'
import core from '../webhammer.js';
import * as THREE from 'three';

class HighlightMesh {

	static highlight_material = new THREE.MeshBasicMaterial({
        color: 0xaaccff,
        transparent: true,
        opacity: 0.25,
        depthWrite: false
    });

    static edges_material = new THREE.LineBasicMaterial({ color: 0xffffff });

	constructor(brush) {
        
        const geom = brush.mesh.geometry;

        this.highlight_mesh = new THREE.Mesh(
            geom,
            HighlightMesh.highlight_material
        );
        this.highlight_mesh.renderOrder = 1;
        core.scene.add(this.highlight_mesh);

        const edge_geom = new THREE.EdgesGeometry(geom);
        this.edges_mesh = new THREE.LineSegments(
            edge_geom,
            HighlightMesh.edges_material
        );
        this.edges_mesh.renderOrder = 2;
        core.scene.add(this.edges_mesh);
    }

    dispose() {
    	core.scene.remove(this.highlight_mesh)
    	core.scene.remove(this.edges_mesh)
    	this.highlight_mesh.geometry.dispose()
    	this.edges_mesh.geometry.dispose()
    }

}

class ResizeHandleGroup {



}


export default {

	selected_brushes: [],
	mode : "multi_toggle",

	get_selection_aabb() {

		if (this.selected_brushes.length === 0) return null;

		const min = new THREE.Vector3(+Infinity, +Infinity, +Infinity);
		const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

		for (let object of this.selected_brushes) {
			const bound = object.brushRef.getBoundingBox();
			const half = bound.size.clone().multiplyScalar(0.5);
			min.min(bound.position.clone().sub(half));
			max.max(bound.position.clone().add(half));
		}

		return {
			position: min.clone().add(max).multiplyScalar(0.5),
			size: max.clone().sub(min)
		};

	},

	on_start(e) {

		const hit = raycast(e, core.brush_group.children, false);

		switch (this.mode) {

			case "single":
				this.deselect_all()
				if (hit?.object) {
					this.select(hit.object)
				} 
				break;

			case "multi_toggle": 
				if (hit?.object) {
					if (this.selected_brushes.includes(hit.object)) {
						this.deselect(hit.object)
					} 
					else {
						this.select(hit.object)
					}
				} else {
					this.deselect_all()
				}

				break;

			case "multi_add":
				if (hit?.object) {
					this.select(hit.object)
				} else {
					this.deselect_all()
				}

				break;

			case "multi_remove":
				if (hit?.object) {
					this.deselect(hit.object)
				} else {
					this.deselect_all()
				}

				break;
		}

	},

	select(object) {

		if (!this.selected_brushes.includes(object)) {

			this.selected_brushes.push(object)
			object.highlight_mesh = new HighlightMesh(object.brushRef)

		}		

	},

	deselect(object) {

		if (this.selected_brushes.includes(object)) {

			this.selected_brushes = this.selected_brushes.filter( (e) => { return e !== object; } );
			object.highlight_mesh.dispose()
			object.highlight_mesh = null

		}
		
	},

	deselect_all() {
		for (let object of this.selected_brushes) {
			object.highlight_mesh.dispose()
			object.highlight_mesh = null
		}
		this.selected_brushes = []
	},

	on_move(e) {

	},

	on_end(e) {

	}

}
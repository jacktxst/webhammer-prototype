

import { raycast } from '../helpers.js'
import * as THREE from 'three';
import core from '../webhammer.js';

export default {

	size : new THREE.Vector2(),

	init() {
		if (!this.div) this.div = document.createElement('div')
		this.div.id = "drag_select_div"
		this.div.style = "outline: 1px solid white; background-color: rgba(0.7, 0.7, 0.9, 0.25); position: fixed; display: none;"
		document.body.appendChild(this.div)
	},

	on_start(e) {

		this.first_corner = new THREE.Vector2(e.clientX, e.clientY)
		this.dragged_corner = new THREE.Vector2()
		this.dragging = true
	} ,

	on_move(e) {
		if (this.dragging) {

			this.dragged_corner.set(e.clientX, e.clientY)
			this.div.style.display = "block"
			this.size.subVectors(this.dragged_corner,this.first_corner)
			this.div.style.left = `${Math.min(this.first_corner.x, this.dragged_corner.x)}px`
			this.div.style.top = `${Math.min(this.first_corner.y, this.dragged_corner.y)}px`
			this.div.style.width = `${Math.abs(this.size.x)}px`
			this.div.style.height = `${Math.abs(this.size.y)}px`

		}
	},

	on_end(e) {
		this.dragging = false

		const rect_min = new THREE.Vector2(
			Math.min(this.first_corner.x, this.dragged_corner.x),
			Math.min(this.first_corner.y, this.dragged_corner.y)
		)
		const rect_max = new THREE.Vector2(
			Math.max(this.first_corner.x, this.dragged_corner.x),
			Math.max(this.first_corner.y, this.dragged_corner.y)
		)

		const corner = new THREE.Vector3()

		for (let selectable_object of core.brush_group.children) {
			if (!selectable_object.brushRef) continue;

			const bb = selectable_object.brushRef.getBoundingBox()
			const half = bb.size.clone().multiplyScalar(0.5)

			let inside = false
			outer:
			for (let dx = -1; dx <= 1; dx += 2) {
				for (let dy = -1; dy <= 1; dy += 2) {
					for (let dz = -1; dz <= 1; dz += 2) {
						corner.set(
							bb.position.x + half.x * dx,
							bb.position.y + half.y * dy,
							bb.position.z + half.z * dz
						)
						corner.project(core.camera)

						if (corner.z > 1) continue;

						const sx = (corner.x * 0.5 + 0.5) * window.innerWidth
						const sy = (-corner.y * 0.5 + 0.5) * window.innerHeight

						if (sx >= rect_min.x && sx <= rect_max.x && sy >= rect_min.y && sy <= rect_max.y) {
							inside = true
							break outer;
						}
					}
				}
			}

			if (inside) {
				core.tools.multiselect.select(selectable_object)
			}
		}

		this.div.style.display = "none"
	},

	cleanup() {
		document.body.removeChild(this.div)
	}


}
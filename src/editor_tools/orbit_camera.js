import core from '../webhammer.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export default {
    init() {
        this.orbit_controls = new OrbitControls(core.camera, document.getElementById("look-area"));
        if (core.tools.select.selected) this.orbit_controls.target = core.tools.select.selected.position.clone();
    },
    on_start(e) { },
    on_move(e) { },
    on_end(e) { },
    cleanup() {
        this.orbit_controls.dispose();
    },
}
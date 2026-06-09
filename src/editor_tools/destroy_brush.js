// destroy brushes that the user taps on

import { raycast } from '../helpers.js'
import core from '../webhammer.js';

export default {
    on_start(e) {
        const hit = raycast(e, core.brush_group.children, false);
        if (!hit) return;
        core.brush_group.remove(hit.object);
    }
}
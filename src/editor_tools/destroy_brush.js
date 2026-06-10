// destroy brushes that the user taps on

import { raycast } from '../helpers.js'
import core from '../webhammer.js';
import icon from './icons/destroy_brush.svg';

export default {
    icon,
    description: "click on brushes to delete them",
    on_start(e) {
        const hit = raycast(e, core.brush_group.children, false);
        if (!hit) return;
        core.brush_group.remove(hit.object);
    }
}
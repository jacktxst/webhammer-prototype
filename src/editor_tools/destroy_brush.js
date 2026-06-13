// destroy brushes that the user taps on

import { raycast } from '../helpers.js'
import core from '../webhammer.js';
import icon from './icons/destroy_brush.svg';

export default {
    icon,
    description: "click on brushes to delete them. if you select multiple brushes with the multiselect tool, you can delete all the selected objects by using the delete tool on one of the objects in the selection.",
    on_start(e) {
        const hit = raycast(e, core.brush_group.children, false);
        if (!hit) return;
        core.brush_group.remove(hit.object);
        if (core.tools.multiselect.selected_brushes.includes(hit.object)) {
            for (let selected_object of core.tools.multiselect.selected_brushes) {
                core.brush_group.remove(selected_object);
            }
            core.tools.multiselect.deselect_all()
        }
    }
}
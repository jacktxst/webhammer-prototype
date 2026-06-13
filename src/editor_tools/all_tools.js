import create_block_tool from './create_block.js';
import destroy_brush_tool from './destroy_brush.js';
import orbit_camera_tool from './orbit_camera.js';
import paint_face_tool from './paint_face.js';
import paint_block_tool from './paint_block.js';
import knife_tool from './knife.js';
import multiselect from './multiselect.js'
import transform from './transform.js'
import stamp from './stamp.js'
import drag_select from './drag_select.js'

export default { 
    create_block: create_block_tool,
    drag_select,
    destroy_brush: destroy_brush_tool,
    orbit_camera: orbit_camera_tool,
    paint_block: paint_block_tool,
    paint_face: paint_face_tool,
    knife: knife_tool,
    multiselect,
    transform,
    stamp
    // pick material
}
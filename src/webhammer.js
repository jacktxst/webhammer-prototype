/* webhammer.js

   primary js module for webhammer

   it holds the state of the current project/app, references to commonly used objects,
   and some functions for manipulating project/app state

some of these bugs might not exist anymore. need to check

 - joystick fs up with multitouch
 - on ios safari sometimes theres a white bar at the top
 - no 0 thickness walls. wall thickness must snap to grid
 - pinch gesture translates the whole brush... wtf lol. panning must be
 - pointer lock not working very well
 - you cant click during pointer lock because clicks are only from look-area.
 - you can unintentionally snap the size against an axis thats not part of the drag plane when resizing
 - blocks should be created 1 unit thick, kind of like on top of the plane
 - select allows you to resize brushes to 0 thickness. bad!
 - orbit shifts the camera in a disorienting way
 - selection handles stay if you delete a selected brush
 - selection handles might stay red and get fucked up
 - grid doesnt return to 0 0 0 all the time
 - orbit + ortho fs up
 - resizing the grid unrotates it (visual bug only i think)
 - select tool grid change fs with x, y, z key grid change
 - the grid might not appear at the right place for selection tool. like, it may be off the actual world grid

BUGS

    grid orientation issues
    grid does not always reorient to default when it should

    block tool not always on the correct side of the grid
    orbit camera doesnt exist 
    brush select and resize tool can make a brush go bye - fixed i think?

    brush editor messed up
    vue proxy issues

CODE ISSUES
    horrible mixture of caps schemes
    vue components bad readability
    bad usage of comments throughout, inconsistent presence
    the vector[X] vector[Y] situation and the X, Y, Z enum situation are bad

what's majorly missing?

    orthographic mode

WHAT DO I DO NEXT?

    

    give the ui some love

        - selected brush should show the brush highlighted and the brush outline
        - selection box outline should be visible
        - test on mobile


    making brushes off of other brushes

ideas for the FUTURE

- tool settings menu
- saving layouts
- edit action before commit, enter precise parameters
- rotate brush
- translate brush
- edit history - redo / undo
- multiple views (optional)


- in game editing
- decals
- skybox

*/

import * as THREE from 'three';

import create_block_tool from './editor_tools/create_block.js';
import cuboid_selection_tool from './editor_tools/cuboid_selection.js';
import destroy_brush_tool from './editor_tools/destroy_brush.js';
import orbit_camera_tool from './editor_tools/orbit_camera.js';
import select_brush_tool from './editor_tools/select_brush.js';
import paint_face_tool from './editor_tools/paint_face.js';
import paint_block_tool from './editor_tools/paint_block.js';
import knife_tool from './editor_tools/knife.js';



import grid  from './grid_helper.js'
import input from './input.js'

import { PlaneBrush } from './brush.js';

import { clamp, get_wish_vec } from './helpers.js'

const X = 0;
const Y = 1;
const Z = 2;



export default {



    init(canvas) {
        this.textures = [],
        this.materials = [],

        this.current_material = 0
        this.pointer_locked = false

        this.velocity = [0,0,0]
        this.input_vec = [0,0]
        this.look_vel = new THREE.Vector2()
        this.wish_vec = [0,0]
        this.fly_speed = 4

        this.tool = null
        this.tools = { 
            create_block: create_block_tool,
            cuboid_selection: cuboid_selection_tool,
            destroy_brush: destroy_brush_tool,
            orbit_camera: orbit_camera_tool,
            select_brush: select_brush_tool,
            paint_block: paint_block_tool,
            paint_face: paint_face_tool,
            knife: knife_tool
        },
        this.grid = grid
        this.input = input
        this.canvas = canvas;
        this.renderer = new THREE.WebGLRenderer({canvas: this.canvas});
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        this.loop = this.loop.bind(this);
        this.on_resize = this.input.on_resize.bind(this);
        this.aspect = this.canvas.clientWidth / this.canvas.clientHeight;
        this.v_persp = new THREE.PerspectiveCamera();
        this.v_persp.rotation.order = 'YXZ';
        this.frustumSize = 10;
        this.v_ortho = new THREE.OrthographicCamera( - this.frustumSize * this.aspect, this.frustumSize * this.aspect, this.frustumSize, - this.frustumSize, 0.1, 100 );
        this.v_ortho.rotation.order = 'YXZ';
        this.camera = this.v_persp;
        this.camera.position.set(0, 5, 0);
        this.raycaster = new THREE.Raycaster();
        this.clock = new THREE.Clock();
        this.scene = new THREE.Scene();
        this.scene.add(this.brush_group = new THREE.Object3D());
        this.scene.add(this.grid.object);
        this.scene.add(this.grid.hitplane);

        this.grid.default_plane();
        this.input.init();
        this.input.on_resize();
        this.renderer.setAnimationLoop(this.loop);
    },



    update_movement() {
        this.input_vec[0] = clamp(this.input_vec[0], -1, 1);
        this.input_vec[1] = clamp(this.input_vec[1], -1, 1);
        this.wish_vec = get_wish_vec(this.input_vec, this.camera.rotation.y);
    },



    loop() {
        const dt = this.clock.getDelta();

        this.camera.position.x += this.wish_vec[X] * this.fly_speed * dt;
        this.camera.position.y += this.velocity[Y] * this.fly_speed * dt;
        this.camera.position.z += this.wish_vec[Y] * this.fly_speed * dt;

        this.camera.rotation.y += this.look_vel.y * 1.5 * dt;
        this.camera.rotation.x += this.look_vel.x * 1.5 * dt;
        this.look_vel.y = clamp(this.look_vel.y, -1, 1)
        this.look_vel.x = clamp(this.look_vel.x, -1, 1) 

        this.renderer.render(this.scene, this.camera);
    },



    /* prompt the user to open a level file and parse it */
    async load_level() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.zip';
        input.click();

        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const arrayBuffer = await file.arrayBuffer();
            const zip = await JSZip.loadAsync(arrayBuffer);

            this.textures = [];
            this.materials = [];
            while (this.brush_group.children.length) {
                this.brush_group.remove(this.brush_group.children[0]);
            }

            const textureFiles = Object.values(zip.files)
                .filter(f => !f.dir && f.name.startsWith('textures/'))
                .sort((a, b) => {
                    const ai = parseInt(a.name.match(/(\d+)\.png$/)?.[1] ?? 0);
                    const bi = parseInt(b.name.match(/(\d+)\.png$/)?.[1] ?? 0);
                    return ai - bi;
                });

            for (const f of textureFiles) {
                const uint8 = await f.async('uint8array');
                const blob = new Blob([uint8], { type: 'image/png' });

                const img = await new Promise((res, rej) => {
                    const i = new Image();
                    i.onload = () => res(i);
                    i.onerror = rej;
                    i.src = URL.createObjectURL(blob);
                });

                URL.revokeObjectURL(img.src);

                // convert to ImageBitmap if you want GPU-friendly uploads
                const bitmap = await createImageBitmap(img);
                this.create_texture(bitmap);
            }

            if (zip.files['materials.txt']) {
                const matText = await zip.files['materials.txt'].async('string');
                const matsData = JSON.parse(matText);

                for (let m of matsData) {
                    const mat = new THREE.MeshBasicMaterial({});
                    mat.kx_texture = m.kx_texture ?? 0;

                    if (this.textures[mat.kx_texture]) {
                        mat.map = this.textures[mat.kx_texture].texture;
                    }

                    this.materials.push(mat);
                }
            }

            if (zip.files['geometry.txt']) {
                const geomText = await zip.files['geometry.txt'].async('string');
                const lines = geomText.split('\n').filter(l => l.trim());

                for (let line of lines) {
                    const brush = new PlaneBrush(
                        new THREE.Vector3(),
                        new THREE.Vector3(1, 1, 1),
                        0
                    );
                    brush.from_string(line);
                }
            }
        };
    },



    /* bundle the level into a zip file and trigger a download */
    async save_level() {
        const zip = new JSZip();

        let geometry = '';
        for (let mesh of this.brush_group.children) {
            if (!mesh.brushRef) continue;
            geometry += mesh.brushRef.to_string() + '\n';
        }
        zip.file('geometry.txt', geometry);

        let materials = [];
        for (let material of this.materials) {
            materials.push({kx_texture: material.kx_texture ?? 0});
        }
        zip.file('materials.txt', JSON.stringify(materials));

        const texFolder = zip.folder('textures');
        for (let i = 0; i < this.textures.length; i++) {
            const tex = this.textures[i];
            const bitmap = tex.bitmap;
            const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
            const ctx = canvas.getContext('2d');
            ctx.drawImage(bitmap, 0, 0);
            const blob = await canvas.convertToBlob({type: 'image/png'});
            texFolder.file(i.toString() + '.png', blob);
        }

        const content = await zip.generateAsync({type:'blob'});
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'level.zip';
        a.click();
        URL.revokeObjectURL(url);
    },



    /* create and register a texture with the given image */
    create_texture(bitmap) {
        const texture = new THREE.Texture(bitmap);
        texture.anisotropy = 4;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        this.textures.push({ texture: texture, bitmap : bitmap  });
    },



    /* prompt the user to open an image file */
    import_texture() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;
            const bitmap = await createImageBitmap(file);
            this.create_texture(bitmap)
        };
        input.click();
    }

}

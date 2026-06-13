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

    you can rotate upside down

    you can crash by subdividing the grid too much
    
    grid orientation issues
    grid does not always reorient to default when it should

    can create brushes with no material and materials with no texture

    block tool not always on the correct side of the grid

    brush editor messed up
    vue proxy issues

    you hit resize handle before translate plane, so you can hit the resize handles THROUGH the brush ur tryna click on


CODE ISSUES
    horrible mixture of caps schemes
    vue components bad readability
    bad usage of comments throughout, inconsistent presence
    the vector[X] vector[Y] situation and the X, Y, Z enum situation are bad

what's majorly missing?

    orthographic mode

WHAT DO I DO NEXT?

    give the ui some love
    
        - resize handles should be transluscent white things with white outlines
        - smaller window title bars
        - test on mobile
        - looking around first person mode in mobile
        - new project button
        - numeric entry on mobile
        - copy paste
        - selection box outline should be visible

    making brushes off of other brushes

ideas for the FUTURE

- texture / material packs
- uv tool
- face select mode
- copy paste / duplicate
- multi select / multi transform
- brush grouping / joining / hierarchy / csg
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

import tools from './editor_tools/all_tools.js'
import Body from './player_body.js'
import grid  from './grid_helper.js'
import input from './input.js'

import { PlaneBrush } from './brush.js';

import { clamp, get_wish_vec } from './helpers.js'

const X = 0;
const Y = 1;
const Z = 2;



export default {

    new_level() {

        this.init()

    },

    init(canvas) {

        this.tools = tools
        this.grid = grid
        this.input = input

        this.textures = [],
        this.materials = [],

        this.current_material = 0
        this.pointer_locked = false
        this.tool = null

        this.velocity = [0,0,0]
        this.input_vec = [0,0]
        this.look_vel = new THREE.Vector2()
        this.wish_vec = [0,0]
        this.fly_speed = 4

        
        this.noclip = true
        this.body = new Body({ size:new THREE.Vector3(1,2,1), position: new THREE.Vector3(0, 5, 0) })

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
        this.brush_group = new THREE.Object3D()

        this.ambient_light = new THREE.AmbientLight(0xffffff, 0.5);
        this.directional_light = new THREE.DirectionalLight(0xffffff, 1.0);
        this.directional_light.position.set(1, 2, 1);

        this.scene.add(this.brush_group);
        this.scene.add(this.ambient_light);
        this.scene.add(this.directional_light);
        this.scene.add(this.grid._grid_mesh);
        this.scene.add(this.grid._hitplane_mesh);

        this.grid.set_to_default();
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
        const dt = this.clock.getDelta(); // three js deprecated

        if (this.tool == "orbit_camera") {
            this.body.position.copy(this.camera.position)
        } else {

            let move_vec = new THREE.Vector3( this.wish_vec[X] , this.velocity[Y] , this.wish_vec[Y] )
            move_vec.multiplyScalar( this.fly_speed * dt )

            if (this.noclip) {
                this.body.position.add(move_vec)
            } else {
                this.body.do_world_collision(move_vec, this.brush_group.children)
            }

            this.camera.position.copy(this.body.position)

            this.camera.rotation.y += this.look_vel.y * 1.5 * dt;
            this.camera.rotation.x += this.look_vel.x * 1.5 * dt;
            
        }

        this.renderer.render(this.scene, this.camera);
        this.grid.set_polarity()
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
                    const mat = new THREE.MeshLambertMaterial({});
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



    /* create and register a texture with the given image; name defaults to
       "Texture N" when the caller doesn't supply one (used by load_level) */
    create_texture(bitmap, name) {
        const texture = new THREE.Texture(bitmap);
        texture.anisotropy = 4;
        texture.generateMipmaps = false; 
        texture.magFilter = THREE.NearestFilter;
        texture.minFilter = THREE.NearestFilter;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;
        this.textures.push({
            texture: texture,
            bitmap: bitmap,
            name: name ?? ('Texture ' + this.textures.length)
        });
    },



    /* prompt the user to open an image file; texture name = filename sans extension */
    import_texture() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;
            const bitmap = await createImageBitmap(file);
            const name = file.name.replace(/\.[^/.]+$/, '');
            this.create_texture(bitmap, name);
        };
        input.click();
    },

    /* prompt the user to import an equirectangular image and use it as the
       in-editor scene background. this is a *preview* skybox only — it lives
       on core.preview_skybox and is NOT pushed into this.textures, so it
       doesn't leak into save_level() or the texture browser. the actual
       runtime skybox for the level will be set through a separate path. */
    set_preview_skybox() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
            const file = input.files[0];
            if (!file) return;
            // Three's Texture.flipY is IGNORED when the source is an
            // ImageBitmap — orientation has to be baked in at bitmap creation.
            // 'flipY' here pre-flips the rows so the equirect shader samples
            // image-top (sky) when looking up.
            const bitmap = await createImageBitmap(file, { imageOrientation: 'flipY' });

            const texture = new THREE.Texture(bitmap);
            texture.mapping = THREE.EquirectangularReflectionMapping;
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.needsUpdate = true;

            // free the previous preview skybox if any — it's not referenced
            // anywhere else so this is safe
            if (this.preview_skybox) this.preview_skybox.dispose();
            this.preview_skybox = texture;
            this.scene.background = texture;
        };
        input.click();
    }

}

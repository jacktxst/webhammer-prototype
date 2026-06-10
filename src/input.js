/*

    event handlers and keybinds

    player movement, camera movement, keybinds, 

    this input object is stimulated by the mobile joystick as if it were desktop input (???)

*/

const X = 0;
const Y = 1;
const Z = 2;

import { clamp } from './helpers.js';
import core from './webhammer.js';

export default {
    keybinds : { // KeyX        :{down:(e)=>{},up:(e)=>{}},

        KeyX        :{
            down:(e)=>{core.grid.set_axis(X)},
            up:(e)=>{core.grid.set_to_default()}
        },
        
        KeyY        :{
            down:(e)=>{core.grid.set_axis(Y)},
            up:(e)=>{core.grid.set_to_default()}
        },

        KeyZ        :{
            down:(e)=>{core.grid.set_axis(Z)},
            up:(e)=>{core.grid.set_to_default()}
        },

        KeyW        :{
            down:(e)=>{core.input_vec[Y]-=1;core.update_movement();},
            up:(e)=>{core.input_vec[Y]+=1;core.update_movement();} 
        },

        KeyA        :{
            down:(e)=>{core.input_vec[X]-=1;core.update_movement();},
            up:(e)=>{core.input_vec[X]+=1;core.update_movement();} 
        },

        KeyS        :{
            down:(e)=>{core.input_vec[Y]+=1;core.update_movement();},
            up:(e)=>{core.input_vec[Y]-=1;core.update_movement();} 
        },

        KeyD        :{
            down:(e)=>{core.input_vec[X]+=1;core.update_movement();},
            up:(e)=>{core.input_vec[X]-=1;core.update_movement();} 
        },

        Space       :{
            down:(e)=>{
                e.preventDefault();
                core.velocity[Y]=1;
            },
            up:(e)=>{
                core.velocity[Y]=0;
            }
        },

        ShiftLeft   :{
            down:(e)=>{
                core.velocity[Y]=-1;
            },
            up:(e)=>{
                core.velocity[Y]=0;
            }
        },

        BracketLeft :{
            down:(e)=>{core.grid.shrink_cells()},
            up:(e)=>{}
        },

        BracketRight:{
            down:(e)=>{core.grid.grow_cells()},
            up:(e)=>{}
        },

        ArrowLeft:{
            down:(e)=>{core.look_vel.y += 1; core.look_vel.y = clamp(core.look_vel.y, -1, 1);},
            up:(e)=>{core.look_vel.y -= 1; core.look_vel.y = clamp(core.look_vel.y, -1, 1);}
        },

        ArrowRight:{
            down:(e)=>{core.look_vel.y -= 1; core.look_vel.y = clamp(core.look_vel.y, -1, 1);},
            up:(e)=>{core.look_vel.y += 1; core.look_vel.y = clamp(core.look_vel.y, -1, 1);}
        },

        ArrowUp:{
            down:(e)=>{core.look_vel.x += 1; core.look_vel.x = clamp(core.look_vel.x, -1, 1);},
            up:(e)=>{core.look_vel.x -= 1; core.look_vel.x = clamp(core.look_vel.x, -1, 1);}
        },

        ArrowDown:{
            down:(e)=>{core.look_vel.x -= 1; core.look_vel.x = clamp(core.look_vel.x, -1, 1);},
            up:(e)=>{core.look_vel.x += 1; core.look_vel.x = clamp(core.look_vel.x, -1, 1);}
        }
    },

    init() {
        /* event listeners */
        this.touch_div = document.getElementById('look-area');
        this.touch_div.addEventListener("mousedown", (e) => this.on_click_or_tap(e));
        window.addEventListener("mousemove", (e) => this.on_mousemove(e));
        this.touch_div.addEventListener("mouseup", (e) => this.on_click_or_tap_release(e));
        window.addEventListener("keydown", (e) => {this.on_keydown(e);});
        window.addEventListener("keyup", (e) => {this.on_keyup(e);});
        window.addEventListener('resize', this.on_resize);
        window.visualViewport?.addEventListener('resize', () => {this.on_resize();});
        window.addEventListener('orientationchange', this.on_resize);
    },

    on_click_or_tap(e) {
        if(core.tool) core.tools[core.tool].on_start?.(e)
    },

    on_resize() {
        const viewport = window.visualViewport;
        const width  = viewport ? viewport.width  : window.innerWidth;
        const height = viewport ? viewport.height : window.innerHeight;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        core.renderer.domElement.style.width  = width + 'px';
        core.renderer.domElement.style.height = height + 'px';
        core.renderer.setPixelRatio(dpr);
        core.renderer.setSize(width, height, false);
        core.camera.aspect = width / height;
        core.camera.updateProjectionMatrix();
    },

    on_mousemove(e) {
        this.look_sens = 0.002;
        if (this.pointer_locked) {
            core.v_persp.rotation.y -= e.movementX * this.look_sens;
            core.v_persp.rotation.x -= e.movementY * this.look_sens;
            core.v_ortho.rotation.y -= e.movementX * this.look_sens;
            core.v_ortho.rotation.x -= e.movementY * this.look_sens;
            core.v_persp.rotation.x = clamp(core.v_persp.rotation.x, -Math.PI / 2, Math.PI / 2);
            core.v_ortho.rotation.x = clamp(core.v_ortho.rotation.x, -Math.PI / 2, Math.PI / 2);
            core.update_movement();
        }
        if(core.tool) core.tools[core.tool].on_move?.(e);
    },

    on_click_or_tap_release(e) {
        if(core.tool) core.tools[core.tool].on_end?.(e);
    },

    on_keydown(e) {
        let binding_exists = Object.keys(this.keybinds).includes(e.code);
        if( binding_exists ) {
            this.keybinds[e.code].down(e);
        }
    },

    on_keyup(e) {
        let binding_exists = Object.keys(this.keybinds).includes(e.code);
        if( binding_exists ) {
            this.keybinds[e.code].up(e);
        }
    },

}
// mobile_controls.js

import core from './webhammer.js';

let joystick = {
    knobX: 50,
    knobY: 50,
    startX: 0,
    startY: 0,
    maxRadius: 50,
    dir: { x: 0, y: 0 }, // normalized direction vector
    joystick: document.getElementById('joystick'),
    joystick_knob: document.getElementById('joystick_knob'),
}
joystick.joystick_knob.style.setProperty('left',joystick.knobX + 'px');
joystick.joystick_knob.style.setProperty('top',joystick.knobY + 'px');

joystick.joystick.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    joystick.startX = touch.clientX;
    joystick.startY = touch.clientY;

    joystick.joystick_knob.style.setProperty('left',joystick.knobX + 'px');
    joystick.joystick_knob.style.setProperty('top',joystick.knobY + 'px');


},);
joystick.joystick.addEventListener("touchmove", (e) => {
    const touch = e.touches[0];
    let dx = touch.clientX - joystick.startX;
    let dy = touch.clientY - joystick.startY;

    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > joystick.maxRadius) {
        dx = (dx / dist) * joystick.maxRadius;
        dy = (dy / dist) * joystick.maxRadius;
    }

    joystick.knobX = 50 + dx;
    joystick.knobY = 50 + dy;
    joystick.joystick_knob.style.setProperty('left',joystick.knobX + 'px');
    joystick.joystick_knob.style.setProperty('top',joystick.knobY + 'px');
    joystick.dir.x = dx / joystick.maxRadius;
    joystick.dir.y = dy / joystick.maxRadius;

    core.input_vec = [joystick.dir.x, joystick.dir.y];
    core.update_movement();
},);
joystick.joystick.addEventListener("touchend", (e) => {
    joystick.knobX = 50;
    joystick.knobY = 50;
    joystick.joystick_knob.style.setProperty('left',joystick.knobX + 'px');
    joystick.joystick_knob.style.setProperty('top',joystick.knobY + 'px');
    joystick.dir = { x: 0, y: 0 };
    core.input_vec = [joystick.dir.x, joystick.dir.y];
    core.update_movement();
},);

let look_area = {
    prevX: 0,
    prevY: 0,
    sensitivity: 1,
    init(){
        this.div = document.getElementById('look-area');
        this.div.addEventListener('touchstart', (e)=>{
            e.preventDefault();
            const touch = e.touches[0];
            this.prevX = touch.clientX;
            this.prevY = touch.clientY;
            core.input.on_click_or_tap({clientX: touch.clientX, clientY: touch.clientY, preventDefault(){}});
        });
        this.div.addEventListener('touchmove', (e)=>{
            e.preventDefault();
            const touch = e.touches[0];
            const dx = touch.clientX - this.prevX;
            const dy = touch.clientY - this.prevY;

            this.prevX = touch.clientX;
            this.prevY = touch.clientY;
            core.input.on_mousemove({clientX: touch.clientX, clientY: touch.clientY, movementX: dx, movementY: dy, preventDefault(){}});
        });
        this.div.addEventListener('touchend', (e)=>{
            e.preventDefault();
            const touch = e.touches[0];
            core.input.on_click_or_tap_release({preventDefault(){}});
        });

    }
}
look_area.init();

document.getElementById('jump').addEventListener('pointerdown', (e)=>{
    core.input.keybinds.Space.down(e)
    e.preventDefault()
})
document.getElementById('jump').addEventListener('pointerup', (e)=>{
    core.input.keybinds.Space.up(e)
    e.preventDefault()
})
document.getElementById('crouch').addEventListener('pointerdown', (e)=>{
    core.input.keybinds.ShiftLeft.down(e)
    e.preventDefault()
})
document.getElementById('crouch').addEventListener('pointerup', (e)=>{
    core.input.keybinds.ShiftLeft.up(e)
    e.preventDefault()
})


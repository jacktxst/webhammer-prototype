<script>

import { toRaw } from "vue";
import core from "../webhammer.js";

export default {
  name: "Toolbar",
  data() {
    return { core }
  },
  methods: {
    set_tool(name) {
      const cur = this.core.tool;
      // toggle off if the user clicks the currently active tool
      const next = (cur === name) ? null : name;
      // toRaw() unwraps the reactive proxy so `this` inside init()/cleanup()
      // is the original tool — otherwise references like this.handle_group
      // come back proxy-wrapped, and adding a proxied THREE.Object3D to the
      // scene trips the modelViewMatrix invariant in the renderer
      if (cur)  toRaw(this.core.tools[cur]).cleanup?.();
      this.core.tool = next;
      if (next) toRaw(this.core.tools[next]).init?.();
    }
  }
}

</script>



<template>

  <div class="toolbar">
    <button
      v-for="(tool, name) in core.tools"
      :key="name"
      class="tool-btn"
      :class="{ active: core.tool === name }"
      :title="name"
      @click="set_tool(name)"
    >
      <img v-if="tool.icon" :src="tool.icon" :alt="name" />
      <span v-else class="fallback">{{ name[0] }}</span>
    </button>
  </div>

</template>



<style scoped>

.toolbar {
  position: fixed;
  bottom: 12px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 4px;
  background: black;
  padding: 4px;
  border: 1px solid #aaa;
  border-radius: 4px;
  /* sit above #look-area (z-index: 10) so clicks land on buttons, not the look surface */
  z-index: 50;
}

.tool-btn {
  width: 32px;
  height: 32px;
  padding: 0;
  margin: 0;
  background: black;
  border: 1px solid #444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
}

.tool-btn.active {
  border-color: white;
  background: #222;
}

.tool-btn:hover {
  border-color: #aaa;
  outline: none;
}

.tool-btn img {
  width: 24px;
  height: 24px;
  display: block;
  pointer-events: none;
}

.fallback {
  color: white;
  font-size: 14px;
}

</style>

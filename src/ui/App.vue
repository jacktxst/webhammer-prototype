<script>

import EditorMenus from "./EditorMenus.vue";
import core from "../webhammer.js";

export default {

  name: 'App',

  components: {
    EditorMenus,
  },

  data() {
    return {
      core,
      show_tools : false,
    }
  },

  methods: {
    requestPointerLock() {
      const el = this.$refs.ptrLockBtn;
      if (!el) return;
      el.requestPointerLock();
    },
    onPointerLockChange() {
      this.core.input.pointer_locked = document.pointerLockElement === this.$refs.ptrLockBtn;
    }
  },

  mounted() {
    document.addEventListener(
        'pointerlockchange',
        this.onPointerLockChange
    );
  },

  beforeUnmount() {
    document.removeEventListener(
        'pointerlockchange',
        this.onPointerLockChange
    );
  }

}

</script>



<template>

  <button
    ref="ptrLockBtn"
    id="ptr-lock"
    @click="requestPointerLock"
  >
    lock pointer (pc only)
  </button>

  <button
    @click="show_tools = !show_tools"
    id="toggle-dev-tools"
  >
    dev tools
  </button>

  <EditorMenus v-if="show_tools"/>

</template>



<style>

  #toggle-dev-tools {
    position: fixed;
    top: 0;
    right: 0;
  }

  #ptr-lock {
    position: fixed;
    top: 0;
    left: 0;
  }

</style>


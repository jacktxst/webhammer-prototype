<script>

import DraggablePanel from "./DraggablePanel.vue";
import core from "../webhammer.js";

export default {
  name: "ActionPanel" ,
  components: {DraggablePanel},
  data() {
    return {
      core
    }
  }
}

</script>



<template>

  <DraggablePanel title="project">

    <button @click="core.new_level()">
      erase all
    </button>

    <button @click="core.load_level()">
      load
    </button>

    <button @click="core.save_level()">
      save
    </button>

    <button @click="core.set_preview_skybox()">
      set preview skybox
    </button>

    <button @click="core.input.keybinds.BracketLeft.down({})">
      grid -
    </button>

    <button @click="core.input.keybinds.BracketRight.down({})">
      grid +
    </button>

    <button @click="core.grid.set_default_axis(0)">
      x grid
    </button>

    <button @click="core.grid.set_default_axis(1)">
      y grid
    </button>

    <button @click="core.grid.set_default_axis(2)">
      z grid
    </button>

  </DraggablePanel>

</template>



<style scoped>

</style>
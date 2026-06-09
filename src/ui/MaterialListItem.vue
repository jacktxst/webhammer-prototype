<script>

import core from "../webhammer.js";

export default {
  name: "MaterialListItem",
  props: {
    id: {type: Number, required: true}
  },
  data() {
    return {
      core, texid: 0,
    }
  }
}

</script>



<template>

  <div class="materialEditor">
    <h1>{{ id }}</h1>
    <button @click="
    core.current_material=id;
    if (core.tools.create_block.new_box) {
      core.tools.create_block.new_box.kx_material=id;
      core.tools.create_block.new_box.material = core.materials[id];
    }
    ">select this material</button>
    <button @click="core.materials.splice(id, 1)">-</button>
  </div>

</template>



<style scoped>

.materialEditor {
  text-align:center;
  align-content: center;
  background-color: black;
  outline: 5px solid white;
  padding: 15px;
  margin: 25px;
}

</style>
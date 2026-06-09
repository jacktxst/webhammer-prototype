<script>

import DraggablePanel from "./DraggablePanel.vue";
import MaterialListItem from "./MaterialListItem.vue";
import * as THREE from "three";
import core from "../webhammer.js";

export default {
  name: "MaterialPanel" ,
  computed: {
    THREE() {
      return THREE
    }
  },
  components: {MaterialListItem, DraggablePanel},
  data() {
    return {
      core
    }
  }
}

</script>



<template>

  <DraggablePanel title="Material Browser">
    Current Material: {{core.current_material}}<br>
    Texture ID: {{(core.materials[core.current_material]) ? core.materials[core.current_material].kx_texture : 0}}<br>

    <button @click="core.materials[core.current_material].kx_texture--; core.materials[core.current_material].map = core.textures[core.materials[core.current_material].kx_texture].texture; core.materials[core.current_material].needsUpdate = true">-</button>
    <button @click="core.materials[core.current_material].kx_texture++; core.materials[core.current_material].map = core.textures[core.materials[core.current_material].kx_texture].texture; core.materials[core.current_material].needsUpdate = true">+</button>
    <br>
    <div v-for="(mat, i) in core.materials" :key="i">
      <MaterialListItem :id="i" />
    </div>

    <button @click="core.materials.push((() => {let mat = new THREE.MeshBasicMaterial(); mat.kx_texture = 0; mat.map = core.textures[0].texture; return mat;})());">
      +
    </button>
  </DraggablePanel>

</template>



<style scoped>

</style>
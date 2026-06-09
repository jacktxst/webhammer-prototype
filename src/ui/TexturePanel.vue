<script>

import DraggablePanel from "./DraggablePanel.vue";
import TextureView from "./TextureView.vue";
import * as THREE from "three";
import core from "../webhammer.js";

export default {
  name: "TexturePanel" ,
  components: {TextureView, DraggablePanel},
  data() {
    return {
      core
    }
  }
}

</script>



<template>

  <DraggablePanel title="Texture Browser">
    <div v-for="texture in core.textures">
      <TextureView :bitmap="texture"></TextureView>
    </div>
  </DraggablePanel>

</template>



<style scoped>

</style>
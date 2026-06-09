<script>
import { toRaw } from "vue";
import DraggablePanel from "./DraggablePanel.vue";
import core from "../webhammer.js";
import ValueModifier from "./ValueModifier.vue"

export default {
  name: "InspectPanel" ,
  components: {DraggablePanel, ValueModifier},
  data() {
    return {
      core
    }
  },
  methods: {
    regenerate() {
      toRaw(core.tools.select_brush.selected_brush)._generateMesh();
    }
  }
}
</script>

<template>
  <DraggablePanel title="inspect">

    <div v-if="core.tools.select_brush.selected_brush">

      <div v-for="plane in core.tools.select_brush.selected_brush._planes" style="max-width: 100px; display:flex;flex-direction:row;">

        nx
        <ValueModifier 
          :target="plane.normal" 
          target_key="x" 
          @on_change="regenerate" />
        ny
        <ValueModifier 
          :target="plane.normal" 
            target_key="y"
            @on_change="regenerate" />
        nz
        <ValueModifier 
          :target="plane.normal" 
            target_key="z"
            @on_change="regenerate" />
        d
        <ValueModifier 
          :target="plane" 
          target_key="distance"
          @on_change="regenerate"/>
        mat
        <ValueModifier 
          :target="plane" 
          target_key="material_id"
          @on_change="regenerate"/>
      </div>

    </div>
    <div v-else>
      no brush selected
    </div>

  </DraggablePanel>
</template>

<style scoped>

</style>
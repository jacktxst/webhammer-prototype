<script>
import ToolPanel from "./ToolPanel.vue";
import MaterialPanel from "./MaterialPanel.vue";
import ActionPanel from "./ActionPanel.vue";
import TexturePanel from "./TexturePanel.vue";
import InspectPanel from "./InspectPanel.vue";


export default {
  name: "EditorMenus" ,
  components: {TexturePanel, ActionPanel, MaterialPanel, ToolPanel, InspectPanel}
}
</script>

<template>
  <ToolPanel :initialX="0"></ToolPanel>
  <ActionPanel :initialX="200"></ActionPanel>
  <MaterialPanel :initialX="400"></MaterialPanel>
  <TexturePanel :initialX="600"> </TexturePanel>
  <InspectPanel :initialX="800"> </InspectPanel>
</template>

<style scoped>

</style>
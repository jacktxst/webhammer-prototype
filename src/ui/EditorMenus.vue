<script>
import ToolSettingsPanel from "./ToolSettingsPanel.vue";
import MaterialPanel from "./MaterialPanel.vue";
import ActionPanel from "./ActionPanel.vue";
import TexturePanel from "./TexturePanel.vue";
import InspectPanel from "./InspectPanel.vue";
import Toolbar from "./Toolbar.vue";


export default {
  name: "EditorMenus" ,
  components: { TexturePanel, ActionPanel, MaterialPanel, ToolSettingsPanel, InspectPanel, Toolbar }
}
</script>

<template>
  <ToolSettingsPanel :initialX="0"></ToolSettingsPanel>
  <ActionPanel :initialX="200"></ActionPanel>
  <MaterialPanel :initialX="400"></MaterialPanel>
  <TexturePanel :initialX="600"> </TexturePanel>
  <InspectPanel :initialX="800"> </InspectPanel>
  <Toolbar />
</template>

<style scoped>

</style>

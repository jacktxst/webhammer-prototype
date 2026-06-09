<script>

import DraggablePanel from "./DraggablePanel.vue";
import core from "../webhammer.js";
export default {
  name: "ToolPanel" ,
  components: {DraggablePanel},
  data() {
    return {
      tool_vue : core.tool,
      core
    }
  },
  methods: {
    set_tool(tool) {
      if(core.tool) core.tools[core.tool].cleanup?.();
      core.tool=tool;
      this.tool_vue = tool;
      core.tools[core.tool]?.init?.();
    }
  },
}

</script>



<template>

  <DraggablePanel title="Tool Panel">
    current tool: <br> <p style="outline:3px solid white;">{{this.tool_vue ? this.tool_vue + " tool" : "none" }}</p>
    <div class="tool-list">
      <div>
        <button @click="set_tool(null)">none</button>
      </div>
      <div v-for="tool in Object.keys(core.tools)">
        <button @click="set_tool(tool)">{{tool}}</button>
      </div>
    </div>
  </DraggablePanel>

</template>



<style scoped>

 .tool-list {
   display: flex;
   flex-wrap: wrap;
   max-width: 300px;
 }
 
</style>
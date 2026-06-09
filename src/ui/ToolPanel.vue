<script>

import DraggablePanel from "./DraggablePanel.vue";
import core from "../webhammer.js";

export default {
  name: "ToolPanel",
  components: { DraggablePanel },
  data() {
    return { core }
  },
  methods: {
    set_tool(tool) {
      // run cleanup on the outgoing tool (this.core goes through the reactive
      // proxy so reading current tool is fine)
      const cur = this.core.tool;
      if (cur) this.core.tools[cur].cleanup?.();
      this.core.tool = tool;
      if (tool) this.core.tools[tool]?.init?.();
    }
  }
}

</script>



<template>

  <DraggablePanel title="Tools">

    <div class="cols">

      <div class="list">
        <div
          class="row"
          :class="{ selected: core.tool === null }"
          @click="set_tool(null)"
        >
          none
        </div>
        <div
          v-for="tool in Object.keys(core.tools)"
          :key="tool"
          class="row"
          :class="{ selected: core.tool === tool }"
          @click="set_tool(tool)"
        >
          {{ tool }}
        </div>
      </div>

      <div class="editor">
        <div class="label">{{ core.tool ? core.tool : 'no tool' }}</div>
        <!-- tool settings (numeric entry, checkboxes, etc.) will live here -->
        <div class="hint">tool settings go here</div>
      </div>

    </div>

  </DraggablePanel>

</template>



<style scoped>

.cols {
  display: flex;
  flex-direction: row;
  gap: 6px;
  font-size: 11px;
  align-items: stretch;
}

.list {
  flex: 0 0 90px;
  max-height: 130px;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  border-right: 1px solid #aaa;
  padding-right: 4px;
}

.row {
  padding: 3px 4px;
  cursor: pointer;
  background: black;
  color: white;
  border: 1px solid #444;
  white-space: nowrap;
}

.row.selected {
  background: white;
  color: black;
  border-color: white;
}

.row:hover {
  border-color: #aaa;
}

.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.label {
  font-weight: bold;
}

.hint {
  font-size: 10px;
  color: #888;
  font-style: italic;
}

</style>

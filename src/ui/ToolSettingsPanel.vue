<script>

import DraggablePanel from "./DraggablePanel.vue";
import core from "../webhammer.js";

export default {
  name: "ToolSettingsPanel",
  components: { DraggablePanel },
  data() {
    return { core }
  },
  computed: {
    // null when no tool active. computed off the reactive `this.core`
    // so changes to core.tool refresh the template.
    active_tool() {
      return this.core.tool ? this.core.tools[this.core.tool] : null;
    }
  }
}

</script>



<template>

  <DraggablePanel title="tool">
    <div class="settings">
      <div class="label">{{ core.tool || 'no tool' }}</div>
      <div class="hint">description: {{ active_tool?.description || 'no description' }}</div>

      <!-- only render the param list when the active tool actually has one;
           otherwise Object.keys(undefined) throws -->
      <template v-if="active_tool && active_tool.params">
        <div v-for="(param, key) in active_tool.params" :key="key" class="param-row">
          <label v-if="param.type === 'toggle'">
            <input type="checkbox" v-model="param.value" />
            {{ key }}
          </label>
          <fieldset v-else-if="param.type === 'radiobuttons'" class="radio-group">
            <legend>{{ key }}</legend>
            <label v-for="option in param.options" :key="option" class="radio-option">
              <input
                type="radio"
                :name="key"
                :value="option"
                v-model="param.value"
              />
              {{ option }}
            </label>
          </fieldset>
          <span v-else class="hint">{{ key }} (unsupported: {{ param.type }})</span>
        </div>
      </template>
    </div>
  </DraggablePanel>

</template>



<style scoped>

.settings {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  color: white;
}

.label {
  font-weight: bold;
}

.hint {
  font-size: 10px;
  color: #888;
  font-style: italic;
}

.param-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.param-row label {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.param-row input[type="checkbox"] {
  margin: 0;
}

.radio-group {
  border: 1px solid #444;
  padding: 4px 6px;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radio-group legend {
  padding: 0 4px;
  font-size: 10px;
  color: #aaa;
}

.radio-option {
  display: flex;
  align-items: center;
  gap: 4px;
  cursor: pointer;
}

.radio-option input[type="radio"] {
  margin: 0;
}

</style>

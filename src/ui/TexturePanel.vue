<script>

import DraggablePanel from "./DraggablePanel.vue";
import TextureView from "./TextureView.vue";
import core from "../webhammer.js";

export default {
  name: "TexturePanel",
  components: { TextureView, DraggablePanel },
  data() {
    return { core, selected: 0 }
  },
  computed: {
    current() {
      return this.core.textures[this.selected];
    }
  },
  methods: {
    select(i) {
      this.selected = i;
    }
  }
}

</script>



<template>

  <DraggablePanel title="Textures">

    <div class="cols">

      <div class="list">
        <div
          v-for="(tex, i) in core.textures"
          :key="i"
          class="row"
          :class="{ selected: selected === i }"
          @click="select(i)"
        >
          Texture {{ i }}
        </div>
        <div v-if="!core.textures.length" class="empty">no textures</div>
      </div>

      <div class="editor">
        <template v-if="current">
          <TextureView :bitmap="current" :size="100" />
          <div class="res">
            {{ current.bitmap.width }} × {{ current.bitmap.height }}
          </div>
        </template>
        <div v-else class="empty">no texture</div>
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
  flex: 0 0 70px;
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
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.res {
  font-size: 10px;
  color: #ccc;
}

.empty {
  color: #888;
  font-style: italic;
}

</style>

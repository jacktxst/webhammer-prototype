<script>

import DraggablePanel from "./DraggablePanel.vue";
import * as THREE from "three";
import core from "../webhammer.js";

export default {
  name: "MaterialPanel",
  components: { DraggablePanel },
  data() {
    return { core }
  },
  methods: {
    select(i) {
      this.core.current_material = i;
      // keep an in-progress block preview in sync with the new material
      const np = this.core.tools.create_block.new_box;
      if (np) {
        np.kx_material = i;
        np.material = this.core.materials[i];
      }
    },
    add_material() {
      const mat = new THREE.MeshBasicMaterial();
      mat.kx_texture = 0;
      if (this.core.textures[0]) mat.map = this.core.textures[0].texture;
      this.core.materials.push(mat);
      this.core.current_material = this.core.materials.length - 1;
    },
    remove_current() {
      if (this.core.materials.length === 0) return;
      this.core.materials.splice(this.core.current_material, 1);
      if (this.core.current_material >= this.core.materials.length) {
        this.core.current_material = Math.max(0, this.core.materials.length - 1);
      }
    },
    bump_texture(delta) {
      const mat = this.core.materials[this.core.current_material];
      if (!mat) return;
      const max = Math.max(0, this.core.textures.length - 1);
      mat.kx_texture = Math.max(0, Math.min(max, (mat.kx_texture ?? 0) + delta));
      if (this.core.textures[mat.kx_texture]) {
        mat.map = this.core.textures[mat.kx_texture].texture;
        mat.needsUpdate = true;
      }
    }
  }
}

</script>



<template>

  <DraggablePanel title="Materials">

    <div class="cols">

      <div class="list">
        <div
          v-for="(mat, i) in core.materials"
          :key="i"
          class="row"
          :class="{ selected: core.current_material === i }"
          @click="select(i)"
        >
          Material {{ i }}
        </div>
        <button class="add-btn" @click="add_material">+ new</button>
      </div>

      <div class="editor">
        <template v-if="core.materials[core.current_material]">
          <div class="label">Material {{ core.current_material }}</div>
          <div class="tex-row">
            <button @click="bump_texture(-1)">-</button>
            <span>tex {{ core.materials[core.current_material].kx_texture ?? 0 }}</span>
            <button @click="bump_texture(+1)">+</button>
          </div>
          <button class="delete-btn" @click="remove_current">delete</button>
        </template>
        <div v-else class="empty">no material</div>
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
  flex: 0 0 80px;
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

.tex-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.empty {
  color: #888;
  font-style: italic;
}

/* compact button overrides — global button is padding:10px margin:8px */
.cols button {
  padding: 2px 6px;
  margin: 0;
  font-size: 11px;
}
.cols button:hover {
  outline: 1px solid white;
}
.add-btn {
  margin-top: 4px !important;
}
.delete-btn {
  margin-top: auto !important;
}

</style>

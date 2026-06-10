<script>

import DraggablePanel from "./DraggablePanel.vue";
import TextureView from "./TextureView.vue";
import * as THREE from "three";
import core from "../webhammer.js";

export default {
  name: "MaterialPanel",
  components: { DraggablePanel, TextureView },
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
      // THREE.Material already has a .name field — give it a sensible default
      mat.name = 'Material ' + this.core.materials.length;
      this.core.materials.push(mat);
      this.core.current_material = this.core.materials.length - 1;
    },

    // create one material per texture, each named after its texture and
    // mapped to it. textures whose name already has a matching material
    // are skipped so clicking twice doesn't pile up duplicates.
    match_textures() {
      const existing = new Set(this.core.materials.map(m => m.name));
      let first_new = -1;
      for (let i = 0; i < this.core.textures.length; i++) {
        const entry = this.core.textures[i];
        const name = entry.name ?? ('Material ' + this.core.materials.length);
        if (existing.has(name)) continue;
        const mat = new THREE.MeshBasicMaterial();
        mat.kx_texture = i;
        mat.map = entry.texture;
        mat.name = name;
        if (first_new === -1) first_new = this.core.materials.length;
        this.core.materials.push(mat);
        existing.add(name);
      }
      if (first_new >= 0) this.core.current_material = first_new;
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

  <DraggablePanel title="material">

    <div class="panel-cols">

      <div class="panel-list">
        <div
          v-for="(mat, i) in core.materials"
          :key="i"
          class="panel-row"
          :class="{ selected: core.current_material === i }"
          :title="i + ': ' + (mat.name || ('Material ' + i))"
          @click="select(i)"
        >
          <TextureView
            v-if="core.textures[mat.kx_texture]"
            class="panel-thumb"
            :bitmap="core.textures[mat.kx_texture]"
            :size="16"
          />
          <div v-else class="panel-thumb" style="width:16px;height:16px"></div>
          <span class="panel-row-text">{{ i }}: {{ mat.name || ('Material ' + i) }}</span>
        </div>
        <button class="add-btn" @click="add_material">+ new</button>
        <button class="add-btn" @click="match_textures" title="one material per texture">+ set</button>
      </div>

      <div class="panel-editor">
        <template v-if="core.materials[core.current_material]">
          <input
            class="panel-name-input"
            type="text"
            v-model="core.materials[core.current_material].name"
            :placeholder="'Material ' + core.current_material"
          />
          <div class="tex-row">
            <button @click="bump_texture(-1)">-</button>
            <span>tex {{ core.materials[core.current_material].kx_texture ?? 0 }}</span>
            <button @click="bump_texture(+1)">+</button>
          </div>
          <button class="delete-btn" @click="remove_current">delete</button>
        </template>
        <div v-else class="panel-empty">no material</div>
      </div>

    </div>

  </DraggablePanel>

</template>



<style scoped>

/* layout / row / editor / name-input / button compactness all live in style.css
   under .panel-cols, .panel-list, .panel-row, .panel-editor, .panel-name-input */

.tex-row {
  display: flex;
  align-items: center;
  gap: 4px;
}

.add-btn {
  margin-top: 4px !important;
}
.delete-btn {
  margin-top: auto !important;
}

</style>

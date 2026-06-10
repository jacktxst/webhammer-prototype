<script>

import DraggablePanel from "./DraggablePanel.vue";
import TextureView from "./TextureView.vue";
import * as THREE from "three";
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
    },

    // build a THREE.Texture wrapped the same way core.create_texture() does
    make_texture(bitmap) {
      const texture = new THREE.Texture(bitmap);
      texture.anisotropy = 4;
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.needsUpdate = true;
      return texture;
    },

    // replace the contents of the currently-selected texture slot. all
    // materials still pointing at this index get their .map swung over.
    replace_texture() {
      if (!this.current) return;
      const slot = this.selected;
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async () => {
        const file = input.files[0];
        if (!file) return;
        const bitmap = await createImageBitmap(file);
        const texture = this.make_texture(bitmap);

        // free the old GPU resource — but preserve the user's name on the slot
        const old = this.core.textures[slot];
        const old_name = old?.name;
        if (old?.texture) old.texture.dispose();

        // swap the entry — array index assignment fires Vue reactivity
        this.core.textures[slot] = { texture, bitmap, name: old_name };

        // re-point any materials that used this slot
        for (const mat of this.core.materials) {
          if (mat.kx_texture === slot) {
            mat.map = texture;
            mat.needsUpdate = true;
          }
        }
      };
      input.click();
    },

    // import a batch of textures: the user can pick multiple images or a single
    // .zip whose PNGs we'll unpack. each texture is named after its filename
    // with the extension stripped, so a folder of brick_01.png / wood.png lands
    // as the materials list "brick_01" / "wood" instead of "Texture 0" "Texture 1".
    import_set() {
      const input = document.createElement('input');
      input.type = 'file';
      input.multiple = true;
      input.accept = 'image/*,.zip';
      input.onchange = async () => {
        const files = Array.from(input.files);
        for (const file of files) {
          if (/\.zip$/i.test(file.name)) {
            await this.import_zip(file);
          } else if (file.type.startsWith('image/')) {
            const bitmap = await createImageBitmap(file);
            const name = file.name.replace(/\.[^/.]+$/, '');
            this.core.create_texture(bitmap, name);
          }
        }
      };
      input.click();
    },

    // pull every image entry out of a zip in alpha order
    async import_zip(file) {
      const buf = await file.arrayBuffer();
      const zip = await JSZip.loadAsync(buf);
      const entries = Object.values(zip.files).filter(
        f => !f.dir && /\.(png|jpe?g|webp|gif|bmp)$/i.test(f.name)
      );
      entries.sort((a, b) => a.name.localeCompare(b.name));
      for (const entry of entries) {
        const uint8 = await entry.async('uint8array');
        const blob = new Blob([uint8]);
        const img = await new Promise((res, rej) => {
          const i = new Image();
          i.onload = () => res(i);
          i.onerror = rej;
          i.src = URL.createObjectURL(blob);
        });
        URL.revokeObjectURL(img.src);
        const bitmap = await createImageBitmap(img);
        // strip directory prefix and extension, so "wood/oak.png" -> "oak"
        const basename = entry.name.split('/').pop();
        const name = basename.replace(/\.[^/.]+$/, '');
        this.core.create_texture(bitmap, name);
      }
    },

    // remove the currently-selected texture and renumber the rest.
    // - every material with kx_texture > selected drops by one
    // - materials that pointed at the removed slot fall back to texture 0
    remove_texture() {
      if (this.core.textures.length === 0) return;
      const removed = this.selected;
      const dead = this.core.textures[removed];
      if (dead?.texture) dead.texture.dispose();

      this.core.textures.splice(removed, 1);

      for (const mat of this.core.materials) {
        if (mat.kx_texture > removed) {
          mat.kx_texture -= 1;
        } else if (mat.kx_texture === removed) {
          mat.kx_texture = 0;
        }
        const entry = this.core.textures[mat.kx_texture];
        mat.map = entry ? entry.texture : null;
        mat.needsUpdate = true;
      }

      // keep the selection valid for next render
      if (this.selected >= this.core.textures.length) {
        this.selected = Math.max(0, this.core.textures.length - 1);
      }
    }
  }
}

</script>



<template>

  <DraggablePanel title="texture">

    <div class="panel-cols">

      <div class="panel-list">
        <div
          v-for="(tex, i) in core.textures"
          :key="i"
          class="panel-row"
          :class="{ selected: selected === i }"
          :title="i + ': ' + (tex.name || ('Texture ' + i))"
          @click="select(i)"
        >
          <TextureView class="panel-thumb" :bitmap="tex" :size="16" />
          <span class="panel-row-text">{{ i }}: {{ tex.name || ('Texture ' + i) }}</span>
        </div>
        <div v-if="!core.textures.length" class="panel-empty">no textures</div>
        <button class="add-btn" @click="core.import_texture()">+ new</button>
        <button class="add-btn" @click="import_set">+ set</button>
      </div>

      <div class="panel-editor centered">
        <template v-if="current">
          <input
            class="panel-name-input"
            type="text"
            v-model="current.name"
            :placeholder="'Texture ' + selected"
          />
          <TextureView :bitmap="current" :size="100" />
          <div class="res">
            {{ current.bitmap.width }} × {{ current.bitmap.height }}
          </div>
          <div class="actions">
            <button @click="replace_texture">replace</button>
            <button @click="remove_texture">remove</button>
          </div>
        </template>
        <div v-else class="panel-empty">no texture</div>
      </div>

    </div>

  </DraggablePanel>

</template>



<style scoped>

/* layout / row / editor / name-input / button compactness all live in style.css
   under .panel-cols, .panel-list, .panel-row, .panel-editor, .panel-name-input */

/* center the texture preview inside the editor — texture-panel-specific tweak */
.panel-editor.centered {
  align-items: center;
}

.res {
  font-size: 10px;
  color: #ccc;
}

.add-btn {
  margin-top: 4px !important;
}

.actions {
  display: flex;
  gap: 4px;
  margin-top: 2px;
}

/* actions buttons are slightly smaller than the generic .panel-cols button */
.actions button {
  font-size: 10px;
}

</style>

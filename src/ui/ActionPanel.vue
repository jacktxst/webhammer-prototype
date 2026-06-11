<script>

import DraggablePanel from "./DraggablePanel.vue";
import ValueModifier from "./ValueModifier.vue";
import core from "../webhammer.js";

export default {
  name: "ActionPanel" ,
  components: {DraggablePanel, ValueModifier},
  data() {
    return {
      core
    }
  }
}

</script>



<template>

  <DraggablePanel title="project">

    <button @click="core.new_level()">
      erase all
    </button>

    <button @click="core.load_level()">
      load
    </button>

    <button @click="core.save_level()">
      save
    </button>

    <button @click="core.set_preview_skybox()">
      set preview skybox
    </button>

    <button @click="core.input.keybinds.BracketLeft.down({})">
      grid -
    </button>

    <button @click="core.input.keybinds.BracketRight.down({})">
      grid +
    </button>

    <button @click="core.grid.set_default_axis(0)">
      x grid
    </button>

    <button @click="core.grid.set_default_axis(1)">
      y grid
    </button>

    <button @click="core.grid.set_default_axis(2)">
      z grid
    </button>

    <button @click="core.noclip = !core.noclip">
      toggle noclip
    </button>

    <table v-if="core.ambient_light && core.directional_light" class="lights">
      <tbody>
        <tr>
          <td class="row-label">ambient</td>
          <td class="row-sub">int</td>
          <td colspan="3"><ValueModifier :target="core.ambient_light" target_key="intensity" :min="0" :width="44" /></td>
        </tr>
        <tr>
          <td></td>
          <td class="row-sub">rgb</td>
          <td colspan="3">
            <input
              type="color"
              class="color-picker"
              :value="'#' + core.ambient_light.color.getHexString()"
              @input="e => core.ambient_light.color.set(e.target.value)"
            />
          </td>
        </tr>
        <tr>
          <td class="row-label">directional</td>
          <td class="row-sub">int</td>
          <td colspan="3"><ValueModifier :target="core.directional_light" target_key="intensity" :min="0" :width="44" /></td>
        </tr>
        <tr>
          <td></td>
          <td class="row-sub">rgb</td>
          <td colspan="3">
            <input
              type="color"
              class="color-picker"
              :value="'#' + core.directional_light.color.getHexString()"
              @input="e => core.directional_light.color.set(e.target.value)"
            />
          </td>
        </tr>
        <tr>
          <td></td>
          <td class="row-sub">dir</td>
          <td><ValueModifier :target="core.directional_light.position" target_key="x" :width="32" /></td>
          <td><ValueModifier :target="core.directional_light.position" target_key="y" :width="32" /></td>
          <td><ValueModifier :target="core.directional_light.position" target_key="z" :width="32" /></td>
        </tr>
      </tbody>
    </table>

  </DraggablePanel>

</template>



<style scoped>

/* match the compact buttons used inside .panel-cols (style.css) — global
   button is padding:10px margin:8px which is too chunky for this panel */
button {
  padding: 2px 6px;
  margin: 2px;
  font-size: 11px;
}
button:hover {
  outline: 1px solid white;
}

.lights {
  border-collapse: collapse;
  font-size: 11px;
  color: white;
  margin-top: 4px;
}

.lights td {
  padding: 2px 4px;
  vertical-align: middle;
}

.row-label {
  color: white;
  text-align: left;
}

.row-sub {
  color: #aaa;
  text-align: right;
}

.color-picker {
  width: 44px;
  height: 18px;
  padding: 0;
  border: 1px solid #444;
  background: black;
  cursor: pointer;
}
.color-picker:focus { outline: none; border-color: white; }

</style>
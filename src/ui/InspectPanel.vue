<script>
import { toRaw } from "vue";
import DraggablePanel from "./DraggablePanel.vue";
import core from "../webhammer.js";
import ValueModifier from "./ValueModifier.vue"

export default {
  name: "InspectPanel" ,
  components: {DraggablePanel, ValueModifier},
  data() {
    return {
      core,
      // mirror of core.tools.select_brush.selected_brush — assigning to this
      // goes through Vue's reactive proxy so the template re-renders, which
      // direct writes from the select_brush tool (called via raw `core`) do not
      selected_brush: null
    }
  },
  mounted() {
    const tick = () => {
      const sel = this.core.tools.select_brush.selected_brush;
      if (sel !== this.selected_brush) {
        this.selected_brush = sel;
      }
      this._rafId = requestAnimationFrame(tick);
    };
    this._rafId = requestAnimationFrame(tick);
  },
  beforeUnmount() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
  },
  methods: {
    regenerate() {
      // never call Three-touching methods on the reactive proxy — the new mesh
      // would be added to the scene as a proxy and trip the modelViewMatrix
      // invariant. toRaw() unwraps to the original brush.
      toRaw(this.selected_brush)._generateMesh();
    }
  }
}
</script>

<template>
  <DraggablePanel title="inspect">

    <table v-if="selected_brush" class="inspector">
      <thead>
        <tr>
          <th></th>
          <th>nx</th>
          <th>ny</th>
          <th>nz</th>
          <th>d</th>
          <th>mat</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(plane, i) in selected_brush._planes" :key="i">
          <td class="row-label">p{{ i }}</td>
          <td><ValueModifier :target="plane.normal" target_key="x"           :width="38" @on_change="regenerate" /></td>
          <td><ValueModifier :target="plane.normal" target_key="y"           :width="38" @on_change="regenerate" /></td>
          <td><ValueModifier :target="plane.normal" target_key="z"           :width="38" @on_change="regenerate" /></td>
          <td><ValueModifier :target="plane"        target_key="distance"    :width="38" @on_change="regenerate" /></td>
          <td><ValueModifier :target="plane"        target_key="material_id" :width="38" @on_change="regenerate" /></td>
        </tr>
      </tbody>
    </table>

    <div v-else class="empty">no brush selected</div>

  </DraggablePanel>
</template>

<style scoped>

.inspector {
  border-collapse: collapse;
  font-size: 11px;
  color: white;
}

.inspector th,
.inspector td {
  padding: 2px 3px;
  text-align: center;
  vertical-align: middle;
}

.inspector th {
  color: #aaa;
  font-weight: normal;
  font-size: 10px;
  border-bottom: 1px solid #444;
}

.row-label {
  color: #aaa;
  text-align: left;
  padding-right: 6px;
}

.empty {
  color: #888;
  font-style: italic;
}

</style>

<template>

  <div
      class="panel"
      :style="{ top: y + 'px', left: x + 'px' }"
      @pointerdown="startDrag"
  >
    
    <div class="panel-header">
      <span>{{ title }}</span>
      <button class="panel-toggle" @click.stop="toggleCollapse">
        {{ collapsed ? '+' : '-' }}
      </button>
    </div>

    <div class="panel-content" v-show="!collapsed">
      <slot />
    </div>
  </div>

</template>



<script>

export default {
  name: 'DraggablePanel',
  props: {
    title: { type: String, default: 'Panel' },
    initialX: { type: Number, default: 100 },
    initialY: { type: Number, default: 100 }
  },
  data() {
    return {
      x: this.initialX,
      y: this.initialY,
      collapsed: false,
      dragging: false,
      offsetX: 0,
      offsetY: 0
    }
  },
  methods: {
    toggleCollapse() {
      this.collapsed = !this.collapsed
    },
    startDrag(e) {
      if (!e.target.closest('.panel-header')) return

      e.preventDefault();

      this.dragging = true
      this.offsetX = e.clientX - this.x
      this.offsetY = e.clientY - this.y

      window.addEventListener('pointermove', this.onDrag)
      window.addEventListener('pointerup', this.stopDrag)
    },
    onDrag(e) {

      if (!this.dragging) return;
      e.preventDefault();
      this.x = e.clientX - this.offsetX
      this.y = e.clientY - this.offsetY
    },
    stopDrag() {
      this.dragging = false
      window.removeEventListener('pointermove', this.onDrag)
      window.removeEventListener('pointerup', this.stopDrag)
    }
  }
}

</script>



<style scoped>

.panel {
  position: absolute;
  width: 200px;
  background: #000;
  border: 1px solid #aaa;
  border-radius: 4px;
  box-shadow: 2px 2px 8px rgba(0,0,0,0.2);
  user-select: none;
  z-index: 100;
  display: flex;
  flex-direction: column; 
}

.panel-header {
  align-content: center;
  background: #000;
  border: 1px solid #aaa;
  padding: 4px 4px;
  display: flex;
  justify-content: space-between;
  cursor: grab;
  color: white;
  z-index: 101;
}

.panel-content {
  padding: 8px;
  z-index: 101;
  background-color: black;
  color: white;
  flex: 1;
  max-height: 150px;
  overflow: auto;
}

span {
  align-content: center;
}

.panel-toggle {
  margin: 0 0 0 15px;
}

</style>

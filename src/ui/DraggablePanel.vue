<template>

  <div
      ref="panel"
      class="panel"
      :style="panelStyle"
      @pointerdown="startDrag"
  >

    <div ref="header" class="panel-header">
      <span>{{ title }}</span>
      <button class="panel-toggle" @click.stop="toggleCollapse">
        {{ collapsed ? '+' : '-' }}
      </button>
    </div>

    <div ref="content" class="panel-content" v-show="!collapsed">
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
      flipped: false,
      headerH: 0,
      contentH: 0,
      panelW: 200,
      offsetX: 0,
      offsetY: 0
    }
  },
  computed: {
    // header always sits at (x, y); when flipped, content goes above the header,
    // so the panel's actual top edge is y - contentH
    panelStyle() {
      const ch = this.collapsed ? 0 : this.contentH;
      return {
        top:  (this.flipped ? this.y - ch : this.y) + 'px',
        left: this.x + 'px',
        flexDirection: this.flipped ? 'column-reverse' : 'column'
      }
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.measure()
      this.applyConstraint()
    })
    window.addEventListener('resize', this.onResize)
  },
  beforeUnmount() {
    window.removeEventListener('resize', this.onResize)
    window.removeEventListener('pointermove', this.onDrag)
    window.removeEventListener('pointerup',   this.stopDrag)
  },
  methods: {
    onResize() {
      this.measure()
      this.applyConstraint()
    },
    measure() {
      const headerEl  = this.$refs.header
      const contentEl = this.$refs.content
      const panelEl   = this.$refs.panel
      if (headerEl) this.headerH = headerEl.offsetHeight
      // contentEl.offsetHeight is 0 when v-show=false, so only sample when visible —
      // this lets contentH persist across collapse/expand
      if (contentEl && !this.collapsed) this.contentH = contentEl.offsetHeight
      if (panelEl) this.panelW = panelEl.offsetWidth
    },
    // given a proposed header position, return a fitted (x, y, flipped)
    constrain(nx, ny) {
      const vw = window.innerWidth
      const vh = window.innerHeight
      const hh = this.headerH
      const ch = this.collapsed ? 0 : this.contentH

      nx = Math.max(0, Math.min(nx, vw - this.panelW))

      // prefer not-flipped; flip only if content doesn't fit below but does above
      const fitsBelow = ny + hh + ch <= vh
      const fitsAbove = ny - ch >= 0
      const flipped   = !fitsBelow && fitsAbove

      if (flipped) {
        // header stays on-screen at top; content extends upward and must stay >= 0
        ny = Math.max(ch, Math.min(ny, vh - hh))
      } else {
        ny = Math.max(0,  Math.min(ny, vh - hh - ch))
      }
      // graceful: if viewport is smaller than the panel either way, stick to top
      if (ny < 0) ny = 0

      return { x: nx, y: ny, flipped }
    },
    applyConstraint() {
      const next = this.constrain(this.x, this.y)
      this.x = next.x
      this.y = next.y
      this.flipped = next.flipped
    },
    toggleCollapse() {
      this.collapsed = !this.collapsed
      this.$nextTick(() => {
        this.measure()
        this.applyConstraint()
      })
    },
    startDrag(e) {
      if (!e.target.closest('.panel-header')) return

      e.preventDefault();

      // re-measure in case slot content has grown/shrunk since last measure
      this.measure()

      this.dragging = true
      this.offsetX = e.clientX - this.x
      this.offsetY = e.clientY - this.y

      window.addEventListener('pointermove', this.onDrag)
      window.addEventListener('pointerup', this.stopDrag)
    },
    onDrag(e) {

      if (!this.dragging) return;
      e.preventDefault();
      const next = this.constrain(e.clientX - this.offsetX, e.clientY - this.offsetY)
      this.x = next.x
      this.y = next.y
      this.flipped = next.flipped
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
    border-radius: 0px;
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
    margin: 2px;
    padding: 2px 2px;
    display: flex;
    justify-content: space-between;
    cursor: grab;
    color: white;
    z-index: 101;
  }

  .panel-header button {
    padding: 2px 4px;
  }

  .panel-content {
    padding: 1px;
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

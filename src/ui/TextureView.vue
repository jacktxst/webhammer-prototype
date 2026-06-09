<script>

export default {
  name: "TextureView",
  props: {
    bitmap: {},
    size: { type: Number, default: 64 }
  },
  mounted() {
    this.draw();
  },
  watch: {
    bitmap() { this.draw(); },
    size()   { this.draw(); }
  },
  methods: {
    draw() {
      const canvas = this.$refs.canvas;
      if (!canvas || !this.bitmap) return;
      const thumbSize = this.size;
      const { width: imgW, height: imgH } = this.bitmap.bitmap;
      const scale = Math.min(thumbSize / imgW, thumbSize / imgH);
      const drawW = imgW * scale;
      const drawH = imgH * scale;
      const offsetX = (thumbSize - drawW) / 2;
      const offsetY = (thumbSize - drawH) / 2;
      canvas.width = thumbSize;
      canvas.height = thumbSize;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(this.bitmap.bitmap, offsetX, offsetY, drawW, drawH);
    }
  }
}

</script>



<template>

  <canvas ref="canvas"></canvas>

</template>



<style scoped>

</style>

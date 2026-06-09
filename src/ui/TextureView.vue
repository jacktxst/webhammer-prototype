<script>

export default {
  name: "TextureView",
  props : {
    bitmap : {}
  },
  mounted() {
    const canvas = this.$refs.canvas;
    const thumbSize = 64; // max width/height of thumbnail
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

</script>



<template>

  <canvas ref="canvas" width="64px" height="64px"></canvas>
  
</template>



<style scoped>

</style>
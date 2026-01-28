<script setup lang="ts">
import { computed } from 'vue'
import { useConfigStore } from '@/stores/config'

const configStore = useConfigStore()

// 背景样式
const backgroundStyle = computed(() => configStore.backgroundStyle)
</script>

<template>
  <div class="tech-background">
    <!-- 简洁渐变背景 -->
    <div class="bg-layer" :style="backgroundStyle" />
  </div>
</template>

<style scoped>
.tech-background {
  position: fixed;
  inset: 0;
  z-index: -10;
}

.bg-layer {
  position: absolute;
  inset: 0;
  transition: background 500ms ease;
}
</style>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const progress = ref(0)
let interval: ReturnType<typeof setInterval>

onMounted(() => {
  // 进度动画
  interval = setInterval(() => {
    progress.value += Math.random() * 15 + 5
    if (progress.value >= 100) {
      progress.value = 100
      clearInterval(interval)
    }
  }, 100)
})

onUnmounted(() => {
  if (interval) clearInterval(interval)
})
</script>

<template>
  <div class="loading-screen">
    <!-- 深色渐变背景 -->
    <div class="loading-bg" />

    <!-- 主内容 -->
    <div class="main-content">
      <!-- Logo -->
      <div class="logo-section">
        <div class="logo-container">
          <div class="logo-inner">
            <div class="logo-grid">
              <div class="logo-block block-1" />
              <div class="logo-block block-2" />
              <div class="logo-block block-3" />
              <div class="logo-block block-4" />
            </div>
          </div>
        </div>
      </div>

      <!-- 标题 -->
      <h1 class="title">
        <span class="text-gradient-neon">LightPanel</span>
      </h1>
      <p class="subtitle">Dashboard</p>

      <!-- 进度条 -->
      <div class="progress-section">
        <div class="progress-track">
          <div
            class="progress-fill"
            :style="{ width: `${progress}%` }"
          />
        </div>
        
        <div class="progress-info">
          <span class="loading-text">Loading</span>
          <span class="progress-percent">{{ Math.floor(progress) }}%</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-bg {
  position: absolute;
  inset: 0;
  background: hsl(var(--bg-page));
}

/* 主内容 */
.main-content {
  position: relative;
  z-index: 10;
  text-align: center;
  padding: 0 1.5rem;
}

/* Logo 部分 */
.logo-section {
  margin-bottom: 2rem;
}

.logo-container {
  position: relative;
  width: 5rem;
  height: 5rem;
  margin: 0 auto;
}

.logo-inner {
  width: 100%;
  height: 100%;
  border-radius: 1rem;
  background: hsl(220 30% 12%);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid hsl(var(--neon-cyan) / 0.3);
}

.logo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.375rem;
}

.logo-block {
  width: 0.875rem;
  height: 0.875rem;
  border-radius: 0.25rem;
}

.block-1 {
  background: hsl(var(--neon-cyan));
}

.block-2 {
  background: hsl(var(--neon-purple));
}

.block-3 {
  background: hsl(var(--neon-pink));
}

.block-4 {
  background: hsl(var(--neon-blue));
}

/* 标题 */
.title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
}

.text-gradient-neon {
  background: linear-gradient(135deg, 
    hsl(var(--neon-cyan)) 0%,
    hsl(var(--neon-purple)) 100%
  );
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.subtitle {
  color: hsl(var(--text-muted));
  font-size: 0.75rem;
  margin-bottom: 2rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
}

/* 进度条 */
.progress-section {
  width: 16rem;
  margin: 0 auto;
}

.progress-track {
  position: relative;
  height: 0.375rem;
  background: hsl(var(--text-muted) / 0.15);
  border-radius: 9999px;
  overflow: hidden;
}

.progress-fill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  border-radius: 9999px;
  transition: width 150ms ease-out;
  background: linear-gradient(90deg, 
    hsl(var(--neon-cyan)),
    hsl(var(--neon-purple))
  );
}

.progress-info {
  margin-top: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
}

.loading-text {
  color: hsl(var(--text-muted));
  font-size: 0.6875rem;
  letter-spacing: 0.15em;
  text-transform: uppercase;
}

.progress-percent {
  color: hsl(var(--neon-cyan));
  font-size: 0.75rem;
  font-family: monospace;
  font-weight: 600;
}

/* 响应式 */
@media (max-width: 640px) {
  .progress-section {
    width: 14rem;
  }
  
  .title {
    font-size: 1.5rem;
  }
}
</style>

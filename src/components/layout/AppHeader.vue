<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useNavStore } from '@/stores/nav'
import { Settings, Moon, Sun, Monitor, Clock, Zap } from 'lucide-vue-next'

const configStore = useConfigStore()
const navStore = useNavStore()

const title = computed(() => navStore.panelTitle)
const subtitle = computed(() => navStore.panelSubtitle)
const logo = computed(() => navStore.panelLogo)
const effectiveTheme = computed(() => configStore.effectiveTheme)

// 时间相关
const now = ref(new Date())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})

const currentTime = computed(() => {
  return now.value.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

const currentDate = computed(() => {
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  return `${now.value.getMonth() + 1}/${now.value.getDate()} ${weekdays[now.value.getDay()]}`
})

// 拼接后的 Logo URL
const logoUrl = computed(() => {
  const logoPath = logo.value
  if (!logoPath) return null
  
  if (logoPath.startsWith('http://') || logoPath.startsWith('https://')) {
    return logoPath
  }
  
  return `./backend/iconlibs/${logoPath}`
})

function cycleTheme() {
  const themes = ['light', 'dark', 'auto'] as const
  const currentIndex = themes.indexOf(configStore.theme)
  const nextIndex = (currentIndex + 1) % themes.length
  configStore.setTheme(themes[nextIndex])
}

function openSettings() {
  configStore.toggleSettingsPanel(true)
}
</script>

<template>
  <header class="app-header">
    <!-- 背景层 - 高级毛玻璃 -->
    <div class="header-bg" />
    
    <!-- 顶部高光线 -->
    <div class="header-highlight" />
    
    <!-- 底部渐变分割线 -->
    <div class="header-divider" />
    
    <!-- 内容层 -->
    <div class="header-content">
      <!-- 左侧：Logo + 标题 -->
      <div class="header-left">
        <!-- Logo -->
        <div class="logo-wrapper">
          <div class="logo-container">
            <img 
              v-if="logoUrl" 
              :src="logoUrl" 
              alt="Logo"
              class="logo-img"
            />
            <template v-else>
              <div class="logo-placeholder">
                <div class="logo-grid">
                  <span class="dot dot-1" />
                  <span class="dot dot-2" />
                  <span class="dot dot-3" />
                  <span class="dot dot-4" />
                </div>
              </div>
            </template>
          </div>
          <!-- Logo 光效 -->
          <div class="logo-glow" />
        </div>
        
        <!-- 分隔线 -->
        <div class="title-divider" />
        
        <!-- 标题 -->
        <div class="title-area">
          <h1 class="title-main">
            <span class="title-text">{{ title }}</span>
            <Zap class="title-icon" />
          </h1>
          <p v-if="subtitle" class="title-sub">
            <span class="subtitle-text">{{ subtitle }}</span>
          </p>
        </div>
      </div>

      <!-- 右侧：时间 + 操作按钮 -->
      <div class="header-right">
        <!-- 时间显示 -->
        <div v-if="configStore.showTime" class="time-widget">
          <Clock class="time-icon" />
          <span class="time-value">{{ currentTime }}</span>
          <span class="time-divider" />
          <span class="time-date">{{ currentDate }}</span>
        </div>
        
        <!-- 分隔线 -->
        <div v-if="configStore.showTime" class="actions-divider" />
        <!-- 主题按钮 -->
        <button class="action-btn" @click="cycleTheme" :title="`主题: ${configStore.theme === 'auto' ? '自动' : configStore.theme === 'dark' ? '深色' : '浅色'}`">
          <div class="btn-inner">
            <Transition
              mode="out-in"
              enter-active-class="icon-enter"
              enter-from-class="icon-enter-from"
              leave-active-class="icon-leave"
              leave-to-class="icon-leave-to"
            >
              <Sun v-if="effectiveTheme === 'light' && configStore.theme !== 'auto'" class="btn-icon" />
              <Moon v-else-if="effectiveTheme === 'dark' && configStore.theme !== 'auto'" class="btn-icon" />
              <Monitor v-else class="btn-icon" />
            </Transition>
          </div>
        </button>

        <!-- 设置按钮 -->
        <button class="action-btn settings-btn" @click="openSettings" title="设置">
          <div class="btn-inner">
            <Settings class="btn-icon settings-icon" />
          </div>
        </button>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* ============================================
   HEADER - 优雅中性导航栏（百搭各种背景）
   ============================================ */

.app-header {
  position: sticky;
  top: 0;
  z-index: 50;
  height: var(--header-height, 3.5rem);
}

/* 背景层 - 自适应毛玻璃效果 */
.header-bg {
  position: absolute;
  inset: 0;
  background: hsl(var(--bg-page) / 0.65);
  backdrop-filter: blur(24px) saturate(1.5);
  -webkit-backdrop-filter: blur(24px) saturate(1.5);
}

/* 顶部高光 - 柔和白边 */
.header-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(var(--text-primary) / 0.04) 25%,
    hsl(var(--text-primary) / 0.08) 50%,
    hsl(var(--text-primary) / 0.04) 75%,
    transparent 100%
  );
}

/* 底部分割线 - 中性渐变 */
.header-divider {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    hsl(var(--border-subtle) / 0.4) 20%,
    hsl(var(--border-subtle) / 0.6) 50%,
    hsl(var(--border-subtle) / 0.4) 80%,
    transparent 100%
  );
}

/* 内容层 */
.header-content {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 1rem;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
}

/* ============================================
   左侧区域 - Logo + 标题
   ============================================ */

.header-left {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-shrink: 0;
}

/* Logo */
.logo-wrapper {
  position: relative;
}

.logo-container {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  overflow: hidden;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.3s ease;
}

.logo-wrapper:hover .logo-container {
  transform: scale(1.05);
}

.logo-img {
  width: 2.25rem;
  height: 2.25rem;
  object-fit: contain;
}

.logo-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--bg-elevated) / 0.8);
  border: 1px solid hsl(var(--border-subtle) / 0.4);
  border-radius: 0.625rem;
}

.logo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
}

/* 中性色占位点 - 灰度渐变 */
.dot-1 { background: hsl(var(--text-secondary) / 0.7); }
.dot-2 { background: hsl(var(--text-secondary) / 0.5); }
.dot-3 { background: hsl(var(--text-secondary) / 0.5); }
.dot-4 { background: hsl(var(--text-secondary) / 0.7); }

.logo-glow {
  position: absolute;
  inset: -4px;
  background: radial-gradient(
    circle,
    hsl(var(--text-primary) / 0.08) 0%,
    transparent 70%
  );
  opacity: 0;
  filter: blur(8px);
  transition: opacity 0.4s ease;
  pointer-events: none;
}

.logo-wrapper:hover .logo-glow {
  opacity: 1;
}

/* 标题分隔线 */
.title-divider {
  width: 1px;
  height: 1.5rem;
  background: linear-gradient(
    180deg,
    transparent,
    hsl(var(--border-subtle) / 0.6),
    transparent
  );
}

/* 标题区域 */
.title-area {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.title-main {
  font-size: 1rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.375rem;
  line-height: 1.2;
}

.title-text {
  color: hsl(var(--text-primary));
  letter-spacing: -0.01em;
}

.title-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: hsl(var(--primary));
  opacity: 0.85;
  transition: opacity 0.3s ease;
}

.title-main:hover .title-icon {
  opacity: 1;
}

.title-sub {
  font-size: 0.6875rem;
  letter-spacing: 0.03em;
  display: none;
}

.subtitle-text {
  color: hsl(var(--text-muted));
}

@media (min-width: 640px) {
  .title-sub {
    display: block;
  }
  
  .title-main {
    font-size: 1.0625rem;
  }
}

/* ============================================
   时间组件 - 透明融入背景
   ============================================ */

.time-widget {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0;
  font-family: var(--font-mono, ui-monospace, monospace);
}

@media (min-width: 640px) {
  .time-widget {
    display: flex;
  }
}

.time-icon {
  width: 0.8125rem;
  height: 0.8125rem;
  color: hsl(var(--text-muted));
  opacity: 0.6;
}

.time-value {
  font-size: 0.8125rem;
  font-weight: 500;
  color: hsl(var(--text-primary) / 0.75);
  letter-spacing: 0.02em;
}

.time-divider {
  width: 1px;
  height: 0.625rem;
  background: hsl(var(--text-primary) / 0.15);
}

.time-date {
  font-size: 0.6875rem;
  color: hsl(var(--text-primary) / 0.55);
  font-weight: 400;
}

.actions-divider {
  display: none;
  width: 1px;
  height: 1.25rem;
  background: linear-gradient(180deg, transparent, hsl(var(--border-subtle) / 0.5), transparent);
  margin: 0 0.25rem;
}

@media (min-width: 640px) {
  .actions-divider {
    display: block;
  }
}

/* ============================================
   右侧区域 - 操作按钮
   ============================================ */

.header-right {
  display: flex;
  align-items: center;
  gap: 0.375rem;
}

.action-btn {
  position: relative;
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  background: transparent;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.action-btn:hover {
  background: hsl(var(--bg-elevated) / 0.7);
  border-color: hsl(var(--border-subtle) / 0.4);
}

.action-btn:active {
  transform: scale(0.95);
}

.btn-inner {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon {
  width: 1.125rem;
  height: 1.125rem;
  color: hsl(var(--text-secondary));
  transition: color 0.25s ease, transform 0.3s ease;
}

.action-btn:hover .btn-icon {
  color: hsl(var(--text-primary));
}

.settings-btn:hover .btn-icon {
  color: hsl(var(--text-primary));
  transform: rotate(45deg);
}

/* 图标动画 */
.icon-enter {
  transition: all 0.2s ease-out;
}

.icon-enter-from {
  opacity: 0;
  transform: scale(0.8) rotate(-90deg);
}

.icon-leave {
  transition: all 0.15s ease-in;
}

.icon-leave-to {
  opacity: 0;
  transform: scale(0.8) rotate(90deg);
}

/* ============================================
   响应式调整
   ============================================ */

@media (min-width: 640px) {
  .header-content {
    padding: 0 1.5rem;
  }
  
  .logo-container {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .logo-img {
    width: 2.5rem;
    height: 2.5rem;
  }
  
  .action-btn {
    width: 2.375rem;
    height: 2.375rem;
  }
  
  .btn-icon {
    width: 1.1875rem;
    height: 1.1875rem;
  }
}

@media (min-width: 1024px) {
  .header-right {
    gap: 0.5rem;
  }
}
</style>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useNavStore } from '@/stores/nav'
import { Settings, Moon, Sun, Pencil, Clock, Zap, ChevronDown, Check } from 'lucide-vue-next'
import type { ThemeMode } from '@/types'

const configStore = useConfigStore()
const navStore = useNavStore()

const title = computed(() => navStore.panelTitle)
const subtitle = computed(() => navStore.panelSubtitle)
const logo = computed(() => navStore.panelLogo)

// 主题下拉菜单状态
const themeDropdownOpen = ref(false)

// 主题选项列表
const themeOptions: { value: ThemeMode; label: string; icon: typeof Sun }[] = [
  { value: 'light', label: '浅色', icon: Sun },
  { value: 'dark', label: '深色', icon: Moon },
  { value: 'sketch-light', label: '素描浅', icon: Pencil },
  { value: 'sketch-dark', label: '素描深', icon: Pencil }
]

// 获取当前主题图标
const currentThemeIcon = computed(() => {
  const option = themeOptions.find(o => o.value === configStore.theme)
  return option?.icon || Sun
})

// 获取当前主题名称
const currentThemeLabel = computed(() => {
  const option = themeOptions.find(o => o.value === configStore.theme)
  return option?.label || '主题'
})

// 切换下拉菜单
function toggleThemeDropdown() {
  themeDropdownOpen.value = !themeDropdownOpen.value
}

// 选择主题
function selectTheme(theme: ThemeMode) {
  configStore.setTheme(theme)
  themeDropdownOpen.value = false
}

// 点击外部关闭下拉菜单
function closeThemeDropdown(event: MouseEvent) {
  const target = event.target as HTMLElement
  if (!target.closest('.theme-dropdown-wrapper')) {
    themeDropdownOpen.value = false
  }
}

// 时间相关
const now = ref(new Date())
let timer: ReturnType<typeof setInterval>

onMounted(() => {
  timer = setInterval(() => {
    now.value = new Date()
  }, 1000)
  // 监听全局点击关闭下拉菜单
  document.addEventListener('click', closeThemeDropdown)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
  document.removeEventListener('click', closeThemeDropdown)
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
        
        <!-- 主题下拉选择器 -->
        <div class="theme-dropdown-wrapper">
          <button 
            class="action-btn theme-btn" 
            :class="{ active: themeDropdownOpen }"
            @click.stop="toggleThemeDropdown" 
            :title="`主题: ${currentThemeLabel}`"
          >
            <div class="btn-inner">
              <component :is="currentThemeIcon" class="btn-icon" />
              <ChevronDown class="dropdown-arrow" :class="{ open: themeDropdownOpen }" />
            </div>
          </button>
          
          <!-- 下拉菜单 -->
          <Transition
            enter-active-class="dropdown-enter"
            enter-from-class="dropdown-enter-from"
            leave-active-class="dropdown-leave"
            leave-to-class="dropdown-leave-to"
          >
            <div v-if="themeDropdownOpen" class="theme-dropdown">
              <button
                v-for="option in themeOptions"
                :key="option.value"
                class="theme-option"
                :class="{ active: configStore.theme === option.value }"
                @click="selectTheme(option.value)"
              >
                <component :is="option.icon" class="option-icon" />
                <span class="option-label">{{ option.label }}</span>
                <Check v-if="configStore.theme === option.value" class="option-check" />
              </button>
            </div>
          </Transition>
        </div>

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
  filter: var(--icon-filter, none);
  transition: filter 0.3s ease;
}

.logo-wrapper:hover .logo-img {
  filter: var(--icon-filter-hover, none);
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
  width: 0.875rem;
  height: 0.875rem;
  color: hsl(var(--text-muted));
  opacity: 0.6;
}

.time-value {
  font-size: 0.875rem;
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
  font-size: 0.75rem;
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

/* ============================================
   主题下拉选择器
   ============================================ */

.theme-dropdown-wrapper {
  position: relative;
}

.theme-btn {
  width: auto;
  padding: 0 0.5rem;
  gap: 0.25rem;
}

.theme-btn .btn-inner {
  gap: 0.25rem;
}

.theme-btn.active {
  background: hsl(var(--bg-elevated) / 0.7);
  border-color: hsl(var(--border-subtle) / 0.4);
}

.dropdown-arrow {
  width: 0.875rem;
  height: 0.875rem;
  color: hsl(var(--text-muted));
  transition: transform 0.2s ease;
}

.dropdown-arrow.open {
  transform: rotate(180deg);
}

.theme-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  min-width: 120px;
  padding: 0.375rem;
  border-radius: 0.75rem;
  background: hsl(var(--bg-elevated));
  backdrop-filter: blur(20px) saturate(1.5);
  -webkit-backdrop-filter: blur(20px) saturate(1.5);
  border: 1px solid hsl(var(--border-subtle) / 0.5);
  box-shadow: 
    0 4px 24px -4px rgba(0, 0, 0, 0.3),
    0 8px 32px -8px rgba(0, 0, 0, 0.2);
  z-index: 100;
}

.theme-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.5rem 0.625rem;
  border-radius: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
  color: hsl(var(--text-secondary));
}

.theme-option:hover {
  background: hsl(var(--glass-bg-hover));
  color: hsl(var(--text-primary));
}

.theme-option.active {
  background: hsl(var(--neon-cyan) / 0.1);
  color: hsl(var(--neon-cyan));
}

.option-icon {
  width: 1rem;
  height: 1rem;
  flex-shrink: 0;
}

.option-label {
  flex: 1;
  font-size: 0.8125rem;
  font-weight: 500;
  text-align: left;
}

.option-check {
  width: 0.875rem;
  height: 0.875rem;
  color: hsl(var(--neon-cyan));
  flex-shrink: 0;
}

/* 下拉菜单动画 */
.dropdown-enter {
  transition: all 0.2s ease-out;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.dropdown-leave {
  transition: all 0.15s ease-in;
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
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

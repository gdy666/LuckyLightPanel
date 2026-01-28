<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Site } from '@/types'

interface LinkItem {
  url: string
  label: string
  type: 'internal' | 'external'
}

// 状态
const visible = ref(false)
const currentSite = ref<Site | null>(null)
const links = ref<LinkItem[]>([])
const position = ref({ top: 0, left: 0 })
const clickTarget = ref<HTMLElement | null>(null)

// 显示下拉菜单
function show(site: Site, urlList: LinkItem[], target: HTMLElement) {
  currentSite.value = site
  links.value = urlList
  clickTarget.value = target
  
  // 计算位置
  calculatePosition(target)
  visible.value = true
}

// 计算智能定位
function calculatePosition(target: HTMLElement) {
  const rect = target.getBoundingClientRect()
  const viewportHeight = window.innerHeight
  const viewportWidth = window.innerWidth
  
  // 预估下拉菜单尺寸
  const dropdownWidth = 320
  const dropdownHeight = Math.min(links.value.length * 72 + 60, 360)
  
  // 计算水平位置（居中于卡片）
  let left = rect.left + (rect.width / 2) - (dropdownWidth / 2)
  
  // 确保不超出左右边界
  if (left < 10) {
    left = 10
  } else if (left + dropdownWidth > viewportWidth - 10) {
    left = viewportWidth - dropdownWidth - 10
  }
  
  // 计算垂直位置
  const spaceBelow = viewportHeight - rect.bottom
  const spaceAbove = rect.top
  
  let top: number
  if (spaceBelow >= dropdownHeight + 10 || spaceBelow >= spaceAbove) {
    // 向下展开
    top = rect.bottom + 8
  } else {
    // 向上展开
    top = rect.top - dropdownHeight - 8
  }
  
  // 确保不超出上下边界
  if (top < 10) {
    top = 10
  } else if (top + dropdownHeight > viewportHeight - 10) {
    top = viewportHeight - dropdownHeight - 10
  }
  
  position.value = { top, left }
}

// 隐藏下拉菜单
function hide() {
  visible.value = false
  currentSite.value = null
  links.value = []
}

// 打开链接
function openLink(item: LinkItem) {
  const target = currentSite.value?.target || '_blank'
  window.open(item.url, target)
  hide()
}

// ESC 键关闭
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && visible.value) {
    hide()
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeydown)
})

// 暴露方法给外部调用
defineExpose({
  show,
  hide
})
</script>

<template>
  <!-- 遮罩层 -->
  <Teleport to="body">
    <div 
      v-if="visible" 
      class="link-dropdown-overlay"
      @click="hide"
    />
    
    <!-- 下拉菜单 -->
    <div
      v-if="visible"
      class="link-dropdown"
      :style="{ top: `${position.top}px`, left: `${position.left}px` }"
    >
      <!-- 头部 -->
      <div class="link-dropdown-header">
        <span class="link-dropdown-title">选择链接</span>
        <button class="link-dropdown-close" @click="hide">
          <i class="fas fa-times"></i>
        </button>
      </div>
      
      <!-- 链接列表 -->
      <div class="link-dropdown-list">
        <button
          v-for="(item, index) in links"
          :key="index"
          class="link-dropdown-item"
          @click="openLink(item)"
        >
          <div class="link-dropdown-item-icon" :class="{ internal: item.type === 'internal' }">
            <i :class="item.type === 'internal' ? 'fas fa-home' : 'fas fa-globe'"></i>
          </div>
          <div class="link-dropdown-item-info">
            <div class="link-dropdown-item-url">{{ item.url }}</div>
            <div class="link-dropdown-item-label">{{ item.label }}</div>
          </div>
          <i class="fas fa-external-link-alt link-dropdown-item-arrow"></i>
        </button>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.link-dropdown-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 250;
  background: transparent;
}

.link-dropdown {
  position: fixed;
  z-index: 300;
  min-width: 280px;
  max-width: 400px;
  background: hsl(var(--glass-bg));
  backdrop-filter: blur(20px) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(20px) saturate(var(--glass-saturation));
  border: 1px solid hsl(var(--glass-border));
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: dropdownFadeIn 0.15s ease;
}

@keyframes dropdownFadeIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.link-dropdown-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid hsl(var(--glass-border));
}

.link-dropdown-title {
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--text-primary));
}

.link-dropdown-close {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  color: hsl(var(--text-muted));
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 0.15s ease;
}

.link-dropdown-close:hover {
  background: hsl(var(--glass-bg-hover));
  color: hsl(var(--text-primary));
}

.link-dropdown-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 8px;
}

.link-dropdown-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  width: 100%;
  background: transparent;
  border: none;
}

.link-dropdown-item:hover {
  background: hsl(var(--glass-bg-hover));
}

.link-dropdown-item-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, hsl(var(--neon-cyan)), hsl(var(--neon-blue)));
  border-radius: 8px;
  color: #fff;
  font-size: 14px;
  flex-shrink: 0;
}

.link-dropdown-item-icon.internal {
  background: linear-gradient(135deg, hsl(var(--neon-green)), #10b981);
}

.link-dropdown-item-info {
  flex: 1;
  min-width: 0;
}

.link-dropdown-item-url {
  font-size: 13px;
  color: hsl(var(--text-primary));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.link-dropdown-item-label {
  font-size: 11px;
  color: hsl(var(--text-muted));
}

.link-dropdown-item-arrow {
  color: hsl(var(--text-muted));
  font-size: 12px;
  flex-shrink: 0;
}

/* 深色主题适配 */
[data-theme="dark"] .link-dropdown {
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.4);
}
</style>

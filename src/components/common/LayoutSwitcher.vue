<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import type { LayoutMode } from '@/types'

const configStore = useConfigStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 布局选项配置 - 四种布局
const layoutOptions: { value: LayoutMode; label: string; icon: string; desc: string }[] = [
  { value: 'normal', label: '卡片', icon: 'card', desc: '标准布局' },
  { value: 'compact', label: '紧凑', icon: 'compact', desc: '显示更多' },
  { value: 'list', label: '列表', icon: 'list', desc: '横向展示' },
  { value: 'minimal', label: '极简', icon: 'minimal', desc: '图标导航' }
]

// 当前选中的布局
const currentLayout = computed(() => configStore.layout)

// 获取当前布局的显示名称
const displayLabel = computed(() => {
  const option = layoutOptions.find(o => o.value === currentLayout.value)
  return option?.label || '卡片'
})

// 切换下拉菜单
function toggleDropdown() {
  isOpen.value = !isOpen.value
}

// 选择布局
function selectLayout(layout: LayoutMode) {
  configStore.setLayout(layout)
  isOpen.value = false
}

// 点击外部关闭
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<template>
  <div 
    ref="dropdownRef"
    class="layout-switcher-wrapper"
    :class="{ open: isOpen }"
  >
    <button class="layout-badge" @click="toggleDropdown" title="切换布局样式">
      <i class="fas fa-th-large badge-icon"></i>
      <span class="badge-text">{{ displayLabel }}</span>
      <i class="fas fa-caret-down switch-icon"></i>
    </button>
    
    <!-- 四宫格下拉菜单 -->
    <div class="layout-dropdown">
      <div class="layout-grid">
        <button
          v-for="option in layoutOptions"
          :key="option.value"
          class="layout-option"
          :class="{ active: currentLayout === option.value }"
          @click="selectLayout(option.value)"
        >
          <!-- 布局预览图标 -->
          <div class="layout-preview" :class="`preview-${option.icon}`">
            <template v-if="option.icon === 'card'">
              <div class="preview-card">
                <div class="preview-icon-lg"></div>
                <div class="preview-lines">
                  <div class="preview-line"></div>
                  <div class="preview-line short"></div>
                </div>
              </div>
            </template>
            <template v-else-if="option.icon === 'compact'">
              <div class="preview-compact">
                <div class="preview-item-sm"></div>
                <div class="preview-item-sm"></div>
                <div class="preview-item-sm"></div>
                <div class="preview-item-sm"></div>
              </div>
            </template>
            <template v-else-if="option.icon === 'list'">
              <div class="preview-list">
                <div class="preview-row"></div>
                <div class="preview-row"></div>
                <div class="preview-row"></div>
              </div>
            </template>
            <template v-else-if="option.icon === 'minimal'">
              <div class="preview-minimal">
                <div class="preview-dot"></div>
                <div class="preview-dot"></div>
                <div class="preview-dot"></div>
                <div class="preview-dot"></div>
                <div class="preview-dot"></div>
                <div class="preview-dot"></div>
              </div>
            </template>
          </div>
          <span class="layout-label">{{ option.label }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.layout-switcher-wrapper {
  position: relative;
}

/* 布局切换徽章按钮 - 统一毛玻璃风格 */
.layout-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  color: rgba(6, 182, 212, 0.95);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15);
}

.layout-badge:hover {
  background: rgba(0, 0, 0, 0.35);
  border-color: rgba(6, 182, 212, 0.35);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15),
    0 0 12px -4px rgba(6, 182, 212, 0.3);
}

.badge-icon {
  font-size: 12px;
}

.switch-icon {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 2px;
  transition: transform 0.15s ease;
}

.layout-switcher-wrapper.open .switch-icon {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.layout-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: rgba(15, 20, 30, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 14px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 10px;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.95);
  transition: all 0.15s ease;
  z-index: 100;
}

.layout-switcher-wrapper.open .layout-dropdown {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
}

/* 四宫格布局 */
.layout-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

/* 布局选项 */
.layout-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 72px;
  padding: 10px 8px;
  border: none;
  background: transparent;
  border-radius: 10px;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: all 0.15s ease;
}

.layout-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.layout-option.active {
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
}

.layout-option.active .layout-preview {
  border-color: rgba(6, 182, 212, 0.4);
  background: rgba(6, 182, 212, 0.08);
}

/* 布局预览框 */
.layout-preview {
  width: 48px;
  height: 36px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  background: rgba(0, 0, 0, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 4px;
  transition: all 0.15s ease;
}

/* 卡片布局预览 */
.preview-card {
  display: flex;
  align-items: center;
  gap: 4px;
  width: 100%;
  padding: 2px;
}

.preview-icon-lg {
  width: 12px;
  height: 12px;
  border-radius: 3px;
  background: rgba(6, 182, 212, 0.5);
  flex-shrink: 0;
}

.preview-lines {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.preview-line {
  height: 3px;
  border-radius: 1px;
  background: rgba(255, 255, 255, 0.3);
}

.preview-line.short {
  width: 60%;
}

/* 紧凑布局预览 */
.preview-compact {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 3px;
  width: 100%;
  height: 100%;
}

.preview-item-sm {
  border-radius: 3px;
  background: rgba(6, 182, 212, 0.4);
}

/* 列表布局预览 */
.preview-list {
  display: flex;
  flex-direction: column;
  gap: 3px;
  width: 100%;
}

.preview-row {
  height: 6px;
  border-radius: 2px;
  background: rgba(6, 182, 212, 0.4);
}

/* 极简布局预览 */
.preview-minimal {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
  padding: 2px;
}

.preview-dot {
  width: 8px;
  height: 8px;
  border-radius: 2px;
  background: rgba(6, 182, 212, 0.5);
}

/* 布局标签 */
.layout-label {
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

/* 浅色主题适配 */
[data-theme="light"] .layout-badge {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 2px 8px -2px rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .layout-badge:hover {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(6, 182, 212, 0.4);
}

[data-theme="light"] .layout-dropdown {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

[data-theme="light"] .layout-option {
  color: rgba(0, 0, 0, 0.75);
}

[data-theme="light"] .layout-option:hover {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="light"] .layout-preview {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(0, 0, 0, 0.03);
}

/* 深色主题适配 */
[data-theme="dark"] .layout-dropdown {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* 响应式 */
@media (max-width: 640px) {
  .layout-badge {
    padding: 5px 10px;
    font-size: 12px;
  }
  
  .badge-text {
    max-width: 48px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .layout-option {
    width: 64px;
    padding: 8px 6px;
  }
  
  .layout-preview {
    width: 42px;
    height: 32px;
  }
}
</style>

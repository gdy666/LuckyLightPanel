<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useNavStore } from '@/stores/nav'
import type { NetworkMode } from '@/types'

const configStore = useConfigStore()
const navStore = useNavStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 网络模式选项
const networkModeOptions: { value: NetworkMode; label: string; icon: string }[] = [
  { value: 'auto', label: '自动', icon: 'fas fa-magic' },
  { value: 'internal', label: '内网', icon: 'fas fa-home' },
  { value: 'external', label: '外网', icon: 'fas fa-globe' },
  { value: 'hybrid', label: '混合', icon: 'fas fa-random' }
]

// 获取当前显示的文本（自动模式显示识别结果）
const displayLabel = computed(() => {
  const mode = configStore.networkMode
  if (mode === 'auto') {
    // 自动模式：查询失败时显示"自动(混合)"，否则显示识别结果
    if (navStore.networkTypeFetchFailed) {
      return '自动(混合)'
    }
    const isInternal = navStore.networkType === 'internal'
    return isInternal ? '自动(内网)' : '自动(外网)'
  }
  const option = networkModeOptions.find(o => o.value === mode)
  return option?.label || '混合'
})

// 获取当前显示的图标
const displayIcon = computed(() => {
  const mode = configStore.networkMode
  if (mode === 'auto') {
    return 'fas fa-magic'
  }
  const option = networkModeOptions.find(o => o.value === mode)
  return option?.icon || 'fas fa-random'
})

// 切换下拉菜单
function toggleDropdown() {
  isOpen.value = !isOpen.value
}

// 选择模式
async function selectMode(mode: NetworkMode) {
  configStore.setNetworkMode(mode)
  isOpen.value = false
  
  // 切换到自动或混合模式时，重新获取网络类型
  if (mode === 'auto' || mode === 'hybrid') {
    await navStore.fetchNetworkType()
  }
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
    class="network-dropdown-wrapper"
    :class="{ open: isOpen }"
  >
    <button class="network-badge" @click="toggleDropdown" title="切换网络模式">
      <i :class="displayIcon" class="badge-icon"></i>
      <span class="badge-text">{{ displayLabel }}</span>
      <i class="fas fa-caret-down switch-icon"></i>
    </button>
    
    <div class="network-dropdown">
      <button
        v-for="option in networkModeOptions"
        :key="option.value"
        class="network-option"
        :class="{ active: configStore.networkMode === option.value }"
        @click="selectMode(option.value)"
      >
        <i :class="option.icon" class="option-icon"></i>
        <span>{{ option.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.network-dropdown-wrapper {
  position: relative;
}

/* 网络模式徽章按钮 - 统一毛玻璃风格 */
.network-badge {
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
  color: rgba(168, 85, 247, 0.95);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15);
}

.network-badge:hover {
  background: rgba(0, 0, 0, 0.35);
  border-color: rgba(168, 85, 247, 0.35);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15),
    0 0 12px -4px rgba(168, 85, 247, 0.3);
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

.network-dropdown-wrapper.open .switch-icon {
  transform: rotate(180deg);
}

/* 下拉菜单 */
.network-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 120px;
  max-width: 160px;
  background: rgba(15, 20, 30, 0.85);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.25),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
  padding: 6px;
  opacity: 0;
  visibility: hidden;
  transform: scale(0.95);
  transition: all 0.15s ease;
  z-index: 100;
}

.network-dropdown-wrapper.open .network-dropdown {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
}

/* 下拉选项 */
.network-option {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.network-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.network-option.active {
  background: rgba(168, 85, 247, 0.15);
  color: #a855f7;
}

.option-icon {
  width: 16px;
  text-align: center;
  font-size: 12px;
  flex-shrink: 0;
}

/* 浅色主题适配 */
[data-theme="light"] .network-badge {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 2px 8px -2px rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .network-badge:hover {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(168, 85, 247, 0.4);
}

[data-theme="light"] .network-dropdown {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

[data-theme="light"] .network-option {
  color: rgba(0, 0, 0, 0.75);
}

[data-theme="light"] .network-option:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* 深色主题适配 */
[data-theme="dark"] .network-dropdown {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* 响应式 */
@media (max-width: 640px) {
  .network-badge {
    padding: 5px 10px;
    font-size: 12px;
  }
  
  .badge-text {
    max-width: 80px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>

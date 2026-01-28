<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import type { Group } from '@/types'

const props = defineProps<{
  groups: Group[]
  current: string
  color?: 'cyan' | 'docker' | 'green'
}>()

const emit = defineEmits<{
  change: [key: string]
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 获取当前分组信息
function getCurrentGroup() {
  return props.groups.find(g => g.key === props.current) || props.groups[0]
}

// 获取分组图标类名
function getGroupIconClass(icon?: string): string {
  if (!icon) return 'fas fa-folder'
  if (icon.startsWith('fa-') || icon.startsWith('fas ') || icon.startsWith('far ') || icon.startsWith('fab ')) {
    return icon.startsWith('fa-') ? `fas ${icon}` : icon
  }
  return `fas fa-${icon}`
}

// 切换下拉菜单
function toggleDropdown() {
  isOpen.value = !isOpen.value
}

// 选择分组
function selectGroup(key: string) {
  emit('change', key)
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
    v-if="groups.length > 1" 
    ref="dropdownRef"
    class="group-dropdown-wrapper"
    :class="[`color-${color || 'cyan'}`, { open: isOpen }]"
  >
    <button class="group-badge" @click="toggleDropdown">
      <i :class="getGroupIconClass(getCurrentGroup()?.icon)" class="badge-icon"></i>
      <span class="badge-text">{{ getCurrentGroup()?.name || '全部' }}</span>
      <i class="fas fa-caret-down switch-icon"></i>
    </button>
    
    <div class="group-dropdown">
      <button
        v-for="group in groups"
        :key="group.key"
        class="group-option"
        :class="{ active: current === group.key }"
        @click="selectGroup(group.key)"
      >
        <i :class="getGroupIconClass(group.icon)" class="option-icon"></i>
        <span>{{ group.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.group-dropdown-wrapper {
  position: relative;
}

/* 分组徽章按钮 - 统一毛玻璃风格 */
.group-badge {
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
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15);
}

.group-badge:hover {
  background: rgba(0, 0, 0, 0.35);
  border-color: rgba(255, 255, 255, 0.18);
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

.group-dropdown-wrapper.open .switch-icon {
  transform: rotate(180deg);
}

/* 青蓝色（默认/站点） */
.color-cyan .group-badge {
  color: rgba(6, 182, 212, 0.95);
}

.color-cyan .group-badge:hover {
  border-color: rgba(6, 182, 212, 0.35);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15),
    0 0 12px -4px rgba(6, 182, 212, 0.3);
}

.color-cyan .group-option.active {
  background: rgba(6, 182, 212, 0.15);
  color: #06b6d4;
}

/* Docker 蓝色 */
.color-docker .group-badge {
  color: rgba(36, 150, 237, 0.95);
}

.color-docker .group-badge:hover {
  border-color: rgba(36, 150, 237, 0.35);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15),
    0 0 12px -4px rgba(36, 150, 237, 0.3);
}

.color-docker .group-option.active {
  background: rgba(36, 150, 237, 0.15);
  color: #2496ed;
}

/* Lucky服务绿色 */
.color-green .group-badge {
  color: rgba(16, 185, 129, 0.95);
}

.color-green .group-badge:hover {
  border-color: rgba(16, 185, 129, 0.35);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15),
    0 0 12px -4px rgba(16, 185, 129, 0.3);
}

.color-green .group-option.active {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

/* 下拉菜单 */
.group-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 140px;
  max-width: 200px;
  max-height: 280px;
  overflow-y: auto;
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

.group-dropdown-wrapper.open .group-dropdown {
  opacity: 1;
  visibility: visible;
  transform: scale(1);
}

/* 下拉选项 */
.group-option {
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
  overflow: hidden;
  text-overflow: ellipsis;
}

.group-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

.option-icon {
  width: 16px;
  text-align: center;
  font-size: 12px;
  flex-shrink: 0;
}

.group-option span {
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 浅色主题适配 */
[data-theme="light"] .group-badge {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 2px 8px -2px rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .group-badge:hover {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(0, 0, 0, 0.12);
}

[data-theme="light"] .group-dropdown {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

[data-theme="light"] .group-option {
  color: rgba(0, 0, 0, 0.75);
}

[data-theme="light"] .group-option:hover {
  background: rgba(0, 0, 0, 0.05);
}

/* 深色主题适配 */
[data-theme="dark"] .group-dropdown {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* 响应式 */
@media (max-width: 640px) {
  .group-badge {
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

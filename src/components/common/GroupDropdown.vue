<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { Group } from '@/types'

const props = defineProps<{
  groups: Group[]
  current: string | string[]  // 支持单选或多选
  color?: 'cyan' | 'docker' | 'green'
}>()

const emit = defineEmits<{
  change: [key: string | string[]]  // 单选/设置分组
  toggle: [key: string]  // 切换单个分组（多选模式）
}>()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 当前选中的分组（规范化为数组）
const selectedGroups = computed<string[]>(() => {
  const current = props.current
  if (current === 'all') return []
  if (Array.isArray(current)) return current
  return [current]
})

// 是否选中“全部”
const isAllSelected = computed(() => {
  return props.current === 'all' || selectedGroups.value.length === 0
})

// 检查分组是否被选中
function isGroupSelected(key: string): boolean {
  if (key === 'all') return isAllSelected.value
  return selectedGroups.value.includes(key)
}

// 获取显示文本
const displayText = computed(() => {
  if (isAllSelected.value) return '全部'
  const count = selectedGroups.value.length
  if (count === 1) {
    const group = props.groups.find(g => g.key === selectedGroups.value[0])
    return group?.name || '全部'
  }
  return `已选 ${count} 个分组`
})

// 获取显示图标
const displayIcon = computed(() => {
  if (isAllSelected.value || selectedGroups.value.length !== 1) {
    return 'fas fa-layer-group'
  }
  const group = props.groups.find(g => g.key === selectedGroups.value[0])
  return getGroupIconClass(group?.icon)
})

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

// 点击分组名称（单选模式）- 直接切换到该分组
function onGroupClick(key: string) {
  // 单选行为：直接设置为该分组
  if (key === 'all') {
    emit('change', 'all')
  } else {
    emit('change', [key])
  }
  isOpen.value = false
}

// 点击复选框（多选模式）- 切换选中状态
function onCheckboxClick(key: string, event: MouseEvent) {
  event.stopPropagation()
  emit('toggle', key)
  // 多选模式不关闭下拉菜单，方便继续选择
  // 但如果点击"全部"则关闭
  if (key === 'all') {
    isOpen.value = false
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
    v-if="groups.length > 1" 
    ref="dropdownRef"
    class="group-dropdown-wrapper"
    :class="[`color-${color || 'cyan'}`, { open: isOpen }]"
  >
    <button class="group-badge" @click="toggleDropdown">
      <i :class="displayIcon" class="badge-icon"></i>
      <span class="badge-text">{{ displayText }}</span>
      <i class="fas fa-caret-down switch-icon"></i>
    </button>
    
    <div class="group-dropdown">
      <!-- 全部选项 -->
      <button
        class="group-option"
        :class="{ active: isAllSelected }"
        @click="onGroupClick('all')"
      >
        <i class="fas fa-layer-group option-icon"></i>
        <span>全部</span>
      </button>
      
      <div class="dropdown-divider"></div>
      
      <!-- 其他分组选项 -->
      <div
        v-for="group in groups.filter(g => g.key !== 'all')"
        :key="group.key"
        class="group-option"
        :class="{ active: isGroupSelected(group.key) }"
      >
        <!-- 左侧：点击切换单选 -->
        <button class="option-main" @click="onGroupClick(group.key)">
          <i :class="getGroupIconClass(group.icon)" class="option-icon"></i>
          <span class="option-name">{{ group.name }}</span>
          <span v-if="group.count !== undefined" class="option-count">{{ group.count }}</span>
        </button>
        <!-- 右侧：复选框，点击切换多选 -->
        <button 
          class="option-checkbox"
          :class="{ checked: isGroupSelected(group.key) }"
          @click="onCheckboxClick(group.key, $event)"
          :title="isGroupSelected(group.key) ? '取消选中' : '添加到选中'"
        >
          <i v-if="isGroupSelected(group.key)" class="fas fa-check-square"></i>
          <i v-else class="far fa-square"></i>
        </button>
      </div>
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

.color-cyan .check-icon {
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

.color-docker .check-icon {
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

.color-green .check-icon {
  color: #10b981;
}

/* 下拉菜单 */
.group-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  left: 50%;
  min-width: 160px;
  max-width: 220px;
  max-height: 320px;
  overflow-y: auto;
  background: rgba(15, 20, 30, 0.92);
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
  transform: translateX(-50%) scale(0.95);
  transform-origin: top center;
  transition: all 0.15s ease;
  z-index: 100;
}

.group-dropdown-wrapper.open .group-dropdown {
  opacity: 1;
  visibility: visible;
  transform: translateX(-50%) scale(1);
}

/* 下拉选项容器 */
.group-option {
  display: flex;
  align-items: center;
  width: 100%;
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.85);
  font-size: 13px;
  transition: all 0.15s ease;
  overflow: hidden;
}

/* 全部选项（button形式） */
button.group-option {
  gap: 8px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  cursor: pointer;
}

button.group-option:hover {
  background: rgba(255, 255, 255, 0.08);
}

/* 分组选项主体（左侧可点击区域） */
.option-main {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  padding: 8px 8px 8px 12px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: inherit;
  cursor: pointer;
  overflow: hidden;
}

.option-main:hover {
  background: rgba(255, 255, 255, 0.08);
}

.option-icon {
  width: 16px;
  text-align: center;
  font-size: 12px;
  flex-shrink: 0;
}

.option-main span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.option-name {
  flex: 1;
}

.option-count {
  flex-shrink: 0;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.4);
  background: rgba(255, 255, 255, 0.08);
  padding: 1px 6px;
  border-radius: 8px;
  margin-left: 4px;
}

/* 右侧复选框 */
.option-checkbox {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 100%;
  min-height: 36px;
  padding: 0;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.4);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.option-checkbox:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.7);
}

.option-checkbox.checked {
  color: inherit;
}

/* 分割线 */
.dropdown-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
  margin: 4px 8px;
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
  background: rgba(255, 255, 255, 0.95);
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

[data-theme="light"] .dropdown-divider {
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .option-count {
  color: rgba(0, 0, 0, 0.45);
  background: rgba(0, 0, 0, 0.06);
}

[data-theme="light"] .option-main:hover {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="light"] .option-checkbox {
  color: rgba(0, 0, 0, 0.35);
}

[data-theme="light"] .option-checkbox:hover {
  background: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.6);
}

/* 素描浅色主题适配 */
[data-theme="sketch-light"] .group-badge {
  background: rgba(255, 255, 255, 0.5);
  border-color: rgba(100, 110, 120, 0.2);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.6),
    0 2px 8px -2px rgba(100, 110, 120, 0.1);
}

[data-theme="sketch-light"] .group-badge:hover {
  background: rgba(255, 255, 255, 0.65);
  border-color: rgba(100, 110, 120, 0.3);
}

[data-theme="sketch-light"] .group-dropdown {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(100, 110, 120, 0.15);
  box-shadow:
    0 8px 32px rgba(100, 110, 120, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

[data-theme="sketch-light"] .group-option {
  color: rgba(80, 90, 100, 0.85);
}

[data-theme="sketch-light"] button.group-option:hover {
  background: rgba(100, 110, 120, 0.06);
}

[data-theme="sketch-light"] .option-main:hover {
  background: rgba(100, 110, 120, 0.06);
}

[data-theme="sketch-light"] .dropdown-divider {
  background: rgba(100, 110, 120, 0.1);
}

[data-theme="sketch-light"] .option-count {
  color: rgba(100, 110, 120, 0.55);
  background: rgba(100, 110, 120, 0.08);
}

[data-theme="sketch-light"] .option-checkbox {
  color: rgba(100, 110, 120, 0.45);
}

[data-theme="sketch-light"] .option-checkbox:hover {
  background: rgba(100, 110, 120, 0.1);
  color: rgba(100, 110, 120, 0.7);
}

/* 素描深色主题适配 */
[data-theme="sketch-dark"] .group-dropdown {
  background: rgba(35, 30, 25, 0.95);
  border-color: rgba(255, 255, 255, 0.08);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.35),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
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

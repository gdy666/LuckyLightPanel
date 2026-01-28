<script setup lang="ts">
import { computed, ref, watch } from 'vue'

const props = withDefaults(defineProps<{
  modelValue: string
  placeholder?: string
  color?: 'cyan' | 'docker' | 'green'
}>(), {
  placeholder: '搜索...',
  color: 'cyan'
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// 输入框引用
const inputRef = ref<HTMLInputElement | null>(null)

// 本地值（用于输入防抖）
const localValue = ref(props.modelValue)

// 监听外部值变化
watch(() => props.modelValue, (newVal) => {
  localValue.value = newVal
})

// 是否显示清除按钮
const showClear = computed(() => localValue.value.length > 0)

// 颜色主题
const colorClass = computed(() => {
  switch (props.color) {
    case 'docker':
      return 'search-docker'
    case 'green':
      return 'search-green'
    default:
      return 'search-cyan'
  }
})

// 输入处理
function handleInput(e: Event) {
  const target = e.target as HTMLInputElement
  localValue.value = target.value
  emit('update:modelValue', target.value)
}

// 清除搜索
function clearSearch() {
  localValue.value = ''
  emit('update:modelValue', '')
  inputRef.value?.focus()
}
</script>

<template>
  <div class="search-box" :class="colorClass">
    <i class="fas fa-search search-icon"></i>
    <input
      ref="inputRef"
      type="text"
      class="search-input"
      :value="localValue"
      :placeholder="placeholder"
      @input="handleInput"
    />
    <button
      v-show="showClear"
      class="search-clear"
      @click="clearSearch"
      title="清除"
    >
      <i class="fas fa-times"></i>
    </button>
  </div>
</template>

<style scoped>
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  max-width: 280px;
  min-width: 120px;
}

.search-icon {
  position: absolute;
  left: 12px;
  font-size: 12px;
  pointer-events: none;
  transition: color 0.2s ease;
}

.search-input {
  width: 100%;
  height: 36px;
  padding: 0 36px;
  font-size: 13px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  outline: none;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  color: rgba(255, 255, 255, 0.9);
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 1px 0 rgba(255, 255, 255, 0.05);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.45);
}

.search-input:focus {
  background: rgba(0, 0, 0, 0.35);
  border-color: rgba(255, 255, 255, 0.2);
}

.search-clear {
  position: absolute;
  right: 8px;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 50%;
  cursor: pointer;
  transition: all 0.2s ease;
}

.search-clear:hover {
  background: rgba(255, 255, 255, 0.15);
}

.search-clear i {
  font-size: 11px;
}

/* Cyan 主题（站点） */
.search-cyan .search-icon {
  color: rgba(6, 182, 212, 0.8);
}

.search-cyan .search-input:focus {
  border-color: rgba(6, 182, 212, 0.5);
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(6, 182, 212, 0.15),
    0 0 12px -4px rgba(6, 182, 212, 0.3);
}

.search-cyan .search-clear {
  color: rgba(6, 182, 212, 0.8);
}

.search-cyan .search-clear:hover {
  color: #06b6d4;
  background: rgba(6, 182, 212, 0.15);
}

/* Docker 主题 */
.search-docker .search-icon {
  color: rgba(36, 150, 237, 0.8);
}

.search-docker .search-input:focus {
  border-color: rgba(36, 150, 237, 0.5);
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(36, 150, 237, 0.15),
    0 0 12px -4px rgba(36, 150, 237, 0.3);
}

.search-docker .search-clear {
  color: rgba(36, 150, 237, 0.8);
}

.search-docker .search-clear:hover {
  color: #2496ed;
  background: rgba(36, 150, 237, 0.15);
}

/* Green 主题（Lucky服务） */
.search-green .search-icon {
  color: rgba(16, 185, 129, 0.8);
}

.search-green .search-input:focus {
  border-color: rgba(16, 185, 129, 0.5);
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.1),
    0 0 0 2px rgba(16, 185, 129, 0.15),
    0 0 12px -4px rgba(16, 185, 129, 0.3);
}

.search-green .search-clear {
  color: rgba(16, 185, 129, 0.8);
}

.search-green .search-clear:hover {
  color: #10b981;
  background: rgba(16, 185, 129, 0.15);
}

/* 浅色主题适配 */
[data-theme="light"] .search-input {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.08);
  color: rgba(0, 0, 0, 0.85);
  box-shadow: 
    inset 0 1px 2px rgba(0, 0, 0, 0.05),
    0 1px 0 rgba(255, 255, 255, 0.8);
}

[data-theme="light"] .search-input::placeholder {
  color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .search-input:focus {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(0, 0, 0, 0.12);
}

[data-theme="light"] .search-clear:hover {
  background: rgba(0, 0, 0, 0.08);
}

/* 响应式 */
@media (max-width: 640px) {
  .search-box {
    max-width: 160px;
    min-width: 100px;
  }
  
  .search-input {
    height: 32px;
    font-size: 12px;
    padding: 0 32px;
  }
  
  .search-icon {
    left: 10px;
    font-size: 11px;
  }
  
  .search-clear {
    right: 6px;
    width: 20px;
    height: 20px;
  }
  
  .search-clear i {
    font-size: 10px;
  }
}
</style>

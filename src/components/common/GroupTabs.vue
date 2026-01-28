<script setup lang="ts">
import type { Group } from '@/types'

defineProps<{
  groups: Group[]
  current: string
  color?: 'cyan' | 'docker' | 'green'
}>()

const emit = defineEmits<{
  change: [key: string]
}>()

// 获取分组图标类名
function getGroupIconClass(icon?: string): string {
  if (!icon) return 'fas fa-folder'
  if (icon.startsWith('fa-') || icon.startsWith('fas ') || icon.startsWith('far ') || icon.startsWith('fab ')) {
    return icon.startsWith('fa-') ? `fas ${icon}` : icon
  }
  return `fas fa-${icon}`
}
</script>

<template>
  <div v-if="groups.length > 2" class="group-tabs-wrapper">
    <div class="group-tabs">
      <button
        v-for="group in groups"
        :key="group.key"
        class="group-tab"
        :class="[
          { active: current === group.key },
          `color-${color || 'cyan'}`
        ]"
        @click="emit('change', group.key)"
      >
        <i :class="getGroupIconClass(group.icon)" class="group-icon"></i>
        <span>{{ group.name }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.group-tabs-wrapper {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 12px;
}

.group-tabs {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 4px;
  padding: 4px;
  background: hsl(var(--glass-bg));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  border: 1px solid hsl(var(--glass-border));
  border-radius: 14px;
}

.group-tab {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 10px;
  color: hsl(var(--text-secondary));
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.group-tab .group-icon {
  font-size: 12px;
}

.group-tab:hover {
  background: hsl(var(--glass-bg-hover));
  color: hsl(var(--text-primary));
}

/* 青蓝色（默认/站点） */
.group-tab.color-cyan.active {
  background: linear-gradient(135deg, hsl(var(--neon-cyan)) 0%, hsl(var(--neon-blue)) 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(0, 255, 255, 0.25);
}

/* Docker 蓝色 */
.group-tab.color-docker.active {
  background: linear-gradient(135deg, #2496ed 0%, #0db7ed 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(36, 150, 237, 0.3);
}

/* Lucky服务绿色 */
.group-tab.color-green.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: #fff;
  box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
}

@media (max-width: 640px) {
  .group-tab {
    padding: 5px 10px;
    font-size: 12px;
  }
}
</style>

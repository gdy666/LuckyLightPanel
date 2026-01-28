<script setup lang="ts">
import { computed, watch } from 'vue'
import { useConfigStore } from '@/stores/config'
import { useNavStore } from '@/stores/nav'
import { Globe, Container, Server } from 'lucide-vue-next'
import type { TabType } from '@/types'

const configStore = useConfigStore()
const navStore = useNavStore()

// 可用的标签页（启用且有数据才显示）
const availableTabs = computed(() => {
  const tabs: { key: TabType; label: string; icon: typeof Globe }[] = []
  
  // 站点：启用且有数据
  if (navStore.sitesEnabled && navStore.allSites.length > 0) {
    tabs.push({ key: 'sites', label: '站点', icon: Globe })
  }
  // Docker：启用且有数据
  if (navStore.dockerEnabled && navStore.allContainers.length > 0) {
    tabs.push({ key: 'docker', label: 'Docker', icon: Container })
  }
  // Lucky 服务：启用且有数据
  if (navStore.luckyServicesEnabled && navStore.allLuckyServices.length > 0) {
    tabs.push({ key: 'luckyServices', label: 'Lucky 服务', icon: Server })
  }
  
  return tabs
})

// 当前标签页
const currentTab = computed(() => configStore.currentTab)

// 切换标签页
function switchTab(tab: TabType) {
  configStore.setCurrentTab(tab)
}

// 监听标签页变化，控制数据轮询
watch(currentTab, (newTab: TabType) => {
  navStore.stopDockerStatsPolling()
  navStore.stopLuckyServicesStatsPolling()

  if (newTab === 'docker' && navStore.dockerEnabled) {
    navStore.startDockerStatsPolling()
  } else if (newTab === 'luckyServices' && navStore.luckyServicesEnabled) {
    navStore.startLuckyServicesStatsPolling()
  }
}, { immediate: true })
</script>

<template>
  <div v-if="availableTabs.length > 1" class="content-tabs-wrapper">
    <div class="content-tabs">
      <button
        v-for="tab in availableTabs"
        :key="tab.key"
        class="content-tab"
        :class="[
          { active: currentTab === tab.key },
          `tab-${tab.key}`
        ]"
        :data-tab="tab.key"
        @click="switchTab(tab.key)"
      >
        <component :is="tab.icon" class="tab-icon" />
        <span>{{ tab.label }}</span>
      </button>
    </div>
  </div>
</template>

<style scoped>
/* 标签页容器包装器 */
.content-tabs-wrapper {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

/* 标签页容器 - 参考静态版本的玻璃效果 */
.content-tabs {
  display: flex;
  gap: 6px;
  padding: 5px;
  background: hsl(var(--glass-bg));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturation));
  border: 1px solid hsl(var(--glass-border));
  border-radius: 16px;
  box-shadow: 
    0 8px 32px rgba(31, 38, 135, 0.15),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 单个标签按钮 */
.content-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border: none;
  background: transparent;
  border-radius: 10px;
  color: hsl(var(--text-secondary));
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.content-tab .tab-icon {
  width: 18px;
  height: 18px;
  transition: color 0.2s ease;
}

/* 悬停状态 */
.content-tab:hover {
  background: hsl(var(--glass-bg-hover));
  color: hsl(var(--text-primary));
}

/* 激活状态 - 默认（站点） */
.content-tab.active {
  background: linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary-dark)) 100%);
  color: #fff;
  box-shadow: 0 4px 12px rgba(0, 140, 255, 0.35);
}

.content-tab.active .tab-icon {
  color: #fff;
}

/* Docker 标签特殊样式 */
.content-tab.tab-docker .tab-icon {
  color: #2496ed;
}

.content-tab.tab-docker.active {
  background: linear-gradient(135deg, #2496ed 0%, #0db7ed 100%);
  box-shadow: 0 4px 12px rgba(36, 150, 237, 0.35);
}

.content-tab.tab-docker.active .tab-icon {
  color: #fff;
}

/* Lucky服务标签特殊样式 */
.content-tab.tab-luckyServices .tab-icon {
  color: #10b981;
}

.content-tab.tab-luckyServices.active {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.35);
}

.content-tab.tab-luckyServices.active .tab-icon {
  color: #fff;
}

/* 深色主题适配 */
[data-theme="dark"] .content-tabs {
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.03);
}

/* 响应式：小屏幕隐藏文字 */
@media (max-width: 640px) {
  .content-tab {
    padding: 6px 10px;
  }
  
  .content-tab span {
    display: none;
  }
}
</style>

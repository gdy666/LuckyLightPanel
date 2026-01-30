<script setup lang="ts">
import { computed, watch, nextTick, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavStore } from '@/stores/nav'
import { useConfigStore } from '@/stores/config'
import DockerCard from './DockerCard.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import GroupDropdown from '@/components/common/GroupDropdown.vue'
import DockerLayoutSwitcher from './DockerLayoutSwitcher.vue'
import DockerOverview from './DockerOverview.vue'
import type { DockerContainer, Group } from '@/types'

const navStore = useNavStore()
const configStore = useConfigStore()
const { searchKeywords } = storeToRefs(configStore)

// 搜索关键字
const searchKeyword = computed({
  get: () => searchKeywords.value.docker,
  set: (val: string) => {
    searchKeywords.value.docker = val
  }
})

// 搜索过滤函数
function matchSearch(container: DockerContainer, keyword: string): boolean {
  if (!keyword) return true
  const kw = keyword.toLowerCase()
  return (
    container.containerName.toLowerCase().includes(kw) ||
    (container.displayName?.toLowerCase().includes(kw) ?? false) ||
    (container.description?.toLowerCase().includes(kw) ?? false)
  )
}

// 筛选后的容器列表（用于多选分组模式）
const filteredContainers = computed(() => {
  let containers = navStore.allContainers
  
  // 按分组筛选（支持多选）
  const selectedGroups = configStore.currentGroupArray
  if (selectedGroups.length > 0) {
    containers = containers.filter((c: DockerContainer) => c.groupKey && selectedGroups.includes(c.groupKey))
  }
  
  // 按搜索关键字筛选
  const kw = searchKeyword.value
  if (kw) {
    containers = containers.filter((c: DockerContainer) => matchSearch(c, kw))
  }
  
  return containers
})

// 按分组组织的容器（用于全部模式或多选分组模式）
const groupedContainers = computed(() => {
  const result: { group: Group; containers: DockerContainer[] }[] = []
  const allContainers = navStore.allContainers
  const kw = searchKeyword.value
  const selectedGroups = configStore.currentGroupArray
  
  // 确定要显示的分组
  const groupsToShow = selectedGroups.length > 0
    ? navStore.dockerGroups.filter((g: Group) => selectedGroups.includes(g.key))
    : navStore.dockerGroups
  
  for (const group of groupsToShow) {
    let containers = allContainers.filter((c: DockerContainer) => c.groupKey === group.key)
    // 按搜索关键字筛选
    if (kw) {
      containers = containers.filter((c: DockerContainer) => matchSearch(c, kw))
    }
    if (containers.length > 0) {
      result.push({ group, containers })
    }
  }
  
  return result
})

// 分组列表（只显示有容器的分组）
const groups = computed(() => {
  const allContainers = navStore.allContainers
  const nonEmptyGroups = navStore.dockerGroups.filter((g: Group) => 
    allContainers.some((c: DockerContainer) => c.groupKey === g.key)
  )
  return [
    { key: 'all', name: '全部', icon: '' },
    ...nonEmptyGroups
  ]
})

// 监听分组列表变化，如果当前分组不存在则自动切换到全部
watch(groups, (newGroups) => {
  const currentGroup = configStore.currentGroup
  if (currentGroup !== 'all') {
    const exists = newGroups.some(g => g.key === currentGroup)
    if (!exists) {
      configStore.resetCurrentTabGroup()
    }
  }
}, { immediate: true })

// 网格类名（根据布局模式）
const gridClass = computed(() => {
  const layout = configStore.dockerLayout
  switch (layout) {
    case 'compact':
      return 'docker-grid compact'
    case 'list':
      return 'docker-grid list'
    case 'minimal':
      return 'docker-grid minimal'
    default: // normal
      return 'docker-grid normal'
  }
})

// ============ 列表布局宽度对齐逻辑 ============
// 各字段最大宽度
const listMaxWidths = reactive({
  status: 0,    // 状态标签
  cpu: 0,       // CPU
  memory: 0,    // 内存
  networkRx: 0, // 下载速度
  networkTx: 0  // 上传速度
})

// 计算列表布局各字段最大宽度
const calcListMaxWidths = () => {
  if (configStore.dockerLayout !== 'list') return
  
  nextTick(() => {
    // 重置所有宽度为 auto，收集自然宽度
    let statusMax = 0
    let cpuMax = 0
    let memoryMax = 0
    let networkRxMax = 0
    let networkTxMax = 0
    
    // 状态标签
    const statusEls = document.querySelectorAll('.list-status-badge')
    statusEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      statusMax = Math.max(statusMax, el.offsetWidth)
      el.style.width = original
    })
    
    // CPU 统计
    const cpuEls = document.querySelectorAll('.list-stat-cpu')
    cpuEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      cpuMax = Math.max(cpuMax, el.offsetWidth)
      el.style.width = original
    })
    
    // 内存统计
    const memoryEls = document.querySelectorAll('.list-stat-memory')
    memoryEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      memoryMax = Math.max(memoryMax, el.offsetWidth)
      el.style.width = original
    })
    
    // 下载速度
    const rxEls = document.querySelectorAll('.list-stat-rx')
    rxEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      networkRxMax = Math.max(networkRxMax, el.offsetWidth)
      el.style.width = original
    })
    
    // 上传速度
    const txEls = document.querySelectorAll('.list-stat-tx')
    txEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      networkTxMax = Math.max(networkTxMax, el.offsetWidth)
      el.style.width = original
    })
    
    // 更新最大宽度（添加少量 padding）
    if (statusMax > 0) listMaxWidths.status = statusMax + 4
    if (cpuMax > 0) listMaxWidths.cpu = cpuMax + 4
    if (memoryMax > 0) listMaxWidths.memory = memoryMax + 4
    if (networkRxMax > 0) listMaxWidths.networkRx = networkRxMax + 4
    if (networkTxMax > 0) listMaxWidths.networkTx = networkTxMax + 4
  })
}

// 监听布局变化、容器数据变化重新计算宽度
watch(
  () => configStore.dockerLayout,
  (newLayout) => {
    if (newLayout === 'list') {
      // 延迟计算，确保 DOM 已更新
      setTimeout(calcListMaxWidths, 100)
    }
  }
)

watch(
  () => navStore.allContainers,
  () => {
    if (configStore.dockerLayout === 'list') {
      setTimeout(calcListMaxWidths, 100)
    }
  },
  { deep: true }
)

// 监听容器统计数据变化
watch(
  () => navStore.dockerStats,
  () => {
    if (configStore.dockerLayout === 'list') {
      setTimeout(calcListMaxWidths, 50)
    }
  },
  { deep: true }
)

onMounted(() => {
  if (configStore.dockerLayout === 'list') {
    setTimeout(calcListMaxWidths, 200)
  }
})

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
  <div class="docker-section">
    <!-- 分组筛选 -->
    <div class="filter-bar">
      <SearchBox
        v-model="searchKeyword"
        placeholder="搜索容器..."
        color="docker"
      />
      <div class="filter-bar-right">
        <GroupDropdown
          :groups="groups"
          :current="configStore.currentGroup"
          color="docker"
          @change="configStore.setCurrentGroup"
          @toggle="configStore.toggleGroup"
        />
        <DockerOverview />
        <DockerLayoutSwitcher />
      </div>
    </div>

    <!-- 全部模式或多选分组模式：按分组显示 -->
    <template v-if="configStore.isAllSelected || configStore.currentGroupArray.length > 1">
      <div 
        v-for="(item, index) in groupedContainers" 
        :key="item.group.key" 
        class="group-section"
        :class="{ 'has-margin': index < groupedContainers.length - 1 }"
      >
        <!-- 分组标题 -->
        <h3 class="group-title">
          <i :class="getGroupIconClass(item.group.icon)" class="group-icon"></i>
          <span>{{ item.group.name }}</span>
          <span class="group-count">({{ item.containers.length }})</span>
        </h3>
        <!-- 容器网格 -->
        <div :class="gridClass">
          <DockerCard
            v-for="container in item.containers"
            :key="container.key"
            :container="container"
            :list-max-widths="listMaxWidths"
            class="animate-fade-in-up"
          />
        </div>
      </div>
      <!-- 空状态 -->
      <div v-if="groupedContainers.length === 0" class="empty-state">
        <div class="empty-icon">
          <span>📦</span>
        </div>
        <p class="empty-text">暂无 Docker 容器</p>
      </div>
    </template>

    <!-- 单个分组模式（只选了一个分组） -->
    <template v-else>
      <!-- Docker 容器网格 -->
      <div :class="gridClass">
        <DockerCard
          v-for="container in filteredContainers"
          :key="container.key"
          :container="container"
          :list-max-widths="listMaxWidths"
          class="animate-fade-in-up"
        />
      </div>
      <!-- 空状态 -->
      <div v-if="filteredContainers.length === 0" class="empty-state">
        <div class="empty-icon">
          <span>📦</span>
        </div>
        <p class="empty-text">暂无 Docker 容器</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.docker-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.filter-bar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.group-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-section.has-margin {
  margin-bottom: 1rem;
}

.group-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(var(--text-secondary));
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.group-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.group-count {
  font-size: 0.875rem;
  color: hsl(var(--text-muted));
  font-weight: 400;
}

/* ============ Docker 网格布局 ============ */
.docker-grid {
  display: grid;
  gap: 1rem;
}

/* Normal 布局 - 详情卡片 */
.docker-grid.normal {
  grid-template-columns: repeat(1, 1fr);
}

@media (min-width: 640px) {
  .docker-grid.normal { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .docker-grid.normal { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1280px) {
  .docker-grid.normal { grid-template-columns: repeat(4, 1fr); }
}

/* Compact 布局 - 紧凑显示更多 */
.docker-grid.compact {
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .docker-grid.compact { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 640px) {
  .docker-grid.compact { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 768px) {
  .docker-grid.compact { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1024px) {
  .docker-grid.compact { grid-template-columns: repeat(5, 1fr); }
}

@media (min-width: 1280px) {
  .docker-grid.compact { grid-template-columns: repeat(6, 1fr); }
}

/* List 布局 - 列表展示 */
.docker-grid.list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

/* Minimal 布局 - 极简显示最多 */
.docker-grid.minimal {
  grid-template-columns: repeat(3, 1fr);
  gap: 0.625rem;
}

@media (min-width: 480px) {
  .docker-grid.minimal { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 640px) {
  .docker-grid.minimal { grid-template-columns: repeat(5, 1fr); }
}

@media (min-width: 768px) {
  .docker-grid.minimal { grid-template-columns: repeat(6, 1fr); }
}

@media (min-width: 1024px) {
  .docker-grid.minimal { grid-template-columns: repeat(8, 1fr); }
}

@media (min-width: 1280px) {
  .docker-grid.minimal { grid-template-columns: repeat(10, 1fr); }
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 4rem 0;
}

.empty-icon {
  width: 4rem;
  height: 4rem;
  margin: 0 auto 1rem;
  border-radius: 1rem;
  background: rgba(255, 255, 255, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-icon span {
  font-size: 1.875rem;
}

.empty-text {
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.875rem;
}
</style>

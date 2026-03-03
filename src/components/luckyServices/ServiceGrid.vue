<script setup lang="ts">
import { computed, watch, nextTick, onMounted, reactive } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavStore } from '@/stores/nav'
import { useConfigStore } from '@/stores/config'
import ServiceCard from './ServiceCard.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import GroupDropdown from '@/components/common/GroupDropdown.vue'
import ServiceLayoutSwitcher from './ServiceLayoutSwitcher.vue'
import type { LuckyService, Group } from '@/types'

const navStore = useNavStore()
const configStore = useConfigStore()
const { searchKeywords } = storeToRefs(configStore)

// 搜索关键字
const searchKeyword = computed({
  get: () => searchKeywords.value.luckyServices,
  set: (val: string) => {
    searchKeywords.value.luckyServices = val
  }
})

// 搜索过滤函数
function matchSearch(service: LuckyService, keyword: string): boolean {
  if (!keyword) return true
  const kw = keyword.toLowerCase()
  return (
    service.name.toLowerCase().includes(kw) ||
    (service.displayName?.toLowerCase().includes(kw) ?? false) ||
    (service.description?.toLowerCase().includes(kw) ?? false)
  )
}

// 筛选后的服务列表（用于多选分组模式）
const filteredServices = computed(() => {
  let services = navStore.allLuckyServices
  
  // 按分组筛选（支持多选）
  const selectedGroups = configStore.currentGroupArray
  if (selectedGroups.length > 0) {
    services = services.filter((s: LuckyService) => s.groupKey && selectedGroups.includes(s.groupKey))
  }
  
  // 按搜索关键字筛选
  const kw = searchKeyword.value
  if (kw) {
    services = services.filter((s: LuckyService) => matchSearch(s, kw))
  }
  
  return services
})

// 按分组组织的服务（用于全部模式或多选分组模式）
const groupedServices = computed(() => {
  const result: { group: Group; services: LuckyService[] }[] = []
  const allServices = navStore.allLuckyServices
  const kw = searchKeyword.value
  const selectedGroups = configStore.currentGroupArray
  
  // 确定要显示的分组
  const groupsToShow = selectedGroups.length > 0
    ? navStore.luckyServicesGroups.filter((g: Group) => selectedGroups.includes(g.key))
    : navStore.luckyServicesGroups
  
  for (const group of groupsToShow) {
    let services = allServices.filter((s: LuckyService) => s.groupKey === group.key)
    // 按搜索关键字筛选
    if (kw) {
      services = services.filter((s: LuckyService) => matchSearch(s, kw))
    }
    if (services.length > 0) {
      result.push({ group, services })
    }
  }
  
  return result
})

// 分组列表（只显示有服务的分组，并统计数量）
const groups = computed(() => {
  const allServices = navStore.allLuckyServices
  const groupsWithCount = navStore.luckyServicesGroups
    .map((g: Group) => {
      const count = allServices.filter((s: LuckyService) => s.groupKey === g.key).length
      return { ...g, count }
    })
    .filter(g => g.count > 0)
  return [
    { key: 'all', name: '全部', icon: '', count: allServices.length },
    ...groupsWithCount
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
  const layout = configStore.luckyServicesLayout
  switch (layout) {
    case 'compact':
      return 'service-grid compact'
    case 'list':
      return 'service-grid list'
    case 'minimal':
      return 'service-grid minimal'
    default: // normal
      return 'service-grid normal'
  }
})

// ============ 列表布局宽度对齐逻辑 ============
// 各字段最大宽度
const listMaxWidths = reactive({
  status: 0,     // 状态标签
  type: 0,       // 类型标签
  trafficIn: 0,  // 入站流量
  trafficOut: 0  // 出站流量
})

// 计算列表布局各字段最大宽度
const calcListMaxWidths = () => {
  if (configStore.luckyServicesLayout !== 'list') return
  
  nextTick(() => {
    // 重置所有宽度为 auto，收集自然宽度
    let statusMax = 0
    let typeMax = 0
    let trafficInMax = 0
    let trafficOutMax = 0
    
    // 状态标签
    const statusEls = document.querySelectorAll('.list-status-badge')
    statusEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      statusMax = Math.max(statusMax, el.offsetWidth)
      el.style.width = original
    })
    
    // 类型标签
    const typeEls = document.querySelectorAll('.list-type-badge')
    typeEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      typeMax = Math.max(typeMax, el.offsetWidth)
      el.style.width = original
    })
    
    // 入站流量
    const inEls = document.querySelectorAll('.list-stat-in')
    inEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      trafficInMax = Math.max(trafficInMax, el.offsetWidth)
      el.style.width = original
    })
    
    // 出站流量
    const outEls = document.querySelectorAll('.list-stat-out')
    outEls.forEach((el: any) => {
      const original = el.style.width
      el.style.width = 'auto'
      trafficOutMax = Math.max(trafficOutMax, el.offsetWidth)
      el.style.width = original
    })
    
    // 更新最大宽度（添加少量 padding）
    if (statusMax > 0) listMaxWidths.status = statusMax + 4
    if (typeMax > 0) listMaxWidths.type = typeMax + 4
    if (trafficInMax > 0) listMaxWidths.trafficIn = trafficInMax + 4
    if (trafficOutMax > 0) listMaxWidths.trafficOut = trafficOutMax + 4
  })
}

// 监听布局变化、服务数据变化重新计算宽度
watch(
  () => configStore.luckyServicesLayout,
  (newLayout) => {
    if (newLayout === 'list') {
      // 延迟计算，确保 DOM 已更新
      setTimeout(calcListMaxWidths, 100)
    }
  }
)

watch(
  () => navStore.allLuckyServices,
  () => {
    if (configStore.luckyServicesLayout === 'list') {
      setTimeout(calcListMaxWidths, 100)
    }
  },
  { deep: true }
)

// 监听服务统计数据变化
watch(
  () => navStore.luckyServicesStats,
  () => {
    if (configStore.luckyServicesLayout === 'list') {
      setTimeout(calcListMaxWidths, 50)
    }
  },
  { deep: true }
)

onMounted(() => {
  if (configStore.luckyServicesLayout === 'list') {
    setTimeout(calcListMaxWidths, 200)
  }
})

</script>

<template>
  <div class="service-section">
    <!-- 分组筛选 -->
    <div class="filter-bar">
      <SearchBox
        v-model="searchKeyword"
        placeholder="搜索服务..."
        color="green"
      />
      <div class="filter-bar-right">
        <GroupDropdown
          :groups="groups"
          :current="configStore.currentGroup"
          color="green"
          @change="configStore.setCurrentGroup"
          @toggle="configStore.toggleGroup"
        />
        <ServiceLayoutSwitcher />
      </div>
    </div>

    <!-- 全部模式或多选分组模式：按分组显示 -->
    <template v-if="configStore.isAllSelected || configStore.currentGroupArray.length > 1">
      <div 
        v-for="(item, index) in groupedServices" 
        :key="item.group.key" 
        class="group-section"
        :class="{ 'has-margin': index < groupedServices.length - 1 }"
      >
        <!-- 分组标题 -->
        <h3 class="group-title">{{ item.group.name }}</h3>
        <!-- 服务网格 -->
        <div :class="gridClass">
          <ServiceCard
            v-for="service in item.services"
            :key="service.key"
            :service="service"
            :list-max-widths="listMaxWidths"
            class="animate-fade-in-up"
          />
        </div>
      </div>
      <!-- 空状态 -->
      <div v-if="groupedServices.length === 0" class="empty-state">
        <div class="empty-icon">
          <span>🔧</span>
        </div>
        <p class="empty-text">暂无 Lucky 服务</p>
      </div>
    </template>

    <!-- 单个分组模式（只选了一个分组） -->
    <template v-else>
      <!-- Lucky 服务网格 -->
      <div :class="gridClass">
        <ServiceCard
          v-for="service in filteredServices"
          :key="service.key"
          :service="service"
          :list-max-widths="listMaxWidths"
          class="animate-fade-in-up"
        />
      </div>
      <!-- 空状态 -->
      <div v-if="filteredServices.length === 0" class="empty-state">
        <div class="empty-icon">
          <span>🔧</span>
        </div>
        <p class="empty-text">暂无 Lucky 服务</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.service-section {
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
  min-width: 0;
}

.filter-bar-right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}

@media (max-width: 480px) {
  .filter-bar {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }
  
  .filter-bar :deep(.search-box) {
    max-width: none;
    width: 100%;
  }
  
  .filter-bar-right {
    justify-content: space-evenly;
    gap: 0.5rem;
  }
}

.group-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.group-section.has-margin {
  margin-bottom: 1rem;
}

@media (max-width: 480px) {
  .group-section {
    gap: 0.5rem;
  }
  
  .group-section.has-margin {
    margin-bottom: 0.5rem;
  }
}

.group-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: hsl(var(--text-secondary));
}

/* 深色主题分组标题 - 提高亮度增强可读性 */
[data-theme="dark"] .group-title {
  color: hsl(210 40% 85%);
}

/* 素描深色主题分组标题 */
[data-theme="sketch-dark"] .group-title {
  color: hsl(40 12% 80%);
}

/* ============ 服务网格布局 ============ */
.service-grid {
  display: grid;
  gap: clamp(0.75rem, 2vw, 1rem);
}

/* Normal 布局 - 使用 auto-fill 实现更流畅的响应式 */
.service-grid.normal {
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
}

/* Compact 布局 - 紧凑显示更多 */
.service-grid.compact {
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: clamp(0.5rem, 1.5vw, 0.75rem);
}

/* List 布局 - 列表展示 */
.service-grid.list {
  display: flex;
  flex-direction: column;
  gap: 0.625rem;
}

/* 大屏幕下列表模式使用双列 */
@media (min-width: 1600px) {
  .service-grid.list {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.625rem 1.5rem;
  }
}

/* Minimal 布局 - 极简显示最多 */
.service-grid.minimal {
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: clamp(0.5rem, 1.5vw, 0.625rem);
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

/* 浅色主题适配 */
[data-theme="light"] .empty-icon {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .empty-text {
  color: rgba(0, 0, 0, 0.45);
}

/* 素描浅色主题适配 */
[data-theme="sketch-light"] .empty-icon {
  background: rgba(0, 0, 0, 0.05);
}

[data-theme="sketch-light"] .empty-text {
  color: rgba(100, 110, 120, 0.5);
}
</style>

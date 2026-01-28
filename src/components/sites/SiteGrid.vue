<script setup lang="ts">
import { computed, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useNavStore } from '@/stores/nav'
import { useConfigStore } from '@/stores/config'
import SiteCard from './SiteCard.vue'
import SearchBox from '@/components/common/SearchBox.vue'
import GroupDropdown from '@/components/common/GroupDropdown.vue'
import NetworkModeDropdown from '@/components/common/NetworkModeDropdown.vue'
import LayoutSwitcher from '@/components/common/LayoutSwitcher.vue'
import type { Site, Group } from '@/types'

const navStore = useNavStore()
const configStore = useConfigStore()
const { searchKeywords } = storeToRefs(configStore)

// 搜索关键字
const searchKeyword = computed({
  get: () => searchKeywords.value.sites,
  set: (val: string) => {
    searchKeywords.value.sites = val
  }
})

// 搜索过滤函数
function matchSearch(site: Site, keyword: string): boolean {
  if (!keyword) return true
  const kw = keyword.toLowerCase()
  
  // 匹配名称
  if (site.name.toLowerCase().includes(kw)) return true
  
  // 匹配描述
  if (site.description?.toLowerCase().includes(kw)) return true
  
  // 匹配外网链接
  if (site.frontendUrls?.some(url => url.toLowerCase().includes(kw))) return true
  
  // 匹配内网链接
  if (site.backendUrls?.some(url => url.toLowerCase().includes(kw))) return true
  
  return false
}

// 筛选后的站点列表（用于单个分组模式）
const filteredSites = computed(() => {
  let sites = navStore.allSites
  
  // 按分组筛选
  if (configStore.currentGroup !== 'all') {
    sites = sites.filter((s: Site) => s.groupKey === configStore.currentGroup)
  }
  
  // 按搜索关键字筛选
  const kw = searchKeyword.value
  if (kw) {
    sites = sites.filter((s: Site) => matchSearch(s, kw))
  }
  
  return sites
})

// 按分组组织的站点（用于全部模式）
const groupedSites = computed(() => {
  const result: { group: Group; sites: Site[] }[] = []
  const allSites = navStore.allSites
  const kw = searchKeyword.value
  
  for (const group of navStore.siteGroups) {
    let sites = allSites.filter((s: Site) => s.groupKey === group.key)
    // 按搜索关键字筛选
    if (kw) {
      sites = sites.filter((s: Site) => matchSearch(s, kw))
    }
    if (sites.length > 0) {
      result.push({ group, sites })
    }
  }
  
  return result
})

// 分组列表（只显示有站点的分组）
const groups = computed(() => {
  const allSites = navStore.allSites
  const nonEmptyGroups = navStore.siteGroups.filter((g: Group) => 
    allSites.some((s: Site) => s.groupKey === g.key)
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
  const layout = configStore.layout
  switch (layout) {
    case 'compact':
      return 'site-grid compact'
    case 'large':
      return 'site-grid large'
    case 'list':
      return 'site-grid list'
    case 'minimal':
      return 'site-grid minimal'
    default: // normal
      return 'site-grid normal'
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
  <div class="site-section">
    <!-- 分组筛选 -->
    <div class="filter-bar">
      <SearchBox
        v-model="searchKeyword"
        placeholder="搜索站点..."
        color="cyan"
      />
      <div class="filter-bar-right">
        <GroupDropdown
          :groups="groups"
          :current="configStore.currentGroup"
          color="cyan"
          @change="configStore.setCurrentGroup"
        />
        <NetworkModeDropdown />
        <LayoutSwitcher />
      </div>
    </div>

    <!-- 全部模式：按分组显示 -->
    <template v-if="configStore.currentGroup === 'all'">
      <div 
        v-for="(item, index) in groupedSites" 
        :key="item.group.key" 
        class="group-section"
        :class="{ 'has-margin': index < groupedSites.length - 1 }"
      >
        <!-- 分组标题 -->
        <h3 class="group-title">
          <i :class="getGroupIconClass(item.group.icon)" class="group-icon"></i>
          <span>{{ item.group.name }}</span>
          <span class="group-count">({{ item.sites.length }})</span>
        </h3>
        <!-- 站点网格 -->
        <div :class="gridClass">
          <SiteCard
            v-for="(site, idx) in item.sites"
            :key="site.key"
            :site="site"
            class="animate-fade-in-up"
            :style="{ animationDelay: `${idx * 50}ms` }"
          />
        </div>
      </div>
      <!-- 空状态 -->
      <div v-if="groupedSites.length === 0" class="empty-state">
        <div class="empty-icon">
          <span>📂</span>
        </div>
        <p class="empty-text">暂无站点</p>
      </div>
    </template>

    <!-- 单个分组模式 -->
    <template v-else>
      <!-- 站点网格 -->
      <div :class="gridClass">
        <SiteCard
          v-for="(site, index) in filteredSites"
          :key="site.key"
          :site="site"
          class="animate-fade-in-up"
          :style="{ animationDelay: `${index * 50}ms` }"
        />
      </div>
      <!-- 空状态 -->
      <div v-if="filteredSites.length === 0" class="empty-state">
        <div class="empty-icon">
          <span>📂</span>
        </div>
        <p class="empty-text">暂无站点</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.site-section {
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
  color: rgba(255, 255, 255, 0.9);
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
  color: rgba(255, 255, 255, 0.4);
  font-weight: 400;
}

/* 网格布局 */
.site-grid {
  display: grid;
  gap: 1rem;
}

/* Normal 布局 - 移动端2列 */
.site-grid.normal {
  grid-template-columns: repeat(2, 1fr);
}

@media (min-width: 640px) {
  .site-grid.normal { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 768px) {
  .site-grid.normal { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 1024px) {
  .site-grid.normal { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 1280px) {
  .site-grid.normal { grid-template-columns: repeat(5, 1fr); }
}

/* Compact 布局 - 紧凑显示更多 */
.site-grid.compact {
  grid-template-columns: repeat(2, 1fr);
  gap: 0.625rem;
}

@media (min-width: 480px) {
  .site-grid.compact { grid-template-columns: repeat(3, 1fr); }
}

@media (min-width: 640px) {
  .site-grid.compact { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 768px) {
  .site-grid.compact { grid-template-columns: repeat(5, 1fr); }
}

@media (min-width: 1024px) {
  .site-grid.compact { grid-template-columns: repeat(6, 1fr); }
}

@media (min-width: 1280px) {
  .site-grid.compact { grid-template-columns: repeat(8, 1fr); }
}

/* Large 布局（保留向后兼容）*/
.site-grid.large {
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

@media (min-width: 640px) {
  .site-grid.large { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1024px) {
  .site-grid.large { grid-template-columns: repeat(3, 1fr); }
}

/* List 布局 */
.site-grid.list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

/* Minimal 布局 - 极简显示最多 */
.site-grid.minimal {
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}

@media (min-width: 480px) {
  .site-grid.minimal { grid-template-columns: repeat(4, 1fr); }
}

@media (min-width: 640px) {
  .site-grid.minimal { grid-template-columns: repeat(5, 1fr); }
}

@media (min-width: 768px) {
  .site-grid.minimal { grid-template-columns: repeat(6, 1fr); }
}

@media (min-width: 1024px) {
  .site-grid.minimal { grid-template-columns: repeat(8, 1fr); }
}

@media (min-width: 1280px) {
  .site-grid.minimal { grid-template-columns: repeat(10, 1fr); }
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

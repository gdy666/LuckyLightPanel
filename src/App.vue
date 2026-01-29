<script setup lang="ts">
import { onMounted, computed, watch, ref, provide } from 'vue'
import { useNavStore } from '@/stores/nav'
import { useConfigStore } from '@/stores/config'
import type { TabType } from '@/types'
import TechBackground from '@/components/common/TechBackground.vue'
import LoadingScreen from '@/components/common/LoadingScreen.vue'
import AppHeader from '@/components/layout/AppHeader.vue'
import ContentTabs from '@/components/common/ContentTabs.vue'
import SiteGrid from '@/components/sites/SiteGrid.vue'
import DockerGrid from '@/components/docker/DockerGrid.vue'
import ServiceGrid from '@/components/luckyServices/ServiceGrid.vue'
import SettingsPanel from '@/components/settings/SettingsPanel.vue'
import BackToTop from '@/components/common/BackToTop.vue'
import LinkDropdown from '@/components/common/LinkDropdown.vue'

const navStore = useNavStore()
const configStore = useConfigStore()

// 链接下拉菜单组件引用
const linkDropdownRef = ref<InstanceType<typeof LinkDropdown> | null>(null)

// 提供给子组件
provide('linkDropdown', {
  show: (site: any, urls: any[], target: HTMLElement) => {
    linkDropdownRef.value?.show(site, urls, target)
  }
})

// 计算属性
const isLoading = computed(() => navStore.isLoading)
const currentTab = computed(() => configStore.currentTab)

// 各标签页是否有数据
const hasSites = computed(() => navStore.sitesEnabled && navStore.allSites.length > 0)
const hasDocker = computed(() => navStore.dockerEnabled && navStore.allContainers.length > 0)
const hasLuckyServices = computed(() => navStore.luckyServicesEnabled && navStore.allLuckyServices.length > 0)

// 获取第一个可用的标签页
function getFirstAvailableTab(): TabType | null {
  if (hasSites.value) return 'sites'
  if (hasDocker.value) return 'docker'
  if (hasLuckyServices.value) return 'luckyServices'
  return null
}

// 检查并修正当前标签页
function ensureValidTab() {
  const tab = currentTab.value
  const isCurrentTabValid = 
    (tab === 'sites' && hasSites.value) ||
    (tab === 'docker' && hasDocker.value) ||
    (tab === 'luckyServices' && hasLuckyServices.value)
  
  if (!isCurrentTabValid) {
    const firstTab = getFirstAvailableTab()
    if (firstTab) {
      configStore.setCurrentTab(firstTab)
    }
  }
}

// 拼接图标 URL
function getIconUrl(path: string) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  return `./backend/iconlibs/${path}`
}

// 主题切换
watch(
  () => configStore.effectiveTheme,
  (theme) => {
    document.documentElement.setAttribute('data-theme', theme)
  },
  { immediate: true }
)

// 浏览器标题更新
watch(
  () => navStore.panelTitle,
  (title) => {
    if (title) {
      document.title = title
    }
  },
  { immediate: true }
)

// 浏览器 Favicon 更新
watch(
  () => navStore.panelFavicon,
  (favicon) => {
    if (favicon) {
      const faviconUrl = getIconUrl(favicon)
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = faviconUrl
    }
  },
  { immediate: true }
)

// 初始化
onMounted(async () => {
  configStore.loadConfig()
  await navStore.loadAllData()
  
  // 如果当前是自动或混合模式，调用接口重新识别网络类型
  const mode = configStore.networkMode
  if (mode === 'auto' || mode === 'hybrid') {
    await navStore.fetchNetworkType()
  }
  
  // 检查当前标签页是否有效，无效则切换到第一个可用标签页
  ensureValidTab()
})
</script>

<template>
  <!-- 素描风格 SVG 滤镜定义 -->
  <svg width="0" height="0" style="position: absolute;">
    <defs>
      <!-- 素描滤镜 - 边缘抖动效果 -->
      <filter id="sketch-filter" filterUnits="objectBoundingBox" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G" />
      </filter>
      <!-- 素描滤镜 - 悬停时轻微加强 -->
      <filter id="sketch-filter-hover" filterUnits="objectBoundingBox" x="-10%" y="-10%" width="120%" height="120%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" result="noise" />
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G" />
      </filter>
    </defs>
  </svg>

  <!-- 科技感动态背景 -->
  <TechBackground />

  <!-- 加载屏幕 -->
  <LoadingScreen v-if="isLoading" />

  <!-- 主内容 -->
  <div v-else class="app-main">
    <!-- 页头 -->
    <AppHeader />

    <!-- 主区域 -->
    <main class="main-content">
      <!-- 内容标签页 -->
      <ContentTabs class="mb-16" />

      <!-- 站点网格 -->
      <SiteGrid v-if="currentTab === 'sites' && hasSites" />

      <!-- Docker 网格 -->
      <DockerGrid v-else-if="currentTab === 'docker' && hasDocker" />

      <!-- Lucky 服务网格 -->
      <ServiceGrid v-else-if="currentTab === 'luckyServices' && hasLuckyServices" />
    </main>

    <!-- 设置面板 -->
    <SettingsPanel />

    <!-- 返回顶部 -->
    <BackToTop />

    <!-- 链接选择下拉菜单 -->
    <LinkDropdown ref="linkDropdownRef" />
  </div>
</template>

<style scoped>
.app-main {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
  width: 100%;
  max-width: 1400px;
  margin: 0 auto;
  padding: 0.75rem 1rem 2rem;
}

@media (min-width: 640px) {
  .main-content {
    padding: 0.75rem 1.5rem 2.5rem;
  }
}
</style>

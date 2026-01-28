import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useConfigStore } from './config'
import type {
  NavConfig,
  SitesData,
  DockerData,
  DockerStatsResponse,
  DockerStat,
  LuckyServicesData,
  LuckyServicesStatsResponse,
  LuckyServiceStat,
  Site,
  DockerContainer,
  LuckyService,
  Group,
  NetworkType
} from '@/types'

// API 路径
const API = {
  nav: './backend/nav.json',
  sites: './backend/sites.json',
  docker: './backend/docker.json',
  dockerStats: './backend/docker-stats.json',
  luckyServices: './backend/luckyservices.json',
  luckyServicesStats: './backend/luckyservices-stats.json',
  networkType: './backend/api/network-type'
}

export const useNavStore = defineStore('nav', () => {
  // 加载状态
  const isLoading = ref(true)
  const loadError = ref<string | null>(null)

  // 全局配置
  const navConfig = ref<NavConfig | null>(null)

  // 站点数据
  const sitesData = ref<SitesData | null>(null)
  const networkType = ref<NetworkType>('external')
  const networkTypeFetchFailed = ref(false)  // 网络类型查询是否失败
  const clientIP = ref('')

  // Docker 数据
  const dockerData = ref<DockerData | null>(null)
  const dockerStats = ref<Map<string, DockerStat>>(new Map())
  const dockerStatsTimer = ref<ReturnType<typeof setInterval> | null>(null)

  // Lucky 服务数据
  const luckyServicesData = ref<LuckyServicesData | null>(null)
  const luckyServicesStats = ref<Map<string, LuckyServiceStat>>(new Map())
  const luckyServicesStatsTimer = ref<ReturnType<typeof setInterval> | null>(null)

  // 计算属性：站点分组
  const siteGroups = computed<Group[]>(() => {
    return sitesData.value?.groups || []
  })

  // 计算属性：所有站点
  const allSites = computed<Site[]>(() => {
    const sites = sitesData.value?.sites || []
    return sites.filter((s: Site) => s.enable !== false).sort((a: Site, b: Site) => (a.order || 0) - (b.order || 0))
  })

  // 计算属性：Docker 分组
  const dockerGroups = computed<Group[]>(() => {
    return dockerData.value?.groups || []
  })

  // 计算属性：所有 Docker 容器
  const allContainers = computed<DockerContainer[]>(() => {
    const containers = dockerData.value?.containers || []
    return containers.filter((c: DockerContainer) => c.enable !== false).sort((a: DockerContainer, b: DockerContainer) => (a.order || 0) - (b.order || 0))
  })

  // 计算属性：Lucky 服务分组
  const luckyServicesGroups = computed<Group[]>(() => {
    return luckyServicesData.value?.groups || []
  })

  // 计算属性：所有 Lucky 服务
  const allLuckyServices = computed<LuckyService[]>(() => {
    const services = luckyServicesData.value?.services || []
    return services.filter((s: LuckyService) => s.enable !== false).sort((a: LuckyService, b: LuckyService) => (a.order || 0) - (b.order || 0))
  })

  // 计算属性：面板标题
  const panelTitle = computed(() => {
    return navConfig.value?.settings?.title || '轻面板'
  })

  // 计算属性：面板副标题
  const panelSubtitle = computed(() => {
    return navConfig.value?.settings?.subtitle || ''
  })

  // 计算属性：面板 Logo
  const panelLogo = computed(() => {
    return navConfig.value?.settings?.logo || ''
  })

  // 计算属性：面板 Favicon
  const panelFavicon = computed(() => {
    return navConfig.value?.settings?.favicon || ''
  })

  // 计算属性：模块启用状态
  const sitesEnabled = computed(() => navConfig.value?.sitesEnabled !== false)
  const dockerEnabled = computed(() => navConfig.value?.dockerEnabled === true)
  const luckyServicesEnabled = computed(() => navConfig.value?.luckyServicesEnabled === true)

  // 异步加载 JSON
  async function fetchJson<T>(url: string): Promise<T | null> {
    try {
      const response = await fetch(url)
      if (!response.ok) return null
      return await response.json()
    } catch {
      return null
    }
  }

  // 加载所有数据
  async function loadAllData() {
    isLoading.value = true
    loadError.value = null

    try {
      const results = await Promise.allSettled([
        fetchJson<NavConfig>(API.nav),
        fetchJson<SitesData>(API.sites),
        fetchJson<DockerData>(API.docker),
        fetchJson<LuckyServicesData>(API.luckyServices)
      ])

      // 解析结果
      if (results[0].status === 'fulfilled') {
        navConfig.value = results[0].value
        // 设置服务器背景图片
        const configStore = useConfigStore()
        const bgImages = results[0].value?.settings?.backgroundImages || []
        configStore.setServerBackgrounds(bgImages)
      }
      if (results[1].status === 'fulfilled' && results[1].value) {
        sitesData.value = results[1].value
        networkType.value = results[1].value.networkType || 'external'
        clientIP.value = results[1].value.clientIP || ''
      }
      if (results[2].status === 'fulfilled') {
        dockerData.value = results[2].value
      }
      if (results[3].status === 'fulfilled') {
        luckyServicesData.value = results[3].value
      }
    } catch (e) {
      loadError.value = String(e)
    } finally {
      isLoading.value = false
    }
  }

  // 获取网络类型（用于自动/混合模式）
  async function fetchNetworkType() {
    try {
      const response = await fetch(API.networkType)
      if (response.ok) {
        const data = await response.json()
        if (data.networkType) {
          networkType.value = data.networkType
          clientIP.value = data.clientIP || ''
          networkTypeFetchFailed.value = false  // 查询成功
          console.log('Network type updated:', networkType.value, 'Client IP:', clientIP.value)
          return
        }
      }
      // 响应不 ok 或没有 networkType 数据，视为失败
      networkTypeFetchFailed.value = true
      console.warn('Failed to fetch network type: invalid response')
    } catch (error) {
      networkTypeFetchFailed.value = true  // 查询失败
      console.warn('Failed to fetch network type:', error)
    }
  }

  // 加载 Docker 统计
  async function loadDockerStats() {
    const data = await fetchJson<DockerStatsResponse>(API.dockerStats)
    if (data?.ret === 0 && data.stats) {
      const newStats = new Map<string, DockerStat>()
      data.stats.forEach(stat => {
        newStats.set(stat.containerName, stat)
      })
      dockerStats.value = newStats
    }
  }

  // 开始 Docker 统计轮询
  function startDockerStatsPolling() {
    stopDockerStatsPolling()
    loadDockerStats()
    dockerStatsTimer.value = setInterval(loadDockerStats, 5000)
  }

  // 停止 Docker 统计轮询
  function stopDockerStatsPolling() {
    if (dockerStatsTimer.value) {
      clearInterval(dockerStatsTimer.value)
      dockerStatsTimer.value = null
    }
  }

  // 加载 Lucky 服务统计
  async function loadLuckyServicesStats() {
    const data = await fetchJson<LuckyServicesStatsResponse>(API.luckyServicesStats)
    if (data?.ret === 0 && data.stats) {
      const newStats = new Map<string, LuckyServiceStat>()
      data.stats.forEach(stat => {
        newStats.set(stat.key, stat)
      })
      luckyServicesStats.value = newStats
    }
  }

  // 开始 Lucky 服务统计轮询
  function startLuckyServicesStatsPolling() {
    stopLuckyServicesStatsPolling()
    loadLuckyServicesStats()
    luckyServicesStatsTimer.value = setInterval(loadLuckyServicesStats, 5000)
  }

  // 停止 Lucky 服务统计轮询
  function stopLuckyServicesStatsPolling() {
    if (luckyServicesStatsTimer.value) {
      clearInterval(luckyServicesStatsTimer.value)
      luckyServicesStatsTimer.value = null
    }
  }

  // 获取容器统计
  function getContainerStats(containerName: string): DockerStat | undefined {
    return dockerStats.value.get(containerName)
  }

  // 获取服务统计
  function getServiceStats(key: string): LuckyServiceStat | undefined {
    return luckyServicesStats.value.get(key)
  }

  return {
    // 状态
    isLoading,
    loadError,
    navConfig,
    sitesData,
    networkType,
    networkTypeFetchFailed,
    clientIP,
    dockerData,
    dockerStats,
    luckyServicesData,
    luckyServicesStats,

    // 计算属性
    siteGroups,
    allSites,
    dockerGroups,
    allContainers,
    luckyServicesGroups,
    allLuckyServices,
    panelTitle,
    panelSubtitle,
    panelLogo,
    panelFavicon,
    sitesEnabled,
    dockerEnabled,
    luckyServicesEnabled,

    // 方法
    loadAllData,
    fetchNetworkType,
    loadDockerStats,
    startDockerStatsPolling,
    stopDockerStatsPolling,
    loadLuckyServicesStats,
    startLuckyServicesStatsPolling,
    stopLuckyServicesStatsPolling,
    getContainerStats,
    getServiceStats
  }
})

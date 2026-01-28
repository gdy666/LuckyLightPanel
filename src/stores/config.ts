import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  ThemeMode,
  LayoutMode,
  NetworkMode,
  TabType,
  UserConfig,
  PresetBackground,
  TabGroups,
  TabSearchKeywords
} from '@/types'

const STORAGE_KEY = 'lightpanel_config'

// 预设背景 - 科技感渐变色
export const PRESET_BACKGROUNDS: PresetBackground[] = [
  { id: 'cyber', name: '赛博', type: 'gradient', value: 'linear-gradient(135deg, hsl(220 50% 4%) 0%, hsl(240 40% 8%) 50%, hsl(220 50% 4%) 100%)' },
  { id: 'aurora', name: '极光', type: 'gradient', value: 'linear-gradient(135deg, hsl(250 60% 40%) 0%, hsl(280 50% 35%) 50%, hsl(320 60% 40%) 100%)' },
  { id: 'ocean', name: '深海', type: 'gradient', value: 'linear-gradient(135deg, hsl(200 80% 25%) 0%, hsl(220 70% 40%) 100%)' },
  { id: 'matrix', name: '矩阵', type: 'gradient', value: 'linear-gradient(180deg, hsl(150 60% 4%) 0%, hsl(180 50% 3%) 100%)' },
  { id: 'midnight', name: '午夜', type: 'gradient', value: 'linear-gradient(135deg, hsl(220 50% 5%) 0%, hsl(230 45% 12%) 50%, hsl(240 40% 18%) 100%)' },
  { id: 'neon', name: '霓虹', type: 'gradient', value: 'linear-gradient(135deg, hsl(280 80% 35%) 0%, hsl(320 70% 40%) 50%, hsl(350 60% 45%) 100%)' },
  { id: 'emerald', name: '翡翠', type: 'gradient', value: 'linear-gradient(135deg, hsl(160 70% 25%) 0%, hsl(150 80% 40%) 100%)' },
  { id: 'sunset', name: '日落', type: 'gradient', value: 'linear-gradient(135deg, hsl(320 80% 40%) 0%, hsl(260 70% 50%) 52%, hsl(200 80% 50%) 100%)' },
  { id: 'cosmic', name: '宇宙', type: 'gradient', value: 'linear-gradient(135deg, hsl(250 60% 15%) 0%, hsl(280 50% 25%) 100%)' },
  { id: 'slate', name: '石板', type: 'gradient', value: 'linear-gradient(135deg, hsl(220 30% 8%) 0%, hsl(220 25% 15%) 50%, hsl(220 20% 20%) 100%)' }
]

// 默认分组状态
const DEFAULT_TAB_GROUPS: TabGroups = {
  sites: 'all',
  docker: 'all',
  luckyServices: 'all'
}

// 默认搜索关键字
const DEFAULT_SEARCH_KEYWORDS: TabSearchKeywords = {
  sites: '',
  docker: '',
  luckyServices: ''
}

// 默认配置
const DEFAULT_CONFIG: UserConfig = {
  theme: 'dark',
  background: 'ocean',
  customBgUrl: '',
  layout: 'normal',
  dockerLayout: 'list',
  luckyServicesLayout: 'normal',
  showDescription: true,
  showTime: true,
  showWelcome: true,
  enableAnimation: true,
  tabGroups: { ...DEFAULT_TAB_GROUPS },
  networkMode: 'hybrid',
  currentTab: 'sites'
}

export const useConfigStore = defineStore('config', () => {
  // 状态
  const config = ref<UserConfig>({ ...DEFAULT_CONFIG })
  const settingsPanelOpen = ref(false)
  const systemDarkMode = ref(false)
  // 搜索关键字（不持久化）
  const searchKeywords = ref<TabSearchKeywords>({ ...DEFAULT_SEARCH_KEYWORDS })
  // 服务器背景图片列表
  const serverBackgrounds = ref<PresetBackground[]>([])
  // 是否有本地存储的配置（用于判断是否使用服务器默认背景）
  const hasStoredConfig = ref(false)

  // 计算属性：实际生效的主题
  const effectiveTheme = computed(() => {
    if (config.value.theme === 'auto') {
      return systemDarkMode.value ? 'dark' : 'light'
    }
    return config.value.theme
  })

  // 计算属性：所有可用背景（预设 + 服务器）
  const allBackgrounds = computed(() => {
    return [...PRESET_BACKGROUNDS, ...serverBackgrounds.value]
  })

  // 计算属性：背景样式
  const backgroundStyle = computed(() => {
    const bg = config.value.background

    // 自定义背景
    if (bg === 'custom' && config.value.customBgUrl) {
      return {
        backgroundImage: `url(${config.value.customBgUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }

    // 预设背景
    const preset = PRESET_BACKGROUNDS.find(p => p.id === bg)
    if (preset) {
      return { background: preset.value }
    }

    // 服务器背景图片
    const serverBg = serverBackgrounds.value.find(p => p.id === bg)
    if (serverBg) {
      return {
        backgroundImage: `url(${serverBg.value})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }
    }

    // 默认渐变
    return { background: PRESET_BACKGROUNDS[0].value }
  })

  // 快捷访问器
  const theme = computed(() => config.value.theme)
  const layout = computed(() => config.value.layout)
  const dockerLayout = computed(() => config.value.dockerLayout)
  const luckyServicesLayout = computed(() => config.value.luckyServicesLayout)
  const networkMode = computed(() => config.value.networkMode)
  const currentTab = computed(() => config.value.currentTab)
  const currentGroup = computed(() => {
    const tab = config.value.currentTab
    return config.value.tabGroups[tab] || 'all'
  })
  const showDescription = computed(() => config.value.showDescription)
  const showTime = computed(() => config.value.showTime)
  const showWelcome = computed(() => config.value.showWelcome)
  const enableAnimation = computed(() => config.value.enableAnimation)
  // 当前标签页的搜索关键字
  const currentSearchKeyword = computed(() => {
    const tab = config.value.currentTab
    return searchKeywords.value[tab] || ''
  })

  // 加载配置
  function loadConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        config.value = { ...DEFAULT_CONFIG, ...parsed }
        hasStoredConfig.value = true
      } else {
        hasStoredConfig.value = false
      }
    } catch (e) {
      console.warn('Failed to load config:', e)
      hasStoredConfig.value = false
    }

    // 监听系统主题变化
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    systemDarkMode.value = mediaQuery.matches
    mediaQuery.addEventListener('change', (e) => {
      systemDarkMode.value = e.matches
    })
  }

  // 设置服务器背景图片
  function setServerBackgrounds(urls: string[]) {
    serverBackgrounds.value = urls.map((url, index) => ({
      id: `server_${index}`,
      name: `服务器背景 ${index + 1}`,
      type: 'image' as const,
      value: url
    }))
    
    // 如果没有本地配置且有服务器背景，使用第一个作为默认
    if (!hasStoredConfig.value && urls.length > 0) {
      config.value.background = 'server_0'
      saveConfig()
      return
    }
    
    // 检查当前背景是否有效
    validateCurrentBackground()
  }

  // 验证当前背景是否有效，无效则切换到默认
  function validateCurrentBackground() {
    const bg = config.value.background
    // 自定义背景不验证
    if (bg === 'custom') return
    // 检查是否在预设背景中
    const inPreset = PRESET_BACKGROUNDS.some(p => p.id === bg)
    if (inPreset) return
    // 检查是否在服务器背景中
    const inServer = serverBackgrounds.value.some(p => p.id === bg)
    if (inServer) return
    // 无效，切换到默认背景
    console.warn(`Background "${bg}" is invalid, switching to default`)
    config.value.background = DEFAULT_CONFIG.background
    saveConfig()
  }

  // 保存配置
  function saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config.value))
    } catch (e) {
      console.warn('Failed to save config:', e)
    }
  }

  // 更新单个配置项
  function updateConfig<K extends keyof UserConfig>(key: K, value: UserConfig[K]) {
    config.value[key] = value
    saveConfig()
  }

  // 设置主题
  function setTheme(theme: ThemeMode) {
    updateConfig('theme', theme)
  }

  // 设置布局
  function setLayout(layout: LayoutMode) {
    updateConfig('layout', layout)
  }

  // 设置 Docker 布局
  function setDockerLayout(layout: LayoutMode) {
    updateConfig('dockerLayout', layout)
  }

  // 设置 Lucky 服务布局
  function setLuckyServicesLayout(layout: LayoutMode) {
    updateConfig('luckyServicesLayout', layout)
  }

  // 设置网络模式
  function setNetworkMode(mode: NetworkMode) {
    updateConfig('networkMode', mode)
  }

  // 设置当前标签页
  function setCurrentTab(tab: TabType) {
    updateConfig('currentTab', tab)
  }

  // 设置当前分组（根据当前标签页）
  function setCurrentGroup(group: string) {
    const tab = config.value.currentTab
    const newTabGroups = { ...config.value.tabGroups, [tab]: group }
    updateConfig('tabGroups', newTabGroups)
  }

  // 重置当前标签页的分组到全部
  function resetCurrentTabGroup() {
    setCurrentGroup('all')
  }

  // 设置当前标签页的搜索关键字
  function setSearchKeyword(keyword: string) {
    const tab = config.value.currentTab
    searchKeywords.value[tab] = keyword
  }

  // 清空当前标签页的搜索关键字
  function clearSearchKeyword() {
    setSearchKeyword('')
  }

  // 清空所有搜索关键字
  function clearAllSearchKeywords() {
    searchKeywords.value = { ...DEFAULT_SEARCH_KEYWORDS }
  }

  // 设置背景
  function setBackground(bgId: string, customUrl?: string) {
    updateConfig('background', bgId)
    if (customUrl !== undefined) {
      updateConfig('customBgUrl', customUrl)
    }
  }

  // 切换设置面板
  function toggleSettingsPanel(open?: boolean) {
    settingsPanelOpen.value = open ?? !settingsPanelOpen.value
  }

  // 重置配置
  function resetConfig() {
    config.value = { ...DEFAULT_CONFIG }
    saveConfig()
  }

  return {
    // 状态
    config,
    settingsPanelOpen,
    systemDarkMode,
    searchKeywords,
    serverBackgrounds,

    // 计算属性
    effectiveTheme,
    backgroundStyle,
    allBackgrounds,
    theme,
    layout,
    dockerLayout,
    luckyServicesLayout,
    networkMode,
    currentTab,
    currentGroup,
    showDescription,
    showTime,
    showWelcome,
    enableAnimation,
    currentSearchKeyword,

    // 方法
    loadConfig,
    saveConfig,
    updateConfig,
    setTheme,
    setLayout,
    setDockerLayout,
    setLuckyServicesLayout,
    setNetworkMode,
    setCurrentTab,
    setCurrentGroup,
    resetCurrentTabGroup,
    setSearchKeyword,
    clearSearchKeyword,
    clearAllSearchKeywords,
    setBackground,
    setServerBackgrounds,
    validateCurrentBackground,
    toggleSettingsPanel,
    resetConfig
  }
})

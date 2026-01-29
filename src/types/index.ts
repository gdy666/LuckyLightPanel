// ============ 全局配置类型 ============

/** 全局配置 */
export interface NavConfig {
  version?: string
  settings: NavSettings
  sitesEnabled?: boolean
  dockerEnabled?: boolean
  luckyServicesEnabled?: boolean
}

/** 面板设置 */
export interface NavSettings {
  title: string
  subtitle?: string
  logo?: string
  favicon?: string
  backgroundImages?: string[]
  custom?: Record<string, unknown>
}

// ============ 分组类型 ============

/** 分组 */
export interface Group {
  key: string
  name: string
  icon?: string
  order?: number
}

// ============ 站点类型 ============

/** 站点数据响应 */
export interface SitesData {
  networkType: NetworkType
  clientIP: string
  groups: Group[]
  sites: Site[]
}

/** 站点 */
export interface Site {
  key: string
  name: string
  description?: string
  iconUrl?: string
  frontendUrls?: string[]
  backendUrls?: string[]
  groupKey?: string
  order?: number
  enable?: boolean
  target?: string
}

// ============ Docker 类型 ============

/** Docker 数据响应 */
export interface DockerData {
  groups: Group[]
  containers: DockerContainer[]
}

/** Docker 容器 */
export interface DockerContainer {
  key: string
  containerName: string
  containerId?: string
  displayName?: string
  description?: string
  iconUrl?: string
  state?: DockerState
  status?: string // 状态详情，包含运行时长，如 "Up 2 hours" 或 "Exited (0) 3 days ago"
  groupKey?: string
  order?: number
  enable?: boolean
  showStatus?: boolean
  composeProject?: string
}

/** Docker 容器状态 */
export type DockerState = 'running' | 'exited' | 'paused' | 'restarting' | 'created' | 'unknown'

/** Docker 统计数据响应 */
export interface DockerStatsResponse {
  ret: number
  stats: DockerStat[]
}

/** Docker 容器统计 */
export interface DockerStat {
  containerName: string
  state: string
  status?: string // 状态详情，包含运行时长，如 "Up 2 hours" 或 "Exited (0) 3 days ago"
  cpuPercent: string
  memoryUsage: string
  memoryPercent: string
  networkRx: string
  networkTx: string
  networkRxSpeed: number
  networkTxSpeed: number
  diskReadSpeed?: number
  diskWriteSpeed?: number
}

// ============ Lucky 服务类型 ============

/** Lucky 服务数据响应 */
export interface LuckyServicesData {
  groups: Group[]
  services: LuckyService[]
}

/** Lucky 服务 */
export interface LuckyService {
  key: string
  name: string
  displayName?: string
  description?: string
  iconUrl?: string
  serviceType: ServiceType
  state?: ServiceState
  groupKey?: string
  order?: number
  enable?: boolean
  showStatus?: boolean
  publicAddr?: string
}

/** 服务类型 */
export type ServiceType = 'webservice' | 'webservice-main' | 'webservice-default' | 'portforward' | 'stun'

/** 服务状态 */
export type ServiceState = 'running' | 'enabled' | 'stopped' | 'disabled' | 'error' | 'unknown'

/** Lucky 服务统计数据响应 */
export interface LuckyServicesStatsResponse {
  ret: number
  stats: LuckyServiceStat[]
}

/** Lucky 服务统计 */
export interface LuckyServiceStat {
  key: string
  state: string
  tcpCurrentConnections: number
  udpCurrentConnections: number
  trafficIn: number
  trafficOut: number
  inSpeed: number
  outSpeed: number
  publicAddr?: string
}

// ============ 网络类型 ============

/** 网络类型 */
export type NetworkType = 'internal' | 'external'

/** 网络模式 */
export type NetworkMode = 'auto' | 'internal' | 'external' | 'hybrid'

/** 网络类型响应 */
export interface NetworkTypeResponse {
  networkType: NetworkType
  clientIP: string
}

// ============ 用户配置类型 ============

/** 主题模式 */
export type ThemeMode = 'light' | 'dark' | 'sketch-light' | 'sketch-dark'

/** 布局模式 */
export type LayoutMode = 'compact' | 'normal' | 'large' | 'list' | 'minimal'

/** 标签页 */
export type TabType = 'sites' | 'docker' | 'luckyServices'

/** 分组选择值类型：支持单选(string)或多选(string[]) */
export type GroupSelection = string | string[]

/** 各标签页的分组状态 */
export interface TabGroups {
  sites: GroupSelection
  docker: GroupSelection
  luckyServices: GroupSelection
}

/** 各标签页的搜索关键字 */
export interface TabSearchKeywords {
  sites: string
  docker: string
  luckyServices: string
}

/** 搜索引擎 */
export interface SearchEngine {
  id: string
  name: string
  url: string
  icon: string
}

/** 用户配置 */
export interface UserConfig {
  theme: ThemeMode
  background: string
  customBgUrl: string
  layout: LayoutMode
  dockerLayout: LayoutMode
  luckyServicesLayout: LayoutMode
  showDescription: boolean
  showTime: boolean
  showSearch: boolean
  searchEngine: string
  customSearchUrl: string
  tabGroups: TabGroups
  networkMode: NetworkMode
  currentTab: TabType
}

// ============ 预设背景类型 ============

/** 预设背景 */
export interface PresetBackground {
  id: string
  name: string
  type: 'gradient' | 'image'
  value: string
}

// ============ 链接项类型 ============

/** 链接项（用于下拉菜单） */
export interface LinkItem {
  url: string
  label: string
  type: 'internal' | 'external'
}

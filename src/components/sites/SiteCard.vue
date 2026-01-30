<script setup lang="ts">
import { computed, inject } from 'vue'
import { storeToRefs } from 'pinia'
import { useConfigStore } from '@/stores/config'
import { useNavStore } from '@/stores/nav'
import { ArrowUpRight } from 'lucide-vue-next'
import type { Site } from '@/types'

interface LinkItem {
  url: string
  label: string
  type: 'internal' | 'external'
}

const props = defineProps<{
  site: Site
}>()

const configStore = useConfigStore()
const navStore = useNavStore()

// 使用 storeToRefs 确保正确解包响应式属性
const { networkMode } = storeToRefs(configStore)
const { networkType, networkTypeFetchFailed } = storeToRefs(navStore)

// 注入链接下拉菜单
const linkDropdown = inject<{ show: (site: Site, urls: LinkItem[], target: HTMLElement) => void }>('linkDropdown')

// 获取有效的网络类型（根据网络模式）
function getEffectiveNetworkType(): 'internal' | 'external' | 'hybrid' {
  const mode = networkMode.value
  const type = networkType.value
  const fetchFailed = networkTypeFetchFailed.value
  
  if (mode === 'internal') return 'internal'
  if (mode === 'external') return 'external'
  if (mode === 'hybrid') return 'hybrid'
  // auto 模式：查询失败时降级为混合模式
  if (mode === 'auto' && fetchFailed) return 'hybrid'
  // auto 模式：查询成功时根据服务器返回的网络类型
  return type
}

// 获取混合模式下的所有可用链接
function getHybridUrls(): LinkItem[] {
  const urls: LinkItem[] = []
  const { frontendUrls = [], backendUrls = [] } = props.site
  
  // 添加内网链接
  backendUrls.filter(u => u && u.trim()).forEach((url, index) => {
    urls.push({
      url,
      label: backendUrls.filter(u => u && u.trim()).length > 1 ? `内网链接 ${index + 1}` : '内网链接',
      type: 'internal'
    })
  })
  
  // 添加外网链接
  frontendUrls.filter(u => u && u.trim()).forEach((url, index) => {
    urls.push({
      url,
      label: frontendUrls.filter(u => u && u.trim()).length > 1 ? `外网链接 ${index + 1}` : '外网链接',
      type: 'external'
    })
  })
  
  return urls
}

// 获取单一网络类型的链接列表
function getSingleTypeUrls(type: 'internal' | 'external'): LinkItem[] {
  const { frontendUrls = [], backendUrls = [] } = props.site
  const validFrontend = frontendUrls.filter(u => u && u.trim())
  const validBackend = backendUrls.filter(u => u && u.trim())
  
  if (type === 'external') {
    // 外网模式：优先检查外网链接
    if (validFrontend.length > 0) {
      return validFrontend.map((url, index) => ({
        url,
        label: validFrontend.length > 1 ? `外网链接 ${index + 1}` : '外网链接',
        type: 'external' as const
      }))
    }
    // 没有外网链接但有多个内网链接
    if (validBackend.length > 1) {
      return validBackend.map((url, index) => ({
        url,
        label: `内网链接 ${index + 1}`,
        type: 'internal' as const
      }))
    }
  } else {
    // 内网模式：优先检查内网链接
    if (validBackend.length > 0) {
      return validBackend.map((url, index) => ({
        url,
        label: validBackend.length > 1 ? `内网链接 ${index + 1}` : '内网链接',
        type: 'internal' as const
      }))
    }
    // 没有内网链接但有多个外网链接
    if (validFrontend.length > 1) {
      return validFrontend.map((url, index) => ({
        url,
        label: `外网链接 ${index + 1}`,
        type: 'external' as const
      }))
    }
  }
  
  return []
}

// 获取最佳单一链接（用于直接打开）
function getBestUrl(): string | null {
  const { frontendUrls = [], backendUrls = [] } = props.site
  const effectiveType = getEffectiveNetworkType()
  
  const getValidUrl = (urls: string[]) => urls.find(u => u && u.trim())
  
  if (effectiveType === 'internal') {
    return getValidUrl(backendUrls) || getValidUrl(frontendUrls) || null
  }
  if (effectiveType === 'hybrid') {
    // 混合模式优先内网
    return getValidUrl(backendUrls) || getValidUrl(frontendUrls) || null
  }
  // 外网模式
  return getValidUrl(frontendUrls) || getValidUrl(backendUrls) || null
}

// 点击卡片处理
function handleClick(event: MouseEvent) {
  event.preventDefault()
  
  const effectiveType = getEffectiveNetworkType()
  const { frontendUrls = [], backendUrls = [] } = props.site
  const validFrontend = frontendUrls.filter(u => u && u.trim())
  const validBackend = backendUrls.filter(u => u && u.trim())
  
  // 混合模式（包括自动模式查询失败的降级情况）：只要有多个链接就弹出下拉菜单让用户选择
  if (effectiveType === 'hybrid') {
    const urls = getHybridUrls()
    if (urls.length > 1 && linkDropdown) {
      linkDropdown.show(props.site, urls, event.currentTarget as HTMLElement)
      return
    }
  }
  
  // 外网模式
  if (effectiveType === 'external') {
    // 有多个外网链接：显示外网链接下拉菜单
    if (validFrontend.length > 1 && linkDropdown) {
      const urls = getSingleTypeUrls('external')
      linkDropdown.show(props.site, urls, event.currentTarget as HTMLElement)
      return
    }
    // 没有外网链接但有多个内网链接：显示内网链接下拉菜单（降级处理）
    if (validFrontend.length === 0 && validBackend.length > 1 && linkDropdown) {
      const urls = getSingleTypeUrls('internal')
      linkDropdown.show(props.site, urls, event.currentTarget as HTMLElement)
      return
    }
  }
  
  // 内网模式
  if (effectiveType === 'internal') {
    // 有多个内网链接：显示内网链接下拉菜单
    if (validBackend.length > 1 && linkDropdown) {
      const urls = getSingleTypeUrls('internal')
      linkDropdown.show(props.site, urls, event.currentTarget as HTMLElement)
      return
    }
    // 没有内网链接但有多个外网链接：显示外网链接下拉菜单（降级处理）
    if (validBackend.length === 0 && validFrontend.length > 1 && linkDropdown) {
      const urls = getSingleTypeUrls('external')
      linkDropdown.show(props.site, urls, event.currentTarget as HTMLElement)
      return
    }
  }
  
  // 其他情况直接打开链接
  const url = getBestUrl()
  if (url) {
    const target = props.site.target || '_blank'
    window.open(url, target)
  }
}

// 用于显示的最佳链接（hover状态等）- 保留函数以供未来使用
// const bestUrl = computed(() => getBestUrl())

// 图标 URL
const iconUrl = computed(() => {
  const { iconUrl } = props.site
  if (!iconUrl) return null
  
  if (iconUrl.startsWith('http://') || iconUrl.startsWith('https://')) {
    return iconUrl
  }
  
  return `./backend/iconlibs/${iconUrl}`
})

// 是否显示描述
const showDesc = computed(() => configStore.showDescription && props.site.description)

// 布局模式
const layout = computed(() => configStore.layout)

// 霓虹渐变色组（用于无图标时的首字母背景）
const neonGradients = [
  { from: 'var(--neon-cyan)', to: 'var(--neon-blue)', shadow: 'var(--neon-cyan)' },
  { from: 'var(--neon-purple)', to: 'var(--neon-blue)', shadow: 'var(--neon-purple)' },
  { from: 'var(--neon-green)', to: 'var(--neon-cyan)', shadow: 'var(--neon-green)' },
  { from: 'var(--neon-blue)', to: 'var(--neon-purple)', shadow: 'var(--neon-blue)' },
  { from: 'var(--neon-cyan)', to: 'var(--neon-green)', shadow: 'var(--neon-cyan)' },
]

// 无图标时的渐变色（基于名称首字母）
const fallbackGradient = computed(() => {
  const index = props.site.name.charCodeAt(0) % neonGradients.length
  return neonGradients[index]
})

// 图标背景样式
const iconBgStyle = computed(() => {
  if (iconUrl.value) {
    // 有图标：使用主题适配的中性背景
    return {
      boxShadow: `0 4px 20px -4px hsl(var(--icon-placeholder-bg) / 0.5)`
    }
  } else {
    // 无图标：使用彩色渐变背景
    return {
      background: `linear-gradient(135deg, hsl(${fallbackGradient.value.from}) 0%, hsl(${fallbackGradient.value.to}) 100%)`,
      boxShadow: `0 4px 20px -4px hsl(${fallbackGradient.value.shadow} / 0.5)`
    }
  }
})

// 卡片类名
const cardClass = computed(() => {
  const classes = ['cyber-card', 'group']
  if (layout.value === 'list') classes.push('layout-list')
  else if (layout.value === 'minimal') classes.push('layout-minimal')
  else classes.push('layout-default')
  return classes.join(' ')
})

// 图标类名
const iconClass = computed(() => {
  const classes = ['neon-icon']
  if (layout.value === 'compact' || layout.value === 'minimal') classes.push('size-sm')
  else if (layout.value === 'large') classes.push('size-lg')
  else classes.push('size-md')
  if (layout.value === 'minimal') classes.push('icon-centered')
  return classes.join(' ')
})
</script>

<template>
  <div
    :class="cardClass"
    @click="handleClick"
  >
    <!-- 霓虹边框效果 -->
    <div 
      class="card-glow"
      :style="{ '--shadow-color': `hsl(var(--icon-placeholder-bg))` }"
    />
    
    <!-- 边框发光线 -->
    <div class="card-border-glow" />
    
    <!-- 背景光晕装饰 -->
    <div 
      class="card-bg-glow"
      :style="{
        background: `hsl(var(--icon-placeholder-bg))`
      }"
    />
    
    <!-- 内容容器 -->
    <div class="card-inner" :class="{ 'layout-list': layout === 'list', 'layout-minimal': layout === 'minimal', 'layout-compact': layout === 'compact' }">
      <!-- 图标 -->
      <div
        :class="iconClass"
        :style="iconBgStyle"
      >
        <img
          v-if="iconUrl"
          :src="iconUrl"
          :alt="site.name"
          class="icon-img"
          @error="($event.target as HTMLImageElement).style.display = 'none'"
        />
        <span v-else class="icon-text" :class="{ 'text-lg': layout === 'large' }">
          {{ site.name.charAt(0).toUpperCase() }}
        </span>
      </div>

      <!-- 内容 -->
      <div class="card-content" :class="{ 'has-mt': layout !== 'list' && layout !== 'minimal' }">
        <div class="title-row">
          <h3 class="card-title" :class="[`title-${layout}`]">
            {{ site.name }}
          </h3>
          <!-- 外链指示图标 -->
          <ArrowUpRight 
            v-if="layout !== 'minimal'"
            class="external-icon"
          />
        </div>
        
        <p
          v-if="showDesc && layout !== 'compact' && layout !== 'minimal'"
          class="card-desc"
        >
          {{ site.description }}
        </p>
      </div>

      <!-- 外链图标 (List 模式) -->
      <div v-if="layout === 'list'" class="list-external-btn">
        <ArrowUpRight class="list-external-icon" />
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ============================================
   站点卡片 - 专业磨砂设计
   适配暗黑磨砂和光亮磨砂两种模式
   ============================================ */

/* 卡片基础容器 */
.cyber-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  /* 使用站点卡片专属变量 */
  background: hsl(var(--site-card-bg));
  backdrop-filter: blur(var(--site-card-blur)) saturate(var(--site-card-saturation));
  -webkit-backdrop-filter: blur(var(--site-card-blur)) saturate(var(--site-card-saturation));
  border: 1px solid hsl(var(--site-card-border));
  box-shadow: var(--site-card-shadow);
  transition: all var(--duration-normal) var(--ease-out);
  display: block;
  text-decoration: none;
  cursor: pointer;
}

/* 磨砂内层叠加 - 增强通透感 */
.cyber-card::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    hsl(var(--site-card-inner-glow)) 0%,
    transparent 50%,
    transparent 100%
  );
  opacity: var(--site-card-shine-opacity);
  transition: opacity var(--duration-normal) ease;
  pointer-events: none;
  z-index: 1;
}

.cyber-card.layout-default {
  padding: 0.875rem;
}

.cyber-card.layout-compact {
  padding: 0.5rem 0.625rem;
}

.cyber-card.layout-list {
  padding: 0.75rem 0.875rem;
}

.cyber-card.layout-minimal {
  padding: 0.625rem;
  text-align: center;
}

.cyber-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: hsl(var(--site-card-bg-hover));
  border-color: hsl(var(--site-card-border-hover));
  box-shadow: var(--site-card-shadow-hover);
}

.cyber-card:hover::before {
  opacity: var(--site-card-shine-hover);
}

/* 沛虹边框发光效果 */
.card-glow {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  opacity: 0;
  transition: opacity 400ms ease;
  pointer-events: none;
  box-shadow: 
    0 0 24px -4px var(--shadow-color),
    inset 0 0 16px -8px var(--shadow-color, hsl(var(--neon-cyan) / 0.2));
  z-index: 2;
}

.cyber-card:hover .card-glow {
  opacity: 0.85;
}

/* 边框发光线 - 更精细 */
.card-border-glow {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  border: 1px solid transparent;
  background: linear-gradient(
    135deg,
    hsl(var(--neon-cyan) / 0.1) 0%,
    hsl(var(--neon-purple) / 0.05) 50%,
    hsl(var(--neon-cyan) / 0.1) 100%
  );
  -webkit-mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 300ms ease;
  pointer-events: none;
  z-index: 3;
}

.cyber-card:hover .card-border-glow {
  opacity: 1;
}

/* 背景光晕装饰 - 更柔和 */
.card-bg-glow {
  position: absolute;
  top: -20%;
  right: -20%;
  width: 50%;
  height: 50%;
  border-radius: 50%;
  filter: blur(40px);
  opacity: 0;
  transition: opacity 500ms ease;
  pointer-events: none;
  z-index: 0;
}

.cyber-card:hover .card-bg-glow {
  opacity: 0.25;
}

/* 内容容器 */
.card-inner {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.card-inner.layout-list {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  width: 100%;
}

.card-inner.layout-minimal {
  flex-direction: column;
  gap: 0.5rem;
}

.card-inner.layout-compact {
  gap: 0.5rem;
}

/* 霞虹图标 */
.neon-icon {
  flex-shrink: 0;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all var(--duration-normal) var(--ease-spring);
  filter: brightness(var(--icon-brightness, 1));
  /* 使用主题适配的背景色 */
  background: hsl(var(--icon-placeholder-bg));
}

/* 深色模式下的图标蒙版 */
.neon-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--icon-overlay-opacity, 0));
  border-radius: inherit;
  pointer-events: none;
}

.neon-icon.size-sm {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
}

.neon-icon.size-md {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
}

.neon-icon.size-lg {
  width: 3.25rem;
  height: 3.25rem;
  border-radius: 0.75rem;
}

.neon-icon.icon-centered {
  margin: 0 auto 0.5rem;
}

.cyber-card:hover .neon-icon {
  transform: scale(1.08);
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-text {
  color: white;
  font-weight: 700;
}

.icon-text.text-lg {
  font-size: 1.25rem;
}

/* 卡片内容 */
.card-content {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}

.card-content.has-mt {
  margin-top: 0;
}

.title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.card-title {
  font-weight: 600;
  color: hsl(var(--text-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 300ms;
  line-height: 1.3;
}

.cyber-card:hover .card-title {
  color: hsl(var(--neon-cyan));
}

.title-compact,
.title-minimal {
  font-size: 0.8125rem;
}

.title-normal,
.title-list {
  font-size: 0.9375rem;
}

.title-large {
  font-size: 1rem;
}

/* 外链图标 */
.external-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--text-muted));
  opacity: 0;
  transform: translateX(-0.5rem);
  transition: all 300ms;
  flex-shrink: 0;
}

.cyber-card:hover .external-icon {
  opacity: 1;
  transform: translateX(0);
  color: hsl(var(--neon-cyan));
}

/* 描述 */
.card-desc {
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: hsl(var(--text-secondary));
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

/* List 模式外链按钮 */
.list-external-btn {
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 0.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--glass-bg));
  border: 1px solid hsl(var(--glass-border));
  flex-shrink: 0;
  transition: all 300ms;
}

.cyber-card:hover .list-external-btn {
  border-color: hsl(var(--neon-cyan) / 0.4);
  background: hsl(var(--neon-cyan) / 0.1);
}

.list-external-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--text-muted));
  transition: color 300ms;
}

.cyber-card:hover .list-external-icon {
  color: hsl(var(--neon-cyan));
}
</style>

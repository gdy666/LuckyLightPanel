<script setup lang="ts">
import { computed } from 'vue'
import { useNavStore } from '@/stores/nav'
import { useConfigStore } from '@/stores/config'
import { Cpu, MemoryStick, ArrowDownToLine, ArrowUpFromLine, Activity, Box, Zap } from 'lucide-vue-next'
import type { DockerContainer } from '@/types'

const props = defineProps<{
  container: DockerContainer
  listMaxWidths?: {
    status: number
    cpu: number
    memory: number
    networkRx: number
    networkTx: number
  }
}>()

const navStore = useNavStore()
const configStore = useConfigStore()

// 布局模式
const layout = computed(() => configStore.dockerLayout)

// 获取容器统计数据
const stats = computed(() => {
  return navStore.getContainerStats(props.container.containerName)
})

// 容器状态
const containerState = computed(() => {
  return stats.value?.state || props.container.state || 'unknown'
})

// 容器状态详情（包含运行时长）
const containerStatus = computed(() => {
  return stats.value?.status || props.container.status || ''
})

// 解析状态时长信息
const statusDuration = computed(() => {
  const status = containerStatus.value
  if (!status) return ''
  
  // 解析 "Up 2 hours"、"Up 3 days"、"Exited (0) 2 hours ago" 等格式
  const upMatch = status.match(/Up\s+(.+?)(?:\s+\(|$)/)
  const exitedMatch = status.match(/Exited.*?\)\s+(.+?)\s+ago/)
  
  if (upMatch) {
    return translateDuration(upMatch[1].trim())
  }
  if (exitedMatch) {
    return translateDuration(exitedMatch[1].trim()) + '前'
  }
  return ''
})

// 翻译时长为中文
function translateDuration(durationStr: string): string {
  if (!durationStr) return ''
  
  // 特殊格式处理
  const lowerStr = durationStr.toLowerCase()
  if (lowerStr === 'about a minute') return '约1分钟'
  if (lowerStr === 'about an hour') return '约1小时'
  if (lowerStr === 'less than a second') return '不到一秒'
  
  // 翻译映射
  const translations: Record<string, string> = {
    'second': '秒',
    'seconds': '秒',
    'minute': '分钟',
    'minutes': '分钟',
    'hour': '小时',
    'hours': '小时',
    'day': '天',
    'days': '天',
    'week': '周',
    'weeks': '周',
    'month': '月',
    'months': '月'
  }
  
  // 匹配 "数字 + 单位" 格式
  const match = durationStr.match(/(\d+)\s+(\w+)/)
  if (match) {
    const num = match[1]
    const unit = match[2].toLowerCase()
    const translatedUnit = translations[unit] || unit
    return num + translatedUnit
  }
  
  return durationStr
}

// 状态配置 - 霓虹风格
const stateConfig = computed(() => {
  switch (containerState.value) {
    case 'running':
      return { 
        class: 'status-running', 
        text: '运行中', 
        shortText: 'RUN',
        color: 'hsl(var(--neon-green))',
        bgColor: 'hsl(var(--neon-green) / 0.1)',
        borderColor: 'hsl(var(--neon-green) / 0.3)',
        shadow: 'var(--neon-green)'
      }
    case 'exited':
    case 'dead':
      return { 
        class: 'status-stopped', 
        text: '已停止', 
        shortText: 'STOP',
        color: 'hsl(var(--error))',
        bgColor: 'hsl(var(--error) / 0.1)',
        borderColor: 'hsl(var(--error) / 0.3)',
        shadow: 'var(--error)'
      }
    case 'paused':
    case 'restarting':
      return { 
        class: 'status-paused', 
        text: containerState.value === 'paused' ? '已暂停' : '重启中', 
        shortText: containerState.value === 'paused' ? 'PAUSE' : 'RESTART',
        color: 'hsl(var(--warning))',
        bgColor: 'hsl(var(--warning) / 0.1)',
        borderColor: 'hsl(var(--warning) / 0.3)',
        shadow: 'var(--warning)'
      }
    default:
      return { 
        class: 'status-unknown', 
        text: '未知', 
        shortText: '---',
        color: 'hsl(var(--text-muted))',
        bgColor: 'hsl(var(--text-muted) / 0.1)',
        borderColor: 'hsl(var(--text-muted) / 0.2)',
        shadow: 'var(--text-muted)'
      }
  }
})

// 格式化网速
function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} K/s`
  return `${(bytesPerSec / 1024 / 1024).toFixed(1)} M/s`
}

// 格式化简短网速
function formatSpeedShort(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec}B`
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(0)}K`
  return `${(bytesPerSec / 1024 / 1024).toFixed(1)}M`
}

// 显示名称
const displayName = computed(() => {
  return props.container.displayName || props.container.containerName
})

// CPU 百分比数值
const cpuValue = computed(() => {
  const cpu = stats.value?.cpuPercent || '0%'
  return parseFloat(cpu.replace('%', '')) || 0
})

// 卡片类名
const cardClass = computed(() => {
  const classes = ['docker-card', 'group']
  if (layout.value === 'list') classes.push('layout-list')
  else if (layout.value === 'minimal') classes.push('layout-minimal')
  else if (layout.value === 'compact') classes.push('layout-compact')
  else classes.push('layout-normal')
  return classes.join(' ')
})

// 图标背景样式（根据是否有自定义图标区分）
const iconBgStyle = computed(() => {
  if (props.container.iconUrl) {
    // 有图标：使用主题适配的中性背景
    return {
      boxShadow: `0 4px 20px -4px hsl(var(--icon-placeholder-bg) / 0.5)`
    }
  } else {
    // 无图标：使用状态颜色渐变背景
    return {
      background: `linear-gradient(135deg, ${stateConfig.value.color}, hsl(var(--docker-orange)))`,
      boxShadow: `0 4px 20px -4px hsl(${stateConfig.value.shadow} / 0.5)`
    }
  }
})

// 紧凑布局图标背景样式
const compactIconBgStyle = computed(() => {
  if (props.container.iconUrl) {
    return {
      boxShadow: `0 2px 12px -2px hsl(var(--icon-placeholder-bg) / 0.4)`
    }
  } else {
    return {
      background: `linear-gradient(135deg, ${stateConfig.value.color}, hsl(var(--docker-orange)))`,
      boxShadow: `0 2px 12px -2px hsl(${stateConfig.value.shadow} / 0.4)`
    }
  }
})

// 列表布局图标背景样式
const listIconBgStyle = computed(() => {
  if (props.container.iconUrl) {
    return {
      boxShadow: `0 2px 10px -2px hsl(var(--icon-placeholder-bg) / 0.4)`
    }
  } else {
    return {
      background: `linear-gradient(135deg, ${stateConfig.value.color}, hsl(var(--docker-orange)))`,
      boxShadow: `0 2px 10px -2px hsl(${stateConfig.value.shadow} / 0.4)`
    }
  }
})

// 极简布局图标背景样式
const minimalIconBgStyle = computed(() => {
  if (props.container.iconUrl) {
    return {
      boxShadow: `0 3px 15px -3px hsl(var(--icon-placeholder-bg) / 0.5)`
    }
  } else {
    return {
      background: `linear-gradient(135deg, ${stateConfig.value.color}, hsl(var(--docker-orange)))`,
      boxShadow: `0 3px 15px -3px hsl(${stateConfig.value.shadow} / 0.5)`
    }
  }
})
</script>

<template>
  <div :class="cardClass">
    <!-- 霓虹边框效果 -->
    <div 
      class="card-glow"
      :style="{ '--shadow-color': `hsl(${stateConfig.shadow})` }"
    />
    
    <!-- 边框发光线 -->
    <div 
      class="card-border-glow"
      :style="{ borderColor: containerState === 'running' ? stateConfig.borderColor : 'transparent' }"
    />
    
    <!-- 背景装饰 -->
    <div 
      class="card-bg-decor"
      :style="{ background: `linear-gradient(135deg, ${stateConfig.color}, hsl(var(--docker-orange)))` }"
    />
    
    <!-- ============ Normal 布局 - 详细信息 ============ -->
    <template v-if="layout === 'normal'">
      <div class="card-inner">
        <!-- 头部：图标和名称 -->
        <div class="card-header">
          <div class="icon-wrapper">
            <div 
              class="icon-box"
              :style="iconBgStyle"
            >
              <img
                v-if="container.iconUrl"
                :src="`./backend/iconlibs/${container.iconUrl}`"
                :alt="displayName"
                class="icon-img"
                @error="($event.target as HTMLImageElement).style.display = 'none'"
              />
              <Box v-else class="icon-default" />
            </div>
            <div class="status-indicator" :class="stateConfig.class" />
          </div>
          
          <div class="header-content">
            <h3 class="card-title">{{ displayName }}</h3>
            <div class="status-row">
              <span 
                class="status-badge"
                :style="{ color: stateConfig.color, backgroundColor: stateConfig.bgColor }"
              >
                {{ stateConfig.text }}
              </span>
              <span v-if="statusDuration" class="status-duration">
                {{ statusDuration }}
              </span>
              <Activity 
                v-if="containerState === 'running'" 
                class="activity-icon animate-pulse" 
                :style="{ color: stateConfig.color }" 
              />
            </div>
          </div>
        </div>

        <!-- 统计数据 -->
        <div v-if="stats && containerState === 'running'" class="stats-section">
          <div class="stats-grid">
            <!-- CPU -->
            <div 
              class="stat-box"
              :style="{ backgroundColor: stateConfig.bgColor, borderColor: stateConfig.borderColor }"
            >
              <div class="stat-header">
                <Cpu class="stat-icon" :style="{ color: stateConfig.color }" />
                <span class="stat-label">CPU</span>
              </div>
              <div class="stat-value-row">
                <span class="stat-value" :style="{ color: stateConfig.color }">
                  {{ cpuValue.toFixed(1) }}
                </span>
                <span class="stat-unit">%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  :style="{ 
                    width: `${Math.min(cpuValue, 100)}%`,
                    background: `linear-gradient(90deg, ${stateConfig.color}, hsl(var(--docker-orange)))` 
                  }" 
                />
              </div>
            </div>
            
            <!-- 内存 -->
            <div class="stat-box stat-memory">
              <div class="stat-header">
                <MemoryStick class="stat-icon mem-icon" />
                <span class="stat-label">MEM</span>
              </div>
              <div class="stat-value mem-value">
                {{ stats.memoryUsage || '-' }}
              </div>
            </div>
          </div>
          
          <!-- 网络速度 -->
          <div class="network-stats">
            <div class="network-item">
              <div class="network-icon-box download">
                <ArrowDownToLine class="network-icon" />
              </div>
              <span class="network-speed">
                {{ formatSpeed(stats.networkRxSpeed || 0) }}
              </span>
            </div>
            <div class="network-item">
              <span class="network-speed">
                {{ formatSpeed(stats.networkTxSpeed || 0) }}
              </span>
              <div class="network-icon-box upload">
                <ArrowUpFromLine class="network-icon" />
              </div>
            </div>
          </div>
        </div>

        <!-- 非运行状态提示 -->
        <div v-else-if="containerState !== 'running'" class="stopped-state">
          <div 
            class="stopped-box"
            :style="{ backgroundColor: stateConfig.bgColor, borderColor: stateConfig.borderColor }"
          >
            <span class="stopped-text" :style="{ color: stateConfig.color }">容器未运行</span>
            <span v-if="statusDuration" class="stopped-duration" :style="{ color: stateConfig.color }">
              · {{ statusDuration }}
            </span>
          </div>
        </div>

        <!-- 描述 -->
        <p v-if="container.description" class="card-desc">
          {{ container.description }}
        </p>
      </div>
    </template>

    <!-- ============ Compact 布局 - 紧凑信息 ============ -->
    <template v-else-if="layout === 'compact'">
      <div class="card-inner-compact">
        <div class="compact-header">
          <div 
            class="compact-icon"
            :style="compactIconBgStyle"
          >
            <img
              v-if="container.iconUrl"
              :src="`./backend/iconlibs/${container.iconUrl}`"
              :alt="displayName"
              class="icon-img"
              @error="($event.target as HTMLImageElement).style.display = 'none'"
            />
            <Box v-else class="icon-default-sm" />
          </div>
          <div class="compact-content">
            <h3 class="compact-title">{{ displayName }}</h3>
            <div class="compact-status">
              <span 
                class="status-dot"
                :style="{ backgroundColor: stateConfig.color, boxShadow: `0 0 6px hsl(${stateConfig.shadow} / 0.6)` }"
              />
              <span class="status-text" :style="{ color: stateConfig.color }">{{ stateConfig.text }}</span>
              <span v-if="statusDuration" class="status-duration-compact">{{ statusDuration }}</span>
            </div>
          </div>
        </div>
        
        <!-- 简化统计 -->
        <div v-if="stats && containerState === 'running'" class="compact-stats">
          <div class="compact-stat">
            <Cpu class="compact-stat-icon" :style="{ color: stateConfig.color }" />
            <span class="compact-stat-value">{{ cpuValue.toFixed(0) }}%</span>
          </div>
          <div class="compact-stat">
            <MemoryStick class="compact-stat-icon mem" />
            <span class="compact-stat-value">{{ stats.memoryUsage?.split('/')[0] || '-' }}</span>
          </div>
        </div>
        <div v-else class="compact-offline">
          <Zap class="offline-icon" :style="{ color: stateConfig.color }" />
        </div>
      </div>
    </template>

    <!-- ============ List 布局 - 横向列表 ============ -->
    <template v-else-if="layout === 'list'">
      <div class="card-inner-list">
        <div 
          class="list-icon"
          :style="listIconBgStyle"
        >
          <img
            v-if="container.iconUrl"
            :src="`./backend/iconlibs/${container.iconUrl}`"
            :alt="displayName"
            class="icon-img"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <Box v-else class="icon-default-sm" />
        </div>
        
        <div class="list-content">
          <h3 class="list-title">{{ displayName }}</h3>
          <p v-if="container.description" class="list-desc">{{ container.description }}</p>
        </div>

        <div class="list-status">
          <span 
            class="list-status-badge"
            :style="{ 
              color: stateConfig.color, 
              backgroundColor: stateConfig.bgColor, 
              borderColor: stateConfig.borderColor,
              width: props.listMaxWidths?.status ? `${props.listMaxWidths.status}px` : 'auto'
            }"
          >
            <span 
              class="status-dot-sm"
              :style="{ backgroundColor: stateConfig.color }"
            />
            {{ stateConfig.text }}
            <span v-if="statusDuration" class="status-duration-list">{{ statusDuration }}</span>
          </span>
        </div>

        <!-- 统计数据 -->
        <div v-if="stats && containerState === 'running'" class="list-stats">
          <div 
            class="list-stat list-stat-cpu" 
            title="CPU 使用率"
            :style="{ width: props.listMaxWidths?.cpu ? `${props.listMaxWidths.cpu}px` : 'auto' }"
          >
            <Cpu class="list-stat-icon" :style="{ color: stateConfig.color }" />
            <span class="list-stat-value">{{ cpuValue.toFixed(0) }}%</span>
          </div>
          <div 
            class="list-stat list-stat-memory" 
            title="内存使用"
            :style="{ width: props.listMaxWidths?.memory ? `${props.listMaxWidths.memory}px` : 'auto' }"
          >
            <MemoryStick class="list-stat-icon mem" />
            <span class="list-stat-value">{{ stats.memoryUsage?.split('/')[0] || '-' }}</span>
          </div>
          <div 
            class="list-stat list-stat-rx network-down" 
            title="下载速度"
            :style="{ width: props.listMaxWidths?.networkRx ? `${props.listMaxWidths.networkRx}px` : 'auto' }"
          >
            <ArrowDownToLine class="list-stat-icon" />
            <span class="list-stat-value">{{ formatSpeedShort(stats.networkRxSpeed || 0) }}</span>
          </div>
          <div 
            class="list-stat list-stat-tx network-up" 
            title="上传速度"
            :style="{ width: props.listMaxWidths?.networkTx ? `${props.listMaxWidths.networkTx}px` : 'auto' }"
          >
            <ArrowUpFromLine class="list-stat-icon" />
            <span class="list-stat-value">{{ formatSpeedShort(stats.networkTxSpeed || 0) }}</span>
          </div>
        </div>
        <div v-else class="list-stats-placeholder">
          <span class="offline-label" :style="{ color: stateConfig.color }">OFFLINE</span>
        </div>
      </div>
    </template>

    <!-- ============ Minimal 布局 - 极简 ============ -->
    <template v-else>
      <div class="card-inner-minimal">
        <div 
          class="minimal-icon"
          :style="minimalIconBgStyle"
        >
          <img
            v-if="container.iconUrl"
            :src="`./backend/iconlibs/${container.iconUrl}`"
            :alt="displayName"
            class="icon-img"
            @error="($event.target as HTMLImageElement).style.display = 'none'"
          />
          <Box v-else class="icon-default-md" />
          <!-- 状态指示器 -->
          <div 
            class="minimal-status-dot"
            :class="stateConfig.class"
            :style="{ boxShadow: `0 0 8px hsl(${stateConfig.shadow} / 0.8)` }"
          />
        </div>
        <h3 class="minimal-title">{{ displayName }}</h3>
        <div v-if="stats && containerState === 'running'" class="minimal-stats">
          <span class="minimal-cpu" :style="{ color: stateConfig.color }">{{ cpuValue.toFixed(0) }}%</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ============================================
   Docker 卡片 - 四种布局模式
   科技感 + 简约美观设计
   复用站点卡片磨砂样式变量
   ============================================ */

/* 卡片基础容器 - 复用站点卡片磨砂样式 */
.docker-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-lg);
  /* 复用站点卡片专属变量 */
  background: hsl(var(--site-card-bg));
  backdrop-filter: blur(var(--site-card-blur)) saturate(var(--site-card-saturation));
  -webkit-backdrop-filter: blur(var(--site-card-blur)) saturate(var(--site-card-saturation));
  border: 1px solid hsl(var(--site-card-border));
  box-shadow: var(--site-card-shadow);
  transition: all var(--duration-normal) var(--ease-out);
}

/* 磨砂内层叠加 - 增强通透感 */
.docker-card::before {
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

.docker-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: hsl(var(--site-card-bg-hover));
  border-color: hsl(var(--site-card-border-hover));
  box-shadow: var(--site-card-shadow-hover);
}

.docker-card:hover::before {
  opacity: var(--site-card-shine-hover);
}

/* Normal 布局 */
.docker-card.layout-normal {
  padding: 1rem;
}

/* Compact 布局 */
.docker-card.layout-compact {
  padding: 0.75rem;
}

/* List 布局 */
.docker-card.layout-list {
  padding: 0.75rem 1rem;
}

.docker-card.layout-list:hover {
  transform: translateY(-2px) scale(1.005);
}

/* Minimal 布局 */
.docker-card.layout-minimal {
  padding: 0.75rem 0.5rem;
  text-align: center;
}

.docker-card.layout-minimal:hover {
  transform: translateY(-3px) scale(1.02);
}

/* 霓虹边框效果 */
.card-glow {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-lg);
  opacity: 0;
  transition: opacity 500ms;
  pointer-events: none;
  box-shadow: 0 0 30px -8px var(--shadow-color), inset 0 0 20px -12px var(--shadow-color, hsl(var(--docker-orange) / 0.3));
}

.docker-card:hover .card-glow {
  opacity: 0.9;
}

/* 边框发光线 */
.card-border-glow {
  position: absolute;
  inset: 1px;
  border-radius: calc(var(--radius-lg) - 1px);
  border: 1px solid transparent;
  transition: border-color 300ms;
  pointer-events: none;
}

/* 背景装饰 */
.card-bg-decor {
  position: absolute;
  top: -5rem;
  right: -5rem;
  width: 10rem;
  height: 10rem;
  border-radius: 50%;
  filter: blur(48px);
  opacity: 0;
  transition: opacity 700ms;
  pointer-events: none;
}

.docker-card:hover .card-bg-decor {
  opacity: 0.35;
}

/* ============ Normal 布局样式 ============ */
.card-inner {
  position: relative;
  z-index: 10;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.icon-wrapper {
  position: relative;
}

.icon-box {
  width: 3rem;
  height: 3rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  filter: brightness(var(--icon-brightness, 1));
  position: relative;
  /* 使用主题适配的背景色 */
  background: hsl(var(--icon-placeholder-bg));
}

/* 深色模式下的图标蒙版 */
.icon-box::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--icon-overlay-opacity, 0));
  border-radius: inherit;
  pointer-events: none;
}

.icon-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.icon-default {
  width: 1.5rem;
  height: 1.5rem;
  color: white;
}

.status-indicator {
  position: absolute;
  bottom: -0.125rem;
  right: -0.125rem;
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  border: 2px solid hsl(var(--card-bg));
}

.status-indicator.status-running { background: hsl(var(--neon-green)); }
.status-indicator.status-stopped { background: hsl(var(--error)); }
.status-indicator.status-paused { background: hsl(var(--warning)); }
.status-indicator.status-unknown { background: hsl(var(--text-muted)); }

.header-content {
  flex: 1;
  min-width: 0;
}

.card-title {
  font-weight: 600;
  font-size: 0.9375rem;
  color: hsl(var(--text-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 300ms;
}

.docker-card:hover .card-title {
  color: hsl(var(--docker-orange));
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.125rem;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
}

.status-duration {
  font-size: 0.6875rem;
  color: hsl(var(--text-muted));
  font-weight: 400;
}

.activity-icon {
  width: 0.75rem;
  height: 0.75rem;
}

/* 统计数据区域 */
.stats-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.stat-box {
  border-radius: 0.75rem;
  padding: 0.625rem;
  border: 1px solid transparent;
  transition: all var(--duration-fast) ease;
}

.stat-memory {
  background-color: hsl(var(--neon-purple) / 0.1);
  border-color: hsl(var(--neon-purple) / 0.3);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.375rem;
}

.stat-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.mem-icon {
  color: hsl(var(--neon-purple));
}

.stat-label {
  font-size: 0.75rem;
  color: hsl(var(--text-secondary));
}

.stat-value-row {
  display: flex;
  align-items: baseline;
  gap: 0.25rem;
}

.stat-value {
  font-size: 1.125rem;
  font-weight: 700;
  font-family: ui-monospace, monospace;
}

.stat-unit {
  font-size: 0.75rem;
  color: hsl(var(--text-muted));
}

.mem-value {
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--neon-purple));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: ui-monospace, monospace;
}

/* 进度条 */
.progress-bar {
  margin-top: 0.5rem;
  height: 0.25rem;
  border-radius: 9999px;
  overflow: hidden;
  background: hsl(var(--text-muted) / 0.1);
}

.progress-fill {
  height: 100%;
  border-radius: 9999px;
  transition: width 500ms;
}

/* 网络统计 */
.network-stats {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 0.25rem;
}

.network-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.network-icon-box {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.network-icon-box.download {
  background: hsl(var(--neon-green) / 0.1);
}

.network-icon-box.upload {
  background: hsl(var(--neon-blue) / 0.1);
}

.network-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.network-icon-box.download .network-icon {
  color: hsl(var(--neon-green));
}

.network-icon-box.upload .network-icon {
  color: hsl(var(--neon-blue));
}

.network-speed {
  font-size: 0.75rem;
  color: hsl(var(--text-secondary));
  font-weight: 500;
  font-family: ui-monospace, monospace;
}

/* 停止状态 */
.stopped-state {
  margin-top: 0.5rem;
}

.stopped-box {
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: center;
  border: 1px solid transparent;
}

.stopped-text {
  font-size: 0.75rem;
}

.stopped-duration {
  font-size: 0.6875rem;
  opacity: 0.8;
  margin-left: 0.25rem;
}

/* 描述 */
.card-desc {
  margin-top: 0.75rem;
  font-size: 0.75rem;
  color: hsl(var(--text-muted));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============ Compact 布局样式 ============ */
.card-inner-compact {
  position: relative;
  z-index: 10;
}

.compact-header {
  display: flex;
  align-items: center;
  gap: 0.625rem;
}

.compact-icon {
  width: 2.25rem;
  height: 2.25rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  filter: brightness(var(--icon-brightness, 1));
  position: relative;
  /* 使用主题适配的背景色 */
  background: hsl(var(--icon-placeholder-bg));
}

.compact-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--icon-overlay-opacity, 0));
  border-radius: inherit;
  pointer-events: none;
}

.icon-default-sm {
  width: 1.125rem;
  height: 1.125rem;
  color: white;
}

.compact-content {
  flex: 1;
  min-width: 0;
}

.compact-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: hsl(var(--text-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 300ms;
  line-height: 1.3;
}

.docker-card:hover .compact-title {
  color: hsl(var(--docker-orange));
}

.compact-status {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  margin-top: 0.125rem;
}

.status-dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-text {
  font-size: 0.6875rem;
  font-weight: 500;
}

.status-duration-compact {
  font-size: 0.625rem;
  color: hsl(var(--text-muted));
  margin-left: 0.25rem;
}

.compact-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.625rem;
  padding-top: 0.5rem;
  border-top: 1px solid hsl(var(--glass-border));
}

.compact-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.compact-stat-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.compact-stat-icon.mem {
  color: hsl(var(--neon-purple));
}

.compact-stat-value {
  font-size: 0.6875rem;
  font-weight: 600;
  color: hsl(var(--text-secondary));
  font-family: ui-monospace, monospace;
}

.compact-offline {
  display: flex;
  justify-content: center;
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  border-top: 1px solid hsl(var(--glass-border));
}

.offline-icon {
  width: 1rem;
  height: 1rem;
  opacity: 0.5;
}

/* ============ List 布局样式 ============ */
.card-inner-list {
  position: relative;
  z-index: 10;
  display: flex;
  align-items: center;
  gap: 0.875rem;
}

.list-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.625rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
  filter: brightness(var(--icon-brightness, 1));
  position: relative;
  /* 使用主题适配的背景色 */
  background: hsl(var(--icon-placeholder-bg));
}

.list-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--icon-overlay-opacity, 0));
  border-radius: inherit;
  pointer-events: none;
}

.list-content {
  flex: 1;
  min-width: 0;
}

.list-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: hsl(var(--text-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color 300ms;
}

.docker-card:hover .list-title {
  color: hsl(var(--docker-orange));
}

.list-desc {
  font-size: 0.6875rem;
  color: hsl(var(--text-muted));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 0.125rem;
}

.list-status {
  flex-shrink: 0;
}

.list-status-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid;
}

.status-duration-list {
  font-size: 0.625rem;
  opacity: 0.8;
  font-weight: 400;
}

.status-dot-sm {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 50%;
  flex-shrink: 0;
}

.list-stats {
  display: flex;
  align-items: center;
  gap: 0.625rem;
  flex-shrink: 0;
}

.list-stat {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  background: hsl(var(--glass-bg));
}

.list-stat.network-down {
  background: hsl(var(--neon-green) / 0.08);
}

.list-stat.network-up {
  background: hsl(var(--neon-blue) / 0.08);
}

.list-stat-icon {
  width: 0.75rem;
  height: 0.75rem;
}

.list-stat-icon.mem {
  color: hsl(var(--neon-purple));
}

.list-stat.network-down .list-stat-icon {
  color: hsl(var(--neon-green));
}

.list-stat.network-up .list-stat-icon {
  color: hsl(var(--neon-blue));
}

.list-stat-value {
  font-size: 0.6875rem;
  font-weight: 600;
  color: hsl(var(--text-secondary));
  font-family: ui-monospace, monospace;
}

.list-stats-placeholder {
  min-width: 4rem;
  text-align: center;
}

.offline-label {
  font-size: 0.625rem;
  font-weight: 700;
  letter-spacing: 0.05em;
  opacity: 0.7;
}

/* ============ Minimal 布局样式 ============ */
.card-inner-minimal {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.minimal-icon {
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  position: relative;
  transition: transform 300ms var(--ease-spring);
  filter: brightness(var(--icon-brightness, 1));
  /* 使用主题适配的背景色 */
  background: hsl(var(--icon-placeholder-bg));
}

.minimal-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--icon-overlay-opacity, 0));
  border-radius: inherit;
  pointer-events: none;
}

.docker-card:hover .minimal-icon {
  transform: scale(1.1);
}

.icon-default-md {
  width: 1.375rem;
  height: 1.375rem;
  color: white;
}

.minimal-status-dot {
  position: absolute;
  bottom: -2px;
  right: -2px;
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  border: 2px solid hsl(var(--card-bg));
}

.minimal-status-dot.status-running { background: hsl(var(--neon-green)); }
.minimal-status-dot.status-stopped { background: hsl(var(--error)); }
.minimal-status-dot.status-paused { background: hsl(var(--warning)); }
.minimal-status-dot.status-unknown { background: hsl(var(--text-muted)); }

.minimal-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: hsl(var(--text-primary));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  transition: color 300ms;
  line-height: 1.2;
}

.docker-card:hover .minimal-title {
  color: hsl(var(--docker-orange));
}

.minimal-stats {
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimal-cpu {
  font-size: 0.625rem;
  font-weight: 700;
  font-family: ui-monospace, monospace;
}

/* ============ 响应式适配 ============ */
@media (max-width: 640px) {
  .card-inner-list {
    flex-wrap: wrap;
  }
  
  /* 移动端：统计数据换到第二行，状态保持在容器名称右侧 */
  .list-stats,
  .list-stats-placeholder {
    width: 100%;
    justify-content: flex-start;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid hsl(var(--glass-border));
  }
}
</style>

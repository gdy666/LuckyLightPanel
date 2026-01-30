<script setup lang="ts">
import { computed } from 'vue'
import { useNavStore } from '@/stores/nav'
import { useConfigStore } from '@/stores/config'
import { Globe, Network, Wifi, ArrowDownToLine, ArrowUpFromLine, Activity, Zap, Copy, Check } from 'lucide-vue-next'
import { ref } from 'vue'
import type { LuckyService } from '@/types'

const props = defineProps<{
  service: LuckyService
  listMaxWidths?: {
    status: number
    type: number
    trafficIn: number
    trafficOut: number
  }
}>()

const navStore = useNavStore()
const configStore = useConfigStore()

// 复制状态
const copied = ref(false)

// 复制到剪贴板
async function copyToClipboard(text: string, event: MouseEvent) {
  event.stopPropagation()
  try {
    await navigator.clipboard.writeText(text)
    copied.value = true
    setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch (err) {
    console.error('Failed to copy:', err)
  }
}

// 布局模式
const layout = computed(() => configStore.luckyServicesLayout)

// 获取服务统计数据
const stats = computed(() => {
  return navStore.getServiceStats(props.service.key)
})

// 服务状态
const serviceState = computed(() => {
  return stats.value?.state || props.service.state || 'unknown'
})

// 状态配置 - 霓虹风格
const stateConfig = computed(() => {
  switch (serviceState.value) {
    case 'running':
    case 'enabled':
      return {
        class: 'status-running',
        text: serviceState.value === 'running' ? '运行中' : '已启用',
        shortText: 'RUN',
        color: 'hsl(var(--neon-green))',
        bgColor: 'hsl(var(--neon-green) / 0.1)',
        borderColor: 'hsl(var(--neon-green) / 0.3)',
        shadow: 'var(--neon-green)'
      }
    case 'stopped':
    case 'disabled':
      return {
        class: 'status-stopped',
        text: serviceState.value === 'stopped' ? '已停止' : '已禁用',
        shortText: 'STOP',
        color: 'hsl(var(--text-muted))',
        bgColor: 'hsl(var(--text-muted) / 0.1)',
        borderColor: 'hsl(var(--text-muted) / 0.2)',
        shadow: 'var(--text-muted)'
      }
    case 'error':
      return {
        class: 'status-error',
        text: '错误',
        shortText: 'ERR',
        color: 'hsl(var(--error))',
        bgColor: 'hsl(var(--error) / 0.1)',
        borderColor: 'hsl(var(--error) / 0.3)',
        shadow: 'var(--error)'
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

// 服务类型配置
const typeConfig = computed(() => {
  switch (props.service.serviceType) {
    case 'webservice':
    case 'webservice-main':
    case 'webservice-default':
      return {
        icon: Globe,
        label: 'Web服务',
        shortLabel: 'WEB',
        color: 'var(--neon-cyan)',
        shadow: 'var(--neon-cyan)'
      }
    case 'portforward':
      return {
        icon: Network,
        label: '端口转发',
        shortLabel: 'PF',
        color: 'var(--neon-purple)',
        shadow: 'var(--neon-purple)'
      }
    case 'stun':
      return {
        icon: Wifi,
        label: 'STUN',
        shortLabel: 'STUN',
        color: 'var(--warning)',
        shadow: 'var(--warning)'
      }
    default:
      return {
        icon: Globe,
        label: '服务',
        shortLabel: 'SVC',
        color: 'var(--neon-blue)',
        shadow: 'var(--neon-blue)'
      }
  }
})

// 显示名称
const displayName = computed(() => {
  return props.service.displayName || props.service.name
})

// 格式化流量
function formatTraffic(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`
}

// 格式化简短流量
function formatTrafficShort(bytes: number): string {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}K`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)}M`
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}G`
}

// 格式化速度
function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec < 1024) return `${bytesPerSec} B/s`
  if (bytesPerSec < 1024 * 1024) return `${(bytesPerSec / 1024).toFixed(1)} K/s`
  return `${(bytesPerSec / 1024 / 1024).toFixed(1)} M/s`
}

// 是否活跃
const isActive = computed(() => {
  return serviceState.value === 'running' || serviceState.value === 'enabled'
})

// 卡片类名
const cardClass = computed(() => {
  const classes = ['service-card', 'group']
  if (layout.value === 'list') classes.push('layout-list')
  else if (layout.value === 'minimal') classes.push('layout-minimal')
  else if (layout.value === 'compact') classes.push('layout-compact')
  else classes.push('layout-normal')
  return classes.join(' ')
})
</script>

<template>
  <div :class="cardClass">
    <!-- 霓虹边框效果 -->
    <div 
      class="card-glow"
      :style="{ '--shadow-color': `hsl(${typeConfig.shadow})` }"
    />
    
    <!-- 边框发光线 -->
    <div 
      class="card-border-glow"
      :style="{ borderColor: isActive ? stateConfig.borderColor : 'transparent' }"
    />
    
    <!-- 背景装饰 -->
    <div 
      class="card-bg-decor"
      :style="{ background: `linear-gradient(135deg, hsl(${typeConfig.color}), hsl(var(--neon-cyan)))` }"
    />
    
    <!-- ============ Normal 布局 - 详细信息 ============ -->
    <template v-if="layout === 'normal'">
      <div class="card-inner">
        <!-- 头部：图标和名称 -->
        <div class="card-header">
          <div class="icon-wrapper">
            <div 
              class="icon-box"
              :style="{ 
                background: `linear-gradient(135deg, hsl(${typeConfig.color}), hsl(var(--neon-cyan)))`,
                boxShadow: `0 4px 20px -4px hsl(${typeConfig.shadow} / 0.5)` 
              }"
            >
              <component :is="typeConfig.icon" class="icon-default" />
            </div>
            <div class="status-indicator" :class="stateConfig.class" />
          </div>
          
          <div class="header-content">
            <h3 class="card-title">{{ displayName }}</h3>
            <div class="status-row">
              <span 
                class="type-badge"
                :style="{ 
                  color: `hsl(${typeConfig.color})`, 
                  backgroundColor: `hsl(${typeConfig.color} / 0.1)`,
                  borderColor: `hsl(${typeConfig.color} / 0.2)`
                }"
              >
                {{ typeConfig.label }}
              </span>
              <span 
                class="status-badge"
                :style="{ color: stateConfig.color, backgroundColor: stateConfig.bgColor }"
              >
                {{ stateConfig.text }}
              </span>
              <Activity 
                v-if="isActive" 
                class="activity-icon animate-pulse" 
                :style="{ color: stateConfig.color }" 
              />
            </div>
          </div>
        </div>

        <!-- 统计数据 -->
        <div v-if="stats && isActive" class="stats-section">
          <!-- 连接数 -->
          <div 
            v-if="stats.tcpCurrentConnections > 0 || stats.udpCurrentConnections > 0" 
            class="connection-row"
          >
            <div class="connection-icon-box">
              <Zap class="connection-icon" />
            </div>
            <div class="connection-stats">
              <span v-if="stats.tcpCurrentConnections > 0" class="conn-item">
                <span class="conn-label">TCP:</span>
                <span class="conn-value">{{ stats.tcpCurrentConnections }}</span>
              </span>
              <span v-if="stats.udpCurrentConnections > 0" class="conn-item">
                <span class="conn-label">UDP:</span>
                <span class="conn-value">{{ stats.udpCurrentConnections }}</span>
              </span>
            </div>
          </div>
          
          <!-- 流量和速度 -->
          <div class="traffic-grid">
            <!-- 下行 -->
            <div class="stat-box stat-in">
              <div class="stat-header">
                <ArrowDownToLine class="stat-icon in-icon" />
                <span class="stat-label">IN</span>
              </div>
              <div class="stat-value in-value">
                {{ formatTraffic(stats.trafficIn || 0) }}
              </div>
              <div class="stat-speed in-speed">
                {{ formatSpeed(stats.inSpeed || 0) }}
              </div>
            </div>
            
            <!-- 上行 -->
            <div class="stat-box stat-out">
              <div class="stat-header">
                <ArrowUpFromLine class="stat-icon out-icon" />
                <span class="stat-label">OUT</span>
              </div>
              <div class="stat-value out-value">
                {{ formatTraffic(stats.trafficOut || 0) }}
              </div>
              <div class="stat-speed out-speed">
                {{ formatSpeed(stats.outSpeed || 0) }}
              </div>
            </div>
          </div>
          
          <!-- 公网地址 (STUN) - 点击可复制 -->
          <div 
            v-if="stats.publicAddr" 
            class="public-addr-box"
            :title="copied ? '已复制' : '点击复制地址'"
            @click="copyToClipboard(stats.publicAddr, $event)"
          >
            <div class="addr-header">
              <Wifi class="addr-icon" />
              <span class="addr-label">Public</span>
              <Check v-if="copied" class="addr-copy-icon copied" />
              <Copy v-else class="addr-copy-icon" />
            </div>
            <p class="addr-value">{{ stats.publicAddr }}</p>
          </div>
        </div>

        <!-- 非活跃状态 -->
        <div v-else-if="!isActive" class="inactive-state">
          <div 
            class="inactive-box"
            :style="{ backgroundColor: stateConfig.bgColor, borderColor: stateConfig.borderColor }"
          >
            <span class="inactive-text" :style="{ color: stateConfig.color }">服务未启用</span>
          </div>
        </div>

        <!-- 描述 -->
        <p v-if="service.description" class="card-desc">
          {{ service.description }}
        </p>
      </div>
    </template>

    <!-- ============ Compact 布局 - 紧凑信息 ============ -->
    <template v-else-if="layout === 'compact'">
      <div class="card-inner-compact">
        <div class="compact-header">
          <div 
            class="compact-icon"
            :style="{ 
              background: `linear-gradient(135deg, hsl(${typeConfig.color}), hsl(var(--neon-cyan)))`,
              boxShadow: `0 2px 12px -2px hsl(${typeConfig.shadow} / 0.4)` 
            }"
          >
            <component :is="typeConfig.icon" class="icon-default-sm" />
          </div>
          <div class="compact-content">
            <h3 class="compact-title">{{ displayName }}</h3>
            <div class="compact-status">
              <span 
                class="status-dot"
                :style="{ backgroundColor: stateConfig.color, boxShadow: `0 0 6px hsl(${stateConfig.shadow} / 0.6)` }"
              />
              <span class="status-text" :style="{ color: stateConfig.color }">{{ stateConfig.text }}</span>
              <span class="type-text" :style="{ color: `hsl(${typeConfig.color})` }">{{ typeConfig.shortLabel }}</span>
            </div>
          </div>
        </div>
        
        <!-- 简化统计 -->
        <div v-if="stats && isActive" class="compact-stats">
          <!-- STUN 公网地址 -->
          <div 
            v-if="stats.publicAddr"
            class="compact-addr"
            :title="copied ? '已复制' : '点击复制'"
            @click="copyToClipboard(stats.publicAddr, $event)"
          >
            <Wifi class="compact-addr-icon" />
            <span class="compact-addr-text">{{ stats.publicAddr }}</span>
            <Check v-if="copied" class="compact-copy-icon copied" />
            <Copy v-else class="compact-copy-icon" />
          </div>
          <!-- 流量统计 -->
          <template v-if="!stats.publicAddr">
            <div class="compact-stat">
              <ArrowDownToLine class="compact-stat-icon in" />
              <span class="compact-stat-value">{{ formatTrafficShort(stats.trafficIn || 0) }}</span>
            </div>
            <div class="compact-stat">
              <ArrowUpFromLine class="compact-stat-icon out" />
              <span class="compact-stat-value">{{ formatTrafficShort(stats.trafficOut || 0) }}</span>
            </div>
          </template>
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
          :style="{ 
            background: `linear-gradient(135deg, hsl(${typeConfig.color}), hsl(var(--neon-cyan)))`,
            boxShadow: `0 2px 10px -2px hsl(${typeConfig.shadow} / 0.4)` 
          }"
        >
          <component :is="typeConfig.icon" class="icon-default-sm" />
        </div>
        
        <div class="list-content">
          <div class="list-title-row">
            <h3 class="list-title">{{ displayName }}</h3>
            <!-- STUN 公网地址 - 同行显示 -->
            <div 
              v-if="stats?.publicAddr" 
              class="list-public-addr"
              :title="copied ? '已复制' : '点击复制地址'"
              @click="copyToClipboard(stats.publicAddr, $event)"
            >
              <Wifi class="list-addr-icon" />
              <span class="list-addr-text">{{ stats.publicAddr }}</span>
              <Check v-if="copied" class="list-copy-icon copied" />
              <Copy v-else class="list-copy-icon" />
            </div>
          </div>
          <p v-if="service.description" class="list-desc">{{ service.description }}</p>
        </div>

        <div class="list-type">
          <span 
            class="list-type-badge"
            :style="{ 
              color: `hsl(${typeConfig.color})`, 
              backgroundColor: `hsl(${typeConfig.color} / 0.1)`, 
              borderColor: `hsl(${typeConfig.color} / 0.2)`,
              width: props.listMaxWidths?.type ? `${props.listMaxWidths.type}px` : 'auto'
            }"
          >
            {{ typeConfig.label }}
          </span>
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
          </span>
        </div>

        <!-- 统计数据 -->
        <div v-if="stats && isActive" class="list-stats">
          <div 
            class="list-stat list-stat-in network-down" 
            title="入站流量"
            :style="{ width: props.listMaxWidths?.trafficIn ? `${props.listMaxWidths.trafficIn}px` : 'auto' }"
          >
            <ArrowDownToLine class="list-stat-icon" />
            <span class="list-stat-value">{{ formatTrafficShort(stats.trafficIn || 0) }}</span>
          </div>
          <div 
            class="list-stat list-stat-out network-up" 
            title="出站流量"
            :style="{ width: props.listMaxWidths?.trafficOut ? `${props.listMaxWidths.trafficOut}px` : 'auto' }"
          >
            <ArrowUpFromLine class="list-stat-icon" />
            <span class="list-stat-value">{{ formatTrafficShort(stats.trafficOut || 0) }}</span>
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
          :style="{ 
            background: `linear-gradient(135deg, hsl(${typeConfig.color}), hsl(var(--neon-cyan)))`,
            boxShadow: `0 3px 15px -3px hsl(${typeConfig.shadow} / 0.5)` 
          }"
        >
          <component :is="typeConfig.icon" class="icon-default-md" />
          <!-- 状态指示器 -->
          <div 
            class="minimal-status-dot"
            :class="stateConfig.class"
            :style="{ boxShadow: `0 0 8px hsl(${stateConfig.shadow} / 0.8)` }"
          />
        </div>
        <h3 class="minimal-title">{{ displayName }}</h3>
        <div v-if="stats && isActive" class="minimal-stats">
          <span class="minimal-type" :style="{ color: `hsl(${typeConfig.color})` }">{{ typeConfig.shortLabel }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
/* ============================================
   Lucky 服务卡片 - 四种布局模式
   科技感 + 简约美观设计
   复用站点卡片磨砂样式变量
   ============================================ */

/* 卡片基础容器 - 复用站点卡片磨砂样式 */
.service-card {
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
.service-card::before {
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

.service-card:hover {
  transform: translateY(-4px) scale(1.01);
  background: hsl(var(--site-card-bg-hover));
  border-color: hsl(var(--site-card-border-hover));
  box-shadow: var(--site-card-shadow-hover);
}

.service-card:hover::before {
  opacity: var(--site-card-shine-hover);
}

/* Normal 布局 */
.service-card.layout-normal {
  padding: 1rem;
}

/* Compact 布局 */
.service-card.layout-compact {
  padding: 0.75rem;
}

/* List 布局 */
.service-card.layout-list {
  padding: 0.75rem 1rem;
}

.service-card.layout-list:hover {
  transform: translateY(-2px) scale(1.005);
}

/* Minimal 布局 */
.service-card.layout-minimal {
  padding: 0.75rem 0.5rem;
  text-align: center;
}

.service-card.layout-minimal:hover {
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
  box-shadow: 0 0 30px -8px var(--shadow-color), inset 0 0 20px -12px var(--shadow-color, hsl(var(--neon-cyan) / 0.3));
}

.service-card:hover .card-glow {
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

.service-card:hover .card-bg-decor {
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
}

.icon-box::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--icon-overlay-opacity, 0));
  border-radius: inherit;
  pointer-events: none;
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
.status-indicator.status-stopped { background: hsl(var(--text-muted)); }
.status-indicator.status-error { background: hsl(var(--error)); }
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

.service-card:hover .card-title {
  color: hsl(var(--neon-cyan));
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.125rem;
  flex-wrap: wrap;
}

.type-badge {
  font-size: 0.75rem;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  font-weight: 500;
  border: 1px solid transparent;
}

.status-badge {
  font-size: 0.75rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
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

/* 连接数 */
.connection-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0 0.25rem;
}

.connection-icon-box {
  width: 1.5rem;
  height: 1.5rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: hsl(var(--warning) / 0.1);
}

.connection-icon {
  width: 1rem;
  height: 1rem;
  color: hsl(var(--warning));
}

.connection-stats {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 0.75rem;
}

.conn-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.conn-label {
  color: hsl(var(--text-muted));
}

.conn-value {
  font-weight: 700;
  font-family: ui-monospace, monospace;
  color: hsl(var(--text-primary));
}

/* 流量网格 */
.traffic-grid {
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

.stat-in {
  background-color: hsl(var(--neon-green) / 0.1);
  border-color: hsl(var(--neon-green) / 0.2);
}

.stat-out {
  background-color: hsl(var(--neon-blue) / 0.1);
  border-color: hsl(var(--neon-blue) / 0.2);
}

.stat-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.stat-icon {
  width: 0.875rem;
  height: 0.875rem;
}

.in-icon {
  color: hsl(var(--neon-green));
}

.out-icon {
  color: hsl(var(--neon-blue));
}

.stat-label {
  font-size: 0.75rem;
  color: hsl(var(--text-secondary));
}

.stat-value {
  font-size: 0.875rem;
  font-weight: 600;
  font-family: ui-monospace, monospace;
}

.in-value {
  color: hsl(var(--neon-green));
}

.out-value {
  color: hsl(var(--neon-blue));
}

.stat-speed {
  font-size: 0.625rem;
  font-family: ui-monospace, monospace;
}

.in-speed {
  color: hsl(var(--neon-green) / 0.7);
}

.out-speed {
  color: hsl(var(--neon-blue) / 0.7);
}

/* 公网地址 - 点击可复制 */
.public-addr-box {
  border-radius: 0.75rem;
  padding: 0.625rem;
  background-color: hsl(var(--warning) / 0.1);
  border: 1px solid hsl(var(--warning) / 0.2);
  cursor: pointer;
  transition: all 0.2s ease;
}

.public-addr-box:hover {
  background-color: hsl(var(--warning) / 0.15);
  border-color: hsl(var(--warning) / 0.3);
}

.public-addr-box:active {
  transform: scale(0.99);
}

.addr-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.addr-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: hsl(var(--warning));
}

.addr-label {
  font-size: 0.75rem;
  color: hsl(var(--text-secondary));
  flex: 1;
}

.addr-copy-icon {
  width: 0.875rem;
  height: 0.875rem;
  color: hsl(var(--text-muted));
  opacity: 0.6;
  transition: all 0.2s ease;
}

.public-addr-box:hover .addr-copy-icon {
  opacity: 1;
  color: hsl(var(--warning));
}

.addr-copy-icon.copied {
  color: hsl(var(--neon-green));
  opacity: 1;
}

.addr-value {
  font-size: 0.75rem;
  font-family: ui-monospace, monospace;
  color: hsl(var(--warning));
  margin-top: 0.25rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 非活跃状态 */
.inactive-state {
  margin-top: 0.5rem;
}

.inactive-box {
  border-radius: 0.75rem;
  padding: 0.75rem;
  text-align: center;
  border: 1px solid transparent;
}

.inactive-text {
  font-size: 0.75rem;
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

.service-card:hover .compact-title {
  color: hsl(var(--neon-cyan));
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

.type-text {
  font-size: 0.625rem;
  font-weight: 600;
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

.compact-stat-icon.in {
  color: hsl(var(--neon-green));
}

.compact-stat-icon.out {
  color: hsl(var(--neon-blue));
}

.compact-stat-value {
  font-size: 0.6875rem;
  font-weight: 600;
  color: hsl(var(--text-secondary));
  font-family: ui-monospace, monospace;
}

/* Compact 布局 - STUN 公网地址 */
.compact-addr {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: hsl(var(--warning) / 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: 0;
}

.compact-addr:hover {
  background: hsl(var(--warning) / 0.2);
}

.compact-addr:active {
  transform: scale(0.98);
}

.compact-addr-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: hsl(var(--warning));
  flex-shrink: 0;
}

.compact-addr-text {
  font-size: 0.6875rem;
  font-family: ui-monospace, monospace;
  color: hsl(var(--warning));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.compact-copy-icon {
  width: 0.6875rem;
  height: 0.6875rem;
  color: hsl(var(--text-muted));
  flex-shrink: 0;
  opacity: 0.5;
  transition: all 0.2s ease;
}

.compact-addr:hover .compact-copy-icon {
  opacity: 1;
  color: hsl(var(--warning));
}

.compact-copy-icon.copied {
  color: hsl(var(--neon-green));
  opacity: 1;
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

.list-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
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

.service-card:hover .list-title {
  color: hsl(var(--neon-cyan));
}

.list-desc {
  font-size: 0.6875rem;
  color: hsl(var(--text-muted));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-top: 0.125rem;
}

/* STUN 公网地址 - 列表布局（同行显示） */
.list-public-addr {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  background: hsl(var(--warning) / 0.1);
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.list-public-addr:hover {
  background: hsl(var(--warning) / 0.2);
}

.list-public-addr:active {
  transform: scale(0.98);
}

.list-addr-icon {
  width: 0.75rem;
  height: 0.75rem;
  color: hsl(var(--warning));
  flex-shrink: 0;
}

.list-addr-text {
  font-size: 0.6875rem;
  font-family: ui-monospace, monospace;
  color: hsl(var(--warning));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.list-copy-icon {
  width: 0.6875rem;
  height: 0.6875rem;
  color: hsl(var(--text-muted));
  flex-shrink: 0;
  opacity: 0.6;
  transition: all 0.2s ease;
}

.list-public-addr:hover .list-copy-icon {
  opacity: 1;
  color: hsl(var(--warning));
}

.list-copy-icon.copied {
  color: hsl(var(--neon-green));
  opacity: 1;
}

.list-type {
  flex-shrink: 0;
}

.list-type-badge {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.25rem 0.625rem;
  border-radius: 9999px;
  border: 1px solid;
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
}

.minimal-icon::after {
  content: '';
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, var(--icon-overlay-opacity, 0));
  border-radius: inherit;
  pointer-events: none;
}

.service-card:hover .minimal-icon {
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
.minimal-status-dot.status-stopped { background: hsl(var(--text-muted)); }
.minimal-status-dot.status-error { background: hsl(var(--error)); }
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

.service-card:hover .minimal-title {
  color: hsl(var(--neon-cyan));
}

.minimal-stats {
  display: flex;
  align-items: center;
  justify-content: center;
}

.minimal-type {
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

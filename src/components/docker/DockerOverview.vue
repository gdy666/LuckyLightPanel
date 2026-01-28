<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useNavStore } from '@/stores/nav'
import type { DockerContainer } from '@/types'

const navStore = useNavStore()

const isOpen = ref(false)
const dropdownRef = ref<HTMLElement | null>(null)

// 解析 CPU 百分比字符串为数字
function parseCpuPercent(cpuStr: string): number {
  if (!cpuStr) return 0
  const match = cpuStr.match(/[\d.]+/)
  return match ? parseFloat(match[0]) : 0
}

// 解析内存使用字符串为字节数（用于排序）
function parseMemoryUsage(memStr: string): number {
  if (!memStr) return 0
  const match = memStr.match(/([\d.]+)\s*([KMGT]?B)?/i)
  if (!match) return 0
  
  const value = parseFloat(match[1])
  const unit = (match[2] || 'B').toUpperCase()
  
  const multipliers: Record<string, number> = {
    'B': 1,
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
    'TB': 1024 * 1024 * 1024 * 1024
  }
  
  return value * (multipliers[unit] || 1)
}

// 格式化内存显示
function formatMemory(memStr: string): string {
  if (!memStr) return '-'
  return memStr.replace(/\s+/g, '')
}

// CPU 占用前5的容器
const topCpuContainers = computed(() => {
  const stats = Array.from(navStore.dockerStats.values())
  const containers = navStore.allContainers
  
  // 只统计运行中的容器
  const runningStats = stats.filter(stat => {
    const container = containers.find((c: DockerContainer) => c.containerName === stat.containerName)
    return container && stat.state === 'running'
  })
  
  return runningStats
    .map(stat => ({
      ...stat,
      cpuValue: parseCpuPercent(stat.cpuPercent),
      container: containers.find((c: DockerContainer) => c.containerName === stat.containerName)
    }))
    .sort((a, b) => b.cpuValue - a.cpuValue)
    .slice(0, 5)
})

// 内存占用前5的容器
const topMemoryContainers = computed(() => {
  const stats = Array.from(navStore.dockerStats.values())
  const containers = navStore.allContainers
  
  // 只统计运行中的容器
  const runningStats = stats.filter(stat => {
    const container = containers.find((c: DockerContainer) => c.containerName === stat.containerName)
    return container && stat.state === 'running'
  })
  
  return runningStats
    .map(stat => ({
      ...stat,
      memoryValue: parseMemoryUsage(stat.memoryUsage),
      container: containers.find((c: DockerContainer) => c.containerName === stat.containerName)
    }))
    .sort((a, b) => b.memoryValue - a.memoryValue)
    .slice(0, 5)
})

// 是否有数据
const hasData = computed(() => {
  return topCpuContainers.value.length > 0 || topMemoryContainers.value.length > 0
})

// 切换面板
function togglePanel() {
  isOpen.value = !isOpen.value
}

// 点击外部关闭
function handleClickOutside(event: MouseEvent) {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target as Node)) {
    isOpen.value = false
  }
}

// 打开时启动轮询
watch(isOpen, (newVal) => {
  if (newVal) {
    navStore.startDockerStatsPolling()
  }
})

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

// 获取排名颜色
function getRankColor(index: number): string {
  const colors = [
    'var(--rank-gold)',
    'var(--rank-silver)', 
    'var(--rank-bronze)',
    'var(--rank-default)',
    'var(--rank-default)'
  ]
  return colors[index] || colors[4]
}

// 获取进度条宽度（根据排名第一的值计算百分比）
function getCpuBarWidth(value: number): string {
  const max = topCpuContainers.value[0]?.cpuValue || 1
  return `${Math.min((value / max) * 100, 100)}%`
}

function getMemoryBarWidth(value: number): string {
  const max = topMemoryContainers.value[0]?.memoryValue || 1
  return `${Math.min((value / max) * 100, 100)}%`
}
</script>

<template>
  <div 
    ref="dropdownRef"
    class="overview-wrapper"
    :class="{ open: isOpen }"
  >
    <!-- 总览按钮 -->
    <button class="overview-badge" @click="togglePanel" title="资源总览">
      <i class="fas fa-chart-bar badge-icon"></i>
      <span class="badge-text">总览</span>
      <i class="fas fa-caret-down switch-icon"></i>
    </button>
    
    <!-- 总览面板 -->
    <div class="overview-panel">
      <!-- 面板头部 -->
      <div class="panel-header">
        <div class="header-glow"></div>
        <i class="fas fa-chart-pie header-icon"></i>
        <span class="header-title">资源监控</span>
        <span class="header-badge">TOP 5</span>
      </div>
      
      <!-- 无数据状态 -->
      <div v-if="!hasData" class="empty-state">
        <i class="fas fa-inbox empty-icon"></i>
        <span>暂无运行中的容器</span>
      </div>
      
      <!-- 排行榜内容 -->
      <div v-else class="panel-content">
        <!-- CPU 排行榜 -->
        <div class="rank-section">
          <div class="section-header">
            <div class="section-icon cpu-icon">
              <i class="fas fa-microchip"></i>
            </div>
            <span class="section-title">CPU 占用</span>
          </div>
          <div class="rank-list">
            <div 
              v-for="(item, index) in topCpuContainers" 
              :key="item.containerName"
              class="rank-item"
              :class="`rank-${index + 1}`"
            >
              <div class="rank-number" :style="{ '--rank-color': getRankColor(index) }">
                {{ index + 1 }}
              </div>
              <div class="rank-info">
                <div class="rank-name">{{ item.container?.displayName || item.containerName }}</div>
                <div class="rank-bar-wrapper">
                  <div 
                    class="rank-bar cpu-bar" 
                    :style="{ width: getCpuBarWidth(item.cpuValue) }"
                  ></div>
                </div>
              </div>
              <div class="rank-value">{{ item.cpuPercent }}</div>
            </div>
            <div v-if="topCpuContainers.length === 0" class="no-data">
              <span>无数据</span>
            </div>
          </div>
        </div>
        
        <!-- 分隔线 -->
        <div class="section-divider">
          <div class="divider-line"></div>
          <div class="divider-glow"></div>
        </div>
        
        <!-- 内存排行榜 -->
        <div class="rank-section">
          <div class="section-header">
            <div class="section-icon memory-icon">
              <i class="fas fa-memory"></i>
            </div>
            <span class="section-title">内存占用</span>
          </div>
          <div class="rank-list">
            <div 
              v-for="(item, index) in topMemoryContainers" 
              :key="item.containerName"
              class="rank-item"
              :class="`rank-${index + 1}`"
            >
              <div class="rank-number" :style="{ '--rank-color': getRankColor(index) }">
                {{ index + 1 }}
              </div>
              <div class="rank-info">
                <div class="rank-name">{{ item.container?.displayName || item.containerName }}</div>
                <div class="rank-bar-wrapper">
                  <div 
                    class="rank-bar memory-bar" 
                    :style="{ width: getMemoryBarWidth(item.memoryValue) }"
                  ></div>
                </div>
              </div>
              <div class="rank-value">{{ formatMemory(item.memoryUsage) }}</div>
            </div>
            <div v-if="topMemoryContainers.length === 0" class="no-data">
              <span>无数据</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 面板底部装饰 -->
      <div class="panel-footer">
        <div class="footer-line"></div>
        <div class="footer-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* CSS 变量 */
.overview-wrapper {
  --rank-gold: #fbbf24;
  --rank-silver: #94a3b8;
  --rank-bronze: #cd7f32;
  --rank-default: hsl(var(--text-muted));
  --cpu-color: #06b6d4;
  --memory-color: #a855f7;
  position: relative;
}

/* 总览按钮 - 统一毛玻璃风格 */
.overview-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid rgba(255, 255, 255, 0.12);
  cursor: pointer;
  transition: all 0.2s ease;
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(12px) saturate(150%);
  -webkit-backdrop-filter: blur(12px) saturate(150%);
  position: relative;
  overflow: hidden;
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15);
}

.overview-badge:hover {
  background: rgba(0, 0, 0, 0.35);
  border-color: rgba(6, 182, 212, 0.35);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.05),
    0 2px 8px -2px rgba(0, 0, 0, 0.15),
    0 0 12px -4px rgba(6, 182, 212, 0.3);
}

.badge-icon {
  font-size: 12px;
  color: hsl(var(--text-secondary));
}

.badge-text {
  color: hsl(var(--text-primary));
}

.switch-icon {
  font-size: 10px;
  opacity: 0.7;
  margin-left: 2px;
  transition: transform 0.2s ease;
  color: hsl(var(--text-muted));
}

.overview-wrapper.open .switch-icon {
  transform: rotate(180deg);
}

/* 总览面板 */
.overview-panel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  width: 340px;
  background: rgba(15, 20, 30, 0.88);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(255, 255, 255, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.06);
  opacity: 0;
  visibility: hidden;
  transform: translateY(-10px) scale(0.95);
  transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  z-index: 200;
  overflow: hidden;
}

.overview-wrapper.open .overview-panel {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
}

/* 面板头部 */
.panel-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.12) 0%, rgba(168, 85, 247, 0.12) 100%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  position: relative;
  overflow: hidden;
}

.header-glow {
  position: absolute;
  top: -50%;
  left: 10%;
  width: 80%;
  height: 100%;
  background: radial-gradient(ellipse, rgba(6, 182, 212, 0.2) 0%, transparent 70%);
  pointer-events: none;
}

.header-icon {
  font-size: 16px;
  background: linear-gradient(135deg, #06b6d4 0%, #a855f7 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  position: relative;
  z-index: 1;
}

.header-title {
  font-size: 14px;
  font-weight: 600;
  color: hsl(var(--text-primary));
  position: relative;
  z-index: 1;
}

.header-badge {
  margin-left: auto;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.2) 0%, rgba(168, 85, 247, 0.2) 100%);
  color: #06b6d4;
  border: 1px solid rgba(6, 182, 212, 0.3);
  position: relative;
  z-index: 1;
}

/* 面板内容 */
.panel-content {
  padding: 12px;
}

/* 排行榜区块 */
.rank-section {
  margin-bottom: 4px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
}

.section-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: white;
}

.section-icon.cpu-icon {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
  box-shadow: 0 4px 12px -2px rgba(6, 182, 212, 0.4);
}

.section-icon.memory-icon {
  background: linear-gradient(135deg, #a855f7 0%, #9333ea 100%);
  box-shadow: 0 4px 12px -2px rgba(168, 85, 247, 0.4);
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: hsl(var(--text-primary));
}

/* 排行榜列表 */
.rank-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 排行项 */
.rank-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.04);
  transition: all 0.2s ease;
}

.rank-item:hover {
  background: rgba(255, 255, 255, 0.06);
  border-color: rgba(255, 255, 255, 0.08);
}

/* 排名第一特殊样式 */
.rank-item.rank-1 {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.08) 0%, rgba(251, 191, 36, 0.03) 100%);
  border-color: rgba(251, 191, 36, 0.15);
}

.rank-item.rank-1:hover {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.12) 0%, rgba(251, 191, 36, 0.06) 100%);
}

/* 排名数字 */
.rank-number {
  width: 22px;
  height: 22px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--rank-color);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--rank-color);
  flex-shrink: 0;
  transition: all 0.2s ease;
}

.rank-1 .rank-number {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.2) 0%, rgba(251, 191, 36, 0.1) 100%);
  box-shadow: 0 0 10px -2px rgba(251, 191, 36, 0.4);
}

/* 排行信息 */
.rank-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rank-name {
  font-size: 12px;
  font-weight: 500;
  color: hsl(var(--text-primary));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 进度条 */
.rank-bar-wrapper {
  height: 4px;
  border-radius: 2px;
  background: rgba(255, 255, 255, 0.06);
  overflow: hidden;
}

.rank-bar {
  height: 100%;
  border-radius: 2px;
  transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

.rank-bar.cpu-bar {
  background: linear-gradient(90deg, #06b6d4 0%, #22d3ee 100%);
  box-shadow: 0 0 8px rgba(6, 182, 212, 0.4);
}

.rank-bar.memory-bar {
  background: linear-gradient(90deg, #a855f7 0%, #c084fc 100%);
  box-shadow: 0 0 8px rgba(168, 85, 247, 0.4);
}

/* 排行数值 */
.rank-value {
  font-size: 12px;
  font-weight: 600;
  color: hsl(var(--text-secondary));
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', monospace;
  min-width: 56px;
  text-align: right;
}

/* 分隔线 */
.section-divider {
  position: relative;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 8px 0;
}

.divider-line {
  width: 100%;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.08) 50%, transparent 100%);
}

.divider-glow {
  position: absolute;
  width: 60px;
  height: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.3) 50%, transparent 100%);
}

/* 面板底部 */
.panel-footer {
  padding: 10px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.footer-line {
  width: 60%;
  height: 2px;
  border-radius: 1px;
  background: linear-gradient(90deg, transparent 0%, rgba(6, 182, 212, 0.3) 30%, rgba(168, 85, 247, 0.3) 70%, transparent 100%);
}

.footer-dots {
  display: flex;
  gap: 4px;
}

.footer-dots span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.15);
}

.footer-dots span:nth-child(2) {
  background: rgba(6, 182, 212, 0.4);
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
  gap: 12px;
  color: rgba(255, 255, 255, 0.45);
}

.empty-icon {
  font-size: 28px;
  opacity: 0.4;
}

.empty-state span {
  font-size: 13px;
}

/* 无数据提示 */
.no-data {
  padding: 16px;
  text-align: center;
  color: rgba(255, 255, 255, 0.45);
  font-size: 12px;
}

/* 浅色主题适配 */
[data-theme="light"] .overview-badge {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 
    inset 0 1px 0 rgba(255, 255, 255, 0.8),
    0 2px 8px -2px rgba(0, 0, 0, 0.08);
}

[data-theme="light"] .overview-badge:hover {
  background: rgba(255, 255, 255, 0.75);
  border-color: rgba(6, 182, 212, 0.4);
}

[data-theme="light"] .overview-panel {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 
    0 10px 40px rgba(0, 0, 0, 0.12),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

[data-theme="light"] .panel-header {
  background: linear-gradient(135deg, rgba(6, 182, 212, 0.08) 0%, rgba(168, 85, 247, 0.08) 100%);
  border-bottom-color: rgba(0, 0, 0, 0.05);
}

[data-theme="light"] .header-title {
  color: rgba(0, 0, 0, 0.85);
}

[data-theme="light"] .section-title {
  color: rgba(0, 0, 0, 0.85);
}

[data-theme="light"] .rank-item {
  background: rgba(0, 0, 0, 0.02);
  border-color: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .rank-item:hover {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .rank-item.rank-1 {
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.06) 0%, rgba(251, 191, 36, 0.02) 100%);
  border-color: rgba(251, 191, 36, 0.12);
}

[data-theme="light"] .rank-name {
  color: rgba(0, 0, 0, 0.85);
}

[data-theme="light"] .rank-value {
  color: rgba(0, 0, 0, 0.6);
}

[data-theme="light"] .rank-number {
  background: rgba(0, 0, 0, 0.03);
}

[data-theme="light"] .rank-bar-wrapper {
  background: rgba(0, 0, 0, 0.04);
}

[data-theme="light"] .empty-state,
[data-theme="light"] .no-data {
  color: rgba(0, 0, 0, 0.4);
}

[data-theme="light"] .footer-dots span {
  background: rgba(0, 0, 0, 0.1);
}

/* 深色主题 */
[data-theme="dark"] .overview-panel {
  box-shadow: 
    0 12px 48px rgba(0, 0, 0, 0.4),
    0 0 0 1px rgba(255, 255, 255, 0.03),
    inset 0 1px 0 rgba(255, 255, 255, 0.05);
}

/* 响应式 - 移动端适配 */
@media (max-width: 640px) {
  .overview-badge {
    padding: 5px 10px;
    font-size: 12px;
  }
  
  .badge-text {
    max-width: 40px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  
  .overview-panel {
    position: fixed;
    top: auto;
    bottom: 0;
    left: 0;
    right: 0;
    width: 100%;
    max-height: 70vh;
    border-radius: 20px 20px 0 0;
    transform: translateY(100%);
    overflow-y: auto;
  }
  
  .overview-wrapper.open .overview-panel {
    transform: translateY(0);
  }
  
  .panel-content {
    padding: 12px 16px 20px;
  }
  
  .rank-item {
    padding: 10px 12px;
  }
  
  .rank-name {
    font-size: 13px;
  }
  
  .rank-value {
    font-size: 13px;
    min-width: 60px;
  }
  
  .section-icon {
    width: 28px;
    height: 28px;
    font-size: 13px;
  }
  
  .section-title {
    font-size: 14px;
  }
  
  /* 移动端底部安全区 */
  .panel-footer {
    padding-bottom: calc(10px + env(safe-area-inset-bottom, 0));
  }
}

/* 小屏幕手机 */
@media (max-width: 375px) {
  .rank-value {
    min-width: 52px;
    font-size: 11px;
  }
  
  .rank-number {
    width: 20px;
    height: 20px;
    font-size: 10px;
  }
}
</style>

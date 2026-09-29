<template>
  <div class="app-container" :class="{ maximized: isMaximized, 'export-mode': isExportMode }">
    <template v-if="!isExportMode">
      <div class="title-drag-bar">
        <div class="drag-title">R-Goose Note</div>
        <div class="window-controls">
          <button type="button" class="wc-btn" title="最小化" @click="onMinimize">
            <svg width="11" height="11" viewBox="0 0 11 11"><rect x="1" y="5.2" width="9" height="0.9" rx="0.45" fill="currentColor"/></svg>
          </button>
          <button type="button" class="wc-btn" :title="isMaximized ? '还原' : '最大化'" @click="onToggleMaximize">
            <svg v-if="!isMaximized" width="11" height="11" viewBox="0 0 11 11"><rect x="1.3" y="1.3" width="8.4" height="8.4" rx="1.4" fill="none" stroke="currentColor" stroke-width="1"/></svg>
            <svg v-else width="11" height="11" viewBox="0 0 11 11">
              <rect x="1.3" y="3" width="6.7" height="6.7" rx="1.2" fill="none" stroke="currentColor" stroke-width="1"/>
              <path d="M3.3 3 V1.6 H10 V8.2 H8.6" fill="none" stroke="currentColor" stroke-width="1"/>
            </svg>
          </button>
          <button type="button" class="wc-btn wc-close" title="关闭" @click="onClose">
            <svg width="11" height="11" viewBox="0 0 11 11"><path d="M1.5 1.5 L9.5 9.5 M9.5 1.5 L1.5 9.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
          </button>
        </div>
      </div>
      <div v-show="apiLoading" class="global-loading-bar"><div class="glb-inner"></div></div>
      <div class="app-body">
        <Sidebar :collapsed="sidebarCollapsed" @toggle-collapse="toggleSidebar" />
        <div class="main-content" :class="{ expanded: !sidebarCollapsed }">
          <!-- 先创建稳定挂载点，供路由页面里的表格工具栏 Teleport 使用。 -->
          <div id="note-table-toolbar-host" class="note-table-toolbar-host"></div>
          <router-view v-slot="{ Component }">
            <transition name="fade" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </div>
      <ToastContainer />
      <CommandPalette :show="showCmdPalette" @close="showCmdPalette = false" />
      <AIFloatingButton />
      <div class="key-echo-layer" aria-hidden="true">
        <span v-for="keyEcho in keyEchoes" :key="keyEcho.id" class="key-echo-chip">{{ keyEcho.label }}</span>
      </div>
      <div class="click-firework-layer" aria-hidden="true">
        <span
          v-for="burst in clickFireworks"
          :key="burst.id"
          class="click-firework"
          :style="{ left: `${burst.x}px`, top: `${burst.y}px`, '--firework-hue': burst.hue }"
        >
          <i class="click-firework-ring"></i>
          <i class="click-firework-core"></i>
          <i
            v-for="spark in burst.sparks"
            :key="spark.id"
            class="click-firework-spark"
            :style="{
              '--spark-x': `${spark.x}px`,
              '--spark-y': `${spark.y}px`,
              '--spark-end-x': `${spark.endX}px`,
              '--spark-end-y': `${spark.endY}px`,
              '--spark-rotate': `${spark.rotate}deg`,
              '--spark-size': `${spark.size}px`,
              '--spark-delay': `${spark.delay}ms`,
              '--spark-hue': spark.hue
            }"
          ></i>
        </span>
      </div>
    </template>
    <!-- export 模式：只渲染路由视图（画布），无 chrome -->
    <router-view v-if="isExportMode" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import Sidebar from '@/components/Sidebar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import CommandPalette from '@/components/CommandPalette.vue'
import AIFloatingButton from '@/components/AIFloatingButton.vue'
import { useThemeStore } from '@/stores/theme'
import { useTagStore } from '@/stores/tag'
import { useToast } from '@/composables/useToast'

const sidebarCollapsed = ref(false)
const isMaximized = ref(false)
const showCmdPalette = ref(false)
const clickFireworks = ref([])
const keyEchoes = ref([])
let clickFireworkId = 0
let keyEchoId = 0
const fireworkTimers = new Set()
const keyEchoTimers = new Set()

// 全局接口 loading：监听 client.js 派发的请求计数事件
// 150ms 防抖：快请求不闪烁
const apiLoading = ref(false)
let loadingShowTimer = null
function handleApiLoading(e) {
  const pending = e.detail?.pending > 0
  if (pending) {
    if (!apiLoading.value && !loadingShowTimer) {
      loadingShowTimer = setTimeout(() => {
        apiLoading.value = true
        loadingShowTimer = null
      }, 150)
    }
  } else {
    if (loadingShowTimer) {
      clearTimeout(loadingShowTimer)
      loadingShowTimer = null
    }
    apiLoading.value = false
  }
}
const route = useRoute()
const isExportMode = computed(() => route.query.export === '1')
const { error: toastError } = useToast()

// 存储失败（如 localStorage 超限）提示：防抖，避免连续保存刷屏
let lastStorageErrorAt = 0
function handleStorageError(e) {
  const now = Date.now()
  if (now - lastStorageErrorAt < 10000) return
  lastStorageErrorAt = now
  const reason = e?.detail?.reason
  if (reason === 'quota') {
    toastError('本地存储空间不足，最新改动可能未保存，请先导出备份再清理数据', 8000)
  } else {
    toastError('数据保存失败，请稍后重试或导出备份', 6000)
  }
}

function onGlobalKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
    e.preventDefault()
    showCmdPalette.value = !showCmdPalette.value
  }
}

const keyboardKeyLabels = {
  ' ': '空格',
  ArrowUp: '↑',
  ArrowDown: '↓',
  ArrowLeft: '←',
  ArrowRight: '→',
  Escape: 'Esc',
  Backspace: '⌫',
  Delete: '⌦',
  Enter: '↵',
  Tab: '⇥',
  CapsLock: 'Caps Lock',
  Meta: '⌘',
  Control: 'Ctrl',
  Alt: '⌥',
  Shift: '⇧'
}

function isPasswordField(target) {
  const input = target?.closest?.('input')
  return input?.type?.toLowerCase() === 'password'
}

function formatKeyEcho(e) {
  const key = keyboardKeyLabels[e.key] || (e.key.length === 1 ? e.key.toUpperCase() : e.key)
  if (!key || key === 'Unidentified' || key === 'Process' || key === 'Dead') return ''
  const modifiers = []
  if (e.metaKey && e.key !== 'Meta') modifiers.push('⌘')
  if (e.ctrlKey && e.key !== 'Control') modifiers.push('Ctrl')
  if (e.altKey && e.key !== 'Alt') modifiers.push('⌥')
  if (e.shiftKey && e.key !== 'Shift' && e.key.length > 1) modifiers.push('⇧')
  return [...modifiers, key].join(' + ')
}

function onGlobalKeyEcho(e) {
  if (isExportMode.value || e.repeat || isPasswordField(e.target)) return
  const label = formatKeyEcho(e)
  if (!label) return
  const id = ++keyEchoId
  keyEchoes.value = [...keyEchoes.value.slice(-3), { id, label }]
  const timer = setTimeout(() => {
    keyEchoes.value = keyEchoes.value.filter(keyEcho => keyEcho.id !== id)
    keyEchoTimers.delete(timer)
  }, 1100)
  keyEchoTimers.add(timer)
}

function onGlobalClickFirework(e) {
  // 键盘触发的 click（detail = 0）不产生鼠标特效；减少动态效果时完全关闭。
  if (isExportMode.value || e.detail === 0 || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
  const id = ++clickFireworkId
  const hue = 18 + (id * 47) % 310
  const sparks = Array.from({ length: 10 }, (_, index) => {
    const angle = (Math.PI * 2 * index) / 10 + (id % 5) * 0.13
    const distance = 20 + ((id * 11 + index * 7) % 16)
    return {
      id: index,
      x: Math.round(Math.cos(angle) * distance),
      y: Math.round(Math.sin(angle) * distance),
      endX: Math.round(Math.cos(angle) * distance * 1.15),
      endY: Math.round(Math.sin(angle) * distance * 1.15),
      // 水滴的尖角原始朝右上；转到每颗火花各自向外的方向。
      rotate: Math.round(angle * 180 / Math.PI + 45),
      size: 3 + ((id + index) % 3),
      delay: index % 2 ? 18 : 0,
      hue: (hue + index * 12) % 360
    }
  })
  clickFireworks.value.push({ id, x: e.clientX, y: e.clientY, hue, sparks })
  const timer = setTimeout(() => {
    clickFireworks.value = clickFireworks.value.filter(burst => burst.id !== id)
    fireworkTimers.delete(timer)
  }, 680)
  fireworkTimers.add(timer)
}

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar-collapsed', sidebarCollapsed.value)
}

const api = typeof window !== 'undefined' ? window.electronAPI : null
let unsubMaximize = null
let onBeforeUnload = null

function onMinimize() {
  api?.windowMinimize?.()
}
function onToggleMaximize() {
  api?.windowToggleMaximize?.()
}
function onClose() {
  api?.windowClose?.()
}


onMounted(() => {
  const themeStore = useThemeStore()
  themeStore.init()

  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) {
    sidebarCollapsed.value = saved === 'true'
  }

  if (api?.onMaximizeChange) {
    api.windowIsMaximized?.().then(v => { isMaximized.value = !!v })
    unsubMaximize = api.onMaximizeChange(v => { isMaximized.value = !!v })
  }

  const tagStore = useTagStore()
  tagStore.init()
  // v2.0: 数据实时同步到后端，不再需要 beforeunload 刷新
  onBeforeUnload = () => {}
  window.addEventListener('beforeunload', onBeforeUnload)
  window.addEventListener('keydown', onGlobalKeydown)
  window.addEventListener('keydown', onGlobalKeyEcho, true)
  window.addEventListener('click', onGlobalClickFirework, true)
  window.addEventListener('rgoose-storage-error', handleStorageError)
  window.addEventListener('rgoose-loading', handleApiLoading)
})

onUnmounted(() => {
  if (unsubMaximize) {
    unsubMaximize()
    unsubMaximize = null
  }
  if (onBeforeUnload) {
    window.removeEventListener('beforeunload', onBeforeUnload)
    onBeforeUnload = null
  }
  window.removeEventListener('keydown', onGlobalKeydown)
  window.removeEventListener('keydown', onGlobalKeyEcho, true)
  window.removeEventListener('click', onGlobalClickFirework, true)
  window.removeEventListener('rgoose-storage-error', handleStorageError)
  window.removeEventListener('rgoose-loading', handleApiLoading)
  if (loadingShowTimer) {
    clearTimeout(loadingShowTimer)
    loadingShowTimer = null
  }
  fireworkTimers.forEach(timer => clearTimeout(timer))
  fireworkTimers.clear()
  keyEchoTimers.forEach(timer => clearTimeout(timer))
  keyEchoTimers.clear()
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  background: var(--bg-primary);
  border-radius: 10px;
  overflow: hidden;
}

.app-container.export-mode {
  overflow: visible;
  border-radius: 0;
}

.app-container.maximized {
  border-radius: 0;
}

.title-drag-bar {
  height: 36px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-left: 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  -webkit-app-region: drag;
  user-select: none;
}

.drag-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  letter-spacing: 0.3px;
  flex: 1;
}

.window-controls {
  display: flex;
  align-items: stretch;
  height: 100%;
  -webkit-app-region: no-drag;
}

.wc-btn {
  width: 46px;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: background 0.15s ease, color 0.15s ease;
}

.wc-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.wc-btn.wc-close:hover {
  background: #e81123;
  color: #fff;
}

.app-body {
  flex: 1;
  display: flex;
  min-height: 0;
}

/* 全局键盘回显：居中靠下展示最近按键，不遮挡操作也不参与命中测试。 */
.key-echo-layer {
  position: fixed;
  left: 50%;
  bottom: clamp(32px, 12vh, 116px);
  z-index: 2147483646;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  max-width: min(86vw, 680px);
  pointer-events: none;
  transform: translateX(-50%);
}

.key-echo-chip {
  min-width: 44px;
  max-width: min(48vw, 260px);
  padding: 9px 14px;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--primary-light) 38%, rgba(255, 255, 255, .68));
  border-radius: 11px;
  background: color-mix(in srgb, var(--bg-secondary) 82%, transparent);
  box-shadow: 0 12px 28px -14px rgba(22, 24, 31, .55), inset 0 1px 0 rgba(255, 255, 255, .55);
  color: var(--text-primary);
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
  backdrop-filter: blur(12px) saturate(135%);
  -webkit-backdrop-filter: blur(12px) saturate(135%);
  animation: key-echo-in 150ms ease-out, key-echo-out 260ms ease-in 840ms forwards;
}

@keyframes key-echo-in {
  from { opacity: 0; transform: translateY(8px) scale(.92); }
  to { opacity: 1; transform: none; }
}

@keyframes key-echo-out {
  to { opacity: 0; transform: translateY(-5px) scale(.96); }
}

/* 鼠标点击烟花：固定在视口最上层，完全不参与命中测试。 */
.click-firework-layer {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  overflow: hidden;
}

.click-firework {
  position: fixed;
  width: 0;
  height: 0;
  pointer-events: none;
}

.click-firework-ring,
.click-firework-core,
.click-firework-spark {
  position: absolute;
  display: block;
  left: 0;
  top: 0;
  pointer-events: none;
}

.click-firework-ring {
  display: none;
}

.click-firework-core {
  width: 7px;
  height: 9px;
  border-radius: 78% 15% 78% 78%;
  background: hsl(var(--firework-hue) 92% 66%);
  box-shadow: 0 0 10px hsl(var(--firework-hue) 92% 66% / 0.85);
  transform: translate(-50%, -50%) rotate(45deg);
  animation: click-firework-core 460ms ease-out forwards;
}

.click-firework-spark {
  width: calc(var(--spark-size) + 1px);
  height: calc(var(--spark-size) + 4px);
  border-radius: 78% 14% 78% 78%;
  background: hsl(var(--spark-hue) 92% 64%);
  box-shadow: 0 0 7px hsl(var(--spark-hue) 92% 64% / 0.75);
  transform: translate(-50%, -50%) rotate(var(--spark-rotate)) scale(0.4);
  animation: click-firework-spark 600ms cubic-bezier(.15, .75, .25, 1) var(--spark-delay) forwards;
}

@keyframes click-firework-core {
  0% { opacity: 1; transform: translate(-50%, -50%) rotate(45deg) scale(.6); }
  100% { opacity: 0; transform: translate(-50%, -50%) rotate(45deg) scale(1.8); }
}

@keyframes click-firework-spark {
  0% { opacity: 0; transform: translate(-50%, -50%) rotate(var(--spark-rotate)) scale(.35); }
  14% { opacity: 1; }
  76% { opacity: .8; transform: translate(calc(var(--spark-x) - 50%), calc(var(--spark-y) - 50%)) rotate(var(--spark-rotate)) scale(1); }
  100% { opacity: 0; transform: translate(calc(var(--spark-end-x) - 50%), calc(var(--spark-end-y) - 50%)) rotate(var(--spark-rotate)) scale(.35); }
}

@media (prefers-reduced-motion: reduce) {
  .click-firework-layer { display: none; }
}

/* 全局接口 loading 进度条：标题栏下方 2px 细条，不确定进度滚动动画 */
.global-loading-bar {
  position: absolute;
  top: 36px;
  left: 0;
  right: 0;
  height: 2px;
  z-index: 9999;
  overflow: hidden;
  pointer-events: none;
  background: transparent;
}

.glb-inner {
  height: 100%;
  width: 35%;
  border-radius: 2px;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-light));
  animation: glb-slide 1.1s ease-in-out infinite;
}

@keyframes glb-slide {
  0% { transform: translateX(-110%); }
  100% { transform: translateX(320%); }
}

.main-content {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
  min-width: 0;
}

.note-table-toolbar-host {
  position: absolute;
  inset: 0;
  z-index: 10002;
  pointer-events: none;
}

.note-table-toolbar-host:empty {
  display: none;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity var(--transition-normal);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

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
  window.removeEventListener('rgoose-storage-error', handleStorageError)
  window.removeEventListener('rgoose-loading', handleApiLoading)
  if (loadingShowTimer) {
    clearTimeout(loadingShowTimer)
    loadingShowTimer = null
  }
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

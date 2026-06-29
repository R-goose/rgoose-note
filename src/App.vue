<template>
  <div class="app-container" :class="{ maximized: isMaximized }">
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
    <div class="app-body">
      <Sidebar :collapsed="sidebarCollapsed" @toggle-collapse="toggleSidebar" />
      <div class="main-content" :class="{ expanded: !sidebarCollapsed }">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </div>
    <ToastContainer />
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue'
import Sidebar from '@/components/Sidebar.vue'
import ToastContainer from '@/components/ToastContainer.vue'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { useSyncStore } from '@/stores/sync'
import { useToast } from '@/composables/useToast'

const sidebarCollapsed = ref(false)
const isMaximized = ref(false)
const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar-collapsed', sidebarCollapsed.value)
}

const api = typeof window !== 'undefined' ? window.electronAPI : null
let unsubMaximize = null

function onMinimize() {
  api?.windowMinimize?.()
}
function onToggleMaximize() {
  api?.windowToggleMaximize?.()
}
function onClose() {
  api?.windowClose?.()
}

let pushTimer = null
let manualSyncTimer = null

function handleManualSync(noteStore, planStore, syncStore) {
  if (!syncStore.enabled) {
    toastInfo('云同步未开启，请在设置中开启')
    return
  }
  if (manualSyncTimer) clearTimeout(manualSyncTimer)
  manualSyncTimer = setTimeout(async () => {
    if (syncStore.syncing) return
    try {
      await syncStore.sync(noteStore, planStore)
      toastSuccess('同步完成')
    } catch {
      toastError('同步失败：' + (syncStore.lastError || '未知错误'))
    }
  }, 400)
}

function handleKeydown(e, noteStore, planStore, syncStore) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    handleManualSync(noteStore, planStore, syncStore)
  }
}

onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) {
    sidebarCollapsed.value = saved === 'true'
  }

  const noteStore = useNoteStore()
  const planStore = usePlanStore()
  const syncStore = useSyncStore()
  syncStore.init()
  syncStore.bindAutoSync(() => {
    if (!syncStore.syncing) {
      syncStore.sync(noteStore, planStore)
    }
  })

  const schedulePush = () => {
    if (!syncStore.enabled || !syncStore.autoSync) return
    if (pushTimer) clearTimeout(pushTimer)
    pushTimer = setTimeout(() => {
      if (!syncStore.syncing) {
        syncStore.push(noteStore, planStore).catch(() => {})
      }
    }, 5000)
  }

  watch(() => noteStore.notes, schedulePush, { deep: true })
  watch(() => planStore.plans, schedulePush, { deep: true })

  if (syncStore.enabled && syncStore.autoSync) {
    syncStore.sync(noteStore, planStore)
  }

  const onKeydown = (e) => handleKeydown(e, noteStore, planStore, syncStore)
  window.addEventListener('keydown', onKeydown)
  window.__rgooseKeydown = onKeydown

  if (api?.onMaximizeChange) {
    api.windowIsMaximized?.().then(v => { isMaximized.value = !!v })
    unsubMaximize = api.onMaximizeChange(v => { isMaximized.value = !!v })
  }
})

onUnmounted(() => {
  if (window.__rgooseKeydown) {
    window.removeEventListener('keydown', window.__rgooseKeydown)
    window.__rgooseKeydown = null
  }
  if (unsubMaximize) {
    unsubMaximize()
    unsubMaximize = null
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  background: var(--bg-primary);
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.22);
}

.app-container.maximized {
  border-radius: 0;
  box-shadow: none;
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

.main-content {
  flex: 1;
  height: 100%;
  overflow: hidden;
  position: relative;
  min-width: 0;
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

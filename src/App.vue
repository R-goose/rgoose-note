<template>
  <div class="app-container">
    <Sidebar :collapsed="sidebarCollapsed" @toggle-collapse="toggleSidebar" />
    <div class="main-content" :class="{ expanded: !sidebarCollapsed }">
      <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </router-view>
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
const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar-collapsed', sidebarCollapsed.value)
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
})

onUnmounted(() => {
  if (window.__rgooseKeydown) {
    window.removeEventListener('keydown', window.__rgooseKeydown)
    window.__rgooseKeydown = null
  }
})
</script>

<style scoped>
.app-container {
  display: flex;
  height: 100%;
  width: 100%;
  background: var(--bg-primary);
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

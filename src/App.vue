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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import Sidebar from '@/components/Sidebar.vue'

const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
  localStorage.setItem('sidebar-collapsed', sidebarCollapsed.value)
}

onMounted(() => {
  const saved = localStorage.getItem('sidebar-collapsed')
  if (saved !== null) {
    sidebarCollapsed.value = saved === 'true'
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

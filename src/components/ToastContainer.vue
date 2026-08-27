<template>
  <TransitionGroup name="toast" tag="div" class="toast-container">
    <div v-for="t in toasts" :key="t.id" class="toast" :class="`toast-${t.type}`" @click="removeToast(t.id)">
      <svg v-if="t.type === 'success'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <svg v-else-if="t.type === 'error'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
      <svg v-else-if="t.type === 'warning'" class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <svg v-else class="toast-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>
      <span class="toast-msg">{{ t.message }}</span>
    </div>
  </TransitionGroup>
</template>

<script setup>
import { useToast } from '@/composables/useToast'
const { toasts, removeToast } = useToast()
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 24px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: none;
}

.toast {
  pointer-events: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: 420px;
  padding: 12px 18px;
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  box-shadow: var(--shadow-lg);
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  backdrop-filter: blur(8px);
}

.toast-icon {
  flex-shrink: 0;
}

.toast-success { border-color: var(--primary-light); }
.toast-success .toast-icon { color: var(--primary-color); }

.toast-error { border-color: rgba(217, 118, 118, 0.4); }
.toast-error .toast-icon { color: var(--warning-color); }

.toast-warning { border-color: var(--secondary-light); }
.toast-warning .toast-icon { color: var(--secondary-dark); }

.toast-info { border-color: var(--info-light); }
.toast-info .toast-icon { color: var(--info-color); }

.toast-msg {
  line-height: 1.4;
}

.toast-enter-active {
  animation: toastJellyIn 1s cubic-bezier(0.22, 1, 0.36, 1) both;
}

.toast-leave-active {
  animation: toastJellyOut 0.26s cubic-bezier(0.55, 0, 0.8, 0.4) both;
}

/* 果冻入场：从顶部落下砸扁再弹起回正 */
@keyframes toastJellyIn {
  0% { transform: translateY(-30px) scale(0.5, 0.4); opacity: 0; }
  16% { transform: translateY(0) scale(1.16, 0.84); opacity: 1; }
  32% { transform: scale(0.92, 1.07); }
  48% { transform: scale(1.07, 0.95); }
  64% { transform: scale(0.96, 1.03); }
  78% { transform: scale(1.02, 0.99); }
  90% { transform: scale(0.99, 1.01); }
  100% { transform: scale(1, 1); }
}

/* 果冻退场：先压扁蓄力再缩小弹走 */
@keyframes toastJellyOut {
  0% { transform: scale(1, 1); opacity: 1; }
  30% { transform: scale(1.1, 0.84); opacity: 1; }
  100% { transform: translateY(-20px) scale(0.55, 0.35); opacity: 0; }
}

.toast-move {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
</style>

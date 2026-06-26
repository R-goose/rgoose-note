import { ref } from 'vue'

const toasts = ref([])
let seed = 0

function showToast(message, type = 'info', duration = 2800) {
  const id = ++seed
  toasts.value.push({ id, message, type })
  if (duration > 0) {
    setTimeout(() => removeToast(id), duration)
  }
  return id
}

function removeToast(id) {
  const idx = toasts.value.findIndex(t => t.id === id)
  if (idx > -1) toasts.value.splice(idx, 1)
}

export function useToast() {
  return {
    toasts,
    showToast,
    removeToast,
    success: (msg, duration) => showToast(msg, 'success', duration),
    error: (msg, duration) => showToast(msg, 'error', duration ?? 3600),
    info: (msg, duration) => showToast(msg, 'info', duration),
    warning: (msg, duration) => showToast(msg, 'warning', duration)
  }
}

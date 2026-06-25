import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, getTimestamp } from '@/utils'
import { loadFromStorage, saveToStorage, getLastSyncTime } from '@/utils/storage'

export const usePlanStore = defineStore('plan', () => {
  const plans = ref([])
  const lastSyncTime = ref(0)

  const sortedPlans = computed(() => {
    return [...plans.value].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate
      return b.createdAt - a.createdAt
    })
  })

  const todayPlans = computed(() => {
    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000
    return plans.value.filter(p => {
      if (p.completed) return false
      if (!p.dueDate) return false
      return p.dueDate >= startOfDay && p.dueDate < endOfDay
    })
  })

  const overduePlans = computed(() => {
    const now = Date.now()
    return plans.value.filter(p => {
      if (p.completed) return false
      if (!p.dueDate) return false
      return p.dueDate < now
    })
  })

  function init() {
    const data = loadFromStorage()
    if (data && data.plans) {
      plans.value = data.plans
    }
    lastSyncTime.value = getLastSyncTime()
    checkReminders()
    startReminderCheck()
  }

  function persist() {
    const data = {
      notes: loadFromStorage()?.notes || [],
      plans: plans.value,
      updatedAt: getTimestamp()
    }
    saveToStorage(data)
    lastSyncTime.value = getTimestamp()
  }

  function createPlan(title, options = {}) {
    const now = getTimestamp()
    const plan = {
      id: generateId(),
      title,
      description: options.description || '',
      dueDate: options.dueDate || null,
      reminder: options.reminder || null,
      completed: false,
      priority: options.priority || 'normal',
      tags: options.tags || [],
      createdAt: now,
      updatedAt: now
    }
    plans.value.unshift(plan)
    persist()
    return plan
  }

  function updatePlan(id, updates) {
    const plan = plans.value.find(p => p.id === id)
    if (plan) {
      Object.assign(plan, updates, { updatedAt: getTimestamp() })
      persist()
    }
  }

  function deletePlan(id) {
    const idx = plans.value.findIndex(p => p.id === id)
    if (idx >= 0) {
      plans.value.splice(idx, 1)
      persist()
    }
  }

  function toggleComplete(id) {
    const plan = plans.value.find(p => p.id === id)
    if (plan) {
      plan.completed = !plan.completed
      plan.updatedAt = getTimestamp()
      persist()
    }
  }

  function checkReminders() {
    const now = Date.now()
    plans.value.forEach(plan => {
      if (!plan.completed && plan.reminder && plan.reminder > now - 60000 && plan.reminder <= now + 60000) {
        if (!plan._reminded) {
          showReminder(plan)
          plan._reminded = true
        }
      }
    })
  }

  function showReminder(plan) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('计划提醒', {
        body: plan.title,
        icon: '/favicon.svg'
      })
    }
    
    try {
      const event = new CustomEvent('plan-reminder', { detail: plan })
      window.dispatchEvent(event)
    } catch (e) {}
  }

  let reminderInterval = null
  function startReminderCheck() {
    if (reminderInterval) clearInterval(reminderInterval)
    reminderInterval = setInterval(checkReminders, 30000)
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function replaceAll(newPlans) {
    plans.value = newPlans
    persist()
  }

  return {
    plans,
    sortedPlans,
    todayPlans,
    overduePlans,
    lastSyncTime,
    init,
    persist,
    createPlan,
    updatePlan,
    deletePlan,
    toggleComplete,
    checkReminders,
    requestNotificationPermission,
    replaceAll
  }
})

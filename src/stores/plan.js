import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, getTimestamp } from '@/utils'
import { loadFromStore, getLastSyncTime } from '@/utils/storage'
import { useNoteStore } from './note'

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

  function plansByNote(noteId) {
    if (!noteId) return []
    return plans.value.filter(p => p.noteId === noteId)
  }

  let initPromise = null
  async function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      const data = await loadFromStore()
      if (data && data.plans) {
        plans.value = data.plans
      }
      lastSyncTime.value = getLastSyncTime()
      requestNotificationPermission()
      checkReminders()
      startReminderCheck()
    })()
    return initPromise
  }

  function persist() {
    // 同步设置 pending 数据，避免延迟导致的竞态条件
    const noteStore = useNoteStore()
    noteStore.setPendingPlans(plans.value)
    noteStore.persist()
  }
  function flushPersist() {
    const noteStore = useNoteStore()
    noteStore.setPendingPlans(plans.value)
    noteStore.flushPersist && noteStore.flushPersist()
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
      noteId: options.noteId || null,
      blockId: options.blockId || null,
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

  // 用 Set 跟踪每个 plan 的提醒阶段，避免重复提醒
  // key 格式：`${planId}:pre` / `${planId}:due`
  const remindedSet = new Set()

  function checkReminders() {
    const now = Date.now()
    plans.value.forEach(plan => {
      if (plan.completed) return
      const due = plan.dueDate
      if (!due) return

      // 阶段1：过期前 5 分钟提醒（提前预警）
      const fiveMinBefore = due - 5 * 60 * 1000
      if (!remindedSet.has(`${plan.id}:pre`) && now >= fiveMinBefore && now < due) {
        showReminder(plan, '即将到期')
        remindedSet.add(`${plan.id}:pre`)
      }

      // 阶段2：已过期提醒
      if (!remindedSet.has(`${plan.id}:due`) && now >= due && now < due + 3600000) {
        showReminder(plan, '已过期')
        remindedSet.add(`${plan.id}:due`)
      }
    })
  }

  function showReminder(plan, phase) {
    // 组合标题 + 前 15 字内容
    const desc = (plan.description || '').replace(/<[^>]+>/g, '').trim()
    const preview = desc ? ' - ' + desc.slice(0, 15) + (desc.length > 15 ? '…' : '') : ''
    const text = `${plan.title}${preview}`

    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`计划${phase}`, {
        body: text,
        icon: '/favicon-32.png',
        tag: `${plan.id}-${phase}`
      })
    }

    // 应用内事件（供 Toast 监听）
    try {
      const event = new CustomEvent('plan-reminder', { detail: { plan, phase, text } })
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
    plans.value = JSON.parse(JSON.stringify(newPlans || []))
    persist()
  }

  return {
    plans,
    sortedPlans,
    todayPlans,
    overduePlans,
    plansByNote,
    lastSyncTime,
    init,
    persist,
    flushPersist,
    createPlan,
    updatePlan,
    deletePlan,
    toggleComplete,
    checkReminders,
    requestNotificationPermission,
    replaceAll
  }
})

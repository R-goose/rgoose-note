import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, getTimestamp, deepClone } from '@/utils'
import { plansApi } from '@/api/plans'
import { useNoteStore } from './note'

// 已提醒状态持久化 key：value 是 JSON 数组 [{ key, date }]
const REMINDED_KEY = 'rgoose_plan_reminded'

function loadReminded() {
  try {
    const raw = localStorage.getItem(REMINDED_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}
function saveReminded(list) {
  try {
    localStorage.setItem(REMINDED_KEY, JSON.stringify(list))
  } catch {}
}

export const usePlanStore = defineStore('plan', () => {
  const plans = ref([])
  const lastSyncTime = ref(0)
  // 统一的时间基准，每分钟刷新，让 computed 能感知跨午夜
  const nowTick = ref(Date.now())

  const sortedPlans = computed(() => {
    return [...plans.value].sort((a, b) => {
      if (a.completed !== b.completed) return a.completed ? 1 : -1
      if (a.dueDate && b.dueDate) return a.dueDate - b.dueDate
      return b.createdAt - a.createdAt
    })
  })

  const todayPlans = computed(() => {
    const now = new Date(nowTick.value)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()
    const endOfDay = startOfDay + 24 * 60 * 60 * 1000
    return plans.value.filter(p => {
      if (p.completed) return false
      if (!p.dueDate) return false
      return p.dueDate >= startOfDay && p.dueDate < endOfDay
    })
  })

  const overduePlans = computed(() => {
    const now = nowTick.value
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
      try {
        // 复用 noteStore.init() 的 pull 数据，避免重复全量拉取
        await useNoteStore().init()
        const data = useNoteStore().getPullData()
        plans.value = data?.plans || []
        lastSyncTime.value = data?.serverTime || Date.now()
      } catch (err) {
        console.error('[planStore] 从后端加载失败:', err)
        plans.value = []
      }
      // 注意：通知权限改为按需询问，init 不再自动请求
      pruneReminded()
      checkReminders()
      startReminderCheck()
    })()
    return initPromise
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

    plansApi.create(plan)
      .catch(err => {
        console.error('创建计划失败:', err)
        const idx = plans.value.findIndex(p => p.id === plan.id)
        if (idx >= 0) plans.value.splice(idx, 1)
      })

    return plan
  }

  function updatePlan(id, updates) {
    const plan = plans.value.find(p => p.id === id)
    if (plan) {
      Object.assign(plan, updates, { updatedAt: getTimestamp() })

      plansApi.update(id, { ...updates, updatedAt: plan.updatedAt })
        .catch(err => console.error('更新计划失败:', err))
    }
  }

  function deletePlan(id) {
    const idx = plans.value.findIndex(p => p.id === id)
    if (idx >= 0) {
      const backup = plans.value[idx]
      plans.value.splice(idx, 1)

      plansApi.delete(id)
        .catch(err => {
          console.error('删除计划失败:', err)
          plans.value.splice(idx, 0, backup)
        })
    }
  }

  function toggleComplete(id) {
    const plan = plans.value.find(p => p.id === id)
    if (plan) {
      plan.completed = !plan.completed
      plan.updatedAt = getTimestamp()

      plansApi.toggleComplete(id)
        .catch(err => {
          console.error('切换完成状态失败:', err)
          plan.completed = !plan.completed
        })
    }
  }

  // 已提醒状态：持久化到 localStorage，避免刷新后重复提醒
  // 元素结构：{ key: `${planId}:${phase}`, date: 'YYYY-MM-DD' }
  let remindedList = loadReminded()

  function todayStr(ts = Date.now()) {
    const d = new Date(ts)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  }

  // 清理已删除计划 / 非 today 的记录，避免列表无限增长
  function pruneReminded() {
    const today = todayStr()
    const validKeys = new Set(plans.value.map(p => p.id))
    const before = remindedList.length
    remindedList = remindedList.filter(r =>
      r.date === today && validKeys.has(r.key.split(':')[0])
    )
    if (remindedList.length !== before) saveReminded(remindedList)
  }

  function hasReminded(planId, phase) {
    const today = todayStr()
    return remindedList.some(r => r.key === `${planId}:${phase}` && r.date === today)
  }

  function markReminded(planId, phase) {
    const key = `${planId}:${phase}`
    const today = todayStr()
    if (!remindedList.some(r => r.key === key && r.date === today)) {
      remindedList.push({ key, date: today })
      saveReminded(remindedList)
    }
  }

  function checkReminders() {
    // 刷新统一时间基准，computed 也能随之更新
    nowTick.value = Date.now()
    const now = nowTick.value
    const today = todayStr(now)
    // 跨天时清理过期记录
    if (remindedList.some(r => r.date !== today)) pruneReminded()

    plans.value.forEach(plan => {
      if (plan.completed) return
      const due = plan.dueDate
      if (!due) return

      // 阶段1：过期前 5 分钟提醒（提前预警）
      const fiveMinBefore = due - 5 * 60 * 1000
      if (!hasReminded(plan.id, 'pre') && now >= fiveMinBefore && now < due) {
        showReminder(plan, '即将到期')
        markReminded(plan.id, 'pre')
      }

      // 阶段2：已过期提醒（仅触发当天，且在到期后 1 小时窗口内）
      if (!hasReminded(plan.id, 'due') && now >= due && now < due + 3600000) {
        showReminder(plan, '已过期')
        markReminded(plan.id, 'due')
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
  let nowTickInterval = null
  function startReminderCheck() {
    stopReminderCheck()
    // 每 30 秒检查提醒（同时刷新 nowTick）
    reminderInterval = setInterval(checkReminders, 30000)
    // 兜底：每分钟刷新一次时间基准，保证 todayPlans/overduePlans 在跨午夜、长时间空闲后更新
    nowTickInterval = setInterval(() => { nowTick.value = Date.now() }, 60000)
  }
  function stopReminderCheck() {
    if (reminderInterval) { clearInterval(reminderInterval); reminderInterval = null }
    if (nowTickInterval) { clearInterval(nowTickInterval); nowTickInterval = null }
  }
  // 释放所有定时器，清缓存 / 登出时调用，避免内存泄漏与对空数据持续检测
  function dispose() {
    stopReminderCheck()
  }

  function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }

  function replaceAll(newPlans) {
    plans.value = deepClone(newPlans || [])
  }

  return {
    plans,
    sortedPlans,
    todayPlans,
    overduePlans,
    plansByNote,
    lastSyncTime,
    init,
    createPlan,
    updatePlan,
    deletePlan,
    toggleComplete,
    checkReminders,
    startReminderCheck,
    stopReminderCheck,
    dispose,
    requestNotificationPermission,
    replaceAll
  }
})

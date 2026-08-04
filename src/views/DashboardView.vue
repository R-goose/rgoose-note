<template>
  <div class="dashboard-view">
    <header class="view-header">
      <div class="header-left">
        <h1>仪表盘</h1>
        <span class="dash-count">{{ allNotes.length }} 篇笔记 · {{ totalTasks }} 个任务</span>
      </div>
      <div class="header-right">
        <button class="btn btn-ghost" @click="refreshKey++">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/></svg>
          刷新
        </button>
      </div>
    </header>

    <div class="dash-content">
      <BgDecor variant="dashboard" />
      <!-- 概览卡片 -->
      <section class="overview-cards">
        <div class="stat-card stat-tasks clickable" @click="openTaskList({ type: 'all', label: '全部任务' })">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ animTotal }}</div>
            <div class="stat-label">任务总数</div>
            <div class="stat-sub">已完成 {{ doneTasks }} · 完成率 {{ completionRate }}%</div>
          </div>
          <div class="stat-ring">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke-width="3" class="ring-bg"/>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke-width="3" class="ring-fg" :stroke-dasharray="`${(ringValue/100)*97.4} 97.4`"/>
            </svg>
            <span class="ring-text">{{ completionRate }}%</span>
          </div>
        </div>

        <div class="stat-card stat-doing clickable" @click="openTaskList({ type: 'status', value: 'doing', label: '进行中的任务' })">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ animDoing }}</div>
            <div class="stat-label">进行中</div>
            <div class="stat-sub">{{ todoTasks }} 个待办 · {{ pausedTasks }} 个搁置</div>
          </div>
        </div>

        <div class="stat-card stat-overdue" :class="{ clickable: overdueTasks > 0 || overduePlans > 0 }" @click="(overdueTasks > 0 || overduePlans > 0) && openTaskList({ type: 'overdue', label: '逾期任务' })">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value" :class="{ 'value-warn': overdueTasks > 0 || overduePlans > 0 }">{{ animOverdue }}</div>
            <div class="stat-label">逾期任务</div>
            <div class="stat-sub">{{ overduePlans }} 个计划逾期</div>
          </div>
        </div>

        <div class="stat-card stat-milestone" :class="{ clickable: totalMilestones > 0 }" @click="totalMilestones > 0 && openTaskList({ type: 'milestone', label: '里程碑' })">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ animMilestone }}</div>
            <div class="stat-label">里程碑</div>
            <div class="stat-sub">{{ doneMilestones }} 个达成 · {{ totalMilestones - doneMilestones }} 个待完成</div>
          </div>
        </div>
      </section>

      <div class="dash-grid">
        <!-- 任务状态分布 -->
        <section class="dash-panel">
          <div class="panel-title">任务状态分布</div>
          <div class="status-bars" v-if="totalTasks > 0">
            <div v-for="s in statusDist" :key="s.key" class="status-row clickable" @click="openTaskList({ type: 'status', value: s.key, label: s.label + '的任务' })">
              <div class="status-label">
                <span class="status-dot" :style="{ background: s.color }"></span>
                <span>{{ s.label }}</span>
              </div>
              <div class="status-track">
                <div class="status-fill" :style="{ width: s.pct + '%', background: s.color }"></div>
              </div>
              <div class="status-num">{{ s.count }}<span class="status-pct">{{ s.pct }}%</span></div>
            </div>
          </div>
          <div v-else class="empty-hint">还没有任务块</div>
        </section>

        <!-- 优先级分布 -->
        <section class="dash-panel">
          <div class="panel-title">优先级分布</div>
          <div class="prio-chips" v-if="totalTasks > 0">
            <div v-for="p in priorityDist" :key="p.key" class="prio-chip clickable" :class="'prio-' + p.key" @click="openTaskList({ type: 'priority', value: p.key, label: p.label + '优先级任务' })">
              <span class="prio-name">{{ p.label }}</span>
              <span class="prio-count">{{ p.count }}</span>
              <div class="prio-bar"><div class="prio-bar-fill" :style="{ width: p.pct + '%' }"></div></div>
            </div>
          </div>
          <div v-else class="empty-hint">还没有任务块</div>
        </section>

        <!-- 标签进度 -->
        <section class="dash-panel panel-wide">
          <div class="panel-title">按标签的任务进度</div>
          <div class="tag-progress-list" v-if="tagProgress.length > 0">
            <div v-for="t in tagProgress" :key="t.name" class="tag-prog-row">
              <span class="tag-prog-name">
                <span class="tag-prog-dot" :style="{ background: t.color }"></span>
                {{ t.name }}
              </span>
              <div class="tag-prog-bar">
                <div class="tag-prog-fill" :style="{ width: t.rate + '%' }"></div>
              </div>
              <span class="tag-prog-rate">{{ t.done }}/{{ t.total }} · {{ t.rate }}%</span>
            </div>
          </div>
          <div v-else class="empty-hint">给笔记或任务打标签后可按标签查看进度</div>
        </section>

        <!-- 里程碑时间线 -->
        <section class="dash-panel panel-wide">
          <div class="panel-title">里程碑时间线</div>
          <div class="ms-timeline" v-if="milestoneTimeline.length > 0">
            <div v-for="(m, i) in milestoneTimeline" :key="m.id" class="ms-item" :class="{ done: m.done, overdue: m.overdue }">
              <div class="ms-marker">
                <svg v-if="m.done" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                <span v-else class="ms-dot-inner"></span>
                <span v-if="i < milestoneTimeline.length - 1" class="ms-line"></span>
              </div>
              <div class="ms-info" @click="goToNote(m.noteId)">
                <div class="ms-title">{{ m.title || '未命名里程碑' }}</div>
                <div class="ms-meta">
                  <span class="ms-note-name">{{ m.noteTitle }}</span>
                  <span class="ms-date">{{ m.date || '未设日期' }}</span>
                  <span v-if="m.relative" class="ms-relative" :class="{ overdue: m.overdue }">{{ m.relative }}</span>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="empty-hint">还没有里程碑块</div>
        </section>
      </div>
    </div>

    <!-- 任务清单弹窗 -->
    <Teleport to="body">
      <Transition name="tl">
        <div v-if="showTaskList" class="tl-overlay" @click.self="showTaskList = false">
          <div class="tl-modal">
            <div class="tl-header">
              <div class="tl-title">
                <span class="tl-title-text">{{ listFilter.label }}</span>
                <span class="tl-count">{{ filteredTaskList.length }} 个</span>
              </div>
              <button class="tl-close" @click="showTaskList = false">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
            </div>
            <div class="tl-body">
              <div v-if="filteredTaskList.length === 0" class="tl-empty">该分类下暂无任务</div>
              <div v-for="t in filteredTaskList" :key="t.id" class="tl-item" :class="{ 'tl-item-done': t._done }" @click="goToNote(t._noteId, t.id)">
                <span v-if="t._isMilestone && t._done" class="tl-status-dot tl-ms-done">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                </span>
                <span v-else-if="t._isMilestone" class="tl-status-dot tl-ms-pending"></span>
                <span v-else class="tl-status-dot" :style="{ background: statusColorOf(t.status) }"></span>
                <div class="tl-item-main">
                  <div class="tl-item-title">{{ t.title || '未命名任务' }}</div>
                  <div class="tl-item-meta">
                    <span class="tl-note-name">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                      {{ t._noteTitle }}
                    </span>
                    <span v-if="t.dueDate" class="tl-due" :class="{ 'tl-due-overdue': isOverdueTask(t) }">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {{ t.dueDate }}
                    </span>
                    <span v-if="(t.priority || 'normal') !== 'normal'" class="tl-prio" :class="'tl-prio-' + (t.priority || 'normal')">{{ prioLabelOf(t.priority) }}</span>
                  </div>
                </div>
                <svg class="tl-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { useTagStore } from '@/stores/tag'
import BgDecor from '@/components/BgDecor.vue'

const router = useRouter()
const noteStore = useNoteStore()
const planStore = usePlanStore()
const tagStore = useTagStore()
const refreshKey = ref(0)

function useCountUp(source, duration = 1000) {
  const display = ref(0)
  let raf = null
  function animate(to) {
    if (raf) cancelAnimationFrame(raf)
    const from = display.value
    const start = performance.now()
    function step(now) {
      const t = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - t, 3)
      display.value = Math.round(from + (to - from) * eased)
      if (t < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
  }
  watch(source, (v) => animate(Number(v) || 0))
  onMounted(() => { setTimeout(() => animate(Number(source.value) || 0), 150) })
  return display
}

const allNotes = computed(() => noteStore.allSortedNotes)

const allBlocks = computed(() => {
  refreshKey.value
  const list = []
  for (const n of allNotes.value) {
    if (!n.blocks) continue
    for (const b of n.blocks) {
      list.push({ ...b, _noteId: n.id, _noteTitle: n.title })
    }
  }
  return list
})

const todoBlocks = computed(() => allBlocks.value.filter(b => b.type === 'todo'))
const milestoneBlocks = computed(() => allBlocks.value.filter(b => b.type === 'milestone'))

const totalTasks = computed(() => todoBlocks.value.length)
const doneTasks = computed(() => todoBlocks.value.filter(b => b.status === 'done').length)
const doingTasks = computed(() => todoBlocks.value.filter(b => b.status === 'doing').length)
const todoTasks = computed(() => todoBlocks.value.filter(b => b.status === 'todo' || !b.status).length)
const pausedTasks = computed(() => todoBlocks.value.filter(b => b.status === 'paused').length)
const completionRate = computed(() => totalTasks.value === 0 ? 0 : Math.round(doneTasks.value / totalTasks.value * 100))

const now = Date.now()
const startOfDay = new Date()
startOfDay.setHours(0, 0, 0, 0)
const startToday = startOfDay.getTime()

const overdueTasks = computed(() => todoBlocks.value.filter(b => {
  if (b.status === 'done' || !b.dueDate) return false
  return new Date(b.dueDate).getTime() < startToday
}).length)

const overduePlans = computed(() => planStore.overduePlans.length)

const totalMilestones = computed(() => milestoneBlocks.value.length)
const doneMilestones = computed(() => milestoneBlocks.value.filter(b => b.done).length)

const animTotal = useCountUp(totalTasks)
const animDoing = useCountUp(doingTasks)
const animOverdue = useCountUp(overdueTasks)
const animMilestone = useCountUp(totalMilestones)
const ringValue = ref(0)
watch(completionRate, (v) => { ringValue.value = v })
onMounted(() => { nextTick(() => setTimeout(() => { ringValue.value = completionRate.value }, 300)) })

const STATUS_MAP = [
  { key: 'todo', label: '待办', color: '#9ca3af' },
  { key: 'doing', label: '进行中', color: '#4a90d9' },
  { key: 'done', label: '已完成', color: '#4a8a64' },
  { key: 'paused', label: '已搁置', color: '#d4a657' }
]

const statusDist = computed(() => {
  const total = totalTasks.value
  return STATUS_MAP.map(s => {
    const count = todoBlocks.value.filter(b => (b.status || 'todo') === s.key).length
    return { ...s, count, pct: total ? Math.round(count / total * 100) : 0 }
  })
})

const PRIORITY_MAP = [
  { key: 'high', label: '高优' },
  { key: 'normal', label: '普通' },
  { key: 'low', label: '低优' }
]

const priorityDist = computed(() => {
  const total = totalTasks.value
  return PRIORITY_MAP.map(p => {
    const count = todoBlocks.value.filter(b => (b.priority || 'normal') === p.key).length
    return { ...p, count, pct: total ? Math.round(count / total * 100) : 0 }
  })
})

function getNoteTags(noteId) {
  const note = allNotes.value.find(n => n.id === noteId)
  return note?.tags || []
}

const tagById = computed(() => new Map(tagStore.tags.map(t => [t.id, t])))

const tagProgress = computed(() => {
  refreshKey.value
  const map = new Map()
  for (const t of todoBlocks.value) {
    const tagIds = getNoteTags(t._noteId)
    for (const tagId of tagIds) {
      const tag = tagById.value.get(tagId)
      const displayName = tag?.name || tagId
      if (!map.has(tagId)) map.set(tagId, { name: displayName, color: tag?.color || '#9ca3af', total: 0, done: 0 })
      const item = map.get(tagId)
      item.total++
      if (t.status === 'done') item.done++
    }
  }
  return [...map.values()]
    .map(v => ({
      id: [...map.keys()].find(k => map.get(k) === v),
      name: v.name,
      total: v.total,
      done: v.done,
      rate: v.total ? Math.round(v.done / v.total * 100) : 0,
      color: v.color
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 8)
})

const milestoneTimeline = computed(() => {
  return [...milestoneBlocks.value]
    .sort((a, b) => {
      if (a.done !== b.done) return a.done ? 1 : -1
      const da = a.date ? new Date(a.date).getTime() : Infinity
      const db = b.date ? new Date(b.date).getTime() : Infinity
      return da - db
    })
    .slice(0, 10)
    .map(m => {
      const overdue = !m.done && m.date && new Date(m.date).getTime() < startToday
      let relative = ''
      if (m.date) {
        const d = new Date(m.date).getTime()
        const diff = Math.ceil((d - startToday) / (24 * 3600 * 1000))
        if (m.done) relative = '已达成'
        else if (diff === 0) relative = '今天'
        else if (diff > 0) relative = `还有 ${diff} 天`
        else relative = `逾期 ${-diff} 天`
      }
      return {
        id: m.id,
        title: m.title,
        noteId: m._noteId,
        noteTitle: m._noteTitle || '未命名笔记',
        date: m.date,
        done: !!m.done,
        overdue,
        relative
      }
    })
})

function goToNote(noteId, blockId) {
  showTaskList.value = false
  if (noteId) {
    router.push(blockId ? `/note/${noteId}?b=${blockId}` : `/note/${noteId}`)
  } else if (blockId && String(blockId).startsWith('plan-')) {
    // 计划项无关联笔记时跳转到计划视图
    router.push('/plans')
  }
}

const showTaskList = ref(false)
const listFilter = ref({ type: 'all', label: '全部任务' })

function openTaskList(filter) {
  listFilter.value = filter
  showTaskList.value = true
}

const STATUS_COLORS = { todo: '#9ca3af', doing: '#4a90d9', done: '#4a8a64', paused: '#d4a657' }
function statusColorOf(status) {
  return STATUS_COLORS[status || 'todo'] || '#9ca3af'
}

const PRIO_LABELS = { high: '高优', low: '低优' }
function prioLabelOf(priority) {
  return PRIO_LABELS[priority] || ''
}

function isOverdueTask(t) {
  if (t.status === 'done' || !t.dueDate) return false
  return new Date(t.dueDate).getTime() < startToday
}

const filteredTaskList = computed(() => {
  const f = listFilter.value
  // 里程碑列表：特殊处理，直接返回里程碑块
  if (f.type === 'milestone') {
    return [...milestoneBlocks.value]
      .sort((a, b) => {
        if (a.done !== b.done) return a.done ? 1 : -1
        const da = a.date ? new Date(a.date).getTime() : Infinity
        const db = b.date ? new Date(b.date).getTime() : Infinity
        return da - db
      })
      .map(m => ({
        id: m.id,
        title: m.title || '未命名里程碑',
        _noteId: m._noteId,
        _noteTitle: m._noteTitle || '未命名笔记',
        date: m.date,
        status: m.done ? 'done' : 'todo',
        priority: 'normal',
        _isMilestone: true,
        _done: !!m.done
      }))
  }

  let list = todoBlocks.value
  if (f.type === 'status') {
    list = list.filter(t => (t.status || 'todo') === f.value)
  } else if (f.type === 'priority') {
    list = list.filter(t => (t.priority || 'normal') === f.value)
  } else if (f.type === 'overdue') {
    // 逾期任务块
    const overdueBlocks = list.filter(t => isOverdueTask(t))
    // 逾期计划（映射为列表项）
    const noteTitleMap = {}
    for (const n of allNotes.value) noteTitleMap[n.id] = n.title
    const overduePlanItems = planStore.overduePlans.map(p => ({
      id: 'plan-' + p.id,
      title: p.title || '未命名计划',
      _noteId: p.noteId,
      _noteTitle: (p.noteId && noteTitleMap[p.noteId]) || '计划',
      dueDate: p.dueDate ? new Date(p.dueDate).toLocaleDateString('zh-CN') : '',
      status: 'todo',
      priority: p.priority || 'normal',
      _isPlan: true
    }))
    list = [...overdueBlocks, ...overduePlanItems]
  }
  const order = { doing: 0, todo: 1, paused: 2, done: 3 }
  return [...list].sort((a, b) => {
    const sa = order[a.status || 'todo'] ?? 9
    const sb = order[b.status || 'todo'] ?? 9
    if (sa !== sb) return sa - sb
    return (a._noteTitle || '').localeCompare(b._noteTitle || '')
  })
})
</script>

<style scoped>
.dashboard-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  position: relative;
}
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
  position: relative;
  z-index: 2;
}
.view-header::after {
  content: '';
  position: absolute; left: 0; right: 0; bottom: -1px; height: 1px;
  background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
  opacity: 0.35;
}
.header-left { display: flex; align-items: baseline; gap: 12px; }
.header-left h1 {
  font-size: 22px; font-weight: 800; color: var(--text-primary);
  letter-spacing: -0.02em;
  background: linear-gradient(135deg, var(--text-primary), var(--text-secondary));
  -webkit-background-clip: text; background-clip: text;
  -webkit-text-fill-color: transparent;
}
.dash-count {
  font-size: 12px; font-weight: 600;
  color: var(--primary-dark);
  background: var(--primary-soft);
  padding: 4px 12px; border-radius: 10px;
  letter-spacing: 0.01em;
}
.header-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--radius-md);
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: none; transition: all var(--transition-fast);
}
.btn-ghost { background: var(--bg-tertiary); color: var(--text-secondary); }
.btn-ghost:hover {
  background: var(--bg-hover); color: var(--text-primary);
  transform: translateY(-1px);
}
.btn-ghost:active svg { transform: rotate(-90deg); transition: transform 0.4s; }

.dash-content {
  flex: 1; overflow-y: auto; padding: 24px 28px 32px;
  position: relative;
  background-image:
    radial-gradient(circle at 12% 8%, rgba(74, 138, 100, 0.05), transparent 38%),
    radial-gradient(circle at 88% 4%, rgba(74, 144, 217, 0.045), transparent 36%),
    radial-gradient(circle at 70% 92%, rgba(155, 123, 214, 0.04), transparent 40%);
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px; margin-bottom: 24px;
}
.stat-card {
  display: flex; align-items: center; gap: 14px;
  padding: 20px 22px; border-radius: var(--radius-lg);
  background: var(--bg-secondary); border: 1px solid var(--border-light);
  position: relative; overflow: hidden;
  opacity: 0;
  animation: dashIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
}
.stat-card:nth-child(1) { animation-delay: 0.05s; }
.stat-card:nth-child(2) { animation-delay: 0.12s; }
.stat-card:nth-child(3) { animation-delay: 0.19s; }
.stat-card:nth-child(4) { animation-delay: 0.26s; }
/* 渐变光晕装饰 */
.stat-card::before {
  content: ''; position: absolute; top: -40%; right: -30%;
  width: 140px; height: 140px; border-radius: 50%;
  filter: blur(8px); opacity: 0.5; pointer-events: none;
  transition: opacity 0.4s, transform 0.5s;
}
.stat-card::after {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.15; pointer-events: none;
}
.stat-tasks { color: #4a8a64; }
.stat-doing { color: #4a90d9; }
.stat-overdue { color: #d97757; }
.stat-milestone { color: #9b7bd6; }
.stat-tasks::before { background: radial-gradient(circle, rgba(74,138,100,0.4), transparent 70%); }
.stat-doing::before { background: radial-gradient(circle, rgba(74,144,217,0.4), transparent 70%); }
.stat-overdue::before { background: radial-gradient(circle, rgba(217,119,87,0.42), transparent 70%); }
.stat-milestone::before { background: radial-gradient(circle, rgba(155,123,214,0.4), transparent 70%); }
.stat-icon {
  width: 46px; height: 46px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; position: relative; z-index: 1;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.stat-tasks .stat-icon { background: rgba(74,138,100,0.13); color: #4a8a64; }
.stat-doing .stat-icon { background: rgba(74,144,217,0.13); color: #4a90d9; }
.stat-overdue .stat-icon { background: rgba(217,119,87,0.13); color: #d97757; }
.stat-milestone .stat-icon { background: rgba(155,123,214,0.13); color: #9b7bd6; }
.stat-body { flex: 1; min-width: 0; position: relative; z-index: 1; }
.stat-value {
  font-size: 28px; font-weight: 800; color: var(--text-primary);
  line-height: 1.1; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.value-warn { color: #d97757; }
.stat-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-top: 3px; }
.stat-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 5px; }

/* 完成率环 */
.stat-ring {
  position: relative; width: 54px; height: 54px; flex-shrink: 0;
  color: #4a8a64; z-index: 1;
}
.stat-ring svg { transform: rotate(-90deg); filter: drop-shadow(0 0 4px rgba(74,138,100,0.35)); }
.ring-bg { stroke: var(--bg-tertiary); }
.ring-fg {
  stroke: currentColor; stroke-linecap: round;
  transition: stroke-dasharray 1s cubic-bezier(0.22, 1, 0.36, 1);
}
.ring-text {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 800; color: #4a8a64;
  font-variant-numeric: tabular-nums;
}

/* 网格区 */
.dash-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.dash-panel {
  background: var(--bg-secondary); border: 1px solid var(--border-light);
  border-radius: var(--radius-lg); padding: 20px 22px;
  opacity: 0;
  animation: dashIn 0.55s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  animation-delay: 0.32s;
  position: relative; overflow: hidden;
}
.dash-panel:nth-of-type(2) { animation-delay: 0.38s; }
.dash-panel:nth-of-type(3) { animation-delay: 0.44s; }
.dash-panel:nth-of-type(4) { animation-delay: 0.5s; }
.panel-wide { grid-column: 1 / -1; }
.panel-title {
  font-size: 14px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 18px; display: flex; align-items: center; gap: 9px;
  letter-spacing: -0.01em;
}
.panel-title::before {
  content: ''; width: 4px; height: 15px; border-radius: 2px;
  background: linear-gradient(180deg, var(--primary-color), #6bbd8f);
}

/* 状态分布条 */
.status-bars { display: flex; flex-direction: column; gap: 13px; }
.status-row { display: flex; align-items: center; gap: 12px; }
.status-label {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 600; color: var(--text-secondary);
  width: 68px; flex-shrink: 0;
}
.status-dot { width: 9px; height: 9px; border-radius: 50%; }
.status-track {
  flex: 1; height: 9px; background: var(--bg-tertiary); border-radius: 5px; overflow: hidden;
  position: relative;
}
.status-fill {
  height: 100%; border-radius: 5px; position: relative;
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
  overflow: hidden;
}
.status-fill::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  transform: translateX(-100%);
  animation: shimmer 2.4s ease-in-out infinite;
}
.status-num {
  font-size: 13px; font-weight: 700; color: var(--text-primary);
  min-width: 58px; text-align: right;
  font-variant-numeric: tabular-nums;
}
.status-pct { font-size: 11px; font-weight: 500; color: var(--text-tertiary); margin-left: 4px; }

/* 优先级 */
.prio-chips { display: flex; flex-direction: column; gap: 10px; }
.prio-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 13px; border-radius: var(--radius-md);
  background: var(--bg-tertiary);
  border: 1px solid transparent;
  transition: all var(--transition-fast);
}
.prio-name { font-size: 12px; font-weight: 600; color: var(--text-secondary); width: 42px; }
.prio-count {
  font-size: 17px; font-weight: 800; color: var(--text-primary); width: 30px;
  font-variant-numeric: tabular-nums;
}
.prio-bar { flex: 1; height: 7px; background: var(--bg-hover); border-radius: 4px; overflow: hidden; }
.prio-bar-fill {
  height: 100%; border-radius: 4px; position: relative; overflow: hidden;
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.prio-bar-fill::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
  transform: translateX(-100%);
  animation: shimmer 2.6s ease-in-out infinite;
}
.prio-high .prio-bar-fill { background: linear-gradient(90deg, #d97757, #e89a7a); }
.prio-normal .prio-bar-fill { background: linear-gradient(90deg, #4a90d9, #6aaae5); }
.prio-low .prio-bar-fill { background: linear-gradient(90deg, #9ca3af, #b8bfc6); }

/* 标签进度 */
.tag-progress-list { display: flex; flex-direction: column; gap: 13px; }
.tag-prog-row { display: flex; align-items: center; gap: 12px; }
.tag-prog-name {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; font-weight: 600; color: var(--text-secondary);
  width: 104px; flex-shrink: 0;
}
.tag-prog-dot {
  width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0;
  box-shadow: 0 0 0 2px rgba(255,255,255,0.15);
}
.tag-prog-bar {
  flex: 1; height: 9px; background: var(--bg-tertiary); border-radius: 5px;
  overflow: hidden; position: relative;
}
.tag-prog-fill {
  height: 100%; border-radius: 5px; position: relative; overflow: hidden;
  background: linear-gradient(90deg, var(--primary-color), #6bbd8f);
  transition: width 0.9s cubic-bezier(0.22, 1, 0.36, 1);
}
.tag-prog-fill::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.35), transparent);
  transform: translateX(-100%);
  animation: shimmer 2.8s ease-in-out infinite;
}
.tag-prog-rate {
  font-size: 11px; font-weight: 700; color: var(--text-secondary);
  min-width: 92px; text-align: right;
  font-variant-numeric: tabular-nums;
}

/* 里程碑时间线 */
.ms-timeline { display: flex; flex-direction: column; }
.ms-item { display: flex; gap: 14px; padding-bottom: 4px; }
.ms-marker {
  position: relative; width: 20px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #9b7bd6; padding-top: 2px;
}
.ms-dot-inner {
  width: 11px; height: 11px; border-radius: 50%;
  border: 2px solid currentColor; background: var(--bg-secondary);
  position: relative; z-index: 1;
}
.ms-item:not(.done) .ms-dot-inner {
  box-shadow: 0 0 0 0 rgba(155,123,214,0.45);
  animation: dotPulse 2.4s ease-in-out infinite;
}
.ms-item.done .ms-marker { color: #4a8a64; }
.ms-item.done .ms-dot-inner { background: currentColor; animation: none; }
.ms-line {
  position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
  width: 2px; height: calc(100% + 4px);
  background: linear-gradient(180deg, var(--border-light), transparent);
  transform-origin: top;
  animation: lineGrow 0.6s ease forwards;
}
.ms-info {
  flex: 1; padding: 5px 8px 16px;
  cursor: pointer; border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
  margin-left: -4px;
}
.ms-info:hover { background: var(--bg-hover); }
.ms-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ms-item.done .ms-title { text-decoration: line-through; opacity: 0.55; }
.ms-meta { display: flex; align-items: center; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
.ms-note-name { font-size: 11px; color: var(--text-tertiary); }
.ms-date { font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.ms-relative { font-size: 11px; font-weight: 700; color: var(--primary-color); }
.ms-relative.overdue { color: #d97757; }

.empty-hint {
  padding: 32px 12px; text-align: center;
  font-size: 12px; color: var(--text-tertiary);
}

/* 可点击项通用 */
.clickable {
  cursor: pointer;
  transition: all var(--transition-fast);
}
.stat-card.clickable:hover {
  border-color: color-mix(in srgb, currentColor 45%, transparent);
  transform: translateY(-3px);
  box-shadow: 0 10px 28px -12px color-mix(in srgb, currentColor 55%, transparent);
}
.stat-card.clickable:hover::before {
  opacity: 0.85; transform: scale(1.15);
}
.stat-card.clickable:hover .stat-icon { transform: scale(1.08) rotate(-4deg); }
.status-row.clickable {
  border-radius: var(--radius-sm);
  transition: all var(--transition-fast);
}
.status-row.clickable:hover {
  background: var(--bg-hover);
  transform: translateX(3px);
}
.prio-chip.clickable:hover {
  border-color: var(--primary-color);
  transform: translateX(3px);
  background: var(--bg-hover);
}

/* 任务清单弹窗 */
.tl-overlay {
  position: fixed; inset: 0; z-index: 9999;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 8vh 16px;
}
.tl-modal {
  width: 100%; max-width: 520px; max-height: 76vh;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex; flex-direction: column; overflow: hidden;
}
.tl-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border-light);
}
.tl-title { display: flex; align-items: baseline; gap: 10px; }
.tl-title-text { font-size: 16px; font-weight: 700; color: var(--text-primary); }
.tl-count {
  font-size: 12px; font-weight: 600; color: var(--primary-color);
  background: var(--primary-soft);
  padding: 2px 8px; border-radius: 10px;
}
.tl-close {
  width: 30px; height: 30px; border-radius: var(--radius-sm);
  display: flex; align-items: center; justify-content: center;
  color: var(--text-tertiary); cursor: pointer;
  transition: all var(--transition-fast);
}
.tl-close:hover { background: var(--bg-hover); color: var(--text-primary); }

.tl-body { flex: 1; overflow-y: auto; padding: 8px; }
.tl-empty { padding: 40px 12px; text-align: center; font-size: 13px; color: var(--text-tertiary); }

.tl-item {
  display: flex; align-items: center; gap: 12px;
  padding: 10px 12px; border-radius: var(--radius-md);
  cursor: pointer; transition: background var(--transition-fast);
}
.tl-item:hover { background: var(--bg-hover); }
.tl-item + .tl-item { margin-top: 2px; }
.tl-status-dot {
  width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.tl-ms-done {
  background: #4a8a64; color: #fff;
}
.tl-ms-pending {
  background: var(--bg-tertiary); border: 1.5px solid var(--text-tertiary);
}
.tl-item-done .tl-item-title { color: var(--text-tertiary); text-decoration: line-through; }
.tl-item-main { flex: 1; min-width: 0; }
.tl-item-title {
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tl-item-meta { display: flex; align-items: center; gap: 12px; margin-top: 3px; flex-wrap: wrap; }
.tl-note-name {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; color: var(--text-tertiary);
  max-width: 220px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tl-note-name svg { flex-shrink: 0; }
.tl-due {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.tl-due svg { flex-shrink: 0; }
.tl-due-overdue { color: #d97757; font-weight: 600; }
.tl-prio {
  font-size: 10px; font-weight: 700; padding: 1px 6px; border-radius: 4px;
}
.tl-prio-high { color: #d97757; background: rgba(217, 119, 87, 0.14); }
.tl-prio-low { color: #9ca3af; background: rgba(156, 163, 175, 0.16); }
.tl-go { color: var(--text-tertiary); flex-shrink: 0; transition: all var(--transition-fast); }
.tl-item:hover .tl-go { color: var(--primary-color); transform: translateX(2px); }

.tl-enter-active, .tl-leave-active { transition: opacity 0.18s ease; }
.tl-enter-active .tl-modal, .tl-leave-active .tl-modal { transition: transform 0.18s ease, opacity 0.18s ease; }
.tl-enter-from, .tl-leave-to { opacity: 0; }
.tl-enter-from .tl-modal, .tl-leave-to .tl-modal { transform: translateY(-12px) scale(0.98); opacity: 0; }

@media (max-width: 760px) {
  .dash-grid { grid-template-columns: 1fr; }
}

/* 关键帧动画 */
@keyframes dashIn {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes shimmer {
  0% { transform: translateX(-100%); }
  60%, 100% { transform: translateX(220%); }
}
@keyframes dotPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(155, 123, 214, 0.45); }
  50% { box-shadow: 0 0 0 5px rgba(155, 123, 214, 0); }
}
@keyframes lineGrow {
  from { transform: translateX(-50%) scaleY(0); }
  to { transform: translateX(-50%) scaleY(1); }
}

/* 无障碍：尊重「减少动态」偏好 */
@media (prefers-reduced-motion: reduce) {
  .stat-card, .dash-panel { animation: none; opacity: 1; }
  .status-fill::after, .prio-bar-fill::after, .tag-prog-fill::after,
  .ms-item:not(.done) .ms-dot-inner, .ms-line { animation: none; }
  .ring-fg { transition: none; }
}
</style>

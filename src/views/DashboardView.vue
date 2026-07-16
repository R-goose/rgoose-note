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
      <!-- 概览卡片 -->
      <section class="overview-cards">
        <div class="stat-card stat-tasks">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ totalTasks }}</div>
            <div class="stat-label">任务总数</div>
            <div class="stat-sub">已完成 {{ doneTasks }} · 完成率 {{ completionRate }}%</div>
          </div>
          <div class="stat-ring" :style="{ '--p': completionRate }">
            <svg viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke-width="3" class="ring-bg"/>
              <circle cx="18" cy="18" r="15.5" fill="none" stroke-width="3" class="ring-fg" :stroke-dasharray="`${(completionRate/100)*97.4} 97.4`"/>
            </svg>
            <span class="ring-text">{{ completionRate }}%</span>
          </div>
        </div>

        <div class="stat-card stat-doing">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ doingTasks }}</div>
            <div class="stat-label">进行中</div>
            <div class="stat-sub">{{ todoTasks }} 个待办 · {{ pausedTasks }} 个搁置</div>
          </div>
        </div>

        <div class="stat-card stat-overdue">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value" :class="{ 'value-warn': overdueTasks > 0 }">{{ overdueTasks }}</div>
            <div class="stat-label">逾期任务</div>
            <div class="stat-sub">{{ overduePlans }} 个计划逾期</div>
          </div>
        </div>

        <div class="stat-card stat-milestone">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ totalMilestones }}</div>
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
            <div v-for="s in statusDist" :key="s.key" class="status-row">
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
            <div v-for="p in priorityDist" :key="p.key" class="prio-chip" :class="'prio-' + p.key">
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
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { useTagStore } from '@/stores/tag'

const router = useRouter()
const noteStore = useNoteStore()
const planStore = usePlanStore()
const tagStore = useTagStore()
const refreshKey = ref(0)

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

const tagProgress = computed(() => {
  refreshKey.value
  const map = new Map()
  for (const t of todoBlocks.value) {
    const tags = getNoteTags(t._noteId)
    for (const tagName of tags) {
      if (!map.has(tagName)) map.set(tagName, { total: 0, done: 0 })
      const item = map.get(tagName)
      item.total++
      if (t.status === 'done') item.done++
    }
  }
  const tagColorMap = new Map(tagStore.tags.map(t => [t.name, t.color]))
  return [...map.entries()]
    .map(([name, v]) => ({
      name,
      total: v.total,
      done: v.done,
      rate: v.total ? Math.round(v.done / v.total * 100) : 0,
      color: tagColorMap.get(name) || '#9ca3af'
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

function goToNote(noteId) {
  if (noteId) router.push(`/note/${noteId}`)
}
</script>

<style scoped>
.dashboard-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}
.header-left { display: flex; align-items: baseline; gap: 12px; }
.header-left h1 { font-size: 22px; font-weight: 700; color: var(--text-primary); }
.dash-count {
  font-size: 12px; font-weight: 500;
  color: var(--secondary-dark);
  background: var(--secondary-softer);
  padding: 3px 10px; border-radius: 10px;
}
.header-right { display: flex; align-items: center; gap: 12px; margin-left: auto; }
.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 14px; border-radius: var(--radius-md);
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: none; transition: all var(--transition-fast);
}
.btn-ghost { background: var(--bg-tertiary); color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); }

.dash-content {
  flex: 1; overflow-y: auto; padding: 24px 28px;
}

/* 概览卡片 */
.overview-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px; margin-bottom: 24px;
}
.stat-card {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 20px; border-radius: var(--radius-lg);
  background: var(--bg-secondary); border: 1px solid var(--border-light);
  position: relative; overflow: hidden;
}
.stat-card::before {
  content: ''; position: absolute; top: 0; left: 0; width: 4px; height: 100%;
}
.stat-tasks::before { background: #4a8a64; }
.stat-doing::before { background: #4a90d9; }
.stat-overdue::before { background: #d97757; }
.stat-milestone::before { background: #9b7bd6; }
.stat-icon {
  width: 44px; height: 44px; border-radius: var(--radius-md);
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-tasks .stat-icon { background: rgba(74,138,100,0.12); color: #4a8a64; }
.stat-doing .stat-icon { background: rgba(74,144,217,0.12); color: #4a90d9; }
.stat-overdue .stat-icon { background: rgba(217,119,87,0.12); color: #d97757; }
.stat-milestone .stat-icon { background: rgba(155,123,214,0.12); color: #9b7bd6; }
.stat-body { flex: 1; min-width: 0; }
.stat-value { font-size: 26px; font-weight: 700; color: var(--text-primary); line-height: 1.2; }
.value-warn { color: #d97757; }
.stat-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-top: 2px; }
.stat-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 4px; }

/* 完成率环 */
.stat-ring {
  position: relative; width: 52px; height: 52px; flex-shrink: 0;
  color: #4a8a64;
}
.stat-ring svg { transform: rotate(-90deg); }
.ring-bg { stroke: var(--bg-tertiary); }
.ring-fg { stroke: currentColor; stroke-linecap: round; transition: stroke-dasharray 0.4s; }
.ring-text {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700; color: #4a8a64;
}

/* 网格区 */
.dash-grid {
  display: grid; grid-template-columns: 1fr 1fr; gap: 16px;
}
.dash-panel {
  background: var(--bg-secondary); border: 1px solid var(--border-light);
  border-radius: var(--radius-lg); padding: 18px 20px;
}
.panel-wide { grid-column: 1 / -1; }
.panel-title {
  font-size: 14px; font-weight: 700; color: var(--text-primary);
  margin-bottom: 16px; display: flex; align-items: center; gap: 8px;
}
.panel-title::before {
  content: ''; width: 3px; height: 14px; border-radius: 2px;
  background: var(--primary-color);
}

/* 状态分布条 */
.status-bars { display: flex; flex-direction: column; gap: 12px; }
.status-row { display: flex; align-items: center; gap: 12px; }
.status-label {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--text-secondary);
  width: 64px; flex-shrink: 0;
}
.status-dot { width: 8px; height: 8px; border-radius: 50%; }
.status-track {
  flex: 1; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden;
}
.status-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
.status-num {
  font-size: 12px; font-weight: 700; color: var(--text-primary);
  min-width: 56px; text-align: right;
}
.status-pct { font-size: 11px; font-weight: 500; color: var(--text-tertiary); margin-left: 4px; }

/* 优先级 */
.prio-chips { display: flex; flex-direction: column; gap: 10px; }
.prio-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: var(--radius-md);
  background: var(--bg-tertiary);
}
.prio-name { font-size: 12px; font-weight: 600; color: var(--text-secondary); width: 40px; }
.prio-count { font-size: 16px; font-weight: 700; color: var(--text-primary); width: 28px; }
.prio-bar { flex: 1; height: 6px; background: var(--bg-hover); border-radius: 3px; overflow: hidden; }
.prio-bar-fill { height: 100%; border-radius: 3px; transition: width 0.4s; }
.prio-high .prio-bar-fill { background: #d97757; }
.prio-normal .prio-bar-fill { background: #4a90d9; }
.prio-low .prio-bar-fill { background: #9ca3af; }

/* 标签进度 */
.tag-progress-list { display: flex; flex-direction: column; gap: 12px; }
.tag-prog-row { display: flex; align-items: center; gap: 12px; }
.tag-prog-name {
  display: flex; align-items: center; gap: 6px;
  font-size: 12px; font-weight: 600; color: var(--text-secondary);
  width: 100px; flex-shrink: 0;
}
.tag-prog-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.tag-prog-bar { flex: 1; height: 8px; background: var(--bg-tertiary); border-radius: 4px; overflow: hidden; }
.tag-prog-fill {
  height: 100%; border-radius: 4px;
  background: linear-gradient(90deg, var(--primary-color), #6bbd8f);
  transition: width 0.4s;
}
.tag-prog-rate { font-size: 11px; font-weight: 600; color: var(--text-tertiary); min-width: 90px; text-align: right; }

/* 里程碑时间线 */
.ms-timeline { display: flex; flex-direction: column; }
.ms-item { display: flex; gap: 14px; padding-bottom: 4px; }
.ms-marker {
  position: relative; width: 20px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  color: #9b7bd6; padding-top: 2px;
}
.ms-dot-inner {
  width: 10px; height: 10px; border-radius: 50%;
  border: 2px solid currentColor; background: var(--bg-secondary);
}
.ms-item.done .ms-marker { color: #4a8a64; }
.ms-item.done .ms-dot-inner { background: currentColor; }
.ms-line {
  position: absolute; top: 18px; left: 50%; transform: translateX(-50%);
  width: 2px; height: calc(100% + 4px); background: var(--border-light);
}
.ms-info {
  flex: 1; padding: 4px 0 16px;
  cursor: pointer; border-radius: var(--radius-sm);
}
.ms-info:hover { opacity: 0.7; }
.ms-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
.ms-item.done .ms-title { text-decoration: line-through; opacity: 0.6; }
.ms-meta { display: flex; align-items: center; gap: 10px; margin-top: 3px; flex-wrap: wrap; }
.ms-note-name { font-size: 11px; color: var(--text-tertiary); }
.ms-date { font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.ms-relative { font-size: 11px; font-weight: 600; color: var(--primary-color); }
.ms-relative.overdue { color: #d97757; }

.empty-hint {
  padding: 28px 12px; text-align: center;
  font-size: 12px; color: var(--text-tertiary);
}

@media (max-width: 760px) {
  .dash-grid { grid-template-columns: 1fr; }
}
</style>

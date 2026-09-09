<template>
  <div class="dashboard-view">
    <header class="view-header">
      <div class="header-left">
        <h1>仪表盘</h1>
        <span class="dash-count">{{ totalNotes }} 篇笔记 · {{ folderCount }} 个文件夹</span>
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
      <!-- 首次使用引导 -->
      <section v-if="showOnboarding" class="onboarding-card">
        <button class="onboarding-close" title="不再显示" @click="dismissOnboarding">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <div class="onboarding-head">
          <h2>欢迎使用 R-Goose Note 🎉</h2>
          <p>一款画布式笔记应用，2 步快速上手：</p>
        </div>
        <div class="onboarding-steps">
          <div class="onboarding-step">
            <div class="step-num">1</div>
            <div class="step-body">
              <div class="step-title">创建第一篇笔记</div>
              <div class="step-desc">文字、图片等元素都放在同一块画布上，自由连线</div>
            </div>
          </div>
          <div class="onboarding-step">
            <div class="step-num">2</div>
            <div class="step-body">
              <div class="step-title">放心删除</div>
              <div class="step-desc">删除的笔记进入回收站，保留 30 天可随时恢复</div>
            </div>
          </div>
        </div>
        <div class="onboarding-actions">
          <button class="btn btn-primary" @click="onboardingCreateNote">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            新建第一篇笔记
          </button>
          <button class="btn btn-ghost" @click="dismissOnboarding">稍后再说</button>
        </div>
      </section>

      <!-- 概览卡片 -->
      <section class="overview-cards">
        <div class="stat-card stat-notes">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ animNotes }}</div>
            <div class="stat-label">笔记总数</div>
            <div class="stat-sub">已删除 {{ trashCount }}</div>
          </div>
        </div>

        <div class="stat-card stat-folders">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ animFolders }}</div>
            <div class="stat-label">文件夹</div>
            <div class="stat-sub">分类整理笔记</div>
          </div>
        </div>

        <div class="stat-card stat-blocks">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ animBlocks }}</div>
            <div class="stat-label">画布元素</div>
            <div class="stat-sub">笔记中的文字与图片块</div>
          </div>
        </div>

        <div class="stat-card stat-tags">
          <div class="stat-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          </div>
          <div class="stat-body">
            <div class="stat-value">{{ animTags }}</div>
            <div class="stat-label">标签</div>
            <div class="stat-sub">为笔记打标签方便检索</div>
          </div>
        </div>
      </section>

      <div class="dash-grid">
        <!-- 最近编辑 -->
        <section class="dash-panel panel-wide">
          <div class="panel-title">最近编辑</div>
          <div v-if="recentNotes.length > 0" class="recent-list">
            <div v-for="(n, i) in recentNotes" :key="n.id" class="recent-item clickable" @click="openNote(n.id)">
              <span class="recent-order">{{ i + 1 }}</span>
              <div class="recent-main">
                <div class="recent-title">{{ n.title || '未命名笔记' }}</div>
                <div class="recent-meta">
                  <span class="recent-folder">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    {{ noteStore.getFolderPathString(n.folderId) || '根目录' }}
                  </span>
                  <span class="recent-time">{{ formatDate(n.updatedAt, 'YYYY年MM月DD日 HH:mm') }}</span>
                </div>
              </div>
              <svg class="recent-go" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </div>
          </div>
          <div v-else class="empty-hint">还没有笔记，点击「新建笔记」开始吧</div>
        </section>

        <!-- 标签概览 -->
        <section class="dash-panel">
          <div class="panel-title">标签概览</div>
          <div v-if="tagStats.length > 0" class="tag-stats-list">
            <div v-for="t in tagStats" :key="t.id" class="tag-stat-row clickable" @click="router.push('/tags')">
              <span class="tag-stat-dot" :style="{ background: t.color || '#9ca3af' }"></span>
              <span class="tag-stat-name">{{ t.name }}</span>
              <span class="tag-stat-count">{{ t.count }} 篇</span>
            </div>
          </div>
          <div v-else class="empty-hint">给笔记打标签后，可在此查看统计</div>
        </section>

        <!-- 文件夹分布 -->
        <section class="dash-panel">
          <div class="panel-title">文件夹分布</div>
          <div v-if="folderStats.length > 0" class="folder-stats-list">
            <div v-for="f in folderStats" :key="f.id" class="folder-stat-row clickable" @click="openFolder(f.id)">
              <svg class="folder-stat-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              <span class="folder-stat-name">{{ f.name }}</span>
              <span class="folder-stat-count">{{ f.count }} 篇</span>
            </div>
          </div>
          <div v-else class="empty-hint">创建文件夹归类笔记</div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { useTagStore } from '@/stores/tag'
import { formatDate } from '@/utils'
import BgDecor from '@/components/BgDecor.vue'

const router = useRouter()
const noteStore = useNoteStore()
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

const allNotes = computed(() => {
  refreshKey.value
  return noteStore.allSortedNotes
})

// ============ 首次使用引导 ============
const ONBOARDED_KEY = 'rg-onboarded'
const showOnboarding = ref(false)

onMounted(async () => {
  try { await noteStore.init() } catch {}
  showOnboarding.value = !localStorage.getItem(ONBOARDED_KEY) && allNotes.value.length === 0
})

function dismissOnboarding() {
  showOnboarding.value = false
  localStorage.setItem(ONBOARDED_KEY, '1')
}

function onboardingCreateNote() {
  dismissOnboarding()
  const note = noteStore.createNote('我的第一篇笔记')
  router.push(`/note/${note.id}`)
}

// ============ 笔记总览统计 ============
const totalNotes = computed(() => allNotes.value.length)
const trashCount = computed(() => noteStore.deletedNotes.length)
const folderCount = computed(() => noteStore.folders.filter(f => !f.deleted && !f.isSystem).length)
const totalBlocks = computed(() => {
  return allNotes.value.reduce((sum, n) => sum + (n.blocks ? n.blocks.length : 0), 0)
})
const tagCount = computed(() => tagStore.tags.length)

const animNotes = useCountUp(totalNotes)
const animFolders = useCountUp(folderCount)
const animBlocks = useCountUp(totalBlocks)
const animTags = useCountUp(tagCount)

// 最近编辑：按更新时间倒序取前 6
const recentNotes = computed(() => {
  refreshKey.value
  return [...allNotes.value]
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 6)
})

// 标签概览：统计每个标签关联的笔记数（含回收站外）
const tagStats = computed(() => {
  refreshKey.value
  const activeNotes = noteStore.notes.filter(n => !n.deleted)
  return tagStore.tags
    .map(t => ({ ...t, count: activeNotes.filter(n => Array.isArray(n.tags) && n.tags.includes(t.id)).length }))
    .filter(t => t.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

// 文件夹分布：按笔记数排序取前 8
const folderStats = computed(() => {
  refreshKey.value
  return noteStore.folders
    .filter(f => !f.deleted && !f.isSystem)
    .map(f => ({ id: f.id, name: f.name, count: noteStore.getFolderNoteCount(f.id) }))
    .filter(f => f.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)
})

function openNote(id) {
  router.push(`/note/${id}`)
}

function openFolder(id) {
  noteStore.setCurrentFolder(id)
  router.push('/notes')
}
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
.btn-primary {
  background: var(--primary-color); color: #fff;
  border-radius: var(--radius-md);
}
.btn-primary:hover { filter: brightness(1.05); transform: translateY(-1px); }

.dash-content {
  flex: 1; overflow-y: auto; padding: 24px 28px 32px;
  position: relative;
  background-image:
    radial-gradient(circle at 12% 8%, rgba(74, 138, 100, 0.05), transparent 38%),
    radial-gradient(circle at 88% 4%, rgba(74, 144, 217, 0.045), transparent 36%),
    radial-gradient(circle at 70% 92%, rgba(155, 123, 214, 0.04), transparent 40%);
}

/* 首次使用引导 */
.onboarding-card {
  position: relative;
  padding: 28px 32px;
  margin-bottom: 24px;
  border-radius: var(--radius-lg);
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  animation: dashIn 0.55s cubic-bezier(0.22, 1, 0.36, 1);
}
.onboarding-close {
  position: absolute;
  top: 14px; right: 14px;
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: none; border-radius: 8px;
  background: transparent; color: var(--text-tertiary);
  cursor: pointer; transition: all 0.2s ease;
}
.onboarding-close:hover { background: var(--border-light); color: var(--text-primary); }
.onboarding-head h2 {
  font-size: 20px; font-weight: 800; color: var(--text-primary);
  letter-spacing: -0.02em; margin-bottom: 6px;
}
.onboarding-head p {
  font-size: 13px; color: var(--text-secondary); margin: 0;
}
.onboarding-steps {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 14px;
  margin: 20px 0 22px;
}
.onboarding-step {
  display: flex; gap: 12px; align-items: flex-start;
  padding: 14px 16px;
  border-radius: var(--radius-md, 10px);
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
}
.step-num {
  flex-shrink: 0;
  width: 26px; height: 26px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 50%;
  background: var(--accent-color, #d4956a);
  color: #fff; font-size: 13px; font-weight: 700;
}
.step-title { font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; }
.step-desc { font-size: 12px; color: var(--text-tertiary); line-height: 1.6; }
.onboarding-actions { display: flex; gap: 10px; }

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
.stat-notes { color: #4a8a64; }
.stat-folders { color: #4a90d9; }
.stat-blocks { color: #9b7bd6; }
.stat-tags { color: #d4956a; }
.stat-notes::before { background: radial-gradient(circle, rgba(74,138,100,0.4), transparent 70%); }
.stat-folders::before { background: radial-gradient(circle, rgba(74,144,217,0.4), transparent 70%); }
.stat-blocks::before { background: radial-gradient(circle, rgba(155,123,214,0.4), transparent 70%); }
.stat-tags::before { background: radial-gradient(circle, rgba(212,149,106,0.4), transparent 70%); }
.stat-icon {
  width: 46px; height: 46px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0; position: relative; z-index: 1;
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.stat-notes .stat-icon { background: rgba(74,138,100,0.13); color: #4a8a64; }
.stat-folders .stat-icon { background: rgba(74,144,217,0.13); color: #4a90d9; }
.stat-blocks .stat-icon { background: rgba(155,123,214,0.13); color: #9b7bd6; }
.stat-tags .stat-icon { background: rgba(212,149,106,0.13); color: #d4956a; }
.stat-card:hover .stat-icon { transform: scale(1.08) rotate(-4deg); }
.stat-body { flex: 1; min-width: 0; position: relative; z-index: 1; }
.stat-value {
  font-size: 28px; font-weight: 800; color: var(--text-primary);
  line-height: 1.1; letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.stat-label { font-size: 13px; font-weight: 600; color: var(--text-secondary); margin-top: 3px; }
.stat-sub { font-size: 11px; color: var(--text-tertiary); margin-top: 5px; }

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

/* 最近编辑 */
.recent-list { display: flex; flex-direction: column; }
.recent-item {
  display: flex; align-items: center; gap: 14px;
  padding: 10px 12px; border-radius: var(--radius-md);
  cursor: pointer; transition: all var(--transition-fast);
}
.recent-item:hover { background: var(--bg-hover); }
.recent-order {
  width: 24px; height: 24px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px;
  background: var(--primary-soft); color: var(--primary-dark);
  font-size: 12px; font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.recent-main { flex: 1; min-width: 0; }
.recent-title {
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.recent-meta { display: flex; align-items: center; gap: 12px; margin-top: 3px; flex-wrap: wrap; }
.recent-folder {
  display: inline-flex; align-items: center; gap: 3px;
  font-size: 11px; color: var(--text-tertiary);
}
.recent-folder svg { flex-shrink: 0; }
.recent-time { font-size: 11px; color: var(--text-secondary); font-variant-numeric: tabular-nums; }
.recent-go { color: var(--text-tertiary); flex-shrink: 0; transition: all var(--transition-fast); }
.recent-item:hover .recent-go { color: var(--primary-color); transform: translateX(2px); }

/* 标签概览 */
.tag-stats-list, .folder-stats-list { display: flex; flex-direction: column; gap: 4px; }
.tag-stat-row, .folder-stat-row {
  display: flex; align-items: center; gap: 10px;
  padding: 9px 10px; border-radius: var(--radius-sm);
  cursor: pointer; transition: all var(--transition-fast);
}
.tag-stat-row:hover, .folder-stat-row:hover { background: var(--bg-hover); transform: translateX(3px); }
.tag-stat-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
.tag-stat-name, .folder-stat-name {
  flex: 1; min-width: 0;
  font-size: 13px; font-weight: 600; color: var(--text-primary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.tag-stat-count, .folder-stat-count {
  font-size: 12px; font-weight: 700; color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}
.folder-stat-icon { color: var(--primary-color); flex-shrink: 0; }

.empty-hint {
  padding: 32px 12px; text-align: center;
  font-size: 12px; color: var(--text-tertiary);
}

.clickable { cursor: pointer; transition: all var(--transition-fast); }

@media (max-width: 760px) {
  .dash-grid { grid-template-columns: 1fr; }
}

@keyframes dashIn {
  from { opacity: 0; transform: translateY(16px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

/* 无障碍：尊重「减少动态」偏好 */
@media (prefers-reduced-motion: reduce) {
  .stat-card, .dash-panel { animation: none; opacity: 1; }
}
</style>
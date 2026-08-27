<template>
  <div class="trash-view">
    <header class="view-header">
      <div class="header-left">
        <h1>回收站</h1>
        <span class="trash-total">{{ deletedNotes.length }} 篇笔记</span>
      </div>
      <div class="header-right">
        <button
          v-if="deletedNotes.length"
          class="btn btn-danger"
          @click="confirmingEmpty = true"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          清空回收站
        </button>
      </div>
    </header>

    <div class="trash-content">
      <BgDecor />
      <div class="trash-content-inner">
      <div v-if="deletedNotes.length" class="trash-tip">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="16" x2="12" y2="12"/>
          <line x1="12" y1="8" x2="12.01" y2="8"/>
        </svg>
        已删除的笔记将保留 30 天，到期自动清除；期间可随时恢复
      </div>

      <div v-if="!deletedNotes.length" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
        <p>回收站是空的</p>
        <span>删除的笔记会在这里保留 30 天，随时可恢复</span>
      </div>

      <div v-else class="trash-list">
        <div v-for="note in deletedNotes" :key="note.id" class="trash-item">
          <div class="trash-item-icon">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="trash-item-body">
            <div class="trash-item-title">{{ note.title || '无标题笔记' }}</div>
            <div class="trash-item-meta">
              <span class="meta-folder">{{ folderNameOf(note) }}</span>
              <span class="meta-dot">·</span>
              <span>删除于 {{ formatRelativeTime(note.updatedAt) }}</span>
              <span class="meta-dot">·</span>
              <span :class="{ 'meta-expiring': remainDays(note) <= 3 }">
                {{ remainDays(note) > 0 ? `剩余 ${remainDays(note)} 天` : '即将清除' }}
              </span>
            </div>
          </div>
          <div class="trash-item-actions">
            <button class="btn btn-secondary btn-restore" @click="onRestore(note)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
              恢复
            </button>
            <button class="icon-btn danger" title="彻底删除" @click="noteToDelete = note">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="noteToDelete" class="modal-overlay" @click.self="noteToDelete = null">
        <div class="modal-content confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3>彻底删除</h3>
              <p>确定彻底删除「{{ noteToDelete.title || '无标题笔记' }}」吗？删除后无法找回。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button type="button" class="btn btn-secondary" @click="noteToDelete = null">取消</button>
            <button type="button" class="btn btn-danger" @click="onDeleteForever">彻底删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="confirmingEmpty" class="modal-overlay" @click.self="confirmingEmpty = false">
        <div class="modal-content confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3>清空回收站</h3>
              <p>确定清空回收站中的 {{ deletedNotes.length }} 篇笔记吗？清空后无法找回。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button type="button" class="btn btn-secondary" @click="confirmingEmpty = false">取消</button>
            <button type="button" class="btn btn-danger" @click="onEmptyTrash">清空</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useNoteStore } from '@/stores/note'
import { useToast } from '@/composables/useToast'
import { formatRelativeTime } from '@/utils'
import BgDecor from '@/components/BgDecor.vue'

const noteStore = useNoteStore()
const { success: toastSuccess } = useToast()

const deletedNotes = computed(() => noteStore.deletedNotes)
const noteToDelete = ref(null)
const confirmingEmpty = ref(false)

const RETENTION_DAYS = 30
const DAY_MS = 24 * 60 * 60 * 1000

function folderNameOf(note) {
  if (!note.folderId) return '未归类'
  const folder = noteStore.folders.find(f => f.id === note.folderId)
  return folder ? folder.name : '未归类'
}

function remainDays(note) {
  const elapsed = Date.now() - (note.updatedAt || 0)
  return Math.max(0, RETENTION_DAYS - Math.floor(elapsed / DAY_MS))
}

function onRestore(note) {
  const title = note.title || '无标题笔记'
  noteStore.restoreNote(note.id)
  toastSuccess(`已恢复「${title}」`)
}

function onDeleteForever() {
  if (!noteToDelete.value) return
  noteStore.deleteNoteForever(noteToDelete.value.id)
  noteToDelete.value = null
}

function onEmptyTrash() {
  noteStore.emptyTrash()
  confirmingEmpty.value = false
}
</script>

<style scoped>
.trash-view {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 16px;
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.trash-total {
  font-size: 13px;
  color: var(--text-tertiary);
}

.trash-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 32px;
  position: relative;
}

.trash-content-inner {
  position: relative;
  z-index: 1;
}

.trash-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-tertiary);
  padding: 10px 14px;
  margin-bottom: 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state svg {
  color: var(--border-color);
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.empty-state span {
  font-size: 13px;
}

.trash-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trash-item {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.trash-item:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-color);
}

.trash-item-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--bg-tertiary, var(--bg-secondary));
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.trash-item-body {
  flex: 1;
  min-width: 0;
}

.trash-item-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.trash-item-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--text-tertiary);
  margin-top: 4px;
}

.meta-folder {
  max-width: 140px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta-dot {
  opacity: 0.6;
}

.meta-expiring {
  color: var(--warning, #e6a700);
}

.trash-item-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.btn-restore {
  padding: 6px 12px;
  font-size: 13px;
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: var(--radius-md, 6px);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--danger-bg, rgba(220, 38, 38, 0.1));
  color: var(--danger, #dc2626);
}

@media (max-width: 720px) {
  .view-header,
  .trash-content {
    padding-left: 16px;
    padding-right: 16px;
  }

  .meta-folder {
    display: none;
  }
}
</style>

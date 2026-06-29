<template>
  <div class="notes-view">
    <header class="view-header">
      <div class="header-left">
        <h1>{{ currentFolderName }}</h1>
        <span class="note-count">{{ filteredNotes.length }} 篇笔记</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索笔记..."
            class="search-input"
          />
        </div>
        <button v-if="noteStore.currentFolderId" class="btn btn-primary" @click="createNote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建笔记
        </button>
      </div>
    </header>
    
    <div class="notes-content">
      <div v-if="!noteStore.currentFolderId" class="empty-state">
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M20 30h30l10 12h40v48H20z"/>
          <path d="M20 42h80"/>
        </svg>
        <p>请选择一个文件夹开始查看笔记</p>
      </div>
      
      <div v-else-if="filteredNotes.length === 0" class="empty-state">
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="32" y="20" width="56" height="80" rx="4"/>
          <path d="M44 40h32M44 56h32M44 72h20"/>
        </svg>
        <p>{{ searchKeyword ? '没有找到匹配的笔记' : '这个文件夹还没有笔记' }}</p>
        <button v-if="!searchKeyword" class="btn btn-primary" @click="createNote">创建第一篇笔记</button>
      </div>
      
      <div v-else class="notes-grid">
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card card"
          @click="openNote(note.id)"
        >
          <div class="note-card-header">
            <div class="note-color-tag" :style="{ backgroundColor: note.color || '#6bbd8f' }"></div>
            <div class="note-actions">
              <button class="action-btn" @click.stop="duplicateNote(note)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="action-btn delete" @click.stop="deleteNote(note.id)">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="note-card-body">
            <h3 class="note-card-title">{{ note.title || '无标题笔记' }}</h3>
            <div v-if="note.folderId" class="note-folder-path">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{{ getFolderPath(note.folderId) }}</span>
            </div>
            <p class="note-card-preview">{{ getNotePreview(note) }}</p>
            <div class="note-card-meta">
              <span>{{ formatDate(note.updatedAt) }}</span>
              <span class="block-count">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                {{ note.blocks?.length || 0 }} 个块
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="cancelCreateNote">
        <div class="modal-content create-note-modal">
          <h3>新建笔记</h3>
          <input
            ref="noteTitleInputRef"
            v-model="newNoteTitle"
            type="text"
            class="input"
            placeholder="请输入笔记名称"
            maxlength="100"
            @keyup.enter="confirmCreateNote"
            @keyup.esc="cancelCreateNote"
          />
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="cancelCreateNote">取消</button>
            <button class="btn btn-primary" :disabled="!newNoteTitle.trim()" @click="confirmCreateNote">创建</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { formatDate as formatDateUtil } from '@/utils'

const router = useRouter()
const noteStore = useNoteStore()
const searchKeyword = ref('')
const showCreateModal = ref(false)
const newNoteTitle = ref('')
const noteTitleInputRef = ref(null)

const currentFolderName = computed(() => {
  if (!noteStore.currentFolderId) return '笔记'
  return noteStore.folders.find(f => f.id === noteStore.currentFolderId)?.name || '笔记'
})

const filteredNotes = computed(() => {
  let notes = noteStore.currentFolderNotes || []
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    notes = notes.filter(note =>
      (note.title || '').toLowerCase().includes(keyword) ||
      getNotePreview(note).toLowerCase().includes(keyword)
    )
  }
  return notes.sort((a, b) => b.updatedAt - a.updatedAt)
})

function createNote() {
  newNoteTitle.value = ''
  showCreateModal.value = true
  nextTick(() => noteTitleInputRef.value?.focus())
}

function confirmCreateNote() {
  const title = newNoteTitle.value.trim()
  if (!title) return
  const note = noteStore.createNote(title)
  showCreateModal.value = false
  newNoteTitle.value = ''
  router.push(`/note/${note.id}`)
}

function cancelCreateNote() {
  showCreateModal.value = false
  newNoteTitle.value = ''
}

function openNote(id) {
  router.push(`/note/${id}`)
}

function duplicateNote(note) {
  const newNote = noteStore.duplicateNote(note.id)
  if (newNote) router.push(`/note/${newNote.id}`)
}

function deleteNote(id) {
  noteStore.deleteNote(id)
}

function getNotePreview(note) {
  if (!note.blocks?.length) return '空白笔记'
  const firstTextBlock = note.blocks.find(block => block.type === 'text' && block.content)
  if (!firstTextBlock) return `${note.blocks.length} 个内容块`
  const div = document.createElement('div')
  div.innerHTML = firstTextBlock.content
  return div.textContent?.slice(0, 80) || '空白笔记'
}

function getFolderPath(folderId) {
  return noteStore.getFolderPathString(folderId)
}

function formatDate(timestamp) {
  return formatDateUtil(timestamp, 'MM月DD日')
}
</script>

<style scoped>
.notes-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px calc(28px + var(--window-controls-width)) 20px 28px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
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

.note-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--purple-dark);
  background: var(--purple-softer);
  padding: 3px 10px;
  border-radius: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  width: 280px;
  transition: all var(--transition-fast);
}

.search-box:focus-within {
  background: var(--bg-secondary);
  box-shadow: 0 0 0 1.5px var(--primary-color);
}

.search-box:focus-within svg {
  color: var(--primary-color);
}

.search-box svg {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
}

.notes-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 18px;
}

.note-card {
  cursor: pointer;
  overflow: hidden;
  transition: all var(--transition-fast);
}

.note-card:hover {
  border-color: var(--primary-light);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.note-card:hover .note-card-title {
  color: var(--primary-dark);
}

.note-card-title {
  transition: color var(--transition-fast);
}

.note-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 18px 8px;
}

.note-color-tag {
  width: 38px;
  height: 5px;
  border-radius: 999px;
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.08);
}

.note-actions {
  display: flex;
  gap: 6px;
  opacity: 0;
  transform: translateY(4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.note-card:hover .note-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 999px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: rgba(255, 255, 255, 0.9);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  background: var(--warning-soft);
  color: var(--warning-color);
}

.note-card-body {
  padding: 6px 18px 18px;
}

.note-card-title {
  font-size: 16px;
  font-weight: 650;
  color: var(--text-primary);
  margin-bottom: 10px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-folder-path {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--primary-dark);
  margin-bottom: 10px;
  padding: 5px 9px;
  background: rgba(107, 189, 143, 0.12);
  border-radius: 999px;
  width: fit-content;
}

.note-folder-path span {
  max-width: 200px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-card-preview {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.65;
  min-height: 46px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 16px;
}

.note-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary);
  padding-top: 12px;
  border-top: 1px solid rgba(140, 151, 144, 0.12);
}

.block-count {
  display: flex;
  align-items: center;
  gap: 6px;
}

.block-count svg {
  color: var(--info-color);
}

.action-btn:not(.delete):hover {
  background: var(--info-soft);
  color: var(--info-dark);
}

.create-note-modal {
  width: 380px;
  max-width: 90vw;
  padding: 24px;
}

.create-note-modal h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.create-note-modal .input {
  margin-bottom: 20px;
  font-size: 15px;
}

.create-note-modal .modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px 20px;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .notes-content {
    padding: 20px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>

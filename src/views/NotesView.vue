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
      <div v-if="filteredNotes.length" class="notes-grid">
        <div
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card card"
          @click="openNote(note.id)"
        >
          <div class="note-card-header">
            <div class="note-color-tag" :style="{ background: getNoteColor(note) }"></div>
            <div class="note-actions" @click.stop>
              <button class="action-btn" @click.stop="duplicateNote(note.id)" title="复制">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="action-btn delete" @click.stop="confirmDelete(note.id)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="note-card-body">
            <h3 class="note-card-title">{{ note.title || '无标题笔记' }}</h3>
            <div v-if="getFolderPath(note.folderId)" class="note-folder-path">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span>{{ getFolderPath(note.folderId) }}</span>
            </div>
            <div class="note-card-preview">
              {{ getPreview(note) }}
            </div>
            <div class="note-card-meta">
              <span class="block-count">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                {{ note.blocks?.length || 0 }} 个块
              </span>
              <span class="update-time">{{ formatTime(note.updatedAt) }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div v-else class="empty-state">
        <svg viewBox="0 0 200 200" fill="none">
          <rect x="50" y="30" width="100" height="140" rx="10" fill="#eef0f7"/>
          <rect x="60" y="50" width="80" height="8" rx="4" fill="#d1d5db"/>
          <rect x="60" y="68" width="60" height="6" rx="3" fill="#e5e7eb"/>
          <rect x="60" y="82" width="70" height="6" rx="3" fill="#e5e7eb"/>
          <rect x="60" y="96" width="50" height="6" rx="3" fill="#e5e7eb"/>
          <circle cx="100" cy="140" r="15" fill="#4a9568" opacity="0.3"/>
          <path d="M100 133v14M93 140h14" stroke="#4a9568" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p v-if="searchKeyword">没有找到匹配的笔记</p>
        <p v-else-if="!noteStore.currentFolderId">请先在左侧选择一个文件夹</p>
        <p v-else>该文件夹下还没有笔记</p>
        <button v-if="!searchKeyword && noteStore.currentFolderId" class="btn btn-primary" @click="createNote">
          创建笔记
        </button>
      </div>
    </div>
    
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content" style="padding: 24px; width: 360px;">
        <h3 style="margin-bottom: 12px; font-size: 18px;">确认删除</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">确定要删除这篇笔记吗？此操作无法撤销。</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-secondary" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-primary" style="background: var(--warning-color);" @click="doDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { formatRelativeTime } from '@/utils'

const router = useRouter()
const noteStore = useNoteStore()

const searchKeyword = ref('')
const showDeleteModal = ref(false)
const deleteTargetId = ref(null)

const currentFolderName = computed(() => {
  if (!noteStore.currentFolderId) return '笔记'
  const folder = noteStore.sortedFolders.find(f => f.id === noteStore.currentFolderId)
  return folder?.name || '笔记'
})

const filteredNotes = computed(() => {
  if (searchKeyword.value) {
    return noteStore.searchNotes(searchKeyword.value).filter(n => {
      if (!noteStore.currentFolderId) return true
      return n.folderId === noteStore.currentFolderId
    })
  }
  return noteStore.sortedNotes
})

onMounted(() => {
  noteStore.init()
})

function getNoteColor(note) {
  const colors = ['#4a9568', '#7fa8c4', '#c9a96e', '#b88a7a', '#8fa89a', '#a89a7a']
  const hash = note.id?.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) || 0
  return colors[hash % colors.length]
}

function getPreview(note) {
  if (!note.blocks?.length) return '暂无内容'
  const firstBlock = note.blocks.find(b => b.content)
  if (!firstBlock) return '空白画布'
  const text = firstBlock.content.replace(/<[^>]*>/g, '')
  return text.length > 50 ? text.slice(0, 50) + '...' : text
}

function formatTime(timestamp) {
  return formatRelativeTime(timestamp)
}

function getFolderPath(folderId) {
  if (!folderId) return null
  return noteStore.getFolderPathString(folderId) || null
}

function createNote() {
  const note = noteStore.createNote()
  router.push(`/note/${note.id}`)
}

function openNote(id) {
  router.push(`/note/${id}`)
}

function duplicateNote(id) {
  noteStore.duplicateNote(id)
}

function confirmDelete(id) {
  deleteTargetId.value = id
  showDeleteModal.value = true
}

function doDelete() {
  if (deleteTargetId.value) {
    noteStore.deleteNote(deleteTargetId.value)
  }
  showDeleteModal.value = false
  deleteTargetId.value = null
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
  padding: 20px 28px;
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
  font-size: 13px;
  color: var(--text-tertiary);
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

.search-input::placeholder {
  color: var(--text-tertiary);
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
}

.note-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px 8px;
}

.note-color-tag {
  width: 32px;
  height: 4px;
  border-radius: 2px;
}

.note-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.note-card:hover .note-actions {
  opacity: 1;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  background: rgba(217, 118, 118, 0.1);
  color: var(--warning-color);
}

.note-card-body {
  padding: 4px 16px 16px;
}

.note-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-folder-path {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--primary-color);
  margin-bottom: 8px;
  padding: 2px 6px;
  background: var(--primary-soft);
  border-radius: 4px;
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
  line-height: 1.5;
  height: 40px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 12px;
}

.note-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary);
}

.block-count {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    padding: 16px;
  }
  
  .header-right {
    flex-direction: column;
  }
  
  .search-box {
    width: 100%;
  }
  
  .notes-content {
    padding: 16px;
  }
  
  .notes-grid {
    grid-template-columns: 1fr;
  }
}
</style>

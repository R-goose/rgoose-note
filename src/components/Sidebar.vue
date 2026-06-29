<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <svg width="30" height="30" viewBox="0 0 128 128" fill="none">
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#6bbd8f"/>
              <stop offset="100%" stop-color="#52a377"/>
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="116" height="116" rx="28" fill="url(#logoBg)"/>
          <path d="M 30 84 Q 30 71 47 69 Q 66 67 71 79 Q 73 91 55 92 Q 35 93 30 84 Z" fill="#ffffff"/>
          <path d="M 60 73 C 71 69, 81 59, 83 44" stroke="#ffffff" stroke-width="9" stroke-linecap="round" fill="none"/>
          <circle cx="84" cy="40" r="9" fill="#ffffff"/>
          <path d="M 90 37 L 104 42 L 90 47 Z" fill="#f5a623"/>
          <circle cx="85" cy="38" r="2" fill="#2d332f"/>
        </svg>
        <span v-if="!collapsed" class="logo-text">R-Goose Note</span>
      </div>
      <button class="collapse-btn" @click="$emit('toggle-collapse')">
        <svg v-if="collapsed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="13 17 18 12 13 7"/>
          <polyline points="6 17 11 12 6 7"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="11 17 6 12 11 7"/>
          <polyline points="18 17 13 12 18 7"/>
        </svg>
      </button>
    </div>
    
    <nav class="sidebar-nav">
      <router-link to="/notes" class="nav-item nav-notes" active-class="active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <span v-if="!collapsed">笔记</span>
      </router-link>
      <router-link to="/plans" class="nav-item nav-plans" active-class="active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span v-if="!collapsed">计划</span>
        <span v-if="!collapsed && todayPlanCount" class="badge">{{ todayPlanCount }}</span>
      </router-link>
      <router-link to="/settings" class="nav-item nav-settings" active-class="active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
        <span v-if="!collapsed">设置</span>
      </router-link>
    </nav>
    
    <div v-if="!collapsed" class="sidebar-section">
      <div class="section-header">
        <span>文件夹</span>
        <button class="btn-icon-small" @click="createNewFolder()" title="新建文件夹">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div class="folder-list">
        <template v-for="item in visibleFolders" :key="item.folder.id">
          <div
            class="folder-item"
            :class="{ active: noteStore.currentFolderId === item.folder.id }"
            :style="{ paddingLeft: (item.depth * 18 + 12) + 'px' }"
            @click="onFolderClick(item.folder)"
            @dblclick.stop="startRenameFolder(item.folder)"
            @contextmenu.prevent="showFolderContextMenu($event, item.folder)"
          >
            <span
              v-if="hasChildFolders(item.folder.id)"
              class="folder-toggle"
              :class="{ expanded: isFolderExpanded(item.folder.id) }"
              @click.stop="toggleFolderExpandById(item.folder.id)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
            <span v-else class="folder-spacer" aria-hidden="true"></span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div v-if="editingFolderId === item.folder.id" class="folder-input-wrapper">
              <input
                ref="folderInputRef"
                v-model="editingFolderName"
                class="folder-name-input"
                :class="{ error: folderNameError }"
                @blur="finishEditFolder"
                @input="onFolderNameInput"
                @keyup.enter="finishEditFolder"
                @keyup.esc="cancelEditFolder"
                @click.stop
              />
              <div v-if="folderNameError" class="folder-error-tip">文件夹名称已存在</div>
            </div>
            <span v-else class="folder-name">{{ item.folder.name }}</span>
            <span class="folder-count">{{ getFolderNoteCount(item.folder.id) }}</span>
          </div>
          <div
            v-if="isCreatingFolder && newFolderParentId === item.folder.id"
            class="folder-item creating"
            :style="{ paddingLeft: ((item.depth + 1) * 18 + 12) + 'px' }"
          >
            <span class="folder-spacer"></span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div class="folder-input-wrapper">
              <input
                ref="newFolderInputRef"
                v-model="newFolderName"
                class="folder-name-input"
                :class="{ error: folderNameError }"
                placeholder="新文件夹"
                @blur="finishCreateFolder"
                @input="onFolderNameInput"
                @keyup.enter="finishCreateFolder"
                @keyup.esc="cancelCreateFolder"
                @click.stop
              />
              <div v-if="folderNameError" class="folder-error-tip">文件夹名称已存在</div>
            </div>
          </div>
        </template>
        <div v-if="!visibleFolders.length && !isCreatingFolder" class="folder-empty">
          暂无文件夹，点击上方 + 新建
        </div>
        <div v-if="isCreatingFolder && !newFolderParentId" class="folder-item creating">
          <span class="folder-spacer" style="width: 16px; flex-shrink: 0; opacity: 0;"></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <div class="folder-input-wrapper">
            <input
              ref="newFolderInputRef"
              v-model="newFolderName"
              class="folder-name-input"
              :class="{ error: folderNameError }"
              placeholder="新文件夹"
              @blur="finishCreateFolder"
              @input="onFolderNameInput"
              @keyup.enter="finishCreateFolder"
              @keyup.esc="cancelCreateFolder"
              @click.stop
            />
            <div v-if="folderNameError" class="folder-error-tip">文件夹名称已存在</div>
          </div>
        </div>
      </div>
      
      <div
        v-if="folderContextMenu.show"
        class="folder-context-menu"
        :style="{ top: folderContextMenu.y + 'px', left: folderContextMenu.x + 'px' }"
        @click.stop
      >
        <div class="context-menu-item" @click="createFolderFromMenu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          新建文件夹
        </div>
        <div class="context-menu-item" @click="createNoteInFolder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          新建笔记
        </div>
        <div class="context-menu-item" @click="renameFromContextMenu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          重命名
        </div>
        <div class="context-menu-item danger" @click="deleteFromContextMenu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          删除
        </div>
      </div>
      
      <div class="section-header" style="margin-top: 12px;">
        <div class="section-title-wrapper">
          <span>最近笔记</span>
          <span v-if="currentFolderName" class="current-folder-tag">{{ currentFolderName }}</span>
        </div>
      </div>
      <div class="note-list">
        <div
          v-for="note in recentNotes"
          :key="note.id"
          class="note-item"
          :class="{ active: $route.params.id === note.id }"
          @click="openNote(note.id)"
        >
          <div class="note-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="note-info">
            <div class="note-title">{{ note.title || '无标题笔记' }}</div>
            <div class="note-time">
              <span>{{ formatTime(note.updatedAt) }}</span>
              <span v-if="getFolderPath(note.folderId)" class="note-folder">{{ getFolderPath(note.folderId) }}</span>
            </div>
          </div>
          <button
            type="button"
            class="note-delete-btn"
            title="删除笔记"
            @click.stop.prevent="askDeleteNote(note)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
        <div v-if="!recentNotes.length" class="empty-mini">暂无笔记</div>
      </div>
    </div>
    
    <div v-if="!collapsed" class="sidebar-footer">
      <div class="sync-status synced" @click="showSyncInfo">
        <div style="display:flex; align-items:center; gap:8px;">
          <div class="sync-dot synced"></div>
          <span>已同步</span>
        </div>
        <span>{{ syncStatusText }}</span>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCreateNoteModal" class="modal-overlay" @click.self="cancelCreateNote">
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
              <h3>删除笔记</h3>
              <p>确定删除「{{ noteToDelete.title || '无标题笔记' }}」吗？此操作不可恢复。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button type="button" class="btn btn-secondary" @click="noteToDelete = null">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmDeleteNote">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </aside>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { formatRelativeTime, formatDate } from '@/utils'

defineProps({
  collapsed: Boolean
})

defineEmits(['toggle-collapse'])

const router = useRouter()
const route = useRoute()
const noteStore = useNoteStore()
const planStore = usePlanStore()

const editingFolderId = ref(null)
const editingFolderName = ref('')
const folderInputRef = ref(null)
const newFolderInputRef = ref(null)
const folderNameError = ref(false)
const isCreatingFolder = ref(false)
const newFolderName = ref('')
const newFolderParentId = ref(null)
const folderContextMenu = ref({ show: false, x: 0, y: 0, folder: null })
const expandedFolderIds = ref(new Set())
const showCreateNoteModal = ref(false)
const newNoteTitle = ref('')
const noteTitleInputRef = ref(null)
const noteToDelete = ref(null)

const todayPlanCount = computed(() => planStore.todayPlans?.length || 0)
const currentFolderName = computed(() => {
  if (!noteStore.currentFolderId) return ''
  return noteStore.folders.find(f => f.id === noteStore.currentFolderId)?.name || ''
})

const visibleFolders = computed(() => {
  const result = []
  function walk(parentId, depth) {
    const children = noteStore.folders
      .filter(f => (f.parentId || null) === parentId)
      .sort((a, b) => a.createdAt - b.createdAt)
    for (const folder of children) {
      result.push({ folder, depth })
      if (expandedFolderIds.value.has(folder.id)) {
        walk(folder.id, depth + 1)
      }
    }
  }
  walk(null, 0)
  return result
})

const recentNotes = computed(() => {
  const list = [...noteStore.notes].filter(n => !n.deleted).sort((a, b) => b.updatedAt - a.updatedAt)
  return list.slice(0, 12)
})
const syncStatusText = computed(() => {
  const time = noteStore.lastSyncTime || planStore.lastSyncTime
  return time ? formatDate(time, 'MM-DD HH:mm') : '刚刚'
})

function selectFolder(id) {
  noteStore.setCurrentFolder(id)
  router.push('/notes')
}

function focusRef(refEl) {
  const val = refEl.value
  if (!val) return
  const el = Array.isArray(val) ? val[0] : val
  el?.focus?.()
  if (el && typeof el.select === 'function') el.select()
}
function openNote(id) {
  router.push(`/note/${id}`)
}

function askDeleteNote(note) {
  noteToDelete.value = note
}

function confirmDeleteNote() {
  const note = noteToDelete.value
  if (!note) return
  noteStore.deleteNote(note.id)
  if (route.params.id === note.id) {
    router.push('/notes')
  }
  noteToDelete.value = null
}

function getFolderNoteCount(folderId) {
  return noteStore.getFolderNoteCount?.(folderId) || 0
}

function formatTime(timestamp) {
  return formatRelativeTime(timestamp)
}

function getFolderPath(folderId) {
  return noteStore.getFolderPathString?.(folderId)
}

function isFolderExpanded(folderId) {
  return expandedFolderIds.value.has(folderId)
}

function hasChildFolders(folderId) {
  return noteStore.folders.some(f => f.parentId === folderId)
}

function onFolderClick(folder) {
  if (hasChildFolders(folder.id)) {
    toggleFolderExpandById(folder.id)
  }
  selectFolder(folder.id)
}

function toggleFolderExpandById(folderId) {
  const next = new Set(expandedFolderIds.value)
  if (next.has(folderId)) next.delete(folderId)
  else next.add(folderId)
  expandedFolderIds.value = next
}

function validateFolderName(name, excludeId = null, parentId = null) {
  const trimmed = name.trim()
  if (!trimmed) return false
  const duplicated = noteStore.folders.some(folder => (
    folder.id !== excludeId &&
    folder.parentId === parentId &&
    folder.name.trim() === trimmed
  ))
  folderNameError.value = duplicated
  return !duplicated
}

function onFolderNameInput(e) {
  const name = e.target.value
  const excludeId = editingFolderId.value
  const parentId = editingFolderId.value
    ? noteStore.folders.find(f => f.id === editingFolderId.value)?.parentId ?? null
    : newFolderParentId.value
  validateFolderName(name, excludeId, parentId)
}

function startRenameFolder(folder) {
  editingFolderId.value = folder.id
  editingFolderName.value = folder.name
  folderNameError.value = false
  nextTick(() => focusRef(folderInputRef))
}

function finishEditFolder() {
  if (!editingFolderId.value) return
  const folder = noteStore.folders.find(f => f.id === editingFolderId.value)
  if (!folder) return cancelEditFolder()
  if (!validateFolderName(editingFolderName.value, folder.id, folder.parentId)) return
  noteStore.renameFolder(folder.id, editingFolderName.value.trim())
  cancelEditFolder()
}

function cancelEditFolder() {
  editingFolderId.value = null
  editingFolderName.value = ''
  folderNameError.value = false
}

function createNewFolder(parentId = null) {
  if (parentId) {
    const next = new Set(expandedFolderIds.value)
    next.add(parentId)
    expandedFolderIds.value = next
  }
  isCreatingFolder.value = true
  newFolderParentId.value = parentId
  newFolderName.value = ''
  folderNameError.value = false
  nextTick(() => focusRef(newFolderInputRef))
}

function finishCreateFolder() {
  if (!isCreatingFolder.value) return
  if (!validateFolderName(newFolderName.value, null, newFolderParentId.value)) return
  if (!newFolderName.value.trim()) return cancelCreateFolder()
  noteStore.createFolder(newFolderName.value.trim(), newFolderParentId.value)
  if (newFolderParentId.value) {
    const next = new Set(expandedFolderIds.value)
    next.add(newFolderParentId.value)
    expandedFolderIds.value = next
  }
  cancelCreateFolder()
}

function cancelCreateFolder() {
  isCreatingFolder.value = false
  newFolderParentId.value = null
  newFolderName.value = ''
  folderNameError.value = false
}

function showFolderContextMenu(e, folder) {
  folderContextMenu.value = { show: true, x: e.clientX, y: e.clientY, folder }
}

function hideFolderContextMenu() {
  folderContextMenu.value = { show: false, x: 0, y: 0, folder: null }
}

function createFolderFromMenu() {
  createNewFolder(folderContextMenu.value.folder?.id || null)
  hideFolderContextMenu()
}

function createNoteInFolder() {
  const folder = folderContextMenu.value.folder
  if (folder) noteStore.setCurrentFolder(folder.id)
  hideFolderContextMenu()
  newNoteTitle.value = ''
  showCreateNoteModal.value = true
  nextTick(() => focusRef(noteTitleInputRef))
}

function confirmCreateNote() {
  const title = newNoteTitle.value.trim()
  if (!title) return
  const note = noteStore.createNote(title)
  showCreateNoteModal.value = false
  newNoteTitle.value = ''
  router.push(`/note/${note.id}`)
}

function cancelCreateNote() {
  showCreateNoteModal.value = false
  newNoteTitle.value = ''
}

function renameFromContextMenu() {
  const folder = folderContextMenu.value.folder
  hideFolderContextMenu()
  if (folder) startRenameFolder(folder)
}

function deleteFromContextMenu() {
  const folder = folderContextMenu.value.folder
  hideFolderContextMenu()
  if (folder) noteStore.deleteFolder(folder.id)
}

function showSyncInfo() {}

onMounted(() => {
  noteStore.init()
  planStore.init()
  document.addEventListener('click', hideFolderContextMenu)
})

onUnmounted(() => {
  document.removeEventListener('click', hideFolderContextMenu)
})
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width var(--transition-normal);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 16px 20px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.logo > svg {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-nav {
  padding: 12px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item svg {
  transition: color var(--transition-fast);
}

.nav-notes svg { color: var(--primary-color); }
.nav-plans svg { color: var(--secondary-dark); }
.nav-settings svg { color: var(--info-color); }

.nav-notes:hover svg { color: var(--primary-dark); }
.nav-plans:hover svg { color: var(--secondary-dark); }
.nav-settings:hover svg { color: var(--info-dark); }

.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.nav-notes.active { background: var(--primary-soft); color: var(--primary-dark); }
.nav-plans.active { background: var(--secondary-soft); color: var(--secondary-dark); }
.nav-settings.active { background: var(--info-soft); color: var(--info-dark); }

.nav-notes.active svg { color: var(--primary-color); }
.nav-plans.active svg { color: var(--secondary-color); }
.nav-settings.active svg { color: var(--info-color); }

.badge {
  margin-left: auto;
  background: var(--warning-color);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.sidebar-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-header > span {
  position: relative;
  padding-left: 10px;
}

.section-header > span::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background: var(--primary-light);
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-folder-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--info-soft);
  color: var(--info-dark);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

.folder-empty,
.empty-mini {
  padding: 16px 10px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.folder-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.folder-item.active {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.folder-toggle {
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
}

.folder-toggle.expanded {
  transform: rotate(90deg);
}

.folder-spacer {
  display: inline-block;
  width: 12px;
  flex-shrink: 0;
}

.folder-name {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-name-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.folder-name-input.error {
  border-color: var(--warning-color);
}

.folder-item.creating {
  background: var(--primary-soft);
  border: 1px dashed var(--primary-light);
}

.folder-input-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.folder-error-tip {
  font-size: 11px;
  color: var(--warning-color);
  line-height: 1;
}

.folder-count {
  font-size: 11px;
  color: var(--secondary-dark);
  background: var(--secondary-softer);
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.folder-item.active .folder-count {
  background: rgba(107, 189, 143, 0.18);
  color: var(--primary-dark);
}

.btn-icon-small {
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-icon-small:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.note-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 2px;
}

.note-item:hover {
  background: var(--bg-hover);
}

.note-item.active {
  background: var(--primary-soft);
  opacity: 0.7;
}

.note-delete-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  opacity: 0;
  transition: all var(--transition-fast);
}

.note-item:hover .note-delete-btn {
  opacity: 1;
}

.note-delete-btn:hover {
  background: var(--warning-soft);
  color: var(--warning-color);
}

.note-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
}

.note-info {
  flex: 1;
  min-width: 0;
}

.note-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-time {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.note-folder {
  display: inline-block;
  padding: 1px 6px;
  background: var(--primary-soft);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-light);
}

.sync-status {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: var(--text-tertiary);
  cursor: pointer;
}

.sync-status.synced {
  color: var(--primary-dark);
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
}

.sync-dot.synced {
  background: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(107, 189, 143, 0.18);
}

.folder-context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  padding: 4px;
  min-width: 120px;
  animation: menuFadeIn 0.15s ease;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.context-menu-item:hover {
  background: var(--bg-hover);
}

.context-menu-item.danger {
  color: var(--warning-color);
}

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar.collapsed .sidebar-header {
  padding: 16px 12px;
  justify-content: center;
}

.sidebar.collapsed .sidebar-nav {
  padding: 12px 8px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}

.sidebar.collapsed .badge {
  position: absolute;
  top: 4px;
  right: 2px;
  margin-left: 0;
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
</style>

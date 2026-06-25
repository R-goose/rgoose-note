<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <svg width="30" height="30" viewBox="0 0 128 128" fill="none">
          <defs>
            <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#4a9568"/>
              <stop offset="100%" stop-color="#3a7a55"/>
            </linearGradient>
          </defs>
          <rect x="6" y="6" width="116" height="116" rx="30" fill="url(#logoBg)"/>
          <g transform="translate(34, 38)">
            <path d="M8 10 Q8 4 14 4 L46 4 Q52 4 52 10 L52 52 Q52 58 46 58 L14 58 Q8 58 8 52 Z"
                  fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round" opacity="0.95"/>
            <line x1="16" y1="18" x2="44" y2="18" stroke="#4a9568" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
            <line x1="16" y1="26" x2="44" y2="26" stroke="#4a9568" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
            <line x1="16" y1="34" x2="38" y2="34" stroke="#4a9568" stroke-width="2" stroke-linecap="round" opacity="0.6"/>
          </g>
          <g transform="translate(58, 20)">
            <path d="M22 70 Q10 68 8 55 Q6 42 12 30 Q16 22 22 22 Q28 22 30 28 Q34 38 32 50 Q30 62 28 68 Q26 72 22 70 Z"
                  fill="#ffffff" stroke="#ffffff" stroke-width="1" stroke-linejoin="round" opacity="0.98"/>
            <ellipse cx="26" cy="16" rx="13" ry="12" fill="#ffffff" stroke="#ffffff" stroke-width="1"/>
            <path d="M38 14 L50 12 Q52 12 52 14 Q52 16 50 17 L40 20 Z"
                  fill="#f5a623" stroke="#e8941d" stroke-width="0.8" stroke-linejoin="round"/>
            <circle cx="30" cy="14" r="2.5" fill="#2d332f"/>
            <circle cx="30.8" cy="13.3" r="0.8" fill="#ffffff"/>
            <path d="M10 38 Q4 34 6 24 Q8 18 14 20 Q12 28 16 36 Q14 42 10 38 Z"
                  fill="#ffffff" stroke="#ffffff" stroke-width="0.5" opacity="0.9"/>
            <line x1="16" y1="66" x2="15" y2="76" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
            <line x1="28" y1="66" x2="29" y2="76" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round"/>
            <path d="M13 76 L10 82 M18 76 L21 82" stroke="#f5a623" stroke-width="2" stroke-linecap="round"/>
            <path d="M26 76 L23 82 M31 76 L34 82" stroke="#f5a623" stroke-width="2" stroke-linecap="round"/>
          </g>
        </svg>
        <span v-if="!collapsed" class="logo-text">R-Goose<span class="logo-sub">Note</span></span>
      </div>
      <button class="collapse-btn" @click="$emit('toggle-collapse')" :title="collapsed ? '展开侧边栏' : '收起侧边栏'">
        <svg v-if="collapsed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="13 17 18 12 13 7"/>
          <polyline points="6 17 11 12 6 7"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="11 17 6 12 11 7"/>
          <polyline points="18 17 13 12 18 7"/>
        </svg>
      </button>
    </div>
    
    <nav class="sidebar-nav">
      <router-link to="/notes" class="nav-item" active-class="active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
        </svg>
        <span v-if="!collapsed">笔记</span>
      </router-link>
      <router-link to="/plans" class="nav-item" active-class="active">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        <span v-if="!collapsed">计划</span>
        <span v-if="!collapsed && todayPlanCount" class="badge">{{ todayPlanCount }}</span>
      </router-link>
      <router-link to="/settings" class="nav-item" active-class="active">
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
            :style="{ paddingLeft: (item.depth * 18 + 10) + 'px' }"
            @click="selectFolder(item.folder.id)"
            @dblclick.stop="startRenameFolder(item.folder)"
            @contextmenu.prevent="showFolderContextMenu($event, item.folder)"
          >
            <span
              v-if="hasChildFolders(item.folder.id)"
              class="folder-toggle"
              :class="{ expanded: isFolderExpanded(item.folder.id) }"
              @click="toggleFolderExpand($event, item.folder.id)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
            <svg v-else class="folder-spacer" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
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
            :style="{ paddingLeft: ((item.depth + 1) * 18 + 10) + 'px' }"
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
      
      <div class="section-header" style="margin-top: 8px;">
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
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div class="note-info">
            <div class="note-title">{{ note.title || '无标题' }}</div>
            <div class="note-time">
              <span v-if="getNoteFolderName(note.folderId)" class="note-folder">
                {{ getNoteFolderName(note.folderId) }}
              </span>
              {{ formatTime(note.updatedAt) }}
            </div>
          </div>
        </div>
        <div v-if="!recentNotes.length" class="empty-mini">
          暂无笔记
        </div>
      </div>
    </div>
    
    <div class="sidebar-footer">
      <div v-if="!collapsed" class="sync-status" @click="showSyncInfo">
        <div class="sync-dot" :class="{ synced: true }"></div>
        <span>已同步</span>
      </div>
    </div>
    
    <div v-if="showDeleteFolderModal" class="modal-overlay" @click.self="cancelDeleteFolder">
      <div class="modal-content">
        <div class="modal-header">
          <h3>删除文件夹</h3>
          <button class="modal-close" @click="cancelDeleteFolder">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="modal-body">
          <p class="modal-text">确定要删除文件夹"<strong>{{ deleteFolderName }}</strong>"吗？</p>
          <div v-if="deleteFolderStats.childFolderCount > 0 || deleteFolderStats.noteCount > 0" class="modal-warning">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div class="warning-text">
              <p v-if="deleteFolderStats.childFolderCount > 0">包含 {{ deleteFolderStats.childFolderCount }} 个子文件夹</p>
              <p v-if="deleteFolderStats.noteCount > 0">包含 {{ deleteFolderStats.noteCount }} 篇笔记</p>
              <p class="warning-hint">删除后所有内容将无法恢复</p>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="cancelDeleteFolder">取消</button>
          <button class="btn btn-danger" @click="confirmDeleteFolder">确认删除</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, computed, nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { formatRelativeTime } from '@/utils'

const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['toggle-collapse'])

const router = useRouter()
const route = useRoute()
const noteStore = useNoteStore()
const planStore = usePlanStore()

const recentNotes = computed(() => noteStore.sortedNotes.slice(0, 10))
const todayPlanCount = computed(() => planStore.todayPlans.length)

const isCreatingFolder = ref(false)
const newFolderName = ref('')
const newFolderParentId = ref(null)
const newFolderInputRef = ref(null)
const ignoreNextOutsideClick = ref(false)

const editingFolderId = ref(null)
const editingFolderName = ref('')
const folderInputRef = ref(null)
const originalFolderName = ref('')

const folderNameError = ref(false)

const expandedFolders = ref({})

function hasChildFolders(folderId) {
  return noteStore.getChildFolderCount(folderId) > 0
}

function isFolderExpanded(folderId) {
  return !!expandedFolders.value[folderId]
}

function toggleFolderExpand(event, folderId) {
  event.stopPropagation()
  expandedFolders.value = {
    ...expandedFolders.value,
    [folderId]: !expandedFolders.value[folderId]
  }
}

const folderContextMenu = ref({
  show: false,
  x: 0,
  y: 0,
  folderId: null
})

const showDeleteFolderModal = ref(false)
const deleteFolderTarget = ref(null)

const deleteFolderName = computed(() => {
  if (!deleteFolderTarget.value) return ''
  const folder = noteStore.folders.find(f => f.id === deleteFolderTarget.value)
  return folder ? folder.name : ''
})

const deleteFolderStats = computed(() => {
  if (!deleteFolderTarget.value) return { childFolderCount: 0, noteCount: 0 }
  const folderId = deleteFolderTarget.value
  const childFolderIds = getAllChildFolderIds(folderId)
  const allFolderIds = [folderId, ...childFolderIds]
  const noteCount = noteStore.notes.filter(n => allFolderIds.includes(n.folderId)).length
  return {
    childFolderCount: childFolderIds.length,
    noteCount
  }
})

function getAllChildFolderIds(parentId) {
  const result = []
  const children = noteStore.getChildFolders(parentId)
  children.forEach(child => {
    result.push(child.id)
    result.push(...getAllChildFolderIds(child.id))
  })
  return result
}

const currentFolderName = computed(() => {
  if (!noteStore.currentFolderId) return ''
  const folder = noteStore.folders.find(f => f.id === noteStore.currentFolderId)
  return folder ? folder.name : ''
})

const visibleFolders = computed(() => {
  const result = []
  
  function traverse(parentId, depth) {
    const folders = parentId === null 
      ? noteStore.rootFolders 
      : noteStore.getChildFolders(parentId)
    
    folders.forEach(folder => {
      result.push({ folder, depth })
      if (expandedFolders.value[folder.id] && noteStore.getChildFolderCount(folder.id) > 0) {
        traverse(folder.id, depth + 1)
      }
    })
  }
  
  traverse(null, 0)
  return result
})

function formatTime(timestamp) {
  return formatRelativeTime(timestamp)
}

function createNewNote() {
  const note = noteStore.createNote()
  router.push(`/note/${note.id}`)
}

function openNote(id) {
  router.push(`/note/${id}`)
}

function showSyncInfo() {
}

function createNewFolder(parentId = null) {
  cancelEditFolder()
  closeContextMenu()
  isCreatingFolder.value = true
  newFolderName.value = ''
  newFolderParentId.value = parentId
  folderNameError.value = false
  if (parentId) {
    expandedFolders.value = {
      ...expandedFolders.value,
      [parentId]: true
    }
  }
  nextTick(() => {
    const inputs = document.querySelectorAll('.folder-item.creating .folder-name-input')
    if (inputs.length > 0) {
      inputs[inputs.length - 1].focus()
    }
  })
}

function finishCreateFolder() {
  const name = newFolderName.value.trim()
  if (!name) {
    cancelCreateFolder()
    return
  }
  if (noteStore.isFolderNameDuplicate(name, newFolderParentId.value)) {
    folderNameError.value = true
    newFolderInputRef.value?.focus()
    return
  }
  noteStore.createFolder(name, newFolderParentId.value)
  isCreatingFolder.value = false
  newFolderName.value = ''
  newFolderParentId.value = null
  folderNameError.value = false
}

function cancelCreateFolder() {
  isCreatingFolder.value = false
  newFolderName.value = ''
  newFolderParentId.value = null
  folderNameError.value = false
}

function selectFolder(folderId) {
  if (isCreatingFolder.value || editingFolderId.value) return
  noteStore.setCurrentFolder(folderId)
  if (noteStore.getChildFolderCount(folderId) > 0) {
    expandedFolders.value = {
      ...expandedFolders.value,
      [folderId]: true
    }
  }
  if (route.name !== 'notes') {
    router.push('/notes')
  }
  closeContextMenu()
}

function getFolderNoteCount(folderId) {
  return noteStore.notes.filter(n => n.folderId === folderId).length
}

function getNoteFolderName(folderId) {
  if (!folderId) return null
  return noteStore.getFolderPathString(folderId) || null
}

function startRenameFolder(folder) {
  closeAllEditors()
  editingFolderId.value = folder.id
  editingFolderName.value = folder.name
  originalFolderName.value = folder.name
  folderNameError.value = false
  nextTick(() => {
    folderInputRef.value?.focus()
    folderInputRef.value?.select()
  })
}

function finishEditFolder() {
  const name = editingFolderName.value.trim()
  if (!name) {
    cancelEditFolder()
    return
  }
  if (noteStore.isFolderNameDuplicate(name, editingFolderId.value)) {
    folderNameError.value = true
    folderInputRef.value?.focus()
    return
  }
  noteStore.renameFolder(editingFolderId.value, name)
  editingFolderId.value = null
  editingFolderName.value = ''
  originalFolderName.value = ''
  folderNameError.value = false
}

function cancelEditFolder() {
  editingFolderId.value = null
  editingFolderName.value = ''
  originalFolderName.value = ''
  folderNameError.value = false
}

function onFolderNameInput() {
  folderNameError.value = false
}

function closeAllEditors() {
  cancelCreateFolder()
  cancelEditFolder()
  closeContextMenu()
}

function showFolderContextMenu(e, folder) {
  closeAllEditors()
  folderContextMenu.value = {
    show: true,
    x: e.clientX,
    y: e.clientY,
    folderId: folder.id
  }
}

function closeContextMenu() {
  folderContextMenu.value.show = false
  folderContextMenu.value.folderId = null
}

function renameFromContextMenu() {
  const folder = noteStore.folders.find(f => f.id === folderContextMenu.value.folderId)
  if (folder) {
    startRenameFolder(folder)
  }
  closeContextMenu()
}

function createNoteInFolder() {
  const folderId = folderContextMenu.value.folderId
  const note = noteStore.createNote('新笔记', folderId)
  closeContextMenu()
  router.push(`/note/${note.id}`)
}

function createFolderFromMenu() {
  const parentId = folderContextMenu.value.folderId
  closeContextMenu()
  createNewFolder(parentId)
}

function deleteFromContextMenu() {
  const folderId = folderContextMenu.value.folderId
  const folder = noteStore.folders.find(f => f.id === folderId)
  if (!folder) {
    closeContextMenu()
    return
  }
  deleteFolderTarget.value = folderId
  showDeleteFolderModal.value = true
  closeContextMenu()
}

function cancelDeleteFolder() {
  showDeleteFolderModal.value = false
  deleteFolderTarget.value = null
}

function confirmDeleteFolder() {
  if (deleteFolderTarget.value) {
    noteStore.deleteFolder(deleteFolderTarget.value)
  }
  cancelDeleteFolder()
}

function handleClickOutside(e) {
  const target = e.target
  if (target.closest('.folder-list') || target.closest('.folder-context-menu') || target.closest('.section-header')) {
    return
  }
  if (isCreatingFolder.value || editingFolderId.value) {
    closeAllEditors()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleClickOutside)
})

watch(() => route.name, (newName, oldName) => {
  const isNoteRoute = (name) => name === 'Notes' || name === 'NoteEditor'
  const wasNoteRoute = isNoteRoute(oldName)
  const nowNoteRoute = isNoteRoute(newName)
  
  if (wasNoteRoute && !nowNoteRoute) {
    noteStore.saveCurrentFolder()
  } else if (!wasNoteRoute && nowNoteRoute) {
    noteStore.restoreLastFolder()
  }
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

.sidebar.collapsed .sidebar-header {
  padding: 16px 8px;
  justify-content: center;
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
  width: 30px;
  height: 30px;
  flex-shrink: 0;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.logo-sub {
  color: var(--primary-color);
  margin-left: 3px;
  font-weight: 600;
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

.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary-color);
}

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

.folder-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

.folder-empty {
  padding: 20px 10px;
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
  padding: 3px 8px;
  font-size: 13px;
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  box-shadow: 0 0 0 2px var(--primary-soft);
}

.folder-name-input.error {
  border-color: var(--warning-color);
  box-shadow: 0 0 0 2px rgba(217, 118, 118, 0.15);
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
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
}

.folder-item.active .folder-count {
  background: rgba(74, 149, 104, 0.15);
  color: var(--primary-color);
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

.empty-mini {
  text-align: center;
  padding: 20px;
  font-size: 12px;
  color: var(--text-tertiary);
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

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
}

.sync-dot.synced {
  background: var(--primary-color);
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

@keyframes menuFadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
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

.context-menu-item.danger:hover {
  background: rgba(217, 118, 118, 0.1);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar.collapsed .sidebar-header {
  padding: 16px 12px;
  justify-content: center;
}

.sidebar.collapsed .logo {
  justify-content: center;
}

.sidebar.collapsed .sidebar-nav {
  padding: 12px 8px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
  gap: 0;
}

.sidebar.collapsed .sidebar-footer {
  padding: 12px 8px;
  justify-content: center;
}

.collapse-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border-radius: var(--radius-md);
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.collapse-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.sidebar.collapsed .collapse-btn {
  width: 28px;
}

.folder-child {
  padding-left: 32px;
}

.folder-child .folder-toggle {
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
}

.folder-toggle {
  display: inline-flex;
  width: 16px;
  height: 16px;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
  flex-shrink: 0;
}

.folder-toggle.expanded {
  transform: rotate(90deg);
}

.folder-spacer {
  width: 16px;
  flex-shrink: 0;
  opacity: 0;
}

.sidebar.collapsed .folder-list {
  display: none;
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.current-folder-tag {
  font-size: 11px;
  font-weight: 500;
  color: var(--primary-color);
  background: var(--primary-soft);
  padding: 2px 8px;
  border-radius: 10px;
  text-transform: none;
  letter-spacing: normal;
  max-width: 100px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  width: 420px;
  max-width: 90vw;
  overflow: hidden;
  animation: modalIn 0.2s ease;
}

@keyframes modalIn {
  from {
    opacity: 0;
    transform: translateY(-8px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 0;
}

.modal-close {
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: 20px 24px;
}

.modal-text {
  font-size: 14px;
  color: var(--text-secondary);
  margin: 0 0 16px;
  line-height: 1.5;
}

.modal-text strong {
  color: var(--text-primary);
  font-weight: 600;
}

.modal-warning {
  display: flex;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(217, 118, 118, 0.08);
  border: 1px solid rgba(217, 118, 118, 0.2);
  border-radius: var(--radius-md);
}

.modal-warning > svg {
  color: var(--warning-color);
  flex-shrink: 0;
  margin-top: 1px;
}

.warning-text {
  flex: 1;
}

.warning-text p {
  font-size: 13px;
  color: var(--text-secondary);
  margin: 0 0 4px;
  line-height: 1.4;
}

.warning-text p:last-child {
  margin-bottom: 0;
}

.warning-hint {
  color: var(--warning-color) !important;
  font-weight: 500;
  margin-top: 6px !important;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border-light);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 18px;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  border: 1px solid transparent;
}

.btn-secondary {
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-color: var(--border-light);
}

.btn-secondary:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.btn-danger {
  background: var(--warning-color);
  color: white;
  border-color: var(--warning-color);
}

.btn-danger:hover {
  background: #c56868;
  border-color: #c56868;
}
</style>

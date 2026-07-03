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
      <div class="notes-bg-decor" aria-hidden="true">
        <svg class="bg-blob bg-blob-1" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="bgBlobG1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.75"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="180" fill="url(#bgBlobG1)"/>
        </svg>
        <svg class="bg-blob bg-blob-2" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="bgBlobG2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="150" cy="150" r="140" fill="url(#bgBlobG2)"/>
        </svg>
        <svg class="bg-rings" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="40" stroke="currentColor" stroke-width="1"/>
          <circle cx="100" cy="100" r="65" stroke="currentColor" stroke-width="1" opacity="0.6"/>
          <circle cx="100" cy="100" r="90" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        </svg>
        <div class="bg-grid-lines"></div>
        <div class="bg-dots"></div>
      </div>
      <div class="notes-content-inner">
      <div v-if="!noteStore.currentFolderId" class="all-folders-view">
        <div v-if="allFolders.length > 0" class="folder-grid-section">
          <h2 class="grid-section-title">全部文件夹</h2>
          <div class="folder-card-grid">
            <article
              v-for="folder in allFolders"
              :key="folder.id"
              class="folder-card"
              @click="enterFolder(folder.id)"
              @contextmenu.prevent="onFolderContextMenu($event, folder)"
            >
              <svg class="folder-card-wave" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,40 C40,20 80,55 120,35 C160,15 180,45 200,30 L200,60 L0,60 Z" fill="currentColor"/>
              </svg>
              <div class="folder-card-inner">
                <div class="folder-card-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div class="folder-card-content">
                  <h3 class="folder-card-name">{{ folder.name }}</h3>
                  <p class="folder-card-meta">
                    <span class="folder-card-count">{{ countNotesInFolder(folder.id) }}</span> 篇笔记
                  </p>
                </div>
                <span class="folder-card-dot"></span>
              </div>
            </article>
          </div>
        </div>
        <div v-if="filteredNotes.length > 0" class="all-notes-section">
          <h2 class="grid-section-title">全部笔记 <span class="section-count">{{ filteredNotes.length }}</span></h2>
          <div class="notes-grid">
            <article
              v-for="note in filteredNotes"
              :key="note.id"
              class="note-card"
              @click="openNote(note.id)"
              @contextmenu.prevent="onNoteContextMenu($event, note)"
            >
              <div class="note-card-media" :class="{ 'has-cover': getNoteCover(note) }">
                <img v-if="getNoteCover(note)" :src="getNoteCover(note)" alt="" loading="lazy" />
                <svg v-else class="note-card-media-deco" viewBox="0 0 100 60" preserveAspectRatio="none">
                  <path d="M0,35 C20,15 35,45 55,28 C75,12 90,38 100,25 L100,60 L0,60 Z" fill="currentColor" opacity="0.5"/>
                  <path d="M0,45 C25,30 45,50 70,38 C85,30 95,42 100,36 L100,60 L0,60 Z" fill="currentColor" opacity="0.3"/>
                </svg>
                <span class="note-card-blocks">{{ note.blocks?.length || 0 }}</span>
              </div>
              <div class="note-card-body">
                <h3 class="note-card-title">{{ note.title || '无标题笔记' }}</h3>
                <p class="note-card-preview">{{ getNotePreview(note) }}</p>
                <div class="note-card-foot">
                  <span v-if="note.folderId" class="note-card-folder">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    {{ getFolderPath(note.folderId) }}
                  </span>
                  <span class="note-card-date">{{ formatDate(note.updatedAt) }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
        <div v-if="allFolders.length === 0 && filteredNotes.length === 0" class="empty-state">
          <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 30h30l10 12h40v48H20z"/>
            <path d="M20 42h80"/>
          </svg>
          <p>还没有文件夹或笔记</p>
        </div>
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
        <article
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          @click="openNote(note.id)"
          @contextmenu.prevent="onNoteContextMenu($event, note)"
        >
          <div class="note-card-media" :class="{ 'has-cover': getNoteCover(note) }">
            <img v-if="getNoteCover(note)" :src="getNoteCover(note)" alt="" loading="lazy" />
            <svg v-else class="note-card-media-deco" viewBox="0 0 100 60" preserveAspectRatio="none">
              <path d="M0,35 C20,15 35,45 55,28 C75,12 90,38 100,25 L100,60 L0,60 Z" fill="currentColor" opacity="0.5"/>
              <path d="M0,45 C25,30 45,50 70,38 C85,30 95,42 100,36 L100,60 L0,60 Z" fill="currentColor" opacity="0.3"/>
            </svg>
            <span class="note-card-blocks">{{ note.blocks?.length || 0 }}</span>
            <div class="note-card-actions">
              <button class="note-action" @click.stop="duplicateNote(note)" title="复制">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="note-action note-del" @click.stop="deleteNote(note.id)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="note-card-body">
            <h3 class="note-card-title">{{ note.title || '无标题笔记' }}</h3>
            <p class="note-card-preview">{{ getNotePreview(note) }}</p>
            <div class="note-card-foot">
              <span v-if="note.folderId" class="note-card-folder">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                {{ getFolderPath(note.folderId) }}
              </span>
              <span class="note-card-date">{{ formatDate(note.updatedAt) }}</span>
            </div>
          </div>
        </article>
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

    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="context-menu"
        :style="contextMenuStyle"
        @click.stop
      >
        <template v-if="contextMenu.type === 'note'">
          <button class="context-menu-item" @click="execCtxAction('open')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>打开笔记</span>
          </button>
          <button class="context-menu-item" @click="execCtxAction('duplicate')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>复制副本</span>
          </button>
          <div class="context-menu-divider"></div>
          <button class="context-menu-item danger" @click="execCtxAction('delete')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>删除</span>
          </button>
        </template>
        <template v-else-if="contextMenu.type === 'folder'">
          <button class="context-menu-item" @click="execCtxAction('enter')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>打开文件夹</span>
          </button>
          <button class="context-menu-item" @click="execCtxAction('rename')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>重命名</span>
          </button>
          <div class="context-menu-divider"></div>
          <button class="context-menu-item danger" @click="execCtxAction('delete')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>删除</span>
          </button>
        </template>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="renameState.show" class="modal-overlay" @click.self="cancelRename">
        <div class="modal-content create-note-modal">
          <h3>重命名文件夹</h3>
          <input
            v-model="renameState.name"
            type="text"
            class="input"
            placeholder="请输入新名称"
            maxlength="50"
            @keyup.enter="confirmRename"
            @keyup.esc="cancelRename"
          />
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="cancelRename">取消</button>
            <button class="btn btn-primary" :disabled="!renameState.name.trim()" @click="confirmRename">确定</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="deleteFolderState.show" class="modal-overlay" @click.self="deleteFolderState.show = false">
        <div class="modal-content confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3>确认删除文件夹</h3>
              <p>确定删除文件夹「{{ deleteFolderState.target?.name }}」？文件夹内的笔记不会被删除。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="deleteFolderState.show = false">取消</button>
            <button class="btn btn-primary" @click="confirmDeleteFolder">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { formatDate as formatDateUtil } from '@/utils'
import { resolveImageUrl, isImageRef } from '@/utils/imageStore'

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

const allFolders = computed(() => noteStore.sortedFolders)

function enterFolder(folderId) {
  noteStore.setCurrentFolder(noteStore.currentFolderId === folderId ? null : folderId)
}

function countNotesInFolder(folderId) {
  return noteStore.notes.filter(n => !n.deleted && n.folderId === folderId).length
}

const filteredNotes = computed(() => {
  let notes
  if (noteStore.currentFolderId) {
    notes = noteStore.currentFolderNotes || []
  } else {
    notes = noteStore.notes.filter(n => !n.deleted)
  }
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

const resolvedCovers = reactive({})

async function resolveCover(note) {
  const raw = getNoteCoverRaw(note)
  if (!raw) { resolvedCovers[note.id] = null; return }
  if (isImageRef(raw)) {
    resolvedCovers[note.id] = await resolveImageUrl(raw)
  } else {
    resolvedCovers[note.id] = raw
  }
}

watch(filteredNotes, (notes) => {
  notes.forEach(n => resolveCover(n))
}, { immediate: true })

function getNoteCoverRaw(note) {
  if (!note.blocks?.length) return null
  const imgBlock = note.blocks.find(b => b.type === 'image' && b.imageUrl)
  return imgBlock?.imageUrl || null
}

function getNoteCover(note) {
  return resolvedCovers[note.id] || null
}

function getFolderPath(folderId) {
  return noteStore.getFolderPathString(folderId)
}

function formatDate(timestamp) {
  return formatDateUtil(timestamp, 'MM月DD日')
}

const contextMenu = ref({ show: false, type: 'note', x: 0, y: 0, target: null })
const contextMenuStyle = computed(() => ({ left: `${contextMenu.value.x}px`, top: `${contextMenu.value.y}px` }))

const renameState = ref({ show: false, id: '', name: '', isFolder: false })
const deleteFolderState = ref({ show: false, target: null })

function onNoteContextMenu(e, note) {
  contextMenu.value = { show: true, type: 'note', x: e.clientX, y: e.clientY, target: note }
}
function onFolderContextMenu(e, folder) {
  contextMenu.value = { show: true, type: 'folder', x: e.clientX, y: e.clientY, target: folder }
}
function closeContextMenu() {
  contextMenu.value.show = false
}
function execCtxAction(action) {
  const { type, target } = contextMenu.value
  closeContextMenu()
  if (!target) return
  if (type === 'note') {
    if (action === 'open') openNote(target.id)
    else if (action === 'duplicate') duplicateNote(target)
    else if (action === 'delete') deleteNote(target.id)
  } else if (type === 'folder') {
    if (action === 'enter') enterFolder(target.id)
    else if (action === 'rename') {
      renameState.value = { show: true, id: target.id, name: target.name, isFolder: true }
    } else if (action === 'delete') {
      deleteFolderState.value = { show: true, target }
    }
  }
}
function confirmRename() {
  const name = renameState.value.name.trim()
  if (name && renameState.value.id) {
    noteStore.renameFolder(renameState.value.id, name)
  }
  renameState.value.show = false
}
function cancelRename() {
  renameState.value.show = false
}
function confirmDeleteFolder() {
  if (deleteFolderState.value.target) {
    noteStore.deleteFolder(deleteFolderState.value.target.id)
  }
  deleteFolderState.value.show = false
}
function onGlobalClick(e) {
  if (contextMenu.value.show && !e.target.closest('.context-menu')) closeContextMenu()
}
onMounted(() => window.addEventListener('mousedown', onGlobalClick))
onUnmounted(() => window.removeEventListener('mousedown', onGlobalClick))
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
  margin-left: auto;
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
  position: relative;
}

.notes-bg-decor {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.bg-blob {
  position: absolute;
  bottom: -120px;
  color: var(--primary-color);
  opacity: 0.16;
  filter: blur(8px);
}

.bg-blob-1 {
  left: 8%;
  width: 340px;
  height: 340px;
  animation: blobDrift 24s ease-in-out infinite;
}

.bg-blob-2 {
  right: 12%;
  bottom: -160px;
  width: 280px;
  height: 280px;
  color: var(--secondary-color);
  opacity: 0.14;
  animation: blobDrift 30s ease-in-out infinite reverse;
}

@keyframes blobDrift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -15px) scale(1.08); }
}

.bg-rings {
  position: absolute;
  right: 22%;
  bottom: -50px;
  width: 200px;
  height: 200px;
  color: var(--primary-color);
  opacity: 0.22;
  animation: ringsSpin 40s linear infinite;
}

@keyframes ringsSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.bg-grid-lines {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 240px;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--primary-color) 45%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--primary-color) 45%, transparent) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.5;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 55%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 55%);
  transform: perspective(400px) rotateX(55deg);
  transform-origin: bottom center;
}

.bg-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 200px;
  background-image: radial-gradient(color-mix(in srgb, var(--primary-color) 60%, transparent) 1.4px, transparent 1.4px);
  background-size: 22px 22px;
  opacity: 0.5;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 45%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 45%, transparent 100%);
}

.notes-content-inner {
  position: relative;
  z-index: 1;
}

.all-folders-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.grid-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-count {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.folder-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(230px, 1fr));
  gap: 14px;
}

.folder-card {
  position: relative;
  overflow: hidden;
  padding: 18px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.folder-card-wave {
  position: absolute;
  right: -10px;
  bottom: -10px;
  width: 130px;
  height: 50px;
  color: var(--primary-color);
  opacity: 0.08;
  transition: opacity var(--transition-normal), transform var(--transition-normal);
  pointer-events: none;
}

.folder-card-inner {
  position: relative;
  display: flex;
  align-items: center;
  gap: 13px;
}

.folder-card-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-soft), var(--primary-softer));
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) 18%, transparent);
  transition: all var(--transition-normal);
}

.folder-card-content {
  flex: 1;
  min-width: 0;
}

.folder-card-name {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-card-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.folder-card-count {
  color: var(--primary-dark);
  font-weight: 600;
}

.folder-card-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--border-color);
  transition: all var(--transition-normal);
}

.folder-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
  box-shadow: 0 6px 18px -8px color-mix(in srgb, var(--primary-color) 35%, rgba(0, 0, 0, 0.1));
  transform: translateY(-2px);
}

.folder-card:hover .folder-card-wave {
  opacity: 0.16;
  transform: translate(-4px, -4px) scale(1.08);
}

.folder-card:hover .folder-card-icon {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: #fff;
  box-shadow: 0 4px 10px -2px color-mix(in srgb, var(--primary-color) 50%, transparent);
}

.folder-card:hover .folder-card-dot {
  background: var(--primary-color);
  transform: scale(1.3);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(244px, 1fr));
  gap: 16px;
}

.note-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.note-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
  box-shadow: 0 8px 22px -10px color-mix(in srgb, var(--primary-color) 30%, rgba(0, 0, 0, 0.12));
  transform: translateY(-3px);
}

.note-card-media {
  position: relative;
  width: 100%;
  height: 132px;
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-soft), var(--bg-tertiary));
}

.note-card-media.has-cover {
  background: var(--bg-tertiary);
}

.note-card-media::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40px;
  background: linear-gradient(180deg, transparent, var(--bg-secondary));
  pointer-events: none;
  z-index: 1;
}

.note-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s var(--transition-normal);
}

.note-card-media-deco {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  color: var(--primary-color);
}

.note-card:hover .note-card-media img {
  transform: scale(1.05);
}

.note-card-blocks {
  position: absolute;
  top: 10px;
  left: 10px;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(6px);
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  z-index: 2;
}

.note-card-body {
  position: relative;
  padding: 4px 16px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
  z-index: 2;
}

.note-card-body::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--border-color) 30%, var(--border-color) 70%, transparent);
}

.note-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 10px 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-fast);
}

.note-card:hover .note-card-title {
  color: var(--primary-dark);
}

.note-card-preview {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.note-card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-color);
  font-size: 11px;
  color: var(--text-tertiary);
}

.note-card-folder {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-dark);
  background: var(--primary-soft);
  padding: 3px 9px;
  border-radius: 999px;
  max-width: 65%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-card-folder svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.note-card-date {
  white-space: nowrap;
  margin-left: auto;
}

.note-card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  z-index: 3;
}

.note-card:hover .note-card-actions {
  opacity: 1;
  transform: translateY(0);
}

.note-action {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-fast);
}

.note-action:hover {
  background: var(--primary-color);
  color: #fff;
  transform: scale(1.1);
}

.note-action.note-del:hover {
  background: var(--warning-color);
  color: #fff;
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

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  animation: ctxPop 0.12s ease-out;
}

@keyframes ctxPop {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.context-menu-item svg {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.context-menu-item:hover {
  background: var(--bg-hover);
}

.context-menu-item:hover svg {
  color: var(--primary-color);
}

.context-menu-item.danger {
  color: var(--warning-color);
}

.context-menu-item.danger svg {
  color: var(--warning-color);
}

.context-menu-item.danger:hover {
  background: var(--warning-soft);
}

.context-menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 4px 6px;
}
</style>

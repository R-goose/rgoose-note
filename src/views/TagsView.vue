<template>
  <div class="tags-view">
    <header class="view-header">
      <div class="header-left">
        <h1>标签管理</h1>
        <span class="tag-total">{{ tagStore.tags.length }} 个标签</span>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="startCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建标签
        </button>
      </div>
    </header>

    <div class="tags-content">
      <div v-if="!tagStore.tags.length" class="empty-state">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
          <line x1="7" y1="7" x2="7.01" y2="7"/>
        </svg>
        <p>还没有标签</p>
        <span>点击右上角「新建标签」开始管理</span>
      </div>

      <div v-else class="tag-grid">
        <div
          v-for="tag in tagStore.sortedTags"
          :key="tag.id"
          class="tag-card"
        >
          <div class="tag-card-head">
            <span class="tag-dot" :style="{ background: tag.color }"></span>
            <input
              v-if="editingId === tag.id"
              ref="editInputRef"
              v-model="editingName"
              class="tag-name-input"
              :class="{ error: editingError }"
              @blur="finishEdit(tag)"
              @keyup.enter="finishEdit(tag)"
              @keyup.esc="cancelEdit"
            />
            <span v-else class="tag-name" @dblclick="startEdit(tag)">{{ tag.name }}</span>
            <div class="tag-card-actions">
              <button class="icon-btn" @click="startEdit(tag)" title="重命名">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <path d="M12 20h9"/>
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
                </svg>
              </button>
              <button class="icon-btn danger" @click="askDelete(tag)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="tag-colors">
            <button
              v-for="c in presetColors"
              :key="c"
              class="color-swatch"
              :class="{ active: tag.color === c }"
              :style="{ background: c }"
              @click="changeColor(tag, c)"
              :title="c"
            ></button>
          </div>

          <div class="tag-stats">
            <span class="stat-chip notes" @click="filterNotes(tag)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
              {{ noteStore.notesByTag(tag.id).length }} 篇笔记
            </span>
            <span class="stat-chip folders" @click="filterFolders(tag)">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              {{ noteStore.foldersByTag(tag.id).length }} 个文件夹
            </span>
          </div>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="creating" class="modal-overlay" @click.self="cancelCreate">
        <div class="modal-content create-tag-modal">
          <h3>新建标签</h3>
          <input
            ref="createInputRef"
            v-model="newTagName"
            type="text"
            class="input"
            placeholder="标签名称"
            maxlength="20"
            @keyup.enter="confirmCreate"
            @keyup.esc="cancelCreate"
          />
          <div class="color-pick-row">
            <button
              v-for="c in presetColors"
              :key="c"
              class="color-swatch lg"
              :class="{ active: newTagColor === c }"
              :style="{ background: c }"
              @click="newTagColor = c"
            ></button>
          </div>
          <div v-if="createError" class="error-tip">标签名称已存在</div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="cancelCreate">取消</button>
            <button class="btn btn-primary" @click="confirmCreate">创建</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="tagToDelete" class="modal-overlay" @click.self="tagToDelete = null">
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
              <h3>删除标签</h3>
              <p>确定删除「{{ tagToDelete.name }}」吗？已使用该标签的笔记和文件夹将移除该标签。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="tagToDelete = null">取消</button>
            <button class="btn btn-primary" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTagStore, TAG_PRESET_COLORS } from '@/stores/tag'
import { useNoteStore } from '@/stores/note'
import { useToast } from '@/composables/useToast'

const router = useRouter()
const tagStore = useTagStore()
const { error: toastError } = useToast()
const noteStore = useNoteStore()

const presetColors = TAG_PRESET_COLORS

const creating = ref(false)
const newTagName = ref('')
const newTagColor = ref(presetColors[0])
const createError = ref(false)
const createInputRef = ref(null)

const editingId = ref(null)
const editingName = ref('')
const editingError = ref(false)
const editInputRef = ref(null)

const tagToDelete = ref(null)

function startCreate() {
  creating.value = true
  newTagName.value = ''
  newTagColor.value = presetColors[0]
  createError.value = false
  nextTick(() => createInputRef.value?.focus())
}

function confirmCreate() {
  const name = newTagName.value.trim()
  if (!name) {
    toastError('请输入标签名称')
    return
  }
  const tag = tagStore.createTag(name, newTagColor.value)
  if (!tag) {
    createError.value = true
    return
  }
  creating.value = false
}

function cancelCreate() {
  creating.value = false
  newTagName.value = ''
  createError.value = false
}

function startEdit(tag) {
  editingId.value = tag.id
  editingName.value = tag.name
  editingError.value = false
  nextTick(() => {
    const el = editInputRef.value
    if (Array.isArray(el)) el[0]?.focus?.()
    else el?.focus?.()
  })
}

function finishEdit(tag) {
  if (editingId.value !== tag.id) return
  const name = editingName.value.trim()
  if (!name || name === tag.name) {
    cancelEdit()
    return
  }
  const ok = tagStore.updateTag(tag.id, { name })
  if (!ok) {
    editingError.value = true
    return
  }
  cancelEdit()
}

function cancelEdit() {
  editingId.value = null
  editingName.value = ''
  editingError.value = false
}

function changeColor(tag, color) {
  tagStore.updateTag(tag.id, { color })
}

function askDelete(tag) {
  tagToDelete.value = tag
}

function confirmDelete() {
  if (tagToDelete.value) {
    tagStore.deleteTag(tagToDelete.value.id)
  }
  tagToDelete.value = null
}

function filterNotes(tag) {
  noteStore.setCurrentFolder(null)
  router.push({ path: '/notes', query: { tag: tag.id } })
}

function filterFolders(tag) {
  noteStore.setCurrentFolder(null)
  router.push({ path: '/notes', query: { folderTag: tag.id } })
}
</script>

<style scoped>
.tags-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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

.tag-total {
  font-size: 13px;
  color: var(--text-tertiary);
}

.tags-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 32px;
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

.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.tag-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: 16px;
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast), border-color var(--transition-fast);
}

.tag-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-color);
}

.tag-card-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.tag-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-name {
  flex: 1;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-name-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-size: 14px;
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.tag-name-input.error {
  border-color: var(--warning-color);
}

.tag-card-actions {
  display: flex;
  gap: 2px;
  flex-shrink: 0;
}

.icon-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.icon-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.icon-btn.danger:hover {
  color: var(--warning-color);
  background: var(--warning-soft);
}

.tag-colors {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}

.color-swatch {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform var(--transition-fast), border-color var(--transition-fast);
  padding: 0;
}

.color-swatch:hover {
  transform: scale(1.15);
}

.color-swatch.active {
  border-color: var(--text-primary);
  box-shadow: 0 0 0 2px var(--bg-secondary), 0 0 0 3px var(--text-primary);
}

.color-swatch.lg {
  width: 26px;
  height: 26px;
}

.tag-stats {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.stat-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.stat-chip.notes {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.stat-chip.folders {
  background: var(--secondary-soft);
  color: var(--secondary-dark);
}

.stat-chip:hover {
  filter: brightness(0.95);
  transform: translateY(-1px);
}

.create-tag-modal {
  width: 380px;
  max-width: 90vw;
  padding: 24px;
}

.create-tag-modal h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.create-tag-modal .input {
  margin-bottom: 16px;
  font-size: 15px;
}

.color-pick-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.error-tip {
  margin-bottom: 16px;
  padding: 8px 12px;
  background: var(--warning-soft);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--warning-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.confirm-modal {
  width: 420px;
  max-width: 90vw;
  padding: 24px;
}

.confirm-header {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
}

.confirm-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-icon.warning {
  background: var(--warning-soft);
  color: var(--warning-color);
}

.confirm-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.confirm-header p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>

<template>
  <div class="media-view">
    <div class="view-header">
      <h1>素材库</h1>
      <div class="header-actions">
        <div class="filter-tabs">
          <button
            v-for="f in filters"
            :key="f.key"
            class="filter-tab"
            :class="{ active: activeFilter === f.key }"
            @click="activeFilter = f.key"
          >
            {{ f.label }}
            <span v-if="counts[f.key]" class="filter-count">{{ counts[f.key] }}</span>
          </button>
        </div>
        <input
          v-model="searchText"
          class="search-input"
          placeholder="搜索笔记名..."
        />
      </div>
    </div>

    <div v-if="loading" class="media-loading">加载中...</div>

    <div v-else-if="filteredItems.length === 0" class="media-empty">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4">
        <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
      </svg>
      <p>{{ allItems.length === 0 ? '还没有任何媒体素材' : '没有匹配的素材' }}</p>
    </div>

    <div v-else class="media-grid">
      <div
        v-for="item in filteredItems"
        :key="item.id"
        class="media-card"
        @click="previewItem(item)"
      >
        <div class="media-thumb">
          <img v-if="item.type === 'image' && item.url" :src="item.url" alt="" />
          <div v-else-if="item.type === 'audio'" class="thumb-icon audio-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <div v-else-if="item.type === 'video'" class="thumb-icon video-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="23 7 16 12 23 17 23 7"/>
            </svg>
          </div>
          <span class="type-badge" :class="item.type">{{ typeLabel[item.type] }}</span>
        </div>
        <div class="media-info">
          <span class="media-source-note" @click.stop="goToNote(item.noteId)" :title="item.noteTitle">
            {{ item.noteTitle }}
          </span>
          <span class="media-source-type">{{ item.blockType === 'gallery' ? '画廊' : '单图' }}</span>
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <div v-if="previewItem_data" class="preview-overlay" @click="previewItem_data = null">
      <div class="preview-content" @click.stop>
        <img v-if="previewItem_data.type === 'image'" :src="previewItem_data.url" class="preview-img" />
        <audio v-else-if="previewItem_data.type === 'audio'" :src="previewItem_data.url" controls autoplay class="preview-audio"></audio>
        <video v-else-if="previewItem_data.type === 'video'" :src="previewItem_data.url" controls autoplay class="preview-video"></video>
        <div class="preview-meta">
          <span>{{ previewItem_data.noteTitle }}</span>
          <button class="btn btn-secondary" @click="goToNote(previewItem_data.noteId)">打开笔记</button>
          <button class="btn btn-ghost" @click="previewItem_data = null">关闭</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { resolveImageUrl, isImageRef } from '@/utils/imageStore'

const router = useRouter()
const noteStore = useNoteStore()

const loading = ref(true)
const allItems = ref([])
const activeFilter = ref('all')
const searchText = ref('')
const previewItem_data = ref(null)

const filters = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'audio', label: '音频' },
  { key: 'video', label: '视频' }
]

const typeLabel = { image: '图', audio: '音', video: '视' }

const counts = computed(() => {
  const c = { all: allItems.value.length, image: 0, audio: 0, video: 0 }
  allItems.value.forEach(i => { if (c[i.type] !== undefined) c[i.type]++ })
  return c
})

const filteredItems = computed(() => {
  let items = allItems.value
  if (activeFilter.value !== 'all') {
    items = items.filter(i => i.type === activeFilter.value)
  }
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    items = items.filter(i => i.noteTitle.toLowerCase().includes(q))
  }
  return items
})

async function collectMedia() {
  loading.value = true
  const items = []
  const notes = noteStore.notes || []

  for (const note of notes) {
    if (note.deleted) continue
    const blocks = note.blocks || []
    for (const block of blocks) {
      if (block.type === 'image' && block.imageUrl) {
        items.push(createItem(block.imageUrl, 'image', note, 'image'))
      } else if ((block.type === 'audio' || block.type === 'video') && block.mediaUrl) {
        items.push(createItem(block.mediaUrl, block.type, note, block.type, block.mediaName))
      } else if (block.type === 'gallery' && Array.isArray(block.images)) {
        block.images.forEach(img => {
          if (img) items.push(createItem(img, 'image', note, 'gallery'))
        })
      }
    }
  }

  // resolve URLs
  await Promise.all(items.map(async (item) => {
    if (isImageRef(item.ref)) {
      item.url = await resolveImageUrl(item.ref)
    } else {
      item.url = item.ref
    }
  }))

  allItems.value = items
  loading.value = false
}

function createItem(ref, type, note, blockType, name) {
  return {
    id: `${note.id}_${ref}_${Math.random().toString(36).slice(0, 4)}`,
    ref,
    type,
    noteId: note.id,
    noteTitle: note.title || '未命名',
    blockType,
    name: name || '',
    url: ''
  }
}

function previewItem(item) {
  previewItem_data.value = item
}

function goToNote(noteId) {
  previewItem_data.value = null
  router.push(`/note/${noteId}`)
}

onMounted(() => collectMedia())
</script>

<style scoped>
.media-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.view-header h1 {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 3px;
}

.filter-tab {
  padding: 5px 14px;
  font-size: 13px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-tab:hover {
  color: var(--text-primary);
}

.filter-tab.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.filter-count {
  font-size: 11px;
  background: var(--bg-hover);
  padding: 0 5px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.filter-tab.active .filter-count {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.search-input {
  width: 180px;
  padding: 6px 12px;
  font-size: 13px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
}

.search-input:focus {
  border-color: var(--primary-color);
}

.media-loading,
.media-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
}

.media-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  align-content: start;
}

.media-card {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.15s;
  background: var(--bg-secondary);
}

.media-card:hover {
  border-color: var(--primary-color);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.media-thumb {
  position: relative;
  aspect-ratio: 1;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.media-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumb-icon {
  color: var(--text-secondary);
  opacity: 0.5;
}

.type-badge {
  position: absolute;
  top: 6px;
  left: 6px;
  font-size: 11px;
  padding: 1px 6px;
  border-radius: 4px;
  font-weight: 500;
  color: #fff;
}

.type-badge.image { background: var(--primary-color); }
.type-badge.audio { background: #e67e22; }
.type-badge.video { background: #8e44ad; }

.media-info {
  padding: 8px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.media-source-note {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: pointer;
}

.media-source-note:hover {
  color: var(--primary-color);
}

.media-source-type {
  font-size: 11px;
  color: var(--text-secondary);
}

/* 预览弹窗 */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.preview-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-img {
  max-width: 90vw;
  max-height: 75vh;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.preview-video {
  max-width: 90vw;
  max-height: 75vh;
  border-radius: var(--radius-md);
}

.preview-audio {
  width: 400px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 14px;
}
</style>

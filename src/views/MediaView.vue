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
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索素材..."
            class="search-input"
            @keydown.esc="searchText = ''"
          />
        </div>
      </div>
    </div>

    <div class="media-content">
      <BgDecor />
      <div class="media-content-inner">
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
          <div v-else-if="item.type === 'video' && item.thumbUrl" class="thumb-video-cover">
            <img :src="item.thumbUrl" alt="" />
            <span class="play-overlay">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </span>
          </div>
          <div v-else-if="item.type === 'video'" class="thumb-icon video-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="23 7 16 12 23 17 23 7"/>
            </svg>
          </div>
          <div v-else-if="item.type === 'audio'" class="thumb-icon audio-icon">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
            </svg>
          </div>
          <span class="type-badge" :class="item.type">{{ typeLabel[item.type] }}</span>
        </div>
        <div class="media-info">
          <span class="media-source-note" @click.stop="goToNote(item.noteId)" :title="item.noteTitle">
            {{ item.noteTitle }}
          </span>
          <span class="media-source-type">{{
            item.type === 'image'
              ? (item.blockType === 'gallery' ? '画廊' : '单图')
              : (item.name || typeLabel[item.type] + '频')
          }}</span>
        </div>
      </div>
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
import BgDecor from '@/components/BgDecor.vue'

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

  // 为视频生成首帧缩略图（并行，但限制并发数）
  const videoItems = items.filter(i => i.type === 'video' && i.url)
  const CONCURRENCY = 3
  for (let i = 0; i < videoItems.length; i += CONCURRENCY) {
    const batch = videoItems.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async (item) => {
      item.thumbUrl = await generateVideoThumbnail(item.url)
    }))
  }

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
    url: '',
    thumbUrl: ''
  }
}

// 从视频 URL 提取首帧作为缩略图
function generateVideoThumbnail(videoUrl) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    // 必须挂载到 DOM 才能在 Electron/Chromium 中正常解码帧
    video.style.position = 'fixed'
    video.style.left = '-9999px'
    video.style.top = '0'
    video.style.width = '2px'
    video.style.height = '2px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    document.body.appendChild(video)

    let settled = false
    let timer = null
    let attempt = 0
    // 候选取帧时间点（秒）：依次尝试，避开开头纯黑帧（第四项在 metadata 加载后补算）
    const seekPoints = [0.5, 1, 2]

    const cleanup = () => {
      if (timer) { clearTimeout(timer); timer = null }
      video.removeAttribute('src')
      try { video.load() } catch {}
      video.remove()
    }
    const fail = () => { if (!settled) { settled = true; cleanup(); resolve('') } }
    const capture = () => {
      try {
        const w = video.videoWidth || 320
        const h = video.videoHeight || 180
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        // 先填黑底，再绘制视频帧
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(video, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        // 简单黑屏检测：统计前若干像素亮度，若全黑则换下一时间点
        const sample = ctx.getImageData(0, 0, Math.min(32, w), Math.min(32, h)).data
        let sum = 0
        for (let i = 0; i < sample.length; i += 4) {
          sum += sample[i] + sample[i + 1] + sample[i + 2]
        }
        const avg = sum / (sample.length / 4 * 3)
        if (avg < 8 && attempt < seekPoints.length) {
          // 可能是黑帧，尝试下一个时间点
          attempt++
          trySeek()
          return
        }
        settled = true
        cleanup()
        resolve(dataUrl)
      } catch {
        fail()
      }
    }
    const trySeek = () => {
      if (settled) return
      const t = seekPoints[attempt]
      if (t == null || isNaN(t)) { fail(); return }
      try { video.currentTime = t } catch { fail() }
    }

    video.addEventListener('loadedmetadata', () => {
      // duration 已知，补充一个靠后的取帧点
      const dur = video.duration
      if (isFinite(dur) && dur > 0) {
        seekPoints.push(Math.min(5, dur * 0.2))
      }
      // 等待可以播放再 seek，避免 seeked 不触发
      const onReady = () => {
        if (settled) return
        attempt = 0
        trySeek()
      }
      if (video.readyState >= 2) {
        onReady()
      } else {
        video.addEventListener('canplay', onReady, { once: true })
      }
    })
    video.addEventListener('seeked', () => {
      if (settled) return
      // 给解码留一点时间，避免抓到上一帧
      setTimeout(capture, 60)
    })
    video.addEventListener('error', fail)
    timer = setTimeout(fail, 8000)

    video.src = videoUrl
    try { video.load() } catch {}
  })
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
  padding: 20px 28px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.view-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}

.media-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  position: relative;
}

.media-content-inner {
  position: relative;
  z-index: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
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
  border: none;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
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

.thumb-video-cover {
  position: relative;
  width: 100%;
  height: 100%;
}
.thumb-video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  color: #fff;
  opacity: 0.9;
}
.play-overlay svg {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
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

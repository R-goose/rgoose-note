<template>
  <Teleport to="body">
    <JellyModal :show="show" @close="$emit('close')">
      <div class="media-picker-modal">
        <div class="picker-header">
          <h3>{{ title }}</h3>
          <button class="picker-close" @click="$emit('close')">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="picker-body">
          <div v-if="loading" class="picker-loading">加载中...</div>

          <div v-else-if="filteredItems.length === 0" class="picker-empty">
            <p>素材库暂无{{ typeLabel }}素材</p>
          </div>

          <div v-else class="picker-grid">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="picker-item"
              :class="{ selected: isSelected(item) }"
              @click="toggleSelect(item)"
            >
              <!-- 图片 -->
              <img v-if="mediaType === 'image'" :src="item.url" :alt="item.displayName || ''" />
              <!-- 音频 -->
              <div v-else-if="mediaType === 'audio'" class="picker-media-thumb">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
              </div>
              <!-- 视频 -->
              <div v-else-if="mediaType === 'video'" class="picker-media-thumb">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="23 7 16 12 23 17 23 7"/></svg>
              </div>

              <div class="picker-item-check" v-if="isSelected(item)">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <span class="picker-item-name" v-if="item.displayName">{{ item.displayName }}</span>
            </div>
          </div>
        </div>

        <div class="picker-footer">
          <span v-if="selectedItems.length > 0" class="picker-count">已选 {{ selectedItems.length }} 项</span>
          <span v-else class="picker-count"></span>
          <div class="picker-actions">
            <button class="btn btn-secondary" @click="$emit('close')">取消</button>
            <button class="btn btn-primary" :disabled="selectedItems.length === 0" @click="confirm">确定</button>
          </div>
        </div>
      </div>
    </JellyModal>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { getAllImageRefs, getAllImageMeta, resolveImageUrl } from '@/utils/imageStore'

const props = defineProps({
  show: { type: Boolean, default: false },
  multiple: { type: Boolean, default: false },
  mediaType: { type: String, default: 'image' } // 'image' | 'audio' | 'video'
})

const emit = defineEmits(['close', 'select'])

const loading = ref(true)
const allItems = ref([])
const selectedItems = ref([])

const titleMap = { image: '选择图片', audio: '选择音频', video: '选择视频' }
const title = computed(() => titleMap[props.mediaType] || '选择素材')
const typeLabel = computed(() => {
  const m = { image: '图片', audio: '音频', video: '视频' }
  return m[props.mediaType] || ''
})

const refPrefix = computed(() => {
  if (props.mediaType === 'image') return 'img_'
  return 'media_'
})

const filteredItems = computed(() => allItems.value.filter(i => i.type === props.mediaType))

watch(() => props.show, async (v) => {
  if (v) {
    selectedItems.value = []
    await loadItems()
  }
}, { immediate: true })

async function loadItems() {
  loading.value = true
  try {
    const [allRefs, allMeta] = await Promise.all([getAllImageRefs(), getAllImageMeta()])
    const metaMap = {}
    for (const m of allMeta) metaMap[m.id] = m.displayName
    allItems.value = allRefs.map(ref => {
      const isImg = ref.startsWith('img_')
      return {
        id: ref,
        ref,
        type: isImg ? 'image' : (ref.endsWith('.mp4') || ref.endsWith('.webm') ? 'video' : 'audio'),
        displayName: metaMap[ref] || '',
        url: resolveImageUrl(ref)
      }
    })
  } catch {
    allItems.value = []
  }
  loading.value = false
}

function isSelected(item) {
  return selectedItems.value.some(i => i.ref === item.ref)
}

function toggleSelect(item) {
  if (props.multiple) {
    const idx = selectedItems.value.findIndex(i => i.ref === item.ref)
    if (idx > -1) {
      selectedItems.value.splice(idx, 1)
    } else {
      selectedItems.value.push(item)
    }
  } else {
    selectedItems.value = [item]
  }
}

function confirm() {
  if (selectedItems.value.length === 0) return
  const refs = selectedItems.value.map(i => i.ref)
  emit('select', props.multiple ? refs : refs[0])
  emit('close')
}
</script>

<style scoped>
.media-picker-modal {
  background: var(--bg-secondary);
  border-radius: var(--radius-xl);
  box-shadow: var(--shadow-lg);
  width: 720px;
  max-width: 90vw;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: jellyPop 0.45s cubic-bezier(0.34, 1.4, 0.44, 1) both;
  will-change: transform;
}

.jmodal-leave-active .media-picker-modal {
  animation: jellyOut 0.24s cubic-bezier(0.55, 0, 0.8, 0.4) both;
}

.picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}
.picker-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0;
}
.picker-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all .15s;
}
.picker-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.picker-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.picker-loading,
.picker-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 60px 0;
  color: var(--text-tertiary);
  font-size: 14px;
}

.picker-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
  gap: 10px;
}

.picker-item {
  position: relative;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all .15s;
  aspect-ratio: 1;
}
.picker-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.picker-media-thumb {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
}
.picker-item:hover {
  border-color: var(--primary-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px -4px rgba(0,0,0,.15);
}
.picker-item.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color);
}

.picker-item-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--primary-color);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.picker-item-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 4px 6px;
  font-size: 11px;
  color: #fff;
  background: linear-gradient(transparent, rgba(0,0,0,.6));
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.picker-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 24px;
  border-top: 1px solid var(--border-light);
  flex-shrink: 0;
}
.picker-count {
  font-size: 13px;
  color: var(--text-secondary);
}
.picker-actions {
  display: flex;
  gap: 10px;
}
.picker-actions .btn-primary:disabled {
  opacity: .5;
  cursor: not-allowed;
}
</style>

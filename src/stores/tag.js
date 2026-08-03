import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, getTimestamp, deepClone } from '@/utils'
import { tagsApi } from '@/api/tags'
import { syncApi } from '@/api/sync'

export const TAG_PRESET_COLORS = [
  '#6bbd8f', '#5a9e7a', '#4a90d9', '#9b7bd6',
  '#e8a44a', '#d97757', '#d96b8e', '#8aa39b',
  '#7a8ca6', '#b59f3a'
]

export const useTagStore = defineStore('tag', () => {
  const tags = ref([])
  const lastSyncTime = ref(0)

  const sortedTags = computed(() => {
    return [...tags.value].sort((a, b) => {
      const an = a.sort ?? a.createdAt
      const bn = b.sort ?? b.createdAt
      return an - bn
    })
  })

  let initPromise = null
  async function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        const data = await syncApi.pull(0)
        tags.value = data.tags || []
        lastSyncTime.value = data.serverTime || Date.now()
      } catch (err) {
        console.error('[tagStore] 从后端加载失败:', err)
        tags.value = []
      }
    })()
    return initPromise
  }

  function getTag(id) {
    return tags.value.find(t => t.id === id) || null
  }

  function createTag(name, color = TAG_PRESET_COLORS[0]) {
    const trimmed = (name || '').trim()
    if (!trimmed) return null
    const exists = tags.value.some(t => t.name.trim() === trimmed)
    if (exists) return null
    const now = getTimestamp()
    const tag = {
      id: generateId(),
      name: trimmed,
      color,
      createdAt: now,
      updatedAt: now
    }
    tags.value.push(tag)

    tagsApi.create(tag)
      .catch(err => {
        console.error('创建标签失败:', err)
        const idx = tags.value.findIndex(t => t.id === tag.id)
        if (idx >= 0) tags.value.splice(idx, 1)
      })

    return tag
  }

  function updateTag(id, updates) {
    const tag = tags.value.find(t => t.id === id)
    if (!tag) return
    const backup = { ...tag }
    if (updates.name) {
      const trimmed = updates.name.trim()
      if (!trimmed) return
      const dup = tags.value.some(t => t.id !== id && t.name.trim() === trimmed)
      if (dup) return
      tag.name = trimmed
    }
    if (updates.color) tag.color = updates.color
    tag.updatedAt = getTimestamp()

    tagsApi.update(id, { ...updates, updatedAt: tag.updatedAt })
      .catch(err => {
        console.error('更新标签失败:', err)
        Object.assign(tag, backup)
      })
  }

  function deleteTag(id) {
    const idx = tags.value.findIndex(t => t.id === id)
    if (idx < 0) return
    const backup = tags.value[idx]
    tags.value.splice(idx, 1)

    // 前端同步清理 notes / folders 的 tags 引用
    // 后端也会做这个清理，前端只需保持本地一致
    // 使用动态 import 避免循环依赖
    import('./note').then(({ useNoteStore }) => {
      const noteStore = useNoteStore()
      noteStore.notes.forEach(n => {
        if (Array.isArray(n.tags) && n.tags.includes(id)) {
          n.tags = n.tags.filter(t => t !== id)
          n.updatedAt = getTimestamp()
        }
      })
      noteStore.folders.forEach(f => {
        if (Array.isArray(f.tags) && f.tags.includes(id)) {
          f.tags = f.tags.filter(t => t !== id)
          f.updatedAt = getTimestamp()
        }
      })
    })

    tagsApi.delete(id)
      .catch(err => {
        console.error('删除标签失败:', err)
        tags.value.splice(idx, 0, backup)
      })
  }

  function replaceAll(newTags) {
    tags.value = deepClone(newTags || [])
  }

  return {
    tags,
    sortedTags,
    lastSyncTime,
    init,
    getTag,
    createTag,
    updateTag,
    deleteTag,
    replaceAll
  }
})

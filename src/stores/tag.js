import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, getTimestamp } from '@/utils'
import { loadFromStore, getLastSyncTime } from '@/utils/storage'
import { useNoteStore } from './note'

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
      const data = await loadFromStore()
      if (data && Array.isArray(data.tags)) {
        tags.value = data.tags
      }
      lastSyncTime.value = getLastSyncTime()
    })()
    return initPromise
  }

  let persistTimer = null
  function persist() {
    if (persistTimer) clearTimeout(persistTimer)
    persistTimer = setTimeout(() => {
      flushPersist()
      persistTimer = null
    }, 500)
  }
  function flushPersist() {
    if (persistTimer) {
      clearTimeout(persistTimer)
      persistTimer = null
    }
    const noteStore = useNoteStore()
    noteStore.setPendingTags(tags.value)
    noteStore.persist()
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
    persist()
    return tag
  }

  function updateTag(id, updates) {
    const tag = tags.value.find(t => t.id === id)
    if (!tag) return
    if (updates.name) {
      const trimmed = updates.name.trim()
      if (!trimmed) return
      const dup = tags.value.some(t => t.id !== id && t.name.trim() === trimmed)
      if (dup) return
      tag.name = trimmed
    }
    if (updates.color) tag.color = updates.color
    tag.updatedAt = getTimestamp()
    persist()
  }

  function deleteTag(id) {
    const idx = tags.value.findIndex(t => t.id === id)
    if (idx < 0) return
    tags.value.splice(idx, 1)
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
    persist()
    noteStore.persist()
  }

  function replaceAll(newTags) {
    tags.value = JSON.parse(JSON.stringify(newTags || []))
    persist()
  }

  return {
    tags,
    sortedTags,
    lastSyncTime,
    init,
    persist,
    flushPersist,
    getTag,
    createTag,
    updateTag,
    deleteTag,
    replaceAll
  }
})

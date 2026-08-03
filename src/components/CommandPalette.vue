<template>
  <transition name="cmd-fade">
    <div v-if="show" class="cmd-palette-overlay" @click="$emit('close')">
      <div class="cmd-palette" @click.stop>
        <div class="cmd-input-wrap">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref="inputRef"
            v-model="query"
            class="cmd-input"
            placeholder="搜索笔记 / 计划 / 标签，或输入命令..."
            spellcheck="false"
            @keydown="onKeyDown"
          />
          <kbd class="cmd-esc">ESC</kbd>
        </div>
        <div v-if="filteredItems.length" class="cmd-list">
          <div
            v-for="(item, idx) in filteredItems"
            :key="item.id"
            class="cmd-item"
            :class="{ active: idx === activeIndex }"
            @mouseenter="activeIndex = idx"
            @click="executeItem(item)"
          >
            <span class="cmd-item-icon" v-html="item.icon"></span>
            <span class="cmd-item-label">{{ item.label }}</span>
            <span v-if="item.hint" class="cmd-item-hint">{{ item.hint }}</span>
          </div>
        </div>
        <div v-else class="cmd-empty">无匹配结果</div>
      </div>
    </div>
  </transition>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { useTagStore } from '@/stores/tag'

const props = defineProps({ show: Boolean })
const emit = defineEmits(['close'])

const router = useRouter()
const noteStore = useNoteStore()
const planStore = usePlanStore()
const tagStore = useTagStore()

const query = ref('')
const activeIndex = ref(0)
const inputRef = ref(null)

const ICON_NOTE = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
const ICON_CMD = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>'
const ICON_PLAN = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>'
const ICON_TAG = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>'
const ICON_FOLDER = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'

// 静态命令（路由跳转 + 新建），不依赖数据集合
const cmdItems = computed(() => [
  { id: 'cmd-notes', label: '前往笔记列表', icon: ICON_CMD, action: () => router.push('/notes') },
  { id: 'cmd-plans', label: '前往计划', icon: ICON_CMD, action: () => router.push('/plans') },
  { id: 'cmd-dashboard', label: '前往仪表盘', icon: ICON_CMD, action: () => router.push('/dashboard') },
  { id: 'cmd-tags', label: '前往标签', icon: ICON_CMD, action: () => router.push('/tags') },
  { id: 'cmd-media', label: '前往素材库', icon: ICON_CMD, action: () => router.push('/media') },
  { id: 'cmd-settings', label: '前往设置', icon: ICON_CMD, action: () => router.push('/settings') },
  { id: 'cmd-new-note', label: '新建笔记', icon: ICON_CMD, action: () => { noteStore.createNote(); router.push('/notes') } }
])

// 各数据集合独立 computed，仅在其依赖变化时重建，不随 query 重算
const noteItems = computed(() => (noteStore.notes || [])
  .filter(n => !n.deleted)
  .map(n => ({
    id: `note-${n.id}`,
    label: n.title || '未命名',
    hint: noteStore.getFolderPathString(n.folderId) || '',
    icon: ICON_NOTE,
    action: () => router.push(`/note/${n.id}`)
  })))

const planItems = computed(() => (planStore.plans || [])
  .filter(p => !p.completed)
  .map(p => ({
    id: `plan-${p.id}`,
    label: p.title || '未命名计划',
    hint: p.dueDate ? new Date(p.dueDate).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : '',
    icon: ICON_PLAN,
    action: () => router.push('/plans')
  })))

const tagItems = computed(() => (tagStore.tags || [])
  .map(t => ({
    id: `tag-${t.id}`,
    label: t.name || '未命名标签',
    hint: '标签',
    icon: ICON_TAG,
    action: () => router.push('/tags')
  })))

const folderItems = computed(() => (noteStore.folders || [])
  .filter(f => !f.deleted && !f.isSystem)
  .map(f => ({
    id: `folder-${f.id}`,
    label: f.name || '未命名文件夹',
    hint: '文件夹',
    icon: ICON_FOLDER,
    action: () => {
      noteStore.setCurrentFolder(f.id)
      router.push('/notes')
    }
  })))

// 全量候选：仅在上述任一依赖变化时重算
const allItems = computed(() => [
  ...cmdItems.value,
  ...noteItems.value,
  ...planItems.value,
  ...tagItems.value,
  ...folderItems.value
])

// 过滤：随 query 变化，但只做轻量字符串匹配
const filteredItems = computed(() => {
  if (!query.value.trim()) return allItems.value.slice(0, 12)
  const q = query.value.trim().toLowerCase()
  return allItems.value.filter(c => c.label.toLowerCase().includes(q)).slice(0, 30)
})

watch(() => props.show, (v) => {
  if (v) {
    query.value = ''
    activeIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})
watch(query, () => { activeIndex.value = 0 })
watch(filteredItems, () => { activeIndex.value = 0 })

function onKeyDown(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, filteredItems.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    if (filteredItems.value[activeIndex.value]) executeItem(filteredItems.value[activeIndex.value])
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

function executeItem(item) {
  item.action?.()
  emit('close')
}
</script>

<style scoped>
.cmd-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.35);
  z-index: 10000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 100px;
}
.cmd-palette {
  width: 520px;
  max-width: 90vw;
  background: var(--bg-elevated, var(--bg-secondary));
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 48px rgba(0,0,0,0.24);
  overflow: hidden;
}
.cmd-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid var(--border-light);
  color: var(--text-secondary);
}
.cmd-input {
  flex: 1;
  font-size: 15px;
  border: none;
  outline: none;
  background: transparent;
  color: var(--text-primary);
}
.cmd-esc {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 3px;
  background: var(--bg-tertiary);
  color: var(--text-tertiary, var(--text-secondary));
  font-family: monospace;
}
.cmd-list {
  max-height: 360px;
  overflow-y: auto;
  padding: 4px;
}
.cmd-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.1s;
}
.cmd-item.active {
  background: var(--primary-soft);
}
.cmd-item-icon {
  display: flex;
  color: var(--text-secondary);
}
.cmd-item.active .cmd-item-icon {
  color: var(--primary-color);
}
.cmd-item-label {
  flex: 1;
  font-size: 14px;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cmd-item-hint {
  font-size: 11px;
  color: var(--text-tertiary, var(--text-secondary));
}
.cmd-empty {
  padding: 30px;
  text-align: center;
  font-size: 13px;
  color: var(--text-tertiary, var(--text-secondary));
}
.cmd-fade-enter-active,
.cmd-fade-leave-active {
  transition: opacity 0.15s;
}
.cmd-fade-enter-from,
.cmd-fade-leave-to {
  opacity: 0;
}
</style>

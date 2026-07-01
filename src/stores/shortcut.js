import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const SHORTCUT_KEY = 'rgoose_shortcuts'

export const ACTION_META = {
  copy:          { label: '复制块', group: '编辑', default: 'Ctrl+C' },
  paste:         { label: '粘贴块', group: '编辑', default: 'Ctrl+V' },
  duplicate:     { label: '副本块', group: '编辑', default: 'Ctrl+D' },
  delete:        { label: '删除块', group: '编辑', default: 'Del', alias: ['Backspace'] },
  undo:          { label: '撤销', group: '编辑', default: 'Ctrl+Z' },
  redo:          { label: '重做', group: '编辑', default: 'Ctrl+Y', alias: ['Ctrl+Shift+Z'] },
  newBlock:      { label: '新建文本块', group: '画布', default: 'N' },
  toggleConnect: { label: '切换连线模式', group: '画布', default: 'T' },
  zoomIn:        { label: '放大画布', group: '画布', default: 'Ctrl+=' },
  zoomOut:       { label: '缩小画布', group: '画布', default: 'Ctrl+-' },
  zoomReset:     { label: '重置缩放', group: '画布', default: 'Ctrl+0' },
  panCanvas:     { label: '平移画布(按住)', group: '画布', default: 'Space' },
  moveUp:        { label: '上移块(Shift加速)', group: '画布', default: 'Up' },
  moveDown:      { label: '下移块(Shift加速)', group: '画布', default: 'Down' },
  moveLeft:      { label: '左移块(Shift加速)', group: '画布', default: 'Left' },
  moveRight:     { label: '右移块(Shift加速)', group: '画布', default: 'Right' },
  escape:        { label: '取消/关闭菜单', group: '通用', default: 'Esc' },
  sync:          { label: '云同步', group: '通用', default: 'Ctrl+S' },
  insertUL:      { label: '插入无序列表', group: '插入内容', default: 'Ctrl+Shift+L' },
  insertOL:      { label: '插入有序列表', group: '插入内容', default: 'Ctrl+Shift+N' },
  insertCode:    { label: '插入代码块', group: '插入内容', default: 'Ctrl+Shift+K' },
  insertTable:   { label: '插入表格', group: '插入内容', default: 'Ctrl+Shift+T' },
  insertLink:    { label: '插入链接', group: '插入内容', default: 'Ctrl+K' },
  insertImage:   { label: '插入图片', group: '插入内容', default: 'Ctrl+Shift+I' },
  insertQuote:   { label: '插入引用笔记', group: '插入内容', default: 'Ctrl+Shift+R' }
}

const KEY_ALIASES = {
  Escape: 'Esc',
  Delete: 'Del',
  ArrowUp: 'Up',
  ArrowDown: 'Down',
  ArrowLeft: 'Left',
  ArrowRight: 'Right',
  ' ': 'Space',
  Enter: 'Enter',
  Tab: 'Tab',
  Backspace: 'Backspace'
}

export function normalizeKeyName(key) {
  if (key.length === 1 && /[a-z]/.test(key)) return key.toUpperCase()
  return KEY_ALIASES[key] || key
}

export function eventToCombo(e) {
  const parts = []
  if (e.ctrlKey || e.metaKey) parts.push('Ctrl')
  if (e.altKey) parts.push('Alt')
  if (e.shiftKey) parts.push('Shift')
  parts.push(normalizeKeyName(e.key))
  return parts.join('+')
}

export function isComboEqual(a, b) {
  return a === b
}

export const useShortcutStore = defineStore('shortcut', () => {
  const shortcuts = ref({})
  const loaded = ref(false)

  const groupedActions = computed(() => {
    const groups = {}
    for (const [id, meta] of Object.entries(ACTION_META)) {
      if (!groups[meta.group]) groups[meta.group] = []
      groups[meta.group].push({ id, ...meta })
    }
    return groups
  })

  function getCombo(actionId) {
    if (shortcuts.value[actionId] != null) return shortcuts.value[actionId]
    return ACTION_META[actionId]?.default || ''
  }

  function isDefault(actionId) {
    return shortcuts.value[actionId] == null
  }

  function matches(e, actionId) {
    const combo = eventToCombo(e)
    const primary = getCombo(actionId)
    if (combo === primary) return true
    const alias = ACTION_META[actionId]?.alias
    if (alias && alias.includes(combo)) return true
    return false
  }

  function findConflict(actionId, combo) {
    for (const id of Object.keys(ACTION_META)) {
      if (id === actionId) continue
      if (getCombo(id) === combo) return id
      const alias = ACTION_META[id]?.alias
      if (alias && alias.includes(combo)) return id
    }
    return null
  }

  function setShortcut(actionId, combo) {
    shortcuts.value[actionId] = combo
    persist()
  }

  function resetShortcut(actionId) {
    delete shortcuts.value[actionId]
    shortcuts.value = { ...shortcuts.value }
    persist()
  }

  function resetAll() {
    shortcuts.value = {}
    persist()
  }

  function persist() {
    try {
      localStorage.setItem(SHORTCUT_KEY, JSON.stringify(shortcuts.value))
    } catch (e) {
      console.error('Failed to persist shortcuts:', e)
    }
  }

  function init() {
    try {
      const saved = localStorage.getItem(SHORTCUT_KEY)
      shortcuts.value = saved ? JSON.parse(saved) : {}
    } catch (e) {
      console.error('Failed to load shortcuts:', e)
      shortcuts.value = {}
    }
    for (const id of Object.keys(ACTION_META)) {
      if (shortcuts.value[id] == null) {
        // keep undefined so default applies and "isDefault" works
      }
    }
    loaded.value = true
  }

  return {
    shortcuts,
    loaded,
    groupedActions,
    getCombo,
    isDefault,
    matches,
    findConflict,
    setShortcut,
    resetShortcut,
    resetAll,
    init
  }
})

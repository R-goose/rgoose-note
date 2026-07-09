<template>
  <div
    ref="blockRef"
    class="note-block"
    :data-block-id="block.id"
    :class="{
      selected,
      highlighted,
      'hide-highlight-underline': hideHighlightUnderline,
      'link-selection-mode': linkSelectionMode,
      'link-selected': linkSelected,
      'menu-open': showInsertMenu || showStyleMenu,
      'connect-mode': connectMode,
      connecting: connectingFrom === block.id,
      'connect-target': connectMode && connectingFrom && connectingFrom !== block.id,
      [`block-color-${block.color || 'green'}`]: true,
      [`block-border-${block.borderStyle || 'solid'}`]: true
    }"
    :style="blockStyle"
    @mousedown.stop="onMouseDown"
    @click.stop="onClick"
  >
    <div v-if="!readOnly" class="block-header">
      <div class="block-drag-handle">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="9" cy="6" r="1" fill="currentColor"/>
          <circle cx="15" cy="6" r="1" fill="currentColor"/>
          <circle cx="9" cy="12" r="1" fill="currentColor"/>
          <circle cx="15" cy="12" r="1" fill="currentColor"/>
          <circle cx="9" cy="18" r="1" fill="currentColor"/>
          <circle cx="15" cy="18" r="1" fill="currentColor"/>
        </svg>
      </div>
      <div v-if="!readOnly" class="block-actions">
        <button v-if="block.type !== 'image'" class="action-btn" @click.stop="$emit('add-image', block.id)" :title="`插入图片 ${sc('insertImage')}`.trim()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button v-if="block.type !== 'note-link' && block.type !== 'image'" class="action-btn" @click.stop="openLinkModal" :title="`插入链接 ${sc('insertLink')}`.trim()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
        <button v-if="block.type !== 'note-link' && block.type !== 'image'" class="action-btn" @click.stop="$emit('add-note-link', block.id)" :title="`引用笔记 ${sc('insertQuote')}`.trim()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </button>
        <div v-if="block.type !== 'note-link' && block.type !== 'image'" class="insert-menu-wrap">
          <button class="action-btn" @mousedown.prevent @click.stop="showInsertMenu = !showInsertMenu" title="插入">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <div v-if="showInsertMenu" class="insert-menu" @click.stop>
            <button class="insert-item" @mousedown.prevent @click="insertList('ul')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <circle cx="3.5" cy="6" r="1.5" fill="currentColor" stroke="none"/>
                <circle cx="3.5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                <circle cx="3.5" cy="18" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
              <span>无序列表</span>
              <span class="shortcut-hint">{{ sc('insertUL') }}</span>
            </button>
            <button class="insert-item" @mousedown.prevent @click="insertList('ol')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="10" y1="6" x2="21" y2="6"/>
                <line x1="10" y1="12" x2="21" y2="12"/>
                <line x1="10" y1="18" x2="21" y2="18"/>
                <path d="M4 6h1v4"/>
                <path d="M4 10h2"/>
                <path d="M6 16H4l2-2v2H4"/>
              </svg>
              <span>有序列表</span>
              <span class="shortcut-hint">{{ sc('insertOL') }}</span>
            </button>
            <div class="table-picker-wrap">
              <button class="insert-item" @mousedown.prevent @click="toggleTablePicker">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="3" y="3" width="18" height="18" rx="1"/>
                  <line x1="3" y1="9" x2="21" y2="9"/>
                  <line x1="3" y1="15" x2="21" y2="15"/>
                  <line x1="9" y1="3" x2="9" y2="21"/>
                  <line x1="15" y1="3" x2="15" y2="21"/>
                </svg>
                <span>表格</span>
                <span class="shortcut-hint">{{ sc('insertTable') }}</span>
              </button>
              <div v-if="showTablePicker" class="table-grid-picker" @click.stop>
                <div class="table-grid">
                  <div
                    v-for="n in 36"
                    :key="n"
                    class="grid-cell"
                    :class="{ active: isCellActive(n) }"
                    @mousedown.prevent
                    @mouseover="onCellHover(n)"
                    @click="onTableGridSelect(n)"
                  ></div>
                </div>
                <div class="table-grid-label">{{ tableHoverRows }} × {{ tableHoverCols }}</div>
              </div>
            </div>
            <button class="insert-item" @mousedown.prevent @click="insertCodeBlock">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="16 18 22 12 16 6"/>
                <polyline points="8 6 2 12 8 18"/>
              </svg>
              <span>代码块</span>
              <span class="shortcut-hint">{{ sc('insertCode') }}</span>
            </button>
          </div>
        </div>
        <button class="action-btn delete" @click.stop="$emit('delete', block.id)" title="删除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    <div class="block-content">
      <div v-if="block.type === 'image' && block.imageUrl" class="image-container" :class="{ overflow: imageOverflow }" @dblclick.stop="!readOnly && $emit('add-image', block.id)" @wheel.stop>
        <img :src="resolvedImageUrl" alt="" draggable="false" @click.stop="$emit('preview-image', resolvedImageUrl)" @load="onImageLoad" />
        <button v-if="!readOnly" class="change-image-btn" @click.stop="$emit('add-image', block.id)">更换图片</button>
      </div>

      <div
        v-else-if="block.type === 'note-link' && block.linkedNoteId"
        class="note-link-block"
        @click.stop="$emit('open-note', { noteId: block.linkedNoteId, blockId: block.linkedBlockId || null, textRange: block.linkedTextRange || null })"
        @wheel.stop
      >
        <div class="note-link-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="note-link-info">
          <div class="note-link-title">{{ linkedNoteTitle }}</div>
          <div v-if="block.linkedBlockId && linkedBlockPreview" class="note-link-snippet">
            <span class="note-link-quote-mark">"</span>{{ linkedBlockPreview }}<span class="note-link-quote-mark">"</span>
          </div>
          <div class="note-link-desc">{{ block.linkedBlockId ? '点击跳转到引用内容' : '点击跳转到该笔记' }}</div>
        </div>
      </div>

      <div
        v-else
        ref="editorRef"
        class="text-editor"
        :class="{ 'read-only': readOnly || linkSelectionMode }"
        :contenteditable="!readOnly && !linkSelectionMode"
        spellcheck="false"
        :style="editorStyle"
        :data-placeholder="block.content ? '' : '点击输入内容...'"
        @input="onInput"
        @blur="onBlur"
        @paste="onPaste"
        @keydown="onEditorKeyDown"
        @mouseup="saveSelection"
        @keyup="saveSelection"
        @focus="saveSelection"
        @wheel.stop
        @mousedown.stop
      ></div>
    </div>

    <div
      v-if="connectMode"
      class="connect-dot connect-dot-top"
      @mousedown.stop="$emit('connect-start', block.id, 'top')"
      @mouseup.stop="$emit('connect-end', block.id, 'top')"
    ></div>
    <div
      v-if="connectMode"
      class="connect-dot connect-dot-right"
      @mousedown.stop="$emit('connect-start', block.id, 'right')"
      @mouseup.stop="$emit('connect-end', block.id, 'right')"
    ></div>
    <div
      v-if="connectMode"
      class="connect-dot connect-dot-bottom"
      @mousedown.stop="$emit('connect-start', block.id, 'bottom')"
      @mouseup.stop="$emit('connect-end', block.id, 'bottom')"
    ></div>
    <div
      v-if="connectMode"
      class="connect-dot connect-dot-left"
      @mousedown.stop="$emit('connect-start', block.id, 'left')"
      @mouseup.stop="$emit('connect-end', block.id, 'left')"
    ></div>

    <template v-if="!connectMode && !readOnly">
      <div class="resize-handle resize-handle-se" @mousedown.stop="onResizeStart($event, 'se')"></div>
      <div class="resize-handle resize-handle-sw" @mousedown.stop="onResizeStart($event, 'sw')"></div>
      <div class="resize-handle resize-handle-ne" @mousedown.stop="onResizeStart($event, 'ne')"></div>
      <div class="resize-handle resize-handle-nw" @mousedown.stop="onResizeStart($event, 'nw')"></div>
      <div class="resize-handle resize-handle-e" @mousedown.stop="onResizeStart($event, 'e')"></div>
      <div class="resize-handle resize-handle-s" @mousedown.stop="onResizeStart($event, 's')"></div>
      <div class="resize-handle resize-handle-w" @mousedown.stop="onResizeStart($event, 'w')"></div>
      <div class="resize-handle resize-handle-n" @mousedown.stop="onResizeStart($event, 'n')"></div>
    </template>
  </div>

  <Teleport to="body">
    <div v-if="showLinkModal" class="modal-overlay" @click.self="closeLinkModal">
      <div class="modal-content" style="padding: 20px; width: 360px;">
        <h3 style="margin-bottom: 16px; font-size: 16px;">插入链接</h3>
        <input
          v-model="linkText"
          type="text"
          class="input"
          placeholder="链接文字"
          style="margin-bottom: 12px;"
        />
        <input
          v-model="linkUrl"
          type="text"
          class="input"
          placeholder="链接地址 (https://...)"
          style="margin-bottom: 16px;"
        />
        <div style="display: flex; gap: 10px; justify-content: flex-end;">
          <button class="btn btn-secondary" @click="closeLinkModal">取消</button>
          <button class="btn btn-primary" @click="insertLink">插入</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import { useShortcutStore } from '@/stores/shortcut'
import { resolveImageUrl, isImageRef } from '@/utils/imageStore'
import { markdownToHtml, convertInlineMd, isLikelyMarkdown, escapeHtml, splitTableCells } from '@/utils/markdown'

const shortcutStore = useShortcutStore()
shortcutStore.init()

const SHORTCUT_DISPLAY = { Ctrl: 'Ctrl', Shift: 'Shift', Alt: 'Alt', Up: '↑', Down: '↓', Left: '←', Right: '→', Space: '空格', Del: 'Del', Esc: 'Esc', Enter: 'Enter' }
function sc(actionId) {
  const combo = shortcutStore.getCombo(actionId)
  if (!combo) return ''
  return combo.split('+').map(p => SHORTCUT_DISPLAY[p] || p).join('+')
}

const props = defineProps({
  block: Object,
  selected: Boolean,
  connectMode: Boolean,
  connectingFrom: String,
  readOnly: Boolean,
  highlighted: Boolean,
  hideHighlightUnderline: Boolean,
  syncVersion: Number,
  linkSelectionMode: Boolean,
  linkSelected: Boolean
})

const resolvedImageUrl = ref('')
watch(
  () => props.block?.imageUrl,
  async (url) => {
    if (!url) { resolvedImageUrl.value = ''; return }
    if (isImageRef(url)) {
      resolvedImageUrl.value = await resolveImageUrl(url)
    } else {
      resolvedImageUrl.value = url
    }
  },
  { immediate: true }
)

const emit = defineEmits([
  'select',
  'update',
  'delete',
  'drag-start',
  'drag-move',
  'drag-end',
  'connect-start',
  'connect-end',
  'add-image',
  'add-link',
  'add-note-link',
  'preview-image',
  'open-note',
  'resize',
  'resize-block',
  'save-selection',
  'save-history',
  'blur',
  'link-select-block',
  'link-select-text'
])

const noteStore = useNoteStore()
const blockRef = ref(null)
const editorRef = ref(null)
const showLinkModal = ref(false)
const showInsertMenu = ref(false)
const showTablePicker = ref(false)
const tableHoverRows = ref(1)
const tableHoverCols = ref(1)
const linkText = ref('')
const linkUrl = ref('')
const imageOverflow = ref(false)
let resizeObserver = null
let caretTextOffset = -1

const linkedNoteTitle = computed(() => {
  const note = noteStore.notes.find(n => n.id === props.block.linkedNoteId && !n.deleted)
  return note?.title || '已删除的笔记'
})

const linkedBlockPreview = computed(() => {
  if (!props.block.linkedBlockId) return ''
  const targetNote = noteStore.notes.find(n => n.id === props.block.linkedNoteId && !n.deleted)
  if (!targetNote) return ''
  const targetBlock = (targetNote.blocks || []).find(b => b.id === props.block.linkedBlockId)
  if (!targetBlock) return ''
  if (props.block.linkedTextRange && props.block.linkedTextRange.text) {
    return props.block.linkedTextRange.text
  }
  const text = String(targetBlock.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length > 60 ? text.slice(0, 60) + '…' : text
})

const blockStyle = computed(() => {
  const style = {
    left: `${props.block.x}px`,
    top: `${props.block.y}px`,
    width: `${props.block.width || 220}px`
  }
  const isAutoSize = props.block.type === 'image' || props.block.type === 'note-link'
  if (!isAutoSize && props.block.height && props.block.height > 0) {
    style.height = `${props.block.height}px`
  } else if (props.block.height && props.block.height > 0) {
    style.minHeight = `${props.block.height}px`
  } else {
    style.minHeight = `${props.block.minHeight || 60}px`
  }
  if (props.block.borderColor) {
    style.borderColor = props.block.borderColor
  }
  return style
})

const editorStyle = computed(() => ({
  fontSize: `${props.block.fontSize || 14}px`,
  fontWeight: props.block.fontWeight || 400,
  color: props.block.textColor || 'var(--text-primary)'
}))

watch(
  () => props.block.content,
  value => {
    if (editorRef.value && document.activeElement !== editorRef.value) {
      editorRef.value.innerHTML = value || ''
    }
  }
)

watch(
  () => props.syncVersion,
  () => {
    if (editorRef.value) {
      editorRef.value.innerHTML = props.block.content || ''
      if (caretTextOffset >= 0) {
        const newRange = offsetToRange(editorRef.value, caretTextOffset)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(newRange)
        caretTextOffset = -1
      }
    }
  }
)

function syncEditorContent() {
  if (editorRef.value && document.activeElement !== editorRef.value) {
    editorRef.value.innerHTML = props.block.content || ''
  }
}

function onClick() {
  if (props.linkSelectionMode) {
    const sel = window.getSelection()
    if (sel && !sel.isCollapsed && sel.toString().trim()) {
      if (editorRef.value && editorRef.value.contains(sel.anchorNode)) {
        return
      }
      window.getSelection()?.removeAllRanges()
    }
    emit('link-select-block', props.block.id)
    return
  }
  emit('select', props.block.id)
}

function onMouseDown(e) {
  if (props.linkSelectionMode) return
  if (e.target.closest('.action-btn') || e.target.closest('.style-menu') || e.target.closest('.connect-dot') || e.target.closest('.resize-handle') || e.target.closest('.insert-menu') || e.target.closest('.table-grid-picker')) {
    return
  }
  if (e.target.closest('.text-editor')) {
    return
  }
  emit('drag-start', props.block.id, e.clientX, e.clientY)
}

function onInput(e) {
  emit('update', props.block.id, { content: e.target.innerHTML })
  saveSelection()
}

function onBlur() {
  if (editorRef.value) {
    emit('update', props.block.id, { content: editorRef.value.innerHTML })
    emit('blur', props.block.id)
  }
}

function saveSelection() {
  if (!editorRef.value) return
  const selection = window.getSelection()
  if (!selection) return

  if (props.linkSelectionMode) {
    if (selection.rangeCount > 0 && !selection.isCollapsed) {
      const range = selection.getRangeAt(0)
      if (editorRef.value.contains(range.commonAncestorContainer)) {
        const { start, end, text } = rangeToTextOffset(editorRef.value, range)
        if (text && text.trim()) {
          emit('link-select-text', { blockId: props.block.id, start, end, text: text.trim() })
        }
      }
    }
    return
  }

  if (document.activeElement !== editorRef.value) return

  if (selection.rangeCount === 0) {
    const range = document.createRange()
    range.selectNodeContents(editorRef.value)
    range.collapse(false)
    selection.removeAllRanges()
    selection.addRange(range)
  }

  const range = selection.getRangeAt(0)
  if (range.collapsed && editorRef.value.contains(range.startContainer)) {
    const { start } = rangeToTextOffset(editorRef.value, range)
    caretTextOffset = start
  }
  emit('save-selection', props.block.id, range.cloneRange())
}

function rangeToTextOffset(root, range) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  let pos = 0
  let start = -1
  let end = -1
  let text = ''
  let node
  while ((node = walker.nextNode())) {
    const len = node.textContent.length
    const nodeStart = pos
    const nodeEnd = pos + len
    if (start === -1 && range.startContainer === node) {
      start = nodeStart + range.startOffset
    }
    if (end === -1 && range.endContainer === node) {
      end = nodeEnd
      if (range.endContainer === node) end = nodeStart + range.endOffset
    }
    text += node.textContent
    pos = nodeEnd
  }
  if (start === -1) start = 0
  if (end === -1) end = text.length
  return { start, end, text: text.slice(start, end) }
}

function offsetToRange(root, offset) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const range = document.createRange()
  let pos = 0
  let node
  while ((node = walker.nextNode())) {
    const len = node.textContent.length
    if (offset <= pos + len) {
      range.setStart(node, Math.max(0, offset - pos))
      range.collapse(true)
      return range
    }
    pos += len
  }
  range.selectNodeContents(root)
  range.collapse(false)
  return range
}

let isNormalizing = false
function onSelectionChange() {
  if (isNormalizing) return
  if (!editorRef.value || document.activeElement !== editorRef.value) return
  const sel = window.getSelection()
  if (!sel || !sel.isCollapsed || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  const node = range.startContainer
  if (node.nodeType !== Node.TEXT_NODE || range.startOffset !== 0) return
  if (!editorRef.value.contains(node)) return
  const li = node.parentElement
  if (!li || li.tagName !== 'LI') return
  if (!li.querySelector('ul, ol')) return
  if (li.firstChild !== node) return
  isNormalizing = true
  const newRange = document.createRange()
  newRange.selectNodeContents(node)
  newRange.collapse(false)
  sel.removeAllRanges()
  sel.addRange(newRange)
  isNormalizing = false
}

function onImageLoad(e) {
  const img = e.target
  imageOverflow.value = img && img.naturalHeight > 150
}

function onPaste(e) {
  const text = e.clipboardData?.getData('text/plain') || ''
  if (text && isLikelyMarkdown(text)) {
    e.preventDefault()
    emit('save-history')
    const html = markdownToHtml(text)
    insertBlocksAtCursor(html)
    emit('update', props.block.id, { content: editorRef.value.innerHTML })
    return
  }
  e.preventDefault()
  document.execCommand('insertText', false, text)
}

function insertBlocksAtCursor(html) {
  const editor = editorRef.value
  if (!editor) return
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) {
    editor.innerHTML += html
    return
  }
  let range = sel.getRangeAt(0)
  if (!editor.contains(range.commonAncestorContainer)) {
    range = document.createRange()
    range.selectNodeContents(editor)
    range.collapse(false)
  }

  const temp = document.createElement('div')
  temp.innerHTML = html
  const hasBlock = [...temp.children].some(n => ['P', 'PRE', 'UL', 'OL', 'TABLE', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'HR'].includes(n.tagName))

  if (!hasBlock) {
    range.deleteContents()
    const frag = document.createDocumentFragment()
    while (temp.firstChild) frag.appendChild(temp.firstChild)
    range.insertNode(frag)
    range.collapse(false)
    sel.removeAllRanges()
    sel.addRange(range)
    return
  }

  range.deleteContents()

  let blockParent = null
  let node = range.startContainer
  while (node && node !== editor) {
    if (node.nodeType === 1 && ['P', 'PRE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'DIV'].includes(node.tagName)) {
      blockParent = node
      break
    }
    node = node.parentNode
  }

  if (!blockParent) {
    const frag = document.createDocumentFragment()
    while (temp.firstChild) frag.appendChild(temp.firstChild)
    range.insertNode(frag)
    return
  }

  const offsetInBlock = range.startOffset
  const parts = splitNodeAtOffset(blockParent, range.startContainer, offsetInBlock)
  const afterNode = parts.afterNode

  const frag = document.createDocumentFragment()
  while (temp.firstChild) frag.appendChild(temp.firstChild)
  if (afterNode && afterNode.parentNode === blockParent.parentNode) {
    blockParent.parentNode.insertBefore(frag, afterNode)
  } else {
    blockParent.parentNode.appendChild(frag)
  }

  if (afterNode && afterNode.parentNode) {
    const newRange = document.createRange()
    newRange.setStart(afterNode, 0)
    newRange.collapse(true)
    sel.removeAllRanges()
    sel.addRange(newRange)
  }

  editor.querySelectorAll('p, h1, h2, h3, h4, h5, h6').forEach(el => {
    if (el !== editor && el.textContent.trim() === '' && !el.querySelector('img,br')) {
      el.remove()
    }
  })
  if (editor.children.length === 0) {
    editor.innerHTML = '<p><br></p>'
  }
}

function splitNodeAtOffset(blockEl, startContainer, offset) {
  if (startContainer === blockEl) {
    const children = [...blockEl.childNodes]
    const before = document.createDocumentFragment()
    const afterNode = document.createElement(blockEl.tagName)
    for (let i = 0; i < offset && children.length; i++) before.appendChild(children.shift())
    while (children.length) afterNode.appendChild(children.shift())
    if (afterNode.childNodes.length === 0) afterNode.appendChild(document.createElement('br'))
    blockParentReplace(blockEl, before, afterNode)
    return { afterNode }
  }
  if (startContainer.nodeType === 3) {
    const text = startContainer.textContent
    const beforeText = text.slice(0, offset)
    const afterText = text.slice(offset)
    startContainer.textContent = beforeText
    const afterNode = blockEl.cloneNode(false)
    if (afterText) afterNode.textContent = afterText
    else afterNode.appendChild(document.createElement('br'))
    if (blockEl.parentNode) {
      blockEl.parentNode.insertBefore(afterNode, blockEl.nextSibling)
    }
    return { afterNode }
  }
  return { afterNode: blockEl }
}

function blockParentReplace(oldNode, beforeFrag, afterNode) {
  const parent = oldNode.parentNode
  if (!parent) return
  parent.insertBefore(beforeFrag, oldNode)
  parent.insertBefore(afterNode, oldNode.nextSibling)
  parent.removeChild(oldNode)
}

function onEditorKeyDown(e) {
  if (e.key === 'Tab' && !e.ctrlKey && !e.metaKey && !e.altKey) {
    e.preventDefault()
    document.execCommand('insertHTML', false, '&nbsp;&nbsp;')
    return
  }

  const insertMap = [
    ['insertUL',   () => insertList('ul')],
    ['insertOL',   () => insertList('ol')],
    ['insertCode', () => insertCodeBlock()],
    ['insertTable',() => insertTable(3, 3)],
    ['insertLink', () => openLinkModal()],
    ['insertImage',() => emit('add-image', props.block.id)],
    ['insertQuote',() => emit('add-note-link', props.block.id)]
  ]
  for (const [actionId, handler] of insertMap) {
    if (shortcutStore.matches(e, actionId)) {
      if (props.block.type === 'note-link' || props.block.type === 'image') return
      e.preventDefault()
      handler()
      return
    }
  }
}

function focusEditorAtEnd() {
  if (editorRef.value && document.activeElement === editorRef.value) return
  editorRef.value?.focus()
  if (editorRef.value) {
    const range = document.createRange()
    range.selectNodeContents(editorRef.value)
    range.collapse(false)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
  }
}

function formatSelection(command, value = null) {
  if (!editorRef.value) return false
  editorRef.value.focus()
  const sel = window.getSelection()

  let hasSelection = false
  if (sel && sel.rangeCount > 0) {
    const r = sel.getRangeAt(0)
    if (!r.collapsed && editorRef.value.contains(r.commonAncestorContainer)) {
      hasSelection = true
    }
  }

  if (!hasSelection) {
    const fullRange = document.createRange()
    fullRange.selectNodeContents(editorRef.value)
    sel.removeAllRanges()
    sel.addRange(fullRange)
  }

  if (command === 'foreColor' || command === 'hiliteColor') {
    document.execCommand('styleWithCSS', false, true)
    document.execCommand(command, false, value)
    document.execCommand('styleWithCSS', false, false)
  } else if (command === 'fontSize') {
    applyInlineStyle({ fontSize: value + 'px' })
  } else if (command === 'fontWeight') {
    applyInlineStyle({ fontWeight: value })
  } else {
    document.execCommand(command, false, value)
  }
  emit('update', props.block.id, { content: editorRef.value.innerHTML })
  return true
}

function applyInlineStyle(props) {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)
  if (range.collapsed) return

  const span = document.createElement('span')
  if (props.fontSize) span.style.fontSize = props.fontSize
  if (props.fontWeight) span.style.fontWeight = props.fontWeight

  span.appendChild(range.extractContents())
  range.insertNode(span)

  const target = mergeUpward(span, props) || span
  cleanupEmptySpans(editorRef.value)

  if (editorRef.value.contains(target)) {
    sel.removeAllRanges()
    const newRange = document.createRange()
    newRange.selectNodeContents(target)
    sel.addRange(newRange)
  }
}

function mergeUpward(span, props) {
  const parent = span.parentNode
  if (!parent || parent.nodeType !== 1 || parent.tagName !== 'SPAN' || !parent.style.cssText) return null
  if (parent.children.length !== 1 || parent.children[0] !== span) return null
  if (parent.textContent.trim() !== span.textContent.trim()) return null
  const css = parent.style.cssText
  const stripped = css.replace(/font-size[^;]*;?/g, '').replace(/font-weight[^;]*;?/g, '').trim()
  let merged = false
  if (props.fontSize && /font-size/.test(css) && !stripped) {
    parent.style.fontSize = props.fontSize
    merged = true
  } else if (props.fontWeight && /font-weight/.test(css) && !stripped) {
    parent.style.fontWeight = props.fontWeight
    merged = true
  }
  if (merged) {
    while (span.firstChild) parent.insertBefore(span.firstChild, span)
    parent.removeChild(span)
    return parent
  }
  return null
}

function cleanupEmptySpans(root) {
  root.querySelectorAll('span').forEach(s => {
    if (!s.hasChildNodes()) s.remove()
  })
}

function clearInlineStyle(prop) {
  if (!editorRef.value) return
  if (prop === 'fontWeight') {
    editorRef.value.querySelectorAll('b, strong').forEach(b => {
      const txt = document.createTextNode(b.textContent)
      b.replaceWith(txt)
    })
  }
  const spans = editorRef.value.querySelectorAll('span[style]')
  spans.forEach(s => {
    if (prop === 'fontSize') s.style.removeProperty('font-size')
    if (prop === 'fontWeight') s.style.removeProperty('font-weight')
    if (!s.style.cssText) {
      const parent = s.parentNode
      while (s.firstChild) parent.insertBefore(s.firstChild, s)
      parent.removeChild(s)
    }
  })
  emit('update', props.block.id, { content: editorRef.value.innerHTML })
}

defineExpose({ formatSelection, clearInlineStyle })

function insertList(type) {
  showInsertMenu.value = false
  focusEditorAtEnd()
  const tag = type === 'ol' ? 'ol' : 'ul'

  const sel = window.getSelection()
  const anchor = sel?.anchorNode
  if (anchor && editorRef.value?.contains(anchor)) {
    let liNode = anchor.nodeType === Node.ELEMENT_NODE ? anchor : anchor.parentElement
    while (liNode && liNode !== editorRef.value) {
      if (liNode.tagName === 'LI') {
        let existing = liNode.querySelector(tag)
        if (existing) {
          const item = document.createElement('li')
          item.textContent = '子列表项'
          existing.appendChild(item)
        } else {
          const sub = document.createElement(tag)
          const item = document.createElement('li')
          item.textContent = '子列表项'
          sub.appendChild(item)
          liNode.appendChild(sub)
        }
        const range = document.createRange()
        range.selectNodeContents(liNode.querySelector(`${tag} li:last-child`))
        range.collapse(false)
        sel.removeAllRanges()
        sel.addRange(range)
        emit('update', props.block.id, { content: editorRef.value.innerHTML })
        return
      }
      liNode = liNode.parentElement
    }
  }

  const html = `<${tag}><li>列表项</li></${tag}>`
  document.execCommand('insertHTML', false, html)
  emit('update', props.block.id, { content: editorRef.value.innerHTML })
}

function insertCodeBlock() {
  showInsertMenu.value = false
  focusEditorAtEnd()
  const html = `<pre><code>// 在此输入代码</code></pre><p><br></p>`
  document.execCommand('insertHTML', false, html)
  emit('update', props.block.id, { content: editorRef.value.innerHTML })
}

function toggleTablePicker() {
  showTablePicker.value = !showTablePicker.value
  tableHoverRows.value = 1
  tableHoverCols.value = 1
}

function isCellActive(n) {
  const row = Math.ceil(n / 6)
  const col = ((n - 1) % 6) + 1
  return row <= tableHoverRows.value && col <= tableHoverCols.value
}

function onCellHover(n) {
  tableHoverRows.value = Math.ceil(n / 6)
  tableHoverCols.value = ((n - 1) % 6) + 1
}

function onTableGridSelect() {
  insertTable(tableHoverRows.value, tableHoverCols.value)
}

function insertTable(rows = 3, cols = 3) {
  showInsertMenu.value = false
  showTablePicker.value = false
  focusEditorAtEnd()
  let html = '<table>'
  for (let r = 0; r < rows; r++) {
    html += '<tr>'
    for (let c = 0; c < cols; c++) {
      const cellText = r === 0 ? `列${c + 1}` : ''
      html += r === 0
        ? `<th>${cellText}</th>`
        : `<td>${cellText}</td>`
    }
    html += '</tr>'
  }
  html += '</table><p><br></p>'
  document.execCommand('insertHTML', false, html)
  emit('update', props.block.id, { content: editorRef.value.innerHTML })
}

function openLinkModal() {
  linkText.value = ''
  linkUrl.value = ''
  showLinkModal.value = true
}

function closeLinkModal() {
  showLinkModal.value = false
}

function insertLink() {
  if (!linkUrl.value.trim()) {
    closeLinkModal()
    return
  }
  const text = linkText.value || linkUrl.value
  const html = `<a href="${linkUrl.value}" target="_blank" rel="noopener noreferrer">${text}</a>`
  const newContent = (props.block.content || '') + html
  emit('update', props.block.id, { content: newContent })
  closeLinkModal()
}

function reportResize() {
  if (!blockRef.value) return
  const el = blockRef.value
  const width = el.offsetWidth
  const height = el.offsetHeight
  if (width > 0 && height > 0) {
    emit('resize', { id: props.block.id, width, height })
  }
}

let resizingInfo = null

function onResizeStart(e, dir) {
  e.preventDefault()
  const block = props.block
  const domHeight = blockRef.value ? blockRef.value.offsetHeight : 0
  resizingInfo = {
    dir,
    startX: e.clientX,
    startY: e.clientY,
    startLeft: block.x,
    startTop: block.y,
    startWidth: block.width || 240,
    startHeight: Math.max(domHeight, block.height || block.minHeight || 80)
  }
  document.addEventListener('mousemove', onResizeMove)
  document.addEventListener('mouseup', onResizeEnd)
}

function onResizeMove(e) {
  if (!resizingInfo) return
  const dx = e.clientX - resizingInfo.startX
  const dy = e.clientY - resizingInfo.startY
  const { dir, startLeft, startTop, startWidth, startHeight } = resizingInfo
  const minW = 120
  const minH = 60
  let newWidth = startWidth
  let newHeight = startHeight
  let newX = startLeft
  let newY = startTop

  if (dir.includes('e')) {
    newWidth = Math.max(minW, startWidth + dx)
  }
  if (dir.includes('s')) {
    newHeight = Math.max(minH, startHeight + dy)
  }
  if (dir.includes('w')) {
    newWidth = Math.max(minW, startWidth - dx)
    newX = startLeft + (startWidth - newWidth)
  }
  if (dir.includes('n')) {
    newHeight = Math.max(minH, startHeight - dy)
    newY = startTop + (startHeight - newHeight)
  }

  emit('resize-block', {
    id: props.block.id,
    width: newWidth,
    height: newHeight,
    x: newX,
    y: newY
  })
}

function onResizeEnd() {
  if (!resizingInfo) return
  resizingInfo = null
  document.removeEventListener('mousemove', onResizeMove)
  document.removeEventListener('mouseup', onResizeEnd)
}

function closeInsertMenu(e) {
  if (e.target.closest('.insert-menu-wrap') || e.target.closest('.table-grid-picker')) return
  showInsertMenu.value = false
  showTablePicker.value = false
}

onMounted(() => {
  document.addEventListener('click', closeInsertMenu, true)
  document.addEventListener('selectionchange', onSelectionChange)
  nextTick(() => {
    syncEditorContent()
    reportResize()
    if (blockRef.value && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        reportResize()
      })
      resizeObserver.observe(blockRef.value)
    }
  })
})

onUnmounted(() => {
  document.removeEventListener('click', closeInsertMenu, true)
  document.removeEventListener('selectionchange', onSelectionChange)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style scoped>
.note-block {
  position: absolute;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  display: flex;
  flex-direction: column;
  cursor: move;
}

.note-block.selected {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-soft), var(--shadow-md);
}

.note-block.connecting {
  border-color: var(--primary-color);
}

.note-block.connect-target {
  border-color: var(--info-color);
  box-shadow: 0 0 0 2px var(--info-soft), var(--shadow-md);
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 10px 0;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.note-block:hover .block-header,
.note-block.selected .block-header,
.note-block.menu-open .block-header {
  opacity: 1;
}

.block-drag-handle {
  color: var(--text-tertiary);
  cursor: move;
}

.block-actions {
  display: flex;
  align-items: center;
  gap: 4px;
}

.action-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.action-btn.delete:hover {
  color: var(--warning-color);
  background: rgba(217, 118, 118, 0.1);
}

.insert-menu-wrap {
  position: relative;
}

.insert-menu {
  position: absolute;
  top: 28px;
  right: 0;
  z-index: 30;
  min-width: 190px;
  padding: 4px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.insert-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 13px;
  text-align: left;
  transition: background var(--transition-fast);
}

.insert-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.insert-item .shortcut-hint {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-tertiary);
  font-family: ui-monospace, monospace;
}

.table-picker-wrap {
  position: relative;
}

.table-grid-picker {
  position: absolute;
  left: 100%;
  top: 0;
  margin-left: 6px;
  z-index: 40;
  padding: 8px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.table-grid {
  display: grid;
  grid-template-columns: repeat(6, 18px);
  grid-template-rows: repeat(6, 18px);
  gap: 3px;
}

.grid-cell {
  width: 18px;
  height: 18px;
  border: 1px solid var(--border-light);
  border-radius: 3px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.grid-cell.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.table-grid-label {
  margin-top: 6px;
  text-align: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.block-content {
  padding: 10px 12px 12px;
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.note-block.link-selection-mode {
  cursor: pointer;
}

.note-block.link-selection-mode:hover {
  box-shadow: 0 0 0 2px var(--primary-color);
}

.note-block.link-selected {
  box-shadow: 0 0 0 3px var(--primary-color) !important;
  z-index: 20;
}

.note-block.link-selection-mode .text-editor {
  cursor: text;
  user-select: text;
}

:deep(mark.ref-text-highlight) {
  background: transparent;
  color: var(--primary-color);
  font-weight: 700;
  padding: 0 1px;
  border-radius: 3px;
  display: inline-block;
  animation: ref-text-breathe 1.6s ease-in-out infinite;
}

@keyframes ref-text-breathe {
  0%, 100% {
    text-shadow: 0 0 4px var(--primary-soft, rgba(106, 167, 134, 0.35));
  }
  50% {
    text-shadow: 0 0 10px var(--primary-color);
  }
}

.text-editor {
  flex: 1;
  min-height: 0;
  outline: none;
  color: var(--text-primary);
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
  cursor: text;
  overflow: auto;
}

.text-editor:empty::before {
  content: attr(data-placeholder);
  color: var(--text-tertiary);
}

.text-editor :deep(a) {
  color: var(--primary-dark);
  text-decoration: underline;
}

.text-editor :deep(ul),
.text-editor :deep(ol) {
  margin: 6px 0;
  padding-left: 24px;
}

.text-editor :deep(li) {
  margin: 2px 0;
}

.text-editor :deep(ul li::marker) {
  color: var(--primary-color);
}

.text-editor :deep(ol > li::marker) {
  color: var(--primary-color);
  font-weight: 600;
}

.text-editor :deep(li ol > li::marker) {
  color: var(--info-color, #4a90d9);
  font-weight: 500;
}

.text-editor :deep(li ol li ol > li::marker) {
  color: var(--text-tertiary);
  font-weight: 500;
}

.text-editor :deep(li ul),
.text-editor :deep(li ol) {
  margin: 2px 0 4px;
}

.text-editor :deep(li ul li::marker) {
  content: '◦';
  color: var(--text-tertiary);
}

.text-editor :deep(li ul li ul li::marker) {
  content: '▪';
  color: var(--text-tertiary);
}

.text-editor :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin: 8px 0;
  font-size: 13px;
}

.text-editor :deep(th),
.text-editor :deep(td) {
  border: 1px solid var(--border-color);
  padding: 6px 10px;
  text-align: left;
  min-width: 40px;
  min-height: 28px;
  height: 28px;
}

.text-editor :deep(th) {
  background: var(--bg-tertiary);
  font-weight: 600;
}

.text-editor :deep(pre) {
  position: relative;
  margin: 8px 0;
  padding: 10px 12px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-left: 3px solid var(--primary-color);
  border-radius: var(--radius-sm);
  overflow-x: auto;
}

.text-editor :deep(pre code) {
  display: block;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  color: var(--text-primary);
  white-space: pre;
  line-height: 1.5;
  background: none;
  padding: 0;
}

.text-editor :deep(h1),
.text-editor :deep(h2),
.text-editor :deep(h3),
.text-editor :deep(h4),
.text-editor :deep(h5),
.text-editor :deep(h6) {
  margin: 10px 0 6px;
  font-weight: 700;
  line-height: 1.3;
}

.text-editor :deep(h1) { font-size: 1.6em; }
.text-editor :deep(h2) { font-size: 1.4em; }
.text-editor :deep(h3) { font-size: 1.2em; }
.text-editor :deep(h4) { font-size: 1.05em; }

.text-editor :deep(blockquote) {
  margin: 8px 0;
  padding: 4px 12px;
  border-left: 3px solid var(--primary-color);
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}

.text-editor :deep(hr) {
  border: none;
  border-top: 1px solid var(--border-color);
  margin: 10px 0;
}

.text-editor :deep(code) {
  padding: 1px 5px;
  background: var(--bg-tertiary);
  border-radius: 3px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 0.92em;
}

.text-editor.read-only {
  cursor: default;
}

.image-container {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
  max-height: 150px;
}

.image-container img {
  width: 100%;
  max-height: 150px;
  display: block;
  object-fit: cover;
  border-radius: var(--radius-md);
  cursor: zoom-in;
}

.image-container.overflow::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 28px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.35), rgba(0, 0, 0, 0));
  pointer-events: none;
  border-bottom-left-radius: var(--radius-md);
  border-bottom-right-radius: var(--radius-md);
}

.change-image-btn {
  position: absolute;
  right: 8px;
  bottom: 8px;
  font-size: 12px;
  padding: 4px 8px;
  background: rgba(26, 31, 28, 0.72);
  color: #fff;
  border-radius: 999px;
}

.note-link-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px;
  background: var(--primary-soft);
  border-radius: var(--radius-md);
  cursor: pointer;
}

.note-link-icon {
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

.note-link-info {
  min-width: 0;
}

.note-link-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-link-desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.note-link-snippet {
  margin-top: 4px;
  padding: 6px 8px;
  background: var(--bg-tertiary);
  border-left: 3px solid var(--primary-color);
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-secondary);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-link-quote-mark {
  color: var(--primary-color);
  font-weight: 700;
  margin: 0 2px;
}

.note-block.highlighted {
  animation: ref-pulse 1.2s ease-out;
  box-shadow: 0 0 0 2px var(--primary-color), var(--shadow-lg) !important;
  z-index: 50;
}

.note-block.highlighted .text-editor,
.note-block.highlighted .note-link-block {
  position: relative;
}

@keyframes ref-pulse {
  0% { box-shadow: 0 0 0 0 rgba(106, 167, 134, 0.5); }
  60% { box-shadow: 0 0 0 12px rgba(106, 167, 134, 0); }
  100% { box-shadow: 0 0 0 2px var(--primary-color), var(--shadow-lg); }
}

.connect-dot {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--primary-color);
  opacity: 0;
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.note-block.connect-mode .connect-dot,
.note-block:hover .connect-dot {
  opacity: 1;
}

.connect-dot-top { top: -5px; left: calc(50% - 5px); }
.connect-dot-right { right: -5px; top: calc(50% - 5px); }
.connect-dot-bottom { bottom: -5px; left: calc(50% - 5px); }
.connect-dot-left { left: -5px; top: calc(50% - 5px); }

.connect-dot:hover {
  transform: scale(1.2);
}

.resize-handle {
  position: absolute;
  z-index: 20;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.note-block:hover .resize-handle,
.note-block.selected .resize-handle {
  opacity: 1;
}

.resize-handle-se,
.resize-handle-sw,
.resize-handle-ne,
.resize-handle-nw {
  width: 12px;
  height: 12px;
}

.resize-handle-e,
.resize-handle-w {
  width: 8px;
  height: 100%;
  top: 0;
}

.resize-handle-n,
.resize-handle-s {
  width: 100%;
  height: 8px;
  left: 0;
}

.resize-handle-se { right: -3px; bottom: -3px; cursor: se-resize; }
.resize-handle-sw { left: -3px; bottom: -3px; cursor: sw-resize; }
.resize-handle-ne { right: -3px; top: -3px; cursor: ne-resize; }
.resize-handle-nw { left: -3px; top: -3px; cursor: nw-resize; }
.resize-handle-e { right: -3px; cursor: e-resize; }
.resize-handle-w { left: -3px; cursor: w-resize; }
.resize-handle-n { top: -3px; cursor: n-resize; }
.resize-handle-s { bottom: -3px; cursor: s-resize; }

.block-color-default { background: var(--bg-secondary); }
.block-color-green { background: #eaf4ee; }
.block-color-blue { background: #ebf2fa; }
.block-color-yellow { background: #f7f1da; }
.block-color-pink { background: #f8e7e7; }
.block-color-gray { background: #eeefee; }

[data-theme="dark"] .block-color-default { background: var(--bg-secondary); }
[data-theme="dark"] .block-color-green { background: #223029; }
[data-theme="dark"] .block-color-blue { background: #1e2a34; }
[data-theme="dark"] .block-color-yellow { background: #2e2a1c; }
[data-theme="dark"] .block-color-pink { background: #312227; }
[data-theme="dark"] .block-color-gray { background: #262927; }

.block-border-solid { border-style: solid; }
.block-border-dashed { border-style: dashed; }
.block-border-dotted { border-style: dotted; }
.block-border-double { border-style: double; }
.block-border-none { border-style: none; }
</style>

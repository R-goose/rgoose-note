<template>
  <div
    class="note-block"
    :class="{
      'selected': selected,
      'connect-mode': connectMode,
      'connecting': connectingFrom === block.id,
      'connect-target': connectMode && connectingFrom && connectingFrom !== block.id,
      'hovered': hovered,
      [`block-border-${block.borderStyle || 'solid'}`]: true
    }"
    :style="blockStyle"
    @mousedown="onMouseDown"
    @mouseup="onMouseUp"
    @click.stop="onClick"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
  >
    <div class="block-header" v-if="selected || connectMode || hovered">
      <div class="block-drag-handle" v-if="selected || hovered">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="9" cy="6" r="1.5"/>
          <circle cx="15" cy="6" r="1.5"/>
          <circle cx="9" cy="12" r="1.5"/>
          <circle cx="15" cy="12" r="1.5"/>
          <circle cx="9" cy="18" r="1.5"/>
          <circle cx="15" cy="18" r="1.5"/>
        </svg>
      </div>
      <div class="block-actions" v-if="selected">
        <button class="action-btn" @click.stop="addImage" title="插入图片">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button class="action-btn" @click.stop="addLink" title="插入链接">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
        <button class="action-btn" @click.stop="addNoteLink" title="引用笔记">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </button>
        <button class="action-btn" @click.stop="showStyleMenu = !showStyleMenu" title="样式">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          </svg>
        </button>
        <button class="action-btn delete" @click.stop="onDelete" title="删除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>
    
    <div v-if="showStyleMenu" class="style-menu" @wheel.stop.prevent>
      <div class="style-menu-section">
        <span class="style-menu-title">背景</span>
        <div class="style-options">
          <button 
            v-for="color in blockColors" 
            :key="color.value"
            class="style-option color-option"
            :class="{ active: block.color === color.value }"
            :style="{ backgroundColor: color.bg, borderColor: color.border }"
            @click.stop="setColor(color.value)"
            :title="color.label"
          ></button>
        </div>
      </div>
      <div class="style-menu-section">
        <span class="style-menu-title">字体大小</span>
        <div class="style-options">
          <button 
            v-for="size in fontSizes" 
            :key="size.value"
            class="style-option size-option"
            :class="{ active: block.fontSize === size.value }"
            @click.stop="setFontSize(size.value)"
            :title="size.label"
          >
            {{ size.label }}
          </button>
        </div>
      </div>
      <div class="style-menu-section">
        <span class="style-menu-title">字体粗细</span>
        <div class="style-options">
          <button 
            v-for="weight in fontWeights" 
            :key="weight.value"
            class="style-option weight-option"
            :class="{ active: block.fontWeight === weight.value }"
            @click.stop="setFontWeight(weight.value)"
            :title="weight.label"
          >
            <span :style="{ fontWeight: weight.value }">{{ weight.label }}</span>
          </button>
        </div>
      </div>
      <div class="style-menu-section">
        <span class="style-menu-title">文字颜色</span>
        <div class="style-options">
          <button 
            v-for="color in textColors" 
            :key="color.value"
            class="style-option text-color-option"
            :class="{ active: block.textColor === color.value }"
            :style="{ backgroundColor: color.value, borderColor: color.value }"
            @click.stop="setTextColor(color.value)"
            :title="color.label"
          ></button>
        </div>
      </div>
      <div class="style-menu-section">
        <span class="style-menu-title">边框</span>
        <div class="style-options">
          <button 
            v-for="border in borderStyles" 
            :key="border.value"
            class="style-option border-option"
            :class="{ active: block.borderStyle === border.value }"
            @click.stop="setBorderStyle(border.value)"
            :title="border.label"
          >
            <div :class="['border-preview', border.value]"></div>
          </button>
        </div>
      </div>
      <div class="style-menu-section">
        <span class="style-menu-title">边框颜色</span>
        <div class="style-options">
          <button 
            v-for="color in borderColors" 
            :key="color.value"
            class="style-option border-color-option"
            :class="{ active: block.borderColor === color.value }"
            :style="{ backgroundColor: color.value }"
            @click.stop="setBorderColor(color.value)"
            :title="color.label"
          ></button>
        </div>
      </div>
    </div>
    
    <div class="block-content">
      <div v-if="block.type === 'image' && block.imageUrl" class="image-container" @dblclick.stop="$emit('preview-image', block.imageUrl)">
        <img :src="block.imageUrl" alt="" @load="onImageLoad" draggable="false" @dragstart.prevent />
        <button class="change-image-btn" @click.stop="$emit('add-image', block.id)">
          更换图片
        </button>
      </div>
      
      <div v-else-if="block.type === 'note-link' && block.linkedNoteId" class="note-link-block" @click.stop="$emit('open-note', block.linkedNoteId)">
        <div class="note-link-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="note-link-info">
          <div class="note-link-title">{{ linkedNoteTitle }}</div>
          <div class="note-link-desc">点击跳转到该笔记</div>
        </div>
        <div class="note-link-arrow">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="7" y1="17" x2="17" y2="7"/>
            <polyline points="7 7 17 7 17 17"/>
          </svg>
        </div>
      </div>
      
      <div
        v-else
        ref="editorRef"
        class="text-editor"
        contenteditable="true"
        :data-placeholder="block.content ? '' : '点击输入内容...'"
        :style="editorStyle"
        @input="onInput"
        @blur="onBlur"
        @paste="onPaste"
        @keydown="onEditorKeyDown"
        @mousedown.stop
      ></div>
    </div>
    
    <div
      v-if="connectMode"
      class="connect-dot connect-dot-top"
      @mousedown.stop="$emit('connect-start', block.id, 'top')"
      @mouseup.stop="$emit('connect-end', block.id, 'top')"
      title="拖拽连接"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
    <div
      v-if="connectMode"
      class="connect-dot connect-dot-right"
      @mousedown.stop="$emit('connect-start', block.id, 'right')"
      @mouseup.stop="$emit('connect-end', block.id, 'right')"
      title="拖拽连接"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
    <div
      v-if="connectMode"
      class="connect-dot connect-dot-bottom"
      @mousedown.stop="$emit('connect-start', block.id, 'bottom')"
      @mouseup.stop="$emit('connect-end', block.id, 'bottom')"
      title="拖拽连接"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
    <div
      v-if="connectMode"
      class="connect-dot connect-dot-left"
      @mousedown.stop="$emit('connect-start', block.id, 'left')"
      @mouseup.stop="$emit('connect-end', block.id, 'left')"
      title="拖拽连接"
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
  </div>
  
  <Teleport to="body">
    <div v-if="showLinkModal" class="modal-overlay" @click.self="showLinkModal = false">
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
          <button class="btn btn-secondary" @click="showLinkModal = false">取消</button>
          <button class="btn btn-primary" @click="insertLink">插入</button>
        </div>
      </div>
    </div>
  </Teleport>
  
  <input
    ref="blockImageInputRef"
    type="file"
    accept="image/*"
    style="position: fixed; top: -100px; left: -100px; width: 0; height: 0; opacity: 0; pointer-events: none;"
    @change="onBlockImageSelect"
  />
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useNoteStore } from '@/stores/note'

const props = defineProps({
  block: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  },
  connectMode: {
    type: Boolean,
    default: false
  },
  connectingFrom: {
    type: String,
    default: null
  }
})

const emit = defineEmits([
  'select',
  'drag-start',
  'drag-move',
  'drag-end',
  'update',
  'delete',
  'connect-start',
  'connect-end',
  'add-image',
  'add-link',
  'add-note-link',
  'preview-image',
  'open-note'
])

const noteStore = useNoteStore()

const editorRef = ref(null)
const blockImageInputRef = ref(null)
const showLinkModal = ref(false)
const linkText = ref('')
const linkUrl = ref('')
const isDragging = ref(false)
const dragStartPos = ref({ x: 0, y: 0 })
const hovered = ref(false)
const showStyleMenu = ref(false)

const blockColors = [
  { value: 'white', label: '白色', bg: '#ffffff', border: '#e0e0e0' },
  { value: 'green', label: '绿色', bg: '#f0f6f2', border: '#d0e0d5' },
  { value: 'blue', label: '蓝色', bg: '#f0f3f6', border: '#d0d8e0' },
  { value: 'yellow', label: '黄色', bg: '#f6f4ef', border: '#e0d9c8' },
  { value: 'pink', label: '粉色', bg: '#f6f0ef', border: '#e0d0cd' },
  { value: 'gray', label: '灰色', bg: '#f2f3f2', border: '#d8dad9' }
]

const borderStyles = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
  { value: 'double', label: '双线' },
  { value: 'none', label: '无' }
]

const fontSizes = [
  { value: '12px', label: '12px' },
  { value: '14px', label: '14px' },
  { value: '16px', label: '16px' },
  { value: '18px', label: '18px' },
  { value: '20px', label: '20px' },
  { value: '24px', label: '24px' }
]

const fontWeights = [
  { value: '400', label: '普通' },
  { value: '500', label: '中等' },
  { value: '600', label: '半粗' },
  { value: '700', label: '粗体' }
]

const textColors = [
  { value: '#333333', label: '黑色' },
  { value: '#4a9568', label: '绿色' },
  { value: '#7fa8c4', label: '蓝色' },
  { value: '#c9a96e', label: '金色' },
  { value: '#b88a7a', label: '棕色' },
  { value: '#666666', label: '灰色' },
  { value: '#9a8fa8', label: '紫色' },
  { value: '#a87f7f', label: '红色' }
]

const borderColors = [
  { value: '#e4e7e4', label: '浅灰' },
  { value: '#4a9568', label: '绿色' },
  { value: '#7fa8c4', label: '蓝色' },
  { value: '#c9a96e', label: '金色' },
  { value: '#b88a7a', label: '棕色' },
  { value: '#a87f7f', label: '红色' },
  { value: '#9a8fa8', label: '紫色' },
  { value: '#333333', label: '黑色' }
]

function setColor(color) {
  emit('update', props.block.id, { color })
}

function setBorderStyle(borderStyle) {
  emit('update', props.block.id, { borderStyle })
}

function setFontSize(fontSize) {
  emit('update', props.block.id, { fontSize })
}

function setFontWeight(fontWeight) {
  emit('update', props.block.id, { fontWeight })
}

function setTextColor(textColor) {
  emit('update', props.block.id, { textColor })
}

function setBorderColor(borderColor) {
  emit('update', props.block.id, { borderColor })
}

const linkedNoteTitle = computed(() => {
  if (props.block.type !== 'note-link' || !props.block.linkedNoteId) return '未知笔记'
  const note = noteStore.notes.find(n => n.id === props.block.linkedNoteId)
  return note?.title || '无标题笔记'
})

const blockStyle = computed(() => {
  const bgColors = {
    white: '#ffffff',
    green: '#f0f6f2',
    blue: '#f0f3f6',
    yellow: '#f6f4ef',
    pink: '#f6f0ef',
    gray: '#f2f3f2'
  }
  const borderColors = {
    white: '#e0e0e0',
    green: '#d0e0d5',
    blue: '#d0d8e0',
    yellow: '#e0d9c8',
    pink: '#e0d0cd',
    gray: '#d8dad9'
  }
  
  return {
    left: `${props.block.x}px`,
    top: `${props.block.y}px`,
    width: `${props.block.width || 240}px`,
    minHeight: `${props.block.minHeight || 60}px`,
    backgroundColor: props.block.color ? bgColors[props.block.color] || '#ffffff' : 'var(--bg-primary)',
    borderColor: props.block.borderColor || (props.block.color ? borderColors[props.block.color] : 'var(--border-color)')
  }
})

const editorStyle = computed(() => ({
  fontSize: props.block.fontSize || '14px',
  fontWeight: props.block.fontWeight || '400',
  color: props.block.textColor || 'var(--text-primary)'
}))

onMounted(() => {
  if (editorRef.value && props.block.content) {
    editorRef.value.innerHTML = props.block.content
  }
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})

function handleClickOutside(e) {
  if (showStyleMenu.value && !e.target.closest('.style-menu') && !e.target.closest('.action-btn[title="样式"]')) {
    showStyleMenu.value = false
  }
}

watch(() => props.block.content, (newContent) => {
  if (editorRef.value && editorRef.value.innerHTML !== newContent) {
    editorRef.value.innerHTML = newContent || ''
  }
})

function onClick() {
  emit('select', props.block.id)
}

function onMouseUp(e) {
  if (e.target.closest('.text-editor') || e.target.closest('.block-actions') || e.target.closest('.connect-dot')) {
    return
  }
  if (props.connectingFrom && props.connectingFrom !== props.block.id) {
    emit('connect-end', props.block.id)
  }
}

function onMouseDown(e) {
  if (e.target.closest('.text-editor') || e.target.closest('.block-actions') || e.target.closest('.connect-dot')) {
    return
  }
  
  isDragging.value = true
  
  emit('drag-start', props.block.id, e.clientX, e.clientY)
  emit('select', props.block.id)
}

function onInput() {
  if (editorRef.value) {
    emit('update', props.block.id, { content: editorRef.value.innerHTML })
  }
}

function onBlur() {
  if (editorRef.value) {
    emit('update', props.block.id, { content: editorRef.value.innerHTML })
  }
}

function onEditorKeyDown(e) {
  if (e.key === 'Escape') {
    e.target.blur()
  }
}

function onPaste(e) {
  const items = e.clipboardData?.items
  if (!items) return
  
  let hasImage = false
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      hasImage = true
      e.preventDefault()
      const file = item.getAsFile()
      if (file) {
        const reader = new FileReader()
        reader.onload = (ev) => {
          const img = document.createElement('img')
          img.src = ev.target.result
          img.style.maxWidth = '100%'
          img.style.height = 'auto'
          img.style.borderRadius = '6px'
          
          const selection = window.getSelection()
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0)
            range.deleteContents()
            range.insertNode(img)
            range.collapse(false)
            selection.removeAllRanges()
            selection.addRange(range)
          } else {
            editorRef.value.appendChild(img)
          }
          
          emit('update', props.block.id, { content: editorRef.value.innerHTML })
        }
        reader.readAsDataURL(file)
      }
      break
    }
  }
  
  if (!hasImage) {
    setTimeout(() => {
      emit('update', props.block.id, { content: editorRef.value.innerHTML })
    }, 0)
  }
}

function onDelete() {
  emit('delete', props.block.id)
}

function addImage() {
  blockImageInputRef.value?.click()
}

function onBlockImageSelect(e) {
  const file = e.target.files?.[0]
  if (!file || !editorRef.value) return
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    const img = document.createElement('img')
    img.src = ev.target.result
    img.style.maxWidth = '100%'
    img.style.height = 'auto'
    img.style.borderRadius = 'var(--radius-sm)'
    
    // 聚焦到编辑器
    editorRef.value.focus()
    
    // 在末尾插入图片
    editorRef.value.appendChild(img)
    editorRef.value.appendChild(document.createElement('br'))
    
    emit('update', props.block.id, { content: editorRef.value.innerHTML })
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function addLink() {
  linkText.value = ''
  linkUrl.value = ''
  showLinkModal.value = true
}

function addNoteLink() {
  emit('add-note-link', props.block.id)
}

function insertLink() {
  if (!linkUrl.value) return
  
  const safeUrl = linkUrl.value.startsWith('http') ? linkUrl.value : `https://${linkUrl.value}`
  const text = linkText.value || linkUrl.value
  
  // 直接插入链接（同步操作，避免延迟）
  if (editorRef.value) {
    const link = document.createElement('a')
    link.href = safeUrl
    link.target = '_blank'
    link.textContent = text
    editorRef.value.appendChild(link)
    emit('update', props.block.id, { content: editorRef.value.innerHTML })
  }
  
  // 关闭 modal
  showLinkModal.value = false
  linkText.value = ''
  linkUrl.value = ''
}

function onImageLoad() {
  // 图片加载完成，可以触发高度更新
}
</script>

<style scoped>
.note-block {
  position: absolute;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  transition: border-color var(--transition-fast);
  display: flex;
  flex-direction: column;
  cursor: move;
  isolation: isolate;
}

.note-block.connect-mode {
  z-index: 10;
}

.note-block:hover {
  border-color: var(--text-tertiary);
}

.note-block.selected {
  border-color: var(--primary-color);
  box-shadow: 
    inset 0 0 0 1px var(--primary-color),
    0 0 0 2px rgba(74, 149, 104, 0.2);
}

.note-block.connect-mode {
  cursor: crosshair;
}

.note-block.connecting {
  border-color: var(--primary-light);
  box-shadow: 0 0 0 2px var(--primary-soft);
}

.note-block.connect-target {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.block-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.block-drag-handle {
  color: var(--text-tertiary);
  cursor: grab;
  padding: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.block-drag-handle:active {
  cursor: grabbing;
}

.block-actions {
  display: flex;
  gap: 2px;
}

.action-btn {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.action-btn.delete:hover {
  color: var(--warning-color);
  background: rgba(217, 118, 118, 0.1);
}

.block-content {
  flex: 1;
  padding: 12px 14px;
  overflow: hidden;
}

.text-editor {
  width: 100%;
  min-height: 36px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-primary);
  outline: none;
  word-wrap: break-word;
  word-break: break-word;
  cursor: text;
}

.text-editor:empty:before {
  content: attr(data-placeholder);
  color: var(--text-tertiary);
  pointer-events: none;
}

.text-editor img {
  max-width: 100%;
  height: auto;
  border-radius: var(--radius-sm);
  margin: 4px 0;
}

.text-editor a {
  color: var(--primary-color);
  text-decoration: underline;
  cursor: pointer;
}

.text-editor a:hover {
  color: var(--primary-dark);
}

.image-container {
  position: relative;
  width: 100%;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.image-container img {
  width: 100%;
  height: auto;
  display: block;
  -webkit-user-drag: none;
  user-drag: none;
  cursor: zoom-in;
}

.change-image-btn {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 4px 10px;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  border-radius: var(--radius-sm);
  font-size: 12px;
  opacity: 0;
  transition: opacity var(--transition-fast);
}

.image-container:hover .change-image-btn {
  opacity: 1;
}

.note-link-block {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--primary-soft);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.note-link-block:hover {
  background: rgba(90, 158, 122, 0.2);
}

.note-link-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
}

.note-link-info {
  flex: 1;
  min-width: 0;
}

.note-link-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.note-link-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.note-link-arrow {
  color: var(--primary-color);
  flex-shrink: 0;
  opacity: 0.7;
}

.note-link-block:hover .note-link-arrow {
  opacity: 1;
  transform: translateX(2px);
}

.connect-dot {
  position: absolute;
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  border: 3px solid white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: crosshair;
  opacity: 0;
  transition: all var(--transition-fast);
  box-shadow: 0 2px 10px rgba(90, 158, 122, 0.5);
  z-index: 9999;
  pointer-events: auto;
}

.connect-dot-top {
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
}

.connect-dot-right {
  right: -10px;
  top: 50%;
  transform: translateY(-50%);
}

.connect-dot-bottom {
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
}

.connect-dot-left {
  left: -10px;
  top: 50%;
  transform: translateY(-50%);
}

.connect-mode .connect-dot {
  opacity: 1;
}

.connect-dot:hover {
  transform: scale(1.25);
  box-shadow: 0 4px 12px rgba(90, 158, 122, 0.5);
}

.connect-dot-top:hover {
  transform: translateX(-50%) scale(1.25);
}

.connect-dot-right:hover {
  transform: translateY(-50%) scale(1.25);
}

.connect-dot-bottom:hover {
  transform: translateX(-50%) scale(1.25);
}

.connect-dot-left:hover {
  transform: translateY(-50%) scale(1.25);
}

.connecting .connect-dot {
  opacity: 1;
  background: var(--primary-light);
}

.block-color-green {
  background: #f0f6f2;
  border-color: #d0e0d5;
}

.block-color-blue {
  background: #f0f3f6;
  border-color: #d0d8e0;
}

.block-color-yellow {
  background: #f6f4ef;
  border-color: #e0d9c8;
}

.block-color-pink {
  background: #f6f0ef;
  border-color: #e0d0cd;
}

.block-color-gray {
  background: #f2f3f2;
  border-color: #d8dad9;
}

.block-border-solid {
  border-style: solid;
}

.block-border-dashed {
  border-style: dashed;
}

.block-border-dotted {
  border-style: dotted;
}

.block-border-double {
  border-style: double;
}

.block-border-none {
  border-style: none;
}

.style-menu {
  position: absolute;
  top: 36px;
  right: 8px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  padding: 10px;
  z-index: 100;
  min-width: 200px;
  max-height: 400px;
  overflow-y: auto;
}

.style-menu-section {
  margin-bottom: 12px;
}

.style-menu-section:last-child {
  margin-bottom: 0;
}

.style-menu-title {
  font-size: 11px;
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: block;
  font-weight: 500;
}

.style-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.style-option {
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
  background: var(--bg-primary);
}

.style-option:hover {
  border-color: var(--primary-color);
}

.style-option.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(90, 158, 122, 0.2);
}

.color-option {
  width: 26px;
  height: 26px;
}

.border-color-option {
  width: 26px;
  height: 26px;
  border: 2px solid var(--bg-primary);
}

.border-color-option.active {
  border-color: var(--text-primary);
}

.size-option {
  width: 48px;
  height: 28px;
  font-size: 12px;
  font-weight: 500;
}

.weight-option {
  width: 56px;
  height: 28px;
  font-size: 12px;
}

.border-option {
  padding: 4px;
  width: 28px;
  height: 28px;
}

.border-preview {
  width: 100%;
  height: 14px;
  border: 2px solid var(--border-color);
  border-radius: var(--radius-sm);
}

.border-preview.solid {
  border-style: solid;
}

.border-preview.dashed {
  border-style: dashed;
}

.border-preview.dotted {
  border-style: dotted;
}

.border-preview.double {
  border-style: double;
}

.border-preview.none {
  border-style: none;
  background: var(--border-light);
}
</style>

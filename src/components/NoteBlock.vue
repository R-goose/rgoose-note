<template>
  <div
    ref="blockRef"
    class="note-block"
    :class="{
      selected,
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
    <div class="block-header">
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
      <div class="block-actions">
        <button v-if="block.type !== 'image'" class="action-btn" @click.stop="$emit('add-image', block.id)" title="插入图片">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button v-if="block.type !== 'note-link'" class="action-btn" @click.stop="$emit('add-link', block.id)" title="插入链接">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
        </button>
        <button v-if="block.type !== 'note-link'" class="action-btn" @click.stop="$emit('add-note-link', block.id)" title="引用笔记">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </button>
        <button class="action-btn" @click.stop="showStyleMenu = !showStyleMenu" title="样式">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82A1.65 1.65 0 0 0 3.17 14H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.17A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 8.93 4H9a1.65 1.65 0 0 0 1-1.51V2a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.49a1.65 1.65 0 0 0 1 1.51h.07a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c0 .63.37 1.2.94 1.46H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.66a1.65 1.65 0 0 0-.94 1.54z"/>
          </svg>
        </button>
        <button class="action-btn delete" @click.stop="$emit('delete', block.id)" title="删除">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
    </div>

    <div v-if="showStyleMenu" class="style-menu" @click.stop>
      <div class="style-group">
        <span class="style-label">颜色</span>
        <div class="style-options">
          <button
            v-for="color in blockColors"
            :key="color.value"
            class="color-option"
            :class="{ active: (block.color || 'green') === color.value }"
            :style="{ background: color.preview }"
            @click="updateStyle({ color: color.value })"
          ></button>
        </div>
      </div>
      <div class="style-group">
        <span class="style-label">字体</span>
        <div class="style-options text-options">
          <button
            v-for="size in fontSizes"
            :key="size.value"
            class="style-chip"
            :class="{ active: (block.fontSize || 14) === size.value }"
            @click="updateStyle({ fontSize: size.value })"
          >
            {{ size.label }}
          </button>
        </div>
      </div>
      <div class="style-group">
        <span class="style-label">边框</span>
        <div class="style-options text-options">
          <button
            v-for="border in borderStyles"
            :key="border.value"
            class="style-chip"
            :class="{ active: (block.borderStyle || 'solid') === border.value }"
            @click="updateStyle({ borderStyle: border.value })"
          >
            {{ border.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="block-content">
      <div v-if="block.type === 'image' && block.imageUrl" class="image-container" @dblclick.stop="$emit('add-image', block.id)">
        <img :src="block.imageUrl" alt="" @click.stop="$emit('preview-image', block.imageUrl)" />
        <button class="change-image-btn" @click.stop="$emit('add-image', block.id)">更换图片</button>
      </div>

      <div
        v-else-if="block.type === 'note-link' && block.linkedNoteId"
        class="note-link-block"
        @click.stop="$emit('open-note', block.linkedNoteId)"
      >
        <div class="note-link-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <div class="note-link-info">
          <div class="note-link-title">{{ linkedNoteTitle }}</div>
          <div class="note-link-desc">点击跳转到该笔记</div>
        </div>
      </div>

      <div
        v-else
        ref="editorRef"
        class="text-editor"
        contenteditable="true"
        :style="editorStyle"
        :data-placeholder="block.content ? '' : '点击输入内容...'"
        @input="onInput"
        @blur="onBlur"
        @paste="onPaste"
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
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useNoteStore } from '@/stores/note'

const props = defineProps({
  block: Object,
  selected: Boolean,
  connectMode: Boolean,
  connectingFrom: String
})

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
  'resize'
])

const noteStore = useNoteStore()
const blockRef = ref(null)
const editorRef = ref(null)
const showStyleMenu = ref(false)

const blockColors = [
  { value: 'green', preview: '#eef9f3' },
  { value: 'blue', preview: '#eef5fb' },
  { value: 'yellow', preview: '#faf4e8' },
  { value: 'pink', preview: '#fdf1f1' },
  { value: 'gray', preview: '#f4f6f4' }
]

const fontSizes = [
  { value: 13, label: '小' },
  { value: 14, label: '中' },
  { value: 16, label: '大' }
]

const borderStyles = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'none', label: '无边框' }
]

const linkedNoteTitle = computed(() => {
  const note = noteStore.notes.find(n => n.id === props.block.linkedNoteId)
  return note?.title || '未找到笔记'
})

const blockStyle = computed(() => ({
  left: `${props.block.x}px`,
  top: `${props.block.y}px`,
  width: `${props.block.width || 220}px`,
  minHeight: `${props.block.height || 60}px`,
  borderColor: props.block.borderColor || undefined
}))

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
  },
  { immediate: true }
)

function onClick() {
  emit('select', props.block.id)
}

function onMouseDown(e) {
  emit('drag-start', props.block.id, e.clientX, e.clientY)
}

function onInput(e) {
  emit('update', props.block.id, { content: e.target.innerHTML })
}

function onBlur() {
  if (editorRef.value) {
    emit('update', props.block.id, { content: editorRef.value.innerHTML })
  }
}

function onPaste(e) {
  e.preventDefault()
  const text = e.clipboardData?.getData('text/plain') || ''
  document.execCommand('insertText', false, text)
}

function updateStyle(patch) {
  emit('update', props.block.id, patch)
}

function handleDocumentClick(e) {
  if (showStyleMenu.value && !blockRef.value?.contains(e.target)) {
    showStyleMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocumentClick)
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
.note-block.selected .block-header {
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

.block-content {
  padding: 10px 12px 12px;
  flex: 1;
}

.text-editor {
  min-height: 36px;
  outline: none;
  color: var(--text-primary);
  line-height: 1.6;
  font-size: 14px;
  word-break: break-word;
}

.text-editor:empty::before {
  content: attr(data-placeholder);
  color: var(--text-tertiary);
}

.image-container {
  position: relative;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.image-container img {
  width: 100%;
  display: block;
  border-radius: var(--radius-md);
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
  background: rgba(255,255,255,0.7);
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

.style-menu {
  position: absolute;
  top: 34px;
  right: 8px;
  z-index: 20;
  width: 190px;
  padding: 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.style-group + .style-group {
  margin-top: 10px;
}

.style-label {
  display: block;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.style-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.color-option {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
}

.color-option.active {
  border-color: var(--text-primary);
}

.text-options .style-chip {
  padding: 5px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  font-size: 12px;
  color: var(--text-secondary);
}

.text-options .style-chip.active {
  background: var(--primary-soft);
  color: var(--primary-dark);
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

.block-color-green { background: var(--bg-secondary); }
.block-color-blue { background: #f9fbff; }
.block-color-yellow { background: #fffdf8; }
.block-color-pink { background: #fffafb; }
.block-color-gray { background: #fafbfa; }

.block-border-solid { border-style: solid; }
.block-border-dashed { border-style: dashed; }
.block-border-none { border-style: none; }
</style>

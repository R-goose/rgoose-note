<template>
  <div class="note-editor-view">
    <header class="editor-header">
      <div class="header-left">
        <button class="btn btn-ghost btn-icon" @click="goBack" title="返回">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <input
          v-if="note"
          v-model="noteTitle"
          type="text"
          class="title-input"
          placeholder="笔记标题"
          @blur="updateTitle"
          @keyup.enter="$event.target.blur()"
        />
      </div>
      
      <div class="header-center">
        <div class="toolbar">
          <button class="btn btn-secondary" @click="addTextBlock" title="添加文本块">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            文本块
          </button>
          <button class="btn btn-secondary" @click="addImageBlock" title="添加图片块" :disabled="isImageLoading">
            <svg v-if="isImageLoading" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin">
              <circle cx="12" cy="12" r="10" stroke-dasharray="60" stroke-dashoffset="20"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            {{ isImageLoading ? '加载中...' : '图片块' }}
          </button>
          <button class="btn btn-secondary" @click="showNoteLinkModal = true" title="引用笔记">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            引用
          </button>
          <button class="btn btn-secondary" @click="showExportMenu = !showExportMenu" title="导出">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            导出
          </button>
          <button
            class="btn"
            :class="connectMode ? 'btn-primary' : 'btn-secondary'"
            @click="toggleConnectMode"
            title="连接模式"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            连线
          </button>
        </div>
      </div>
      
      <div class="header-right">
      </div>
    </header>
    
    <div
      ref="canvasRef"
      class="canvas-container"
      :class="{ 'connect-mode': connectMode, 'panning': isPanning }"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
      @mouseleave="onCanvasMouseUp"
      @wheel="onWheel"
      @dblclick="onCanvasDblClick"
      @contextmenu.prevent="onContextMenu"
    >
      <div
        class="canvas-bg"
        :style="canvasBgStyle"
      ></div>
      
      <div class="blocks-layer" :style="canvasTransformStyle">
        <NoteBlock
          v-for="block in blocks"
          :key="block.id"
          :block="block"
          :selected="selectedBlockId === block.id"
          :connect-mode="connectMode"
          :connecting-from="connectingFrom"
          @select="selectBlock"
          @drag-start="onBlockDragStart"
          @drag-move="onBlockDragMove"
          @drag-end="onBlockDragEnd"
          @update="updateBlockContent"
          @delete="deleteBlock"
          @connect-start="startConnection"
          @connect-end="endConnection"
          @add-image="handleAddImageToBlock"
          @add-link="handleAddLinkToBlock"
          @add-note-link="handleAddNoteLinkFromBlock"
          @preview-image="showImagePreview"
          @open-note="openLinkedNote"
        />
      </div>
      
      <svg class="connections-layer" :style="canvasTransformStyle">
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="context-stroke"/>
          </marker>
        </defs>
        
        <g v-for="conn in connections" :key="conn.id">
          <path
            :d="getConnectionPath(conn)"
            :stroke="conn.color"
            :stroke-width="conn.width || 2"
            fill="none"
            :stroke-dasharray="getStrokeDashArray(conn.style)"
            :marker-end="`url(#arrowhead)`"
            class="connection-path"
            @click.stop="selectConnection(conn.id)"
          />
          <path
            :d="getConnectionPath(conn)"
            stroke="transparent"
            :stroke-width="(parseInt(conn.width) || 2) + 10"
            fill="none"
            class="connection-hit"
            @click.stop="selectConnection(conn.id)"
          />
        </g>
        
        <path
          v-if="connectingFrom"
          :d="tempConnectionPath"
          :stroke="currentLineColor"
          stroke-width="2"
          fill="none"
          stroke-dasharray="6,4"
          class="temp-connection"
        />
      </svg>
    </div>
    
    <div class="right-panel">
        <div 
          class="minimap" 
          ref="minimapRef"
          @mousedown="onMinimapMouseDown"
          @wheel.stop.prevent="onMinimapWheel"
        >
          <svg class="minimap-canvas" :viewBox="minimapViewBox">
            <g v-for="block in blocks" :key="block.id">
              <rect
                :x="block.x"
                :y="block.y"
                :width="block.width || 240"
                :height="getBlockHeight(block)"
                :fill="getBlockMinimapColor(block)"
                :rx="4"
                class="minimap-block"
                :class="{ selected: selectedBlockId === block.id }"
              />
            </g>
            <g v-for="conn in connections" :key="conn.id">
              <path
                :d="getConnectionPath(conn)"
                :stroke="conn.color"
                stroke-width="3"
                fill="none"
                opacity="0.6"
              />
            </g>
          </svg>
          
          <div v-if="blocks.length === 0" class="minimap-empty">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span>无内容</span>
          </div>
          
          <div 
            class="minimap-viewport" 
            :style="minimapViewportStyle"
          ></div>
        </div>
        
        <div class="zoom-controls-bottom">
          <button class="btn btn-ghost btn-icon" @click="zoomOut" title="缩小">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <span class="zoom-level-text">{{ Math.round(canvasConfig.zoom * 100) }}%</span>
          <button class="btn btn-ghost btn-icon" @click="zoomIn" title="放大">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </button>
          <button class="btn btn-ghost btn-icon" @click="resetView" title="重置视图">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="1 4 1 10 7 10"/>
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
            </svg>
          </button>
        </div>
      </div>
    
    <div v-if="selectedConnectionId" class="connection-toolbar">
      <span>样式：</span>
      <button
        v-for="style in lineStyles"
        :key="style.value"
        class="style-btn"
        :class="{ active: currentConnectionStyle === style.value }"
        @click="setConnectionStyle(style.value)"
      >
        {{ style.label }}
      </button>
      <span>线宽：</span>
      <button
        v-for="width in lineWidths"
        :key="width.value"
        class="style-btn width-btn"
        :class="{ active: currentConnectionWidth === width.value }"
        @click="setConnectionWidth(width.value)"
      >
        {{ width.label }}
      </button>
      <span>颜色：</span>
      <button
        v-for="color in lineColors"
        :key="color"
        class="color-btn"
        :class="{ active: currentConnectionColor === color }"
        :style="{ background: color }"
        @click="setConnectionColor(color)"
      ></button>
      <button class="btn btn-ghost btn-icon delete-btn" @click="deleteSelectedConnection" title="删除连线">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
    
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      style="position: fixed; top: -100px; left: -100px; width: 0; height: 0; opacity: 0; pointer-events: none;"
      @change="onImageFileSelect"
    />
    
    <div v-if="showExportMenu" class="export-dropdown" @click.stop>
      <div class="export-item" @click="exportAsPDF">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
          <line x1="9" y1="11" x2="15" y2="11"/>
        </svg>
        导出为 PDF
      </div>
      <div class="export-item" @click="exportAsImage">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        导出为图片
      </div>
    </div>
    
    <div v-if="showNoteLinkModal" class="modal-overlay" @click.self="closeNoteLinkModal">
      <div class="modal-content note-link-modal">
        <div class="modal-header">
          <h3>选择要引用的笔记</h3>
          <button class="btn btn-ghost btn-icon" @click="closeNoteLinkModal">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <div class="note-link-search">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="noteLinkSearch"
            type="text"
            placeholder="搜索笔记..."
            class="input"
          />
        </div>
        <div class="note-link-list">
          <div
            v-for="n in filteredNotesForLink"
            :key="n.id"
            class="note-link-item"
            :class="{ disabled: n.id === note?.id }"
            @click="createNoteLinkBlock(n.id)"
          >
            <div class="note-link-item-icon">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div class="note-link-item-info">
              <div class="note-link-item-title">{{ n.title || '无标题笔记' }}</div>
              <div class="note-link-item-desc">{{ n.blocks?.length || 0 }} 个内容块</div>
            </div>
            <span v-if="n.id === note?.id" class="note-link-item-badge">当前笔记</span>
          </div>
          <div v-if="!filteredNotesForLink.length" class="empty-mini">
            没有找到笔记
          </div>
        </div>
      </div>
    </div>
    
    <div v-if="contextMenu.show" class="context-menu" :style="contextMenuStyle" @click.stop>
      <template v-if="contextMenu.type === 'block'">
        <div class="context-menu-item" @click="duplicateSelectedBlock">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          复制块
          <span class="shortcut">Ctrl+D</span>
        </div>
        <div class="context-menu-item" @click="copySelectedBlock">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          拷贝
          <span class="shortcut">Ctrl+C</span>
        </div>
        <div class="context-menu-item" @click="pasteBlockHere">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
          粘贴
          <span class="shortcut">Ctrl+V</span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item danger" @click="deleteSelectedBlock">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          删除
          <span class="shortcut">Del</span>
        </div>
      </template>
      <template v-else-if="contextMenu.type === 'canvas'">
        <div class="context-menu-item" @click="addTextBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="12" x2="12" y2="18"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          新建文本块
          <span class="shortcut">N</span>
        </div>
        <div class="context-menu-item" @click="addImageBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          新建图片块
        </div>
        <div class="context-menu-item" @click="pasteBlockHere">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
          粘贴块
          <span class="shortcut">Ctrl+V</span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" @click="toggleConnectMode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          {{ connectMode ? '退出连线模式' : '连线模式' }}
          <span class="shortcut">T</span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" @click="resetView">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          重置视图
          <span class="shortcut">Ctrl+0</span>
        </div>
      </template>
    </div>
    
    <Teleport to="body">
      <div v-if="showImagePreviewModal" class="image-preview-overlay" @click="closeImagePreview">
        <div class="image-preview-container">
          <img :src="previewImageUrl" alt="预览图片" class="preview-image" />
          <button class="image-preview-close" @click="closeImagePreview">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import NoteBlock from '@/components/NoteBlock.vue'
import interact, { rect } from 'interactjs'

const route = useRoute()
const router = useRouter()
const noteStore = useNoteStore()

const canvasRef = ref(null)
const fileInputRef = ref(null)

const noteTitle = ref('')
const canvasConfig = ref({ zoom: 1, offsetX: 0, offsetY: 0 })

const isPanning = ref(false)
const panStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

const selectedBlockId = ref(null)
const selectedConnectionId = ref(null)
const connectMode = ref(false)
const connectingFrom = ref(null)
const connectingPosition = ref(null)
const tempMousePos = ref({ x: 0, y: 0 })

const draggingBlock = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const hasDragged = ref(false) // 标记是否真正发生了拖拽
const dragStartMousePos = ref({ x: 0, y: 0 }) // 鼠标按下时的位置

const copiedBlock = ref(null)

// 撤销/重做历史
const undoStack = ref([])
const redoStack = ref([])
const MAX_HISTORY = 50

function saveHistory() {
  if (!note.value) return
  undoStack.value.push(JSON.stringify(note.value.blocks))
  if (undoStack.value.length > MAX_HISTORY) {
    undoStack.value.shift()
  }
  redoStack.value = []
}

function undo() {
  if (undoStack.value.length === 0) return
  if (!note.value) return
  
  redoStack.value.push(JSON.stringify(note.value.blocks))
  const previousState = JSON.parse(undoStack.value.pop())
  noteStore.restoreNoteBlocks(note.value.id, previousState)
}

function redo() {
  if (redoStack.value.length === 0) return
  if (!note.value) return
  
  undoStack.value.push(JSON.stringify(note.value.blocks))
  const nextState = JSON.parse(redoStack.value.pop())
  noteStore.restoreNoteBlocks(note.value.id, nextState)
}

const isImageLoading = ref(false)
const currentImageBlockId = ref(null)

const showNoteLinkModal = ref(false)
const noteLinkSearch = ref('')
const noteLinkSourceBlockId = ref(null)

const showImagePreviewModal = ref(false)
const previewImageUrl = ref('')

const showExportMenu = ref(false)

const newBlockOffset = ref(0)

const contextMenu = ref({
  show: false,
  type: 'canvas',
  x: 0,
  y: 0,
  canvasX: 0,
  canvasY: 0
})

const lineStyles = [
  { label: '直线', value: 'straight' },
  { label: '曲线', value: 'bezier' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
  { label: '双点线', value: 'dot-dash' }
]

const lineWidths = [
  { label: '细', value: '1' },
  { label: '中', value: '2' },
  { label: '粗', value: '3' },
  { label: '特粗', value: '4' }
]

const lineColors = ['#4a9568', '#7fa8c4', '#c9a96e', '#b88a7a', '#8fa89a', '#a89a7a', '#9a8fa8', '#a87f7f']

const note = computed(() => {
  const id = route.params.id
  return noteStore.notes.find(n => n.id === id) || null
})

const blocks = computed(() => note.value?.blocks || [])
const connections = computed(() => note.value?.connections || [])

const canvasBgStyle = computed(() => ({
  backgroundSize: `${24 * canvasConfig.value.zoom}px ${24 * canvasConfig.value.zoom}px`,
  backgroundPosition: `${canvasConfig.value.offsetX}px ${canvasConfig.value.offsetY}px`
}))

const canvasTransformStyle = computed(() => ({
  transform: `translate(${canvasConfig.value.offsetX}px, ${canvasConfig.value.offsetY}px) scale(${canvasConfig.value.zoom})`,
  transformOrigin: '0 0'
}))

const tempConnectionPath = computed(() => {
  if (!connectingFrom.value) return ''
  const fromBlock = blocks.value.find(b => b.id === connectingFrom.value)
  if (!fromBlock) return ''
  
  const fromW = fromBlock.width || 240
  const fromH = fromBlock.minHeight || 80
  
  const fromCenterX = fromBlock.x + fromW / 2
  const fromCenterY = fromBlock.y + fromH / 2
  const fromWidth = fromW / 2
  const fromHeight = fromH / 2
  
  const toX = tempMousePos.value.x
  const toY = tempMousePos.value.y
  
  const dx = toX - fromCenterX
  const dy = toY - fromCenterY
  
  let fromX, fromY
  
  if (Math.abs(dx) * fromHeight > Math.abs(dy) * fromWidth) {
    fromX = fromCenterX + (dx > 0 ? fromWidth : -fromWidth)
    fromY = fromCenterY + dy * (fromWidth / Math.abs(dx))
  } else {
    fromY = fromCenterY + (dy > 0 ? fromHeight : -fromHeight)
    fromX = fromCenterX + dx * (fromHeight / Math.abs(dy))
  }
  
  const fromDirX = fromX - fromCenterX
  const fromDirY = fromY - fromCenterY
  const fromLen = Math.sqrt(fromDirX * fromDirX + fromDirY * fromDirY) || 1
  const fromNormX = fromDirX / fromLen
  const fromNormY = fromDirY / fromLen
  
  const dist = Math.sqrt(dx * dx + dy * dy)
  const offset = dist * 0.4
  
  const c1x = fromX + fromNormX * offset
  const c1y = fromY + fromNormY * offset
  
  return `M ${fromX} ${fromY} Q ${c1x} ${c1y}, ${toX} ${toY}`
})

const currentLineColor = ref('#4a9568')
const currentConnectionStyle = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.style || 'straight'
})
const currentConnectionColor = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.color || '#4a9568'
})
const currentConnectionWidth = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.width || '2'
})

const contextMenuStyle = computed(() => ({
  left: `${contextMenu.value.x}px`,
  top: `${contextMenu.value.y}px`
}))

const filteredNotesForLink = computed(() => {
  const allNotes = noteStore.allSortedNotes || noteStore.notes
  if (!noteLinkSearch.value) return allNotes
  const kw = noteLinkSearch.value.toLowerCase()
  return allNotes.filter(n => 
    (n.title || '').toLowerCase().includes(kw)
  )
})

const minimapRef = ref(null)

const minimapBounds = computed(() => {
  if (blocks.value.length === 0) {
    return { minX: -500, minY: -500, maxX: 1500, maxY: 1000 }
  }
  
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  
  for (const block of blocks.value) {
    const w = block.width || 240
    const h = getBlockHeight(block)
    minX = Math.min(minX, block.x)
    minY = Math.min(minY, block.y)
    maxX = Math.max(maxX, block.x + w)
    maxY = Math.max(maxY, block.y + h)
  }
  
  const padding = 200
  return {
    minX: minX - padding,
    minY: minY - padding,
    maxX: maxX + padding,
    maxY: maxY + padding
  }
})

const minimapViewBox = computed(() => {
  const { minX, minY, maxX, maxY } = minimapBounds.value
  const w = maxX - minX
  const h = maxY - minY
  return `${minX} ${minY} ${w} ${h}`
})

const minimapViewportStyle = computed(() => {
  const { minX, minY, maxX, maxY } = minimapBounds.value
  const totalW = maxX - minX
  const totalH = maxY - minY
  
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return {}
  
  const viewW = rect.width / canvasConfig.value.zoom
  const viewH = rect.height / canvasConfig.value.zoom
  const viewX = -canvasConfig.value.offsetX / canvasConfig.value.zoom
  const viewY = -canvasConfig.value.offsetY / canvasConfig.value.zoom
  
  const left = ((viewX - minX) / totalW) * 100
  const top = ((viewY - minY) / totalH) * 100
  const width = (viewW / totalW) * 100
  const height = (viewH / totalH) * 100
  
  return {
    left: `${Math.max(0, Math.min(100, left))}%`,
    top: `${Math.max(0, Math.min(100, top))}%`,
    width: `${Math.min(100, Math.max(5, width))}%`,
    height: `${Math.min(100, Math.max(5, height))}%`
  }
})

function getBlockHeight(block) {
  if (block.type === 'image') {
    return block.minHeight || 200
  }
  return Math.max(60, block.minHeight || 60)
}

function getBlockMinimapColor(block) {
  const colors = {
    green: '#a8d5ba',
    blue: '#b8c8d8',
    yellow: '#d5c9a8',
    pink: '#d8b8b5',
    gray: '#c8cac9',
    white: '#e8eae8'
  }
  return colors[block.color] || '#e8eae8'
}

onMounted(() => {
  noteStore.init()
  if (note.value) {
    noteTitle.value = note.value.title
    canvasConfig.value = { ...note.value.canvasConfig }
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('mousedown', onWindowMouseDown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('mouseup', onWindowMouseUp)
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('mousedown', onWindowMouseDown)
})

watch(() => route.params.id, (newId) => {
  if (noteStore.notes.find(n => n.id === newId)) {
    const n = noteStore.notes.find(n => n.id === newId)
    noteTitle.value = n.title
    canvasConfig.value = { ...n.canvasConfig }
  }
})

function onKeyDown(e) {
  const isEditing = document.activeElement?.contentEditable === 'true' || 
                    document.activeElement?.tagName === 'INPUT' ||
                    document.activeElement?.tagName === 'TEXTAREA'
  
  const ctrlKey = e.ctrlKey || e.metaKey
  
  if (ctrlKey && e.key.toLowerCase() === 'c' && selectedBlockId.value && !isEditing) {
    const block = blocks.value.find(b => b.id === selectedBlockId.value)
    if (block) {
      copiedBlock.value = JSON.parse(JSON.stringify(block))
    }
    return
  }
  
  if (ctrlKey && e.key.toLowerCase() === 'v' && copiedBlock.value && !isEditing) {
    const rect = canvasRef.value.getBoundingClientRect()
    const centerX = (rect.width / 2 - canvasConfig.value.offsetX) / canvasConfig.value.zoom - 120
    const centerY = (rect.height / 2 - canvasConfig.value.offsetY) / canvasConfig.value.zoom - 30
    
    const newBlockData = {
      ...copiedBlock.value,
      x: centerX + Math.random() * 40 - 20,
      y: centerY + Math.random() * 40 - 20
    }
    delete newBlockData.id
    
    if (note.value) {
      saveHistory()
      const newBlock = noteStore.addBlock(note.value.id, newBlockData)
      selectedBlockId.value = newBlock.id
    }
    e.preventDefault()
    return
  }
  
  if (ctrlKey && e.key.toLowerCase() === 'd' && selectedBlockId.value && !isEditing) {
    const block = blocks.value.find(b => b.id === selectedBlockId.value)
    if (block && note.value) {
      saveHistory()
      const newBlockData = JSON.parse(JSON.stringify(block))
      newBlockData.x += 30
      newBlockData.y += 30
      delete newBlockData.id
      const newBlock = noteStore.addBlock(note.value.id, newBlockData)
      selectedBlockId.value = newBlock.id
    }
    e.preventDefault()
    return
  }
  
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedBlockId.value && !isEditing) {
    deleteBlock(selectedBlockId.value)
    e.preventDefault()
    return
  }
  
  if (e.key === 'Escape') {
    selectedBlockId.value = null
    selectedConnectionId.value = null
    connectMode.value = false
    connectingFrom.value = null
    copiedBlock.value = null
    return
  }
  
  if (ctrlKey && e.key === '+' || (ctrlKey && e.key === '=')) {
    zoomIn()
    e.preventDefault()
    return
  }
  
  if (ctrlKey && e.key === '-') {
    zoomOut()
    e.preventDefault()
    return
  }
  
  if (ctrlKey && e.key === '0') {
    resetView()
    e.preventDefault()
    return
  }
  
  if ((e.key === 'n' || e.key === 'N') && !isEditing) {
    addTextBlock()
    e.preventDefault()
    return
  }
  
  if ((e.key === 't' || e.key === 'T') && !isEditing) {
    toggleConnectMode()
    e.preventDefault()
    return
  }

  // 撤销 Ctrl+Z
  if (ctrlKey && e.key.toLowerCase() === 'z' && !e.shiftKey) {
    undo()
    e.preventDefault()
    return
  }

  // 重做 Ctrl+Y 或 Ctrl+Shift+Z
  if (ctrlKey && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
    redo()
    e.preventDefault()
    return
  }
  
  if (selectedBlockId.value && !isEditing && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
    const block = blocks.value.find(b => b.id === selectedBlockId.value)
    if (block && note.value) {
      const step = e.shiftKey ? 20 : 5
      let { x, y } = block
      if (e.key === 'ArrowUp') y -= step
      if (e.key === 'ArrowDown') y += step
      if (e.key === 'ArrowLeft') x -= step
      if (e.key === 'ArrowRight') x += step
      // 碰撞检测
      const { x: finalX, y: finalY } = resolveCollision(selectedBlockId.value, x, y)
      noteStore.updateBlock(note.value.id, selectedBlockId.value, { x: finalX, y: finalY })
    }
    e.preventDefault()
    return
  }
  
  if (e.key === ' ' && !isEditing) {
    if (!isPanning.value) {
      isPanning.value = true
      panStart.value = {
        x: e.clientX,
        y: e.clientY,
        offsetX: canvasConfig.value.offsetX,
        offsetY: canvasConfig.value.offsetY
      }
    }
    e.preventDefault()
    return
  }
}

function goBack() {
  router.push('/notes')
}

function updateTitle() {
  if (note.value) {
    noteStore.updateNote(note.value.id, { title: noteTitle.value })
  }
}

function zoomIn() {
  canvasConfig.value.zoom = Math.min(2, canvasConfig.value.zoom + 0.1)
  saveCanvasConfig()
}

function zoomOut() {
  canvasConfig.value.zoom = Math.max(0.3, canvasConfig.value.zoom - 0.1)
  saveCanvasConfig()
}

function resetView() {
  canvasConfig.value = { zoom: 1, offsetX: 0, offsetY: 0 }
  saveCanvasConfig()
}

function saveCanvasConfig() {
  if (note.value) {
    noteStore.updateCanvasConfig(note.value.id, canvasConfig.value)
  }
}

function onWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.3, Math.min(2, canvasConfig.value.zoom + delta))
  
  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  
  const scaleRatio = newZoom / canvasConfig.value.zoom
  canvasConfig.value.offsetX = mouseX - (mouseX - canvasConfig.value.offsetX) * scaleRatio
  canvasConfig.value.offsetY = mouseY - (mouseY - canvasConfig.value.offsetY) * scaleRatio
  canvasConfig.value.zoom = newZoom
  
  saveCanvasConfig()
}

function onWindowMouseUp() {
  if (isPanning.value) {
    isPanning.value = false
    saveCanvasConfig()
  }
  if (draggingBlock.value) {
    hasDragged.value = false
    draggingBlock.value = null
  }
}

function onWindowMouseDown(e) {
  if (contextMenu.value.show && !e.target.closest('.context-menu')) {
    contextMenu.value.show = false
  }
  if (showExportMenu.value && !e.target.closest('.export-dropdown')) {
    showExportMenu.value = false
  }
}

function onContextMenu(e) {
  const blockEl = e.target.closest('.note-block')
  
  const canvasPos = screenToCanvas(e.clientX, e.clientY)
  
  contextMenu.value = {
    show: true,
    type: blockEl ? 'block' : 'canvas',
    x: e.clientX,
    y: e.clientY,
    canvasX: canvasPos.x,
    canvasY: canvasPos.y
  }
  
  if (blockEl && selectedBlockId.value) {
  } else if (!blockEl) {
    selectedBlockId.value = null
    selectedConnectionId.value = null
  }
}

const isMinimapDragging = ref(false)

function onMinimapMouseDown(e) {
  if (e.button !== 0) return
  isMinimapDragging.value = true
  jumpToMinimapPosition(e)
  
  const onMove = (ev) => {
    if (isMinimapDragging.value) {
      jumpToMinimapPosition(ev)
    }
  }
  
  const onUp = () => {
    isMinimapDragging.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
  }
  
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

function jumpToMinimapPosition(e) {
  if (!minimapRef.value) return
  
  const rect = minimapRef.value.getBoundingClientRect()
  const { minX, minY, maxX, maxY } = minimapBounds.value
  const totalW = maxX - minX
  const totalH = maxY - minY
  
  const ratioX = (e.clientX - rect.left) / rect.width
  const ratioY = (e.clientY - rect.top) / rect.height
  
  const canvasRect = canvasRef.value.getBoundingClientRect()
  const viewW = canvasRect.width / canvasConfig.value.zoom
  const viewH = canvasRect.height / canvasConfig.value.zoom
  
  const targetX = minX + ratioX * totalW - viewW / 2
  const targetY = minY + ratioY * totalH - viewH / 2
  
  canvasConfig.value.offsetX = -targetX * canvasConfig.value.zoom
  canvasConfig.value.offsetY = -targetY * canvasConfig.value.zoom
  saveCanvasConfig()
}

function onMinimapWheel(e) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.3, Math.min(2, canvasConfig.value.zoom + delta))
  
  const rect = canvasRef.value.getBoundingClientRect()
  const mouseX = rect.width / 2
  const mouseY = rect.height / 2
  
  const scaleRatio = newZoom / canvasConfig.value.zoom
  canvasConfig.value.offsetX = mouseX - (mouseX - canvasConfig.value.offsetX) * scaleRatio
  canvasConfig.value.offsetY = mouseY - (mouseY - canvasConfig.value.offsetY) * scaleRatio
  canvasConfig.value.zoom = newZoom
  
  saveCanvasConfig()
}

function onWindowMouseMove(e) {
  if (isPanning.value) {
    canvasConfig.value.offsetX = panStart.value.offsetX + (e.clientX - panStart.value.x)
    canvasConfig.value.offsetY = panStart.value.offsetY + (e.clientY - panStart.value.y)
  }
  
  if (connectingFrom.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    tempMousePos.value = {
      x: (e.clientX - rect.left - canvasConfig.value.offsetX) / canvasConfig.value.zoom,
      y: (e.clientY - rect.top - canvasConfig.value.offsetY) / canvasConfig.value.zoom
    }
  }
  
  if (draggingBlock.value) {
    const rect = canvasRef.value.getBoundingClientRect()
    const canvasX = (e.clientX - rect.left - canvasConfig.value.offsetX) / canvasConfig.value.zoom
    const canvasY = (e.clientY - rect.top - canvasConfig.value.offsetY) / canvasConfig.value.zoom
    
    // 只有移动超过5px才真正开始拖拽，避免点击误触
    if (!hasDragged.value) {
      const dx = Math.abs(canvasX - dragStartMousePos.value.x)
      const dy = Math.abs(canvasY - dragStartMousePos.value.y)
      if (dx < 5 && dy < 5) return
      // 第一次真正移动时保存历史
      saveHistory()
      hasDragged.value = true
    }
    
    const newX = canvasX - dragOffset.value.x
    const newY = canvasY - dragOffset.value.y
    
    // 获取当前块
    const currentBlock = blocks.value.find(b => b.id === draggingBlock.value)
    if (!currentBlock) return
    
    const width = currentBlock.width || 240
    const height = currentBlock.minHeight || 60
    
    // 使用 Interact.js 进行碰撞检测
    let finalX = newX
    let finalY = newY
    
    // 多次迭代确保不重叠
    for (let iteration = 0; iteration < 3; iteration++) {
      let moved = false
      
      for (const other of blocks.value) {
        if (other.id === draggingBlock.value) continue
        
        const otherWidth = other.width || 240
        const otherHeight = other.minHeight || 60
        
        // 检测 AABB 碰撞
        if (finalX < other.x + otherWidth &&
            finalX + width > other.x &&
            finalY < other.y + otherHeight &&
            finalY + height > other.y) {
          
          // 计算分离向量
          const overlapX1 = finalX + width - other.x
          const overlapX2 = other.x + otherWidth - finalX
          const overlapY1 = finalY + height - other.y
          const overlapY2 = other.y + otherHeight - finalY
          
          const minOverlapX = Math.min(overlapX1, overlapX2)
          const minOverlapY = Math.min(overlapY1, overlapY2)
          
          if (minOverlapX < minOverlapY) {
            // X方向分离
            if (overlapX1 < overlapX2) {
              finalX = other.x - width
            } else {
              finalX = other.x + otherWidth
            }
          } else {
            // Y方向分离
            if (overlapY1 < overlapY2) {
              finalY = other.y - height
            } else {
              finalY = other.y + otherHeight
            }
          }
          moved = true
        }
      }
      
      if (!moved) break
    }
    
    noteStore.updateBlock(note.value.id, draggingBlock.value, { x: finalX, y: finalY })
  }
}

function onCanvasMouseDown(e) {
  if (e.target === canvasRef.value || e.target.classList.contains('canvas-bg') || e.target.closest('.blocks-layer') === null && e.target.tagName !== 'svg' && !e.target.closest('svg')) {
    if (e.button === 0) {
      selectedBlockId.value = null
      selectedConnectionId.value = null
      if (!connectMode.value) {
        isPanning.value = true
        panStart.value = {
          x: e.clientX,
          y: e.clientY,
          offsetX: canvasConfig.value.offsetX,
          offsetY: canvasConfig.value.offsetY
        }
      }
    }
  }
}

function onCanvasMouseMove() {
}

function onCanvasMouseUp() {
}

function onCanvasDblClick(e) {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = (e.clientX - rect.left - canvasConfig.value.offsetX) / canvasConfig.value.zoom - 120
  const y = (e.clientY - rect.top - canvasConfig.value.offsetY) / canvasConfig.value.zoom - 30
  
  addTextBlockAt(x, y)
}

function screenToCanvas(clientX, clientY) {
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: (clientX - rect.left - canvasConfig.value.offsetX) / canvasConfig.value.zoom,
    y: (clientY - rect.top - canvasConfig.value.offsetY) / canvasConfig.value.zoom
  }
}

function addTextBlock() {
  const centerX = -canvasConfig.value.offsetX / canvasConfig.value.zoom + 300 + newBlockOffset.value
  const centerY = -canvasConfig.value.offsetY / canvasConfig.value.zoom + 200 + newBlockOffset.value
  newBlockOffset.value += 30
  addTextBlockAt(centerX, centerY)
}

function createNoteLinkBlock(noteId) {
  if (noteId === note.value?.id) return
  
  let x, y
  
  if (noteLinkSourceBlockId.value) {
    const sourceBlock = blocks.value.find(b => b.id === noteLinkSourceBlockId.value)
    if (sourceBlock) {
      x = sourceBlock.x + (sourceBlock.width || 240) + 40
      y = sourceBlock.y
    } else {
      x = -canvasConfig.value.offsetX / canvasConfig.value.zoom + 300 + newBlockOffset.value
      y = -canvasConfig.value.offsetY / canvasConfig.value.zoom + 200 + newBlockOffset.value
      newBlockOffset.value += 30
    }
    noteLinkSourceBlockId.value = null
  } else {
    x = -canvasConfig.value.offsetX / canvasConfig.value.zoom + 300 + newBlockOffset.value
    y = -canvasConfig.value.offsetY / canvasConfig.value.zoom + 200 + newBlockOffset.value
    newBlockOffset.value += 30
  }
  
  if (note.value) {
    saveHistory()
    noteStore.addBlock(note.value.id, {
      x,
      y,
      type: 'note-link',
      linkedNoteId: noteId,
      width: 280,
      minHeight: 70
    })
  }
  
  closeNoteLinkModal()
}

function openLinkedNote(noteId) {
  router.push(`/note/${noteId}`)
}

function closeNoteLinkModal() {
  showNoteLinkModal.value = false
  noteLinkSearch.value = ''
  noteLinkSourceBlockId.value = null
}

function showImagePreview(url) {
  previewImageUrl.value = url
  showImagePreviewModal.value = true
}

function closeImagePreview() {
  showImagePreviewModal.value = false
  previewImageUrl.value = ''
}

function exportAsPDF() {
  showExportMenu.value = false
  
  const originalTransform = canvasConfig.value
  const originalZoom = canvasConfig.value.zoom
  const originalOffset = { ...canvasConfig.value.offset }
  
  if (blocks.value.length > 0) {
    const minX = Math.min(...blocks.value.map(b => b.x))
    const minY = Math.min(...blocks.value.map(b => b.y))
    canvasConfig.value.zoom = 1
    canvasConfig.value.offsetX = -minX + 60
    canvasConfig.value.offsetY = -minY + 60
  }
  
  nextTick(() => {
    window.print()
    
    setTimeout(() => {
      canvasConfig.value.zoom = originalZoom
      canvasConfig.value.offsetX = originalOffset.x
      canvasConfig.value.offsetY = originalOffset.y
    }, 500)
  })
}

function exportAsImage() {
  showExportMenu.value = false
  
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  
  if (!blocks.value.length) {
    canvas.width = 800
    canvas.height = 600
    ctx.fillStyle = '#f8faf8'
    ctx.fillRect(0, 0, 800, 600)
  } else {
    const padding = 60
    const minX = Math.min(...blocks.value.map(b => b.x))
    const minY = Math.min(...blocks.value.map(b => b.y))
    const maxX = Math.max(...blocks.value.map(b => b.x + (b.width || 240)))
    const maxY = Math.max(...blocks.value.map(b => {
      if (b.type === 'image') return b.y + (b.minHeight || 200)
      return b.y + Math.max(60, b.minHeight || 80)
    }))
    
    const width = maxX - minX + padding * 2
    const height = maxY - minY + padding * 2
    
    canvas.width = width
    canvas.height = height
    
    ctx.fillStyle = '#f8faf8'
    ctx.fillRect(0, 0, width, height)
    
    const offsetX = -minX + padding
    const offsetY = -minY + padding
    
    const colorMap = {
      green: '#a8d5ba',
      blue: '#b8c8d8',
      yellow: '#d5c9a8',
      pink: '#d8b8b5',
      gray: '#c8cac9',
      white: '#ffffff'
    }
    
    connections.value.forEach(conn => {
      const fromBlock = blocks.value.find(b => b.id === conn.from)
      const toBlock = blocks.value.find(b => b.id === conn.to)
      if (!fromBlock || !toBlock) return
      
      const fromW = fromBlock.width || 240
      const fromH = fromBlock.minHeight || 60
      const toW = toBlock.width || 240
      const toH = toBlock.minHeight || 60
      
      const fromCenterX = fromBlock.x + fromW / 2 + offsetX
      const fromCenterY = fromBlock.y + fromH / 2 + offsetY
      const toCenterX = toBlock.x + toW / 2 + offsetX
      const toCenterY = toBlock.y + toH / 2 + offsetY
      
      const fromWidth = fromW / 2
      const fromHeight = fromH / 2
      const toWidth = toW / 2
      const toHeight = toH / 2
      
      const dx = toCenterX - fromCenterX
      const dy = toCenterY - fromCenterY
      
      let fromX, fromY, toX, toY
      
      if (Math.abs(dx) * fromHeight > Math.abs(dy) * fromWidth) {
        fromX = fromCenterX + (dx > 0 ? fromWidth : -fromWidth)
        fromY = fromCenterY + dy * (fromWidth / Math.abs(dx))
      } else {
        fromY = fromCenterY + (dy > 0 ? fromHeight : -fromHeight)
        fromX = fromCenterX + dx * (fromHeight / Math.abs(dy))
      }
      
      if (Math.abs(dx) * toHeight > Math.abs(dy) * toWidth) {
        toX = toCenterX - (dx > 0 ? toWidth : -toWidth)
        toY = toCenterY - dy * (toWidth / Math.abs(dx))
      } else {
        toY = toCenterY - (dy > 0 ? toHeight : -toHeight)
        toX = toCenterX - dx * (toHeight / Math.abs(dy))
      }
      
      ctx.strokeStyle = conn.color || '#4a9568'
      ctx.lineWidth = parseInt(conn.width) || 2
      ctx.beginPath()
      ctx.moveTo(fromX, fromY)
      
      const offset = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4
      
      const fromDirX = fromX - fromCenterX
      const fromDirY = fromY - fromCenterY
      const fromLen = Math.sqrt(fromDirX * fromDirX + fromDirY * fromDirY) || 1
      const fromNormX = fromDirX / fromLen
      const fromNormY = fromDirY / fromLen
      
      const toDirX = toX - toCenterX
      const toDirY = toY - toCenterY
      const toLen = Math.sqrt(toDirX * toDirX + toDirY * toDirY) || 1
      const toNormX = toDirX / toLen
      const toNormY = toDirY / toLen
      
      const c1x = fromX + fromNormX * offset
      const c1y = fromY + fromNormY * offset
      const c2x = toX + toNormX * offset
      const c2y = toY + toNormY * offset
      
      ctx.bezierCurveTo(c1x, c1y, c2x, c2y, toX, toY)
      ctx.stroke()
    })
    
    blocks.value.forEach(block => {
      const x = block.x + offsetX
      const y = block.y + offsetY
      const w = block.width || 240
      let h
      if (block.type === 'image') {
        h = block.minHeight || 200
      } else {
        h = Math.max(60, block.minHeight || 80)
      }
      
      ctx.fillStyle = colorMap[block.color] || '#ffffff'
      ctx.beginPath()
      const radius = 8
      ctx.roundRect(x, y, w, h, radius)
      ctx.fill()
      
      ctx.strokeStyle = '#e8e8e8'
      ctx.lineWidth = 1
      ctx.stroke()
      
      ctx.fillStyle = '#333'
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
      if (block.type === 'image') {
        ctx.fillText('[图片]', x + 16, y + 30)
      } else if (block.type === 'note-link') {
        ctx.fillStyle = '#4a9568'
        ctx.fillText('🔗 引用笔记', x + 16, y + 30)
      } else if (block.content) {
        const text = block.content.replace(/<[^>]*>/g, '').slice(0, 50)
        ctx.fillText(text, x + 16, y + 30)
      }
    })
  }
  
  const link = document.createElement('a')
  link.download = `${note.value?.title || '笔记'}_${Date.now()}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

function addTextBlockAt(x, y) {
  if (note.value) {
    saveHistory()
    const block = noteStore.addBlock(note.value.id, { x, y, type: 'text' })
    selectedBlockId.value = block.id
  }
}

function addImageBlock() {
  currentImageBlockId.value = null
  fileInputRef.value?.click()
}

function onImageFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  
  isImageLoading.value = true
  
  const reader = new FileReader()
  reader.onload = (ev) => {
    const imgData = ev.target.result
    let centerX, centerY
    
    if (contextMenu.value.canvasXForImage !== undefined) {
      centerX = contextMenu.value.canvasXForImage
      centerY = contextMenu.value.canvasYForImage
      contextMenu.value.canvasXForImage = undefined
      contextMenu.value.canvasYForImage = undefined
    } else {
      centerX = -canvasConfig.value.offsetX / canvasConfig.value.zoom + 300 + newBlockOffset.value
      centerY = -canvasConfig.value.offsetY / canvasConfig.value.zoom + 200 + newBlockOffset.value
      newBlockOffset.value += 30
    }
    
    if (note.value) {
      saveHistory()
      if (currentImageBlockId.value) {
        // 获取当前块，检查类型
        const block = note.value.blocks.find(b => b.id === currentImageBlockId.value)
        if (block && block.type === 'image') {
          // 图片块类型，只更新图片
          noteStore.updateBlock(note.value.id, currentImageBlockId.value, {
            imageUrl: imgData
          })
        } else {
          // 文本块类型，不清空内容，直接返回
          // 改为创建新的图片块
          const newBlock = noteStore.addBlock(note.value.id, {
            x: centerX,
            y: centerY,
            type: 'image',
            imageUrl: imgData,
            width: 280,
            minHeight: 200
          })
          selectedBlockId.value = newBlock.id
        }
        currentImageBlockId.value = null
      } else {
        const block = noteStore.addBlock(note.value.id, {
          x: centerX,
          y: centerY,
          type: 'image',
          imageUrl: imgData,
          width: 280,
          minHeight: 200
        })
        selectedBlockId.value = block.id
      }
    }
    isImageLoading.value = false
  }
  reader.onerror = () => {
    isImageLoading.value = false
    alert('图片加载失败，请重试')
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function handleAddImageToBlock(blockId) {
  currentImageBlockId.value = blockId
  fileInputRef.value?.click()
}

function handleAddLinkToBlock(blockId) {
  selectedBlockId.value = blockId
}

function handleAddNoteLinkFromBlock(blockId) {
  noteLinkSourceBlockId.value = blockId
  showNoteLinkModal.value = true
  noteLinkSearch.value = ''
}

function selectBlock(id) {
  selectedBlockId.value = id
  selectedConnectionId.value = null
}

function selectConnection(id) {
  selectedConnectionId.value = id
  selectedBlockId.value = null
}

function updateBlockContent(blockId, updates) {
  if (note.value) {
    // 样式修改时保存历史
    if (updates.color || updates.borderStyle || updates.fontSize || updates.fontWeight || updates.textColor || updates.borderColor) {
      saveHistory()
    }
    noteStore.updateBlock(note.value.id, blockId, updates)
  }
}

function deleteBlock(blockId) {
  if (note.value) {
    saveHistory()
    noteStore.deleteBlock(note.value.id, blockId)
    if (selectedBlockId.value === blockId) {
      selectedBlockId.value = null
    }
  }
}

function deleteSelectedBlock() {
  if (selectedBlockId.value) {
    deleteBlock(selectedBlockId.value)
  }
  contextMenu.value.show = false
}

function copySelectedBlock() {
  if (selectedBlockId.value) {
    const block = blocks.value.find(b => b.id === selectedBlockId.value)
    if (block) {
      copiedBlock.value = JSON.parse(JSON.stringify(block))
    }
  }
  contextMenu.value.show = false
}

function duplicateSelectedBlock() {
  if (selectedBlockId.value && note.value) {
    const block = blocks.value.find(b => b.id === selectedBlockId.value)
    if (block) {
      saveHistory()
      const newBlockData = JSON.parse(JSON.stringify(block))
      newBlockData.x += 30
      newBlockData.y += 30
      delete newBlockData.id
      const newBlock = noteStore.addBlock(note.value.id, newBlockData)
      selectedBlockId.value = newBlock.id
    }
  }
  contextMenu.value.show = false
}

function pasteBlockHere() {
  if (copiedBlock.value && note.value) {
    saveHistory()
    const newBlockData = JSON.parse(JSON.stringify(copiedBlock.value))
    newBlockData.x = contextMenu.value.canvasX - 120
    newBlockData.y = contextMenu.value.canvasY - 30
    delete newBlockData.id
    const newBlock = noteStore.addBlock(note.value.id, newBlockData)
    selectedBlockId.value = newBlock.id
  }
  contextMenu.value.show = false
}

function addTextBlockAtContext() {
  addTextBlockAt(contextMenu.value.canvasX - 120, contextMenu.value.canvasY - 30)
  contextMenu.value.show = false
}

function addImageBlockAtContext() {
  currentImageBlockId.value = null
  contextMenu.value.canvasXForImage = contextMenu.value.canvasX - 140
  contextMenu.value.canvasYForImage = contextMenu.value.canvasY - 100
  contextMenu.value.show = false
  fileInputRef.value?.click()
}

function onBlockDragStart(blockId, clientX, clientY) {
  // 保存状态
  draggingBlock.value = blockId
  hasDragged.value = false
  selectedBlockId.value = blockId
  selectedConnectionId.value = null
  connectingFrom.value = null // 清除连线状态，避免干扰
  
  // 记录鼠标按下时的位置，用于判断是否真正开始拖拽
  const rect = canvasRef.value.getBoundingClientRect()
  const canvasX = (clientX - rect.left - canvasConfig.value.offsetX) / canvasConfig.value.zoom
  const canvasY = (clientY - rect.top - canvasConfig.value.offsetY) / canvasConfig.value.zoom
  
  dragStartMousePos.value = { x: canvasX, y: canvasY }
  
  // 计算鼠标相对于块左上角的偏移
  const block = blocks.value.find(b => b.id === blockId)
  if (block) {
    dragOffset.value = {
      x: canvasX - block.x,
      y: canvasY - block.y
    }
  }
}

function onBlockDragMove() {
  // handled in onCanvasMouseMove
}

function onBlockDragEnd() {
  draggingBlock.value = null
  hasDragged.value = false
}

function toggleConnectMode() {
  connectMode.value = !connectMode.value
  if (!connectMode.value) {
    connectingFrom.value = null
  }
}

function startConnection(blockId, position) {
  if (connectMode.value) {
    connectingFrom.value = blockId
    connectingPosition.value = position
  }
}

function endConnection(blockId, position) {
  if (connectMode.value && connectingFrom.value && connectingFrom.value !== blockId) {
    saveHistory()
    noteStore.addConnection(note.value.id, connectingFrom.value, blockId, 'straight')
  }
  connectingFrom.value = null
  connectingPosition.value = null
}

function getStrokeDashArray(style) {
  switch (style) {
    case 'dashed': return '8,4'
    case 'dotted': return '2,4'
    case 'dot-dash': return '2,2,6,2'
    default: return 'none'
  }
}

function getConnectionPath(conn) {
  const fromBlock = blocks.value.find(b => b.id === conn.from)
  const toBlock = blocks.value.find(b => b.id === conn.to)
  if (!fromBlock || !toBlock) return ''
  
  const fromW = fromBlock.width || 240
  const fromH = fromBlock.minHeight || 60
  const toW = toBlock.width || 240
  const toH = toBlock.minHeight || 60
  
  const fromCenterX = fromBlock.x + fromW / 2
  const fromCenterY = fromBlock.y + fromH / 2
  const toCenterX = toBlock.x + toW / 2
  const toCenterY = toBlock.y + toH / 2
  
  const fromWidth = fromW / 2
  const fromHeight = fromH / 2
  const toWidth = toW / 2
  const toHeight = toH / 2
  
  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY
  
  let fromX, fromY, toX, toY
  
  if (Math.abs(dx) * fromHeight > Math.abs(dy) * fromWidth) {
    fromX = fromCenterX + (dx > 0 ? fromWidth : -fromWidth)
    fromY = fromCenterY + dy * (fromWidth / Math.abs(dx))
  } else {
    fromY = fromCenterY + (dy > 0 ? fromHeight : -fromHeight)
    fromX = fromCenterX + dx * (fromHeight / Math.abs(dy))
  }
  
  if (Math.abs(dx) * toHeight > Math.abs(dy) * toWidth) {
    toX = toCenterX - (dx > 0 ? toWidth : -toWidth)
    toY = toCenterY - dy * (toWidth / Math.abs(dx))
  } else {
    toY = toCenterY - (dy > 0 ? toHeight : -toHeight)
    toX = toCenterX - dx * (toHeight / Math.abs(dy))
  }
  
  if (conn.style === 'bezier' || conn.style === 'dashed' || conn.style === 'dotted') {
    const offset = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4
    
    const fromDirX = fromX - fromCenterX
    const fromDirY = fromY - fromCenterY
    const fromLen = Math.sqrt(fromDirX * fromDirX + fromDirY * fromDirY) || 1
    const fromNormX = fromDirX / fromLen
    const fromNormY = fromDirY / fromLen
    
    const toDirX = toX - toCenterX
    const toDirY = toY - toCenterY
    const toLen = Math.sqrt(toDirX * toDirX + toDirY * toDirY) || 1
    const toNormX = toDirX / toLen
    const toNormY = toDirY / toLen
    
    const c1x = fromX + fromNormX * offset
    const c1y = fromY + fromNormY * offset
    const c2x = toX + toNormX * offset
    const c2y = toY + toNormY * offset
    
    return `M ${fromX} ${fromY} C ${c1x} ${c1y}, ${c2x} ${c2y}, ${toX} ${toY}`
  }
  
  return `M ${fromX} ${fromY} L ${toX} ${toY}`
}

function setConnectionStyle(style) {
  if (selectedConnectionId.value && note.value) {
    saveHistory()
    noteStore.updateConnection(note.value.id, selectedConnectionId.value, { style })
  }
}

function setConnectionWidth(width) {
  if (selectedConnectionId.value && note.value) {
    saveHistory()
    noteStore.updateConnection(note.value.id, selectedConnectionId.value, { width })
  }
}

function setConnectionColor(color) {
  if (selectedConnectionId.value && note.value) {
    saveHistory()
    noteStore.updateConnection(note.value.id, selectedConnectionId.value, { color })
  }
  currentLineColor.value = color
}

function deleteSelectedConnection() {
  if (selectedConnectionId.value && note.value) {
    saveHistory()
    noteStore.deleteConnection(note.value.id, selectedConnectionId.value)
    selectedConnectionId.value = null
  }
}
</script>

<style scoped>
.note-editor-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
  z-index: 10;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
}

.title-input {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  background: transparent;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  min-width: 150px;
  transition: background var(--transition-fast);
}

.title-input:hover {
  background: var(--bg-hover);
}

.title-input:focus {
  background: var(--bg-tertiary);
}

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 1;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
}

.zoom-controls {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
}

.zoom-level {
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 44px;
  text-align: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 200px;
  justify-content: flex-end;
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: grab;
}

.canvas-container.panning {
  cursor: grabbing;
}

.canvas-container.connect-mode {
  cursor: crosshair;
}

.canvas-bg {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(circle, #dce0db 1px, transparent 1px);
  pointer-events: none;
}

.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 10000px;
  height: 10000px;
  pointer-events: none;
}

.connection-path {
  pointer-events: none;
  transition: stroke 0.2s ease;
}

.connection-hit {
  pointer-events: stroke;
  cursor: pointer;
}

.connection-hit:hover + .connection-path {
  stroke-width: 3px;
}

.temp-connection {
  pointer-events: none;
  opacity: 0.7;
}

.blocks-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 10000px;
  height: 10000px;
  pointer-events: none;
}

.blocks-layer > * {
  pointer-events: auto;
}

.connection-toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-size: 13px;
  color: var(--text-secondary);
  z-index: 100;
}

.style-btn {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  transition: all var(--transition-fast);
}

.style-btn:hover {
  background: var(--bg-hover);
}

.style-btn.active {
  background: var(--primary-color);
  color: white;
}

.color-btn {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.color-btn:hover {
  transform: scale(1.15);
}

.color-btn.active {
  border-color: var(--text-primary);
  transform: scale(1.15);
}

.delete-btn {
  margin-left: 8px;
  color: var(--warning-color);
}

.delete-btn:hover {
  background: rgba(255, 124, 124, 0.1);
}

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 200px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 6px;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.context-menu-item:hover {
  background: var(--bg-hover);
}

.context-menu-item.danger {
  color: var(--warning-color);
}

.context-menu-item.danger:hover {
  background: rgba(217, 118, 118, 0.1);
}

.context-menu-item .shortcut {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-tertiary);
}

.context-menu-divider {
  height: 1px;
  background: var(--border-color);
  margin: 6px 0;
}

.right-panel {
  position: absolute;
  right: 8px;
  top: 70px;
  bottom: 20px;
  width: 140px;
  z-index: 5;
  border-left: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  box-shadow: -2px 0 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

.minimap {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 36px;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity var(--transition-fast), width var(--transition-fast);
}

.minimap:hover {
  opacity: 1;
}

.zoom-controls-bottom {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 6px 8px;
  border-top: 1px solid var(--border-light);
  opacity: 0.8;
  transition: opacity var(--transition-fast);
  box-sizing: border-box;
  height: 36px;
}

.zoom-controls-bottom:hover {
  opacity: 1;
}

.zoom-level-text {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: center;
}

.minimap-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: var(--text-tertiary);
  font-size: 12px;
  pointer-events: none;
}

.minimap-empty svg {
  opacity: 0.4;
}

.minimap-canvas {
  width: 100%;
  height: 100%;
  display: block;
  overflow: hidden;
}

.minimap-block {
  opacity: 0.8;
}

.minimap-block.selected {
  opacity: 1;
  stroke: var(--primary-color);
  stroke-width: 4;
}

.minimap-viewport {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px solid var(--primary-color);
  border-radius: var(--radius-sm);
  background: rgba(74, 149, 104, 0.1);
  pointer-events: none;
  box-sizing: border-box;
}

.note-link-modal {
  width: 480px;
  max-height: 80vh;
  padding: 0 !important;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border-light);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.note-link-search {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 24px;
  border-bottom: 1px solid var(--border-light);
}

.note-link-search .input {
  flex: 1;
}

.note-link-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.note-link-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background var(--transition-fast);
}

.note-link-item:hover {
  background: var(--bg-hover);
}

.note-link-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.note-link-item-icon {
  width: 36px;
  height: 36px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
}

.note-link-item-info {
  flex: 1;
  min-width: 0;
}

.note-link-item-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 2px;
}

.note-link-item-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

.note-link-item-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.export-dropdown {
  position: fixed;
  top: 70px;
  right: 200px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  z-index: 1000;
  min-width: 160px;
}

.export-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.export-item:hover {
  background: var(--bg-hover);
}

@media print {
  .sidebar,
  .editor-header,
  .minimap,
  .toolbar,
  .zoom-controls {
    display: none !important;
  }
  
  .editor-content {
    padding: 0 !important;
  }
  
  .canvas-container {
    background: white !important;
    cursor: default !important;
  }
  
  .note-block {
    box-shadow: none !important;
    border: 1px solid #ddd !important;
  }
}

@media (max-width: 768px) {
  .header-left, .header-right {
    min-width: auto;
  }
  
  .header-center {
    display: none;
  }
  
  .btn span:not(.zoom-level) {
    display: none;
  }
  
  .header-right .btn {
    padding: 8px;
    width: 36px;
    height: 36px;
  }
  
  .title-input {
    min-width: 100px;
    font-size: 14px;
  }
}

.spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.image-preview-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  cursor: pointer;
}

.image-preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-image {
  max-width: 90vw;
  max-height: 90vh;
  object-fit: contain;
  border-radius: var(--radius-md);
  cursor: default;
}

.image-preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.image-preview-close:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>

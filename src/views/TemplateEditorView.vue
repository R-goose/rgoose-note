<template>
  <div class="tpl-editor-view">
    <header class="editor-header">
      <div class="header-left">
        <button class="btn btn-ghost btn-icon" @click="goBack" title="返回">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="19" y1="12" x2="5" y2="12"/>
            <polyline points="12 19 5 12 12 5"/>
          </svg>
        </button>
        <input
          ref="titleInputRef"
          v-model="name"
          type="text"
          class="title-input"
          spellcheck="false"
          placeholder="模板名称"
          @input="autoSizeTitle"
        />
      </div>
      <div class="header-center">
        <div class="toolbar">
          <button class="btn btn-secondary" @click="addBlock('text')" title="添加文本块">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            文本块
          </button>
          <button class="btn btn-secondary" @click="addBlock('table')" title="添加表格块">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="3" y="3" width="18" height="18" rx="1"/>
              <line x1="3" y1="9" x2="21" y2="9"/>
              <line x1="3" y1="15" x2="21" y2="15"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
              <line x1="15" y1="3" x2="15" y2="21"/>
            </svg>
            表格块
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
          <div class="bg-type-wrapper">
            <button
              class="btn"
              :class="bgType !== 'none' ? 'btn-primary' : 'btn-secondary'"
              @click="showBgMenu = !showBgMenu"
              title="画布背景"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/>
                <rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <rect x="14" y="14" width="7" height="7" rx="1"/>
              </svg>
              背景
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            <div v-if="showBgMenu" class="bg-type-menu">
              <div class="bg-type-item" :class="{ active: bgType === 'grid' }" @click="setBgType('grid')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z"/></svg>
                <span>网格</span>
              </div>
              <div class="bg-type-item" :class="{ active: bgType === 'dots' }" @click="setBgType('dots')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="6" cy="6" r="1.5"/><circle cx="12" cy="6" r="1.5"/><circle cx="18" cy="6" r="1.5"/><circle cx="6" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="18" cy="12" r="1.5"/><circle cx="6" cy="18" r="1.5"/><circle cx="12" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>
                <span>点阵</span>
              </div>
              <div class="bg-type-item" :class="{ active: bgType === 'none' }" @click="setBgType('none')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="3" x2="21" y2="21"/></svg>
                <span>无背景</span>
              </div>
              <div class="bg-type-divider"></div>
              <div class="bg-type-item" :class="{ active: bgType === 'image' }" @click="setBgType('image')">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span>自定义图片</span>
              </div>
              <label v-if="bgType === 'image'" class="bg-type-item bg-upload-label">
                <input type="file" accept="image/*" @change="onBgImageUpload" style="display:none"/>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span>{{ bgImage ? '更换图片' : '选择图片' }}</span>
              </label>
              <div v-if="bgType === 'image' && bgImage" class="bg-opacity-control">
                <span>透明度</span>
                <input type="range" min="5" max="60" :value="bgOpacity" @input="e => bgOpacity = +e.target.value" />
              </div>
            </div>
          </div>
          <button
            class="btn"
            :class="snapToGrid ? 'btn-primary' : 'btn-secondary'"
            @click="snapToGrid = !snapToGrid"
            :title="snapToGrid ? `吸附到网格（${gridSize}px）` : '网格吸附：关'"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M5 3v18M11 3v18M17 3v18M3 5h18M3 11h18M3 17h18"/>
              <rect x="9" y="9" width="6" height="6" rx="1" fill="currentColor" fill-opacity="0.3"/>
            </svg>
            吸附
          </button>
        </div>
      </div>
      <div class="header-right">
        <span class="save-indicator" :class="{ saving }">
          <span class="save-dot"></span>
          {{ saving ? '保存中...' : '已保存' }}
        </span>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <svg v-if="saving" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存
        </button>
      </div>
    </header>

    <div
      ref="canvasRef"
      class="canvas-container"
      :class="{ 'connect-mode': connectMode, 'panning': isPanning, 'space-held': spaceHeld }"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMousemove"
      @mouseup="onCanvasMouseup"
      @mouseleave="onCanvasMouseLeave"
      @wheel="onWheel"
      @click.self="clearSelection"
    >
      <div class="canvas-bg" :style="canvasBgStyle"></div>

      <div
        class="blocks-layer"
        :style="cellStyle"
      >
        <NoteBlock
          v-for="b in draftBlocks"
          :key="b.id"
          :ref="el => { if (el) blockRefs[b.id] = el; else delete blockRefs[b.id] }"
          :block="b"
          :all-blocks="draftBlocks"
          :selected="selectedBlockId === b.id"
          :connect-mode="connectMode"
          :connecting-from="connectingFrom"
          :read-only="false"
          :canvas-scale="canvasConfig.zoom"
          @select="selectedBlockId = $event"
          @connect-start="startConnection"
          @connect-end="endConnection"
          @update="onUpdate"
          @delete="onDelete"
          @resize-block="onResizeBlock"
          @resize="onResize"
          @drag-start="onDragStart"
        />
      </div>

      <svg class="connections-layer" :style="cellStyle">
        <defs>
          <marker
            v-for="m in connectionMarkers"
            :key="m.id"
            :id="m.id"
            :markerWidth="m.vw"
            :markerHeight="m.vh"
            :refX="m.rx"
            :refY="m.ry"
            orient="auto"
            :fill="m.isOpen ? 'none' : m.color"
            :stroke="m.isOpen ? m.color : 'none'"
            v-html="m.html"
          ></marker>
        </defs>
        <g v-for="conn in draftConnections" :key="conn.id">
          <path
            :data-conn-id="conn.id"
            :d="getConnectionPath(conn)"
            :stroke="conn.color"
            :stroke-width="conn.width || 2"
            fill="none"
            :stroke-dasharray="getStrokeDashArray(conn)"
            :marker-start="getStartMarker(conn)"
            :marker-end="getEndMarker(conn)"
            class="connection-path"
            :class="{ selected: selectedConnectionId === conn.id }"
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

      <div class="zoom-controls-bottom">
        <button class="btn btn-ghost btn-icon" @click="zoomOut" title="缩小">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <span class="zoom-level-text">{{ Math.round(canvasConfig.zoom * 100) }}%</span>
        <button class="btn btn-ghost btn-icon" @click="zoomIn" title="放大">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
        <button class="btn btn-ghost btn-icon" @click="resetView" title="重置视图">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
      </div>

      <div v-if="selectedConnectionId" class="connection-toolbar">
        <span>形状：</span>
        <button
          v-for="shape in lineShapes" :key="shape.value"
          class="style-btn" :class="{ active: currentConnectionStyle === shape.value }"
          @click="setConnectionStyle(shape.value)"
        >{{ shape.label }}</button>
        <span>线型：</span>
        <button
          v-for="dash in lineDashTypes" :key="dash.value"
          class="style-btn" :class="{ active: currentConnectionDash === dash.value }"
          @click="setConnectionDash(dash.value)"
        >{{ dash.label }}</button>
        <span>线宽：</span>
        <button
          v-for="width in lineWidths" :key="width.value"
          class="style-btn width-btn" :class="{ active: currentConnectionWidth === width.value }"
          @click="setConnectionWidth(width.value)"
        >{{ width.label }}</button>
        <span>箭头：</span>
        <button
          v-for="a in arrowTypes" :key="a.value"
          class="style-btn" :class="{ active: currentConnectionArrow === a.value }"
          @click="setConnectionArrow(a.value)"
        >{{ a.label }}</button>
        <span>方向：</span>
        <button
          v-for="d in arrowDirs" :key="d.value"
          class="style-btn dir-btn" :class="{ active: currentConnectionDir === d.value }"
          @click="setConnectionDir(d.value)"
        >{{ d.label }}</button>
        <span>颜色：</span>
        <button
          v-for="color in lineColors" :key="color"
          class="color-btn" :class="{ active: currentConnectionColor === color }"
          :style="{ background: color }"
          @click="setConnectionColor(color)"
        ></button>
        <button class="btn btn-ghost btn-icon delete-btn" @click="deleteSelectedConnection" title="删除连线">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
        </button>
      </div>

      <div v-if="selectedBlock" class="connection-toolbar block-style-toolbar">
        <span>背景：</span>
        <button
          v-for="color in blockBgColors" :key="color.value"
          class="color-btn" :class="{ active: (selectedBlock.color || 'default') === color.value }"
          :style="{ background: color.swatch }"
          @click="setBlockStyle({ color: color.value })"
        ></button>
        <template v-if="selectedBlock.type === 'text'">
          <span>文字：</span>
          <button class="style-btn" :class="{ active: selFormat?.bold }" @mousedown.prevent @click="formatSelection('bold')" title="加粗"><strong>B</strong></button>
          <button class="style-btn" :class="{ active: selFormat?.italic }" @mousedown.prevent @click="formatSelection('italic')" title="斜体"><em>I</em></button>
          <button class="style-btn" :class="{ active: selFormat?.underline }" @mousedown.prevent @click="formatSelection('underline')" title="下划线"><span style="text-decoration: underline;">U</span></button>
          <button class="style-btn" :class="{ active: selFormat?.strikeThrough }" @mousedown.prevent @click="formatSelection('strikeThrough')" title="删除线"><span style="text-decoration: line-through;">S</span></button>
          <span class="style-divider"></span>
          <button
            v-for="color in blockTextColors" :key="'sel-' + color.value"
            class="color-btn" :class="{ active: selFormat?.foreColor === color.value }"
            :style="{ background: color.swatch }" :title="'文字颜色 ' + color.value"
            @mousedown.prevent @click="formatSelection('foreColor', color.value)"
          ></button>
          <span>字号：</span>
          <button
            v-for="size in blockFontSizes" :key="size.value"
            class="style-btn" :class="{ active: selFormat ? selFormat.fontSize === size.value : (selectedBlock.fontSize || 14) === size.value }"
            @mousedown.prevent @click="formatSelection('fontSize', String(size.value))"
          >{{ size.label }}</button>
          <span>粗细：</span>
          <button
            v-for="weight in blockFontWeights" :key="weight.value"
            class="style-btn" :class="{ active: selFormat ? selFormat.fontWeight === weight.value : (selectedBlock.fontWeight || 400) === weight.value }"
            @mousedown.prevent @click="formatSelection('fontWeight', String(weight.value))"
          >{{ weight.label }}</button>
        </template>
        <span>边框：</span>
        <button
          v-for="border in blockBorderStyles" :key="border.value"
          class="style-btn" :class="{ active: (selectedBlock.borderStyle || 'solid') === border.value }"
          @click="setBlockStyle({ borderStyle: border.value })"
        >{{ border.label }}</button>
        <span>边框色：</span>
        <button
          v-for="color in blockBorderColors" :key="color.value"
          class="color-btn" :class="{ active: selectedBlock.borderColor === color.value }"
          :style="{ background: color.swatch }"
          @click="setBlockStyle({ borderColor: color.value })"
        ></button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { generateId } from '@/utils'
import { pushOverlappingBlocks } from '@/utils/blockLayout'
import { connectionEndpoints, connectionPort } from '@/utils/connectionPorts'
import { useTemplateStore } from '@/stores/template'
import NoteBlock from '@/components/NoteBlock.vue'

const route = useRoute()
const router = useRouter()
const templateStore = useTemplateStore()
const { success: toastSuccess, error: toastError } = useToast()

const isNew = computed(() => route.params.id === 'new')
const tplId = computed(() => route.params.id)

const name = ref('')
const desc = ref('')
const draftBlocks = ref([])
const draftConnections = ref([])
const selectedBlockId = ref(null)
const selectedConnectionId = ref(null)
const saving = ref(false)

// 标题输入框自适应宽度（与笔记编辑器一致）
const titleInputRef = ref(null)
let titleMirrorEl = null
function autoSizeTitle() {
  const input = titleInputRef.value
  if (!input) return
  const text = input.value || input.placeholder || ''
  if (!titleMirrorEl) {
    const mirror = document.createElement('span')
    mirror.style.position = 'absolute'
    mirror.style.visibility = 'hidden'
    mirror.style.whiteSpace = 'pre'
    mirror.style.top = '-9999px'
    mirror.style.left = '-9999px'
    mirror.setAttribute('aria-hidden', 'true')
    document.body.appendChild(mirror)
    titleMirrorEl = mirror
  }
  const mirror = titleMirrorEl
  const cs = getComputedStyle(input)
  mirror.style.font = cs.font
  mirror.style.letterSpacing = cs.letterSpacing
  mirror.textContent = text || ' '
  const padL = parseFloat(cs.paddingLeft) || 0
  const padR = parseFloat(cs.paddingRight) || 0
  const textWidth = mirror.getBoundingClientRect().width
  input.style.width = Math.max(80, Math.ceil(textWidth + padL + padR)) + 'px'
}

const canvasRef = ref(null)
const PAD = 80

// ===== 画布缩放 =====
const canvasConfig = ref({ zoom: 1, offsetX: 0, offsetY: 0 })
const gridSize = ref(24)
const bgType = ref(localStorage.getItem('rgoose_bg_type') || 'grid')
const bgImage = ref(localStorage.getItem('rgoose_bg_image') || '')
const bgOpacity = ref(parseInt(localStorage.getItem('rgoose_bg_opacity')) || 15)
const showBgMenu = ref(false)
watch(bgType, v => localStorage.setItem('rgoose_bg_type', v))
watch(bgImage, v => localStorage.setItem('rgoose_bg_image', v))
watch(bgOpacity, v => localStorage.setItem('rgoose_bg_opacity', v))

function setBgType(type) {
  bgType.value = type
  if (type !== 'image') showBgMenu.value = false
}

function onBgImageUpload(e) {
  const file = e.target.files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    bgImage.value = reader.result
    showBgMenu.value = false
  }
  reader.readAsDataURL(file)
  e.target.value = ''
}

function snapVal(v) {
  if (!snapToGrid.value) return v
  return Math.round(v / gridSize.value) * gridSize.value
}
const snapToGrid = ref(localStorage.getItem('rgoose_snap_grid') === 'true')
watch(snapToGrid, v => localStorage.setItem('rgoose_snap_grid', v ? 'true' : 'false'))

const canvasBgStyle = computed(() => {
  if (bgType.value === 'none') return { opacity: 0 }
  if (bgType.value === 'image' && bgImage.value) {
    return {
      backgroundImage: `url(${bgImage.value})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: bgOpacity.value / 100
    }
  }
  const size = gridSize.value * canvasConfig.value.zoom
  if (bgType.value === 'dots') {
    return {
      backgroundImage: 'radial-gradient(var(--grid-line) 1.5px, transparent 1.5px)',
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${canvasConfig.value.offsetX}px ${canvasConfig.value.offsetY}px`,
      opacity: 0.5
    }
  }
  return {
    backgroundImage:
      'linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)',
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `${canvasConfig.value.offsetX}px ${canvasConfig.value.offsetY}px`,
    opacity: 0.4
  }
})

// 内容层的 transform 与尺寸（含连线 svg 复用，超大画布层与笔记一致）
const cellStyle = computed(() => ({
  width: '10000px',
  height: '10000px',
  transform: `translate(${canvasConfig.value.offsetX}px, ${canvasConfig.value.offsetY}px) scale(${canvasConfig.value.zoom})`,
  transformOrigin: '0 0'
}))

function zoomIn() {
  canvasConfig.value.zoom = Math.min(2, canvasConfig.value.zoom + 0.1)
}
function zoomOut() {
  canvasConfig.value.zoom = Math.max(0.3, canvasConfig.value.zoom - 0.1)
}
function resetView() {
  canvasConfig.value = { zoom: 1, offsetX: 0, offsetY: 0 }
}

// 滚轮缩放（以鼠标位置为中心，与笔记编辑器一致）
function onWheel(e) {
  e.preventDefault()
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  const newZoom = Math.max(0.3, Math.min(2, canvasConfig.value.zoom + delta))
  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return
  const mouseX = e.clientX - rect.left
  const mouseY = e.clientY - rect.top
  const scaleRatio = newZoom / canvasConfig.value.zoom
  canvasConfig.value.offsetX = mouseX - (mouseX - canvasConfig.value.offsetX) * scaleRatio
  canvasConfig.value.offsetY = mouseY - (mouseY - canvasConfig.value.offsetY) * scaleRatio
  canvasConfig.value.zoom = newZoom
}

// 画布平移（中键拖拽 / 空格+左键拖拽，与笔记编辑器一致）
const isPanning = ref(false)
const spaceHeld = ref(false)
let panInfo = null
function onCanvasMouseDown(e) {
  if (e.target.closest?.('.note-block')) return
  if (e.button === 1 || (e.button === 0 && spaceHeld.value)) {
    isPanning.value = true
    panInfo = {
      startX: e.clientX,
      startY: e.clientY,
      offsetX: canvasConfig.value.offsetX,
      offsetY: canvasConfig.value.offsetY
    }
    document.addEventListener('mousemove', onPanMove)
    document.addEventListener('mouseup', onPanEnd)
    e.preventDefault()
  }
}
function onPanMove(e) {
  if (!panInfo) return
  canvasConfig.value.offsetX = panInfo.offsetX + (e.clientX - panInfo.startX)
  canvasConfig.value.offsetY = panInfo.offsetY + (e.clientY - panInfo.startY)
}
function onPanEnd() {
  panInfo = null
  isPanning.value = false
  document.removeEventListener('mousemove', onPanMove)
  document.removeEventListener('mouseup', onPanEnd)
}

function onSpaceKeyDown(e) {
  if (e.code === 'Space' && !e.target.closest('input, textarea, [contenteditable]')) {
    spaceHeld.value = true
  }
}
function onSpaceKeyUp(e) {
  if (e.code === 'Space') {
    spaceHeld.value = false
  }
}

// ===== 块操作 =====
function onUpdate(id, updates) {
  const b = draftBlocks.value.find(x => x.id === id)
  if (b) Object.assign(b, updates)
}

function onDelete(id) {
  const idx = draftBlocks.value.findIndex(x => x.id === id)
  if (idx >= 0) {
    draftBlocks.value.splice(idx, 1)
    if (selectedBlockId.value === id) selectedBlockId.value = null
  }
  if (blockSizes.value[id]) {
    const nextSizes = { ...blockSizes.value }
    delete nextSizes[id]
    blockSizes.value = nextSizes
  }
  draftConnections.value = draftConnections.value.filter(c => c.from !== id && c.to !== id)
}

// 与笔记编辑器保持一致：ResizeObserver 只缓存 DOM 的真实尺寸，不能回写块数据。
// 否则文本块的内容尺寸会覆盖用户拖拽后的目标尺寸，表现为“拉伸后立刻缩回去”。
const blockSizes = ref({})

function onResize({ id, width, height }) {
  blockSizes.value = { ...blockSizes.value, [id]: { width, height } }
}

function onResizeBlock({ id, dir, width, height, x, y }) {
  const b = draftBlocks.value.find(bb => bb.id === id)
  if (b) {
    const next = {
      width: snapVal(width),
      height: snapVal(height),
      x: snapVal(x),
      y: snapVal(y)
    }
    Object.assign(b, next)
    blockSizes.value = { ...blockSizes.value, [id]: { width: next.width, height: next.height } }

    const layout = draftBlocks.value.map(block => {
      const size = block.id === id ? next : getBlockSize(block.id, block)
      return { id: block.id, x: block.x, y: block.y, width: size.width, height: size.height }
    })
    const pushed = pushOverlappingBlocks(layout, id, next, dir)
    for (const [pushedId, position] of Object.entries(pushed)) {
      const pushedBlock = draftBlocks.value.find(block => block.id === pushedId)
      if (pushedBlock) Object.assign(pushedBlock, position)
    }
  }
}

function addBlock(type) {
  const n = draftBlocks.value.length
  const def = type === 'table'
    ? { type: 'table', tableData: 'a|b\n1|2' }
    : { type: 'text', content: '<h3>标题</h3><p>在这里输入内容...</p>' }
  const col = n % 2
  const row = Math.floor(n / 2)
  const block = {
    id: generateId(),
    ...def,
    x: snapVal(PAD + col * 340),
    y: snapVal(70 + row * 200),
    width: 300,
    minHeight: type === 'table' ? 140 : 120,
    color: 'default',
    borderStyle: 'solid'
  }
  draftBlocks.value.push(block)
  selectedBlockId.value = block.id
  selectedConnectionId.value = null
}

// ===== 拖动移动 =====
let dragInfo = null
function onDragStart(id, clientX, clientY) {
  const b = draftBlocks.value.find(x => x.id === id)
  if (!b) return
  selectedBlockId.value = id
  selectedConnectionId.value = null
  const c = toContentPos(clientX, clientY)
  dragInfo = {
    id,
    startX: c.x,
    startY: c.y,
    blockX: b.x || 0,
    blockY: b.y || 0
  }
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}
function onDragMove(e) {
  if (!dragInfo) return
  const { id, startX, startY, blockX, blockY } = dragInfo
  const b = draftBlocks.value.find(x => x.id === id)
  if (!b) return
  const c = toContentPos(e.clientX, e.clientY)
  b.x = Math.max(0, snapVal(Math.round(blockX + (c.x - startX))))
  b.y = Math.max(0, snapVal(Math.round(blockY + (c.y - startY))))
}
function onDragEnd() {
  dragInfo = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

function toContentPos(clientX, clientY) {
  const el = canvasRef.value
  if (!el) return { x: clientX, y: clientY }
  const rect = el.getBoundingClientRect()
  const x = (clientX - rect.left - canvasConfig.value.offsetX) / canvasConfig.value.zoom
  const y = (clientY - rect.top - canvasConfig.value.offsetY) / canvasConfig.value.zoom
  return { x, y }
}
function onCanvasMousemove(e) {
  if (!connectingFrom.value) return
  tempMousePos.value = toContentPos(e.clientX, e.clientY)
}
function onCanvasMouseup() {
  // 在空白画布上松开：取消未完成的临时连线
  cancelTempConnection()
}
function onCanvasMouseLeave() {
  // 与笔记编辑器一致：mouseleave 交由全局 mouseup 兜底，这里不额外破坏拖拽/连线状态
}
function cancelTempConnection() {
  if (connectingFrom.value) {
    connectingFrom.value = null
    connectingPosition.value = null
    tempMousePos.value = { x: 0, y: 0 }
  }
}
function clearSelection() {
  selectedBlockId.value = null
  selectedConnectionId.value = null
}

// ===== 连线系统 =====
const connectMode = ref(false)
const connectingFrom = ref(null)
const connectingPosition = ref(null)
const tempMousePos = ref({ x: 0, y: 0 })
const currentLineColor = ref('#6bbd8f')

function toggleConnectMode() {
  connectMode.value = !connectMode.value
  if (!connectMode.value) {
    connectingFrom.value = null
    connectingPosition.value = null
    selectedConnectionId.value = null
  }
}
function startConnection(blockId, position) {
  if (!connectMode.value) return
  if (connectingFrom.value === blockId) {
    cancelTempConnection()
    return
  }
  if (connectingFrom.value) {
    endConnection(blockId, position)
    return
  }
  connectingFrom.value = blockId
  connectingPosition.value = position
}
function endConnection(blockId, position) {
  if (!connectMode.value || !connectingFrom.value || connectingFrom.value === blockId) return
  draftConnections.value.push({
    id: generateId(),
    from: connectingFrom.value,
    to: blockId,
    fromSide: connectingPosition.value,
    toSide: position,
    shape: 'straight',
    color: '#6bbd8f',
    width: '2',
    dash: 'solid',
    arrow: 'standard',
    dir: 'forward',
    label: ''
  })
  selectedConnectionId.value = draftConnections.value[draftConnections.value.length - 1].id
  cancelTempConnection()
}

function selectConnection(id) {
  selectedConnectionId.value = id
  selectedBlockId.value = null
}
function deleteSelectedConnection() {
  if (!selectedConnectionId.value) return
  const idx = draftConnections.value.findIndex(c => c.id === selectedConnectionId.value)
  if (idx >= 0) draftConnections.value.splice(idx, 1)
  selectedConnectionId.value = null
}

function resolveConnShape(conn) {
  if (conn.shape) return conn.shape
  return conn.style === 'bezier' ? 'bezier' : 'straight'
}
function resolveConnDash(conn) {
  if (conn.dash) return conn.dash
  const s = conn.style
  if (s === 'dashed' || s === 'dotted' || s === 'dot-dash') return s
  return 'solid'
}
function getStrokeDashArray(conn) {
  const dash = resolveConnDash(conn)
  switch (dash) {
    case 'dashed': return '8,4'
    case 'dotted': return '2,4'
    case 'dot-dash': return '2,2,6,2'
    default: return 'none'
  }
}

const lineShapes = [
  { label: '直线', value: 'straight' },
  { label: '曲线', value: 'bezier' }
]
const lineDashTypes = [
  { label: '实线', value: 'solid' },
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
const arrowTypes = [
  { label: '标准', value: 'standard' },
  { label: '细箭头', value: 'thin' },
  { label: '开放', value: 'open' },
  { label: '圆形', value: 'circle' },
  { label: '方形', value: 'square' },
  { label: '菱形', value: 'diamond' }
]
const arrowDirs = [
  { label: '→', value: 'forward' },
  { label: '←', value: 'backward' },
  { label: '↔', value: 'both' },
  { label: '—', value: 'none' }
]
const lineColors = ['#6bbd8f', '#7fa8c4', '#c9a96e', '#b88a7a', '#8fa89a', '#a89a7a', '#9a8fa8', '#a87f7f']

const currentConnectionStyle = computed(() => {
  const conn = draftConnections.value.find(c => c.id === selectedConnectionId.value)
  return conn ? resolveConnShape(conn) : 'straight'
})
const currentConnectionDash = computed(() => {
  const conn = draftConnections.value.find(c => c.id === selectedConnectionId.value)
  return conn ? resolveConnDash(conn) : 'solid'
})
const currentConnectionColor = computed(() => {
  const conn = draftConnections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.color || '#6bbd8f'
})
const currentConnectionWidth = computed(() => {
  const conn = draftConnections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.width || '2'
})
const currentConnectionArrow = computed(() => {
  const conn = draftConnections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.arrow || 'standard'
})
const currentConnectionDir = computed(() => {
  const conn = draftConnections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.dir || 'forward'
})

function setConnectionStyle(shape) {
  if (selectedConnectionId.value) onConnectionUpdate({ shape })
}
function setConnectionDash(dash) {
  if (selectedConnectionId.value) onConnectionUpdate({ dash })
}
function setConnectionWidth(width) {
  if (selectedConnectionId.value) onConnectionUpdate({ width })
}
function setConnectionColor(color) {
  if (selectedConnectionId.value) onConnectionUpdate({ color })
  currentLineColor.value = color
}
function setConnectionArrow(arrow) {
  if (selectedConnectionId.value) onConnectionUpdate({ arrow })
}
function setConnectionDir(dir) {
  if (selectedConnectionId.value) onConnectionUpdate({ dir })
}
function onConnectionUpdate(patch) {
  const c = draftConnections.value.find(x => x.id === selectedConnectionId.value)
  if (c) Object.assign(c, patch)
}

// ===== 连线几何 =====
function getArrowType(conn) { return conn.arrow || 'standard' }
function getArrowDir(conn) { return conn.dir || 'forward' }
function getEndMarker(conn) {
  const dir = getArrowDir(conn)
  if (dir === 'backward' || dir === 'none') return ''
  return `url(#${markerId(conn, false)})`
}
function getStartMarker(conn) {
  const dir = getArrowDir(conn)
  if (dir === 'forward' || dir === 'none') return ''
  return `url(#${markerId(conn, true)})`
}
const ARROW_SHAPES = {
  standard: {
    end:   { vw:10, vh:10, rx:9,  ry:5, html:'<path d="M 0 0 L 10 5 L 0 10 z"/>' },
    start: { vw:10, vh:10, rx:1,  ry:5, html:'<path d="M 10 0 L 0 5 L 10 10 z"/>' }
  },
  thin: {
    end:   { vw:12, vh:12, rx:11, ry:6, html:'<path d="M 0 3 L 11 6 L 0 9 L 3 6 z"/>' },
    start: { vw:12, vh:12, rx:1,  ry:6, html:'<path d="M 12 3 L 1 6 L 12 9 L 9 6 z"/>' }
  },
  open: {
    end:   { vw:12, vh:12, rx:11, ry:6, html:'<path d="M 0 0 L 11 6 L 0 12" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' },
    start: { vw:12, vh:12, rx:1,  ry:6, html:'<path d="M 12 0 L 1 6 L 12 12" fill="none" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' }
  },
  circle: {
    end:   { vw:8, vh:8, rx:4, ry:4, html:'<circle cx="4" cy="4" r="3.5"/>' },
    start: { vw:8, vh:8, rx:4, ry:4, html:'<circle cx="4" cy="4" r="3.5"/>' }
  },
  square: {
    end:   { vw:8, vh:8, rx:4, ry:4, html:'<rect x="0.5" y="0.5" width="7" height="7"/>' },
    start: { vw:8, vh:8, rx:4, ry:4, html:'<rect x="0.5" y="0.5" width="7" height="7"/>' }
  },
  diamond: {
    end:   { vw:12, vh:10, rx:6, ry:5, html:'<path d="M 0 5 L 6 0 L 12 5 L 6 10 z"/>' },
    start: { vw:12, vh:10, rx:6, ry:5, html:'<path d="M 0 5 L 6 0 L 12 5 L 6 10 z"/>' }
  }
}
const OPEN_ARROWS = new Set(['open'])
function markerId(conn, isStart) {
  const type = getArrowType(conn)
  const c = (conn.color || '#6bbd8f').replace(/[^a-zA-Z0-9]/g, '')
  return `am-${type}-${isStart ? 's' : 'e'}-${c}`
}
const connectionMarkers = computed(() => {
  const list = []
  const seen = new Set()
  for (const conn of draftConnections.value) {
    const dir = getArrowDir(conn)
    const type = getArrowType(conn)
    const shape = ARROW_SHAPES[type] || ARROW_SHAPES.standard
    const isOpen = OPEN_ARROWS.has(type)
    const color = conn.color || '#6bbd8f'
    const need = [{ isStart: false, show: dir === 'forward' || dir === 'both' }, { isStart: true, show: dir === 'backward' || dir === 'both' }]
    for (const { isStart, show } of need) {
      if (!show) continue
      const id = markerId(conn, isStart)
      if (seen.has(id)) continue
      seen.add(id)
      const s = isStart ? shape.start : shape.end
      list.push({ id, ...s, color, isOpen })
    }
  }
  return list
})

function cross(ax, ay, bx, by) { return ax * by - ay * bx }
function segmentsIntersect(a, b, c, d) {
  const d1 = cross(c.x - a.x, c.y - a.y, b.x - a.x, b.y - a.y)
  const d2 = cross(c.x - b.x, c.y - b.y, b.x - a.x, b.y - a.y)
  const d3 = cross(a.x - c.x, a.y - c.y, d.x - c.x, d.y - c.y)
  const d4 = cross(a.x - d.x, a.y - d.y, d.x - c.x, d.y - c.y)
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true
  const onSeg = (p, q, r) => Math.min(p.x, r.x) - 0.01 <= q.x && q.x <= Math.max(p.x, r.x) + 0.01 &&
                               Math.min(p.y, r.y) - 0.01 <= q.y && q.y <= Math.max(p.y, r.y) + 0.01
  if (Math.abs(d1) < 0.01 && onSeg(a, c, b)) return true
  if (Math.abs(d2) < 0.01 && onSeg(a, c, b)) return true
  if (Math.abs(d3) < 0.01 && onSeg(c, a, d)) return true
  if (Math.abs(d4) < 0.01 && onSeg(c, a, d)) return true
  return false
}
function pointInRect(p, x, y, w, h, padding = 0.5) {
  return p.x > x + padding && p.x < x + w - padding && p.y > y + padding && p.y < y + h - padding
}
function segmentIntersectsRect(p1, p2, x, y, w, h) {
  const pad = 0.5
  const minX = x + pad, maxX = x + w - pad
  const minY = y + pad, maxY = y + h - pad
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  let tmin = 0, tmax = 1
  for (const axis of [{ d: dx, lo: minX, hi: maxX, o: p1.x }, { d: dy, lo: minY, hi: maxY, o: p1.y }]) {
    if (Math.abs(axis.d) < 1e-9) {
      if (axis.o < axis.lo || axis.o > axis.hi) return false
    } else {
      let t1 = (axis.lo - axis.o) / axis.d
      let t2 = (axis.hi - axis.o) / axis.d
      if (t1 > t2) { const tmp = t1; t1 = t2; t2 = tmp }
      tmin = Math.max(tmin, t1)
      tmax = Math.min(tmax, t2)
      if (tmin > tmax) return false
    }
  }
  return tmin <= tmax
}
function hasLineOfSight(p1, p2, obstacles) {
  for (const o of obstacles) {
    if (segmentIntersectsRect(p1, p2, o.x, o.y, o.width, o.height)) return false
  }
  return true
}
function findRoutingPath(start, end, obstacles) {
  if (!obstacles.length) return [start, end]
  if (hasLineOfSight(start, end, obstacles)) return [start, end]
  const margin = 16
  const pts = [start, end]
  for (const o of obstacles) {
    const x1 = o.x - margin, x2 = o.x + o.width + margin
    const y1 = o.y - margin, y2 = o.y + o.height + margin
    pts.push({ x: x1, y: y1 }, { x: x2, y: y1 }, { x: x1, y: y2 }, { x: x2, y: y2 })
  }
  const n = pts.length
  const dist = new Array(n).fill(Infinity)
  const prev = new Array(n).fill(-1)
  const visited = new Array(n).fill(false)
  dist[0] = 0
  for (let i = 0; i < n; i++) {
    let u = -1, best = Infinity
    for (let j = 0; j < n; j++) {
      if (!visited[j] && dist[j] < best) { best = dist[j]; u = j }
    }
    if (u === -1 || u === 1) break
    visited[u] = true
    for (let v = 0; v < n; v++) {
      if (visited[v] || v === u) continue
      if (!hasLineOfSight(pts[u], pts[v], obstacles)) continue
      const d = Math.hypot(pts[u].x - pts[v].x, pts[u].y - pts[v].y)
      if (dist[u] + d < dist[v]) { dist[v] = dist[u] + d; prev[v] = u }
    }
  }
  if (dist[1] !== Infinity) {
    const path = []
    let cur = 1
    while (cur !== -1) { path.unshift(pts[cur]); cur = prev[cur] }
    return path
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const o of obstacles) {
    minX = Math.min(minX, o.x - margin)
    minY = Math.min(minY, o.y - margin)
    maxX = Math.max(maxX, o.x + o.width + margin)
    maxY = Math.max(maxY, o.y + o.height + margin)
  }
  const startAnchor = { x: Math.max(minX, Math.min(maxX, start.x)), y: Math.max(minY, Math.min(maxY, start.y)) }
  const endAnchor = { x: Math.max(minX, Math.min(maxX, end.x)), y: Math.max(minY, Math.min(maxY, end.y)) }
  const candidates = [
    [start, { x: startAnchor.x, y: minY }, { x: endAnchor.x, y: minY }, end],
    [start, { x: startAnchor.x, y: maxY }, { x: endAnchor.x, y: maxY }, end],
    [start, { x: minX, y: startAnchor.y }, { x: minX, y: endAnchor.y }, end],
    [start, { x: maxX, y: startAnchor.y }, { x: maxX, y: endAnchor.y }, end]
  ]
  let bestPath = [start, end]
  let bestLen = Infinity
  for (const c of candidates) {
    const len = c.reduce((s, p, i) => i ? s + Math.hypot(p.x - c[i-1].x, p.y - c[i-1].y) : 0, 0)
    if (len < bestLen) { bestLen = len; bestPath = c }
  }
  return bestPath
}
function pathFromPolyline(pts) {
  if (!pts.length) return ''
  const simplified = [pts[0]]
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1]
    if (Math.abs(cross(b.x - a.x, b.y - a.y, c.x - a.x, c.y - a.y)) > 0.01) simplified.push(b)
  }
  simplified.push(pts[pts.length - 1])
  return 'M ' + simplified.map(p => `${p.x} ${p.y}`).join(' L ')
}
function pathFromRoundedPolyline(pts, radius = 14) {
  if (pts.length < 3) return pathFromPolyline(pts)
  let d = `M ${pts[0].x} ${pts[0].y}`
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1]
    const abLen = Math.hypot(b.x - a.x, b.y - a.y)
    const bcLen = Math.hypot(c.x - b.x, c.y - b.y)
    const r = Math.min(radius, abLen / 2, bcLen / 2)
    if (r <= 0.5) { d += ` L ${b.x} ${b.y}`; continue }
    const p1x = b.x - (b.x - a.x) / abLen * r
    const p1y = b.y - (b.y - a.y) / abLen * r
    const p2x = b.x + (c.x - b.x) / bcLen * r
    const p2y = b.y + (c.y - b.y) / bcLen * r
    d += ` L ${p1x} ${p1y} Q ${b.x} ${b.y}, ${p2x} ${p2y}`
  }
  const last = pts[pts.length - 1]
  d += ` L ${last.x} ${last.y}`
  return d
}
function getBlockSize(blockId, block) {
  const b = block || draftBlocks.value.find(x => x.id === blockId)
  if (!b) return { width: 240, height: 60 }
  const measured = blockSizes.value[blockId]
  if (measured?.width > 0 && measured?.height > 0) return measured
  return { width: b.width || 240, height: b.height || b.minHeight || 60 }
}
function getObstaclesBetween(fromId, toId) {
  const list = []
  for (const b of draftBlocks.value) {
    if (b.id === fromId || b.id === toId) continue
    const { width, height } = getBlockSize(b.id, b)
    if (width <= 0 || height <= 0) continue
    list.push({ x: b.x, y: b.y, width, height })
  }
  return list
}
function getConnectionPath(conn) {
  const fromBlock = draftBlocks.value.find(b => b.id === conn.from)
  const toBlock = draftBlocks.value.find(b => b.id === conn.to)
  if (!fromBlock || !toBlock) return ''
  const { width: fromW, height: fromH } = getBlockSize(conn.from, fromBlock)
  const { width: toW, height: toH } = getBlockSize(conn.to, toBlock)
  const fromCenterX = fromBlock.x + fromW / 2
  const fromCenterY = fromBlock.y + fromH / 2
  const toCenterX = toBlock.x + toW / 2
  const toCenterY = toBlock.y + toH / 2
  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY
  const { from, to } = connectionEndpoints(
    fromBlock, { width: fromW, height: fromH },
    toBlock, { width: toW, height: toH }, conn
  )
  if ([from.x, from.y, to.x, to.y].some(v => Number.isNaN(v) || !Number.isFinite(v))) return ''
  const shape = resolveConnShape(conn)
  const isCurved = shape === 'bezier'
  const obstacles = getObstaclesBetween(conn.from, conn.to)
  const directBlocked = !hasLineOfSight(from, to, obstacles)
  if (!directBlocked) {
    if (isCurved) {
      const dist = Math.hypot(dx, dy) || 1
      const nx = -dy / dist
      const ny = dx / dist
      const bow = Math.min(dist * 0.25, 120)
      const mx = (from.x + to.x) / 2 + nx * bow
      const my = (from.y + to.y) / 2 + ny * bow
      return `M ${from.x} ${from.y} Q ${mx} ${my}, ${to.x} ${to.y}`
    }
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  }
  const route = findRoutingPath(from, to, obstacles)
  if (isCurved) return pathFromRoundedPolyline(route)
  return pathFromPolyline(route)
}

const tempConnectionPath = computed(() => {
  if (!connectingFrom.value) return ''
  const fromBlock = draftBlocks.value.find(b => b.id === connectingFrom.value)
  if (!fromBlock) return ''
  const { width: fromW, height: fromH } = getBlockSize(connectingFrom.value, fromBlock)
  const fromCenterX = fromBlock.x + fromW / 2
  const fromCenterY = fromBlock.y + fromH / 2
  const toX = tempMousePos.value.x
  const toY = tempMousePos.value.y
  const dx = toX - fromCenterX
  const dy = toY - fromCenterY
  const from = connectionPort(fromBlock, { width: fromW, height: fromH }, connectingPosition.value)
  const fromX = from.x, fromY = from.y
  if ([fromX, fromY, toX, toY].some(v => Number.isNaN(v) || !Number.isFinite(v))) return ''
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

// ===== 选中块样式面板 =====
const blockRefs = {}
const selectedBlock = computed(() => {
  if (!selectedBlockId.value) return null
  return draftBlocks.value.find(b => b.id === selectedBlockId.value) || null
})
const selFormat = ref(null)
watch(selectedBlockId, () => { selFormat.value = null })

const blockBgColors = [
  { value: 'default', swatch: 'repeating-conic-gradient(#c0c4c0 0% 25%, #e8ebe8 0% 50%) 50% / 8px 8px' },
  { value: 'green', swatch: '#6bbd8f' },
  { value: 'blue', swatch: '#6fa8d6' },
  { value: 'yellow', swatch: '#d4b27a' },
  { value: 'pink', swatch: '#d49595' },
  { value: 'gray', swatch: '#939a96' }
]
const blockFontSizes = [
  { value: 12, label: '小' },
  { value: 14, label: '中' },
  { value: 16, label: '大' },
  { value: 20, label: '特大' }
]
const blockFontWeights = [
  { value: 400, label: '常规' },
  { value: 500, label: '中等' },
  { value: 700, label: '粗体' }
]
const isDarkTheme = ref(document.documentElement.getAttribute('data-theme') === 'dark')
const blockTextColors = computed(() => {
  const base = [
    { value: '#52a377', swatch: '#6bbd8f' },
    { value: '#4d8cbe', swatch: '#6fa8d6' },
    { value: '#b8955a', swatch: '#d4b27a' },
    { value: '#d97676', swatch: '#e08080' }
  ]
  return isDarkTheme.value
    ? [{ value: '#f5f7f4', swatch: '#ffffff' }, ...base]
    : [{ value: '#1a1f1c', swatch: '#5a625e' }, ...base]
})
const blockBorderStyles = [
  { value: 'solid', label: '实线' },
  { value: 'dashed', label: '虚线' },
  { value: 'dotted', label: '点线' },
  { value: 'none', label: '无' }
]
const blockBorderColors = [
  { value: '#e4e7e4', swatch: '#939a96' },
  { value: '#6bbd8f', swatch: '#6bbd8f' },
  { value: '#6fa8d6', swatch: '#6fa8d6' },
  { value: '#d4b27a', swatch: '#d4b27a' },
  { value: '#d97676', swatch: '#e08080' }
]

function setBlockStyle(patch) {
  if (!selectedBlockId.value) return
  onUpdate(selectedBlockId.value, patch)
}
function updateSelFormat() {
  if (!selectedBlockId.value) { selFormat.value = null; return }
  const inst = blockRefs[selectedBlockId.value]
  if (!inst || !inst.getSelectionFormat) { selFormat.value = null; return }
  selFormat.value = inst.getSelectionFormat()
}
function formatSelection(command, value = null) {
  if (!selectedBlockId.value) return
  const inst = blockRefs[selectedBlockId.value]
  const realSel = window.getSelection()
  let hasRealSelection = false
  if (realSel && realSel.rangeCount > 0) {
    const r = realSel.getRangeAt(0)
    if (!r.collapsed) hasRealSelection = true
  }
  if ((command === 'fontSize' || command === 'fontWeight') && !hasRealSelection) {
    const patch = command === 'fontSize' ? { fontSize: Number(value) } : { fontWeight: Number(value) }
    onUpdate(selectedBlockId.value, patch)
    if (inst && inst.clearInlineStyle) inst.clearInlineStyle(command)
    selFormat.value = null
    return
  }
  if (inst && inst.formatSelection) {
    inst.formatSelection(command, value)
    nextTick(updateSelFormat)
  }
}

// ===== 保存 / 加载 =====
async function save() {
  const title = name.value.trim()
  if (!title) {
    toastError('请输入模板名称')
    return
  }
  saving.value = true
  try {
    const payload = {
      name: title,
      desc: desc.value.trim(),
      blocks: draftBlocks.value,
      connections: draftConnections.value
    }
    if (isNew.value) {
      await templateStore.create(payload)
    } else {
      templateStore.update(tplId.value, payload)
    }
    toastSuccess('模板已保存')
    router.push('/templates')
  } catch (err) {
    toastError('保存失败：' + (err?.message || '未知错误'))
  } finally {
    saving.value = false
  }
}

function goBack() {
  if (dragInfo) onDragEnd()
  router.push('/templates')
}

// 全局兜底：鼠标在画布外松开时，正确结束平移/拖拽/临时连线
function onWindowMouseUp() {
  onPanEnd()
  onDragEnd()
  cancelTempConnection()
}

onMounted(async () => {
  window.addEventListener('keydown', onSpaceKeyDown)
  window.addEventListener('keyup', onSpaceKeyUp)
  window.addEventListener('mouseup', onWindowMouseUp)
  try { await templateStore.init() } catch {}
  if (isNew.value) {
    name.value = ''
    desc.value = ''
    draftBlocks.value = []
    draftConnections.value = []
  } else {
    const tpl = templateStore.getTemplateById(tplId.value)
    if (tpl) {
      name.value = tpl.name
      desc.value = tpl.desc || ''
      const content = templateStore.instantiateContent(tpl.blocks || [], tpl.connections || [])
      draftBlocks.value = content.blocks
      draftConnections.value = content.connections
    } else {
      toastError('模板不存在')
      router.replace('/templates')
    }
  }
  await nextTick()
  autoSizeTitle()
})

onUnmounted(() => {
  window.removeEventListener('keydown', onSpaceKeyDown)
  window.removeEventListener('keyup', onSpaceKeyUp)
  window.removeEventListener('mouseup', onWindowMouseUp)
  onPanEnd()
  onDragEnd()
})
</script>

<style scoped>
.tpl-editor-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--bg-primary);
}
.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
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
  flex-wrap: nowrap;
  flex: 1 1 0;
  justify-content: flex-start;
  min-width: 0;
  overflow: hidden;
}
.title-input {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  background: transparent;
  padding: 6px 10px;
  border-radius: var(--radius-md);
  flex: 0 0 auto;
  min-width: 80px;
  width: 80px;
  box-sizing: content-box;
  border: none;
  outline: none;
  transition: background var(--transition-fast);
}
.title-input:hover { background: var(--bg-hover); }
.title-input:focus { background: var(--bg-tertiary); }

.header-center {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 8px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 0;
  justify-content: flex-end;
  min-width: 0;
}
.save-indicator {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
}
.save-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #4caf50;
  transition: background 0.2s;
}
.save-indicator.saving .save-dot {
  background: #ff9800;
  animation: save-pulse 0.8s ease-in-out infinite;
}
@keyframes save-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: default;
  background-color: var(--bg-primary);
}
.canvas-container.panning {
  cursor: grabbing;
}
.canvas-container.space-held {
  cursor: grab;
}
.canvas-container.connect-mode {
  cursor: crosshair;
}
.canvas-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}
.blocks-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  overflow: visible;
}
.blocks-layer > * {
  pointer-events: auto;
}
.connections-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 10000px;
  height: 10000px;
  pointer-events: none;
  overflow: visible;
}
.bg-type-wrapper {
  position: relative;
}
.bg-type-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  min-width: 160px;
  padding: 6px;
  z-index: 100;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}
.bg-type-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: background 0.1s;
}
.bg-type-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.bg-type-item.active {
  color: var(--primary-color);
  font-weight: 600;
}
.bg-upload-label { cursor: pointer; }
.bg-type-divider {
  height: 1px;
  margin: 4px 0;
  background: var(--border-color);
}
.bg-opacity-control {
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-tertiary, var(--text-secondary));
}
.bg-opacity-control input[type="range"] {
  width: 100%;
  margin-top: 4px;
  accent-color: var(--primary-color);
}
.connection-path {
  pointer-events: none;
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}
.connection-path.selected {
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.45));
}
.connection-hit {
  pointer-events: stroke;
  cursor: pointer;
}
.temp-connection {
  pointer-events: none;
}

.btn {
  display: inline-flex;
  align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--radius-md);
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: none; transition: all var(--transition-fast);
  white-space: nowrap;
}
.btn-ghost { background: transparent; color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); }
.btn-icon { padding: 8px; }
.btn-primary { background: var(--primary-color); color: #fff; flex-shrink: 0; }
.btn-primary:hover { filter: brightness(1.05); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.btn-secondary { background: var(--bg-secondary); color: var(--text-primary); border-color: var(--border-color); border: 1px solid var(--border-color); }
.btn-secondary:hover { background: var(--bg-hover); }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }

.connection-toolbar {
  position: absolute;
  bottom: 48px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  flex-wrap: nowrap;
  white-space: nowrap;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-secondary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  font-size: 13px;
  color: var(--text-secondary);
  z-index: 100;
}
.connection-toolbar > span {
  white-space: nowrap;
  flex-shrink: 0;
}
.block-style-toolbar {
  gap: 6px;
  padding: 8px 12px;
  flex-wrap: nowrap;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  max-width: calc(100% - 60px);
}
.block-style-toolbar::-webkit-scrollbar { display: none; }
.block-style-toolbar > span { font-size: 12px; }
.block-style-toolbar .style-btn { padding: 4px 9px; font-size: 12px; }
.block-style-toolbar .style-divider {
  width: 1px;
  height: 18px;
  background: var(--border-color);
  flex-shrink: 0;
  margin: 0 2px;
}
.block-style-toolbar .color-btn {
  width: 20px;
  height: 20px;
  border: 2px solid var(--text-secondary);
}
.block-style-toolbar .color-btn.active {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-color);
}
.style-btn {
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  transition: all var(--transition-fast);
  cursor: pointer;
  border: none;
}
.style-btn:hover { background: var(--bg-hover); }
.style-btn.active { background: var(--primary-color); color: white; }
.color-btn {
  width: 22px;
  height: 22px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}
.color-btn:hover { transform: scale(1.15); }
.color-btn.active { border-color: var(--text-primary); transform: scale(1.15); }
.dir-btn {
  min-width: 30px;
  padding: 6px 8px;
  font-size: 14px;
  line-height: 1;
  text-align: center;
}
.delete-btn { margin-left: 8px; color: var(--warning-color); }

.zoom-controls-bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 200;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px 6px 12px;
  border-top: 1px solid var(--border-light);
  border-left: 1px solid var(--border-light);
  background: var(--bg-secondary);
  opacity: 0.8;
  transition: opacity var(--transition-fast);
  box-sizing: border-box;
  height: 36px;
}
.zoom-controls-bottom:hover { opacity: 1; }
.zoom-level-text {
  font-size: 11px;
  font-weight: 500;
  color: var(--text-secondary);
  min-width: 36px;
  text-align: center;
}
</style>

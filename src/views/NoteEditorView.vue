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
          @resize="onBlockResize"
        />
      </div>
      
      <svg class="connections-layer" :style="canvasTransformStyle">
        <defs>
          <marker id="arrow-standard" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="context-stroke"/>
          </marker>
          <marker id="arrow-standard-start" markerWidth="10" markerHeight="10" refX="1" refY="5" orient="auto">
            <path d="M 10 0 L 0 5 L 10 10 z" fill="context-stroke"/>
          </marker>
          <marker id="arrow-thin" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
            <path d="M 0 3 L 11 6 L 0 9 L 3 6 z" fill="context-stroke"/>
          </marker>
          <marker id="arrow-thin-start" markerWidth="12" markerHeight="12" refX="1" refY="6" orient="auto">
            <path d="M 12 3 L 1 6 L 12 9 L 9 6 z" fill="context-stroke"/>
          </marker>
          <marker id="arrow-open" markerWidth="12" markerHeight="12" refX="11" refY="6" orient="auto">
            <path d="M 0 0 L 11 6 L 0 12" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </marker>
          <marker id="arrow-open-start" markerWidth="12" markerHeight="12" refX="1" refY="6" orient="auto">
            <path d="M 12 0 L 1 6 L 12 12" fill="none" stroke="context-stroke" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </marker>
          <marker id="arrow-circle" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <circle cx="4" cy="4" r="3.5" fill="context-stroke"/>
          </marker>
          <marker id="arrow-circle-start" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <circle cx="4" cy="4" r="3.5" fill="context-stroke"/>
          </marker>
          <marker id="arrow-square" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <rect x="0.5" y="0.5" width="7" height="7" fill="context-stroke"/>
          </marker>
          <marker id="arrow-square-start" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <rect x="0.5" y="0.5" width="7" height="7" fill="context-stroke"/>
          </marker>
          <marker id="arrow-diamond" markerWidth="12" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M 0 5 L 6 0 L 12 5 L 6 10 z" fill="context-stroke"/>
          </marker>
          <marker id="arrow-diamond-start" markerWidth="12" markerHeight="10" refX="6" refY="5" orient="auto">
            <path d="M 0 5 L 6 0 L 12 5 L 6 10 z" fill="context-stroke"/>
          </marker>
        </defs>
        
        <g v-for="conn in connections" :key="conn.id">
          <path
            :d="getConnectionPath(conn)"
            :stroke="conn.color"
            :stroke-width="conn.width || 2"
            fill="none"
            :stroke-dasharray="getStrokeDashArray(conn)"
            :marker-start="getStartMarker(conn)"
            :marker-end="getEndMarker(conn)"
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
      <span>形状：</span>
      <button
        v-for="shape in lineShapes"
        :key="shape.value"
        class="style-btn"
        :class="{ active: currentConnectionStyle === shape.value }"
        @click="setConnectionStyle(shape.value)"
      >
        {{ shape.label }}
      </button>
      <span>线型：</span>
      <button
        v-for="dash in lineDashTypes"
        :key="dash.value"
        class="style-btn"
        :class="{ active: currentConnectionDash === dash.value }"
        @click="setConnectionDash(dash.value)"
      >
        {{ dash.label }}
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
      <span>箭头：</span>
      <CustomSelect
        :model-value="currentConnectionArrow"
        :options="arrowTypes"
        @update:model-value="setConnectionArrow"
      />
      <span>方向：</span>
      <button
        v-for="d in arrowDirs"
        :key="d.value"
        class="style-btn dir-btn"
        :class="{ active: currentConnectionDir === d.value }"
        @click="setConnectionDir(d.value)"
      >
        {{ d.label }}
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
import CustomSelect from '@/components/CustomSelect.vue'
import interact, { rect } from 'interactjs'
import { useToast } from '@/composables/useToast'

const { error: toastError } = useToast()

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

// 块真实尺寸缓存（由 NoteBlock 的 ResizeObserver 上报，响应式驱动连线和碰撞检测）
const blockSizes = ref({})

function onBlockResize({ id, width, height }) {
  blockSizes.value = { ...blockSizes.value, [id]: { width, height } }
}

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

// 路径形状（直线/曲线）—— 决定连线走直线还是贝塞尔曲线
const lineShapes = [
  { label: '直线', value: 'straight' },
  { label: '曲线', value: 'bezier' }
]

// 线型（实线/虚线/点线/双点线）—— 与路径形状正交，可任意组合
const lineDashTypes = [
  { label: '实线', value: 'solid' },
  { label: '虚线', value: 'dashed' },
  { label: '点线', value: 'dotted' },
  { label: '双点线', value: 'dot-dash' }
]

// 兼容旧数据：从混杂的 style 字段解析出 shape 和 dash
function resolveConnShape(conn) {
  if (conn.shape) return conn.shape
  // 旧 style 字段：bezier → 曲线，其余 → 直线
  return conn.style === 'bezier' ? 'bezier' : 'straight'
}
function resolveConnDash(conn) {
  if (conn.dash) return conn.dash
  // 旧 style 字段：dashed/dotted/dot-dash 保留，其余 → solid
  const s = conn.style
  if (s === 'dashed' || s === 'dotted' || s === 'dot-dash') return s
  return 'solid'
}

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
  
  const { width: fromW, height: fromH } = getBlockSize(connectingFrom.value, fromBlock)
  
  const fromCenterX = fromBlock.x + fromW / 2
  const fromCenterY = fromBlock.y + fromH / 2
  
  const toX = tempMousePos.value.x
  const toY = tempMousePos.value.y
  
  const dx = toX - fromCenterX
  const dy = toY - fromCenterY
  
  // 复用统一的射线相交算法，保证临时连线和正式连线起点一致
  const from = edgePoint(fromCenterX, fromCenterY, dx, dy, fromW / 2, fromH / 2)
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

const currentLineColor = ref('#6bbd8f')
const currentConnectionStyle = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn ? resolveConnShape(conn) : 'straight'
})
const currentConnectionDash = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn ? resolveConnDash(conn) : 'solid'
})
const currentConnectionColor = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.color || '#6bbd8f'
})
const currentConnectionWidth = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.width || '2'
})
const currentConnectionArrow = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.arrow || 'standard'
})
const currentConnectionDir = computed(() => {
  const conn = connections.value.find(c => c.id === selectedConnectionId.value)
  return conn?.dir || 'forward'
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

// 读取块的真实渲染尺寸（优先用响应式缓存，确保连线和碰撞检测能自动更新）
function getBlockSize(blockId, block) {
  const cached = blockSizes.value[blockId]
  if (cached && cached.width > 0 && cached.height > 0) {
    return {
      width: cached.width / canvasConfig.value.zoom,
      height: cached.height / canvasConfig.value.zoom
    }
  }
  const el = document.querySelector(`[data-block-id="${blockId}"]`)
  if (el) {
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      return {
        width: rect.width / canvasConfig.value.zoom,
        height: rect.height / canvasConfig.value.zoom
      }
    }
  }
  return { width: block.width || 240, height: block.minHeight || 60 }
}

// 轴分离法碰撞检测（滑墙算法）
// 用块当前位置判断移动方向，实现"撞墙停止 + 沿墙滑动"，支持多块阻挡
function resolveCollision(blockId, newX, newY) {
  const current = blocks.value.find(b => b.id === blockId)
  if (!current) return { x: newX, y: newY }

  const { width, height } = getBlockSize(blockId, current)
  const origX = current.x
  const origY = current.y
  const dx = newX - origX
  const dy = newY - origY

  let finalX = newX
  let finalY = newY

  // 先处理X方向：用 (finalX, origY) 测试是否被阻挡
  if (dx !== 0) {
    for (const other of blocks.value) {
      if (other.id === blockId) continue
      const { width: ow, height: oh } = getBlockSize(other.id, other)
      const hit =
        finalX < other.x + ow &&
        finalX + width > other.x &&
        origY < other.y + oh &&
        origY + height > other.y
      if (hit) {
        if (dx > 0) {
          finalX = Math.min(finalX, other.x - width)
        } else {
          finalX = Math.max(finalX, other.x + ow)
        }
      }
    }
  }

  // 再处理Y方向：用 (finalX, finalY) 测试是否被阻挡
  if (dy !== 0) {
    for (const other of blocks.value) {
      if (other.id === blockId) continue
      const { width: ow, height: oh } = getBlockSize(other.id, other)
      const hit =
        finalX < other.x + ow &&
        finalX + width > other.x &&
        finalY < other.y + oh &&
        finalY + height > other.y
      if (hit) {
        if (dy > 0) {
          finalY = Math.min(finalY, other.y - height)
        } else {
          finalY = Math.max(finalY, other.y + oh)
        }
      }
    }
  }

  return { x: finalX, y: finalY }
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

    const { x: finalX, y: finalY } = resolveCollision(draggingBlock.value, newX, newY)

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
      
      ctx.strokeStyle = conn.color || '#6bbd8f'
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
        ctx.fillStyle = '#6bbd8f'
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
    toastError('图片加载失败，请重试')
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

function getStrokeDashArray(conn) {
  const dash = resolveConnDash(conn)
  switch (dash) {
    case 'dashed': return '8,4'
    case 'dotted': return '2,4'
    case 'dot-dash': return '2,2,6,2'
    default: return 'none'
  }
}

function getArrowType(conn) {
  return conn.arrow || 'standard'
}
function getArrowDir(conn) {
  return conn.dir || 'forward'
}
// 终点 marker：forward / both 时显示
function getEndMarker(conn) {
  const dir = getArrowDir(conn)
  if (dir === 'backward' || dir === 'none') return ''
  return `url(#arrow-${getArrowType(conn)})`
}
// 起点 marker：backward / both 时显示（用反向 marker）
function getStartMarker(conn) {
  const dir = getArrowDir(conn)
  if (dir === 'forward' || dir === 'none') return ''
  return `url(#arrow-${getArrowType(conn)}-start)`
}

// 从矩形中心 (cx,cy) 沿 (dx,dy) 方向射线，与矩形边 [cx±halfW, cy±halfH] 的交点
// 用 t 参数法，对 dx/dy 为 0 的情况做 Infinity 兜底，彻底避免 NaN
function edgePoint(cx, cy, dx, dy, halfW, halfH) {
  if (dx === 0 && dy === 0) return { x: cx + halfW, y: cy }
  const tx = dx !== 0 ? halfW / Math.abs(dx) : Infinity
  const ty = dy !== 0 ? halfH / Math.abs(dy) : Infinity
  const t = Math.min(tx, ty)
  return { x: cx + dx * t, y: cy + dy * t }
}

// ===== 连线避障路由：可见性图 + 启发式折线 =====
// 叉积
function cross(ax, ay, bx, by) { return ax * by - ay * bx }
// 线段 (a,b) 与 (c,d) 是否相交（含共线、端点接触的保守判断，用于避障宁可多绕不可漏判）
function segmentsIntersect(a, b, c, d) {
  const d1 = cross(c.x - a.x, c.y - a.y, b.x - a.x, b.y - a.y)
  const d2 = cross(c.x - b.x, c.y - b.y, b.x - a.x, b.y - a.y)
  const d3 = cross(a.x - c.x, a.y - c.y, d.x - c.x, d.y - c.y)
  const d4 = cross(a.x - d.x, a.y - d.y, d.x - c.x, d.y - c.y)
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) return true
  // 共线/端点接触：只要任一端点落在另一条线段的包围盒内，视为相交
  const onSeg = (p, q, r) => Math.min(p.x, r.x) - 0.01 <= q.x && q.x <= Math.max(p.x, r.x) + 0.01 &&
                                   Math.min(p.y, r.y) - 0.01 <= q.y && q.y <= Math.max(p.y, r.y) + 0.01
  if (Math.abs(d1) < 0.01 && onSeg(a, c, b)) return true
  if (Math.abs(d2) < 0.01 && onSeg(a, c, b)) return true
  if (Math.abs(d3) < 0.01 && onSeg(c, a, d)) return true
  if (Math.abs(d4) < 0.01 && onSeg(c, a, d)) return true
  return false
}
// 点是否在矩形内（含边界，用 padding 内缩，避免连线端点贴边时误判）
function pointInRect(p, x, y, w, h, padding = 0.5) {
  return p.x > x + padding && p.x < x + w - padding && p.y > y + padding && p.y < y + h - padding
}
// 线段 (p1,p2) 是否与矩形相交或落在矩形内（保守判断）
// 用 slab 法做参数化 AABB 相交，最可靠，无边界漏判
function segmentIntersectsRect(p1, p2, x, y, w, h) {
  const pad = 0.5
  const minX = x + pad, maxX = x + w - pad
  const minY = y + pad, maxY = y + h - pad
  const dx = p2.x - p1.x
  const dy = p2.y - p1.y
  let tmin = 0, tmax = 1
  // X 轴 slab
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
// p1→p2 直线是否被任一障碍物阻挡
function hasLineOfSight(p1, p2, obstacles) {
  for (const o of obstacles) {
    if (segmentIntersectsRect(p1, p2, o.x, o.y, o.width, o.height)) return false
  }
  return true
}

// 用可见性图（障碍物外扩角点）找一条绕开障碍物的最短折线路径
// 返回点数组（包含 start 和 end），若无障碍则返回 [start, end]
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

  // 找到了可见性图路径
  if (dist[1] !== Infinity) {
    const path = []
    let cur = 1
    while (cur !== -1) { path.unshift(pts[cur]); cur = prev[cur] }
    return path
  }

  // 降级：绕所有障碍物的外接矩形边缘走（L 形折线）
  // 计算所有障碍物的总外接边界（外扩 margin）
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const o of obstacles) {
    minX = Math.min(minX, o.x - margin)
    minY = Math.min(minY, o.y - margin)
    maxX = Math.max(maxX, o.x + o.width + margin)
    maxY = Math.max(maxY, o.y + o.height + margin)
  }
  // 起点/终点到外接矩形边缘外的锚点
  const startAnchor = { x: Math.max(minX, Math.min(maxX, start.x)), y: Math.max(minY, Math.min(maxY, start.y)) }
  const endAnchor = { x: Math.max(minX, Math.min(maxX, end.x)), y: Math.max(minY, Math.min(maxY, end.y)) }
  // 选两条候选路径：上绕 / 下绕，取较短且可见的
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

// 折线点数组 → SVG path（直线折线，去掉共线点）
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

// 折线点数组 → 圆角折线 path（每段连接处用二次贝塞尔做圆角）
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

// 收集连线的中间障碍块（排除自身两端，使用真实尺寸）
function getObstaclesBetween(fromId, toId) {
  const list = []
  for (const b of blocks.value) {
    if (b.id === fromId || b.id === toId) continue
    const { width, height } = getBlockSize(b.id, b)
    if (width <= 0 || height <= 0) continue
    list.push({ x: b.x, y: b.y, width, height })
  }
  return list
}

function getConnectionPath(conn) {
  const fromBlock = blocks.value.find(b => b.id === conn.from)
  const toBlock = blocks.value.find(b => b.id === conn.to)
  if (!fromBlock || !toBlock) return ''
  
  const { width: fromW, height: fromH } = getBlockSize(conn.from, fromBlock)
  const { width: toW, height: toH } = getBlockSize(conn.to, toBlock)
  
  const fromCenterX = fromBlock.x + fromW / 2
  const fromCenterY = fromBlock.y + fromH / 2
  const toCenterX = toBlock.x + toW / 2
  const toCenterY = toBlock.y + toH / 2
  
  const dx = toCenterX - fromCenterX
  const dy = toCenterY - fromCenterY
  
  // 起点：从 from 中心朝 to 方向打到 from 边缘
  const from = edgePoint(fromCenterX, fromCenterY, dx, dy, fromW / 2, fromH / 2)
  // 终点：从 to 中心朝 from 方向（即 -dx,-dy）打到 to 边缘
  const to = edgePoint(toCenterX, toCenterY, -dx, -dy, toW / 2, toH / 2)
  
  // 任一端点是 NaN 则不绘制，避免出现残缺路径
  if ([from.x, from.y, to.x, to.y].some(v => Number.isNaN(v) || !Number.isFinite(v))) return ''
  
  const shape = resolveConnShape(conn)   // straight | bezier
  const isCurved = shape === 'bezier'
  
  // 判断直线是否被中间块遮挡
  const obstacles = getObstaclesBetween(conn.from, conn.to)
  const directBlocked = !hasLineOfSight(from, to, obstacles)
  
  // 无遮挡时：曲线画真正的贝塞尔，直线画直线
  if (!directBlocked) {
    if (isCurved) {
      // 控制点沿主轴方向延伸，让曲线产生明显弧度（避免控制点共线退化为直线）
      const dist = Math.hypot(dx, dy) || 1
      // 用起终点切线方向的垂直分量做偏移，保证曲线有明显弧度
      const nx = -dy / dist  // 连线法线方向
      const ny = dx / dist
      const bow = Math.min(dist * 0.25, 120)  // 弧度大小，随距离变化但封顶
      // 中点沿法线方向偏移，构造一条有明显弧度的 C 形曲线
      const mx = (from.x + to.x) / 2 + nx * bow
      const my = (from.y + to.y) / 2 + ny * bow
      // 两段二次贝塞尔拼成平滑曲线（用 Q 命令）
      return `M ${from.x} ${from.y} Q ${mx} ${my}, ${to.x} ${to.y}`
    }
    return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
  }
  
  // 有遮挡时：绕障路由
  const route = findRoutingPath(from, to, obstacles)
  // 曲线用圆角折线保持柔和观感，直线用直角折线
  if (isCurved) {
    return pathFromRoundedPolyline(route)
  }
  return pathFromPolyline(route)
}

function setConnectionStyle(shape) {
  if (selectedConnectionId.value && note.value) {
    saveHistory()
    noteStore.updateConnection(note.value.id, selectedConnectionId.value, { shape })
  }
}

function setConnectionDash(dash) {
  if (selectedConnectionId.value && note.value) {
    saveHistory()
    noteStore.updateConnection(note.value.id, selectedConnectionId.value, { dash })
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

function setConnectionArrow(arrow) {
  if (selectedConnectionId.value && note.value) {
    saveHistory()
    noteStore.updateConnection(note.value.id, selectedConnectionId.value, { arrow })
  }
}

function setConnectionDir(dir) {
  if (selectedConnectionId.value && note.value) {
    saveHistory()
    noteStore.updateConnection(note.value.id, selectedConnectionId.value, { dir })
  }
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
  overflow: visible;
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
  overflow: visible;
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
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  flex-shrink: 0;
  transition: all var(--transition-fast);
}

.color-btn:hover {
  transform: scale(1.15);
}

.color-btn.active {
  border-color: var(--text-primary);
  transform: scale(1.15);
}

.dir-btn {
  min-width: 30px;
  padding: 6px 8px;
  font-size: 14px;
  line-height: 1;
  text-align: center;
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

<template>
  <div class="note-editor-view" :class="{ 'export-mode': isExportMode }" @paste="onViewPaste">
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
          ref="titleInputRef"
          v-model="noteTitle"
          type="text"
          class="title-input"
          :readonly="isReadOnly"
          spellcheck="false"
          placeholder="笔记标题"
          @blur="updateTitle"
          @input="autoSizeTitle"
          @keyup.enter="$event.target.blur()"
        />
        <div v-if="note" class="header-tags">
          <span
            v-for="tid in (note.tags || [])"
            :key="tid"
            class="tag-chip"
            :style="tagChipStyle(tid)"
          >
            {{ tagName(tid) }}
            <button v-if="!isReadOnly" class="tag-chip-remove" @click.stop="toggleNoteTag(tid)" title="移除标签">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </span>
          <div v-if="!isReadOnly" class="tag-add-wrap">
            <button ref="tagAddBtnRef" class="tag-add-btn" @click.stop="showTagPicker = !showTagPicker" title="添加标签">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
              标签
            </button>
            <Teleport to="body">
              <div v-if="showTagPicker" class="tag-picker tag-picker-fixed" :style="{ left: tagPickerPos.left + 'px', top: tagPickerPos.top + 'px' }" @click.stop>
                <div class="tag-picker-search">
                  <input ref="tagPickerInputRef" v-model="tagSearch" type="text" class="input" placeholder="搜索或创建标签..." @keyup.enter="createTagFromInput" />
                </div>
                <div class="tag-picker-list">
                  <div
                    v-for="t in availableTagsForNote"
                    :key="t.id"
                    class="tag-picker-item"
                    :class="{ selected: (note.tags || []).includes(t.id) }"
                    @click="toggleNoteTag(t.id)"
                  >
                    <span class="tag-dot" :style="{ background: t.color }"></span>
                    <span class="tag-picker-name">{{ t.name }}</span>
                    <svg v-if="(note.tags || []).includes(t.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  </div>
                  <div v-if="tagSearch.trim() && !exactTagExists" class="tag-picker-create" @click="createTagFromInput">
                    创建「{{ tagSearch.trim() }}」
                  </div>
                  <div v-if="!tagStore.tags.length && !tagSearch.trim()" class="tag-picker-empty">还没有标签，输入名称创建</div>
                </div>
              </div>
            </Teleport>
          </div>
        </div>
      </div>
      
      <div class="header-center">
        <div class="toolbar">
          <button v-if="!isReadOnly" class="btn btn-secondary" draggable="true" @click="addTextBlock" @dragstart="onTextBlockDragStart" title="添加文本块（可拖入画布）">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            文本块
          </button>
          <button v-if="!isReadOnly" class="btn btn-secondary" @click="addImageBlock" title="添加图片块" :disabled="isImageLoading">
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
          <button v-if="!isReadOnly" class="btn btn-secondary" @click="showNoteLinkModal = true" title="引用笔记">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
            </svg>
            引用
          </button>
          <div v-if="!isReadOnly" class="export-menu-wrap">
            <button class="btn btn-secondary" @click="showExportMenu = !showExportMenu" title="导出">
             <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              导出
            </button>
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
              <div class="export-item" @click="exportAsJSON">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="16 18 22 12 16 6"/>
                  <polyline points="8 6 2 12 8 18"/>
                </svg>
                导出为 JSON
              </div>
            </div>
          </div>
          <button v-if="!isReadOnly" class="btn btn-secondary" @click="openSaveAsTemplate" title="存为模板">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 3h-6.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H3a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z"/>
              <path d="M7 8h10M7 12h10M7 16h6"/>
            </svg>
            存为模板
          </button>
          <button
            v-if="!isReadOnly"
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
                <input type="range" min="5" max="60" :value="bgOpacity" @input="e => bgOpacity = +e.target.value" style="width:100%"/>
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
        <span class="save-indicator" :class="noteStore.saveStatus">
          <span class="save-dot"></span>
          {{ noteStore.saveStatus === 'saving' ? '保存中...' : '已保存' }}
        </span>
        <button
          class="btn btn-ghost btn-icon"
          :class="{ 'btn-active': showOutline }"
          @click="showOutline = !showOutline"
          title="大纲"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
        </button>
        <button
          class="btn"
          :class="isReadOnly ? 'btn-secondary' : 'btn-primary'"
          @click="toggleReadOnly"
          :title="isReadOnly ? '当前为只读模式，点击切换到编辑模式' : '当前为编辑模式，点击切换到只读模式'"
        >
          <svg v-if="isReadOnly" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          {{ isReadOnly ? '只读' : '编辑' }}
        </button>
        <button
          class="btn btn-ghost btn-icon"
          @click="openInNewWindow"
          title="在新窗口打开（可分屏对照）"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/>
          </svg>
        </button>
      </div>
    </header>

    <div v-if="showFindInNote" class="find-in-note-bar">
      <input
        ref="findInputRef"
        v-model="findKeyword"
        type="text"
        class="find-input"
        placeholder="在当前笔记中查找..."
        @keydown.enter.prevent="findNext($event.shiftKey)"
        @keydown.esc.prevent="closeFindInNote"
      />
      <span class="find-count">{{ findMatches.length ? (findCurrentIndex + 1) + '/' + findMatches.length : (findKeyword ? '0/0' : '') }}</span>
      <button class="find-nav-btn" :disabled="!findMatches.length" @click="findPrev" title="上一个匹配 (Shift+Enter)">▲</button>
      <button class="find-nav-btn" :disabled="!findMatches.length" @click="findNext(false)" title="下一个匹配 (Enter)">▼</button>
      <button class="find-close-btn" @click="closeFindInNote" title="关闭 (Esc)">✕</button>
    </div>

    <div v-if="linkSelectionMode" class="link-selection-bar">
      <div class="link-selection-info">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
        <span class="link-selection-title">选择引用内容</span>
        <span class="link-selection-hint">{{ linkSelectionHint }}</span>
      </div>
      <div class="link-selection-actions">
        <button class="btn btn-ghost" @click="cancelLinkSelection">取消</button>
        <button class="btn btn-primary" :disabled="!canConfirmLinkSelection" @click="confirmLinkSelection">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          完成
        </button>
      </div>
    </div>

    <div
      ref="canvasRef"
      class="canvas-container"
      :class="{ 'connect-mode': connectMode, 'panning': isPanning, 'space-held': spaceHeld }"
      @mousedown="onCanvasMouseDown"
      @mousemove="onCanvasMouseMove"
      @mouseup="onCanvasMouseUp"
      @mouseleave="onCanvasMouseUp"
      @wheel="onWheel"
      @contextmenu.prevent="onContextMenu"
      @dragover.prevent="onCanvasDragOver"
      @drop="onCanvasDrop"
    >
      <div
        class="canvas-bg"
        :style="canvasBgStyle"
      ></div>
      
      <div class="blocks-layer" :style="canvasTransformStyle">
        <NoteBlock
          v-for="block in blocks"
          :key="block.id"
          :ref="el => { if (el) blockRefs[block.id] = el; else delete blockRefs[block.id] }"
          :block="block"
          :all-blocks="blocks"
          :selected="selectedBlockIds.includes(block.id)"
          :group-color="blockGroupColor(block.id)"
          :connect-mode="connectMode"
          :connecting-from="connectingFrom"
          :read-only="isReadOnly"
          :highlighted="highlightBlockId === block.id"
          :hide-highlight-underline="showFindInNote"
          :link-selection-mode="linkSelectionMode"
          :link-selected="linkSelectionBlockId === block.id"
          :canvas-scale="canvasConfig.zoom"
          @select="selectBlock"
          @drag-start="onBlockDragStart"
          @drag-move="onBlockDragMove"
          @drag-end="onBlockDragEnd"
          @update="updateBlockContent"
          @delete="deleteBlock"
          @toggle-lock="toggleLock"
          @connect-start="startConnection"
          @connect-end="endConnection"
          @add-image="handleAddImageToBlock"
          @add-media="handleAddMediaToBlock"
          @add-gallery-image="handleAddGalleryImage"
          @add-link="handleAddLinkToBlock"
          @add-note-link="handleAddNoteLinkFromBlock"
          @preview-image="showImagePreview"
          @open-note="openLinkedNote"
          @resize="onBlockResize"
          @resize-block="onBlockResizeBlock"
          @resize-start="onBlockResizeStart"
          @save-selection="saveBlockSelection"
          @save-history="saveHistory"
          @blur="onBlockBlur"
          @link-select-block="onLinkSelectBlock"
          @link-select-text="onLinkSelectText"
          :sync-version="syncVersion"
        />
        <div
          v-if="marqueeRect"
          class="marquee-rect"
          :style="{ left: marqueeRect.left + 'px', top: marqueeRect.top + 'px', width: marqueeRect.width + 'px', height: marqueeRect.height + 'px' }"
        ></div>
      </div>
      
      <svg class="connections-layer" :style="canvasTransformStyle">
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
        
        <g v-for="conn in connections" :key="conn.id">
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
            @dblclick.stop="onConnectionDblClick(conn)"
          />
          <g v-if="conn.label || editingConnectionLabel === conn.id" :transform="`translate(${getConnectionMidpoint(conn).x}, ${getConnectionMidpoint(conn).y})`">
            <rect
              :x="-labelBoxWidth(conn.label) / 2" y="-12" :width="labelBoxWidth(conn.label)" height="24" rx="4"
              fill="var(--bg-primary)"
              stroke="var(--border-light)"
              class="conn-label-bg"
            />
            <text
              v-if="editingConnectionLabel !== conn.id"
              x="0" y="0"
              text-anchor="middle"
              dominant-baseline="central"
              class="conn-label-text"
              @dblclick.stop="onConnectionDblClick(conn)"
            >{{ conn.label }}</text>
            <foreignObject v-else :x="-labelBoxWidth(connectionLabelInput) / 2" y="-11" :width="labelBoxWidth(connectionLabelInput)" height="22">
              <input
                class="conn-label-edit"
                v-model="connectionLabelInput"
                type="text"
                maxlength="20"
                placeholder="连线文字"
                @blur="commitConnectionLabel"
                @keydown.enter.prevent="commitConnectionLabel"
                @keydown.esc.prevent="cancelConnectionLabel"
                @click.stop
                @mousedown.stop
              />
            </foreignObject>
          </g>
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

      <div
        v-if="selectedBlockIds.length >= 2"
        class="multi-select-toolbar"
        :style="multiToolbarStyle"
        @mousedown.stop
        @click.stop
      >
        <span class="ms-count">{{ selectedBlockIds.length }}</span>
        <div class="ms-divider"></div>
        <button class="ms-btn" @click="applyAlign('left')" title="左对齐（自动避免重叠）">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="3" x2="3" y2="21"/><rect x="6" y="5" width="12" height="5" rx="1"/><rect x="6" y="14" width="8" height="5" rx="1"/></svg>
        </button>
        <button class="ms-btn" @click="applyAlign('centerH')" title="水平居中（自动避免重叠）">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="3" x2="12" y2="21"/><rect x="5" y="5" width="14" height="5" rx="1"/><rect x="7" y="14" width="10" height="5" rx="1"/></svg>
        </button>
        <button class="ms-btn" @click="applyAlign('right')" title="右对齐（自动避免重叠）">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="21" y1="3" x2="21" y2="21"/><rect x="6" y="5" width="12" height="5" rx="1"/><rect x="10" y="14" width="8" height="5" rx="1"/></svg>
        </button>
        <div class="ms-divider"></div>
        <button class="ms-btn" @click="applyAlign('top')" title="顶对齐（自动避免重叠）">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="3" x2="21" y2="3"/><rect x="5" y="6" width="5" height="12" rx="1"/><rect x="14" y="6" width="5" height="8" rx="1"/></svg>
        </button>
        <button class="ms-btn" @click="applyAlign('centerV')" title="垂直居中（自动避免重叠）">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/><rect x="5" y="5" width="5" height="14" rx="1"/><rect x="14" y="7" width="5" height="10" rx="1"/></svg>
        </button>
        <button class="ms-btn" @click="applyAlign('bottom')" title="底对齐（自动避免重叠）">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="21" x2="21" y2="21"/><rect x="5" y="6" width="5" height="12" rx="1"/><rect x="14" y="10" width="5" height="8" rx="1"/></svg>
        </button>
        <div class="ms-divider"></div>
        <button class="ms-btn" :disabled="selectedBlockIds.length < 3" @click="applyDistribute('h')" title="水平等距分布（至少 3 个）">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="8" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="8" rx="1"/><rect x="17" y="8" width="4" height="8" rx="1"/></svg>
        </button>
        <button class="ms-btn" :disabled="selectedBlockIds.length < 3" @click="applyDistribute('v')" title="垂直等距分布（至少 3 个）">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="8" y="3" width="8" height="4" rx="1"/><rect x="8" y="10" width="8" height="4" rx="1"/><rect x="8" y="17" width="8" height="4" rx="1"/></svg>
        </button>
      </div>
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

        <div class="images-overview" :class="{ collapsed: overviewCollapsed }">
          <div
            class="overview-header"
            :title="overviewCollapsed ? '展开图片总览' : '折叠图片总览'"
            @click="overviewCollapsed = !overviewCollapsed"
          >
            <span class="overview-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              图片总览
              <span class="overview-count">{{ overviewImages.length }}</span>
            </span>
            <svg class="overview-toggle" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <template v-if="!overviewCollapsed">
            <div v-if="overviewImages.length" class="overview-grid">
              <div
                v-for="img in overviewImages"
                :key="img.key"
                class="overview-thumb"
                :title="`图片 ${img.index + 1}`"
                @click="showImagePreview({ urls: img.groupUrls, index: img.index })"
              >
                <img :src="img.url" alt="" draggable="false" />
              </div>
            </div>
            <div v-else class="overview-empty">暂无图片</div>
          </template>
        </div>

        <div class="backlinks-panel">
          <div class="backlinks-header" @click="showBacklinks = !showBacklinks">
            <span class="backlinks-title">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/><polyline points="13 2 13 9 20 9"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="14" y2="17"/></svg>
              反向链接
              <span class="backlinks-count">{{ backlinks.length }}</span>
            </span>
            <svg class="backlinks-chevron" :class="{ collapsed: !showBacklinks }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <div v-if="showBacklinks" class="backlinks-list">
            <div
              v-for="bl in backlinks"
              :key="bl.sourceNoteId + ':' + bl.blockId"
              class="backlink-item"
              @click="openLinkedNote({ noteId: bl.sourceNoteId, blockId: bl.linkedBlockId || bl.blockId })"
            >
              <div class="backlink-source">{{ bl.sourceNoteTitle }}</div>
              <div class="backlink-snippet">{{ bl.snippet }}</div>
            </div>
            <div v-if="backlinks.length === 0" class="backlinks-empty">暂无其他笔记引用本笔记</div>
          </div>
        </div>
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

    <div v-if="selectedConnectionId && !isReadOnly" class="connection-toolbar">
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

    <div v-if="selectedBlock && !isReadOnly" class="connection-toolbar block-style-toolbar">
      <span>背景：</span>
      <button
        v-for="color in blockBgColors"
        :key="color.value"
        class="color-btn"
        :class="{ active: (selectedBlock.color || 'default') === color.value }"
        :style="{ background: color.swatch }"
        @click="setBlockStyle({ color: color.value })"
      ></button>
      <template v-if="selectedBlock.type === 'text'">
        <span>文字：</span>
        <button class="style-btn" :class="{ active: selFormat?.bold }" @mousedown.prevent @click="formatSelection('bold')" title="加粗">
          <strong>B</strong>
        </button>
        <button class="style-btn" :class="{ active: selFormat?.italic }" @mousedown.prevent @click="formatSelection('italic')" title="斜体">
          <em>I</em>
        </button>
        <button class="style-btn" :class="{ active: selFormat?.underline }" @mousedown.prevent @click="formatSelection('underline')" title="下划线">
          <span style="text-decoration: underline;">U</span>
        </button>
        <button class="style-btn" :class="{ active: selFormat?.strikeThrough }" @mousedown.prevent @click="formatSelection('strikeThrough')" title="删除线">
          <span style="text-decoration: line-through;">S</span>
        </button>
        <span class="style-divider"></span>
        <button
          v-for="color in blockTextColors"
          :key="'sel-' + color.value"
          class="color-btn"
          :class="{ active: selFormat?.foreColor === color.value }"
          :style="{ background: color.swatch }"
          :title="'文字颜色 ' + color.value"
          @mousedown.prevent
          @click="formatSelection('foreColor', color.value)"
        ></button>
      </template>
      <template v-if="selectedBlock.type === 'text'">
        <span>字号：</span>
        <button
          v-for="size in blockFontSizes"
          :key="size.value"
          class="style-btn"
          :class="{ active: selFormat ? selFormat.fontSize === size.value : (selectedBlock.fontSize || 14) === size.value }"
          @mousedown.prevent
          @click="formatSelection('fontSize', String(size.value))"
        >{{ size.label }}</button>
        <span>粗细：</span>
        <button
          v-for="weight in blockFontWeights"
          :key="weight.value"
          class="style-btn"
          :class="{ active: selFormat ? selFormat.fontWeight === weight.value : (selectedBlock.fontWeight || 400) === weight.value }"
          @mousedown.prevent
          @click="formatSelection('fontWeight', String(weight.value))"
        >{{ weight.label }}</button>
      </template>
      <span>边框：</span>
      <button
        v-for="border in blockBorderStyles"
        :key="border.value"
        class="style-btn"
        :class="{ active: (selectedBlock.borderStyle || 'solid') === border.value }"
        @click="setBlockStyle({ borderStyle: border.value })"
      >{{ border.label }}</button>
      <span>边框色：</span>
      <button
        v-for="color in blockBorderColors"
        :key="color.value"
        class="color-btn"
        :class="{ active: selectedBlock.borderColor === color.value }"
        :style="{ background: color.swatch }"
        @click="setBlockStyle({ borderColor: color.value })"
      ></button>
    </div>

    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="hidden-file-input"
      @change="onImageFileSelect"
    />

    <input
      ref="mediaInputRef"
      type="file"
      accept="audio/*,video/*"
      class="hidden-file-input"
      @change="onMediaFileSelect"
    />

    <input
      ref="galleryInputRef"
      type="file"
      accept="image/*"
      multiple
      class="hidden-file-input"
      @change="onGalleryFileSelect"
    />

    <!-- 来源选择弹窗 -->
    <Teleport to="body">
      <JellyModal :show="sourcePicker.show" @close="sourcePicker.show = false">
        <div class="modal-content source-picker-modal">
          <div class="modal-header">
            <h3>{{ sourcePickerTitle }}</h3>
            <button class="btn btn-ghost btn-icon" @click="sourcePicker.show = false">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="source-picker-options">
            <button class="source-option" @click="pickFromSystem">
              <div class="source-option-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              </div>
              <div class="source-option-text">
                <span class="source-option-title">从系统文件</span>
                <span class="source-option-desc">从电脑中选择文件</span>
              </div>
            </button>
            <button class="source-option" @click="pickFromLibrary">
              <div class="source-option-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              </div>
              <div class="source-option-text">
                <span class="source-option-title">从素材库</span>
                <span class="source-option-desc">从已有素材中选择</span>
              </div>
            </button>
            <button v-if="sourcePicker.mode === 'image'" class="source-option" @click="pickFromClipboard">
              <div class="source-option-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1"/></svg>
              </div>
              <div class="source-option-text">
                <span class="source-option-title">从剪贴板导入</span>
                <span class="source-option-desc">读取剪贴板中的图片</span>
              </div>
            </button>
          </div>
        </div>
      </JellyModal>
    </Teleport>

    <!-- 素材库选择器 -->
    <MediaPicker
      :show="mediaPicker.show"
      :multiple="mediaPicker.multiple"
      :media-type="mediaPicker.mediaType"
      @close="mediaPicker.show = false"
      @select="onMediaPickerSelect"
    />
    
    <JellyModal :show="showNoteLinkModal" @close="closeNoteLinkModal">
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
            class="note-link-item-wrap"
          >
            <div
              class="note-link-item"
              :class="{ disabled: n.id === note?.id }"
              @click="toggleLinkExpand(n)"
            >
              <div class="note-link-item-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div class="note-link-item-info">
                <div class="note-link-item-title">{{ n.title || '无标题笔记' }}</div>
                <div class="note-link-item-desc">
                  <span>{{ n.blocks?.length || 0 }} 个内容块</span>
                  <span v-if="getNoteFolderPath(n.folderId)" class="note-link-item-folder">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    {{ getNoteFolderPath(n.folderId) }}
                  </span>
                </div>
              </div>
              <span v-if="n.id === note?.id" class="note-link-item-badge">当前笔记</span>
              <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </div>
          </div>
          <div v-if="!filteredNotesForLink.length" class="empty-mini">
            没有找到笔记
          </div>
        </div>
      </div>
    </JellyModal>

    <!-- 存为模板 -->
    <JellyModal :show="saveAsTemplate.show" @close="saveAsTemplate.show = false">
      <div class="modal-content save-template-modal">
        <div class="modal-header">
          <h3>将笔记存为模板</h3>
        </div>
        <input
          v-model="saveAsTemplate.name"
          type="text"
          class="input"
          placeholder="模板名称"
          maxlength="50"
          @keyup.enter="confirmSaveAsTemplate"
        />
        <input
          v-model="saveAsTemplate.desc"
          type="text"
          class="input"
          placeholder="模板描述（可选）"
          maxlength="100"
        />
        <p v-if="saveAsTemplate.dropped" class="save-template-tip">
          有 {{ saveAsTemplate.dropped }} 个媒体/引用类块无法存入模板，已自动跳过。
        </p>
        <p v-else-if="!saveAsTemplate.count" class="save-template-tip">当前笔记无可用内容块。</p>
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="saveAsTemplate.show = false">取消</button>
          <button class="btn btn-primary" :disabled="!saveAsTemplate.name.trim()" @click="confirmSaveAsTemplate">保存</button>
        </div>
      </div>
    </JellyModal>

    <!-- 大纲面板 -->
    <transition name="outline-slide">
      <div v-if="showOutline" class="outline-panel">
        <div class="outline-header">
          <span>大纲</span>
          <button class="btn btn-ghost btn-icon btn-sm" @click="showOutline = false" title="关闭">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div v-if="outlineItems.length === 0" class="outline-empty">未找到标题，使用标题样式格式化文字即可生成大纲</div>
        <div v-else class="outline-list">
          <div
            v-for="(item, idx) in outlineItems"
            :key="idx"
            class="outline-item"
            :style="{ paddingLeft: (item.level - 1) * 14 + 'px' }"
            @click="jumpToOutlineItem(item)"
          >{{ item.text }}</div>
        </div>
      </div>
    </transition>

    <div v-if="contextMenu.show" class="context-menu" :style="contextMenuStyle" @click.stop>
      <template v-if="contextMenu.type === 'block'">
        <div class="context-menu-item" @click="duplicateSelectedBlock">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          复制块
          <span class="shortcut">{{ sc('duplicate') }}</span>
        </div>
        <div class="context-menu-item" @click="copySelectedBlock">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="9" y="9" width="13" height="13" rx="2"/>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
          </svg>
          拷贝
          <span class="shortcut">{{ sc('copy') }}</span>
        </div>
        <div class="context-menu-item" @click="pasteBlockHere">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
          粘贴
          <span class="shortcut">{{ sc('paste') }}</span>
        </div>
        <div v-if="selectedBlockIds.length >= 2" class="context-menu-item" @click="groupSelection">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
          编为一组
        </div>
        <div v-if="anySelectionGrouped" class="context-menu-item" @click="ungroupSelection">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>
          取消分组
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item danger" @click="deleteSelectedBlock">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          删除
          <span class="shortcut">{{ sc('delete') }}</span>
        </div>
      </template>
      <template v-else-if="contextMenu.type === 'canvas'">
        <div class="context-menu-label">基础</div>
        <div class="context-menu-item" @click="addTextBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="12" x2="12" y2="18"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          新建文本块
          <span class="shortcut">{{ sc('newBlock') }}</span>
        </div>

        <div class="context-menu-divider"></div>
        <div class="context-menu-label">富文本</div>
        <div class="context-menu-item" @click="addCalloutBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          新建提示块
        </div>
        <div class="context-menu-item" @click="addFormulaBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M4 4h16M4 20h16M9 8l-2 8M15 8l-2 8M7 12h6"/>
          </svg>
          新建公式块
        </div>
        <div class="context-menu-item" @click="addTableBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="12" y1="3" x2="12" y2="21"/>
          </svg>
          新建数值表格
        </div>

        <div class="context-menu-divider"></div>
        <div class="context-menu-label">媒体</div>
        <div class="context-menu-item" @click="addImageBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          新建图片块
        </div>
        <div class="context-menu-item" @click="addMediaBlockAtContext('audio')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          新建音频块
        </div>
        <div class="context-menu-item" @click="addMediaBlockAtContext('video')">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="5" width="14" height="14" rx="2"/>
            <polygon points="23 7 16 12 23 17 23 7"/>
          </svg>
          新建视频块
        </div>
        <div class="context-menu-item" @click="addGalleryBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7" rx="1"/>
            <rect x="14" y="3" width="7" height="7" rx="1"/>
            <rect x="3" y="14" width="7" height="7" rx="1"/>
            <rect x="14" y="14" width="7" height="7" rx="1"/>
          </svg>
          新建图片画廊
        </div>

        <div class="context-menu-divider"></div>
        <div class="context-menu-label">项目管理</div>
        <div class="context-menu-item" @click="addProgressBlockAtContext">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
          </svg>
          新建进度条
        </div>
        <div class="context-menu-item" @click="pasteBlockHere">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
            <rect x="8" y="2" width="8" height="4" rx="1"/>
          </svg>
          粘贴块
          <span class="shortcut">{{ sc('paste') }}</span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" @click="toggleConnectMode">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
          {{ connectMode ? '退出连线模式' : '连线模式' }}
          <span class="shortcut">{{ sc('toggleConnect') }}</span>
        </div>
        <div class="context-menu-divider"></div>
        <div class="context-menu-item" @click="resetView">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="1 4 1 10 7 10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
          重置视图
          <span class="shortcut">{{ sc('zoomReset') }}</span>
        </div>
      </template>
    </div>
    
    <Teleport to="body">
      <div
      v-if="showImagePreviewModal"
      class="image-preview-overlay"
      @click="closeImagePreview"
      @wheel.prevent="onPreviewWheel"
      @mousemove="onPreviewMouseMove"
      @mouseup="onPreviewMouseUp"
      @mouseleave="onPreviewMouseUp"
    >
      <button v-if="previewImageUrls.length > 1" class="image-preview-nav prev" title="上一张（←）" @click.stop="switchPreviewImage(-1)">
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <div class="image-preview-container" @click.stop>
          <img
            :src="previewImageUrl"
            alt="预览图片"
            class="preview-image"
            :class="{ fit: previewImageScale === 1, draggable: true }"
            :style="previewImageStyle"
            @mousedown="onPreviewMouseDown"
            @click.stop="onPreviewImageClick"
          />
          <div class="image-preview-toolbar">
            <button class="btn btn-ghost btn-icon" @click.stop="zoomPreviewOut" title="缩小">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <span class="preview-zoom-text">{{ Math.round(previewImageScale * 100) }}%</span>
            <button class="btn btn-ghost btn-icon" @click.stop="zoomPreviewIn" title="放大">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="12" y1="5" x2="12" y2="19"/>
                <line x1="5" y1="12" x2="19" y2="12"/>
              </svg>
            </button>
            <button class="btn btn-ghost btn-icon" @click.stop="resetPreviewZoom" title="重置缩放">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="1 4 1 10 7 10"/>
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
              </svg>
            </button>
          </div>
          <button class="image-preview-close" @click.stop="closeImagePreview">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        <button v-if="previewImageUrls.length > 1" class="image-preview-nav next" title="下一张（→）" @click.stop="switchPreviewImage(1)">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
        <span v-if="previewImageUrls.length > 1" class="image-preview-counter">{{ previewImageIndex + 1 }} / {{ previewImageUrls.length }}</span>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { useTagStore, TAG_PRESET_COLORS } from '@/stores/tag'
import { useTemplateStore } from '@/stores/template'
import { useShortcutStore } from '@/stores/shortcut'
import NoteBlock from '@/components/NoteBlock.vue'
import MediaPicker from '@/components/MediaPicker.vue'
import { markdownToHtml, isLikelyMarkdown } from '@/utils/markdown'
import { deepClone } from '@/utils'
import { pushOverlappingBlocks } from '@/utils/blockLayout'
import CustomSelect from '@/components/CustomSelect.vue'
import interact, { rect } from 'interactjs'
import { useToast } from '@/composables/useToast'
import { useClickOutside } from '@/composables/useClickOutside'
import { saveImage, resolveImageUrl, preloadImages, isImageRef } from '@/utils/imageStore'
import { imagesApi } from '@/api/images'

const { error: toastError, showToast, removeToast, success: toastSuccess } = useToast()

const route = useRoute()
const router = useRouter()
const noteStore = useNoteStore()
const tagStore = useTagStore()
const templateStore = useTemplateStore()
const shortcutStore = useShortcutStore()
tagStore.init()
shortcutStore.init()

let isUnmounted = false
const pendingTimers = new Set()
function safeTimeout(fn, delay) {
  const id = setTimeout(() => {
    pendingTimers.delete(id)
    if (!isUnmounted) fn()
  }, delay)
  pendingTimers.add(id)
  return id
}

const canvasRef = ref(null)
const findInputRef = ref(null)
const showFindInNote = ref(false)
const findKeyword = ref('')
const findMatches = ref([])
const findCurrentIndex = ref(0)
const fileInputRef = ref(null)

const noteTitle = ref('')
const titleInputRef = ref(null)
const titleMirrorEl = ref(null)

function autoSizeTitle() {
  const input = titleInputRef.value
  if (!input) return
  const text = input.value || input.placeholder || ''
  if (!titleMirrorEl.value) {
    const mirror = document.createElement('span')
    mirror.style.position = 'absolute'
    mirror.style.visibility = 'hidden'
    mirror.style.whiteSpace = 'pre'
    mirror.style.top = '-9999px'
    mirror.style.left = '-9999px'
    mirror.setAttribute('aria-hidden', 'true')
    document.body.appendChild(mirror)
    titleMirrorEl.value = mirror
  }
  const mirror = titleMirrorEl.value
  const cs = getComputedStyle(input)
  mirror.style.font = cs.font
  mirror.style.letterSpacing = cs.letterSpacing
  mirror.style.textTransform = cs.textTransform
  mirror.textContent = text || ' '
  const padL = parseFloat(cs.paddingLeft) || 0
  const padR = parseFloat(cs.paddingRight) || 0
  const borderL = parseFloat(cs.borderLeftWidth) || 0
  const borderR = parseFloat(cs.borderRightWidth) || 0
  const textWidth = mirror.getBoundingClientRect().width
  const header = input.closest('.editor-header')
  const headerCenter = header ? header.querySelector('.header-center') : null
  const headerRight = header ? header.querySelector('.header-right') : null
  const headerW = header ? header.getBoundingClientRect().width : 800
  const centerW = headerCenter && getComputedStyle(headerCenter).display !== 'none' ? headerCenter.getBoundingClientRect().width : 0
  const rightW = headerRight && getComputedStyle(headerRight).display !== 'none' ? headerRight.getBoundingClientRect().width : 0
  const maxWidth = Math.max(120, headerW - centerW - rightW - 120)
  const targetWidth = Math.min(textWidth + padL + padR + borderL + borderR + 2, maxWidth)
  input.style.width = targetWidth + 'px'
}
const canvasConfig = ref({ zoom: 1, offsetX: 0, offsetY: 0 })

// 兼容旧笔记缺失 canvasConfig 字段的情况，避免 zoom 为 undefined 导致背景消失
function normalizeCanvasConfig(cfg) {
  const c = cfg || {}
  return {
    zoom: typeof c.zoom === 'number' && c.zoom > 0 ? c.zoom : 1,
    offsetX: typeof c.offsetX === 'number' ? c.offsetX : 0,
    offsetY: typeof c.offsetY === 'number' ? c.offsetY : 0
  }
}

const gridSize = ref(24)
const bgType = ref(localStorage.getItem('rgoose_bg_type') || 'grid')
const bgImage = ref(localStorage.getItem('rgoose_bg_image') || '')
const bgOpacity = ref(parseInt(localStorage.getItem('rgoose_bg_opacity')) || 15)
const showBgMenu = ref(false)
// 兼容旧 showGrid 设置
const showGrid = computed(() => bgType.value === 'grid' || bgType.value === 'dots')
const snapToGrid = ref(localStorage.getItem('rgoose_snap_grid') === 'true')
watch(bgType, v => localStorage.setItem('rgoose_bg_type', v))
watch(bgImage, v => localStorage.setItem('rgoose_bg_image', v))
watch(bgOpacity, v => localStorage.setItem('rgoose_bg_opacity', v))
watch(snapToGrid, v => localStorage.setItem('rgoose_snap_grid', v ? 'true' : 'false'))
function setBgType(type) {
  bgType.value = type
  if (type !== 'image') showBgMenu.value = false
}
function onBgImageUpload(e) {
  const file = e.target.files[0]
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

const isPanning = ref(false)
// 空格键按下状态（独立于 isPanning，避免语义混淆）
const spaceHeld = ref(false)
const panStart = ref({ x: 0, y: 0, offsetX: 0, offsetY: 0 })

const selectedBlockId = ref(null)
const selectedBlockIds = ref([])
const selectedConnectionId = ref(null)
const connectMode = ref(false)
const connectingFrom = ref(null)
const connectingPosition = ref(null)
const tempMousePos = ref({ x: 0, y: 0 })

// 框选（marquee）状态
const marquee = ref(null)
const isMarqueeing = ref(false)
const marqueeAdditive = ref(false)
// 本次手势是否发生了真正的拖拽（用于区分 click 与 drag，避免拖拽后再触发选择收窄）
const dragOccurredThisGesture = ref(false)
// 组拖拽起始位置快照
const groupDragStart = ref(null)

function isBlockSelected(id) {
  return selectedBlockIds.value.includes(id)
}

function clearBlockSelection() {
  selectedBlockId.value = null
  selectedBlockIds.value = []
  selectedConnectionId.value = null
}

function setSingleSelection(id) {
  selectedBlockId.value = id || null
  selectedBlockIds.value = id ? [id] : []
  selectedConnectionId.value = null
}

// 选中单个块（用于新建/粘贴/插入后聚焦），同步主块与多选集合
function focusBlock(id) {
  selectedBlockId.value = id || null
  selectedBlockIds.value = id ? [id] : []
  selectedConnectionId.value = null
}

function focusAndCenterBlock(id) {
  focusBlock(id)
  nextTick(() => {
    centerBlockInView(id)
    // 新建的文本块自动进入编辑状态：光标落到编辑区末尾
    const block = blocks.value.find(b => b.id === id)
    if (block && block.type === 'text' && !block.locked) {
      const el = document.querySelector(`[data-block-id="${id}"] .text-editor`)
      if (el && el.getAttribute('contenteditable') !== 'false') {
        el.focus()
        const range = document.createRange()
        range.selectNodeContents(el)
        range.collapse(false)
        const sel = window.getSelection()
        sel.removeAllRanges()
        sel.addRange(range)
      }
    }
  })
}

// ===== 笔记内大纲 =====
const showOutline = ref(false)
const outlineItems = computed(() => {
  if (!note.value) return []
  const items = []
  for (const block of note.value.blocks) {
    if (block.type !== 'text' || !block.content) continue
    // 从 HTML 中提取标题
    const tempDiv = document.createElement('div')
    tempDiv.innerHTML = block.content
    const headings = tempDiv.querySelectorAll('h1, h2, h3, h4, h5, h6')
    headings.forEach(h => {
      items.push({
        blockId: block.id,
        level: parseInt(h.tagName[1]),
        text: h.textContent.trim() || '(无标题)'
      })
    })
  }
  return items
})
function jumpToOutlineItem(item) {
  focusBlock(item.blockId)
  centerBlockInView(item.blockId)
}

function toggleBlockInSelection(id) {
  const idx = selectedBlockIds.value.indexOf(id)
  if (idx >= 0) {
    selectedBlockIds.value = selectedBlockIds.value.filter(x => x !== id)
  } else {
    selectedBlockIds.value = [...selectedBlockIds.value, id]
  }
  selectedBlockId.value = selectedBlockIds.value[selectedBlockIds.value.length - 1] || null
  selectedConnectionId.value = null
}

// 块真实尺寸缓存（由 NoteBlock 的 ResizeObserver 上报，响应式驱动连线和碰撞检测）
const blockSizes = ref({})

function onBlockResize({ id, width, height }) {
  blockSizes.value = { ...blockSizes.value, [id]: { width, height } }
}

function onBlockResizeBlock({ id, dir, width, height, x, y }) {
  const next = {
    width: snapVal(width),
    height: snapVal(height),
    x: snapVal(x),
    y: snapVal(y)
  }
  blockSizes.value = { ...blockSizes.value, [id]: { width: next.width, height: next.height } }
  noteStore.updateBlock(note.value.id, id, next)

  const layout = blocks.value.map(block => {
    const size = block.id === id ? next : getBlockSize(block.id, block)
    return { id: block.id, x: block.x, y: block.y, width: size.width, height: size.height }
  })
  const pushed = pushOverlappingBlocks(layout, id, next, dir)
  for (const [pushedId, position] of Object.entries(pushed)) {
    noteStore.updateBlock(note.value.id, pushedId, position)
  }
  if (Object.keys(pushed).length) nextTick(() => { connectionTick.value++ })
}

function onBlockResizeStart() {
  saveHistory()
}

const draggingBlock = ref(null)
const dragOffset = ref({ x: 0, y: 0 })
const hasDragged = ref(false)
const dragStartMousePos = ref({ x: 0, y: 0 })
const connectionTick = ref(0)

const copiedBlock = ref(null)
// 多块复制快照：保存选中的多个块（深拷贝）
const copiedBlocks = ref([])

// 撤销/重做历史
const undoStack = ref([])
const redoStack = ref([])
const MAX_HISTORY = 50
const syncVersion = ref(0)

// 快照完整笔记状态（blocks + connections + title + canvasConfig）
function snapshotNoteState() {
  if (!note.value) return null
  return JSON.stringify({
    blocks: note.value.blocks,
    connections: note.value.connections || [],
    title: note.value.title || '',
    tags: [...(note.value.tags || [])],
    canvasConfig: { ...note.value.canvasConfig }
  })
}

function restoreNoteState(stateJson) {
  if (!note.value || !stateJson) return
  const state = JSON.parse(stateJson)
  suppressContentHistory = true
  if (state.blocks) noteStore.restoreNoteBlocks(note.value.id, state.blocks)
  if (state.connections) noteStore.restoreNoteConnections(note.value.id, state.connections)
  if (state.title !== undefined) {
    noteStore.updateNote(note.value.id, { title: state.title })
    noteTitle.value = state.title
  }
  if (state.tags) noteStore.setNoteTags(note.value.id, state.tags)
  if (state.canvasConfig) {
    noteStore.updateNote(note.value.id, { canvasConfig: state.canvasConfig })
    canvasConfig.value = normalizeCanvasConfig(state.canvasConfig)
  }
  syncVersion.value++
  nextTick(() => { suppressContentHistory = false })
}

function saveHistory() {
  flushContentHistory()
  if (!note.value) return
  undoStack.value.push(snapshotNoteState())
  if (undoStack.value.length > MAX_HISTORY) {
    undoStack.value.shift()
  }
  redoStack.value = []
}

let contentHistoryTimer = null
const CONTENT_HISTORY_DELAY = 1200
let pendingContentSnapshot = null
let suppressContentHistory = false

function commitContentHistory() {
  if (pendingContentSnapshot != null) {
    undoStack.value.push(pendingContentSnapshot)
    if (undoStack.value.length > MAX_HISTORY) undoStack.value.shift()
    redoStack.value = []
    pendingContentSnapshot = null
  }
}

function scheduleContentHistory() {
  if (suppressContentHistory) return
  if (pendingContentSnapshot == null) {
    pendingContentSnapshot = snapshotNoteState()
  }
  if (contentHistoryTimer) clearTimeout(contentHistoryTimer)
  contentHistoryTimer = setTimeout(() => {
    contentHistoryTimer = null
    commitContentHistory()
  }, CONTENT_HISTORY_DELAY)
}

function flushContentHistory() {
  if (contentHistoryTimer) {
    clearTimeout(contentHistoryTimer)
    contentHistoryTimer = null
  }
  commitContentHistory()
}

function onBlockBlur() {
  flushContentHistory()
}

function undo() {
  flushContentHistory()
  if (undoStack.value.length === 0) return
  if (!note.value) return
  
  redoStack.value.push(snapshotNoteState())
  const previousState = undoStack.value.pop()
  restoreNoteState(previousState)
}

function redo() {
  flushContentHistory()
  if (redoStack.value.length === 0) return
  if (!note.value) return
  
  undoStack.value.push(snapshotNoteState())
  const nextState = redoStack.value.pop()
  restoreNoteState(nextState)
}

const isImageLoading = ref(false)
const currentImageBlockId = ref(null)
const mediaInputRef = ref(null)
const currentMediaBlockId = ref(null)
const pendingMediaType = ref(null)
const pendingMediaPos = ref(null)
const galleryInputRef = ref(null)
const currentGalleryBlockId = ref(null)
const blockSelectionRanges = ref({})

// ===== 来源选择弹窗（系统文件 / 素材库） =====
const sourcePicker = ref({ show: false, mode: '' })
// mode: 'image' | 'gallery' | 'audio' | 'video'

// ===== 素材库选择器 =====
const mediaPicker = ref({ show: false, mediaType: 'image', multiple: false })

const showNoteLinkModal = ref(false)
const noteLinkSearch = ref('')
const expandedLinkId = ref(null)
const highlightBlockId = ref(null)

// ===== 存为模板 =====
const saveAsTemplate = ref({ show: false, name: '', desc: '', count: 0, dropped: 0 })

function openSaveAsTemplate() {
  const { blocks: kept, dropped } = templateStore.sanitizeContent(blocks.value, connections.value)
  saveAsTemplate.value = {
    show: true,
    name: note.value?.title || '',
    desc: '',
    count: kept.length,
    dropped
  }
}

async function confirmSaveAsTemplate() {
  const name = saveAsTemplate.value.name.trim()
  if (!name) {
    showToast('请输入模板名称', 'warning')
    return
  }
  try {
    const { blocks: kept, connections: keptConnections } = templateStore.sanitizeContent(blocks.value, connections.value)
    await templateStore.create({
      name,
      desc: saveAsTemplate.value.desc.trim(),
      blocks: kept,
      connections: keptConnections
    })
    saveAsTemplate.value.show = false
    toastSuccess('已保存为模板')
  } catch (err) {
    showToast('保存失败：' + (err?.message || '未知错误'), 'error')
  }
}
const noteLinkSourceBlockId = ref(null)

const linkSelectionMode = ref(false)
const linkSelectionSource = ref(null)
const linkSelectionTargetNoteId = ref(null)
const linkSelectionBlockId = ref(null)
const linkSelectionTextRange = ref(null)
const linkSelectionType = ref('block')
const pendingTextHighlight = ref(null)

const showImagePreviewModal = ref(false)
const previewImageUrl = ref('')
const previewImageUrls = ref([])
const previewImageIndex = ref(0)
const previewImageScale = ref(1)
const previewImageX = ref(0)
const previewImageY = ref(0)
let previewDragging = false
let previewDragStart = null
let previewMoved = false

const showExportMenu = ref(false)

const newBlockOffset = ref(0)
const draggingNewBlock = ref(false)

/**
 * 在期望位置附近找一个不与现有块重叠的空位。
 * @param {number} x - 期望的 x 坐标（画布坐标）
 * @param {number} y - 期望的 y 坐标（画布坐标）
 * @param {number} w - 块宽度
 * @param {number} h - 块高度
 * @returns {{x:number,y:number}}
 */
function findFreePosition(x, y, w = 280, h = 200) {
  const gap = 40
  const blocks = note.value?.blocks || []
  const occupied = blocks.map(b => ({
    x1: b.x, y1: b.y,
    x2: b.x + (b.width || 240),
    y2: b.y + (b.height || b.minHeight || 120)
  }))

  function overlaps(px, py) {
    return occupied.some(o =>
      px < o.x2 + gap && px + w + gap > o.x1 &&
      py < o.y2 + gap && py + h + gap > o.y1
    )
  }

  // 如果期望位置就是空的，直接用
  if (!overlaps(x, y)) return { x, y }

  // 螺旋向外搜索
  const step = 80
  const maxRadius = 2000
  for (let r = step; r < maxRadius; r += step) {
    for (let dy = -r; dy <= r; dy += step) {
      for (let dx = -r; dx <= r; dx += step) {
        // 只搜外圈
        if (Math.abs(dx) < r && Math.abs(dy) < r) continue
        const px = x + dx
        const py = y + dy
        if (!overlaps(px, py)) return { x: px, y: py }
      }
    }
  }
  return { x, y }
}
const isReadOnly = ref(localStorage.getItem('note-readonly') === 'true')

const showTagPicker = ref(false)
const tagSearch = ref('')
const tagPickerInputRef = ref(null)
const tagAddBtnRef = ref(null)
const tagPickerPos = ref({ left: 0, top: 0 })
watch(showTagPicker, (v) => {
  if (v) {
    tagSearch.value = ''
    if (tagAddBtnRef.value) {
      const rect = tagAddBtnRef.value.getBoundingClientRect()
      tagPickerPos.value = { left: rect.left, top: rect.bottom + 6 }
    }
    nextTick(() => tagPickerInputRef.value?.focus())
  }
})

const availableTagsForNote = computed(() => {
  const kw = tagSearch.value.trim().toLowerCase()
  const list = tagStore.tags.filter(t => !kw || t.name.toLowerCase().includes(kw))
  return [...list].sort((a, b) => a.name.localeCompare(b.name, 'zh'))
})

const exactTagExists = computed(() => {
  const kw = tagSearch.value.trim().toLowerCase()
  return !!kw && tagStore.tags.some(t => t.name.toLowerCase() === kw)
})

function tagName(id) {
  return tagStore.getTag(id)?.name || '未知标签'
}

function tagChipStyle(id) {
  const tag = tagStore.getTag(id)
  const color = tag?.color || '#999'
  return {
    background: color + '22',
    color,
    borderColor: color + '55'
  }
}

function toggleNoteTag(tagId) {
  if (!note.value) return
  saveHistory()
  const current = Array.isArray(note.value.tags) ? [...note.value.tags] : []
  const idx = current.indexOf(tagId)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(tagId)
  noteStore.setNoteTags(note.value.id, current)
}

function createTagFromInput() {
  const name = tagSearch.value.trim()
  if (!name) {
    toastError('请输入标签名称')
    return
  }
  let tag = tagStore.tags.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (!tag) {
    tag = tagStore.createTag(name, TAG_PRESET_COLORS[tagStore.tags.length % TAG_PRESET_COLORS.length])
  }
  if (tag && note.value && !(note.value.tags || []).includes(tag.id)) {
    toggleNoteTag(tag.id)
  }
  tagSearch.value = ''
}

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
// 主题跟随：监听根元素 data-theme 变化（覆盖 light/dark/auto 三种模式）
const isDarkTheme = ref(document.documentElement.getAttribute('data-theme') === 'dark')
let themeAttrObserver = null
onMounted(() => {
  themeAttrObserver = new MutationObserver(() => {
    isDarkTheme.value = document.documentElement.getAttribute('data-theme') === 'dark'
  })
  themeAttrObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
})
onUnmounted(() => { themeAttrObserver?.disconnect() })

// 文字色板：浅色模式提供近黑，深色模式提供近白，其余颜色不变
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

const blockRefs = {}

const selectedBlock = computed(() => {
  if (!selectedBlockId.value || !note.value) return null
  return blocks.value.find(b => b.id === selectedBlockId.value) || null
})

const showBacklinks = ref(true)

// 反向链接：扫描所有笔记中引用了当前笔记的 note-link 块
const backlinks = computed(() => {
  const curId = note.value?.id
  if (!curId) return []
  const result = []
  for (const n of noteStore.notes) {
    if (!n || n.deleted || n.id === curId) continue
    for (const b of (n.blocks || [])) {
      if (b.type === 'note-link' && b.linkedNoteId === curId) {
        let snippet = '引用了整篇笔记'
        if (b.linkedTextRange?.text) {
          snippet = '"' + b.linkedTextRange.text.slice(0, 40) + (b.linkedTextRange.text.length > 40 ? '…' : '') + '"'
        } else if (b.linkedBlockId) {
          snippet = '引用了其中某个块'
        }
        result.push({
          sourceNoteId: n.id,
          sourceNoteTitle: n.title || '未命名笔记',
          blockId: b.id,
          linkedBlockId: b.linkedBlockId || null,
          snippet
        })
      }
    }
  }
  return result
})

function formatSelection(command, value = null) {
  if (!selectedBlockId.value) return
  const inst = blockRefs[selectedBlockId.value]
  if (!inst) return

  const realSel = window.getSelection()
  let hasRealSelection = false
  if (realSel && realSel.rangeCount > 0) {
    const r = realSel.getRangeAt(0)
    if (!r.collapsed) hasRealSelection = true
  }

  if ((command === 'fontSize' || command === 'fontWeight') && !hasRealSelection) {
    const patch = command === 'fontSize' ? { fontSize: Number(value) } : { fontWeight: Number(value) }
    saveHistory()
    // 多选时同步应用到全部选中块
    const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : [selectedBlockId.value]
    for (const id of ids) {
      const b = blocks.value.find(x => x.id === id)
      if (b && b.type !== 'image') {
        noteStore.updateBlock(note.value.id, id, patch)
      }
    }
    inst.clearInlineStyle(command)
    selFormat.value = null
    return
  }

  saveHistory()
  inst.formatSelection(command, value)
  nextTick(updateSelFormat)
}

function setBlockStyle(patch) {
  if (!note.value || !selectedBlockId.value) return
  saveHistory()
  // 多选时同步应用到全部选中块
  const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : [selectedBlockId.value]
  for (const id of ids) {
    const b = blocks.value.find(x => x.id === id)
    if (b && b.type !== 'image') {
      noteStore.updateBlock(note.value.id, id, patch)
    }
  }
}

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
  return noteStore.notes.find(n => n.id === id && !n.deleted) || null
})

const blocks = computed(() => note.value?.blocks || [])
const connections = computed(() => note.value?.connections || [])

const overviewImages = ref([])
const overviewCollapsed = ref(localStorage.getItem('rgoose_overview_collapsed') === 'true')
watch(overviewCollapsed, v => localStorage.setItem('rgoose_overview_collapsed', v ? 'true' : 'false'))
const overviewSignature = computed(() => JSON.stringify(
  blocks.value
    .map(b => {
      if (b.type === 'image' && b.imageUrl) return [b.id, b.imageUrl]
      if (b.type === 'gallery' && (b.images || []).filter(Boolean).length) return [b.id, ...b.images.filter(Boolean)]
      return null
    })
    .filter(Boolean)
))
watch(
  overviewSignature,
  async () => {
    const groups = []
    for (const b of blocks.value) {
      if (b.type === 'image' && b.imageUrl) groups.push({ blockId: b.id, urls: [b.imageUrl] })
      else if (b.type === 'gallery' && (b.images || []).filter(Boolean).length) groups.push({ blockId: b.id, urls: b.images.filter(Boolean) })
    }
    const resolvedGroups = await Promise.all(
      groups.map(async g => ({
        ...g,
        urls: await Promise.all(g.urls.map(async u => (isImageRef(u) ? await resolveImageUrl(u) : u)))
      }))
    )
    const items = []
    for (const g of resolvedGroups) {
      g.urls.forEach((u, i) => items.push({ key: `${g.blockId}-${i}`, url: u, index: i, groupUrls: g.urls }))
    }
    overviewImages.value = items
  },
  { immediate: true }
)

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
      backgroundImage: `radial-gradient(var(--grid-line) 1.5px, transparent 1.5px)`,
      backgroundSize: `${size}px ${size}px`,
      backgroundPosition: `${canvasConfig.value.offsetX}px ${canvasConfig.value.offsetY}px`,
      opacity: 0.5
    }
  }
  // grid (default)
  return {
    backgroundImage: `linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)`,
    backgroundSize: `${size}px ${size}px`,
    backgroundPosition: `${canvasConfig.value.offsetX}px ${canvasConfig.value.offsetY}px`,
    opacity: 0.4
  }
})

const canvasTransformStyle = computed(() => ({
  transform: `translate(${canvasConfig.value.offsetX}px, ${canvasConfig.value.offsetY}px) scale(${canvasConfig.value.zoom})`,
  transformOrigin: '0 0'
}))

const previewImageStyle = computed(() => ({
  transform: `translate(${previewImageX.value}px, ${previewImageY.value}px) scale(${previewImageScale.value})`,
  transformOrigin: 'center center'
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

// 菜单渲染后自动修正位置，保证完整可见
watch(() => [contextMenu.value.x, contextMenu.value.y], async () => {
  if (!contextMenu.value.show) return
  await nextTick()
  const el = document.querySelector('.context-menu')
  if (!el) return
  const rect = el.getBoundingClientRect()
  const vw = window.innerWidth
  const vh = window.innerHeight
  let { x, y } = contextMenu.value
  // 右边溢出 → 向左偏移
  if (x + rect.width > vw - 8) {
    x = Math.max(8, vw - rect.width - 8)
  }
  // 底部溢出 → 向上偏移
  if (y + rect.height > vh - 8) {
    y = Math.max(8, vh - rect.height - 8)
  }
  contextMenu.value.x = x
  contextMenu.value.y = y
})

const SHORTCUT_DISPLAY = { Ctrl: 'Ctrl', Shift: 'Shift', Alt: 'Alt', Up: '↑', Down: '↓', Left: '←', Right: '→', Space: '空格', Del: 'Del', Esc: 'Esc', Enter: 'Enter' }
function sc(actionId) {
  const combo = shortcutStore.getCombo(actionId)
  if (!combo) return ''
  return combo.split('+').map(p => SHORTCUT_DISPLAY[p] || p).join('+')
}

const filteredNotesForLink = computed(() => {
  const allNotes = noteStore.allSortedNotes || noteStore.notes
  if (!noteLinkSearch.value) return allNotes
  const kw = noteLinkSearch.value.toLowerCase()
  return allNotes.filter(n =>
    (n.title || '').toLowerCase().includes(kw)
  )
})

function toggleLinkExpand(n) {
  if (n.id === note.value?.id) return
  enterLinkSelectionMode(n.id)
}

function getNoteFolderPath(folderId) {
  if (!folderId) return ''
  return noteStore.getFolderPathString(folderId)
}

function enterLinkSelectionMode(targetNoteId) {
  linkSelectionSource.value = {
    noteId: note.value?.id || null,
    blockId: noteLinkSourceBlockId.value || null
  }
  linkSelectionTargetNoteId.value = targetNoteId
  linkSelectionBlockId.value = null
  linkSelectionTextRange.value = null
  linkSelectionType.value = 'block'
  showNoteLinkModal.value = false
  noteLinkSearch.value = ''
  expandedLinkId.value = null
  router.push({ path: `/note/${targetNoteId}`, query: { selectForLink: '1' } })
}

function linkableBlocks(targetNote) {
  if (!targetNote?.blocks) return []
  return targetNote.blocks.filter(b => b.type === 'text' && b.content && stripHtml(b.content).trim())
}

function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ')
}

function blockPreview(b) {
  const text = stripHtml(b.content).trim()
  return text.length > 40 ? text.slice(0, 40) + '…' : text
}

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

const minimapSquare = computed(() => {
  const { minX, minY, maxX, maxY } = minimapBounds.value
  const w = maxX - minX
  const h = maxY - minY
  const side = Math.max(w, h)
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  return { vbMinX: cx - side / 2, vbMinY: cy - side / 2, side }
})

const minimapViewBox = computed(() => {
  const { vbMinX, vbMinY, side } = minimapSquare.value
  return `${vbMinX} ${vbMinY} ${side} ${side}`
})

const minimapViewportStyle = computed(() => {
  const { vbMinX, vbMinY, side } = minimapSquare.value

  const rect = canvasRef.value?.getBoundingClientRect()
  if (!rect) return {}

  const viewW = rect.width / canvasConfig.value.zoom
  const viewH = rect.height / canvasConfig.value.zoom
  const viewX = -canvasConfig.value.offsetX / canvasConfig.value.zoom
  const viewY = -canvasConfig.value.offsetY / canvasConfig.value.zoom

  const left = ((viewX - vbMinX) / side) * 100
  const top = ((viewY - vbMinY) / side) * 100
  const width = (viewW / side) * 100
  const height = (viewH / side) * 100

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

// ==================== 选中文本样式状态追踪 ====================
const selFormat = ref(null)

watch(selectedBlockId, () => { selFormat.value = null })

function updateSelFormat() {
  if (!selectedBlockId.value) { selFormat.value = null; return }
  const inst = blockRefs[selectedBlockId.value]
  if (!inst || !inst.getSelectionFormat) { selFormat.value = null; return }
  selFormat.value = inst.getSelectionFormat()
}

function onSelectionChange() {
  // Only update when there's a selected block (toolbar is visible)
  if (selectedBlockId.value) {
    updateSelFormat()
  }
}

const isExportMode = computed(() => route.query.export === '1')

onMounted(async () => {
  await noteStore.init()
  if (note.value) {
    noteStore.setCurrentNote(route.params.id)
    noteTitle.value = note.value.title
    canvasConfig.value = normalizeCanvasConfig(note.value.canvasConfig)
  }
  if (isExportMode.value) {
    // export 模式：不加事件监听，加载后直接撑大画布并通知主进程截图
    await nextTick()
    await new Promise(r => setTimeout(r, 500)) // 等待块和图片渲染
    initExportMode()
    return
  }
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('mouseup', onWindowMouseUp)
  window.addEventListener('mousemove', onWindowMouseMove)
  window.addEventListener('blur', onWindowBlur)
  window.addEventListener('resize', autoSizeTitle)
  document.addEventListener('selectionchange', onSelectionChange)
  await nextTick()
  autoSizeTitle()
})

onUnmounted(() => {
  isUnmounted = true
  pendingTimers.forEach(id => clearTimeout(id))
  pendingTimers.clear()
  window.removeEventListener('keydown', onKeyDown)
  window.removeEventListener('keyup', onKeyUp)
  window.removeEventListener('mouseup', onWindowMouseUp)
  window.removeEventListener('mousemove', onWindowMouseMove)
  window.removeEventListener('blur', onWindowBlur)
  window.removeEventListener('resize', autoSizeTitle)
  document.removeEventListener('selectionchange', onSelectionChange)
  flushContentHistory()
  if (titleMirrorEl.value) {
    titleMirrorEl.value.remove()
    titleMirrorEl.value = null
  }
})

watch(noteTitle, () => nextTick(autoSizeTitle))
watch(() => note.value?.id, () => nextTick(autoSizeTitle))

watch(() => route.params.id, (newId) => {
  const n = noteStore.notes.find(n => n.id === newId && !n.deleted)
  if (n) {
    noteStore.setCurrentNote(newId)
    flushContentHistory()
    pendingContentSnapshot = null
    if (contentHistoryTimer) {
      clearTimeout(contentHistoryTimer)
      contentHistoryTimer = null
    }
    undoStack.value = []
    redoStack.value = []
    noteTitle.value = n.title
    canvasConfig.value = normalizeCanvasConfig(n.canvasConfig)
  }
})

const pendingCenterBlockId = ref(null)

watch([() => route.query.b, () => note.value], ([blockId, noteVal]) => {
  if (!blockId || !noteVal) {
    if (!noteVal) {
      if (blockId) pendingCenterBlockId.value = blockId
      else highlightBlockId.value = null
    }
    return
  }
  const exists = blocks.value.some(b => b.id === blockId)
  if (!exists) {
    highlightBlockId.value = null
    return
  }
  const hasTextRange = !!(pendingTextHighlight.value && pendingTextHighlight.value.blockId === blockId)
  if (!hasTextRange) {
    highlightBlockId.value = blockId
  }
  const doCenter = () => {
    centerBlockInView(blockId)
    pendingCenterBlockId.value = null
  }
  nextTick(() => {
    if (canvasRef.value) doCenter()
    else safeTimeout(doCenter, 200)
  })
  const applyText = (retries = 0) => {
    if (pendingTextHighlight.value && pendingTextHighlight.value.blockId === blockId) {
      const blockEl = document.querySelector(`.note-block[data-block-id="${blockId}"]`)
      if (blockEl) {
        applyTextHighlight(blockId, pendingTextHighlight.value)
        pendingTextHighlight.value = null
      } else if (retries < 20) {
        safeTimeout(() => applyText(retries + 1), 150)
      }
    }
  }
  safeTimeout(applyText, 200)
  safeTimeout(() => {
    if (highlightBlockId.value === blockId) highlightBlockId.value = null
    clearTextHighlight()
  }, 4500)
}, { immediate: true })

function applyTextHighlight(blockId, range) {
  const blockEl = document.querySelector(`.note-block[data-block-id="${blockId}"]`)
  if (!blockEl) return
  const editor = blockEl.querySelector('.text-editor')
  if (!editor) return
  clearTextHighlight(editor)
  const walker = document.createTreeWalker(editor, NodeFilter.SHOW_TEXT)
  let pos = 0
  let startNode = null
  let startOffset = 0
  let endNode = null
  let endOffset = 0
  const start = range.start ?? 0
  const end = range.end ?? 0
  let node
  while ((node = walker.nextNode())) {
    const len = node.textContent.length
    const nodeEnd = pos + len
    if (!startNode && start < nodeEnd) {
      startNode = node
      startOffset = start - pos
    }
    if (!endNode && end <= nodeEnd) {
      endNode = node
      endOffset = end - pos
    }
    if (startNode && endNode) break
    pos = nodeEnd
  }
  if (!startNode || !endNode) return
  try {
    const r = document.createRange()
    r.setStart(startNode, Math.max(0, startOffset))
    r.setEnd(endNode, Math.max(0, endOffset))
    const mark = document.createElement('mark')
    mark.className = 'ref-text-highlight'
    r.surroundContents(mark)
  } catch (e) {}
}

function clearTextHighlight(editor) {
  const root = editor || document
  root.querySelectorAll('mark.ref-text-highlight').forEach(m => {
    const parent = m.parentNode
    while (m.firstChild) parent.insertBefore(m.firstChild, m)
    parent.removeChild(m)
    parent.normalize()
  })
}

watch(() => route.query.selectForLink, (val) => {
  if (val && linkSelectionTargetNoteId.value) {
    linkSelectionMode.value = true
    linkSelectionBlockId.value = null
    linkSelectionTextRange.value = null
    linkSelectionType.value = 'block'
    window.getSelection()?.removeAllRanges()
  } else if (!val) {
    if (linkSelectionMode.value) {
      linkSelectionMode.value = false
    }
  }
}, { immediate: true })

function centerBlockInView(blockId) {
  const block = blocks.value.find(b => b.id === blockId)
  if (!block || !canvasRef.value) return
  const rect = canvasRef.value.getBoundingClientRect()
  const bw = block.width || 240
  const bh = block.minHeight || block.height || 80
  const targetOffsetX = rect.width / 2 - (block.x + bw / 2) * canvasConfig.value.zoom
  const targetOffsetY = rect.height / 2 - (block.y + bh / 2) * canvasConfig.value.zoom
  canvasConfig.value.offsetX = targetOffsetX
  canvasConfig.value.offsetY = targetOffsetY
}

function openFindInNote() {
  showFindInNote.value = true
  nextTick(() => {
    findInputRef.value?.focus()
    findInputRef.value?.select()
  })
}

function closeFindInNote() {
  clearMatchHighlights()
  showFindInNote.value = false
  findKeyword.value = ''
  findMatches.value = []
  findCurrentIndex.value = 0
  highlightBlockId.value = null
}

function collectMatchesInBlock(blockEl, blockId, kw) {
  const matches = []
  const walker = document.createTreeWalker(blockEl, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.textContent || !node.textContent.trim()) return NodeFilter.FILTER_REJECT
      return NodeFilter.FILTER_ACCEPT
    }
  })
  const textNodes = []
  let n
  while ((n = walker.nextNode())) textNodes.push(n)
  textNodes.forEach((node, nodeIndex) => {
    const text = node.textContent.toLowerCase()
    let from = 0
    while (true) {
      const idx = text.indexOf(kw, from)
      if (idx === -1) break
      matches.push({ blockId, nodeIndex, node, start: idx, len: kw.length })
      from = idx + kw.length
    }
  })
  return matches
}

function computeFindMatches() {
  clearMatchHighlights()
  const kw = findKeyword.value.trim().toLowerCase()
  if (!kw) {
    findMatches.value = []
    findCurrentIndex.value = 0
    highlightBlockId.value = null
    return
  }
  const textBlocks = blocks.value.filter(b => b.type === 'text')
  const all = []
  textBlocks.forEach(block => {
    const el = document.querySelector('[data-block-id="' + block.id + '"] .text-editor')
    if (!el) return
    all.push(...collectMatchesInBlock(el, block.id, kw))
  })
  findMatches.value = all
  findCurrentIndex.value = 0
  if (all.length) {
    goToFindCurrent()
  } else {
    highlightBlockId.value = null
  }
}

function clearMatchHighlights() {
  document.querySelectorAll('mark.find-match').forEach(el => {
    const parent = el.parentNode
    if (!parent) return
    while (el.firstChild) parent.insertBefore(el.firstChild, el)
    parent.removeChild(el)
    parent.normalize()
  })
}

function applyMatchHighlights(targetBlockId, currentLocalIdx) {
  clearMatchHighlights()
  const kw = findKeyword.value.trim().toLowerCase()
  if (!kw) return
  blocks.value.filter(b => b.type === 'text').forEach(block => {
    const el = document.querySelector('[data-block-id="' + block.id + '"] .text-editor')
    if (!el) return
    const matches = collectMatchesInBlock(el, block.id, kw)
    if (!matches.length) return
    matches.forEach((m, i) => { m._local = i })
    const byNode = new Map()
    matches.forEach(m => {
      const arr = byNode.get(m.node) || []
      arr.push(m)
      byNode.set(m.node, arr)
    })
    byNode.forEach(arr => {
      arr.sort((a, b) => b.start - a.start)
      arr.forEach(item => {
        if (!item.node.parentNode) return
        const fullText = item.node.textContent
        if (item.start + item.len > fullText.length) return
        try {
          const range = document.createRange()
          range.setStart(item.node, item.start)
          range.setEnd(item.node, item.start + item.len)
          const mark = document.createElement('mark')
          mark.className = 'find-match'
          if (block.id === targetBlockId && item._local === currentLocalIdx) {
            mark.classList.add('find-match-current')
          }
          range.surroundContents(mark)
        } catch (e) {}
      })
    })
  })
}

function goToFindCurrent() {
  const total = findMatches.value.length
  if (!total) return
  const idx = ((findCurrentIndex.value % total) + total) % total
  findCurrentIndex.value = idx
  const target = findMatches.value[idx]
  if (!target) return
  highlightBlockId.value = target.blockId
  centerBlockInView(target.blockId)
  nextTick(() => {
    const blockEl = document.querySelector('[data-block-id="' + target.blockId + '"] .text-editor')
    if (!blockEl) return
    const fresh = collectMatchesInBlock(blockEl, target.blockId, findKeyword.value.trim().toLowerCase())
    if (!fresh.length) return
    let localIdx = 0
    for (let i = 0; i < idx; i++) {
      if (findMatches.value[i]?.blockId === target.blockId) localIdx++
    }
    localIdx = Math.min(localIdx, fresh.length - 1)
    applyMatchHighlights(target.blockId, localIdx)
    const currentMark = document.querySelector('mark.find-match-current')
    if (currentMark) {
      const rect = currentMark.getBoundingClientRect()
      if (rect.top < 60 || rect.bottom > window.innerHeight - 60) {
        currentMark.scrollIntoView({ block: 'center', behavior: 'smooth' })
      }
    }
  })
}

function findNext(reverse) {
  if (!findMatches.value.length) return
  if (reverse) {
    findCurrentIndex.value = (findCurrentIndex.value - 1 + findMatches.value.length) % findMatches.value.length
  } else {
    findCurrentIndex.value = (findCurrentIndex.value + 1) % findMatches.value.length
  }
  goToFindCurrent()
}

function findPrev() {
  findNext(true)
}

watch(findKeyword, () => computeFindMatches())

function onKeyDown(e) {
  if (showImagePreviewModal.value) {
    if (e.key === 'Escape') {
      e.preventDefault()
      closeImagePreview()
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      switchPreviewImage(-1)
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      switchPreviewImage(1)
    }
    return
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
    e.preventDefault()
    openFindInNote()
    return
  }

  const isEditing = document.activeElement?.contentEditable === 'true' ||
                    document.activeElement?.tagName === 'INPUT' ||
                    document.activeElement?.tagName === 'TEXTAREA'

  // 只读模式：阻止所有修改性操作，仅允许 copy/escape/zoom
  if (isReadOnly.value) {
    const readOnlyAllowed = ['copy', 'escape', 'zoomIn', 'zoomOut', 'zoomReset']
    if (!readOnlyAllowed.some(a => shortcutStore.matches(e, a))) return
  }

  if (shortcutStore.matches(e, 'copy') && (selectedBlockIds.value.length || selectedBlockId.value) && !isEditing) {
    const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : (selectedBlockId.value ? [selectedBlockId.value] : [])
    copiedBlocks.value = ids
      .map(id => blocks.value.find(b => b.id === id))
      .filter(Boolean)
      .map(b => deepClone(b))
    copiedBlock.value = copiedBlocks.value[copiedBlocks.value.length - 1] || null
    return
  }

  if (shortcutStore.matches(e, 'paste') && copiedBlocks.value.length && !isEditing) {
    const rect = canvasRef.value.getBoundingClientRect()
    const centerX = (rect.width / 2 - canvasConfig.value.offsetX) / canvasConfig.value.zoom - 120
    const centerY = (rect.height / 2 - canvasConfig.value.offsetY) / canvasConfig.value.zoom - 30

    if (note.value) {
      saveHistory()
      const newIds = []
      for (let i = 0; i < copiedBlocks.value.length; i++) {
        const newBlockData = deepClone(copiedBlocks.value[i])
        newBlockData.x = centerX + (newBlockData.x || 0) - (copiedBlocks.value[0].x || 0) + Math.random() * 40 - 20
        newBlockData.y = centerY + (newBlockData.y || 0) - (copiedBlocks.value[0].y || 0) + Math.random() * 40 - 20
        delete newBlockData.id
        delete newBlockData.groupId
        const nb = noteStore.addBlock(note.value.id, newBlockData)
        if (nb) newIds.push(nb.id)
      }
      if (newIds.length) {
        selectedBlockIds.value = newIds
        selectedBlockId.value = newIds[newIds.length - 1]
      }
    }
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'duplicate') && (selectedBlockIds.value.length || selectedBlockId.value) && !isEditing) {
    if (note.value) {
      saveHistory()
      const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : (selectedBlockId.value ? [selectedBlockId.value] : [])
      const newPrimaryId = ids.map(id => {
        const b = blocks.value.find(x => x.id === id)
        if (!b) return null
        const newBlockData = deepClone(b)
        newBlockData.x += 30
        newBlockData.y += 30
        delete newBlockData.id
        const nb = noteStore.addBlock(note.value.id, newBlockData)
        return nb ? nb.id : null
      }).filter(Boolean)
      selectedBlockIds.value = newPrimaryId
      selectedBlockId.value = newPrimaryId[newPrimaryId.length - 1] || null
    }
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'delete') && (selectedBlockIds.value.length || selectedBlockId.value) && !isEditing) {
    deleteSelectedBlocks()
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'escape')) {
    if (contextMenu.value.show) {
      contextMenu.value.show = false
      return
    }
    if (selectedBlockIds.value.length > 1) {
      if (selectedBlockId.value) {
        selectedBlockIds.value = [selectedBlockId.value]
      } else {
        selectedBlockIds.value = []
      }
      return
    }
    clearBlockSelection()
    connectMode.value = false
    connectingFrom.value = null
    copiedBlock.value = null
    copiedBlocks.value = []
    return
  }

  if (shortcutStore.matches(e, 'zoomIn')) {
    zoomIn()
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'zoomOut')) {
    zoomOut()
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'zoomReset')) {
    resetView()
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'newBlock') && !isEditing) {
    addTextBlock()
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'toggleConnect') && !isEditing) {
    toggleConnectMode()
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'undo')) {
    undo()
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'redo')) {
    redo()
    e.preventDefault()
    return
  }

  const moveActions = ['moveUp', 'moveDown', 'moveLeft', 'moveRight']
  const moveKey = moveActions.find(a => shortcutStore.matches(e, a))
  const hasMoveSelection = selectedBlockIds.value.length || selectedBlockId.value
  if (moveKey && hasMoveSelection && !isEditing) {
    const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : (selectedBlockId.value ? [selectedBlockId.value] : [])
    if (note.value && ids.length) {
      const step = e.shiftKey ? 20 : 5
      saveHistory()
      if (ids.length === 1) {
        const block = blocks.value.find(b => b.id === ids[0])
        if (block) {
          let { x, y } = block
          if (moveKey === 'moveUp') y -= step
          if (moveKey === 'moveDown') y += step
          if (moveKey === 'moveLeft') x -= step
          if (moveKey === 'moveRight') x += step
          const { x: finalX, y: finalY } = resolveCollision(ids[0], x, y)
          noteStore.updateBlock(note.value.id, ids[0], { x: finalX, y: finalY })
        }
      } else {
        for (const id of ids) {
          const block = blocks.value.find(b => b.id === id)
          if (!block) continue
          let { x, y } = block
          if (moveKey === 'moveUp') y -= step
          if (moveKey === 'moveDown') y += step
          if (moveKey === 'moveLeft') x -= step
          if (moveKey === 'moveRight') x += step
          noteStore.updateBlock(note.value.id, id, { x, y })
        }
      }
    }
    e.preventDefault()
    return
  }

  if (shortcutStore.matches(e, 'panCanvas') && !isEditing) {
    spaceHeld.value = true
    e.preventDefault()
    return
  }
}

function onKeyUp(e) {
  if (e.code === 'Space' || e.key === ' ' || shortcutStore.matches(e, 'panCanvas')) {
    spaceHeld.value = false
    if (isPanning.value) {
      isPanning.value = false
      saveCanvasConfig()
    }
  }
}

function goBack() {
  router.push('/notes')
}

function updateTitle() {
  if (note.value) {
    saveHistory()
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
  if (contextMenu.value.show) contextMenu.value.show = false
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
    // v2.0: 拖拽结束，将最终位置持久化到后端
    const draggedId = draggingBlock.value
    const wasGroupDrag = selectedBlockIds.value.length > 1
    if (wasGroupDrag) {
      for (const id of selectedBlockIds.value) {
        const blk = blocks.value.find(x => x.id === id)
        if (blk) noteStore.updateBlock(note.value.id, id, { x: blk.x, y: blk.y })
      }
    } else {
      const blk = blocks.value.find(x => x.id === draggedId)
      if (blk) noteStore.updateBlock(note.value.id, draggedId, { x: blk.x, y: blk.y })
    }
    hasDragged.value = false
    draggingBlock.value = null
    groupDragStart.value = null
  }
  if (isMarqueeing.value) {
    finishMarquee()
    isMarqueeing.value = false
    marquee.value = null
  }
}

// 统一管理所有 popover / dropdown 的"点击外部关闭"
useClickOutside([
  { selector: '.context-menu', onClose: () => { contextMenu.value.show = false } },
  { selector: '.export-menu-wrap', onClose: () => { showExportMenu.value = false } },
  { selector: ['.tag-add-wrap', '.tag-picker'], onClose: () => { showTagPicker.value = false; tagSearch.value = '' } },
  { selector: '.bg-type-wrapper', onClose: () => { showBgMenu.value = false } }
])

function onWindowBlur() {
  if (contextMenu.value.show) contextMenu.value.show = false
  if (showExportMenu.value) showExportMenu.value = false
  spaceHeld.value = false
  if (isPanning.value) {
    isPanning.value = false
    saveCanvasConfig()
  }
}

function onContextMenu(e) {
  if (isReadOnly.value) return
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
  
  if (blockEl) {
    const bid = blockEl.getAttribute('data-block-id')
    // 右键命中的块若已在多选中，则保持多选（便于对整组操作）；否则单选该块
    if (!bid || !selectedBlockIds.value.includes(bid)) {
      setSingleSelection(bid)
    }
  } else {
    clearBlockSelection()
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
  const { vbMinX, vbMinY, side } = minimapSquare.value

  const ratioX = (e.clientX - rect.left) / rect.width
  const ratioY = (e.clientY - rect.top) / rect.height

  const canvasRect = canvasRef.value.getBoundingClientRect()
  const viewW = canvasRect.width / canvasConfig.value.zoom
  const viewH = canvasRect.height / canvasConfig.value.zoom

  const targetX = vbMinX + ratioX * side - viewW / 2
  const targetY = vbMinY + ratioY * side - viewH / 2
  
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
    return { width: cached.width, height: cached.height }
  }
  const el = document.querySelector(`[data-block-id="${blockId}"]`)
  if (el) {
    const w = el.offsetWidth
    const h = el.offsetHeight
    if (w > 0 && h > 0) {
      return { width: w, height: h }
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

  if (isMarqueeing.value && marquee.value) {
    const p = screenToCanvas(e.clientX, e.clientY)
    marquee.value = { ...marquee.value, curX: p.x, curY: p.y }
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
      dragOccurredThisGesture.value = true
    }
    
    const newX = canvasX - dragOffset.value.x
    const newY = canvasY - dragOffset.value.y

    const currentBlock = blocks.value.find(b => b.id === draggingBlock.value)
    if (!currentBlock) return

    const isGroupDrag = selectedBlockIds.value.length > 1 && groupDragStart.value
    if (isGroupDrag) {
      const snappedBaseX = snapVal(newX)
      const snappedBaseY = snapVal(newY)
      const start = groupDragStart.value[draggingBlock.value] || { x: currentBlock.x, y: currentBlock.y }
      const deltaX = (snapToGrid.value ? snappedBaseX : newX) - start.x
      const deltaY = (snapToGrid.value ? snappedBaseY : newY) - start.y
      for (const id of selectedBlockIds.value) {
        const s = groupDragStart.value[id]
        if (!s) continue
        const blk = blocks.value.find(x => x.id === id)
        if (blk?.locked) continue
        // 拖拽过程中仅更新本地状态（不触发 API），mouseup 时统一持久化
        blk.x = s.x + deltaX
        blk.y = s.y + deltaY
      }
    } else {
      const sx = snapVal(newX)
      const sy = snapVal(newY)
      const { x: finalX, y: finalY } = resolveCollision(draggingBlock.value, sx, sy)
      // 拖拽过程中仅更新本地状态
      const dragBlk = blocks.value.find(x => x.id === draggingBlock.value)
      if (dragBlk) { dragBlk.x = finalX; dragBlk.y = finalY }
    }
    nextTick(() => { connectionTick.value++ })
  }
}

function onCanvasMouseDown(e) {
  if (e.target === canvasRef.value || e.target.classList.contains('canvas-bg') || (e.target.closest('.blocks-layer') === null && e.target.tagName !== 'svg' && !e.target.closest('svg'))) {
    dragOccurredThisGesture.value = false
    // 中键拖拽 或 空格已按下 → 平移画布
    if (e.button === 1 || (e.button === 0 && spaceHeld.value)) {
      isPanning.value = true
      panStart.value = {
        x: e.clientX,
        y: e.clientY,
        offsetX: canvasConfig.value.offsetX,
        offsetY: canvasConfig.value.offsetY
      }
      return
    }
    if (e.button === 0) {
      if (connectMode.value) {
        clearBlockSelection()
        return
      }
      // 框选
      marqueeAdditive.value = e.shiftKey || e.ctrlKey || e.metaKey
      if (!marqueeAdditive.value) clearBlockSelection()
      const p = screenToCanvas(e.clientX, e.clientY)
      marquee.value = { startX: p.x, startY: p.y, curX: p.x, curY: p.y }
      isMarqueeing.value = true
    }
  }
}

function onCanvasMouseMove() {
}

function onCanvasMouseUp() {
}

function screenToCanvas(clientX, clientY) {
  const rect = canvasRef.value.getBoundingClientRect()
  return {
    x: (clientX - rect.left - canvasConfig.value.offsetX) / canvasConfig.value.zoom,
    y: (clientY - rect.top - canvasConfig.value.offsetY) / canvasConfig.value.zoom
  }
}

function finishMarquee() {
  if (!marquee.value) return
  const { startX, startY, curX, curY } = marquee.value
  const x1 = Math.min(startX, curX)
  const y1 = Math.min(startY, curY)
  const x2 = Math.max(startX, curX)
  const y2 = Math.max(startY, curY)
  // 微小矩形（纯点击）：不改变选择（onCanvasMouseDown 已处理清空）
  if (Math.abs(x2 - x1) < 3 && Math.abs(y2 - y1) < 3) return

  const baseSet = marqueeAdditive.value ? [...selectedBlockIds.value] : []
  const hitIds = []
  for (const b of blocks.value) {
    const { width, height } = getBlockSize(b.id, b)
    const bx2 = b.x + width
    const by2 = b.y + height
    // 矩形相交判定
    if (x1 < bx2 && x2 > b.x && y1 < by2 && y2 > b.y) {
      hitIds.push(b.id)
    }
  }
  const merged = [...new Set([...baseSet, ...hitIds])]
  selectedBlockIds.value = merged
  selectedBlockId.value = merged[merged.length - 1] || null
  selectedConnectionId.value = null
}

const marqueeRect = computed(() => {
  if (!marquee.value || !isMarqueeing.value) return null
  const { startX, startY, curX, curY } = marquee.value
  return {
    left: Math.min(startX, curX),
    top: Math.min(startY, curY),
    width: Math.abs(curX - startX),
    height: Math.abs(curY - startY)
  }
})

const selectionBoundsCanvas = computed(() => {
  if (selectedBlockIds.value.length < 2 || !note.value) return null
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const id of selectedBlockIds.value) {
    const b = blocks.value.find(x => x.id === id)
    if (!b) continue
    const { width, height } = getBlockSize(id, b)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + width)
    maxY = Math.max(maxY, b.y + height)
  }
  if (minX === Infinity) return null
  return { minX, minY, maxX, maxY }
})

const multiToolbarStyle = computed(() => {
  const b = selectionBoundsCanvas.value
  if (!b) return { display: 'none' }
  const z = canvasConfig.value.zoom
  const cx = (b.minX + b.maxX) / 2
  const screenX = cx * z + canvasConfig.value.offsetX
  const screenY = b.minY * z + canvasConfig.value.offsetY
  return {
    left: screenX + 'px',
    top: Math.max(8, screenY - 48) + 'px'
  }
})

function getViewportCenter() {
  if (!canvasRef.value) return { x: 0, y: 0 }
  const rect = canvasRef.value.getBoundingClientRect()
  const cx = (-canvasConfig.value.offsetX + rect.width / 2) / canvasConfig.value.zoom
  const cy = (-canvasConfig.value.offsetY + rect.height / 2) / canvasConfig.value.zoom
  return { x: cx, y: cy }
}

function addTextBlock() {
  const center = getViewportCenter()
  const cx = center.x - 120 + newBlockOffset.value
  const cy = center.y - 40 + newBlockOffset.value
  newBlockOffset.value += 30
  addTextBlockAt(cx, cy)
}

function onTextBlockDragStart(e) {
  draggingNewBlock.value = true
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', 'new-text-block')
  }
}

function toggleReadOnly() {
  isReadOnly.value = !isReadOnly.value
  localStorage.setItem('note-readonly', String(isReadOnly.value))
}

function onCanvasDragOver(e) {
  if (e.dataTransfer) e.dataTransfer.dropEffect = 'copy'
}

function onCanvasDrop(e) {
  if (!draggingNewBlock.value) return
  draggingNewBlock.value = false
  if (isReadOnly.value) return
  const pos = screenToCanvas(e.clientX, e.clientY)
  addTextBlockAt(pos.x - 110, pos.y - 30)
}

function getCanvasCenter() {
  const rect = canvasRef.value?.getBoundingClientRect()
  const cx = rect ? rect.width / 2 : 300
  const cy = rect ? rect.height / 2 : 200
  return screenToCanvas(
    (rect?.left || 0) + cx,
    (rect?.top || 0) + cy
  )
}

function onViewPaste(e) {
  if (isReadOnly.value) return
  const items = e.clipboardData?.items
  if (!items || items.length === 0) return

  for (const item of items) {
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (!file) continue
      e.preventDefault()
      const reader = new FileReader()
      reader.onload = async (ev) => {
        const imgData = ev.target.result
        const imgRef = await saveImage(imgData)
        const center = getCanvasCenter()
        if (note.value) {
          saveHistory()
          const block = noteStore.addBlock(note.value.id, {
            x: center.x - 140 + newBlockOffset.value,
            y: center.y - 100 + newBlockOffset.value,
            type: 'image',
            imageUrl: imgRef,
            width: 280,
            minHeight: 150
          })
          focusAndCenterBlock(block.id)
          newBlockOffset.value += 30
        }
      }
      reader.readAsDataURL(file)
      return
    }
  }

  const text = e.clipboardData?.getData('text/plain') || ''
  if (text.trim()) {
    const active = document.activeElement
    if (active && active.closest && (
      active.closest('.text-editor') ||
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.isContentEditable
    )) return
    e.preventDefault()
    const center = getCanvasCenter()
    if (note.value) {
      saveHistory()
      const html = isLikelyMarkdown(text)
        ? markdownToHtml(text)
        : `<p>${text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>')}</p>`
      const block = noteStore.addBlock(note.value.id, {
        x: center.x - 110 + newBlockOffset.value,
        y: center.y - 30 + newBlockOffset.value,
        type: 'text',
        content: html
      })
      focusAndCenterBlock(block.id)
      newBlockOffset.value += 30
    }
  }
}

function createNoteLinkBlock(noteId, blockId = null) {
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
      linkedBlockId: blockId || null,
      width: 280,
      minHeight: 70
    })
  }

  closeNoteLinkModal()
}

function openLinkedNote(payload) {
  const noteId = typeof payload === 'string' ? payload : payload?.noteId
  const blockId = typeof payload === 'object' && payload ? payload.blockId : null
  const textRange = typeof payload === 'object' && payload ? payload.textRange : null
  if (textRange) {
    pendingTextHighlight.value = textRange
  }
  if (blockId) {
    router.push({ path: `/note/${noteId}`, query: { b: blockId } })
  } else {
    router.push(`/note/${noteId}`)
  }
}

function closeNoteLinkModal() {
  showNoteLinkModal.value = false
  noteLinkSearch.value = ''
  noteLinkSourceBlockId.value = null
  expandedLinkId.value = null
}

const linkSelectionHint = computed(() => {
  if (linkSelectionType.value === 'text' && linkSelectionTextRange.value) {
    const t = linkSelectionTextRange.value.text
    return `已选中文字："${t.length > 20 ? t.slice(0, 20) + '…' : t}"`
  }
  if (linkSelectionBlockId.value) {
    return '已选中内容块（点击其他块切换，或拖选文字引用片段）'
  }
  return '点击要引用的块，或在块内拖选一段文字'
})

const canConfirmLinkSelection = computed(() => {
  return linkSelectionMode.value && (
    !!linkSelectionBlockId.value || !!linkSelectionTextRange.value
  )
})

function onLinkSelectBlock(blockId) {
  if (!linkSelectionMode.value) return
  linkSelectionTextRange.value = null
  linkSelectionType.value = 'block'
  linkSelectionBlockId.value = blockId
}

function onLinkSelectText(payload) {
  if (!linkSelectionMode.value) return
  linkSelectionType.value = 'text'
  linkSelectionBlockId.value = payload.blockId
  linkSelectionTextRange.value = {
    blockId: payload.blockId,
    start: payload.start,
    end: payload.end,
    text: payload.text
  }
}

function confirmLinkSelection() {
  if (!canConfirmLinkSelection.value || !linkSelectionSource.value) return
  const src = linkSelectionSource.value
  const targetNoteId = linkSelectionTargetNoteId.value
  const blockId = linkSelectionBlockId.value
  const textRange = linkSelectionTextRange.value

  linkSelectionMode.value = false
  linkSelectionBlockId.value = null
  linkSelectionTextRange.value = null
  linkSelectionTargetNoteId.value = null

  const buildBlock = () => {
    if (src.noteId) {
      const sourceBlock = blocks.value.find(b => b.id === src.blockId)
      let x, y
      if (sourceBlock) {
        x = sourceBlock.x + (sourceBlock.width || 240) + 40
        y = sourceBlock.y
      } else {
        x = -canvasConfig.value.offsetX / canvasConfig.value.zoom + 300 + newBlockOffset.value
        y = -canvasConfig.value.offsetY / canvasConfig.value.zoom + 200 + newBlockOffset.value
        newBlockOffset.value += 30
      }
      saveHistory()
      const blockData = {
        x, y,
        type: 'note-link',
        linkedNoteId: targetNoteId,
        linkedBlockId: blockId || null,
        width: 280,
        minHeight: 70
      }
      if (textRange) {
        blockData.linkedTextRange = { ...textRange }
      }
      const createdBlock = noteStore.addBlock(src.noteId, blockData)
      noteLinkSourceBlockId.value = null
      if (createdBlock && src.blockId && src.blockId !== createdBlock.id) {
        noteStore.addConnection(src.noteId, src.blockId, createdBlock.id, 'straight', { dash: 'dashed', color: '#9aa4b2', width: '1.5', dir: 'none' })
      }
    }
  }

  if (src.noteId) {
    router.push({ path: `/note/${src.noteId}` }).then(() => {
      nextTick(buildBlock)
    })
  } else {
    router.push('/')
  }
}

function cancelLinkSelection() {
  const src = linkSelectionSource.value
  linkSelectionMode.value = false
  linkSelectionBlockId.value = null
  linkSelectionTextRange.value = null
  linkSelectionTargetNoteId.value = null

  if (src && src.noteId) {
    router.push({ path: `/note/${src.noteId}` }).then(() => {
      nextTick(() => {
        showNoteLinkModal.value = true
        noteLinkSourceBlockId.value = src.blockId || null
        noteLinkSearch.value = ''
      })
    })
  } else {
    router.push('/')
  }
}

function clampPreviewScale(scale) {
  return Math.min(3, Math.max(1, scale))
}

function zoomPreviewIn() {
  previewImageScale.value = clampPreviewScale(previewImageScale.value + 0.25)
}

function zoomPreviewOut() {
  previewImageScale.value = clampPreviewScale(previewImageScale.value - 0.25)
}

function resetPreviewZoom() {
  previewImageScale.value = 1
  previewImageX.value = 0
  previewImageY.value = 0
}

function togglePreviewFit() {
  previewImageScale.value = previewImageScale.value === 1 ? 1.5 : 1
}

function onPreviewWheel(e) {
  const delta = e.deltaY > 0 ? -0.1 : 0.1
  previewImageScale.value = clampPreviewScale(previewImageScale.value + delta)
}

function onPreviewMouseDown(e) {
  if (e.button !== 0) return
  previewDragging = true
  previewMoved = false
  previewDragStart = { x: e.clientX - previewImageX.value, y: e.clientY - previewImageY.value }
  e.preventDefault()
}

function onPreviewMouseMove(e) {
  if (!previewDragging) return
  const nx = e.clientX - previewDragStart.x
  const ny = e.clientY - previewDragStart.y
  if (Math.abs(nx - previewImageX.value) > 2 || Math.abs(ny - previewImageY.value) > 2) {
    previewMoved = true
  }
  previewImageX.value = nx
  previewImageY.value = ny
}

function onPreviewMouseUp() {
  previewDragging = false
}

function onPreviewImageClick() {
  if (previewMoved) {
    previewMoved = false
    return
  }
  togglePreviewFit()
}

function showImagePreview(payload) {
  let urls = []
  let index = 0
  if (typeof payload === 'string') {
    urls = [payload]
  } else if (payload && Array.isArray(payload.urls)) {
    urls = payload.urls.filter(Boolean)
    index = payload.index || 0
  }
  if (!urls.length) return
  previewImageUrls.value = urls
  previewImageIndex.value = Math.min(Math.max(index, 0), urls.length - 1)
  previewImageUrl.value = urls[previewImageIndex.value]
  previewImageScale.value = 1.2
  previewImageX.value = 0
  previewImageY.value = 0
  showImagePreviewModal.value = true
}

function switchPreviewImage(dir) {
  const len = previewImageUrls.value.length
  if (len < 2) return
  const next = (previewImageIndex.value + dir + len) % len
  previewImageIndex.value = next
  previewImageUrl.value = previewImageUrls.value[next]
  previewImageScale.value = 1.2
  previewImageX.value = 0
  previewImageY.value = 0
}

function closeImagePreview() {
  showImagePreviewModal.value = false
  previewImageUrl.value = ''
  previewImageUrls.value = []
  previewImageIndex.value = 0
  previewImageScale.value = 1
  previewImageX.value = 0
  previewImageY.value = 0
  previewDragging = false
}

function getBlockRenderHeight(b) {
  if (b.type === 'image') return b.minHeight || 200
  return Math.max(60, b.minHeight || 80)
}

async function convertImagesToDataUrl(target) {
  const imgs = Array.from(target.querySelectorAll('img'))
  const tasks = []
  for (const img of imgs) {
    const src = img.src
    if (!src || src.startsWith('data:')) continue
    tasks.push((async () => {
      try {
        let blob
        if (src.startsWith('rgoose-image://')) {
          const ref = decodeURIComponent(src.replace('rgoose-image://local/', ''))
          blob = await imagesApi.download(ref)
        } else if (src.startsWith('http') || src.startsWith('/') || src.startsWith('blob:')) {
          const resp = await fetch(src)
          blob = await resp.blob()
        } else {
          return
        }
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result)
          reader.onerror = reject
          reader.readAsDataURL(blob)
        })
        img.dataset.exportOrigSrc = src
        img.src = dataUrl
        if (img.complete) return
        await new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 3000) })
      } catch (e) {
        console.warn('convert image failed:', src, e)
      }
    })())
  }
  await Promise.all(tasks)
}

function restoreImagesFromDataUrl(target) {
  const imgs = target.querySelectorAll('img')
  imgs.forEach(img => {
    const orig = img.dataset.exportOrigSrc
    if (orig) {
      img.src = orig
      delete img.dataset.exportOrigSrc
    }
  })
}

function getBlockDomHeight(block) {
  const inst = blockRefs[block.id]
  const el = inst?.$el || inst?.blockRef?.value || inst
  if (el && el.offsetHeight) {
    return el.offsetHeight
  }
  return getBlockRenderHeight(block)
}

// 同步 input/textarea 的当前值到 value 属性（截图表单值依赖此属性）
function syncFormValues(target) {
  const inputs = target.querySelectorAll('input, textarea')
  inputs.forEach(el => {
    if (el.type === 'file' || el.type === 'checkbox' || el.type === 'radio') return
    try {
      el.setAttribute('value', el.value)
      if (el.tagName === 'TEXTAREA') el.textContent = el.value
    } catch (_) {}
  })
}

// 刷新块尺寸缓存，确保连线计算基于最新 DOM 尺寸
function refreshBlockSizes() {
  blocks.value.forEach(b => {
    const inst = blockRefs[b.id]
    const el = inst?.$el || inst?.blockRef?.value || inst
    if (el && el.offsetWidth && el.offsetHeight) {
      blockSizes.value = { ...blockSizes.value, [b.id]: { width: el.offsetWidth, height: el.offsetHeight } }
    }
  })
}

// 列表项目符号用 ::marker 渲染，html2canvas 无法捕获，注入真实文本节点
function injectListMarkers(target) {
  const editors = target.querySelectorAll('.text-editor')
  editors.forEach(editor => {
    const allLis = editor.querySelectorAll('li')
    allLis.forEach(li => {
      if (li.dataset.exportMarker) return
      let depth = 0
      let p = li.parentElement
      while (p && p !== editor) {
        if (p.tagName === 'LI') depth++
        p = p.parentElement
      }
      const parentList = li.parentElement
      const isOl = parentList && parentList.tagName === 'OL'
      let text
      if (isOl) {
        const idx = Array.from(parentList.children).filter(c => c.tagName === 'LI').indexOf(li)
        text = (idx + 1) + '.'
      } else {
        text = depth === 0 ? '•' : (depth === 1 ? '◦' : '▪')
      }
      const marker = document.createElement('span')
      marker.className = 'export-list-marker'
      marker.textContent = text
      const color = depth === 0 ? 'var(--primary-color, #6bbd8f)' : 'var(--text-tertiary, #999)'
      const weight = isOl || depth === 0 ? '600' : '400'
      marker.style.cssText = `color: ${color}; margin-right: 6px; font-weight: ${weight};`
      li.insertBefore(marker, li.firstChild)
      li.dataset.exportMarker = '1'
    })
  })
}

function cleanupListMarkers(target) {
  if (!target) return
  target.querySelectorAll('.export-list-marker').forEach(el => el.remove())
  target.querySelectorAll('[data-export-marker]').forEach(el => delete el.dataset.exportMarker)
}

// 隐藏 toast 容器等浮层（fixed 定位会盖在画布上被截到）
function hideOverlays(target) {
  const hidden = []
  // toast 容器
  document.querySelectorAll('.toast-container').forEach(el => {
    if (el.style.display === 'none') return
    el.dataset.exportOrigDisplay = el.style.display
    el.style.display = 'none'
    hidden.push(el)
  })
  // 画布内的多选工具栏、块操作按钮、拖拽手柄等（也隐藏避免误截）
  target.querySelectorAll('.multi-select-toolbar, .block-actions, .block-drag-handle, .block-group-badge, .marquee-rect').forEach(el => {
    if (el.style.display === 'none') return
    el.dataset.exportOrigDisplay = el.style.display
    el.style.display = 'none'
    hidden.push(el)
  })
  return hidden
}

function restoreOverlays(hidden) {
  hidden.forEach(el => {
    el.style.display = el.dataset.exportOrigDisplay || ''
    delete el.dataset.exportOrigDisplay
  })
}

// 计算所有块的完整边界尺寸
function computeExportBounds() {
  const padding = 80
  if (blocks.value.length === 0) {
    return { width: 1200, height: 800, offsetX: 0, offsetY: 0 }
  }
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  blocks.value.forEach(b => {
    const w = b.width || 240
    const h = getBlockDomHeight(b)
    minX = Math.min(minX, b.x)
    minY = Math.min(minY, b.y)
    maxX = Math.max(maxX, b.x + w)
    maxY = Math.max(maxY, b.y + h)
  })
  return {
    width: Math.max(400, (maxX - minX) + padding * 2),
    height: Math.max(300, (maxY - minY) + padding * 2),
    offsetX: -minX + padding,
    offsetY: -minY + padding
  }
}

// ===== 屏幕外窗口 export 模式 =====
// 在屏幕外窗口中调用：撑大画布，通知主进程截图
function initExportMode() {
  const target = canvasRef.value
  if (!target) {
    window.electronAPI?.sendExportReady?.({ width: 1200, height: 800 })
    return
  }
  const bounds = computeExportBounds()
  canvasConfig.value.zoom = 1
  canvasConfig.value.offsetX = bounds.offsetX
  canvasConfig.value.offsetY = bounds.offsetY
  selectedBlockIds.value = []
  selectedConnectionId.value = null
  target.style.overflow = 'hidden'
  target.style.width = bounds.width + 'px'
  target.style.height = bounds.height + 'px'
  target.style.minWidth = '0'
  target.style.minHeight = '0'
  target.style.flex = 'none'

  // 用 CSS zoom 放大（纯 CSS 样式，不会污染 Chromium session 的 zoom level）
  document.documentElement.style.zoom = '2'

  nextTick(() => {
    refreshBlockSizes()
    setTimeout(() => {
      window.electronAPI?.sendExportReady?.({ width: bounds.width, height: bounds.height })
    }, 300)
  })
}

// 浏览器环境降级：html2canvas-pro
async function captureViaHtml2Canvas() {
  const target = canvasRef.value
  if (!target) return null

  const bounds = computeExportBounds()
  const saved = {
    zoom: canvasConfig.value.zoom,
    offsetX: canvasConfig.value.offsetX,
    offsetY: canvasConfig.value.offsetY,
    style: { ...target.style },
    blockSizes: { ...blockSizes.value },
    selIds: [...selectedBlockIds.value],
    selConn: selectedConnectionId.value
  }
  canvasConfig.value.zoom = 1
  canvasConfig.value.offsetX = bounds.offsetX
  canvasConfig.value.offsetY = bounds.offsetY
  selectedBlockIds.value = []
  selectedConnectionId.value = null
  target.style.overflow = 'hidden'
  target.style.width = bounds.width + 'px'
  target.style.height = bounds.height + 'px'
  target.style.minWidth = '0'
  target.style.minHeight = '0'
  target.style.flex = 'none'

  await nextTick()
  await new Promise(r => setTimeout(r, 300))
  refreshBlockSizes()
  await nextTick()
  syncFormValues(target)
  injectListMarkers(target)
  await convertImagesToDataUrl(target)
  await new Promise(r => setTimeout(r, 150))
  const hidden = hideOverlays(target)

  try {
    const { default: html2canvas } = await import('html2canvas-pro')
    const canvas = await html2canvas(target, {
      backgroundColor: '#f8faf8',
      scale: 2,
      useCORS: true,
      logging: false,
      width: bounds.width,
      height: bounds.height,
      windowWidth: bounds.width,
      windowHeight: bounds.height,
      scrollX: 0,
      scrollY: 0,
      x: 0,
      y: 0,
      ignoreElements: (el) => {
        if (!el.classList) return false
        return el.classList.contains('multi-select-toolbar') ||
          el.classList.contains('block-actions') ||
          el.classList.contains('block-drag-handle') ||
          el.classList.contains('block-group-badge') ||
          el.classList.contains('marquee-rect')
      }
    })
    return { canvas, contentWidth: bounds.width, contentHeight: bounds.height }
  } finally {
    restoreOverlays(hidden)
    restoreImagesFromDataUrl(target)
    cleanupListMarkers(target)
    Object.assign(target.style, saved.style)
    blockSizes.value = saved.blockSizes
    canvasConfig.value.zoom = saved.zoom
    canvasConfig.value.offsetX = saved.offsetX
    canvasConfig.value.offsetY = saved.offsetY
    selectedBlockIds.value = saved.selIds
    selectedConnectionId.value = saved.selConn
    await nextTick()
  }
}

// 主窗口调用：通过屏幕外窗口截图，主窗口完全不受影响
async function captureCanvasSnapshot() {
  // Electron 环境：创建屏幕外窗口截图
  if (window.electronAPI?.captureExport) {
    const noteId = route.params.id
    const pngBuffer = await window.electronAPI.captureExport({ noteId })
    if (!pngBuffer) throw new Error('导出失败')

    // Buffer → Blob → ObjectURL（避免 dataURL 大小限制）
    const bytes = pngBuffer instanceof Uint8Array ? pngBuffer : new Uint8Array(pngBuffer)
    const blob = new Blob([bytes], { type: 'image/png' })
    const objUrl = URL.createObjectURL(blob)

    try {
      const img = await new Promise((resolve, reject) => {
        const i = new Image()
        i.onload = () => resolve(i)
        i.onerror = (e) => reject(new Error('截图加载失败'))
        i.src = objUrl
      })
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      canvas.getContext('2d').drawImage(img, 0, 0)

      const bounds = computeExportBounds()
      return { canvas, contentWidth: bounds.width, contentHeight: bounds.height }
    } finally {
      URL.revokeObjectURL(objUrl)
    }
  }

  // 浏览器降级
  return await captureViaHtml2Canvas()
}

async function exportAsPDF() {
  showExportMenu.value = false
  if (!blocks.value.length) {
    showToast('画布无内容可导出', 'warning')
    return
  }

  const toastId = showToast('正在生成 PDF...', 'info', 0)

  try {
    const result = await captureCanvasSnapshot()
    if (!result || !result.canvas) {
      removeToast(toastId)
      showToast('导出失败：画布不可用', 'error')
      return
    }
    const { canvas, contentWidth, contentHeight } = result

    const imgData = canvas.toDataURL('image/png')
    // PDF 页面尺寸用逻辑尺寸（contentWidth × contentHeight），
    // 图片以高清物理像素绘制再缩放到页面尺寸，保证清晰度且 PDF 大小正常
    const orientation = contentWidth >= contentHeight ? 'landscape' : 'portrait'
    const { jsPDF } = await import('jspdf')
    const pdf = new jsPDF({
      orientation,
      unit: 'px',
      format: [contentWidth, contentHeight],
      hotfixes: ['px_scaling']
    })
    pdf.addImage(imgData, 'PNG', 0, 0, contentWidth, contentHeight, undefined, 'FAST')
    pdf.save(`${note.value?.title || '笔记'}.pdf`)

    removeToast(toastId)
    toastSuccess('PDF 导出成功')
  } catch (e) {
    console.error('PDF export failed:', e)
    removeToast(toastId)
    showToast('PDF 导出失败：' + (e?.message || '未知错误'), 'error')
  }
}

async function exportAsImage() {
  showExportMenu.value = false
  if (!blocks.value.length) {
    showToast('画布无内容可导出', 'warning')
    return
  }

  const toastId = showToast('正在生成图片...', 'info', 0)

  try {
    const result = await captureCanvasSnapshot()
    if (!result || !result.canvas) {
      removeToast(toastId)
      showToast('导出失败：画布不可用', 'error')
      return
    }
    const { canvas } = result

    const link = document.createElement('a')
    link.download = `${note.value?.title || '笔记'}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()

    removeToast(toastId)
    toastSuccess('图片导出成功')
  } catch (e) {
    console.error('Image export failed:', e)
    removeToast(toastId)
    showToast('图片导出失败：' + (e?.message || '未知错误'), 'error')
  }
}

function exportAsJSON() {
  showExportMenu.value = false
  if (!note.value) return

  const exportData = {
    version: 1,
    type: 'note',
    exportedAt: Date.now(),
    note: {
      id: note.value.id,
      title: note.value.title,
      folderId: note.value.folderId,
      tags: note.value.tags || [],
      blocks: note.value.blocks || [],
      connections: note.value.connections || [],
      canvasConfig: note.value.canvasConfig || { zoom: 1, offsetX: 0, offsetY: 0 },
      createdAt: note.value.createdAt,
      updatedAt: note.value.updatedAt
    }
  }

  const jsonStr = JSON.stringify(exportData, null, 2)
  const blob = new Blob([jsonStr], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const title = note.value.title || '未命名笔记'
  link.download = `${title}.json`
  link.href = url
  link.click()
  URL.revokeObjectURL(url)
}

function addTextBlockAt(x, y) {
  if (note.value) {
    saveHistory()
    const block = noteStore.addBlock(note.value.id, { x, y, type: 'text' })
    focusAndCenterBlock(block.id)
  }
}

function addCalloutBlockAtContext() {
  if (note.value) {
    saveHistory()
    const block = noteStore.addBlock(note.value.id, {
      x: contextMenu.value.canvasX - 120,
      y: contextMenu.value.canvasY - 40,
      type: 'callout',
      calloutType: 'info',
      width: 280
    })
    contextMenu.value.show = false
    focusAndCenterBlock(block.id)
  }
}

function addFormulaBlockAtContext() {
  if (note.value) {
    saveHistory()
    const block = noteStore.addBlock(note.value.id, {
      x: contextMenu.value.canvasX - 120,
      y: contextMenu.value.canvasY - 30,
      type: 'formula',
      formula: '',
      width: 240
    })
    contextMenu.value.show = false
    focusAndCenterBlock(block.id)
  }
}

function addTableBlockAtContext() {
  if (note.value) {
    saveHistory()
    const block = noteStore.addBlock(note.value.id, {
      x: contextMenu.value.canvasX - 140,
      y: contextMenu.value.canvasY - 50,
      type: 'table',
      tableData: '属性|攻击|防御\n角色A|100|80\n角色B|90|95\n角色C|110|70',
      tableAnalysis: false,
      width: 280
    })
    contextMenu.value.show = false
    focusAndCenterBlock(block.id)
  }
}

function openInNewWindow() {
  if (!note.value) return
  const url = window.location.origin + window.location.pathname + '#/note/' + note.value.id
  window.open(url, '_blank', 'width=1200,height=800')
}

function addProgressBlockAt(x, y) {
  if (note.value) {
    saveHistory()
    const block = noteStore.addBlock(note.value.id, {
      x, y,
      type: 'progress',
      label: '',
      value: 0,
      mode: 'manual',
      width: 280,
      minHeight: 90
    })
    focusAndCenterBlock(block.id)
  }
}

function addProgressBlockAtContext() {
  addProgressBlockAt(contextMenu.value.canvasX - 140, contextMenu.value.canvasY - 45)
  contextMenu.value.show = false
}

// ===== 来源选择 + 素材库选择器 =====
const sourcePickerTitle = computed(() => {
  const m = { image: '添加图片', gallery: '添加图片', audio: '添加音频', video: '添加视频' }
  return m[sourcePicker.value.mode] || '选择来源'
})

function showImageSourcePicker() {
  sourcePicker.value = { show: true, mode: 'image' }
}

function showGallerySourcePicker() {
  sourcePicker.value = { show: true, mode: 'gallery' }
}

function showMediaSourcePicker() {
  sourcePicker.value = { show: true, mode: pendingMediaType.value || 'audio' }
}

function pickFromSystem() {
  const mode = sourcePicker.value.mode
  sourcePicker.value.show = false
  if (mode === 'image') {
    fileInputRef.value?.click()
  } else if (mode === 'gallery') {
    galleryInputRef.value?.click()
  } else if (mode === 'audio' || mode === 'video') {
    mediaInputRef.value?.click()
  }
}

function pickFromLibrary() {
  const mode = sourcePicker.value.mode
  sourcePicker.value.show = false
  if (mode === 'gallery') {
    mediaPicker.value = { show: true, mediaType: 'image', multiple: true }
  } else {
    mediaPicker.value = { show: true, mediaType: mode, multiple: false }
  }
}

async function readClipboardImage() {
  try {
    if (!navigator.clipboard || !navigator.clipboard.read) return null
    const items = await navigator.clipboard.read()
    for (const item of items) {
      const type = (item.types || []).find(t => t.startsWith('image/'))
      if (type) return await item.getType(type)
    }
    return null
  } catch {
    return null
  }
}

async function pickFromClipboard() {
  const mode = sourcePicker.value.mode
  sourcePicker.value.show = false
  if (mode !== 'image') return
  const blob = await readClipboardImage()
  if (!blob) {
    toastError('剪贴板中没有可用的图片')
    return
  }
  isImageLoading.value = true
  try {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = ev => resolve(ev.target.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
    const imgRef = await saveImage(dataUrl)
    applyImageRef(imgRef)
  } catch {
    toastError('剪贴板图片导入失败，请重试')
  } finally {
    isImageLoading.value = false
  }
}

function onMediaPickerSelect(ref) {
  const mode = mediaPicker.value.multiple ? 'gallery' : sourcePicker.value.mode || 'image'
  mediaPicker.value.show = false

  if (mode === 'image') {
    applyImageRef(ref)
  } else if (mode === 'gallery') {
    applyGalleryRefs(Array.isArray(ref) ? ref : [ref])
  } else if (mode === 'audio' || mode === 'video') {
    applyMediaRef(ref, mode)
  }
}

// 把已有的 imgRef 应用到目标（复用 onImageFileSelect 的后半段逻辑）
function applyImageRef(imgRef) {
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
      const block = note.value.blocks.find(b => b.id === currentImageBlockId.value)
      if (block?.type === 'image') {
        noteStore.updateBlock(note.value.id, currentImageBlockId.value, { imageUrl: imgRef })
        focusBlock(currentImageBlockId.value)
      } else if (block) {
        const imgX = block.x + (block.width || 240) + 60
        const imgY = block.y
        const newImageBlock = noteStore.addBlock(note.value.id, {
          x: imgX, y: imgY, type: 'image', imageUrl: imgRef, width: 280, minHeight: 200
        })
        noteStore.addConnection(note.value.id, block.id, newImageBlock.id, 'bezier', { dash: 'dashed', color: '#9aa0a6', width: '2' })
        focusBlock(newImageBlock.id)
      }
      currentImageBlockId.value = null
    } else {
      const pos = findFreePosition(centerX, centerY, 280, 200)
      const block = noteStore.addBlock(note.value.id, {
        x: pos.x, y: pos.y, type: 'image', imageUrl: imgRef, width: 280, minHeight: 200
      })
      focusAndCenterBlock(block.id)
    }
  }
}

function applyGalleryRefs(refs) {
  const blockId = currentGalleryBlockId.value
  if (!blockId || !note.value) return
  const block = note.value.blocks.find(b => b.id === blockId)
  if (!block || block.type !== 'gallery') return
  saveHistory()
  noteStore.updateBlock(note.value.id, blockId, {
    images: [...(block.images || []), ...refs]
  })
  currentGalleryBlockId.value = null
}

function applyMediaRef(mediaRef, mediaType) {
  if (!note.value) return
  saveHistory()
  if (currentMediaBlockId.value) {
    noteStore.updateBlock(note.value.id, currentMediaBlockId.value, {
      mediaUrl: mediaRef,
      mediaName: mediaRef
    })
    focusBlock(currentMediaBlockId.value)
  } else {
    const basePos = pendingMediaPos.value || {
      x: -canvasConfig.value.offsetX / canvasConfig.value.zoom + 300 + newBlockOffset.value,
      y: -canvasConfig.value.offsetY / canvasConfig.value.zoom + 200 + newBlockOffset.value
    }
    const w = mediaType === 'video' ? 400 : 320
    const h = mediaType === 'video' ? 240 : 80
    const pos = findFreePosition(basePos.x, basePos.y, w, h)
    newBlockOffset.value += 30
    noteStore.addBlock(note.value.id, {
      x: pos.x, y: pos.y, type: mediaType,
      mediaUrl: mediaRef, mediaName: mediaRef,
      width: w, minHeight: h
    })
  }
  currentMediaBlockId.value = null
  pendingMediaType.value = null
  pendingMediaPos.value = null
}

function addImageBlock() {
  currentImageBlockId.value = null
  showImageSourcePicker()
}

function onImageFileSelect(e) {
  const file = e.target.files?.[0]
  if (!file) return
  
  isImageLoading.value = true
  
  const reader = new FileReader()
  reader.onload = async (ev) => {
    const imgData = ev.target.result
    const imgRef = await saveImage(imgData)
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
        const block = note.value.blocks.find(b => b.id === currentImageBlockId.value)
        if (block?.type === 'image') {
          noteStore.updateBlock(note.value.id, currentImageBlockId.value, {
            imageUrl: imgRef
          })
          focusBlock(currentImageBlockId.value)
        } else if (block) {
          const imgX = block.x + (block.width || 240) + 60
          const imgY = block.y
          const newImageBlock = noteStore.addBlock(note.value.id, {
            x: imgX,
            y: imgY,
            type: 'image',
            imageUrl: imgRef,
            width: 280,
            minHeight: 200
          })
          noteStore.addConnection(
            note.value.id,
            block.id,
            newImageBlock.id,
            'bezier',
            { dash: 'dashed', color: '#9aa0a6', width: '2' }
          )
          focusBlock(newImageBlock.id)
        }
        currentImageBlockId.value = null
      } else {
        const pos = findFreePosition(centerX, centerY, 280, 200)
        const block = noteStore.addBlock(note.value.id, {
          x: pos.x,
          y: pos.y,
          type: 'image',
          imageUrl: imgRef,
          width: 280,
          minHeight: 200
        })
        focusAndCenterBlock(block.id)
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

function saveBlockSelection(blockId, range) {
  blockSelectionRanges.value = {
    ...blockSelectionRanges.value,
    [blockId]: range
  }
}

function handleAddImageToBlock(blockId) {
  focusBlock(blockId)
  currentImageBlockId.value = blockId
  showImageSourcePicker()
}

function handleAddMediaToBlock({ blockId, mediaType }) {
  focusBlock(blockId)
  currentMediaBlockId.value = blockId
  pendingMediaType.value = mediaType
  pendingMediaPos.value = null
  showMediaSourcePicker()
}

function addMediaBlockAtContext(mediaType) {
  currentMediaBlockId.value = null
  pendingMediaType.value = mediaType
  pendingMediaPos.value = { x: contextMenu.value.canvasX - 160, y: contextMenu.value.canvasY - 60 }
  contextMenu.value.show = false
  showMediaSourcePicker()
}

function onMediaFileSelect(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file) return

  const isAudio = file.type.startsWith('audio/')
  const isVideo = file.type.startsWith('video/')
  if (!isAudio && !isVideo) return

  const mediaType = pendingMediaType.value || (isAudio ? 'audio' : 'video')

  const reader = new FileReader()
  reader.onload = async (ev) => {
    const dataUrl = ev.target.result
    const mediaRef = await saveImage(dataUrl)

    if (!note.value) return
    saveHistory()

    if (currentMediaBlockId.value) {
      noteStore.updateBlock(note.value.id, currentMediaBlockId.value, {
        mediaUrl: mediaRef,
        mediaName: file.name
      })
      focusBlock(currentMediaBlockId.value)
    } else {
      const basePos = pendingMediaPos.value || {
        x: -canvasConfig.value.offsetX / canvasConfig.value.zoom + 300 + newBlockOffset.value,
        y: -canvasConfig.value.offsetY / canvasConfig.value.zoom + 200 + newBlockOffset.value
      }
      const w = mediaType === 'video' ? 400 : 320
      const h = mediaType === 'video' ? 240 : 80
      const pos = findFreePosition(basePos.x, basePos.y, w, h)
      newBlockOffset.value += 30
      noteStore.addBlock(note.value.id, {
        x: pos.x,
        y: pos.y,
        type: mediaType,
        mediaUrl: mediaRef,
        mediaName: file.name,
        width: w,
        minHeight: h
      })
    }

    currentMediaBlockId.value = null
    pendingMediaType.value = null
    pendingMediaPos.value = null
  }
  reader.readAsDataURL(file)
}

// ===== 图片画廊块 =====
function addGalleryBlockAtContext() {
  if (!note.value) { contextMenu.value.show = false; return }
  saveHistory()
  const block = noteStore.addBlock(note.value.id, {
    x: contextMenu.value.canvasX - 180,
    y: contextMenu.value.canvasY - 100,
    type: 'gallery',
    images: [],
    galleryLayout: 'carousel',
    width: 360
  })
  contextMenu.value.show = false
  focusAndCenterBlock(block.id)
  // 立即触发选图
  nextTick(() => {
    currentGalleryBlockId.value = block.id
    showGallerySourcePicker()
  })
}

function handleAddGalleryImage(blockId) {
  focusBlock(blockId)
  currentGalleryBlockId.value = blockId
  showGallerySourcePicker()
}

function onGalleryFileSelect(e) {
  const files = Array.from(e.target.files || [])
  e.target.value = ''
  if (!files.length || !note.value) return

  const blockId = currentGalleryBlockId.value
  const block = note.value.blocks.find(b => b.id === blockId)
  if (!block || block.type !== 'gallery') return

  saveHistory()
  const readers = files.map(file => new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = async (ev) => {
      const imgRef = await saveImage(ev.target.result)
      resolve(imgRef)
    }
    reader.readAsDataURL(file)
  }))

  Promise.all(readers).then((newRefs) => {
    noteStore.updateBlock(note.value.id, blockId, {
      images: [...(block.images || []), ...newRefs]
    })
    currentGalleryBlockId.value = null
  })
}

function handleAddLinkToBlock(blockId) {
  focusBlock(blockId)
}

function handleAddNoteLinkFromBlock(blockId) {
  noteLinkSourceBlockId.value = blockId
  showNoteLinkModal.value = true
  noteLinkSearch.value = ''
}

function selectBlock(id, e) {
  // 来自 NoteBlock 的 click（含文本区内点击）
  if (dragOccurredThisGesture.value) return
  const additive = e && (e.shiftKey || e.ctrlKey || e.metaKey)
  if (additive) {
    toggleBlockInSelection(id)
  } else {
    setSingleSelection(id)
  }
}

function selectConnection(id) {
  selectedConnectionId.value = id
  selectedBlockId.value = null
  selectedBlockIds.value = []
}

function updateBlockContent(blockId, updates) {
  if (note.value) {
    // 样式修改时保存历史
    if (updates.color || updates.borderStyle || updates.fontSize || updates.fontWeight || updates.textColor || updates.borderColor) {
      saveHistory()
    } else if (updates.content !== undefined || updates.tableData !== undefined || updates.code !== undefined || updates.formula !== undefined || updates.calloutType !== undefined || updates.codeLang !== undefined || updates.tableAnalysis !== undefined || updates.images !== undefined || updates.galleryLayout !== undefined) {
      scheduleContentHistory()
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
    selectedBlockIds.value = selectedBlockIds.value.filter(x => x !== blockId)
  }
}

function toggleLock(blockId) {
  if (!note.value) return
  const block = note.value.blocks.find(b => b.id === blockId)
  if (!block) return
  saveHistory()
  noteStore.updateBlock(note.value.id, blockId, { locked: !block.locked })
}

function deleteSelectedBlocks() {
  if (!note.value) return
  const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : (selectedBlockId.value ? [selectedBlockId.value] : [])
  if (!ids.length) return
  saveHistory()
  for (const id of ids) {
    noteStore.deleteBlock(note.value.id, id)
  }
  selectedBlockId.value = null
  selectedBlockIds.value = []
  contextMenu.value.show = false
}

function deleteSelectedBlock() {
  deleteSelectedBlocks()
}

// ===== 对齐与分布（多选操作）=====
function getSelectedBlocksWithBounds() {
  return selectedBlockIds.value
    .map(id => blocks.value.find(b => b.id === id))
    .filter(Boolean)
    .map(b => {
      const { width, height } = getBlockSize(b.id, b)
      return { id: b.id, x: b.x, y: b.y, width, height }
    })
}

function applyAlign(type) {
  const items = getSelectedBlocksWithBounds()
  if (items.length < 2 || !note.value) return
  saveHistory()
  const minX = Math.min(...items.map(i => i.x))
  const maxX = Math.max(...items.map(i => i.x + i.width))
  const minY = Math.min(...items.map(i => i.y))
  const maxY = Math.max(...items.map(i => i.y + i.height))
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2

  // 水平类对齐（左/右/水平居中）只改 X；垂直类对齐（顶/底/垂直居中）只改 Y
  const horizontal = type === 'left' || type === 'right' || type === 'centerH'

  // 第一步：应用对齐坐标
  for (const it of items) {
    if (type === 'left') it.x = minX
    else if (type === 'right') it.x = maxX - it.width
    else if (type === 'centerH') it.x = cx - it.width / 2
    else if (type === 'top') it.y = minY
    else if (type === 'bottom') it.y = maxY - it.height
    else if (type === 'centerV') it.y = cy - it.height / 2
  }

  // 第二步：沿垂直于对齐方向的轴消除重叠（保持对齐边整齐，仅推开交叠块）
  const minGap = 12
  if (horizontal) {
    items.sort((a, b) => a.y - b.y)
    for (let i = 1; i < items.length; i++) {
      const prevBottom = items[i - 1].y + items[i - 1].height
      if (items[i].y < prevBottom + minGap) items[i].y = prevBottom + minGap
    }
  } else {
    items.sort((a, b) => a.x - b.x)
    for (let i = 1; i < items.length; i++) {
      const prevRight = items[i - 1].x + items[i - 1].width
      if (items[i].x < prevRight + minGap) items[i].x = prevRight + minGap
    }
  }

  // 第三步：写回 store
  for (const it of items) {
    noteStore.updateBlock(note.value.id, it.id, { x: it.x, y: it.y })
  }
  nextTick(() => { connectionTick.value++ })
  contextMenu.value.show = false
}

function applyDistribute(axis) {
  const items = getSelectedBlocksWithBounds()
  if (items.length < 3 || !note.value) return
  saveHistory()
  const MIN_GAP = 20
  if (axis === 'h') {
    items.sort((a, b) => a.x - b.x)
    const first = items[0]
    const last = items[items.length - 1]
    const totalSpan = (last.x + last.width) - first.x
    const sumWidth = items.reduce((s, i) => s + i.width, 0)
    let gap = (totalSpan - sumWidth) / (items.length - 1)
    // 间距为负（块重叠/堆叠）时，强制最小间距，从首块位置开始依次排列
    let cursor = first.x
    if (gap < MIN_GAP) {
      gap = MIN_GAP
      cursor = first.x
    }
    for (let i = 0; i < items.length; i++) {
      noteStore.updateBlock(note.value.id, items[i].id, { x: cursor })
      cursor += items[i].width + gap
    }
  } else {
    items.sort((a, b) => a.y - b.y)
    const first = items[0]
    const last = items[items.length - 1]
    const totalSpan = (last.y + last.height) - first.y
    const sumHeight = items.reduce((s, i) => s + i.height, 0)
    let gap = (totalSpan - sumHeight) / (items.length - 1)
    let cursor = first.y
    if (gap < MIN_GAP) {
      gap = MIN_GAP
      cursor = first.y
    }
    for (let i = 0; i < items.length; i++) {
      noteStore.updateBlock(note.value.id, items[i].id, { y: cursor })
      cursor += items[i].height + gap
    }
  }
  nextTick(() => { connectionTick.value++ })
  contextMenu.value.show = false
}

// ===== 分组（持久化逻辑分组，拖拽时整组移动）=====
const GROUP_COLORS = ['#6bbd8f', '#4a90d9', '#9b7bd6', '#e8a44a', '#d96b8e', '#7a8ca6']

function groupColorOf(groupId) {
  if (!groupId) return '#9aa4b2'
  let h = 0
  for (let i = 0; i < groupId.length; i++) h = (h * 31 + groupId.charCodeAt(i)) >>> 0
  return GROUP_COLORS[h % GROUP_COLORS.length]
}

function groupSelection() {
  if (!note.value) return
  const ids = selectedBlockIds.value.length >= 2 ? [...selectedBlockIds.value] : []
  if (ids.length < 2) return
  saveHistory()
  const gid = 'grp_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
  for (const id of ids) {
    noteStore.updateBlock(note.value.id, id, { groupId: gid })
  }
  contextMenu.value.show = false
}

function ungroupSelection() {
  if (!note.value) return
  const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : []
  if (!ids.length) return
  saveHistory()
  for (const id of ids) {
    noteStore.updateBlock(note.value.id, id, { groupId: null })
  }
  contextMenu.value.show = false
}

function blockGroupColor(blockId) {
  const b = blocks.value.find(x => x.id === blockId)
  return b?.groupId ? groupColorOf(b.groupId) : null
}

const anySelectionGrouped = computed(() => {
  if (!note.value) return false
  return selectedBlockIds.value.some(id => {
    const b = blocks.value.find(x => x.id === id)
    return b?.groupId
  })
})

function copySelectedBlock() {
  const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : (selectedBlockId.value ? [selectedBlockId.value] : [])
  if (ids.length) {
    copiedBlocks.value = ids
      .map(id => blocks.value.find(b => b.id === id))
      .filter(Boolean)
      .map(b => deepClone(b))
    copiedBlock.value = copiedBlocks.value[copiedBlocks.value.length - 1] || null
  }
  contextMenu.value.show = false
}

function duplicateSelectedBlock() {
  if (!note.value) { contextMenu.value.show = false; return }
  const ids = selectedBlockIds.value.length ? [...selectedBlockIds.value] : (selectedBlockId.value ? [selectedBlockId.value] : [])
  if (!ids.length) { contextMenu.value.show = false; return }
  saveHistory()
  const newIds = ids.map(id => {
    const b = blocks.value.find(x => x.id === id)
    if (!b) return null
    const newBlockData = deepClone(b)
    newBlockData.x += 30
    newBlockData.y += 30
    delete newBlockData.id
    const nb = noteStore.addBlock(note.value.id, newBlockData)
    return nb ? nb.id : null
  }).filter(Boolean)
  selectedBlockIds.value = newIds
  selectedBlockId.value = newIds[newIds.length - 1] || null
  contextMenu.value.show = false
}

function pasteBlockHere() {
  if (!copiedBlocks.value.length || !note.value) {
    contextMenu.value.show = false
    return
  }
  saveHistory()
  const baseX = copiedBlocks.value[0].x || 0
  const baseY = copiedBlocks.value[0].y || 0
  const newIds = []
  for (const src of copiedBlocks.value) {
    const newBlockData = deepClone(src)
    newBlockData.x = contextMenu.value.canvasX - 120 + (newBlockData.x || 0) - baseX
    newBlockData.y = contextMenu.value.canvasY - 30 + (newBlockData.y || 0) - baseY
    delete newBlockData.id
    delete newBlockData.groupId
    const nb = noteStore.addBlock(note.value.id, newBlockData)
    if (nb) newIds.push(nb.id)
  }
  if (newIds.length) {
    selectedBlockIds.value = newIds
    selectedBlockId.value = newIds[newIds.length - 1]
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
  showImageSourcePicker()
}

function onBlockDragStart(blockId, clientX, clientY, e) {
  dragOccurredThisGesture.value = false
  const additive = e && (e.shiftKey || e.ctrlKey || e.metaKey)

  if (additive) {
    if (selectedBlockIds.value.includes(blockId)) {
      // 已选中 + 修饰键 = 移出选择，且不启动拖拽
      toggleBlockInSelection(blockId)
      return
    }
    // 加入选择，并作为主块，随组拖拽
    selectedBlockIds.value = [...selectedBlockIds.value, blockId]
    selectedBlockId.value = blockId
    selectedConnectionId.value = null
  } else {
    if (!selectedBlockIds.value.includes(blockId)) {
      // 若点击的块属于某个分组，则整组联动（拖拽时一起移动）
      const blk = blocks.value.find(b => b.id === blockId)
      if (blk?.groupId) {
        const groupIds = blocks.value.filter(b => b.groupId === blk.groupId).map(b => b.id)
        selectedBlockIds.value = groupIds
        selectedBlockId.value = blockId
        selectedConnectionId.value = null
      } else {
        setSingleSelection(blockId)
      }
    }
    // 若块已在多选中，保持多选以便整组拖拽
  }

  draggingBlock.value = blockId
  hasDragged.value = false
  connectingFrom.value = null

  const rect = canvasRef.value.getBoundingClientRect()
  const canvasX = (clientX - rect.left - canvasConfig.value.offsetX) / canvasConfig.value.zoom
  const canvasY = (clientY - rect.top - canvasConfig.value.offsetY) / canvasConfig.value.zoom

  dragStartMousePos.value = { x: canvasX, y: canvasY }

  const block = blocks.value.find(b => b.id === blockId)
  if (block) {
    dragOffset.value = {
      x: canvasX - block.x,
      y: canvasY - block.y
    }
  }

  // 快照组内所有块起始位置，供整组按偏移移动
  groupDragStart.value = {}
  for (const id of selectedBlockIds.value) {
    const b = blocks.value.find(x => x.id === id)
    if (b) groupDragStart.value[id] = { x: b.x, y: b.y }
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
  return `url(#${markerId(conn, false)})`
}
// 起点 marker：backward / both 时显示（用反向 marker）
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
  for (const conn of connections.value) {
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

let labelMeasureCtx = null
function labelBoxWidth(text) {
  const str = text || ''
  if (!str) return 40
  if (!labelMeasureCtx) {
    labelMeasureCtx = document.createElement('canvas').getContext('2d')
  }
  labelMeasureCtx.font = "12px 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif"
  return Math.max(40, Math.ceil(labelMeasureCtx.measureText(str).width) + 16)
}

function getConnectionMidpoint(conn) {
  void connectionTick.value
  const pathEl = canvasRef.value?.querySelector?.(`path.connection-path[data-conn-id="${conn.id}"]`)
  if (pathEl && typeof pathEl.getTotalLength === 'function') {
    try {
      const total = pathEl.getTotalLength()
      if (total > 0) {
        const p = pathEl.getPointAtLength(total / 2)
        if (Number.isFinite(p.x) && Number.isFinite(p.y)) return { x: p.x, y: p.y }
      }
    } catch (e) {}
  }
  const fromBlock = blocks.value.find(b => b.id === conn.from)
  const toBlock = blocks.value.find(b => b.id === conn.to)
  if (!fromBlock || !toBlock) return { x: 0, y: 0 }
  const { width: fromW, height: fromH } = getBlockSize(conn.from, fromBlock)
  const { width: toW, height: toH } = getBlockSize(conn.to, toBlock)
  return {
    x: (fromBlock.x + fromW / 2 + toBlock.x + toW / 2) / 2,
    y: (fromBlock.y + fromH / 2 + toBlock.y + toH / 2) / 2
  }
}

const editingConnectionLabel = ref(null)
const connectionLabelInput = ref('')

function startEditConnectionLabel(conn) {
  if (!note.value) return
  selectConnection(conn.id)
  editingConnectionLabel.value = conn.id
  connectionLabelInput.value = conn.label || ''
  nextTick(() => {
    const input = document.querySelector('.conn-label-edit')
    if (input) { input.focus(); input.select() }
  })
}

function commitConnectionLabel() {
  if (!editingConnectionLabel.value || !note.value) return
  saveHistory()
  noteStore.updateConnection(note.value.id, editingConnectionLabel.value, { label: connectionLabelInput.value.trim() })
  editingConnectionLabel.value = null
}

function cancelConnectionLabel() {
  editingConnectionLabel.value = null
}

function onConnectionDblClick(conn) {
  startEditConnectionLabel(conn)
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
  position: relative;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: var(--bg-primary);
}

/* export 模式：隐藏所有 chrome，canvas-container 铺满 */
.note-editor-view.export-mode {
  overflow: visible;
}
.note-editor-view.export-mode .editor-header,
.note-editor-view.export-mode .zoom-controls-bottom,
.note-editor-view.export-mode .zoom-controls,
.note-editor-view.export-mode .right-panel,
.note-editor-view.export-mode .find-in-note-bar,
.note-editor-view.export-mode .link-selection-bar,
.note-editor-view.export-mode .multi-select-toolbar,
.note-editor-view.export-mode .connection-toolbar {
  display: none !important;
}
.note-editor-view.export-mode :deep(.note-table-tools) {
  display: none !important;
}
.note-editor-view.export-mode .canvas-container {
  flex: none !important;
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
  flex-wrap: nowrap;
  flex: 1 1 0;
  justify-content: flex-start;
  min-width: 0;
  overflow: hidden;
}

.header-tags {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  padding: 2px 0;
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

.hidden-file-input {
  position: fixed;
  top: -1000px;
  left: -1000px;
  width: 1px;
  height: 1px;
  opacity: 0;
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

/* 大纲面板 */
.outline-panel {
  position: absolute;
  top: 60px;
  right: 16px;
  width: 260px;
  max-height: calc(100vh - 240px);
  background: var(--bg-elevated, var(--bg-secondary));
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
  z-index: 500;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.outline-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--border-light);
  font-size: 14px;
  font-weight: 600;
}
.outline-list {
  overflow-y: auto;
  padding: 6px 0;
}
.outline-item {
  padding: 5px 14px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: all 0.1s;
}
.outline-item:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}
.outline-empty {
  padding: 20px 14px;
  font-size: 12px;
  color: var(--text-tertiary, var(--text-secondary));
  text-align: center;
  line-height: 1.6;
}
.btn-sm {
  padding: 2px;
  min-width: auto;
}
.btn-active {
  background: var(--primary-soft);
  color: var(--primary-color);
}
.outline-slide-enter-active,
.outline-slide-leave-active {
  transition: all 0.2s ease;
}
.outline-slide-enter-from,
.outline-slide-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
  cursor: default;
}

.bg-type-wrapper {
  position: relative;
}
.bg-type-menu {
  position: absolute;
  top: calc(100% + 4px);
  right: 0;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  padding: 6px;
  min-width: 160px;
  z-index: 100;
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
.bg-upload-label {
  cursor: pointer;
}
.bg-type-divider {
  height: 1px;
  background: var(--border-color);
  margin: 4px 0;
}
.bg-opacity-control {
  padding: 6px 10px;
  font-size: 11px;
  color: var(--text-tertiary, var(--text-secondary));
}
.bg-opacity-control input[type="range"] {
  margin-top: 4px;
  accent-color: var(--primary-color);
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
  background-image:
    linear-gradient(to right, var(--grid-line) 1px, transparent 1px),
    linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px);
  background-size: 24px 24px;
  opacity: 0.4;
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
  transition: stroke 0.2s ease, stroke-width 0.2s ease;
}

.connection-path.selected {
  filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.45));
}

.connection-hit {
  pointer-events: stroke;
  cursor: pointer;
}

.conn-label-bg {
  pointer-events: none;
}

.conn-label-text {
  pointer-events: none;
  user-select: none;
  font-size: 12px;
  fill: var(--text-primary);
}

.conn-label-edit {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  text-align: center;
  font-size: 12px;
  color: var(--text-primary);
  padding: 0;
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

.marquee-rect {
  position: absolute;
  pointer-events: none;
  border: 1.5px solid var(--accent-color, #4a90d9);
  background: rgba(74, 144, 217, 0.12);
  border-radius: 2px;
  z-index: 9999;
}

.multi-select-toolbar {
  position: absolute;
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 4px 6px;
  background: var(--bg-primary, #fff);
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 8px;
  box-shadow: var(--shadow-lg, 0 4px 12px rgba(0,0,0,0.12));
  z-index: 10001;
  transform: translateX(-50%);
  user-select: none;
}

.multi-select-toolbar .ms-count {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary, #888);
  padding: 0 4px;
  min-width: 18px;
  text-align: center;
}

.multi-select-toolbar .ms-divider {
  width: 1px;
  height: 18px;
  background: var(--border-light, #e8e8e8);
  margin: 0 2px;
}

.multi-select-toolbar .ms-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 5px;
  color: var(--text-primary, #333);
  cursor: pointer;
  transition: background 0.15s;
}

.multi-select-toolbar .ms-btn:hover:not(:disabled) {
  background: var(--bg-hover, rgba(0,0,0,0.06));
}

.multi-select-toolbar .ms-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

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

.block-style-toolbar::-webkit-scrollbar {
  display: none;
}

.block-style-toolbar > span {
  font-size: 12px;
}

.block-style-toolbar .style-btn {
  padding: 4px 9px;
  font-size: 12px;
}

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
  animation: ctxJellyPop var(--motion-jelly-menu) var(--motion-jelly-ease) backwards;
  transform-origin: top left;
}

@keyframes ctxJellyPop {
  0% { opacity: 0; transform: scale(0.88); }
  65% { opacity: 1; transform: scale(1.008); }
  100% { transform: none; opacity: 1; }
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
.context-menu-label {
  padding: 2px 14px 4px;
  font-size: 10px;
  font-weight: 600;
  color: var(--text-tertiary, var(--text-secondary));
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.right-panel {
  position: absolute;
  right: 16px;
  top: 68px;
  width: 200px;
  max-height: calc(100vh - 100px);
  z-index: 300;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.minimap {
  position: relative;
  height: 150px;
  flex-shrink: 0;
  overflow: hidden;
  cursor: pointer;
  opacity: 0.85;
  transition: opacity var(--transition-fast);
}

.minimap:hover {
  opacity: 1;
}

/* ===== 图片总览面板 ===== */
.images-overview {
  border-top: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 300px;
  flex-shrink: 0;
}
.overview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  user-select: none;
  cursor: pointer;
  flex-shrink: 0;
}
.overview-header:hover {
  color: var(--text-primary);
}
.overview-toggle {
  flex-shrink: 0;
  transition: transform 0.2s ease;
  opacity: 0.7;
}
.images-overview.collapsed .overview-toggle {
  transform: rotate(-90deg);
}
.overview-title {
  display: flex;
  align-items: center;
  gap: 5px;
}
.overview-count {
  background: var(--bg-tertiary, #eef0f2);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}
.overview-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 2px 8px 8px;
  overflow-y: auto;
  min-height: 0;
}
.overview-thumb {
  width: calc(50% - 3px);
  aspect-ratio: 4 / 3;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  border: 1px solid var(--border-light);
  background: var(--bg-tertiary, #eef0f2);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.overview-thumb:hover {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 1px var(--primary-color);
}
.overview-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.overview-empty {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 8px;
  text-align: center;
}

/* ===== 反向链接面板 ===== */
.backlinks-panel {
  border-top: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  min-height: 0;
  max-height: 260px;
}

.backlinks-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 7px 10px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
}
.backlinks-header:hover { background: var(--bg-hover); }

.backlinks-title {
  display: flex;
  align-items: center;
  gap: 5px;
}
.backlinks-count {
  background: var(--bg-tertiary, #eef0f2);
  color: var(--text-secondary);
  border-radius: 8px;
  padding: 0 6px;
  font-size: 11px;
  font-weight: 600;
  min-width: 16px;
  text-align: center;
}
.backlinks-chevron { transition: transform 0.2s; }
.backlinks-chevron.collapsed { transform: rotate(-90deg); }

.backlinks-list {
  overflow-y: auto;
  padding: 2px 6px 6px;
  min-height: 0;
}
.backlink-item {
  padding: 6px 8px;
  border-radius: var(--radius-sm, 6px);
  cursor: pointer;
  transition: background 0.15s;
}
.backlink-item:hover { background: var(--bg-hover); }
.backlink-source {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.backlink-snippet {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.backlinks-empty {
  font-size: 11px;
  color: var(--text-tertiary);
  padding: 8px;
  text-align: center;
}

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

.save-template-modal {
  width: 400px;
  max-width: 90vw;
  padding: 24px;
}

.save-template-modal .modal-header {
  padding: 0 0 14px;
  border-bottom: 1px solid var(--border-light);
  margin-bottom: 16px;
}

.save-template-modal .modal-header h3 {
  font-size: 17px;
  font-weight: 600;
  color: var(--text-primary);
}

.save-template-modal .input {
  margin-bottom: 12px;
  font-size: 14px;
}

.save-template-tip {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 16px;
  padding: 8px 12px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.note-link-item-folder {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  color: var(--primary-dark);
  background: var(--primary-soft);
  padding: 1px 6px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 500;
  max-width: 160px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-link-item-folder svg {
  flex-shrink: 0;
  opacity: 0.75;
}

.note-link-item-badge {
  font-size: 11px;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  color: var(--text-tertiary);
  border-radius: var(--radius-sm);
  flex-shrink: 0;
}

.export-menu-wrap {
  position: relative;
  display: inline-flex;
}

.export-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
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

.tag-chips {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.tag-chip-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: inherit;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.tag-chip-remove:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.12);
}

.tag-add-wrap {
  position: relative;
}

.tag-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px dashed var(--border-color);
  transition: all var(--transition-fast);
}

.tag-add-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tag-picker {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  z-index: 1000;
  width: 240px;
  background: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.tag-picker-fixed {
  position: fixed;
  top: auto;
  left: auto;
  z-index: 99999;
}

.tag-picker-search {
  padding: 8px;
  border-bottom: 1px solid var(--border-light);
}

.tag-picker-search .input {
  width: 100%;
  font-size: 13px;
  padding: 6px 8px;
}

.tag-picker-list {
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
}

.tag-picker-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.tag-picker-item:hover {
  background: var(--bg-hover);
}

.tag-picker-item.selected {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.tag-picker-item .tag-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-picker-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-picker-create {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.tag-picker-create:hover {
  background: var(--primary-soft);
}

.tag-picker-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.preview-image {
  width: min(96vw, 1600px);
  max-width: none;
  max-height: calc(100vh - 96px);
  object-fit: contain;
  border-radius: var(--radius-md);
  cursor: grab;
  user-select: none;
  -webkit-user-drag: none;
  transition: transform 0.1s ease;
}

.preview-image.draggable:active {
  cursor: grabbing;
}

.preview-image.fit {
  cursor: zoom-in;
}

.image-preview-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 999px;
  background: rgba(18, 18, 18, 0.72);
  color: white;
}

.preview-zoom-text {
  min-width: 52px;
  text-align: center;
  font-size: 12px;
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

.image-preview-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.16);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background var(--transition-fast);
  z-index: 1;
}

.image-preview-nav:hover {
  background: rgba(255, 255, 255, 0.32);
}

.image-preview-nav.prev {
  left: 24px;
}

.image-preview-nav.next {
  right: 24px;
}

.image-preview-counter {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  background: rgba(0, 0, 0, 0.4);
  padding: 4px 12px;
  border-radius: 12px;
  z-index: 1;
  pointer-events: none;
}

.link-selection-bar {
  position: absolute;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 8px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
}

.link-selection-info {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--primary-color);
}

.link-selection-title {
  font-weight: 600;
  font-size: 14px;
}

.link-selection-hint {
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 400;
}

.link-selection-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.find-in-note-bar {
  position: absolute;
  top: 64px;
  right: 20px;
  z-index: 500;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
}

.find-input {
  width: 220px;
  padding: 6px 10px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
}

.find-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-soft);
}

.find-count {
  font-size: 12px;
  color: var(--text-tertiary);
  min-width: 48px;
  text-align: center;
  white-space: nowrap;
}

.find-nav-btn,
.find-close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--text-secondary);
  cursor: pointer;
  font-size: 11px;
  transition: background var(--transition-fast), color var(--transition-fast);
}

.find-nav-btn:hover:not(:disabled),
.find-close-btn:hover {
  background: var(--bg-tertiary);
  color: var(--text-primary);
}

.find-nav-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

/* 来源选择弹窗 */
.source-picker-modal {
  width: 400px;
  max-width: 90vw;
  padding: 0;
  overflow: hidden;
}
.source-picker-modal .modal-header {
  padding: 20px 24px 16px;
  margin-bottom: 0;
}
.source-picker-options {
  padding: 0 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.source-option {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--border-light);
  border-radius: 12px;
  background: var(--bg-primary);
  cursor: pointer;
  transition: all .15s;
  text-align: left;
}
.source-option:hover {
  border-color: var(--primary-color);
  background: var(--bg-hover);
  transform: translateY(-1px);
}
.source-option-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: var(--primary-soft);
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.source-option-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.source-option-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
}
.source-option-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>

<style>
mark.find-match {
  background: transparent;
  color: var(--text-primary);
  font-weight: 700;
  font-size: 1.18em;
  padding: 0 1px;
  border-radius: 3px;
  display: inline-block;
  transition: color var(--transition-fast);
}

mark.find-match-current {
  color: var(--primary-color);
  animation: find-text-breathe 1.6s ease-in-out infinite;
}

@keyframes find-text-breathe {
  0%, 100% {
    transform: scale(1.18);
    text-shadow: 0 0 4px var(--primary-soft);
  }
  50% {
    transform: scale(1.32);
    text-shadow: 0 0 10px var(--primary-color);
  }
}
</style>

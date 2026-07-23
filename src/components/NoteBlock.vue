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
      [`block-border-${block.borderStyle || 'solid'}`]: true,
      locked: !!block.locked
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
      <div v-if="groupColor" class="block-group-badge" :style="{ background: groupColor }" :title="'同组成员将一起移动'"></div>
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
        <button class="action-btn" :class="{ active: block.locked }" @click.stop="$emit('toggle-lock', block.id)" :title="block.locked ? '解锁' : '锁定'">
          <svg v-if="block.locked" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <svg v-else width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
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

    <div class="block-content">
      <div v-if="block.type === 'image' && block.imageUrl" class="image-container" :class="{ overflow: imageOverflow }" @dblclick.stop="!readOnly && $emit('add-image', block.id)" @wheel.stop>
        <img :src="resolvedImageUrl" alt="" draggable="false" @click.stop="$emit('preview-image', resolvedImageUrl)" @load="onImageLoad" />
        <button v-if="!readOnly" class="change-image-btn" @click.stop="$emit('add-image', block.id)">更换图片</button>
      </div>

      <div v-else-if="block.type === 'audio' && block.mediaUrl" class="media-container audio-container" @wheel.stop>
        <div class="media-header">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
          </svg>
          <span class="media-name">{{ block.mediaName || '音频' }}</span>
          <button v-if="!readOnly" class="change-media-btn" @click.stop="$emit('add-media', { blockId: block.id, mediaType: 'audio' })">更换</button>
        </div>
        <audio :src="resolvedMediaUrl" controls preload="metadata" @wheel.stop></audio>
      </div>

      <div v-else-if="block.type === 'video' && block.mediaUrl" class="media-container video-container" @wheel.stop>
        <Teleport to="body" :disabled="!pseudoFullscreen">
          <div :class="pseudoFullscreen ? 'video-fs-overlay' : 'video-inline-wrap'" class="video-wrap">
            <video
              ref="videoRef"
              :src="resolvedMediaUrl"
              preload="metadata"
              @click.stop="togglePlay"
              @wheel.stop
              @dblclick.stop="toggleVideoFullscreen"
              @play="isPlaying = true"
              @pause="isPlaying = false"
              @timeupdate="onTimeUpdate"
              @loadedmetadata="onLoadedMetadata"
              @ended="isPlaying = false"
            ></video>
            <div class="video-controls" @click.stop @mousedown.stop @wheel.stop>
              <button class="vc-btn vc-play" @click="togglePlay" :title="isPlaying ? '暂停' : '播放'">
                <svg v-if="!isPlaying" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>
                <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>
              </button>
              <span class="vc-time">{{ formatTime(currentTime) }}</span>
              <div class="vc-progress" ref="progressRef" @click="seekTo($event)" @mousedown="startSeek">
                <div class="vc-progress-fill" :style="{ width: progressPercent + '%' }"></div>
                <div class="vc-progress-thumb" :style="{ left: progressPercent + '%' }"></div>
              </div>
              <span class="vc-time vc-time-dur">{{ formatTime(duration) }}</span>
              <button class="vc-btn vc-fs" @click="toggleVideoFullscreen" :title="pseudoFullscreen ? '退出全屏' : '全屏'">
                <svg v-if="!pseudoFullscreen" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/>
                </svg>
                <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M3 8V5a2 2 0 0 1 2-2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v3"/><path d="M21 16v3a2 2 0 0 1-2 2h-3"/><path d="M8 21H5a2 2 0 0 1-2-2v-3"/>
                </svg>
              </button>
            </div>
          </div>
        </Teleport>
        <div class="media-header">
          <span class="media-name">{{ block.mediaName || '视频' }}</span>
          <button v-if="!readOnly" class="change-media-btn" @click.stop="$emit('add-media', { blockId: block.id, mediaType: 'video' })">更换</button>
        </div>
      </div>

      <div v-else-if="block.type === 'gallery'" class="gallery-container" @wheel.stop>
        <div class="gallery-toolbar">
          <button class="change-media-btn" :class="{ active: galleryLayout === 'carousel' }" @click.stop="setGalleryLayout('carousel')">轮播</button>
          <button class="change-media-btn" :class="{ active: galleryLayout === 'grid' }" @click.stop="setGalleryLayout('grid')">网格</button>
          <span class="gallery-count">{{ (block.images || []).length }} 张</span>
          <button v-if="!readOnly" class="change-media-btn" @click.stop="$emit('add-gallery-image', block.id)">+ 添加</button>
        </div>

        <!-- 网格布局 -->
        <div v-if="galleryLayout === 'grid' && (block.images || []).length" class="gallery-grid">
          <div
            v-for="(img, idx) in (block.images || [])"
            :key="idx"
            class="gallery-cell"
            @click.stop="$emit('preview-image', galleryResolvedUrls[idx])"
          >
            <img :src="galleryResolvedUrls[idx]" alt="" draggable="false" />
            <button v-if="!readOnly" class="gallery-del-btn" @click.stop="removeGalleryImage(idx)" title="删除">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <!-- 轮播布局 -->
        <div v-else-if="galleryLayout === 'carousel' && (block.images || []).length" class="gallery-carousel">
          <button v-if="(block.images || []).length > 1" class="gallery-nav prev" @click.stop="galleryPrev">‹</button>
          <div class="gallery-stage" @click.stop="$emit('preview-image', galleryResolvedUrls[galleryIndex])">
            <img :src="galleryResolvedUrls[galleryIndex]" alt="" draggable="false" />
            <button v-if="!readOnly" class="gallery-del-btn" @click.stop="removeGalleryImage(galleryIndex)" title="删除">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <button v-if="(block.images || []).length > 1" class="gallery-nav next" @click.stop="galleryNext">›</button>
          <div v-if="(block.images || []).length > 1" class="gallery-dots">
            <span
              v-for="(img, idx) in (block.images || [])"
              :key="idx"
              class="gallery-dot"
              :class="{ active: idx === galleryIndex }"
              @click.stop="galleryIndex = idx"
            ></span>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="!readOnly" class="gallery-empty" @click.stop="$emit('add-gallery-image', block.id)">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>点击添加图片</span>
        </div>
        <div v-else class="gallery-empty"><span>暂无图片</span></div>
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
        v-else-if="block.type === 'todo'"
        class="todo-block"
        :class="{ 'is-done': block.status === 'done' }"
        @wheel.stop
      >
        <div class="todo-row">
          <button
            class="todo-status-btn"
            :class="'status-' + (block.status || 'todo')"
            @click.stop="cycleTodoStatus"
            @mousedown.prevent
            :title="todoStatusLabel"
          >
            <svg v-if="(block.status || 'todo') === 'done'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            <svg v-else-if="(block.status || 'todo') === 'doing'" width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20zm0 4a6 6 0 0 1 6 6h-6V6z"/></svg>
            <svg v-else-if="(block.status || 'todo') === 'paused'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="9"/></svg>
          </button>
          <input
            type="text"
            class="todo-title-input"
            :value="block.title || ''"
            placeholder="任务标题..."
            :readonly="readOnly"
            @input="onTodoField('title', $event.target.value)"
            @mousedown.stop
            @click.stop
          />
        </div>
        <div class="todo-meta-row">
          <button
            class="todo-priority-pill"
            :class="'priority-' + (block.priority || 'normal')"
            @click.stop="cycleTodoPriority"
            @mousedown.prevent
            title="优先级"
          >{{ todoPriorityLabel }}</button>
          <div class="todo-due-wrap" @mousedown.stop @click.stop>
            <DateTimePicker
              :model-value="block.dueDate || ''"
              date-only
              compact
              :disabled="readOnly"
              @update:model-value="onTodoField('dueDate', $event || null)"
            />
          </div>
        </div>
        <textarea
          class="todo-notes-input"
          :value="block.content || ''"
          placeholder="备注（可选）..."
          :readonly="readOnly"
          rows="2"
          @input="onTodoField('content', $event.target.value)"
          @mousedown.stop
          @click.stop
        ></textarea>
      </div>

      <!-- 进度条块 -->
      <div
        v-else-if="block.type === 'progress'"
        class="progress-block"
        @wheel.stop
      >
        <div class="progress-header">
          <svg class="progress-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          <input
            type="text"
            class="progress-label-input"
            :value="block.label || ''"
            placeholder="进度标签（如：战斗系统）"
            :readonly="readOnly"
            @input="onProgressField('label', $event.target.value)"
            @mousedown.stop
            @click.stop
          />
          <div class="progress-value-display" :class="{ 'is-done': progressValue >= 100 }">{{ progressValue }}%</div>
        </div>
        <div class="progress-track-wrap">
          <div
            class="progress-track"
            :class="{ 'is-auto': block.mode === 'auto', 'is-dragging': progressDragging }"
            ref="progressTrackRef"
            @mousedown.stop.prevent="onProgressDragStart"
          >
            <div class="progress-fill" :style="{ width: progressValue + '%' }"></div>
            <div class="progress-thumb" :style="{ left: progressValue + '%' }"></div>
          </div>
          <div class="progress-controls" v-if="!readOnly">
            <button class="progress-step-btn" @mousedown.prevent @click.stop="progressStep(-5)" title="-5%">−</button>
            <button class="progress-step-btn" @mousedown.prevent @click.stop="progressStep(5)" title="+5%">+</button>
          </div>
        </div>
        <div class="progress-mode-row" v-if="!readOnly">
          <button
            class="progress-mode-toggle"
            :class="{ active: block.mode === 'auto' }"
            @mousedown.prevent
            @click.stop="toggleProgressMode"
            :title="block.mode === 'auto' ? '自动模式：按关联任务块计算完成率' : '手动模式：手动调整百分比'"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12a9 9 0 1 1-9-9"/><path d="M21 3v6h-6"/></svg>
            {{ block.mode === 'auto' ? '自动（按任务）' : '手动' }}
          </button>
          <span v-if="block.mode === 'auto'" class="progress-auto-hint">{{ progressAutoText }}</span>
          <button
            v-if="block.mode === 'auto' && progressLinkedTodos.length > 0"
            class="progress-link-toggle"
            @mousedown.prevent
            @click.stop="progressShowLinks = !progressShowLinks"
            :class="{ active: progressShowLinks }"
          >
            {{ progressShowLinks ? '收起' : '关联任务' }}
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="6 9 12 15 18 9"/></svg>
          </button>
        </div>
        <div v-if="block.mode === 'auto' && progressShowLinks && progressLinkedTodos.length > 0" class="progress-link-list">
          <div class="progress-link-header">
            <span>选择要计入的任务（不选则全部计入）</span>
            <button v-if="(block.linkedTodoIds || []).length > 0" class="progress-link-clear" @mousedown.prevent @click.stop="clearProgressLinks">清除选择</button>
          </div>
          <label
            v-for="t in progressLinkedTodos"
            :key="t.id"
            class="progress-link-item"
            :class="{ checked: (block.linkedTodoIds || []).includes(t.id) }"
            @mousedown.stop
            @click.stop="toggleProgressLink(t.id)"
          >
            <span class="progress-link-check">
              <svg v-if="(block.linkedTodoIds || []).includes(t.id)" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </span>
            <span class="progress-link-status" :class="'status-' + (t.status || 'todo')"></span>
            <span class="progress-link-title">{{ t.title || '未命名任务' }}</span>
          </label>
        </div>
        <div v-else-if="block.mode === 'auto' && progressLinkedTodos.length === 0 && progressShowLinks" class="progress-link-empty">
          本笔记还没有任务块，右键画布创建任务块后再来关联
        </div>
      </div>

      <!-- 里程碑块 -->
      <div
        v-else-if="block.type === 'milestone'"
        class="milestone-block"
        :class="{ 'is-done': block.done }"
        @wheel.stop
      >
        <div class="milestone-row">
          <button
            class="milestone-icon-btn"
            :class="{ done: block.done }"
            @click.stop="toggleMilestoneDone"
            @mousedown.prevent
            :title="block.done ? '标记为未完成' : '标记为已完成'"
          >
            <svg v-if="block.done" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 22V4l5 3 5-3 6 3v14l-6-3-5 3z"/></svg>
            <svg v-else width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 22V4l5 3 5-3 6 3v14l-6-3-5 3z"/></svg>
          </button>
          <input
            type="text"
            class="milestone-title-input"
            :value="block.title || ''"
            placeholder="里程碑名称（如：v0.3 Demo）"
            :readonly="readOnly"
            @input="onMilestoneField('title', $event.target.value)"
            @mousedown.stop
            @click.stop
          />
        </div>
        <div class="milestone-meta-row">
          <div class="milestone-date-wrap" @mousedown.stop @click.stop>
            <DateTimePicker
              :model-value="block.date || ''"
              date-only
              compact
              :disabled="readOnly"
              @update:model-value="onMilestoneField('date', $event || null)"
            />
          </div>
          <div v-if="block.date" class="milestone-relative" :class="{ overdue: milestoneOverdue }">{{ milestoneRelative }}</div>
        </div>
        <textarea
          class="milestone-desc-input"
          :value="block.desc || ''"
          placeholder="版本目标 / 交付内容..."
          :readonly="readOnly"
          rows="2"
          @input="onMilestoneField('desc', $event.target.value)"
          @mousedown.stop
          @click.stop
        ></textarea>
      </div>

      <div
        v-else-if="block.type === 'table'"
        class="table-block"
        @wheel.stop
      >
        <div class="table-toolbar">
          <span class="table-count" v-if="tableRows.length > 1">{{ tableRows.length - 1 }} 行 × {{ (tableRows[0] || []).length }} 列</span>
          <div class="table-actions">
            <button v-if="!readOnly" class="change-media-btn" @click.stop="addTableRow">+ 行</button>
            <button v-if="!readOnly" class="change-media-btn" @click.stop="addTableCol">+ 列</button>
            <button v-if="!readOnly && tableRows.length > 2" class="change-media-btn danger" @click.stop="delTableRow">− 行</button>
            <button v-if="!readOnly && (tableRows[0]||[]).length > 1" class="change-media-btn danger" @click.stop="delTableCol">− 列</button>
            <button class="change-media-btn" :class="{ active: block.tableAnalysis }" @click.stop="emit('update', block.id, { tableAnalysis: !block.tableAnalysis })">分析</button>
          </div>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th
                v-for="(cell, ci) in (tableRows[0] || [])"
                :key="ci"
                :contenteditable="!readOnly && !block.locked"
                spellcheck="false"
                @blur="onCellEdit(0, ci, $event)"
                @keydown.enter.prevent="$event.target.blur()"
                @mousedown.stop
                @wheel.stop
              >{{ cell }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(row, ri) in tableRows.slice(1)" :key="ri">
              <td
                v-for="(cell, ci) in row"
                :key="ci"
                :class="getCellClass(ri + 1, ci, cell)"
                :contenteditable="!readOnly && !block.locked"
                spellcheck="false"
                @blur="onCellEdit(ri + 1, ci, $event)"
                @keydown.enter.prevent="$event.target.blur()"
                @mousedown.stop
                @wheel.stop
              >{{ cell }}</td>
            </tr>
          </tbody>
          <tfoot v-if="block.tableAnalysis && tableSums">
            <tr>
              <td v-for="(sum, ci) in tableSums" :key="ci" class="table-sum">
                {{ sum }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div
        v-else-if="block.type === 'formula'"
        class="formula-block"
        @wheel.stop
        @mousedown.stop
      >
        <div class="formula-render" v-html="renderedFormula"></div>
        <textarea
          v-if="!readOnly && !block.locked"
          v-show="formulaEditing"
          ref="formulaTextareaRef"
          class="formula-input"
          v-model="formulaText"
          spellcheck="false"
          placeholder="输入 LaTeX 公式，如 \frac{a}{b}"
          @input="onFormulaInput"
          @blur="formulaEditing = false"
          @wheel.stop
          @mousedown.stop
        ></textarea>
        <div v-if="!formulaEditing && !readOnly && !block.locked" class="formula-edit-hint" @click.stop="startFormulaEdit">点击编辑公式</div>
      </div>

      <div
        v-else-if="block.type === 'code'"
        class="code-block"
        @wheel.stop
      >
        <div class="code-head">
          <select
            class="code-lang-select"
            :value="block.codeLang || 'auto'"
            :disabled="readOnly"
            @change.stop="onCodeLangChange($event)"
            @mousedown.stop
          >
            <option value="auto">自动</option>
            <option v-for="lang in codeLangs" :key="lang" :value="lang">{{ lang }}</option>
          </select>
          <button class="code-copy-btn" @click.stop="copyCode" title="复制">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
        </div>
        <textarea
          v-if="!readOnly && !block.locked && codeEditing"
          ref="codeTextareaRef"
          class="code-textarea"
          v-model="codeText"
          spellcheck="false"
          @input="onCodeInput"
          @blur="codeEditing = false"
          @wheel.stop
          @mousedown.stop
        ></textarea>
        <pre
          v-else
          class="code-pre"
          :class="{ 'code-pre-interactive': !readOnly && !block.locked }"
          v-html="highlightedCode"
          @click.stop="startCodeEdit"
        ></pre>
      </div>

      <div
        v-else-if="block.type === 'callout'"
        class="callout-block"
        :class="`callout-${block.calloutType || 'info'}`"
        @wheel.stop
      >
        <div class="callout-head">
          <span class="callout-icon" v-html="calloutIconSvg[block.calloutType || 'info']"></span>
          <div class="callout-type-selector">
            <button
              v-for="t in calloutTypes"
              :key="t.key"
              class="callout-type-btn"
              :class="[{ active: (block.calloutType || 'info') === t.key }, `callout-type-${t.key}`]"
              :title="t.label"
              @click.stop="emit('update', block.id, { calloutType: t.key })"
            ><span v-html="calloutIconSvg[t.key]"></span></button>
          </div>
        </div>
        <div
          ref="editorRef"
          class="text-editor callout-editor"
          :class="{ 'read-only': readOnly || linkSelectionMode || block.locked }"
          :contenteditable="!readOnly && !linkSelectionMode && !block.locked"
          spellcheck="false"
          :data-placeholder="block.content ? '' : '输入内容...'"
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
        v-else
        ref="editorRef"
        class="text-editor"
        :class="{ 'read-only': readOnly || linkSelectionMode || block.locked }"
        :contenteditable="!readOnly && !linkSelectionMode && !block.locked"
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
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount, onUnmounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import { useShortcutStore } from '@/stores/shortcut'
import { resolveImageUrl, isImageRef } from '@/utils/imageStore'
import { markdownToHtml, convertInlineMd, isLikelyMarkdown, escapeHtml, splitTableCells } from '@/utils/markdown'
import DateTimePicker from '@/components/DateTimePicker.vue'
import hljs from 'highlight.js/lib/core'
import hljsJavascript from 'highlight.js/lib/languages/javascript'
import hljsXml from 'highlight.js/lib/languages/xml'
import hljsCss from 'highlight.js/lib/languages/css'
import hljsJson from 'highlight.js/lib/languages/json'
import hljsPython from 'highlight.js/lib/languages/python'
import hljsSql from 'highlight.js/lib/languages/sql'
import hljsGlsl from 'highlight.js/lib/languages/glsl'
import hljsPlaintext from 'highlight.js/lib/languages/plaintext'
import katex from 'katex'
import 'katex/dist/katex.min.css'

hljs.registerLanguage('javascript', hljsJavascript)
hljs.registerLanguage('xml', hljsXml)
hljs.registerLanguage('css', hljsCss)
hljs.registerLanguage('json', hljsJson)
hljs.registerLanguage('python', hljsPython)
hljs.registerLanguage('sql', hljsSql)
hljs.registerLanguage('glsl', hljsGlsl)
hljs.registerLanguage('plaintext', hljsPlaintext)

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
  allBlocks: { type: Array, default: () => [] },
  selected: Boolean,
  connectMode: Boolean,
  connectingFrom: String,
  readOnly: Boolean,
  highlighted: Boolean,
  hideHighlightUnderline: Boolean,
  syncVersion: Number,
  linkSelectionMode: Boolean,
  linkSelected: Boolean,
  groupColor: String
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

const resolvedMediaUrl = ref('')
watch(
  () => props.block?.mediaUrl,
  async (url) => {
    if (!url) { resolvedMediaUrl.value = ''; return }
    if (isImageRef(url)) {
      resolvedMediaUrl.value = await resolveImageUrl(url)
    } else {
      resolvedMediaUrl.value = url
    }
  },
  { immediate: true }
)

const videoRef = ref(null)
const progressRef = ref(null)
const pseudoFullscreen = ref(false)
const isPlaying = ref(false)
const currentTime = ref(0)
const duration = ref(0)

const progressPercent = computed(() => duration.value > 0 ? (currentTime.value / duration.value) * 100 : 0)

function togglePlay() {
  const v = videoRef.value
  if (!v) return
  if (v.paused) v.play().catch(() => {})
  else v.pause()
}

function onTimeUpdate() {
  const v = videoRef.value
  if (v) currentTime.value = v.currentTime
}

function onLoadedMetadata() {
  const v = videoRef.value
  if (v) duration.value = v.duration || 0
}

function formatTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

function seekTo(e) {
  const bar = progressRef.value
  const v = videoRef.value
  if (!bar || !v || !duration.value) return
  const rect = bar.getBoundingClientRect()
  const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  v.currentTime = ratio * duration.value
  currentTime.value = v.currentTime
}

function startSeek(e) {
  e.preventDefault()
  seekTo(e)
  const move = (ev) => seekTo(ev)
  const up = () => {
    document.removeEventListener('mousemove', move)
    document.removeEventListener('mouseup', up)
  }
  document.addEventListener('mousemove', move)
  document.addEventListener('mouseup', up)
}

// 祖先 blocks-layer 带 transform（画布缩放），会同时让原生全屏和 position:fixed 失效。
// 方案：用 Teleport 把 video 传送到 body，脱离 transform 祖主，再用 fixed 铺满视口。
function toggleVideoFullscreen() {
  const v = videoRef.value
  if (!v) return
  if (pseudoFullscreen.value) { exitPseudoFullscreen(); return }
  pseudoFullscreen.value = true
  document.addEventListener('keydown', onFsKeydown)
  nextTick(() => v.play?.().catch(() => {}))
}

function exitPseudoFullscreen() {
  pseudoFullscreen.value = false
  document.removeEventListener('keydown', onFsKeydown)
}

function onFsKeydown(e) {
  if (e.key === 'Escape') exitPseudoFullscreen()
}

onBeforeUnmount(() => {
  if (pseudoFullscreen.value) exitPseudoFullscreen()
})

// ===== 图片画廊块 =====
const galleryIndex = ref(0)
const galleryLayout = ref('carousel')
const galleryResolvedUrls = ref([])

// ===== Callout 引用提示块 =====
const calloutTypes = [
  { key: 'info', label: '信息', icon: 'M12 16v-4M12 8h.01', circle: true },
  { key: 'tip', label: '提示', icon: 'M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11', circle: false },
  { key: 'warning', label: '警告', icon: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01', circle: false },
  { key: 'danger', label: '危险', icon: 'M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z', circle: false }
]
const calloutIconSvg = {
  info: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  tip: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  warning: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  danger: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
}

// ===== 代码块语法高亮 =====
const codeLangs = ['javascript', 'xml', 'css', 'json', 'python', 'sql', 'glsl', 'plaintext']

// ===== 数学公式块 =====
const formulaEditing = ref(false)

// ===== 数值表格块 =====
const tableEditing = ref(false)
const tableRawText = ref('')
const tableRows = computed(() => {
  const raw = props.block?.tableData || '列1|列2|列3\n10|20|30\n15|25|35'
  return raw.split('\n').filter(r => r.trim()).map(r => r.split(/\||\t/).map(c => c.trim()))
})
function onCellEdit(rowIdx, colIdx, e) {
  const newVal = e.target.innerText.trim()
  const rows = tableRows.value.map(r => [...r])
  if (!rows[rowIdx]) return
  if (newVal === (rows[rowIdx][colIdx] || '')) return
  rows[rowIdx][colIdx] = newVal
  emit('update', props.block.id, { tableData: rows.map(r => r.join('|')).join('\n') })
}
const numericColumns = computed(() => {
  if (tableRows.value.length < 2) return new Set()
  const colCount = (tableRows.value[0] || []).length
  const numeric = new Set()
  for (let c = 0; c < colCount; c++) {
    let allNum = true
    for (let r = 1; r < tableRows.value.length; r++) {
      const val = parseFloat((tableRows.value[r][c] || '').replace(/[%,]/g, ''))
      if (isNaN(val)) { allNum = false; break }
    }
    if (allNum) numeric.add(c)
  }
  return numeric
})
const tableSums = computed(() => {
  if (!props.block?.tableAnalysis || tableRows.value.length < 2) return null
  const colCount = (tableRows.value[0] || []).length
  return Array.from({ length: colCount }, (_, c) => {
    if (!numericColumns.value.has(c)) return c === 0 ? '合计' : ''
    let sum = 0
    for (let r = 1; r < tableRows.value.length; r++) {
      sum += parseFloat((tableRows.value[r][c] || '0').replace(/[%,]/g, '')) || 0
    }
    return Number.isInteger(sum) ? sum.toString() : sum.toFixed(1)
  })
})
const columnExtremes = computed(() => {
  const extremes = {}
  numericColumns.value.forEach(c => {
    let min = Infinity, max = -Infinity
    for (let r = 1; r < tableRows.value.length; r++) {
      const val = parseFloat((tableRows.value[r][c] || '0').replace(/[%,]/g, ''))
      if (val < min) min = val
      if (val > max) max = val
    }
    extremes[c] = { min, max }
  })
  return extremes
})
function getCellClass(ri, ci, cell) {
  if (!props.block?.tableAnalysis || !numericColumns.value.has(ci)) return ''
  const val = parseFloat((cell || '0').replace(/[%,]/g, ''))
  if (isNaN(val)) return ''
  const ext = columnExtremes.value[ci]
  if (!ext) return ''
  if (val === ext.max) return 'cell-max'
  if (val === ext.min) return 'cell-min'
  return ''
}
function startTableEdit() {}
function onTableRawInput() {}
function addTableRow() {
  const cols = (tableRows.value[0] || []).length || 3
  const newRow = Array(cols).fill('0').join('|')
  emit('update', props.block.id, { tableData: (props.block.tableData || '') + '\n' + newRow })
}
function addTableCol() {
  const rows = (props.block.tableData || '').split('\n').filter(r => r.trim())
  const newRows = rows.map(r => {
    const cells = r.split(/\||\t/)
    cells.push('0')
    return cells.join('|')
  })
  emit('update', props.block.id, { tableData: newRows.join('\n') })
}
function delTableRow() {
  const rows = (props.block.tableData || '').split('\n').filter(r => r.trim())
  if (rows.length <= 2) return
  rows.pop()
  emit('update', props.block.id, { tableData: rows.join('\n') })
}
function delTableCol() {
  const rows = tableRows.value
  if ((rows[0] || []).length <= 1) return
  const newRows = rows.map(r => r.slice(0, -1))
  emit('update', props.block.id, { tableData: newRows.map(r => r.join('|')).join('\n') })
}
const formulaText = ref('')
const formulaTextareaRef = ref(null)
const renderedFormula = computed(() => {
  const latex = props.block?.formula || ''
  if (!latex) return '<span class="formula-placeholder">点击编辑输入 LaTeX 公式</span>'
  try {
    return katex.renderToString(latex, { throwOnError: false, displayMode: true })
  } catch {
    return escapeHtml(latex)
  }
})
function startFormulaEdit() {
  formulaText.value = props.block?.formula || ''
  formulaEditing.value = true
  nextTick(() => formulaTextareaRef.value?.focus())
}
function onFormulaInput() {
  emit('update', props.block.id, { formula: formulaText.value })
}
const codeEditing = ref(false)
const codeText = ref('')
const codeTextareaRef = ref(null)

const highlightedCode = computed(() => {
  const raw = props.block?.code || ''
  const lang = props.block?.codeLang || 'auto'
  try {
    if (lang !== 'auto' && hljs.getLanguage(lang)) {
      return hljs.highlight(raw, { language: lang }).value
    }
    return hljs.highlightAuto(raw).value
  } catch {
    return escapeHtml(raw)
  }
})
function startCodeEdit() {
  codeText.value = props.block?.code || ''
  codeEditing.value = true
  nextTick(() => codeTextareaRef.value?.focus())
}
function onCodeInput() {
  emit('update', props.block.id, { code: codeText.value })
}
function onCodeLangChange(e) {
  emit('update', props.block.id, { codeLang: e.target.value })
}
async function copyCode() {
  try { await navigator.clipboard.writeText(props.block?.code || '') } catch {}
}
let galleryWatchStop = null

function setupGallery() {
  if (galleryWatchStop) galleryWatchStop()
  galleryWatchStop = watch(
    () => [props.block?.images, props.block?.galleryLayout],
    async () => {
      const imgs = props.block?.images || []
      galleryLayout.value = props.block?.galleryLayout || 'carousel'
      if (galleryIndex.value >= imgs.length) galleryIndex.value = Math.max(0, imgs.length - 1)
      galleryResolvedUrls.value = await Promise.all(
        imgs.map(async (url) => {
          if (!url) return ''
          return isImageRef(url) ? await resolveImageUrl(url) : url
        })
      )
    },
    { immediate: true }
  )
}

function galleryPrev() {
  const len = (props.block?.images || []).length
  if (len) galleryIndex.value = (galleryIndex.value - 1 + len) % len
}
function galleryNext() {
  const len = (props.block?.images || []).length
  if (len) galleryIndex.value = (galleryIndex.value + 1) % len
}
function setGalleryLayout(layout) {
  galleryLayout.value = layout
  emit('update', props.block.id, { galleryLayout: layout })
}
function removeGalleryImage(idx) {
  const imgs = [...(props.block?.images || [])]
  imgs.splice(idx, 1)
  emit('update', props.block.id, { images: imgs })
  if (galleryIndex.value >= imgs.length) galleryIndex.value = Math.max(0, imgs.length - 1)
}

onMounted(() => { if (props.block?.type === 'gallery') setupGallery() })
watch(() => props.block?.type, (t) => {
  if (t === 'gallery' && !galleryWatchStop) setupGallery()
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
  'add-media',
  'add-gallery-image',
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
  const isAutoSize = props.block.type === 'image' || props.block.type === 'note-link' || props.block.type === 'audio' || props.block.type === 'gallery'
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
  if (props.block.locked) {
    style.pointerEvents = ''
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

function onClick(e) {
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
  emit('select', props.block.id, e)
}

function onMouseDown(e) {
  if (props.linkSelectionMode) return
  if (props.block?.locked) return
  if (e.target.closest('.action-btn') || e.target.closest('.style-menu') || e.target.closest('.connect-dot') || e.target.closest('.resize-handle') || e.target.closest('.insert-menu') || e.target.closest('.table-grid-picker')) {
    return
  }
  if (e.target.closest('.text-editor')) {
    return
  }
  if (e.target.closest('.media-container')) {
    return
  }
  emit('drag-start', props.block.id, e.clientX, e.clientY, e)
}

// ===== Todo 块 =====
const TODO_STATUSES = ['todo', 'doing', 'done', 'paused']
const TODO_STATUS_LABELS = { todo: '待办', doing: '进行中', done: '已完成', paused: '已搁置' }
const TODO_PRIORITIES = ['low', 'normal', 'high']
const TODO_PRIORITY_LABELS = { low: '低', normal: '中', high: '高' }

const todoStatusLabel = computed(() => TODO_STATUS_LABELS[props.block?.status || 'todo'])
const todoPriorityLabel = computed(() => '优先级：' + TODO_PRIORITY_LABELS[props.block?.priority || 'normal'])

function cycleTodoStatus() {
  if (props.readOnly) return
  const cur = props.block?.status || 'todo'
  const next = TODO_STATUSES[(TODO_STATUSES.indexOf(cur) + 1) % TODO_STATUSES.length]
  emit('save-history', props.block.id)
  emit('update', props.block.id, { status: next })
}

function cycleTodoPriority() {
  if (props.readOnly) return
  const cur = props.block?.priority || 'normal'
  const next = TODO_PRIORITIES[(TODO_PRIORITIES.indexOf(cur) + 1) % TODO_PRIORITIES.length]
  emit('save-history', props.block.id)
  emit('update', props.block.id, { priority: next })
}

let todoFieldHistorySaved = false
function onTodoField(field, value) {
  if (props.readOnly) return
  if (!todoFieldHistorySaved) {
    emit('save-history', props.block.id)
    todoFieldHistorySaved = true
    setTimeout(() => { todoFieldHistorySaved = false }, 800)
  }
  emit('update', props.block.id, { [field]: value })
}

// ===== 进度条块 =====
const progressTrackRef = ref(null)
const progressDragging = ref(false)
const progressShowLinks = ref(false)

const progressValue = computed(() => {
  if (props.block?.mode === 'auto') {
    return progressAutoValue.value
  }
  return Math.max(0, Math.min(100, props.block?.value ?? 0))
})

const progressLinkedTodos = computed(() => {
  return (props.allBlocks || []).filter(b => b.type === 'todo')
})

const progressAutoValue = computed(() => {
  const linked = props.block?.linkedTodoIds
  const todos = (linked && linked.length > 0)
    ? progressLinkedTodos.value.filter(t => linked.includes(t.id))
    : progressLinkedTodos.value
  if (todos.length === 0) return 0
  const done = todos.filter(b => b.status === 'done').length
  return Math.round((done / todos.length) * 100)
})

const progressAutoText = computed(() => {
  const linked = props.block?.linkedTodoIds
  const todos = (linked && linked.length > 0)
    ? progressLinkedTodos.value.filter(t => linked.includes(t.id))
    : progressLinkedTodos.value
  if (todos.length === 0) {
    return linked && linked.length > 0 ? '关联任务已被删除' : '本笔记暂无任务块'
  }
  const done = todos.filter(b => b.status === 'done').length
  const scope = linked && linked.length > 0 ? `关联 ${todos.length} 项` : `全部 ${todos.length} 项`
  return `${done}/${todos.length} 完成 · ${scope}`
})

let progressFieldHistorySaved = false
function onProgressField(field, value) {
  if (props.readOnly) return
  if (!progressFieldHistorySaved) {
    emit('save-history', props.block.id)
    progressFieldHistorySaved = true
    setTimeout(() => { progressFieldHistorySaved = false }, 800)
  }
  emit('update', props.block.id, { [field]: value })
}

function toggleProgressLink(todoId) {
  if (props.readOnly) return
  const linked = [...(props.block?.linkedTodoIds || [])]
  const idx = linked.indexOf(todoId)
  if (idx >= 0) linked.splice(idx, 1)
  else linked.push(todoId)
  emit('save-history', props.block.id)
  emit('update', props.block.id, { linkedTodoIds: linked })
}

function clearProgressLinks() {
  if (props.readOnly) return
  emit('save-history', props.block.id)
  emit('update', props.block.id, { linkedTodoIds: [] })
}

function progressStep(delta) {
  if (props.readOnly) return
  const cur = props.block?.value ?? 0
  const next = Math.max(0, Math.min(100, cur + delta))
  emit('save-history', props.block.id)
  emit('update', props.block.id, { value: next })
}

function onProgressDragStart(e) {
  if (props.readOnly || props.block?.mode === 'auto') return
  progressDragging.value = true
  emit('save-history', props.block.id)
  updateProgressFromPointer(e)
  const onMove = (ev) => updateProgressFromPointer(ev)
  const onUp = () => {
    progressDragging.value = false
    document.removeEventListener('mousemove', onMove)
    document.removeEventListener('mouseup', onUp)
  }
  document.addEventListener('mousemove', onMove)
  document.addEventListener('mouseup', onUp)
}

function updateProgressFromPointer(e) {
  const track = progressTrackRef.value
  if (!track) return
  const rect = track.getBoundingClientRect()
  let pct = Math.round(((e.clientX - rect.left) / rect.width) * 100)
  pct = Math.max(0, Math.min(100, pct))
  emit('update', props.block.id, { value: pct })
}

function toggleProgressMode() {
  if (props.readOnly) return
  const next = props.block?.mode === 'auto' ? 'manual' : 'auto'
  emit('save-history', props.block.id)
  emit('update', props.block.id, { mode: next })
}

// ===== 里程碑块 =====
const milestoneRelative = computed(() => {
  const date = props.block?.date
  if (!date) return ''
  const target = new Date(date + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const diff = Math.round((target - now) / 86400000)
  if (props.block?.done) return '已完成'
  if (diff === 0) return '今天'
  if (diff > 0) return `还有 ${diff} 天`
  return `逾期 ${-diff} 天`
})

const milestoneOverdue = computed(() => {
  if (props.block?.done) return false
  const date = props.block?.date
  if (!date) return false
  const target = new Date(date + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return target < now
})

function toggleMilestoneDone() {
  if (props.readOnly) return
  emit('save-history', props.block.id)
  emit('update', props.block.id, { done: !props.block?.done })
}

let milestoneFieldHistorySaved = false
function onMilestoneField(field, value) {
  if (props.readOnly) return
  if (!milestoneFieldHistorySaved) {
    emit('save-history', props.block.id)
    milestoneFieldHistorySaved = true
    setTimeout(() => { milestoneFieldHistorySaved = false }, 800)
  }
  emit('update', props.block.id, { [field]: value })
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
  if (props.block?.locked) return
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
    // 空代码块/公式块自动进入编辑
    if (props.block?.type === 'code' && !props.block.code) {
      startCodeEdit()
    }
    if (props.block?.type === 'formula' && !props.block.formula) {
      startFormulaEdit()
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

.block-group-badge {
  width: 9px;
  height: 9px;
  border-radius: 50%;
  flex-shrink: 0;
  box-shadow: 0 0 0 2px var(--bg-primary, #fff);
  margin-left: -2px;
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

.action-btn.active {
  color: var(--primary-color);
  background: var(--primary-soft);
}

/* 锁定块样式 */
.note-block.locked {
  border-style: dashed !important;
  border-color: var(--text-tertiary) !important;
}
.note-block.locked .block-drag-handle {
  opacity: 0.25;
  cursor: default;
}
.note-block.locked .resize-handle {
  display: none;
}
.note-block.locked .connect-dot {
  opacity: 0.3;
  pointer-events: none;
}
.note-block.locked::after {
  content: '';
  position: absolute;
  top: 6px;
  left: 6px;
  width: 16px;
  height: 16px;
  background: var(--text-tertiary);
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>") center / 13px no-repeat;
  mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'><rect x='3' y='11' width='18' height='11' rx='2'/><path d='M7 11V7a5 5 0 0 1 10 0v4'/></svg>") center / 13px no-repeat;
  opacity: 0.55;
  pointer-events: none;
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

/* 音频/视频块 */
.media-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}
.audio-container audio {
  width: 100%;
  border-radius: var(--radius-md);
  outline: none;
}
.video-container video {
  width: 100%;
  max-height: 320px;
  border-radius: var(--radius-md);
  background: #000;
  display: block;
}
.video-wrap {
  position: relative;
}
.video-inline-wrap {
  display: contents;
}
/* 伪全屏 overlay：teleport 到 body，脱离 transform 祖先，fixed 才真正相对 viewport */
.video-fs-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000;
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.video-fs-overlay video {
  max-width: 100vw;
  max-height: 100vh;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  background: #000;
}

/* 自定义播放控件 */
.video-controls {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-top: none;
  border-radius: 0 0 var(--radius-md) var(--radius-md);
}
.video-fs-overlay .video-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.65);
  border: none;
  border-radius: 0;
  padding: 10px 16px;
  backdrop-filter: blur(6px);
}
.vc-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  color: var(--text-primary);
  border: none;
  border-radius: 50%;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;
}
.vc-btn:hover {
  background: var(--bg-hover);
}
.video-fs-overlay .vc-btn {
  color: #fff;
}
.video-fs-overlay .vc-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}
.vc-time {
  font-size: 11px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  min-width: 34px;
  text-align: center;
}
.video-fs-overlay .vc-time {
  color: rgba(255, 255, 255, 0.85);
}
.vc-progress {
  position: relative;
  flex: 1;
  height: 6px;
  background: var(--bg-hover);
  border-radius: 3px;
  cursor: pointer;
}
.video-fs-overlay .vc-progress {
  height: 8px;
  background: rgba(255, 255, 255, 0.25);
}
.vc-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--primary-color);
  border-radius: 3px;
  pointer-events: none;
}
.vc-progress-thumb {
  position: absolute;
  top: 50%;
  width: 12px;
  height: 12px;
  background: var(--primary-color);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.15s;
  pointer-events: none;
}
.vc-progress:hover .vc-progress-thumb {
  opacity: 1;
}
.video-fs-overlay .vc-progress-thumb {
  width: 14px;
  height: 14px;
}

/* 图片画廊块 */
.gallery-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px;
}
.gallery-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0 4px;
}
.gallery-toolbar .change-media-btn.active {
  background: var(--primary-soft);
  color: var(--primary-color);
  border-color: var(--primary-color);
}
.gallery-count {
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
}
.gallery-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 6px;
}
.gallery-cell {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
  cursor: pointer;
  background: var(--bg-tertiary);
}
.gallery-cell img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.gallery-cell:hover img {
  opacity: 0.88;
}
.gallery-carousel {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}
.gallery-stage {
  position: relative;
  width: 100%;
  cursor: pointer;
}
.gallery-stage img {
  width: 100%;
  border-radius: var(--radius-sm);
  display: block;
  background: var(--bg-tertiary);
}
.gallery-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 28px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.45);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 22px;
  cursor: pointer;
  z-index: 2;
  line-height: 1;
  padding: 0;
}
.gallery-nav:hover { background: rgba(0,0,0,0.7); }
.gallery-nav.prev { left: 4px; }
.gallery-nav.next { right: 4px; }
.gallery-dots {
  display: flex;
  justify-content: center;
  gap: 5px;
  padding-top: 6px;
}
.gallery-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--border-color);
  cursor: pointer;
  transition: all 0.15s;
}
.gallery-dot.active {
  background: var(--primary-color);
  width: 16px;
  border-radius: 4px;
}
.gallery-del-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.55);
  color: #fff;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.15s;
  z-index: 3;
}
.gallery-cell:hover .gallery-del-btn,
.gallery-stage:hover .gallery-del-btn {
  opacity: 1;
}
.gallery-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 100px;
  border: 2px dashed var(--border-color);
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 13px;
  cursor: pointer;
}
.gallery-empty span { opacity: 0.7; }

/* Callout 引用提示块 */
.callout-block {
  border-radius: var(--radius-md);
  border-left: 4px solid;
  padding: 10px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.callout-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.callout-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}
.callout-type-selector {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}
.callout-block:hover .callout-type-selector { opacity: 1; }
.callout-type-btn {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  opacity: 0.4;
  color: var(--text-secondary);
}
.callout-type-btn:hover { opacity: 0.8; background: rgba(0,0,0,0.06); }
.callout-type-btn.active { opacity: 1; }
.callout-type-btn svg { width: 15px; height: 15px; }
/* 类型选择器各自配色 */
.callout-type-info.active { color: #1565c0; }
.callout-type-tip.active { color: #2e7d32; }
.callout-type-warning.active { color: #e65100; }
.callout-type-danger.active { color: #c62828; }
.callout-editor {
  outline: none;
  font-size: 14px;
  line-height: 1.6;
  min-height: 20px;
  word-break: break-word;
}
.callout-info { background: #d6ebff; border-color: #1976d2; }
.callout-tip { background: #d7f0d9; border-color: #388e3c; }
.callout-warning { background: #fff0c2; border-color: #f57c00; }
.callout-danger { background: #fdd9d6; border-color: #d32f2f; }
.callout-info .callout-editor, .callout-info .callout-icon { color: #0d47a1; }
.callout-tip .callout-editor, .callout-tip .callout-icon { color: #1b5e20; }
.callout-warning .callout-editor, .callout-warning .callout-icon { color: #bf360c; }
.callout-danger .callout-editor, .callout-danger .callout-icon { color: #b71c1c; }

/* 数值表格块 */
.table-block {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.table-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
}
.table-count {
  flex: 1;
  font-size: 12px;
  color: var(--text-secondary);
}
.data-table {
  border-collapse: collapse;
  font-size: 13px;
  width: 100%;
}
.data-table th, .data-table td {
  border: 1px solid var(--border-color);
  padding: 4px 8px;
  text-align: center;
}
.data-table th {
  background: var(--bg-tertiary);
  font-weight: 600;
}
.data-table th:focus,
.data-table td:focus {
  outline: 2px solid var(--primary-color);
  outline-offset: -2px;
  background: var(--primary-soft);
}
.table-actions {
  display: flex;
  gap: 4px;
}
.change-media-btn.danger {
  color: #e53935;
}
.data-table td.cell-max {
  color: #e53935;
  font-weight: 700;
}
.data-table td.cell-min {
  color: #43a047;
  font-weight: 700;
}
.data-table td.table-sum {
  background: var(--primary-soft);
  font-weight: 700;
  color: var(--primary-color);
}
.table-raw-input {
  width: 100%;
  font-family: monospace;
  font-size: 12px;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  min-height: 60px;
}

/* 代码块 */
.formula-block {
  position: relative;
  padding: 14px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  text-align: center;
  overflow-x: auto;
}
.formula-render {
  font-size: 18px;
  min-height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.formula-render:empty { min-height: 24px; }
.formula-placeholder {
  font-size: 13px;
  color: var(--text-tertiary, var(--text-secondary));
}
.formula-input {
  margin-top: 8px;
  width: 100%;
  font-family: monospace;
  font-size: 13px;
  padding: 6px 8px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-sm);
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  resize: vertical;
  min-height: 32px;
}
.formula-edit-hint {
  margin-top: 6px;
  font-size: 11px;
  color: var(--text-tertiary, var(--text-secondary));
  cursor: pointer;
}

/* 代码块 */
.code-block {
  position: relative;
  background: #1e1e2e;
  border-radius: var(--radius-md);
  overflow: hidden;
}
.code-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 4px 8px;
  background: #181825;
}
.code-lang-select {
  font-size: 11px;
  padding: 2px 6px;
  border: 1px solid #313244;
  background: #1e1e2e;
  color: #cdd6f4;
  border-radius: 4px;
  outline: none;
  cursor: pointer;
}
.code-copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #6c7086;
  border-radius: 4px;
  cursor: pointer;
}
.code-copy-btn:hover { color: #cdd6f4; background: #313244; }
.code-pre {
  margin: 0;
  padding: 10px 12px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  color: #cdd6f4;
  overflow-x: auto;
  white-space: pre-wrap;
  word-break: break-word;
  min-height: 30px;
}
.code-pre-interactive {
  cursor: text;
}
.code-pre-interactive:empty::before {
  content: '点击输入代码...';
  color: #585b70;
}
.code-textarea {
  margin: 0;
  padding: 10px 12px;
  font-family: 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
  font-size: 13px;
  line-height: 1.5;
  background: #181825;
  color: #cdd6f4;
  caret-color: #f5e0dc;
  border: none;
  outline: none;
  resize: vertical;
  min-height: 40px;
  width: 100%;
  display: block;
  white-space: pre-wrap;
  word-break: break-word;
  box-sizing: border-box;
}
/* hljs 主题色 (Catppuccin Mocha 简化版) */
.code-pre .hljs-keyword { color: #cba6f7; }
.code-pre .hljs-string { color: #a6e3a1; }
.code-pre .hljs-number { color: #fab387; }
.code-pre .hljs-comment { color: #6c7086; font-style: italic; }
.code-pre .hljs-function { color: #89b4fa; }
.code-pre .hljs-title { color: #89b4fa; }
.code-pre .hljs-built_in { color: #f9e2af; }
.code-pre .hljs-attr { color: #89dceb; }
.code-pre .hljs-tag { color: #f38ba8; }
.code-pre .hljs-name { color: #f38ba8; }
.code-pre .hljs-attribute { color: #89dceb; }
.code-pre .hljs-variable { color: #f5e0dc; }
.code-pre .hljs-type { color: #f9e2af; }
.code-pre .hljs-meta { color: #6c7086; }
.code-pre .hljs-literal { color: #fab387; }
.media-header {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text-secondary);
  padding: 0 4px;
}
.media-name {
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-weight: 500;
}
.change-media-btn {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--bg-tertiary);
  color: var(--text-secondary);
  border-radius: 999px;
  border: 1px solid var(--border-light);
  cursor: pointer;
  flex-shrink: 0;
}
.change-media-btn:hover {
  background: var(--primary-soft);
  color: var(--primary-color);
  border-color: var(--primary-color);
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

/* ===== Todo 块 ===== */
.todo-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 4px 2px;
}
.todo-block.is-done {
  opacity: 0.62;
}
.todo-block.is-done .todo-title-input {
  text-decoration: line-through;
}
.todo-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.todo-status-btn {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s;
}
.todo-status-btn.status-todo { color: #b0b6bf; }
.todo-status-btn.status-doing { color: #4a90d9; background: rgba(74,144,217,0.12); }
.todo-status-btn.status-done { color: #fff; background: #6bbd8f; }
.todo-status-btn.status-paused { color: #e8a44a; background: rgba(232,164,74,0.14); }
.todo-status-btn:hover { filter: brightness(1.08); }
.todo-title-input {
  flex: 1;
  min-width: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #222);
  padding: 2px 0;
}
.todo-title-input::placeholder { color: var(--text-tertiary, #bbb); font-weight: 500; }
.todo-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 32px;
}
.todo-priority-pill {
  border: none;
  border-radius: 10px;
  padding: 2px 9px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  line-height: 1.6;
}
.todo-priority-pill.priority-low { background: rgba(150,160,170,0.18); color: #7a8ca6; }
.todo-priority-pill.priority-normal { background: rgba(74,144,217,0.16); color: #4a90d9; }
.todo-priority-pill.priority-high { background: rgba(217,107,110,0.18); color: #d96b6e; }
.todo-due-wrap {
  display: flex;
  align-items: center;
}
.todo-notes-input {
  width: 100%;
  margin-left: 32px;
  width: calc(100% - 32px);
  border: none;
  outline: none;
  background: transparent;
  resize: vertical;
  font-size: 13px;
  color: var(--text-secondary, #555);
  font-family: inherit;
  line-height: 1.5;
  min-height: 0;
}
.todo-notes-input::placeholder { color: var(--text-tertiary, #bbb); }

/* ===== 进度条块 ===== */
.progress-block {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 6px 2px;
}
.progress-header {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-icon {
  flex-shrink: 0;
  color: var(--primary-color);
}
.progress-label-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  padding: 2px 0;
}
.progress-label-input::placeholder { color: var(--text-tertiary, #bbb); font-weight: 400; }
.progress-value-display {
  flex-shrink: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--primary-color);
  font-variant-numeric: tabular-nums;
  min-width: 48px;
  text-align: right;
}
.progress-value-display.is-done { color: #4a8a64; }
.progress-track-wrap {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-track {
  flex: 1;
  height: 10px;
  background: var(--bg-tertiary, #e8e8e8);
  border-radius: 5px;
  position: relative;
  cursor: pointer;
  overflow: visible;
}
.progress-track.is-dragging { cursor: grabbing; }
.progress-track.is-auto { cursor: default; }
.progress-track.is-dragging .progress-thumb {
  transform: translate(-50%, -50%) scale(1.25);
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--primary-color), var(--primary-dark, #3a8fc4));
  border-radius: 5px;
  transition: width 0.2s ease;
  position: relative;
}
.progress-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent);
  border-radius: 5px;
}
.progress-thumb {
  position: absolute;
  top: 50%;
  width: 16px;
  height: 16px;
  background: var(--bg-secondary, #fff);
  border: 2.5px solid var(--primary-color);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  box-shadow: 0 1px 4px rgba(0,0,0,0.2);
  transition: left 0.2s ease;
  pointer-events: none;
}
.progress-controls {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}
.progress-step-btn {
  width: 26px;
  height: 26px;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 6px;
  background: var(--bg-secondary, #fff);
  color: var(--text-secondary);
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}
.progress-step-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
  background: var(--primary-soft, rgba(74,144,217,0.08));
}
.progress-mode-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.progress-mode-toggle {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 12px;
  background: var(--bg-secondary, #fff);
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.progress-mode-toggle.active {
  background: var(--primary-soft, rgba(74,144,217,0.12));
  border-color: var(--primary-color);
  color: var(--primary-color);
}
.progress-auto-hint {
  font-size: 11px;
  color: var(--text-tertiary);
}
.progress-link-toggle {
  display: flex;
  align-items: center;
  gap: 2px;
  margin-left: auto;
  padding: 3px 8px;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 12px;
  background: var(--bg-secondary, #fff);
  color: var(--text-tertiary);
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s;
}
.progress-link-toggle:hover { color: var(--primary-color); border-color: var(--primary-color); }
.progress-link-toggle.active { background: var(--primary-soft, rgba(74,144,217,0.12)); color: var(--primary-color); border-color: var(--primary-color); }
.progress-link-list {
  margin-top: 4px;
  padding: 8px;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 8px;
  background: var(--bg-tertiary, #f9f9f9);
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 180px;
  overflow-y: auto;
}
.progress-link-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  color: var(--text-tertiary);
  padding-bottom: 4px;
  border-bottom: 1px solid var(--border-light, #eee);
  margin-bottom: 2px;
}
.progress-link-clear {
  border: none;
  background: transparent;
  color: var(--primary-color);
  font-size: 11px;
  cursor: pointer;
  padding: 0;
}
.progress-link-clear:hover { text-decoration: underline; }
.progress-link-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 6px;
  border-radius: 5px;
  cursor: pointer;
  transition: background 0.12s;
}
.progress-link-item:hover { background: var(--bg-secondary, #fff); }
.progress-link-check {
  width: 15px;
  height: 15px;
  border: 1.5px solid var(--border-color, #ccc);
  border-radius: 3px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: transparent;
  transition: all 0.12s;
}
.progress-link-item.checked .progress-link-check {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: #fff;
}
.progress-link-status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  background: var(--text-quaternary, #ccc);
}
.progress-link-status.status-todo { background: #9ca3af; }
.progress-link-status.status-doing { background: var(--primary-color); }
.progress-link-status.status-done { background: #4a8a64; }
.progress-link-status.status-paused { background: #d4a657; }
.progress-link-title {
  font-size: 12px;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.progress-link-empty {
  margin-top: 4px;
  padding: 10px;
  font-size: 11px;
  color: var(--text-tertiary);
  text-align: center;
  background: var(--bg-tertiary, #f9f9f9);
  border-radius: 6px;
}

/* ===== 里程碑块 ===== */
.milestone-block {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 6px 2px;
}
.milestone-block.is-done { opacity: 0.65; }
.milestone-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
.milestone-icon-btn {
  flex-shrink: 0;
  width: 30px;
  height: 30px;
  border: none;
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.15s, transform 0.15s;
}
.milestone-icon-btn:hover { transform: scale(1.15); }
.milestone-icon-btn.done { color: #4a8a64; }
.milestone-title-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  font-weight: 700;
  color: var(--text-primary);
  padding: 2px 0;
}
.milestone-block.is-done .milestone-title-input { text-decoration: line-through; }
.milestone-title-input::placeholder { color: var(--text-tertiary, #bbb); font-weight: 600; }
.milestone-meta-row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-left: 38px;
}
.milestone-date-wrap {
  display: flex;
  align-items: center;
}
.milestone-relative {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
}
.milestone-relative.overdue { color: #d96b6e; }
.milestone-desc-input {
  width: 100%;
  border: 1px solid var(--border-light, #e0e0e0);
  border-radius: 6px;
  padding: 6px 8px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-tertiary, #f9f9f9);
  resize: vertical;
  outline: none;
  font-family: inherit;
  line-height: 1.5;
  min-height: 0;
}
.milestone-desc-input:focus { border-color: var(--primary-color); }
.milestone-desc-input::placeholder { color: var(--text-tertiary, #bbb); }

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

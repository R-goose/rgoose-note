<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { DECK_CARD_H, DECK_CARD_W, DECK_PEEK, FAN_STEP_Y } from '@/composables/useFolderDecks'

const props = defineProps({
  /** 顶层要展示的文件夹（只放根级，子级靠 hover 逐层展开） */
  folders: { type: Array, default: () => [] },
  getChildren: { type: Function, required: true },
  getItems: { type: Function, required: true },
  countText: { type: Function, required: true },
  emptyText: { type: String, default: '这里还没有内容' },
  selectionMode: { type: Boolean, default: false },
  selectedFolderIds: { type: Array, default: () => [] },
  selectedItemIds: { type: Array, default: () => [] }
})

const emit = defineEmits(['open-folder', 'open-item', 'folder-context', 'toggle-folder', 'toggle-item'])

// 飞出面板与卡牌的间距、视口留白、关闭延迟（ms）
const DECK_GAP = 4
const VIEWPORT_MARGIN = 12
const MIN_PANEL_H = 200
const COLUMN_WIDTH = 280
const CLOSE_DELAY = 300
const STACK_PEEK_Y = 10

// 展开路径：[根级卡牌, 逐级 hover 的子文件夹]；每一级对应一列面板
const chain = ref([])
// 每一列都绑定触发它的 hover 项：顶层卡牌对应第 0 列，子文件夹行对应下一列。
// 这样层级窗口始终从当前项的右侧展开，不会固定贴在面板顶部。
const anchors = ref([])
const overlayRef = ref(null)
let activeSlotEl = null
let closeTimer = null

/** 第一层保留卡牌堆；hover 时仅沿 Y 轴依次展开。 */
function deckStackStyle(count) {
  const visibleLayers = Math.min(count, DECK_PEEK)
  return {
    '--deck-w': `${DECK_CARD_W}px`,
    '--deck-h': `${DECK_CARD_H}px`,
    '--peek-y': `${STACK_PEEK_Y}px`,
    '--fan-y': `${FAN_STEP_Y}px`,
    '--stack-h': `${DECK_CARD_H + Math.max(0, visibleLayers - 1) * STACK_PEEK_Y}px`,
    '--expanded-h': `${DECK_CARD_H + Math.max(0, count - 1) * FAN_STEP_Y}px`
  }
}

function deckCardStyle(index) {
  return {
    '--stack-layer': Math.min(index, DECK_PEEK - 1),
    '--stack-index': index,
    '--z': String(1000 - index)
  }
}

const columns = computed(() =>
  chain.value.map((folder, depth) => ({
    depth,
    folder,
    folders: props.getChildren(folder.id) || [],
    items: props.getItems(folder.id) || []
  }))
)

function childrenOf(folder) {
  return props.getChildren(folder.id) || []
}

function columnItems(col) {
  // 中间层只负责导航，避免“文件夹 + 笔记”混在同一列造成阅读与指针目标混乱。
  return col.folders.length ? [] : col.items
}

/**
 * 算单列飞出面板的位置：以触发它的卡牌/文件夹行为锚点，优先放在右侧并垂直对齐。
 * 靠近右侧边缘时才回退到左侧，靠近底部时仅向上收紧，保持与 hover 项的关联。
 */
function measureAnchor(el) {
  if (!el) return null
  const rect = el.getBoundingClientRect()
  const viewportW = window.innerWidth
  const viewportH = window.innerHeight
  const rightLeft = rect.right + DECK_GAP
  const leftFallback = rect.left - DECK_GAP - COLUMN_WIDTH
  const left = rightLeft + COLUMN_WIDTH <= viewportW - VIEWPORT_MARGIN
    ? rightLeft
    : Math.max(VIEWPORT_MARGIN, leftFallback)
  const maxTop = Math.max(VIEWPORT_MARGIN, viewportH - VIEWPORT_MARGIN - MIN_PANEL_H)
  const top = Math.max(VIEWPORT_MARGIN, Math.min(rect.top, maxTop))
  const availableH = Math.max(MIN_PANEL_H, viewportH - top - VIEWPORT_MARGIN)
  return {
    left: Math.round(left),
    top: Math.round(top),
    maxH: Math.round(Math.min(availableH, viewportH * 0.72))
  }
}

function columnStyle(depth) {
  const a = anchors.value[depth]
  if (!a) return { visibility: 'hidden' }
  return {
    left: `${a.left}px`,
    top: `${a.top}px`,
    '--cascade-max-h': `${a.maxH}px`
  }
}

function openFor(folder, event) {
  cancelClose()
  activeSlotEl = event.currentTarget
  chain.value = [folder]
  const a = measureAnchor(activeSlotEl)
  anchors.value = a ? [a] : []
}

/** 卡牌向下展开后，卡牌坐标会变化；转场结束时把首层菜单校正到当前卡片右侧。 */
function remeasure() {
  if (!chain.value.length) return
  const a = measureAnchor(activeSlotEl)
  if (a) anchors.value = [a, ...anchors.value.slice(1)]
}

/** 在某一列里 hover 子文件夹：截断该列之后的路径，再追加这一级 */
function hoverFolder(folder, depth, event) {
  cancelClose()
  const next = chain.value.slice(0, depth + 1)
  if (next[next.length - 1]?.id !== folder.id) next.push(folder)
  chain.value = next
  const a = measureAnchor(event.currentTarget)
  anchors.value = a ? [...anchors.value.slice(0, depth + 1), a] : anchors.value.slice(0, depth + 1)
}

/** 鼠标回到更浅的一列时，收掉它右边多余的列 */
function trimTo(depth) {
  if (chain.value.length > depth + 1) {
    chain.value = chain.value.slice(0, depth + 1)
    anchors.value = anchors.value.slice(0, depth + 1)
  }
}

function cancelClose() {
  if (closeTimer) {
    clearTimeout(closeTimer)
    closeTimer = null
  }
}

function close() {
  cancelClose()
  chain.value = []
  anchors.value = []
  activeSlotEl = null
}

/** 卡牌与面板之间留出穿过间隙的时间，靠延迟关闭兜住 */
function scheduleClose() {
  cancelClose()
  closeTimer = setTimeout(close, CLOSE_DELAY)
}

function openFolder(folder) {
  if (props.selectionMode) {
    emit('toggle-folder', folder)
    return
  }
  emit('open-folder', folder)
  close()
}

function openItem(item) {
  if (props.selectionMode) {
    emit('toggle-item', item)
    return
  }
  emit('open-item', item)
  close()
}

function isFolderSelected(folderId) {
  return props.selectedFolderIds.includes(folderId)
}

function isItemSelected(itemId) {
  return props.selectedItemIds.includes(itemId)
}

function onScroll(event) {
  // 面板自身列表滚动不该关掉面板
  if (overlayRef.value && event.target instanceof Node && overlayRef.value.contains(event.target)) return
  if (chain.value.length) close()
}

function onKeydown(event) {
  if (event.key === 'Escape') close()
}

watch(() => props.folders, close)

onMounted(() => {
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('keydown', onKeydown)
  cancelClose()
})
</script>

<template>
  <div class="folder-deck-row">
    <section class="folder-deck" :class="{ 'is-expanded': chain.length > 0 }" @mouseleave="scheduleClose">
      <!-- 顶层目录维持卡牌堆，hover 后只向下展开。 -->
      <div class="folder-deck-stack" :style="deckStackStyle(folders.length)" @transitionend="remeasure">
        <div
          v-for="(folder, index) in folders"
          :key="folder.id"
          class="cascade-slot deck-slot"
            :class="{ 'is-open': chain[0] && chain[0].id === folder.id, 'is-selected': isFolderSelected(folder.id) }"
          :style="deckCardStyle(index)"
          @mouseenter="openFor(folder, $event)"
          @focusin="openFor(folder, $event)"
        >
          <button
            type="button"
            class="cascade-card folder-card"
            :style="{ '--folder-color': folder.color || '#64748b' }"
            @click="openFolder(folder)"
            @contextmenu.prevent="emit('folder-context', $event, folder)"
          >
            <svg class="folder-card-wave" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
              <path d="M0,40 C40,20 80,55 120,35 C160,15 180,45 200,30 L200,60 L0,60 Z" fill="currentColor"/>
            </svg>
            <div class="folder-card-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="folder-card-content">
              <h3 class="folder-card-name" :title="folder.name">{{ folder.name }}</h3>
              <p class="folder-card-meta">{{ countText(folder) }}</p>
            </div>
          </button>
        </div>
      </div>
    </section>
  </div>

  <!-- 挂到 body：飞出面板不受内容区滚动容器裁剪，也不会被页面层级压住 -->
  <Teleport to="body">
    <div
      v-if="chain.length"
      ref="overlayRef"
      class="cascade-overlay"
    >
      <section
        v-for="col in columns"
        :key="col.folder.id"
        class="cascade-column"
        :style="columnStyle(col.depth)"
        @mouseenter="cancelClose(); trimTo(col.depth)"
        @mouseleave="scheduleClose"
      >
        <span class="cascade-column-bg" aria-hidden="true"></span>

        <header class="cascade-column-head">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <span class="cascade-column-title" :title="col.folder.name">{{ col.folder.name }}</span>
          <span class="cascade-column-count">{{ countText(col.folder) }}</span>
        </header>

        <div class="cascade-column-body">
          <div
            v-for="child in col.folders"
            :key="child.id"
            class="cascade-row"
            :class="{ active: chain[col.depth + 1]?.id === child.id, selected: isFolderSelected(child.id) }"
            :style="{ '--folder-color': child.color || '#64748b' }"
            @mouseenter="hoverFolder(child, col.depth, $event)"
            @focus="hoverFolder(child, col.depth, $event)"
            role="button"
            tabindex="0"
            @click="openFolder(child)"
            @keydown.enter.prevent="openFolder(child)"
            @keydown.space.prevent="openFolder(child)"
            @contextmenu.prevent="emit('folder-context', $event, child)"
          >
            <div class="folder-card-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div class="folder-card-content">
              <h4 class="folder-card-name" :title="child.name">{{ child.name }}</h4>
              <p class="folder-card-meta">{{ countText(child) }}</p>
            </div>
            <svg
              v-if="childrenOf(child).length"
              class="cascade-row-chevron"
              width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>

          <div v-if="columnItems(col).length" class="cascade-item-list">
            <button
              v-for="item in columnItems(col)"
              :key="item.id"
              class="cascade-item"
              :class="{ selected: isItemSelected(item.id) }"
              @click="openItem(item)"
            >
              <span class="cascade-item-title">{{ item.title }}</span>
              <span v-if="item.meta" class="cascade-item-meta">{{ item.meta }}</span>
            </button>
          </div>

          <p v-if="!col.folders.length && !columnItems(col).length" class="cascade-empty">{{ emptyText }}</p>
          <button v-if="col.folders.length" type="button" class="cascade-open-folder" @click="openFolder(col.folder)">
            打开“{{ col.folder.name }}”
          </button>
        </div>
      </section>
    </div>
  </Teleport>
</template>

<style scoped>
/* ============ 顶层卡牌堆 ============ */
.folder-deck-row {
  display: flex;
  align-items: flex-start;
}

.folder-deck {
  position: relative;
  z-index: 1;
}

/* 卡牌堆的占位高度只在 hover 时向下增长，避免空白区域常驻页面。 */
.folder-deck-stack {
  position: relative;
  width: var(--deck-w);
  height: var(--stack-h);
  transition: height var(--transition-normal);
}

.folder-deck:hover .folder-deck-stack,
.folder-deck.is-expanded .folder-deck-stack {
  height: var(--expanded-h);
}

/* ============ 卡牌槽位 ============ */
.cascade-slot {
  position: relative;
}

.deck-slot {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--deck-w);
  min-width: 0;
  height: var(--deck-h);
  z-index: var(--z);
  transform: translateY(calc(var(--stack-layer) * var(--peek-y)));
  transition: transform var(--transition-normal);
}

/* 展开方向只有向下；不会再出现横向扇开导致菜单与触发项错位。 */
.folder-deck:hover .deck-slot,
.folder-deck.is-expanded .deck-slot {
  transform: translateY(calc(var(--stack-index) * var(--fan-y)));
}

/* 折叠状态只让最上层可交互，进入堆后再露出其余卡牌。 */
.folder-deck:not(:hover):not(.is-expanded) .deck-slot:not(:first-child) {
  pointer-events: none;
}

.cascade-slot.is-open {
  z-index: 2000;
}

/* ============ 卡片本体 ============ */
.cascade-card {
  box-sizing: border-box;
  cursor: pointer;
}

.folder-card {
  box-sizing: border-box;
  position: relative;
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  height: 100%;
  padding: 12px 14px;
  overflow: hidden;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 14px;
  text-align: left;
  font: inherit;
  transition: border-color var(--transition-fast), box-shadow var(--transition-normal);
}

/* 悬停到具体某张卡牌时再抬高一档，突出当前目标 */
.folder-card:hover,
.cascade-slot.is-open .folder-card,
.folder-card:focus-visible {
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
  box-shadow: 0 8px 20px -10px color-mix(in srgb, var(--primary-color) 40%, rgba(0, 0, 0, 0.12));
  outline: none;
}

.cascade-slot.is-selected .folder-card {
  border-color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-soft) 64%, var(--bg-secondary));
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 26%, transparent);
}

.folder-card-wave {
  position: absolute;
  right: -8px;
  bottom: -6px;
  width: 118px;
  height: 42px;
  color: var(--folder-color, var(--primary-color));
  opacity: 0.1;
  transition: opacity var(--transition-normal), transform var(--transition-normal);
  pointer-events: none;
}

.folder-card:hover .folder-card-wave {
  opacity: 0.16;
  transform: translate(-4px, -4px) scale(1.08);
}

.folder-card-icon {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--folder-color, var(--primary-color)) 16%, var(--bg-secondary));
  color: var(--folder-color, var(--primary-color));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--folder-color, var(--primary-color)) 26%, transparent);
  transition: all var(--transition-normal);
}

.folder-card:hover .folder-card-icon {
  background: linear-gradient(135deg, var(--folder-color, var(--primary-color)), color-mix(in srgb, var(--folder-color, var(--primary-color)) 68%, #000));
  color: #fff;
  box-shadow: 0 4px 10px -2px color-mix(in srgb, var(--folder-color, var(--primary-color)) 50%, transparent);
}

.folder-card-content {
  flex: 1;
  min-width: 0;
}

.folder-card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-card-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 折叠时压在下面的卡牌数量 */
/* ============ 飞出面板（挂载在 body 上） ============ */
.cascade-overlay {
  position: fixed;
  inset: 0;
  z-index: 950;
  pointer-events: none;
  animation: cascade-overlay-in var(--transition-fast) ease-out;
}

@keyframes cascade-overlay-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

.cascade-column {
  position: absolute;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  width: 280px;
  flex-shrink: 0;
  padding: 6px;
  max-height: var(--cascade-max-h, 60vh);
  border-radius: 14px;
  border: 1px solid var(--border-color);
  box-shadow: 0 22px 48px -22px rgba(0, 0, 0, 0.42), 0 2px 6px -2px rgba(0, 0, 0, 0.12);
  animation: cascade-column-in var(--transition-normal) ease-out;
  pointer-events: auto;
}

@keyframes cascade-column-in {
  from { opacity: 0; transform: translateX(-6px); }
  to { opacity: 1; transform: none; }
}

/* 模糊放在独立背景层：面板本体不带 backdrop-filter，避免成为后代的包含块 */
.cascade-column-bg {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: color-mix(in srgb, var(--bg-secondary) 82%, transparent);
  backdrop-filter: blur(18px) saturate(150%);
  -webkit-backdrop-filter: blur(18px) saturate(150%);
}

.cascade-column-head {
  position: relative;
  display: flex;
  align-items: center;
  gap: 7px;
  flex-shrink: 0;
  padding: 5px 8px 8px;
  margin-bottom: 4px;
  border-bottom: 1px solid color-mix(in srgb, var(--border-color) 70%, transparent);
  color: var(--primary-color);
}

.cascade-column-title {
  flex: 1;
  min-width: 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cascade-column-count {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-tertiary);
}

.cascade-column-body {
  position: relative;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
}

/* ============ 面板里的文件夹行 ============ */
.cascade-row {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 7px 9px;
  border: 1px solid transparent;
  border-radius: 10px;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.cascade-row:hover {
  background: var(--bg-hover);
  border-color: var(--border-light);
}

.cascade-row.active,
.cascade-row:focus-visible {
  background: var(--primary-softer);
  border-color: color-mix(in srgb, var(--primary-color) 30%, var(--border-color));
  outline: none;
}

.cascade-row.selected,
.cascade-item.selected {
  background: var(--primary-softer);
  border-color: color-mix(in srgb, var(--primary-color) 38%, var(--border-color));
}

.cascade-row:hover .folder-card-icon {
  background: linear-gradient(135deg, var(--folder-color, var(--primary-color)), color-mix(in srgb, var(--folder-color, var(--primary-color)) 68%, #000));
  color: #fff;
}

.cascade-row .folder-card-icon {
  width: 26px;
  height: 26px;
}

.cascade-row .folder-card-name {
  font-size: 13px;
}

.cascade-row .folder-card-meta {
  font-size: 11px;
}

.cascade-row-chevron {
  flex-shrink: 0;
  margin-left: auto;
  color: var(--text-tertiary);
}

/* ============ 叶子文件夹里的内容条目 ============ */
.cascade-item-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.cascade-item {
  box-sizing: border-box;
  display: flex;
  align-items: baseline;
  gap: 8px;
  width: 100%;
  padding: 7px 9px;
  background: transparent;
  border: 1px solid transparent;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast);
}

.cascade-item:hover {
  background: var(--bg-hover);
}

.cascade-item-title {
  flex: 1;
  min-width: 0;
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cascade-item-meta {
  flex-shrink: 0;
  font-size: 11px;
  color: var(--text-tertiary);
}

.cascade-empty {
  padding: 6px 9px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.cascade-open-folder {
  position: relative;
  width: calc(100% - 8px);
  margin: 5px 4px 2px;
  padding: 7px 9px;
  border: 1px solid var(--border-light);
  border-radius: 9px;
  background: color-mix(in srgb, var(--primary-soft) 58%, var(--bg-secondary));
  color: var(--primary-dark);
  font: inherit;
  font-size: 12px;
  font-weight: 600;
  text-align: left;
  cursor: pointer;
  transition: background var(--transition-fast), border-color var(--transition-fast);
}

.cascade-open-folder:hover,
.cascade-open-folder:focus-visible {
  border-color: color-mix(in srgb, var(--primary-color) 36%, var(--border-color));
  background: var(--primary-soft);
  outline: none;
}
</style>

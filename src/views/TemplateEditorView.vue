<template>
  <div class="tpl-editor-view">
    <header class="tpl-header">
      <div class="tpl-header-left">
        <button class="btn btn-ghost btn-icon" @click="goBack" title="返回模板列表">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div class="tpl-title-fields">
          <input
            v-model="name"
            class="tpl-name-input"
            type="text"
            :placeholder="`模板名称（${isNew ? '新模板' : '编辑' }）`"
          />
          <input
            v-model="desc"
            class="tpl-desc-input"
            type="text"
            placeholder="模板描述（可选）"
          />
        </div>
      </div>
      <div class="tpl-header-right">
        <button class="btn btn-ghost" @click="goBack">取消</button>
        <button class="btn btn-primary" :disabled="saving" @click="save">
          <svg v-if="saving" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" class="spin"><path d="M21 12a9 9 0 1 1-9-9"/></svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
          保存
        </button>
      </div>
    </header>

    <div class="tpl-toolbar">
      <button class="tb-btn" @click="addBlock('text')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        文本块
      </button>
      <button class="tb-btn" @click="addBlock('table')">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="1"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/><line x1="15" y1="3" x2="15" y2="21"/></svg>
        表格块
      </button>
      <span class="tb-hint">{{ draftBlocks.length }} 个元素 · 点击画布空白处取消选中 · 拖动块移动位置</span>
    </div>

    <div
      ref="canvasRef"
      class="tpl-canvas"
      @click.self="selectedId = null"
    >
      <div class="canvas-inner" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px' }">
        <NoteBlock
          v-for="b in draftBlocks"
          :key="b.id"
          :block="b"
          :all-blocks="draftBlocks"
          :selected="selectedId === b.id"
          :read-only="false"
          @select="selectedId = $event"
          @update="onUpdate"
          @delete="onDelete"
          @resize-block="onResizeBlock"
          @resize="onResize"
          @drag-start="onDragStart"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useToast } from '@/composables/useToast'
import { generateId } from '@/utils'
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
const selectedId = ref(null)
const saving = ref(false)

const canvasRef = ref(null)
const PAD = 80

// 画布内容区尺寸：随内容自适应，至少覆盖可视滚动区
const canvasWidth = computed(() => 1400)
const canvasHeight = computed(() => {
  let maxY = 60
  draftBlocks.value.forEach(b => {
    const bottom = (b.y ?? 0) + (b.height || b.minHeight || 120)
    if (bottom > maxY) maxY = bottom
  })
  return maxY + 200
})

function onUpdate(id, updates) {
  const b = draftBlocks.value.find(x => x.id === id)
  if (b) Object.assign(b, updates)
}

function onDelete(id) {
  const idx = draftBlocks.value.findIndex(x => x.id === id)
  if (idx >= 0) {
    draftBlocks.value.splice(idx, 1)
    if (selectedId.value === id) selectedId.value = null
  }
}

function onResize({ id, width, height }) {
  const b = draftBlocks.value.find(x => x.id === id)
  if (b) {
    b.width = width
    b.height = height
    b.minHeight = height
  }
}

function onResizeBlock({ id, width, height, x, y }) {
  const b = draftBlocks.value.find(bb => bb.id === id)
  if (b) {
    b.width = width
    b.height = height
    b.minHeight = height
    b.x = x
    b.y = y
  }
}

// 新增块：在画布空位摆放，避免重叠
function addBlock(type) {
  const n = draftBlocks.value.length
  const def = type === 'table'
    ? { type: 'table', tableData: 'a|b\n1|2' }
    : { type: 'text', content: type === 'code' ? '' : '<h3>标题</h3><p>在这里输入内容...</p>' }
  const col = n % 2
  const row = Math.floor(n / 2)
  const block = {
    id: generateId(),
    ...def,
    x: PAD + col * 340,
    y: 70 + row * 200,
    width: 300,
    minHeight: type === 'table' ? 140 : 120,
    color: 'default',
    borderStyle: 'solid'
  }
  draftBlocks.value.push(block)
  selectedId.value = block.id
}

// 拖动移动（NoteBlock 发出 drag-start 后由本组件负责位移）
let dragInfo = null
function onDragStart(id, clientX, clientY) {
  const b = draftBlocks.value.find(x => x.id === id)
  if (!b) return
  selectedId.value = id
  dragInfo = {
    id,
    startX: clientX,
    startY: clientY,
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
  b.x = Math.max(0, Math.round(blockX + (e.clientX - startX)))
  b.y = Math.max(0, Math.round(blockY + (e.clientY - startY)))
}

function onDragEnd() {
  dragInfo = null
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

async function save() {
  const title = name.value.trim()
  if (!title) {
    toastError('请输入模板名称')
    return
  }
  saving.value = true
  try {
    // 保存前消毒：仅保留纯结构块（剔除可能的媒体/引用）
    if (isNew.value) {
      await templateStore.create({ name: title, desc: desc.value.trim(), blocks: draftBlocks.value })
    } else {
      templateStore.update(tplId.value, { name: title, desc: desc.value.trim(), blocks: draftBlocks.value })
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

onMounted(async () => {
  try { await templateStore.init() } catch {}
  if (isNew.value) {
    name.value = ''
    desc.value = ''
    draftBlocks.value = []
    return
  }
  const tpl = templateStore.getTemplateById(tplId.value)
  if (tpl) {
    name.value = tpl.name
    desc.value = tpl.desc || ''
    draftBlocks.value = JSON.parse(JSON.stringify(tpl.blocks || []))
  } else {
    toastError('模板不存在')
    router.replace('/templates')
  }
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
.tpl-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}
.tpl-header-left { display: flex; align-items: center; gap: 12px; min-width: 0; }
.tpl-title-fields { display: flex; flex-direction: column; gap: 4px; }
.tpl-name-input, .tpl-desc-input {
  border: 1px solid var(--border-light);
  background: var(--bg-primary);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  outline: none;
  transition: border-color var(--transition-fast);
}
.tpl-name-input { font-size: 15px; font-weight: 700; padding: 6px 10px; width: 280px; }
.tpl-desc-input { font-size: 12px; padding: 4px 10px; width: 280px; color: var(--text-secondary); }
.tpl-name-input:focus, .tpl-desc-input:focus { border-color: var(--primary-color); }
.tpl-header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.tpl-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 20px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}
.tb-btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: var(--radius-sm);
  background: var(--bg-tertiary); color: var(--text-secondary);
  font-size: 12px; font-weight: 600; cursor: pointer;
  border: 1px solid var(--border-light);
  transition: all var(--transition-fast);
}
.tb-btn:hover { background: var(--primary-soft); color: var(--primary-dark); border-color: var(--primary-color); }
.tb-hint { margin-left: auto; font-size: 11px; color: var(--text-tertiary); }

.tpl-canvas {
  flex: 1;
  overflow: auto;
  position: relative;
  background-image:
    radial-gradient(circle, var(--grid-dot, #d8ded8) 1px, transparent 1px);
  background-size: 24px 24px;
  background-position: 0 0;
}
.canvas-inner { position: relative; }

.btn {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 8px 14px; border-radius: var(--radius-md);
  font-size: 13px; font-weight: 600; cursor: pointer;
  border: none; transition: all var(--transition-fast);
}
.btn-ghost { background: var(--bg-tertiary); color: var(--text-secondary); }
.btn-ghost:hover { background: var(--bg-hover); color: var(--text-primary); }
.btn-icon { padding: 8px; }
.btn-primary {
  background: var(--primary-color); color: #fff;
}
.btn-primary:hover { filter: brightness(1.05); }
.btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }
.spin { animation: spin 0.8s linear infinite; }
@keyframes spin { to { transform: rotate(360deg); } }
</style>
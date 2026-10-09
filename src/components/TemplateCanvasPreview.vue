<template>
  <div ref="viewportRef" class="template-canvas-preview" aria-label="模板画布预览">
    <div class="preview-grid" :style="previewBackgroundStyle"></div>
    <div class="preview-scene" :style="sceneStyle">
      <svg class="preview-connections" viewBox="0 0 10000 10000" preserveAspectRatio="none">
        <defs>
          <marker
            v-for="conn in connections"
            :id="markerId(conn)"
            :key="markerId(conn)"
            markerWidth="10"
            markerHeight="10"
            refX="8.5"
            refY="5"
            orient="auto-start-reverse"
            markerUnits="strokeWidth"
          >
            <path
              v-if="arrowType(conn) === 'open'"
              d="M 1 1 L 9 5 L 1 9"
              fill="none"
              :stroke="conn.color || '#6bbd8f'"
              stroke-width="1.5"
            />
            <circle
              v-else-if="arrowType(conn) === 'circle'"
              cx="5"
              cy="5"
              r="3.5"
              :fill="conn.color || '#6bbd8f'"
            />
            <rect
              v-else-if="arrowType(conn) === 'square'"
              x="2"
              y="2"
              width="6"
              height="6"
              :fill="conn.color || '#6bbd8f'"
            />
            <path
              v-else-if="arrowType(conn) === 'diamond'"
              d="M 1 5 L 5 1 L 9 5 L 5 9 Z"
              :fill="conn.color || '#6bbd8f'"
            />
            <path
              v-else
              d="M 1 1 L 9 5 L 1 9 Z"
              :fill="conn.color || '#6bbd8f'"
            />
          </marker>
        </defs>
        <g v-for="conn in visibleConnections" :key="conn.id">
          <path
            :d="connectionPath(conn)"
            :stroke="conn.color || '#6bbd8f'"
            :stroke-width="conn.width || 2"
            :stroke-dasharray="dashArray(conn)"
            :marker-start="startMarker(conn)"
            :marker-end="endMarker(conn)"
            fill="none"
          />
          <text
            v-if="conn.label"
            :x="connectionMidpoint(conn).x"
            :y="connectionMidpoint(conn).y - 7"
            class="preview-connection-label"
            text-anchor="middle"
          >{{ conn.label }}</text>
        </g>
      </svg>

      <div class="preview-blocks-layer">
        <NoteBlock
          v-for="block in blocks"
          :key="block.id"
          :block="block"
          :all-blocks="blocks"
          :selected="false"
          :read-only="true"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import NoteBlock from '@/components/NoteBlock.vue'
import { connectionEndpoints } from '@/utils/connectionPorts'

const props = defineProps({
  blocks: { type: Array, default: () => [] },
  connections: { type: Array, default: () => [] }
})

const viewportRef = ref(null)
const viewportSize = ref({ width: 720, height: 360 })
const markerPrefix = `tpl-preview-${Math.random().toString(36).slice(2)}`
const backgroundType = localStorage.getItem('rgoose_bg_type') || 'grid'
const backgroundImage = localStorage.getItem('rgoose_bg_image') || ''
const backgroundOpacity = parseInt(localStorage.getItem('rgoose_bg_opacity')) || 15
let resizeObserver = null

const previewBackgroundStyle = computed(() => {
  if (backgroundType === 'none') return { opacity: 0 }
  if (backgroundType === 'image' && backgroundImage) {
    return {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundRepeat: 'no-repeat',
      opacity: backgroundOpacity / 100
    }
  }
  if (backgroundType === 'dots') {
    return {
      backgroundImage: 'radial-gradient(var(--grid-line) 1.5px, transparent 1.5px)',
      backgroundSize: '24px 24px',
      opacity: 0.5
    }
  }
  return {
    backgroundImage: 'linear-gradient(to right, var(--grid-line) 1px, transparent 1px), linear-gradient(to bottom, var(--grid-line) 1px, transparent 1px)',
    backgroundSize: '24px 24px',
    opacity: 0.4
  }
})

function blockSize(block) {
  return {
    width: Number(block?.width) || 240,
    height: Number(block?.height) || Number(block?.minHeight) || 80
  }
}

const contentBounds = computed(() => {
  if (!props.blocks.length) return { left: 0, top: 0, width: 1, height: 1 }
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const block of props.blocks) {
    const { width, height } = blockSize(block)
    const x = Number(block?.x) || 0
    const y = Number(block?.y) || 0
    left = Math.min(left, x)
    top = Math.min(top, y)
    right = Math.max(right, x + width)
    bottom = Math.max(bottom, y + height)
  }
  return { left, top, width: Math.max(1, right - left), height: Math.max(1, bottom - top) }
})

const sceneStyle = computed(() => {
  const padding = 28
  const bounds = contentBounds.value
  const availableWidth = Math.max(1, viewportSize.value.width - padding * 2)
  const availableHeight = Math.max(1, viewportSize.value.height - padding * 2)
  const scale = Math.min(1, availableWidth / bounds.width, availableHeight / bounds.height)
  const x = (viewportSize.value.width - bounds.width * scale) / 2 - bounds.left * scale
  const y = (viewportSize.value.height - bounds.height * scale) / 2 - bounds.top * scale
  return {
    transform: `translate(${x}px, ${y}px) scale(${scale})`,
    transformOrigin: '0 0'
  }
})

const blockMap = computed(() => new Map(props.blocks.map(block => [block.id, block])))
const visibleConnections = computed(() => props.connections.filter(conn => blockMap.value.has(conn?.from) && blockMap.value.has(conn?.to)))

function connectionPoints(conn) {
  const fromBlock = blockMap.value.get(conn.from)
  const toBlock = blockMap.value.get(conn.to)
  if (!fromBlock || !toBlock) return null
  const fromSize = blockSize(fromBlock)
  const toSize = blockSize(toBlock)
  const fromCenter = { x: (Number(fromBlock.x) || 0) + fromSize.width / 2, y: (Number(fromBlock.y) || 0) + fromSize.height / 2 }
  const toCenter = { x: (Number(toBlock.x) || 0) + toSize.width / 2, y: (Number(toBlock.y) || 0) + toSize.height / 2 }
  const dx = toCenter.x - fromCenter.x
  const dy = toCenter.y - fromCenter.y
  return {
    ...connectionEndpoints(fromBlock, fromSize, toBlock, toSize, conn),
    dx,
    dy
  }
}

function connectionPath(conn) {
  const points = connectionPoints(conn)
  if (!points) return ''
  const { from, to, dx, dy } = points
  if ((conn.shape || conn.style) === 'bezier' || (conn.shape || conn.style) === 'curve') {
    const distance = Math.hypot(dx, dy) || 1
    const bow = Math.min(distance * 0.25, 120)
    const mx = (from.x + to.x) / 2 - dy / distance * bow
    const my = (from.y + to.y) / 2 + dx / distance * bow
    return `M ${from.x} ${from.y} Q ${mx} ${my}, ${to.x} ${to.y}`
  }
  return `M ${from.x} ${from.y} L ${to.x} ${to.y}`
}

function connectionMidpoint(conn) {
  const points = connectionPoints(conn)
  if (!points) return { x: 0, y: 0 }
  return { x: (points.from.x + points.to.x) / 2, y: (points.from.y + points.to.y) / 2 }
}

function dashArray(conn) {
  const dash = conn.dash || conn.lineDash || 'solid'
  return { dashed: '8,5', dotted: '2,4', 'dot-dash': '8,4,2,4' }[dash] || ''
}

function arrowType(conn) {
  return conn.arrow || 'standard'
}

function markerId(conn) {
  return `${markerPrefix}-${String(conn.id).replace(/[^a-zA-Z0-9_-]/g, '')}`
}

function startMarker(conn) {
  const dir = conn.dir || 'forward'
  return dir === 'backward' || dir === 'both' ? `url(#${markerId(conn)})` : ''
}

function endMarker(conn) {
  const dir = conn.dir || 'forward'
  return dir === 'forward' || dir === 'both' ? `url(#${markerId(conn)})` : ''
}

function measureViewport() {
  const rect = viewportRef.value?.getBoundingClientRect()
  if (rect?.width && rect?.height) viewportSize.value = { width: rect.width, height: rect.height }
}

watch(() => props.blocks, () => nextTick(measureViewport), { deep: true })

onMounted(() => {
  measureViewport()
  if (typeof ResizeObserver !== 'undefined') {
    resizeObserver = new ResizeObserver(measureViewport)
    resizeObserver.observe(viewportRef.value)
  }
})

onBeforeUnmount(() => resizeObserver?.disconnect())
</script>

<style scoped>
.template-canvas-preview {
  position: relative;
  width: 100%;
  height: 390px;
  overflow: hidden;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.35);
}

.preview-grid {
  position: absolute;
  inset: 0;
}

.preview-scene,
.preview-connections,
.preview-blocks-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 10000px;
  height: 10000px;
}

.preview-connections {
  overflow: visible;
  pointer-events: none;
}

.preview-blocks-layer {
  pointer-events: none;
}

.preview-blocks-layer :deep(.note-block) {
  pointer-events: none;
}

.preview-connection-label {
  font-size: 12px;
  fill: var(--text-primary);
  paint-order: stroke;
  stroke: var(--bg-primary);
  stroke-width: 5px;
  stroke-linejoin: round;
}

@media (max-height: 720px) {
  .template-canvas-preview { height: 300px; }
}
</style>

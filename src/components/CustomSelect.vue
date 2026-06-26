<template>
  <div class="custom-select" :class="{ open, up: placement === 'up' }" ref="root">
    <button
      type="button"
      class="cs-trigger"
      :style="triggerStyle"
      @click="toggle"
      @keydown.down.prevent="open ? moveSel(1) : (open = true)"
      @keydown.up.prevent="open ? moveSel(-1) : null"
      @keydown.enter.prevent="open ? pick(selIndex) : (open = true)"
      @keydown.esc="close"
    >
      <span class="cs-current">
        <slot name="label" :item="current">{{ current?.label }}</slot>
      </span>
      <svg class="cs-arrow" :class="{ flipped: open }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <Teleport to="body">
      <Transition name="cs">
        <ul
          v-if="open"
          ref="menu"
          class="cs-menu"
          :class="{ 'cs-menu-up': placement === 'up' }"
          :style="floatingStyle"
          @click.self="close"
        >
          <li
            v-for="(opt, i) in options"
            :key="opt.value"
            class="cs-option"
            :class="{ active: opt.value === modelValue, sel: i === selIndex }"
            @mouseenter="selIndex = i"
            @click="pick(i)"
          >
            <slot name="option" :item="opt">{{ opt.label }}</slot>
            <svg v-if="opt.value === modelValue" class="cs-check" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </li>
        </ul>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: [String, Number],
  options: { type: Array, default: () => [] },
  triggerStyle: { type: Object, default: () => ({}) },
  menuStyle: { type: Object, default: () => ({}) }
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const menu = ref(null)
const open = ref(false)
const selIndex = ref(0)
const placement = ref('down')
const floatingStyle = ref({})

const current = computed(() => props.options.find(o => o.value === props.modelValue) || props.options[0])

watch(() => props.modelValue, () => {
  const idx = props.options.findIndex(o => o.value === props.modelValue)
  if (idx > -1) selIndex.value = idx
}, { immediate: true })

function computePosition() {
  const el = root.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const menuH = menu.value?.offsetHeight || (props.options.length * 32 + 14)
  const gap = 6
  const spaceBelow = window.innerHeight - rect.bottom
  const spaceAbove = rect.top

  let place = 'down'
  if (spaceBelow < menuH + gap && spaceAbove > spaceBelow) {
    place = 'up'
  }

  placement.value = place

  const top = place === 'up' ? rect.top - menuH - gap : rect.bottom + gap

  floatingStyle.value = {
    position: 'fixed',
    left: rect.left + 'px',
    top: top + 'px',
    minWidth: rect.width + 'px'
  }
}

function toggle() {
  open.value = !open.value
  const idx = props.options.findIndex(o => o.value === props.modelValue)
  selIndex.value = idx > -1 ? idx : 0
  if (open.value) {
    nextTick(computePosition)
  }
}

function close() { open.value = false }

function pick(i) {
  emit('update:modelValue', props.options[i].value)
  close()
}

function moveSel(dir) {
  const len = props.options.length
  selIndex.value = (selIndex.value + dir + len) % len
}

function onDocClick(e) {
  if (!root.value?.contains(e.target) && !menu.value?.contains(e.target)) close()
}
function onKey(e) {
  if (!open.value) return
  if (e.key === 'Escape') close()
}
function onScroll() {
  if (open.value) computePosition()
}

onMounted(() => {
  document.addEventListener('click', onDocClick)
  document.addEventListener('keydown', onKey)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
})
onUnmounted(() => {
  document.removeEventListener('click', onDocClick)
  document.removeEventListener('keydown', onKey)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
})
</script>

<style scoped>
.custom-select {
  position: relative;
  display: inline-flex;
  flex-shrink: 0;
}

.cs-trigger {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 12px;
  font-weight: 500;
  border: 1px solid var(--border-color);
  cursor: pointer;
  transition: all var(--transition-fast);
  line-height: 1.4;
}

.cs-trigger:hover {
  background: var(--bg-hover);
  border-color: var(--text-quaternary, #b0b6b0);
}

.custom-select.open .cs-trigger {
  border-color: var(--primary-color);
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.cs-current {
  white-space: nowrap;
}

.cs-arrow {
  flex-shrink: 0;
  opacity: 0.6;
  transition: transform 0.2s ease;
}

/* 向下展开时箭头朝上翻转；向上展开时箭头朝下翻转 */
.cs-arrow.flipped {
  transform: rotate(180deg);
}

.custom-select.up .cs-arrow.flipped {
  transform: rotate(0deg);
}
</style>

<style>
/* 全局样式（因为菜单 teleport 到 body） */
.cs-menu {
  margin: 0;
  padding: 5px;
  list-style: none;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(8px);
  z-index: 9999;
}

.cs-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
  white-space: nowrap;
}

.cs-option.sel {
  background: var(--bg-hover);
}

.cs-option.active {
  color: var(--primary-dark);
  background: var(--primary-soft);
}

.cs-option.active.sel {
  background: var(--primary-soft);
}

.cs-check {
  flex-shrink: 0;
  color: var(--primary-color);
}

/* 下拉动画 */
.cs-enter-active,
.cs-leave-active {
  transition: all 0.16s ease;
}

.cs-enter-from,
.cs-leave-to {
  opacity: 0;
  transform: translateY(6px) scaleY(0.94);
}

.cs-menu-up.cs-enter-from,
.cs-menu-up.cs-leave-to {
  transform: translateY(-6px) scaleY(0.94);
}
</style>

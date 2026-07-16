<template>
  <div ref="root" class="dtp" :class="{ 'dtp-compact': compact, 'dtp-date-only': dateOnly }">
    <button type="button" class="dtp-trigger" :class="{ placeholder: !displayValue, compact, disabled }" :disabled="disabled" @click="toggle">
      <svg class="dtp-cal-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/>
        <line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/>
        <line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
      <span class="dtp-text">{{ displayValue || (compact ? '日期' : '选择时间') }}</span>
      <svg v-if="modelValue" class="dtp-clear" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" @click.stop="clear">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
      <svg v-else class="dtp-arrow" :class="{ flipped: open }" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    <Teleport to="body">
      <Transition name="dtp">
        <div v-if="open" class="dtp-panel" :style="panelStyle" @click.self="close">
          <div class="dtp-header">
            <button type="button" class="dtp-nav" @click="prevMonth">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
            <span class="dtp-title">{{ viewDate.format('YYYY年 MM月') }}</span>
            <button type="button" class="dtp-nav" @click="nextMonth">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>

          <div class="dtp-weekdays">
            <span v-for="w in weekdays" :key="w">{{ w }}</span>
          </div>

          <div class="dtp-days">
            <button
              v-for="day in days"
              :key="day.key"
              type="button"
              class="dtp-day"
              :class="{
                muted: !day.inMonth,
                selected: day.selected,
                today: day.isToday,
                disabled: day.disabled
              }"
              :disabled="day.disabled"
              @click="!day.disabled && pickDay(day.date)"
            >
              {{ day.num }}
            </button>
          </div>

          <div v-if="!dateOnly" class="dtp-time">
            <span class="dtp-time-label">时间</span>
            <div class="dtp-time-inputs">
              <div class="dtp-stepper">
                <button type="button" class="dtp-step" @click="stepHour(-1)">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span class="dtp-num">{{ hour }}</span>
                <button type="button" class="dtp-step" @click="stepHour(1)">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
              <span class="dtp-colon">:</span>
              <div class="dtp-stepper">
                <button type="button" class="dtp-step" @click="stepMinute(-5)">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
                </button>
                <span class="dtp-num">{{ minute }}</span>
                <button type="button" class="dtp-step" @click="stepMinute(5)">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          </div>

          <div class="dtp-footer">
            <button type="button" class="dtp-quick" @click="setQuick('today')">今天</button>
            <button type="button" class="dtp-quick" @click="setQuick('tomorrow')">明天</button>
            <button type="button" class="dtp-quick" @click="setQuick('nextWeek')">下周</button>
            <button type="button" class="dtp-confirm" @click="confirm">确定</button>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import dayjs from 'dayjs'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  dateOnly: { type: Boolean, default: false },
  compact: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false }
})
const emit = defineEmits(['update:modelValue'])

const root = ref(null)
const open = ref(false)
const panelStyle = ref({})
const hour = ref('09')
const minute = ref('00')
const viewDate = ref(dayjs())

const weekdays = ['日', '一', '二', '三', '四', '五', '六']

const selectedDate = computed(() => {
  if (!props.modelValue) return null
  if (props.dateOnly) {
    const d = dayjs(props.modelValue, 'YYYY-MM-DD')
    return d.isValid() ? d : null
  }
  return dayjs(typeof props.modelValue === 'number' ? props.modelValue : Number(props.modelValue))
})

const displayValue = computed(() => {
  if (!props.modelValue) return ''
  const d = selectedDate.value
  if (!d || !d.isValid()) return ''
  return props.dateOnly ? d.format('YYYY-MM-DD') : d.format('YYYY-MM-DD HH:mm')
})

const days = computed(() => {
  const start = viewDate.value.startOf('month')
  const end = viewDate.value.endOf('month')
  const gridStart = start.startOf('week')
  const gridEnd = end.endOf('week')
  const today = dayjs().startOf('day')
  const result = []
  let cur = gridStart
  while (cur.isBefore(gridEnd) || cur.isSame(gridEnd)) {
    const inMonth = cur.month() === viewDate.value.month()
    const selected = selectedDate.value && cur.isSame(selectedDate.value, 'day')
    const isPast = cur.isBefore(today)
    result.push({
      key: cur.format('YYYY-MM-DD'),
      date: cur,
      num: cur.date(),
      inMonth,
      selected,
      isToday: cur.isSame(today, 'day'),
      disabled: isPast
    })
    cur = cur.add(1, 'day')
  }
  return result
})

function pad(n) {
  return String(n).padStart(2, '0')
}

function stepHour(delta) {
  let v = Number(hour.value) + delta
  if (v < 0) v = 23
  if (v > 23) v = 0
  hour.value = pad(v)
  emitValue()
}

function stepMinute(delta) {
  let v = Number(minute.value) + delta
  if (v < 0) v = 55
  if (v > 59) v = 0
  if (v % 5 !== 0) v = Math.round(v / 5) * 5 % 60
  minute.value = pad(v)
  emitValue()
}

function toggle() {
  if (props.disabled) return
  open.value ? close() : openPanel()
}

function openPanel() {
  syncFromModel()
  viewDate.value = selectedDate.value || dayjs()
  open.value = true
  nextTick(positionPanel)
}

function positionPanel() {
  if (!root.value) return
  const rect = root.value.getBoundingClientRect()
  const panelW = 280
  const panelH = 380
  let left = rect.left
  let top = rect.bottom + 6
  if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8
  if (top + panelH > window.innerHeight - 8) top = rect.top - panelH - 6
  if (left < 8) left = 8
  if (top < 8) top = 8
  panelStyle.value = { left: left + 'px', top: top + 'px' }
}

function close() {
  open.value = false
}

function prevMonth() {
  viewDate.value = viewDate.value.subtract(1, 'month')
}

function nextMonth() {
  viewDate.value = viewDate.value.add(1, 'month')
}

function pickDay(date) {
  viewDate.value = date
  emitValue()
  if (props.dateOnly) close()
}

function emitValue() {
  if (props.dateOnly) {
    const base = viewDate.value.hour(0).minute(0).second(0).millisecond(0)
    emit('update:modelValue', base.format('YYYY-MM-DD'))
    return
  }
  let base = viewDate.value.hour(Number(hour.value)).minute(Number(minute.value)).second(0).millisecond(0)
  const now = dayjs()
  if (base.isBefore(now)) {
    let m = Math.ceil(now.minute() / 5) * 5
    let h = now.hour()
    if (m >= 60) {
      m = 0
      h = (h + 1) % 24
    }
    base = now.hour(h).minute(m).second(0).millisecond(0)
    viewDate.value = base
    hour.value = pad(h)
    minute.value = pad(m)
  }
  emit('update:modelValue', base.valueOf())
}

function syncFromModel() {
  if (selectedDate.value) {
    hour.value = pad(selectedDate.value.hour())
    minute.value = pad(selectedDate.value.minute())
  }
}

function setQuick(type) {
  let d = dayjs()
  if (type === 'tomorrow') d = d.add(1, 'day')
  else if (type === 'nextWeek') d = d.add(7, 'day')
  viewDate.value = d
  emitValue()
}

function confirm() {
  emitValue()
  close()
}

function clear() {
  emit('update:modelValue', '')
  close()
}

watch([hour, minute], () => {
  if (open.value) emitValue()
})

function handleDocClick(e) {
  if (open.value && !root.value?.contains(e.target)) {
    const panel = document.querySelector('.dtp-panel')
    if (!panel || !panel.contains(e.target)) close()
  }
}

function handleScroll() {
  if (open.value) positionPanel()
}

onMounted(() => {
  document.addEventListener('click', handleDocClick)
  window.addEventListener('scroll', handleScroll, true)
  window.addEventListener('resize', positionPanel)
})

onUnmounted(() => {
  document.removeEventListener('click', handleDocClick)
  window.removeEventListener('scroll', handleScroll, true)
  window.removeEventListener('resize', positionPanel)
})
</script>

<style scoped>
.dtp {
  position: relative;
  width: 100%;
}
.dtp-compact {
  width: auto;
}

.dtp-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border-radius: 999px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  transition: all var(--transition-fast);
  box-sizing: border-box;
  text-align: left;
}

/* compact 模式：紧凑内联触发器，适配 block 内 meta 行 */
.dtp-trigger.compact {
  width: auto;
  padding: 2px 6px 2px 4px;
  gap: 4px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-secondary);
}
.dtp-trigger.compact .dtp-cal-icon { width: 13px; height: 13px; }
.dtp-trigger.compact:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}
.dtp-trigger.compact.placeholder { color: var(--text-tertiary); }

.dtp-trigger:hover {
  border-color: var(--text-tertiary);
}

.dtp-trigger.placeholder {
  color: var(--text-tertiary);
  font-weight: 500;
}

.dtp-trigger:focus-within {
  border-color: var(--primary-color);
  background: var(--bg-secondary);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

.dtp-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dtp-arrow,
.dtp-clear {
  flex-shrink: 0;
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
}

.dtp-arrow.flipped {
  transform: rotate(180deg);
}

.dtp-clear:hover {
  color: var(--warning-color);
}

.dtp-panel {
  position: fixed;
  z-index: 9999;
  width: 280px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 14px;
  box-sizing: border-box;
}

.dtp-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.dtp-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.dtp-nav {
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.dtp-nav:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.dtp-weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: 6px;
}

.dtp-days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 2px;
}

.dtp-day {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.dtp-day:hover {
  background: var(--bg-hover);
}

.dtp-day.muted {
  color: var(--text-tertiary);
  opacity: 0.45;
}

.dtp-day.today {
  color: var(--primary-dark);
  font-weight: 700;
}

.dtp-day.selected {
  background: var(--primary-color);
  color: #fff;
  font-weight: 600;
}

.dtp-day.selected:hover {
  background: var(--primary-dark);
}

.dtp-day.disabled,
.dtp-day.disabled:hover {
  color: var(--text-tertiary);
  opacity: 0.3;
  cursor: not-allowed;
  background: transparent;
}

.dtp-day.disabled.today {
  opacity: 0.6;
}

.dtp-time {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.dtp-time-label {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.dtp-time-inputs {
  display: flex;
  align-items: center;
  gap: 4px;
}

.dtp-stepper {
  display: flex;
  align-items: center;
  gap: 2px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-sm);
  padding: 2px;
}

.dtp-step {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.dtp-step:hover {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.dtp-num {
  min-width: 24px;
  text-align: center;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

.dtp-colon {
  color: var(--text-tertiary);
  font-weight: 600;
}

.dtp-footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border-light);
}

.dtp-quick {
  padding: 5px 10px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  transition: all var(--transition-fast);
}

.dtp-quick:hover {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.dtp-confirm {
  margin-left: auto;
  padding: 5px 14px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  background: var(--primary-color);
  transition: all var(--transition-fast);
}

.dtp-confirm:hover {
  background: var(--primary-dark);
}

.dtp-enter-active,
.dtp-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.dtp-enter-from,
.dtp-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}
</style>

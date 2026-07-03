<template>
  <div class="plans-view">
    <header class="view-header">
      <div class="header-left">
        <h1>计划安排</h1>
        <span class="plan-count">{{ sortedPlans.length }} 个计划</span>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="showAddModal = true">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建计划
        </button>
      </div>
    </header>
    
    <div class="plans-content">
      <div class="plans-bg-decor" aria-hidden="true">
        <svg class="bg-blob bg-blob-1" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="planBlobG1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.75"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="200" cy="200" r="180" fill="url(#planBlobG1)"/>
        </svg>
        <svg class="bg-blob bg-blob-2" viewBox="0 0 300 300" preserveAspectRatio="xMidYMid meet">
          <defs>
            <radialGradient id="planBlobG2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stop-color="currentColor" stop-opacity="0.7"/>
              <stop offset="100%" stop-color="currentColor" stop-opacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="150" cy="150" r="140" fill="url(#planBlobG2)"/>
        </svg>
        <svg class="bg-rings" viewBox="0 0 200 200" fill="none">
          <circle cx="100" cy="100" r="40" stroke="currentColor" stroke-width="1"/>
          <circle cx="100" cy="100" r="65" stroke="currentColor" stroke-width="1" opacity="0.6"/>
          <circle cx="100" cy="100" r="90" stroke="currentColor" stroke-width="1" opacity="0.3"/>
        </svg>
        <div class="bg-grid-lines"></div>
        <div class="bg-dots"></div>
      </div>
      <div class="plans-content-inner">
      <div v-if="!sortedPlans.length" class="empty-state">
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="18" y="24" width="84" height="78" rx="6"/>
          <path d="M18 44h84"/>
          <path d="M36 18v18M66 18v18"/>
          <path d="M38 66h16M38 80h16M58 66h24M58 80h12"/>
        </svg>
        <p>还没有任何计划</p>
        <button class="btn btn-primary" @click="showAddModal = true">创建第一个计划</button>
      </div>
      <template v-else>
      <div v-if="overduePlans.length" class="plan-section">
        <h3 class="section-title overdue">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          逾期
        </h3>
        <div class="plan-list">
          <PlanItem
            v-for="plan in overduePlans"
            :key="plan.id"
            :plan="plan"
            @toggle="togglePlan"
            @edit="editPlan"
            @delete="deletePlan"
          />
        </div>
      </div>
      
      <div v-if="todayPlans.length" class="plan-section">
        <h3 class="section-title today">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M8 2v4"/>
            <path d="M16 2v4"/>
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <path d="M3 10h18"/>
          </svg>
          今天
        </h3>
        <div class="plan-list">
          <PlanItem
            v-for="plan in todayPlans"
            :key="plan.id"
            :plan="plan"
            @toggle="togglePlan"
            @edit="editPlan"
            @delete="deletePlan"
          />
        </div>
      </div>
      
      <div class="plan-section">
        <h3 class="section-title all">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="8" y1="6" x2="21" y2="6"/>
            <line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/>
            <line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          全部计划
        </h3>
        <div class="plan-list">
          <PlanItem
            v-for="plan in activePlans"
            :key="plan.id"
            :plan="plan"
            @toggle="togglePlan"
            @edit="editPlan"
            @delete="deletePlan"
          />
          
          <div v-if="completedPlans.length" class="completed-header completed" @click="showCompleted = !showCompleted">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline :points="showCompleted ? '18 15 12 9 6 15' : '6 9 12 15 18 9'"/>
            </svg>
            已完成 ({{ completedPlans.length }})
          </div>
          
          <div v-show="showCompleted" class="plan-list completed-list">
            <PlanItem
              v-for="plan in completedPlans"
              :key="plan.id"
              :plan="plan"
              @toggle="togglePlan"
              @edit="editPlan"
              @delete="deletePlan"
            />
          </div>
        </div>
      </div>
      </template>
      </div>
    </div>
    
    <Teleport to="body">
      <div v-if="showAddModal || editingPlan" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content plan-modal">
          <h3>{{ editingPlan ? '编辑计划' : '新建计划' }}</h3>
          <input
            v-model="form.title"
            type="text"
            class="input title-input"
            placeholder="计划标题"
            maxlength="100"
          />
          <textarea
            v-model="form.description"
            class="input desc-input"
            placeholder="描述（可选）"
            rows="3"
          ></textarea>
          
          <div class="form-group">
            <label>时间</label>
            <DateTimePicker v-model="form.dueDate" />
          </div>
          
          <div class="form-group">
            <label>优先级</label>
            <div class="priority-options">
              <button
                v-for="option in priorityOptions"
                :key="option.value"
                class="priority-btn"
                :class="[option.value, { active: form.priority === option.value }]"
                @click="form.priority = option.value"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
          
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="closeModal">取消</button>
            <button class="btn btn-primary" @click="savePlan">{{ editingPlan ? '保存' : '创建' }}</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, reactive } from 'vue'
import { usePlanStore } from '@/stores/plan'
import PlanItem from '@/components/PlanItem.vue'
import DateTimePicker from '@/components/DateTimePicker.vue'

const planStore = usePlanStore()
const showAddModal = ref(false)
const editingPlan = ref(null)
const showCompleted = ref(false)

const form = reactive({
  title: '',
  description: '',
  dueDate: '',
  priority: 'normal'
})

const priorityOptions = [
  { value: 'low', label: '低' },
  { value: 'normal', label: '中' },
  { value: 'high', label: '高' }
]

const allPlans = computed(() => planStore.plans)
const overduePlans = computed(() => planStore.overduePlans)
const todayPlans = computed(() => planStore.todayPlans)
const completedPlans = computed(() => allPlans.value.filter(p => p.completed))
const activePlans = computed(() =>
  allPlans.value.filter(plan =>
    !plan.completed &&
    !todayPlans.value.includes(plan) &&
    !overduePlans.value.includes(plan)
  )
)
const sortedPlans = computed(() => planStore.sortedPlans)

function togglePlan(id) {
  planStore.toggleComplete(id)
}

function editPlan(plan) {
  editingPlan.value = plan
  form.title = plan.title
  form.description = plan.description || ''
  form.dueDate = plan.dueDate || ''
  form.priority = plan.priority || 'normal'
}

function deletePlan(id) {
  planStore.deletePlan(id)
}

function closeModal() {
  showAddModal.value = false
  editingPlan.value = null
  form.title = ''
  form.description = ''
  form.dueDate = ''
  form.priority = 'normal'
}

function savePlan() {
  if (!form.title.trim()) return

  const data = {
    description: form.description.trim(),
    dueDate: form.dueDate ? Number(form.dueDate) : null,
    priority: form.priority
  }

  if (editingPlan.value) {
    planStore.updatePlan(editingPlan.value.id, { ...data, title: form.title.trim() })
  } else {
    planStore.createPlan(form.title.trim(), data)
  }

  closeModal()
}
</script>

<style scoped>
.plans-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.plan-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--secondary-dark);
  background: var(--secondary-softer);
  padding: 3px 10px;
  border-radius: 10px;
}

.plans-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  position: relative;
}

.plans-bg-decor {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
  z-index: 0;
}

.plans-content-inner {
  position: relative;
  z-index: 1;
}

.bg-blob {
  position: absolute;
  bottom: -120px;
  color: var(--secondary-color);
  opacity: 0.16;
  filter: blur(8px);
}

.bg-blob-1 {
  left: 8%;
  width: 340px;
  height: 340px;
  animation: blobDrift 24s ease-in-out infinite;
}

.bg-blob-2 {
  right: 12%;
  bottom: -160px;
  width: 280px;
  height: 280px;
  color: var(--primary-color);
  opacity: 0.14;
  animation: blobDrift 30s ease-in-out infinite reverse;
}

@keyframes blobDrift {
  0%, 100% { transform: translate(0, 0) scale(1); }
  50% { transform: translate(20px, -15px) scale(1.08); }
}

.bg-rings {
  position: absolute;
  right: 22%;
  bottom: -50px;
  width: 200px;
  height: 200px;
  color: var(--secondary-color);
  opacity: 0.22;
  animation: ringsSpin 40s linear infinite;
}

@keyframes ringsSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.bg-grid-lines {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 240px;
  background-image:
    linear-gradient(to right, color-mix(in srgb, var(--secondary-color) 45%, transparent) 1px, transparent 1px),
    linear-gradient(to bottom, color-mix(in srgb, var(--secondary-color) 45%, transparent) 1px, transparent 1px);
  background-size: 44px 44px;
  opacity: 0.5;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 55%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 55%);
  transform: perspective(400px) rotateX(55deg);
  transform-origin: bottom center;
}

.bg-dots {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 200px;
  background-image: radial-gradient(color-mix(in srgb, var(--secondary-color) 60%, transparent) 1.4px, transparent 1.4px);
  background-size: 22px 22px;
  opacity: 0.5;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 45%, transparent 100%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 45%, transparent 100%);
}

.empty-state {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  color: var(--text-tertiary);
}

.empty-state svg {
  width: 96px;
  height: 96px;
  opacity: 0.5;
  color: var(--primary-color);
}

.empty-state p {
  font-size: 15px;
  margin: 0;
}

.plan-section {
  margin-bottom: 28px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.section-title.today {
  color: var(--primary-color);
}

.section-title.overdue {
  color: var(--warning-color);
}

.section-title.all {
  color: var(--info-color);
}

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.completed-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 14px 10px 4px;
  font-size: 13px;
  color: var(--text-tertiary);
  cursor: pointer;
  border-top: 1px solid rgba(140, 151, 144, 0.12);
  margin-top: 14px;
  transition: color var(--transition-fast);
}

.completed-header.completed {
  color: var(--primary-dark);
}

.completed-header.completed svg {
  color: var(--primary-color);
}

.completed-header:hover {
  color: var(--text-secondary);
}

.completed-header.completed:hover {
  color: var(--primary-dark);
}

.completed-list {
  margin-top: 8px;
  opacity: 0.75;
}

.plan-modal {
  width: 520px;
  max-width: 92vw;
  padding: 28px;
  border-radius: var(--radius-xl);
}

.plan-modal h3 {
  font-size: 20px;
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.title-input {
  font-size: 15px;
  font-weight: 500;
  margin-bottom: 12px;
}

.desc-input {
  margin-bottom: 16px;
  resize: none;
  font-size: 14px;
}

.form-group {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 12px;
  font-weight: 700;
  color: var(--text-tertiary);
  margin-bottom: 10px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.priority-options {
  display: flex;
  gap: 8px;
}

.priority-btn {
  flex: 1;
  padding: 10px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.priority-btn:hover {
  border-color: var(--text-tertiary);
}

.priority-btn.active.low {
  background: var(--bg-hover);
  border-color: var(--text-tertiary);
}

.priority-btn.active.normal {
  background: var(--secondary-soft);
  border-color: var(--secondary-color);
  color: var(--secondary-dark);
}

.priority-btn.active.high {
  background: var(--warning-soft);
  border-color: var(--warning-color);
  color: var(--warning-color);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 24px;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px 20px;
  }

  .plans-content {
    padding: 20px;
  }
}
</style>

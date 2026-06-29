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
  background: rgba(255,255,255,0.68);
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

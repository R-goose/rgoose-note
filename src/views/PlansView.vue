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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          已逾期 ({{ overduePlans.length }})
        </h3>
        <div class="plan-list">
          <PlanItem
            v-for="plan in overduePlans"
            :key="plan.id"
            :plan="plan"
            @toggle="toggleComplete"
            @edit="editPlan"
            @delete="confirmDelete"
          />
        </div>
      </div>
      
      <div v-if="todayPlans.length" class="plan-section">
        <h3 class="section-title today">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          今天 ({{ todayPlans.length }})
        </h3>
        <div class="plan-list">
          <PlanItem
            v-for="plan in todayPlans"
            :key="plan.id"
            :plan="plan"
            @toggle="toggleComplete"
            @edit="editPlan"
            @delete="confirmDelete"
          />
        </div>
      </div>
      
      <div class="plan-section">
        <h3 class="section-title">
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
        
        <div v-if="activePlans.length || completedPlans.length" class="plan-list">
          <PlanItem
            v-for="plan in activePlans"
            :key="plan.id"
            :plan="plan"
            @toggle="toggleComplete"
            @edit="editPlan"
            @delete="confirmDelete"
          />
          
          <div v-if="completedPlans.length" class="completed-header" @click="showCompleted = !showCompleted">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              :style="{ transform: showCompleted ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }"
            >
              <polyline points="9 18 15 12 9 6"/>
            </svg>
            <span>已完成 ({{ completedPlans.length }})</span>
          </div>
          
          <div v-show="showCompleted">
            <PlanItem
              v-for="plan in completedPlans"
              :key="plan.id"
              :plan="plan"
              @toggle="toggleComplete"
              @edit="editPlan"
              @delete="confirmDelete"
            />
          </div>
        </div>
        
        <div v-else class="empty-state">
          <svg viewBox="0 0 200 200" fill="none">
            <rect x="40" y="30" width="120" height="140" rx="10" fill="#eef0f7"/>
            <rect x="50" y="50" width="60" height="8" rx="4" fill="#d1d5db"/>
            <rect x="50" y="70" width="100" height="6" rx="3" fill="#e5e7eb"/>
            <rect x="50" y="85" width="80" height="6" rx="3" fill="#e5e7eb"/>
            <rect x="50" y="110" width="20" height="20" rx="4" fill="#7ed6a3" opacity="0.5"/>
            <path d="M55 120 L59 124 L67 114" stroke="#7ed6a3" stroke-width="2" stroke-linecap="round"/>
            <rect x="50" y="140" width="20" height="20" rx="4" fill="#7ed6a3"/>
            <path d="M55 150 L59 154 L67 144" stroke="white" stroke-width="2" stroke-linecap="round"/>
          </svg>
          <p>还没有计划，创建一个开始规划吧</p>
          <button class="btn btn-primary" @click="showAddModal = true">创建计划</button>
        </div>
      </div>
    </div>
    
    <div v-if="showAddModal || showEditModal" class="modal-overlay" @click.self="closeModals">
      <div class="modal-content plan-modal">
        <h3>{{ showEditModal ? '编辑计划' : '新建计划' }}</h3>
        
        <input
          v-model="formData.title"
          type="text"
          class="input title-input"
          placeholder="计划标题"
        />
        
        <textarea
          v-model="formData.description"
          class="input desc-input"
          placeholder="详细描述（可选）"
          rows="3"
        ></textarea>
        
        <div class="form-row">
          <div class="form-group">
            <label>截止日期</label>
            <input
              v-model="formData.dueDateStr"
              type="datetime-local"
              class="input"
            />
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label>优先级</label>
            <div class="priority-options">
              <button
                v-for="p in priorities"
                :key="p.value"
                class="priority-btn"
                :class="{ active: formData.priority === p.value, [p.value]: true }"
                @click="formData.priority = p.value"
              >
                {{ p.label }}
              </button>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" v-model="formData.hasReminder" />
              <span>设置提醒</span>
            </label>
          </div>
        </div>
        
        <div v-if="formData.hasReminder" class="form-row">
          <div class="form-group">
            <label>提醒时间</label>
            <input
              v-model="formData.reminderDateStr"
              type="datetime-local"
              class="input"
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <button class="btn btn-secondary" @click="closeModals">取消</button>
          <button class="btn btn-primary" @click="savePlan">
            {{ showEditModal ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>
    
    <div v-if="showDeleteModal" class="modal-overlay" @click.self="showDeleteModal = false">
      <div class="modal-content" style="padding: 24px; width: 360px;">
        <h3 style="margin-bottom: 12px; font-size: 18px;">确认删除</h3>
        <p style="color: var(--text-secondary); margin-bottom: 24px;">确定要删除这个计划吗？</p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-secondary" @click="showDeleteModal = false">取消</button>
          <button class="btn btn-primary" style="background: var(--warning-color);" @click="doDelete">删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { usePlanStore } from '@/stores/plan'
import { formatDate } from '@/utils'
import PlanItem from '@/components/PlanItem.vue'

const planStore = usePlanStore()

const showAddModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const showCompleted = ref(false)
const editingId = ref(null)
const deleteTargetId = ref(null)

const formData = reactive({
  title: '',
  description: '',
  dueDateStr: '',
  hasReminder: false,
  reminderDateStr: '',
  priority: 'normal'
})

const priorities = [
  { value: 'high', label: '高' },
  { value: 'normal', label: '中' },
  { value: 'low', label: '低' }
]

const sortedPlans = computed(() => planStore.sortedPlans)
const todayPlans = computed(() => planStore.todayPlans)
const overduePlans = computed(() => planStore.overduePlans)

const activePlans = computed(() => {
  const todayIds = new Set(todayPlans.value.map(p => p.id))
  const overdueIds = new Set(overduePlans.value.map(p => p.id))
  return sortedPlans.value.filter(p => !p.completed && !todayIds.has(p.id) && !overdueIds.has(p.id))
})

const completedPlans = computed(() => {
  return sortedPlans.value.filter(p => p.completed)
})

onMounted(() => {
  planStore.init()
  planStore.requestNotificationPermission()
})

function resetForm() {
  formData.title = ''
  formData.description = ''
  formData.dueDateStr = ''
  formData.hasReminder = false
  formData.reminderDateStr = ''
  formData.priority = 'normal'
}

function editPlan(plan) {
  editingId.value = plan.id
  formData.title = plan.title
  formData.description = plan.description || ''
  formData.dueDateStr = plan.dueDate ? formatDate(plan.dueDate, 'YYYY-MM-DDTHH:mm') : ''
  formData.hasReminder = !!plan.reminder
  formData.reminderDateStr = plan.reminder ? formatDate(plan.reminder, 'YYYY-MM-DDTHH:mm') : ''
  formData.priority = plan.priority || 'normal'
  showEditModal.value = true
}

function savePlan() {
  if (!formData.title.trim()) return
  
  const options = {
    description: formData.description,
    dueDate: formData.dueDateStr ? new Date(formData.dueDateStr).getTime() : null,
    reminder: formData.hasReminder && formData.reminderDateStr ? new Date(formData.reminderDateStr).getTime() : null,
    priority: formData.priority
  }
  
  if (showEditModal.value && editingId.value) {
    planStore.updatePlan(editingId.value, {
      title: formData.title,
      ...options
    })
  } else {
    planStore.createPlan(formData.title, options)
  }
  
  closeModals()
}

function toggleComplete(id) {
  planStore.toggleComplete(id)
}

function confirmDelete(id) {
  deleteTargetId.value = id
  showDeleteModal.value = true
}

function doDelete() {
  if (deleteTargetId.value) {
    planStore.deletePlan(deleteTargetId.value)
  }
  showDeleteModal.value = false
  deleteTargetId.value = null
}

function closeModals() {
  showAddModal.value = false
  showEditModal.value = false
  editingId.value = null
  resetForm()
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
  font-size: 13px;
  color: var(--text-tertiary);
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

.plan-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.completed-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 12px 8px;
  font-size: 13px;
  color: var(--text-tertiary);
  cursor: pointer;
  border-top: 1px solid var(--border-light);
  margin-top: 12px;
  transition: color var(--transition-fast);
}

.completed-header:hover {
  color: var(--text-secondary);
}

.plan-modal {
  width: 480px;
  max-width: 90vw;
  padding: 24px;
}

.plan-modal h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 20px;
  color: var(--text-primary);
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

.form-row {
  margin-bottom: 16px;
}

.form-group label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.priority-options {
  display: flex;
  gap: 8px;
}

.priority-btn {
  flex: 1;
  padding: 8px 12px;
  border-radius: var(--radius-md);
  border: 1.5px solid var(--border-color);
  background: var(--bg-secondary);
  font-size: 13px;
  font-weight: 500;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.priority-btn:hover {
  border-color: var(--primary-light);
}

.priority-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-soft);
  color: var(--primary-color);
}

.priority-btn.high.active {
  border-color: var(--warning-color);
  background: rgba(217, 118, 118, 0.1);
  color: var(--warning-color);
}

.priority-btn.low.active {
  border-color: var(--secondary-color);
  background: rgba(201, 169, 110, 0.12);
  color: var(--secondary-color);
}

.checkbox-label {
  display: flex !important;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 400 !important;
  color: var(--text-primary) !important;
}

.checkbox-label input {
  width: 16px;
  height: 16px;
  accent-color: var(--primary-color);
}

input[type="datetime-local"] {
  width: 100%;
  padding: 10px 14px;
  border: 1.5px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-secondary);
  color: var(--text-primary);
  font-size: 14px;
  font-family: inherit;
  transition: all var(--transition-fast);
  outline: none;
  box-sizing: border-box;
}

input[type="datetime-local"]:hover {
  border-color: var(--primary-light);
}

input[type="datetime-local"]:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px var(--primary-soft);
}

input[type="datetime-local"]::-webkit-calendar-picker-indicator {
  opacity: 0.6;
  cursor: pointer;
  transition: opacity var(--transition-fast);
}

input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
  opacity: 1;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--border-light);
}

@media (max-width: 768px) {
  .view-header {
    padding: 16px;
  }
  
  .plans-content {
    padding: 16px;
  }
  
  .plan-modal {
    width: 100%;
    margin: 16px;
  }
}
</style>

<template>
  <div class="plan-item" :class="{ completed: plan.completed, [`priority-${plan.priority}`]: true }">
    <div class="checkbox-wrapper" @click.stop="$emit('toggle', plan.id)">
      <div class="custom-checkbox" :class="{ checked: plan.completed }">
        <svg v-if="plan.completed" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
    </div>
    
    <div class="plan-content" @click.stop="$emit('edit', plan)">
      <div class="plan-title">{{ plan.title }}</div>
      <div v-if="plan.description" class="plan-desc">{{ plan.description }}</div>
      <div class="plan-meta">
        <span v-if="plan.dueDate" class="due-date" :class="{ overdue: isOverdue }">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          {{ formatDueDate(plan.dueDate) }}
        </span>
        <span v-if="plan.reminder" class="reminder-tag">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          提醒
        </span>
        <span class="priority-tag">
          {{ priorityLabel }}
        </span>
      </div>
    </div>
    
    <div class="plan-actions">
      <button class="action-btn" @click.stop="$emit('edit', plan)" title="编辑">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
      <button class="action-btn delete" @click.stop="$emit('delete', plan.id)" title="删除">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="3 6 5 6 21 6"/>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
        </svg>
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { formatRelativeTime, formatDate } from '@/utils'

const props = defineProps({
  plan: {
    type: Object,
    required: true
  }
})

defineEmits(['toggle', 'edit', 'delete'])

const isOverdue = computed(() => {
  if (props.plan.completed || !props.plan.dueDate) return false
  return props.plan.dueDate < Date.now()
})

const priorityLabel = computed(() => {
  const map = { high: '高优先级', normal: '中优先级', low: '低优先级' }
  return map[props.plan.priority] || '中优先级'
})

function formatDueDate(timestamp) {
  const now = new Date()
  const date = new Date(timestamp)
  const diffDays = Math.floor((date.setHours(0, 0, 0, 0) - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return `今天 ${formatDate(timestamp, 'HH:mm')}`
  } else if (diffDays === 1) {
    return `明天 ${formatDate(timestamp, 'HH:mm')}`
  } else if (diffDays === -1) {
    return `昨天 ${formatDate(timestamp, 'HH:mm')}`
  } else if (Math.abs(diffDays) <= 7) {
    return formatRelativeTime(timestamp)
  }
  return formatDate(timestamp, 'MM-DD HH:mm')
}
</script>

<style scoped>
.plan-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  transition: all var(--transition-normal);
  cursor: pointer;
}

.plan-item:hover {
  border-color: color-mix(in srgb, var(--secondary-color) 35%, var(--border-color));
  box-shadow: 0 8px 22px -10px color-mix(in srgb, var(--secondary-color) 30%, rgba(0, 0, 0, 0.12));
  transform: translateY(-2px);
}

.plan-item.completed {
  opacity: 0.6;
}

.plan-item.completed .plan-title {
  text-decoration: line-through;
  color: var(--text-tertiary);
}

.checkbox-wrapper {
  flex-shrink: 0;
  padding-top: 2px;
}

.custom-checkbox {
  width: 20px;
  height: 20px;
  border: 2px solid var(--border-color);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.custom-checkbox:hover {
  border-color: var(--primary-color);
}

.custom-checkbox.checked {
  background: var(--secondary-color);
  border-color: var(--secondary-color);
  color: white;
}

.plan-content {
  flex: 1;
  min-width: 0;
}

.plan-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.plan-desc {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.plan-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--text-tertiary);
  flex-wrap: wrap;
}

.due-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.due-date.overdue {
  color: var(--warning-color);
}

.reminder-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-color);
}

.priority-tag {
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  font-weight: 500;
}

.priority-high .priority-tag {
  background: rgba(217, 118, 118, 0.12);
  color: var(--warning-color);
}

.priority-low .priority-tag {
  background: rgba(201, 169, 110, 0.12);
  color: var(--secondary-color);
}

.plan-actions {
  display: flex;
  gap: 5px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  flex-shrink: 0;
}

.plan-item:hover .plan-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  background: var(--bg-tertiary);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
  transition: all var(--transition-fast);
}

.action-btn:hover {
  background: var(--secondary-color);
  color: #fff;
  transform: scale(1.1);
}

.action-btn.delete:hover {
  color: #fff;
  background: var(--warning-color);
}
</style>

<template>
  <div class="settings-view">
    <header class="view-header">
      <div class="header-left">
        <h1>设置</h1>
      </div>
    </header>
    
    <div class="settings-content">
      <section class="settings-section">
        <h2 class="section-title">数据管理</h2>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">导出数据</div>
              <div class="setting-desc">将所有笔记和计划导出为 JSON 文件备份</div>
            </div>
            <button class="btn btn-secondary" @click="handleExport">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              导出
            </button>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">导入数据</div>
              <div class="setting-desc">从 JSON 备份文件恢复数据</div>
            </div>
            <button class="btn btn-secondary" @click="handleImport">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              导入
            </button>
          </div>
          
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">同步状态</div>
              <div class="setting-desc">上次同步：{{ lastSyncTimeStr }}</div>
            </div>
            <div class="sync-badge">
              <div class="sync-dot synced"></div>
              已同步
            </div>
          </div>
        </div>
      </section>
      
      <section class="settings-section">
        <h2 class="section-title">关于</h2>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">R-Goose Note</div>
              <div class="setting-desc">版本 1.0.0</div>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">平台支持</div>
              <div class="setting-desc">Web / Windows / 移动端</div>
            </div>
          </div>
        </div>
      </section>
    </div>
    
    <input
      ref="importFileRef"
      type="file"
      accept=".json"
      style="display: none;"
      @change="onImportFile"
    />
    
    <div v-if="showImportConfirm" class="modal-overlay" @click.self="showImportConfirm = false">
      <div class="modal-content" style="padding: 24px; width: 400px;">
        <h3 style="margin-bottom: 12px; font-size: 18px;">确认导入</h3>
        <p style="color: var(--text-secondary); margin-bottom: 12px;">导入将合并现有数据，以更新时间较新的内容为准。</p>
        <p style="color: var(--warning-color); font-size: 13px; margin-bottom: 20px);">
          {{ importPreview }}
        </p>
        <div style="display: flex; gap: 12px; justify-content: flex-end;">
          <button class="btn btn-secondary" @click="showImportConfirm = false">取消</button>
          <button class="btn btn-primary" @click="confirmImport">确认导入</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { exportAsJSON, importFromJSON, mergeData, loadFromStorage, saveToStorage } from '@/utils/storage'
import { formatDate } from '@/utils'

const noteStore = useNoteStore()
const planStore = usePlanStore()

const importFileRef = ref(null)
const showImportConfirm = ref(false)
const pendingImportData = ref(null)
const importPreview = ref('')

const lastSyncTimeStr = computed(() => {
  const time = noteStore.lastSyncTime || planStore.lastSyncTime
  return time ? formatDate(time, 'YYYY-MM-DD HH:mm:ss') : '从未同步'
})

onMounted(() => {
  noteStore.init()
  planStore.init()
})

async function handleExport() {
  const data = {
    notes: noteStore.notes,
    plans: planStore.plans,
    exportedAt: Date.now(),
    version: '1.0.0'
  }
  
  if (window.electronAPI?.exportData) {
    await window.electronAPI.exportData(data)
  } else {
    exportAsJSON(data)
  }
}

function handleImport() {
  importFileRef.value?.click()
}

async function onImportFile(e) {
  const file = e.target.files?.[0]
  if (!file) return
  
  try {
    const data = await importFromJSON(file)
    pendingImportData.value = data
    
    const noteCount = data.notes?.length || 0
    const planCount = data.plans?.length || 0
    importPreview.value = `将导入 ${noteCount} 篇笔记和 ${planCount} 个计划`
    
    showImportConfirm.value = true
  } catch (err) {
    alert('导入失败：' + err.message)
  }
  
  e.target.value = ''
}

function confirmImport() {
  if (!pendingImportData.value) return
  
  const currentData = loadFromStorage() || { notes: [], plans: [] }
  const merged = mergeData(currentData, pendingImportData.value)
  
  saveToStorage(merged)
  
  if (merged.notes) noteStore.replaceAll(merged.notes)
  if (merged.plans) planStore.replaceAll(merged.plans)
  
  showImportConfirm.value = false
  pendingImportData.value = null
}
</script>

<style scoped>
.settings-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-header {
  padding: 20px 28px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
}

.view-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
  box-sizing: border-box;
}

.settings-section {
  width: 100%;
  margin-bottom: 36px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.settings-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
  width: 100%;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  width: 100%;
  box-sizing: border-box;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.setting-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.sync-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--secondary-color);
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
}

.sync-dot.synced {
  background: var(--primary-color);
}

@media (max-width: 768px) {
  .view-header {
    padding: 16px;
  }
  
  .settings-content {
    padding: 16px;
  }
}
</style>

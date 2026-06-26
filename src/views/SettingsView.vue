<template>
  <div class="settings-view">
    <header class="view-header">
      <div class="header-left">
        <h1>设置</h1>
      </div>
    </header>
    
    <div class="settings-content">
      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-blue"></span>数据管理</h2>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">导出数据</div>
              <div class="setting-desc">将所有笔记和计划导出为 JSON 文件备份</div>
            </div>
            <button class="btn btn-secondary btn-export" @click="handleExport">
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
            <button class="btn btn-secondary btn-import" @click="handleImport">
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
            <div class="sync-badge synced">
              <div class="sync-dot synced"></div>
              已同步
            </div>
          </div>
        </div>
      </section>
      
      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-green"></span>关于</h2>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name brand-name">R-Goose Note</div>
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

    <Teleport to="body">
      <div v-if="showImportConfirm" class="modal-overlay" @click.self="cancelImport">
        <div class="modal-content confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3>确认导入数据</h3>
              <p>导入的数据会与当前数据合并，重复内容会被保留。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="cancelImport">取消</button>
            <button class="btn btn-primary" @click="confirmImport">确认导入</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { exportAsJSON, importFromJSON, mergeData, loadFromStorage, saveToStorage } from '@/utils/storage'
import { formatDate } from '@/utils'
import { useToast } from '@/composables/useToast'

const { error: toastError, success: toastSuccess } = useToast()

const noteStore = useNoteStore()
const planStore = usePlanStore()
const showImportConfirm = ref(false)
const pendingImportData = ref(null)

const lastSyncTimeStr = computed(() => {
  const lastSync = Math.max(noteStore.lastSyncTime || 0, planStore.lastSyncTime || 0)
  if (!lastSync) return '尚未同步'
  return formatDate(lastSync, 'YYYY年MM月DD日 HH:mm')
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
  toastSuccess('数据已成功导出')
}

async function handleImport() {
  try {
    let data
    
    if (window.electronAPI?.importData) {
      data = await window.electronAPI.importData()
    } else {
      data = await importFromJSON()
    }
    
    if (data) {
      pendingImportData.value = data
      showImportConfirm.value = true
    }
  } catch (err) {
    toastError('导入失败：' + err.message)
  }
}

function confirmImport() {
  if (!pendingImportData.value) return
  
  const currentData = loadFromStorage()
  const mergedData = mergeData(currentData, pendingImportData.value)
  saveToStorage(mergedData)
  
  noteStore.loadData(mergedData.notes || [])
  planStore.loadData(mergedData.plans || [])
  
  showImportConfirm.value = false
  pendingImportData.value = null
  toastSuccess('数据导入完成')
}

function cancelImport() {
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
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.title-bar {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}

.bar-blue { background: var(--info-color); }
.bar-green { background: var(--primary-color); }

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

.brand-name {
  color: var(--primary-dark);
  font-weight: 600;
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
  color: var(--text-tertiary);
}

.sync-badge.synced {
  color: var(--primary-dark);
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
}

.sync-dot.synced {
  background: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(107, 189, 143, 0.18);
}

.btn-export {
  color: var(--primary-dark);
  border-color: var(--primary-light);
}

.btn-export:hover {
  background: var(--primary-soft);
  border-color: var(--primary-color);
}

.btn-import {
  color: var(--info-dark);
  border-color: var(--info-light);
}

.btn-import:hover {
  background: var(--info-soft);
  border-color: var(--info-color);
}

.confirm-modal {
  width: 420px;
  max-width: 90vw;
  padding: 24px;
}

.confirm-header {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.confirm-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-icon.warning {
  background: var(--warning-soft);
  color: var(--warning-color);
}

.confirm-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirm-header p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
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

<template>
  <div class="settings-view">
    <header class="view-header">
      <div class="header-left">
        <h1>设置</h1>
      </div>
    </header>

    <div class="settings-content">
     <div class="settings-inner">
      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-blue"></span>数据管理</h2>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">导出数据</div>
              <div class="setting-desc">将所有笔记和计划导出为 JSON 文件备份</div>
            </div>
            <button class="btn btn-secondary btn-export" @click="handleExport">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
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

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">清除缓存</div>
              <div class="setting-desc">清除本地存储数据（操作前请先导出备份）</div>
            </div>
            <button class="btn btn-danger-outline" @click="handleClearCache">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              清除
            </button>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">文件存储位置</div>
              <div class="setting-desc">{{ storageLocation }}</div>
            </div>
            <button class="btn btn-secondary" @click="copyStorageLocation">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              复制
            </button>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-yellow"></span>云同步</h2>
        <div class="settings-list">
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">启用云同步</div>
              <div class="setting-desc">开启后可在多端之间同步笔记和计划</div>
            </div>
            <label class="switch">
              <input type="checkbox" :checked="syncStore.enabled" @change="toggleEnabled($event)" />
              <span class="switch-slider"></span>
            </label>
          </div>

          <div v-if="syncStore.enabled" class="cloud-config">
            <div class="form-row">
              <label class="form-label">同步后端</label>
              <div class="backend-tabs">
                <button class="backend-tab" :class="{ active: syncStore.type === 'gist' }"
                  @click="syncStore.setType('gist')">GitHub Gist</button>
                <button class="backend-tab" :class="{ active: syncStore.type === 'gitee' }"
                  @click="syncStore.setType('gitee')">Gitee 代码片段</button>
                <button class="backend-tab" :class="{ active: syncStore.type === 'webdav' }"
                  @click="syncStore.setType('webdav')">WebDAV</button>
              </div>
            </div>

            <template v-if="syncStore.type === 'gist' || syncStore.type === 'gitee'">
              <div class="form-row">
                <label class="form-label">{{ syncStore.type === 'gitee' ? 'Gitee 私人令牌' : 'GitHub Token' }}</label>
                <input type="password" class="input"
                  :placeholder="syncStore.type === 'gitee' ? '在 Gitee → 设置 → 私人令牌 生成' : 'ghp_xxxxxxxx'"
                  :value="syncStore.gistConfig.token"
                  @input="syncStore.updateGistConfig({ token: $event.target.value })" />
                <div v-if="syncStore.type === 'gitee'" class="form-hint">在 Gitee → 设置 → 私人令牌 创建，需勾选 gists（代码片段）权限</div>
                <div v-else class="form-hint">在 GitHub → Settings → Developer settings → Personal access tokens 创建，需勾选
                  gist 权限</div>
              </div>
              <div class="form-row">
                <label class="form-label">{{ syncStore.type === 'gitee' ? 'Gitee 片段 ID（可选）' : 'Gist ID（可选）' }}</label>
                <input type="text" class="input"
                  :placeholder="syncStore.type === 'gitee' ? '留空则首次推送时自动创建；填写后将固定使用该片段' : '留空则首次推送时自动创建'"
                  :value="syncStore.gistConfig.gistId"
                  @input="syncStore.updateGistConfig({ gistId: $event.target.value })" />
                <div v-if="syncStore.type === 'gitee'" class="form-hint">如果你填了 Gitee 片段 ID，后续会一直更新这个片段；ID
                  不存在时不会自动新建别的片段。</div>
              </div>
            </template>

            <template v-else>
              <div class="form-row">
                <label class="form-label">WebDAV 地址</label>
                <input type="text" class="input" placeholder="https://dav.jianguoyun.com/dav/R-Goose/"
                  :value="syncStore.webdavConfig.url"
                  @input="syncStore.updateWebdavConfig({ url: $event.target.value })" />
              </div>
              <div class="form-row">
                <label class="form-label">用户名</label>
                <input type="text" class="input" :value="syncStore.webdavConfig.username"
                  @input="syncStore.updateWebdavConfig({ username: $event.target.value })" />
              </div>
              <div class="form-row">
                <label class="form-label">密码 / 应用密码</label>
                <input type="password" class="input" :value="syncStore.webdavConfig.password"
                  @input="syncStore.updateWebdavConfig({ password: $event.target.value })" />
                <div class="form-hint">坚果云等请在账户设置里生成专属应用密码</div>
              </div>
            </template>

            <div class="form-row">
              <label class="form-label">自动同步</label>
              <label class="switch small">
                <input type="checkbox" :checked="syncStore.autoSync" @change="toggleAutoSync($event)" />
                <span class="switch-slider"></span>
              </label>
              <span class="form-hint">每隔 {{ syncStore.autoSyncInterval }} 秒自动同步</span>
            </div>

            <div class="form-row" v-if="syncStore.autoSync">
              <label class="form-label">同步间隔（秒）</label>
              <input type="number" class="input interval-input" min="10" step="10" :value="syncStore.autoSyncInterval"
                @change="syncStore.setAutoSyncInterval($event.target.value)" />
            </div>

            <div class="cloud-actions">
              <button class="btn btn-secondary" :disabled="syncStore.syncing" @click="handleTest">
                测试连接
              </button>
              <button class="btn btn-secondary" :disabled="syncStore.syncing" @click="handlePull">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                拉取
              </button>
              <button class="btn btn-primary" :disabled="syncStore.syncing" @click="handlePush">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
                {{ syncStore.syncing ? '同步中...' : '立即同步' }}
              </button>
            </div>

            <div v-if="cloudSyncText" class="sync-status-text">{{ cloudSyncText }}</div>
            <div v-if="syncStore.lastError" class="sync-error-text">上次错误：{{ syncStore.lastError }}</div>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-purple"></span>快捷键</h2>
        <div class="shortcut-toolbar">
          <span class="shortcut-tip">点击按键框重新录入，按 Esc 取消</span>
          <button class="btn btn-secondary btn-sm" @click="resetAllShortcuts">全部恢复默认</button>
        </div>
        <div class="shortcut-groups">
          <div v-for="(actions, group) in shortcutStore.groupedActions" :key="group" class="shortcut-group">
            <div class="shortcut-group-title">{{ group }}</div>
            <div class="shortcut-list">
              <div v-for="act in actions" :key="act.id" class="shortcut-item">
                <div class="shortcut-info">
                  <div class="shortcut-name">
                    {{ act.label }}
                    <span v-if="!shortcutStore.isDefault(act.id)" class="custom-tag">自定义</span>
                  </div>
                </div>
                <div class="shortcut-actions">
                  <button
                    class="keybind-box"
                    :class="{ recording: recordingId === act.id, conflict: conflictInfo(act.id) }"
                    @click="startRecording(act.id)"
                    @keydown="onRecordKeydown($event, act.id)"
                    @blur="cancelRecording"
                  >
                    <template v-if="recordingId === act.id">按下快捷键…</template>
                    <template v-else>{{ formatCombo(shortcutStore.getCombo(act.id)) }}</template>
                  </button>
                  <button
                    v-if="!shortcutStore.isDefault(act.id)"
                    class="btn-reset"
                    title="恢复默认"
                    @click="shortcutStore.resetShortcut(act.id)"
                  >↺</button>
                </div>
                <div v-if="conflictInfo(act.id)" class="conflict-warn">与「{{ conflictInfo(act.id).label }}」冲突</div>
              </div>
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
              <div class="setting-desc">版本 1.0.2</div>
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
    </div>

    <Teleport to="body">
      <div v-if="showImportConfirm" class="modal-overlay" @click.self="cancelImport">
        <div class="modal-content confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
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
import { computed, ref, onMounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { useSyncStore } from '@/stores/sync'
import { useShortcutStore, eventToCombo, ACTION_META } from '@/stores/shortcut'
import { exportAsJSON, importFromJSON, mergeData, loadFromStorage, saveToStorage } from '@/utils/storage'
import { formatDate } from '@/utils'
import { useToast } from '@/composables/useToast'

const { error: toastError, success: toastSuccess, info: toastInfo } = useToast()

const noteStore = useNoteStore()
const planStore = usePlanStore()
const syncStore = useSyncStore()
const shortcutStore = useShortcutStore()
shortcutStore.init()
const showImportConfirm = ref(false)
const pendingImportData = ref(null)

const lastSyncTimeStr = computed(() => {
  const lastSync = Math.max(noteStore.lastSyncTime || 0, planStore.lastSyncTime || 0)
  if (!lastSync) return '尚未同步'
  return formatDate(lastSync, 'YYYY年MM月DD日 HH:mm')
})

const storageLocation = ref('')

onMounted(async () => {
  if (window.electronAPI?.getDataPath) {
    try {
      storageLocation.value = await window.electronAPI.getDataPath()
    } catch (e) {
      storageLocation.value = '本地应用数据目录'
    }
  } else {
    storageLocation.value = '浏览器本地存储 (localStorage) · key: rgoose_note_data'
  }
})

const cloudSyncText = computed(() => {
  if (!syncStore.enabled) return ''
  if (syncStore.syncing) return '正在同步...'
  if (!syncStore.lastCloudSync) return '尚未同步到云端'
  return `上次云端同步：${formatDate(syncStore.lastCloudSync, 'YYYY-MM-DD HH:mm')}`
})

function toggleEnabled(e) {
  syncStore.setEnabled(e.target.checked)
}

function toggleAutoSync(e) {
  syncStore.setAutoSync(e.target.checked)
}

async function handleTest() {
  try {
    await syncStore.test()
    toastSuccess('连接成功，凭证有效')
  } catch (err) {
    toastError('连接失败：' + err.message)
  }
}

async function handlePull() {
  try {
    await syncStore.pull(noteStore, planStore)
    toastSuccess('已从云端拉取并合并数据')
  } catch (err) {
    toastError('拉取失败：' + err.message)
  }
}

async function handlePush() {
  try {
    await syncStore.sync(noteStore, planStore)
    toastSuccess('同步完成')
  } catch (err) {
    toastError('同步失败：' + (syncStore.lastError || err.message))
  }
}

async function copyStorageLocation() {
  const text = storageLocation.value
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    toastSuccess('存储位置已复制到剪贴板')
  } catch {
    toastError('复制失败，请手动选择文本复制')
  }
}

function handleClearCache() {
  if (!confirm('确定清除本地缓存数据吗？\n\n此操作将删除本地存储的所有笔记和计划数据，且不可恢复。\n建议操作前先「导出数据」备份。')) {
    return
  }
  noteStore.clearCache()
  noteStore.notes = []
  noteStore.folders = []
  toastSuccess('本地缓存已清除')
}

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

  if (mergedData.folders) noteStore.replaceAllFolders(mergedData.folders)
  noteStore.replaceAll(mergedData.notes || [])
  planStore.replaceAll(mergedData.plans || [])

  showImportConfirm.value = false
  pendingImportData.value = null
  toastSuccess('数据导入完成')
}

function cancelImport() {
  showImportConfirm.value = false
  pendingImportData.value = null
}

const recordingId = ref(null)

function formatCombo(combo) {
  if (!combo) return '未设置'
  return combo.split('+').map(p => {
    const m = { Ctrl: 'Ctrl', Shift: 'Shift', Alt: 'Alt', Up: '↑', Down: '↓', Left: '←', Right: '→', Space: '空格', Del: 'Delete', Esc: 'Esc', Enter: 'Enter' }
    return m[p] || p
  }).join(' + ')
}

function startRecording(actionId) {
  recordingId.value = actionId
}

function cancelRecording() {
  recordingId.value = null
}

function onRecordKeydown(e, actionId) {
  e.preventDefault()
  e.stopPropagation()
  if (e.key === 'Escape') {
    recordingId.value = null
    return
  }
  if (e.key === 'Tab') return
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

  const combo = eventToCombo(e)
  const conflict = shortcutStore.findConflict(actionId, combo)
  if (conflict) {
    toastError(`该快捷键已被「${ACTION_META[conflict].label}」占用`)
    recordingId.value = null
    return
  }
  shortcutStore.setShortcut(actionId, combo)
  recordingId.value = null
  toastSuccess('快捷键已更新')
}

function conflictInfo(actionId) {
  const combo = shortcutStore.getCombo(actionId)
  const conflict = shortcutStore.findConflict(actionId, combo)
  return conflict ? ACTION_META[conflict] : null
}

function resetAllShortcuts() {
  shortcutStore.resetAll()
  toastSuccess('已恢复全部默认快捷键')
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
  padding: 20px calc(28px + var(--window-controls-width)) 20px 28px;
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
  width: 100%;
  box-sizing: border-box;
}

.settings-inner {
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
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

.bar-blue {
  background: var(--info-color);
}

.bar-green {
  background: var(--primary-color);
}

.bar-purple {
  background: #9b6dd7;
}

.shortcut-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.shortcut-tip {
  font-size: 12px;
  color: var(--text-tertiary);
}

.btn-sm {
  padding: 5px 12px;
  font-size: 12px;
}

.shortcut-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shortcut-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 2px;
}

.shortcut-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-light);
  position: relative;
  flex-wrap: wrap;
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-info {
  flex: 1;
  min-width: 140px;
}

.shortcut-name {
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--primary-soft);
  color: var(--primary-dark);
  font-weight: 600;
}

.shortcut-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.keybind-box {
  min-width: 110px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}

.keybind-box:hover {
  border-color: var(--primary-color);
}

.keybind-box.recording {
  border-color: var(--primary-color);
  background: var(--primary-soft);
  color: var(--primary-dark);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb, 82, 163, 119), 0.15);
}

.keybind-box.conflict {
  border-color: var(--danger-color, #d97676);
  color: var(--danger-color, #d97676);
}

.btn-reset {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-reset:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.conflict-warn {
  position: absolute;
  bottom: 2px;
  right: 16px;
  font-size: 11px;
  color: var(--danger-color, #d97676);
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

.brand-name {
  color: var(--primary-dark);
  font-weight: 600;
}

.setting-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.5;
  word-break: break-all;
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

.btn-danger-outline {
  color: var(--warning-color, #d97676);
  border-color: var(--warning-color, #d97676);
}

.btn-danger-outline:hover {
  background: var(--warning-soft, #fbecec);
  border-color: var(--warning-color, #d97676);
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

.cloud-config {
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row.inline {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.05em;
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.interval-input {
  max-width: 120px;
}

.backend-tabs {
  display: flex;
  gap: 6px;
  background: var(--bg-tertiary);
  padding: 4px;
  border-radius: 999px;
  width: fit-content;
}

.backend-tab {
  padding: 7px 16px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.backend-tab.active {
  background: var(--bg-secondary);
  color: var(--primary-dark);
  box-shadow: var(--shadow-sm);
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch.small {
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--border-color);
  border-radius: 999px;
  transition: var(--transition-fast);
}

.switch-slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.switch.small .switch-slider::before {
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
}

.switch input:checked+.switch-slider {
  background: var(--primary-color);
}

.switch input:checked+.switch-slider::before {
  transform: translateX(20px);
}

.switch.small input:checked+.switch-slider::before {
  transform: translateX(16px);
}

.cloud-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.sync-status-text {
  font-size: 12px;
  color: var(--text-tertiary);
}

.sync-error-text {
  font-size: 12px;
  color: var(--warning-color);
}

.title-bar.bar-yellow {
  background: #d4b27a;
}
</style>

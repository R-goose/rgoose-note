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
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
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
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              导入
            </button>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">保存状态</div>
              <div class="setting-desc">上次保存：{{ lastSyncTimeStr }}</div>
            </div>
            <div class="sync-badge synced">
              <div class="sync-dot synced"></div>
              已保存
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

          <div v-if="storageSize" class="setting-item storage-usage-item">
            <div class="setting-info">
              <div class="setting-name">存储占用 <span class="total-usage">共 {{ formatBytes(usageTotal) }}</span></div>
              <div class="storage-usage-bar">
                <div class="usage-segment notes" :style="{ width: notesUsagePercent + '%' }" title="笔记数据"></div>
                <div class="usage-segment images" :style="{ width: imagesUsagePercent + '%' }" title="图片文件"></div>
                <div class="usage-segment backups" :style="{ width: backupUsagePercent + '%' }" title="备份文件"></div>
              </div>
              <div class="storage-usage-detail">
                <span class="usage-tag notes">笔记 {{ formatBytes(storageSize.dataFileSize != null ? storageSize.dataFileSize : storageSize.dataSize) }}</span>
                <span class="usage-tag images">图片 {{ formatBytes(storageSize.imagesDirSize) }}</span>
                <span class="usage-tag backups">备份 {{ formatBytes(storageSize.backupSize) }}（{{ storageSize.backupCount }} 份）</span>
              </div>
              <div v-if="storageSize.appSize != null" class="storage-usage-detail app-usage-line">
                <span class="usage-tag app">应用本体 {{ formatBytes(storageSize.appSize) }}</span>
              </div>
            </div>
          </div>

          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">本地备份</div>
              <div class="setting-desc">生成完整备份（含数据和图片，打包为 zip），最多保留 5 份</div>
            </div>
            <div class="storage-actions">
              <button v-if="storageType === 'electron'" class="btn btn-secondary" @click="openBackupsFolder" title="打开备份所在目录">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                打开目录
              </button>
              <button class="btn btn-export" @click="handleCreateBackup">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                生成备份
              </button>
            </div>
          </div>

          <div v-if="backups.length" class="backup-list">
            <div v-for="b in backups" :key="b.name" class="backup-item">
              <div class="backup-info">
                <span class="backup-time">{{ formatBackupTime(b.mtime) }}</span>
                <span class="backup-size">{{ formatBytes(b.size) }}</span>
              </div>
              <div class="backup-actions">
                  <button v-if="storageType === 'electron'" class="action-icon-btn secondary" @click="openBackup(b.name)"
                    title="在资源管理器中显示">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                  <button class="action-icon-btn danger" @click="handleDeleteBackup(b.name)" title="删除备份">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
              </div>

            </div>
          </div>

          <div class="setting-item storage-location-item">
            <div class="setting-info">
              <div class="setting-name">
                文件存储位置
                <span v-if="storageIsCustom" class="custom-badge">自定义</span>
              </div>
              <div class="setting-desc">{{ storageLocation }}</div>
              <div v-if="migrating" class="migrating-hint">
                <span class="mini-spinner"></span> 正在迁移数据，请稍候...
              </div>
            </div>
            <div class="storage-actions">
              <button v-if="storageType === 'electron'" class="btn btn-secondary" @click="openStorageLocation" title="在文件资源管理器中打开">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                打开
              </button>
              <button class="btn btn-secondary" @click="copyStorageLocation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                复制
              </button>
              <template v-if="storageType === 'electron'">
                <button v-if="!storageIsCustom" class="btn btn-export" :disabled="migrating" @click="handleChangeStorage">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  更改位置
                </button>
                <button v-else class="btn btn-export" :disabled="migrating" @click="handleResetStorage">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  恢复默认
                </button>
              </template>
            </div>
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
              <div class="setting-desc">版本 1.2.0</div>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">平台支持</div>
              <div class="setting-desc">Web / Windows</div>
            </div>
          </div>
            <div class="setting-item">
              <div class="setting-info">
                <div class="setting-name">版权归属</div>
                <div class="setting-desc">R-Goose Note 是一个基于 Vue 3 的笔记应用，由 R-Goose 开发。</div>
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

    <Teleport to="body">
      <div v-if="showClearCacheConfirm" class="modal-overlay" @click.self="showClearCacheConfirm = false">
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
              <h3>确认清除缓存</h3>
              <p>此操作将删除本地存储的所有笔记和计划数据，且不可恢复。建议操作前先「导出数据」备份。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showClearCacheConfirm = false">取消</button>
            <button class="btn btn-primary" @click="confirmClearCache">确认清除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showStorageMigrateConfirm" class="modal-overlay" @click.self="showStorageMigrateConfirm = false">
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
              <h3>更改存储位置</h3>
              <p>将完整迁移当前数据（笔记+图片）到新位置：<br><code class="path-code">{{ pendingStorageDir }}</code><br>迁移完成后建议重启应用以完全生效。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showStorageMigrateConfirm = false">取消</button>
            <button class="btn btn-primary" @click="performChangeStorage">确认迁移</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="showStorageResetConfirm" class="modal-overlay" @click.self="showStorageResetConfirm = false">
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
              <h3>恢复默认存储位置</h3>
              <p>当前数据会迁移回应用默认目录。建议操作前先生成备份。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showStorageResetConfirm = false">取消</button>
            <button class="btn btn-primary" @click="performResetStorage">确认恢复</button>
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
import { useTagStore } from '@/stores/tag'
import { useShortcutStore, eventToCombo, ACTION_META } from '@/stores/shortcut'
import { exportAsJSON, importFromJSON, mergeData, loadFromStore, saveToStore } from '@/utils/storage'
import { isAppFormatData, buildNoteFromArbitraryJSON } from '@/utils/jsonAdapter'
import { collectImageRefsFromData, buildImageBundle, restoreImageBundle, remapImageRefsInData } from '@/utils/imageStore'
import { formatDate, formatBytes } from '@/utils'
import { useToast } from '@/composables/useToast'

const { error: toastError, success: toastSuccess, info: toastInfo } = useToast()

const noteStore = useNoteStore()
const planStore = usePlanStore()
const tagStore = useTagStore()
const shortcutStore = useShortcutStore()
shortcutStore.init()
const showImportConfirm = ref(false)
const showClearCacheConfirm = ref(false)
const pendingImportData = ref(null)

const lastSyncTimeStr = computed(() => {
  const lastSync = Math.max(noteStore.lastSyncTime || 0, planStore.lastSyncTime || 0)
  if (!lastSync) return '尚未同步'
  return formatDate(lastSync, 'YYYY年MM月DD日 HH:mm')
})

const storageLocation = ref('')
const storageType = ref('')
const storageIsCustom = ref(false)
const storageSize = ref(null)
const backups = ref([])
const migrating = ref(false)
const showStorageMigrateConfirm = ref(false)
const showStorageResetConfirm = ref(false)
const pendingStorageDir = ref('')

async function loadStorageSize() {
  if (window.electronAPI?.getStorageSize) {
    try {
      storageSize.value = await window.electronAPI.getStorageSize()
    } catch (e) {
      storageSize.value = null
    }
  }
}

async function loadBackups() {
  if (window.electronAPI?.listBackups) {
    try {
      backups.value = await window.electronAPI.listBackups()
    } catch (e) {
      backups.value = []
    }
  }
}

onMounted(async () => {
  if (window.electronAPI?.getStorageInfo) {
    try {
      const info = await window.electronAPI.getStorageInfo()
      storageType.value = info.type
      storageLocation.value = info.dataDir || '本地应用数据目录'
      storageIsCustom.value = info.isCustom
    } catch (e) {
      storageLocation.value = '本地应用数据目录'
    }
  } else {
    storageType.value = 'web'
    storageLocation.value = '浏览器本地存储 (localStorage) · key: rgoose_note_data'
  }
  await loadStorageSize()
  await loadBackups()
})

const usageTotal = computed(() => {
  if (!storageSize.value) return 0
  const data = storageSize.value.dataFileSize != null ? storageSize.value.dataFileSize : storageSize.value.dataSize
  return (data || 0) + (storageSize.value.imagesDirSize || 0) + (storageSize.value.backupSize || 0)
})

const notesUsagePercent = computed(() => {
  if (!storageSize.value || usageTotal.value === 0) return 0
  const data = storageSize.value.dataFileSize != null ? storageSize.value.dataFileSize : storageSize.value.dataSize
  return ((data || 0) / usageTotal.value) * 100
})
const imagesUsagePercent = computed(() => {
  if (!storageSize.value || usageTotal.value === 0) return 0
  return ((storageSize.value.imagesDirSize || 0) / usageTotal.value) * 100
})
const backupUsagePercent = computed(() => {
  if (!storageSize.value || usageTotal.value === 0) return 0
  return ((storageSize.value.backupSize || 0) / usageTotal.value) * 100
})

function formatBackupTime(mtime) {
  const d = new Date(mtime)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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

async function openStorageLocation() {
  const target = storageLocation.value
  if (window.electronAPI?.openPath && target) {
    const res = await window.electronAPI.openPath(target)
    if (!res?.ok) toastError('无法打开：' + (res?.error || '路径不存在'))
  } else {
    toastError('当前环境不支持打开文件夹')
  }
}

async function openBackup(name) {
  if (window.electronAPI?.openBackup) {
    const res = await window.electronAPI.openBackup(name)
    if (!res?.ok) toastError('无法打开备份：' + (res?.error || '未知错误'))
  } else {
    toastError('当前环境不支持打开文件夹')
  }
}

async function openBackupsFolder() {
  if (window.electronAPI?.openBackupsFolder) {
    const res = await window.electronAPI.openBackupsFolder()
    if (!res?.ok) toastError('无法打开备份目录')
  } else {
    toastError('当前环境不支持打开文件夹')
  }
}

async function handleClearCache() {
  showClearCacheConfirm.value = true
}

async function confirmClearCache() {
  showClearCacheConfirm.value = false
  await noteStore.clearCache()
  noteStore.replaceAll([])
  noteStore.replaceAllFolders([])
  toastSuccess('本地缓存已清除')
  await loadStorageSize()
}

async function handleCreateBackup() {
  if (window.electronAPI?.createBackup) {
    const res = await window.electronAPI.createBackup()
    if (res?.ok) {
      toastSuccess('备份已生成')
      await loadBackups()
      await loadStorageSize()
    } else {
      toastError('备份失败：' + (res?.error || '未知错误'))
    }
  } else {
    toastError('当前环境不支持本地备份')
  }
}

async function handleDeleteBackup(name) {
  if (window.electronAPI?.deleteBackup) {
    const ok = await window.electronAPI.deleteBackup(name)
    if (ok) {
      toastSuccess('备份已删除')
      await loadBackups()
      await loadStorageSize()
    }
  }
}

async function handleChangeStorage() {
  if (!window.electronAPI?.pickDataDir || migrating.value) return
  const picked = await window.electronAPI.pickDataDir()
  if (!picked) return

  if (picked === storageLocation.value) {
    toastError('选择的新位置与当前位置相同')
    return
  }

  pendingStorageDir.value = picked
  showStorageMigrateConfirm.value = true
}

async function performChangeStorage() {
  showStorageMigrateConfirm.value = false
  const target = pendingStorageDir.value
  pendingStorageDir.value = ''
  if (!target) return

  migrating.value = true
  try {
    const res = await window.electronAPI.changeDataDir(target)
    if (res?.ok) {
      storageLocation.value = res.newDir
      storageIsCustom.value = true
      toastSuccess('数据迁移完成，建议重启应用以完全生效')
      await noteStore.flushPersist?.()
      await loadStorageSize()
    } else {
      toastError('迁移失败：' + (res?.error || '未知错误'))
    }
  } catch (e) {
    toastError('迁移失败：' + e.message)
  } finally {
    migrating.value = false
  }
}

async function handleResetStorage() {
  if (!window.electronAPI?.resetDataDir || migrating.value) return
  showStorageResetConfirm.value = true
}

async function performResetStorage() {
  showStorageResetConfirm.value = false
  migrating.value = true
  try {
    const res = await window.electronAPI.resetDataDir()
    if (res?.ok) {
      storageLocation.value = res.newDir
      storageIsCustom.value = false
      toastSuccess('已恢复默认存储位置')
      await loadStorageSize()
    } else {
      toastError('恢复失败：' + (res?.error || '未知错误'))
    }
  } catch (e) {
    toastError('恢复失败：' + e.message)
  } finally {
    migrating.value = false
  }
}

async function handleExport() {
  const baseData = {
    notes: noteStore.notes,
    folders: noteStore.folders,
    plans: planStore.plans,
    tags: tagStore.tags,
    exportedAt: Date.now(),
    version: '2.0.0'
  }

  const refs = collectImageRefsFromData(baseData)
  let imageBundle = {}
  try {
    imageBundle = await buildImageBundle(refs)
  } catch (e) {
    console.error('buildImageBundle failed:', e)
  }

  const payload = JSON.parse(JSON.stringify({
    ...baseData,
    images: imageBundle,
    imageCount: Object.keys(imageBundle).length
  }))

  try {
    if (window.electronAPI?.exportData) {
      const ok = await window.electronAPI.exportData(payload)
      if (!ok) {
        toastError('导出已取消')
        return
      }
    } else {
      exportAsJSON(payload)
    }
    toastSuccess(`数据已导出（含 ${payload.imageCount} 张图片）`)
  } catch (err) {
    toastError('导出失败：' + (err?.message || '未知错误'))
  }
}

function pickJSONFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) resolve(file)
      else reject(new Error('未选择文件'))
    }
    input.click()
  })
}

async function handleImport() {
  try {
    let data

    if (window.electronAPI?.importData) {
      data = await window.electronAPI.importData()
    } else {
      const file = await pickJSONFile()
      data = await importFromJSON(file)
    }

    if (data && typeof data === 'object') {
      if (!isAppFormatData(data)) {
        const noteSpec = buildNoteFromArbitraryJSON(data)
        if (noteSpec) {
          const created = noteStore.createNote(noteSpec.title)
          noteSpec.blocks.forEach(b => noteStore.addBlock(created.id, b))
          const rootFolder = noteStore.ensureSystemRootFolder()
          if (rootFolder) noteStore.moveNoteToFolder(created.id, rootFolder.id)
          noteStore.flushPersist()
          toastSuccess(`已根据 JSON 生成新笔记「${noteSpec.title}」，已放入「根目录」文件夹`)
          return
        }
      }
      pendingImportData.value = data
      showImportConfirm.value = true
    } else {
      toastError('导入失败：文件格式无效')
    }
  } catch (err) {
    if (err?.message === '未选择文件') return
    toastError('导入失败：' + (err?.message || '未知错误'))
  }
}

function placeOrphanNotesIntoRoot(importedNoteIds) {
  if (!importedNoteIds || !importedNoteIds.length) return 0
  const folderIds = new Set(noteStore.folders.filter(f => !f.deleted).map(f => f.id))
  const orphans = noteStore.notes.filter(n => importedNoteIds.has(n.id) && (!n.folderId || !folderIds.has(n.folderId)))
  if (!orphans.length) return 0
  const rootFolder = noteStore.ensureSystemRootFolder()
  if (!rootFolder) return 0
  orphans.forEach(n => noteStore.moveNoteToFolder(n.id, rootFolder.id))
  return orphans.length
}

async function confirmImport() {
  if (!pendingImportData.value) return

  try {
    const importData = pendingImportData.value
    let refMap = {}

    if (importData.images && typeof importData.images === 'object') {
      try {
        await restoreImageBundle(importData.images, refMap)
        remapImageRefsInData(importData, refMap)
      } catch (e) {
        console.error('restoreImageBundle failed:', e)
      }
    }

    const currentData = {
      notes: noteStore.notes,
      folders: noteStore.folders,
      plans: planStore.plans,
      tags: tagStore.tags
    }
    const beforeNoteIds = new Set(noteStore.notes.map(n => n.id))
    const mergedData = mergeData(currentData, importData)

    if (mergedData.folders) noteStore.replaceAllFolders(mergedData.folders)
    noteStore.replaceAll(mergedData.notes || [])
    planStore.replaceAll(mergedData.plans || [])
    tagStore.replaceAll(mergedData.tags || [])

    const importedNoteIds = new Set(noteStore.notes.filter(n => !beforeNoteIds.has(n.id)).map(n => n.id))
    const orphanCount = placeOrphanNotesIntoRoot(importedNoteIds)

    noteStore.setPendingPlans(mergedData.plans || [])
    noteStore.setPendingTags(mergedData.tags || [])
    await saveToStore(mergedData)
    noteStore.flushPersist()
    planStore.flushPersist()
    tagStore.flushPersist()

    showImportConfirm.value = false
    pendingImportData.value = null
    toastSuccess(orphanCount > 0 ? `数据导入完成，${orphanCount} 篇无父级的笔记已放入「根目录」文件夹` : '数据导入完成')
  } catch (err) {
    toastError('导入失败：' + (err?.message || '未知错误'))
  }
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

.total-usage {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
  margin-left: 6px;
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

.title-bar.bar-yellow {
  background: #d4b27a;
}

.storage-usage-item {
  flex-direction: column;
  align-items: stretch !important;
  gap: 8px;
}

.custom-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--primary-color, #6bbd8f);
  background: var(--primary-soft, #e8f3ec);
  border-radius: 999px;
  vertical-align: middle;
}

.storage-location-item .setting-info {
  max-width: 60%;
}

.storage-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.migrating-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--primary-color, #6bbd8f);
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--primary-soft, #e8f3ec);
  border-top-color: var(--primary-color, #6bbd8f);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.path-code {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 6px;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 11px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  word-break: break-all;
}

.storage-usage-bar {
  display: flex;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--bg-tertiary);
  margin-top: 4px;
}

.usage-segment {
  height: 100%;
  transition: width 0.4s ease;
}

.usage-segment.notes { background: var(--primary-color, #6bbd8f); }
.usage-segment.images { background: var(--secondary-color, #d4b27a); }
.usage-segment.backups { background: color-mix(in srgb, var(--text-tertiary, #999) 60%, transparent); }

.storage-usage-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 2px;
}

.usage-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-secondary);
}

.usage-tag::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.usage-tag.notes::before { background: var(--primary-color, #6bbd8f); }
.usage-tag.images::before { background: var(--secondary-color, #d4b27a); }
.usage-tag.backups::before { background: color-mix(in srgb, var(--text-tertiary, #999) 60%, transparent); }
.usage-tag.app::before { background: var(--info-color, #6ba6d9); }

.app-usage-line {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed var(--border-light);
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0 8px;
}

.backup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.backup-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 4px;
}


.backup-item:hover {
  background: var(--bg-hover);
}

.backup-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.backup-time {
  color: var(--text-primary);
  font-weight: 500;
}

.backup-size {
  color: var(--text-tertiary);
}

.action-icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  background: transparent;
  transition: all var(--transition-fast);
}

.action-icon-btn.secondary:hover {
  color: var(--secondary-color, #55d4f5);
  background: var(--secondary-soft, #f5f5f5);
}

.action-icon-btn.danger:hover {
  color: var(--warning-color, #d97676);
  background: var(--warning-soft, #fbecec);
}
</style>

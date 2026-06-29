import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  validateConfig,
  testConnection,
  pullRemote,
  pushRemote
} from '@/utils/cloudSync'
import { loadFromStorage, saveToStorage, mergeData } from '@/utils/storage'

const SYNC_CONFIG_KEY = 'rgoose_sync_config'

const DEFAULT_CONFIG = {
  enabled: true,
  type: 'gitee',
  gistConfig: {
    token: 'c68079df995e296a3b4b4c0afb4b362f',
    gistId: 'azo92ng7j0p1bf8x6tdhu12'
  },
  autoSync: true,
  autoSyncInterval: 60
}

function loadConfig() {
  try {
    const raw = localStorage.getItem(SYNC_CONFIG_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveConfig(config) {
  localStorage.setItem(SYNC_CONFIG_KEY, JSON.stringify(config))
}

export const useSyncStore = defineStore('sync', () => {
  const enabled = ref(false)
  const type = ref('gist')
  const gistConfig = ref({ token: '', gistId: '' })
  const webdavConfig = ref({ url: '', username: '', password: '' })
  const autoSync = ref(true)
  const autoSyncInterval = ref(60)
  const lastCloudSync = ref(0)
  const syncing = ref(false)
  const lastError = ref('')

  let autoTimer = null

  const isConfigured = computed(() => {
    if (!enabled.value) return false
    return !validateConfig(type.value, currentConfig.value)
  })

  const currentConfig = computed(() => {
    return type.value === 'webdav' ? webdavConfig.value : gistConfig.value
  })

  function init() {
    const saved = loadConfig()
    if (saved) {
      enabled.value = saved.enabled !== undefined ? !!saved.enabled : DEFAULT_CONFIG.enabled
      type.value = saved.type || DEFAULT_CONFIG.type
      const savedGist = saved.gistConfig || {}
      gistConfig.value = {
        token: savedGist.token?.trim() || DEFAULT_CONFIG.gistConfig.token,
        gistId: savedGist.gistId?.trim() || DEFAULT_CONFIG.gistConfig.gistId
      }
      webdavConfig.value = saved.webdavConfig || { url: '', username: '', password: '' }
      autoSync.value = saved.autoSync !== undefined ? saved.autoSync : DEFAULT_CONFIG.autoSync
      autoSyncInterval.value = saved.autoSyncInterval || DEFAULT_CONFIG.autoSyncInterval
      lastCloudSync.value = saved.lastCloudSync || 0
      persistConfig()
    } else {
      enabled.value = DEFAULT_CONFIG.enabled
      type.value = DEFAULT_CONFIG.type
      gistConfig.value = { ...DEFAULT_CONFIG.gistConfig }
      autoSync.value = DEFAULT_CONFIG.autoSync
      autoSyncInterval.value = DEFAULT_CONFIG.autoSyncInterval
      persistConfig()
    }
    restartAutoSync()
  }

  function persistConfig() {
    saveConfig({
      enabled: enabled.value,
      type: type.value,
      gistConfig: gistConfig.value,
      webdavConfig: webdavConfig.value,
      autoSync: autoSync.value,
      autoSyncInterval: autoSyncInterval.value,
      lastCloudSync: lastCloudSync.value
    })
  }

  function setEnabled(val) {
    enabled.value = !!val
    persistConfig()
    restartAutoSync()
  }

  function setType(val) {
    type.value = val
    persistConfig()
  }

  function updateGistConfig(patch) {
    gistConfig.value = { ...gistConfig.value, ...patch }
    persistConfig()
  }

  function updateWebdavConfig(patch) {
    webdavConfig.value = { ...webdavConfig.value, ...patch }
    persistConfig()
  }

  function setAutoSync(val) {
    autoSync.value = !!val
    persistConfig()
    restartAutoSync()
  }

  function setAutoSyncInterval(val) {
    autoSyncInterval.value = Math.max(10, Number(val) || 60)
    persistConfig()
    restartAutoSync()
  }

  async function test() {
    const err = validateConfig(type.value, currentConfig.value)
    if (err) throw new Error(err)
    return testConnection(type.value, currentConfig.value)
  }

  async function push(noteStore, planStore) {
    if (!enabled.value) return false
    lastError.value = ''
    syncing.value = true
    try {
      const payload = {
        folders: noteStore.folders,
        notes: noteStore.notes,
        plans: planStore.plans,
        pushedAt: Date.now(),
        version: '1.0.0'
      }
      const result = await pushRemote(type.value, currentConfig.value, payload)
      if ((type.value === 'gist' || type.value === 'gitee') && result.gistId && result.gistId !== gistConfig.value.gistId) {
        updateGistConfig({ gistId: result.gistId })
      }
      lastCloudSync.value = Date.now()
      persistConfig()
      return true
    } catch (e) {
      lastError.value = e.message
      throw e
    } finally {
      syncing.value = false
    }
  }

  async function pull(noteStore, planStore) {
    if (!enabled.value) return false
    lastError.value = ''
    syncing.value = true
    try {
      const remote = await pullRemote(type.value, currentConfig.value)
      const local = loadFromStorage() || {
        folders: noteStore.folders,
        notes: noteStore.notes,
        plans: planStore.plans
      }
      const merged = mergeData(local, remote)
      saveToStorage(merged)
      if (merged.folders) noteStore.replaceAllFolders(merged.folders)
      if (merged.notes) noteStore.replaceAll(merged.notes)
      if (merged.plans) planStore.replaceAll(merged.plans)
      lastCloudSync.value = Date.now()
      persistConfig()
      return true
    } catch (e) {
      lastError.value = e.message
      throw e
    } finally {
      syncing.value = false
    }
  }

  async function sync(noteStore, planStore) {
    if (!enabled.value) return false
    try {
      await pull(noteStore, planStore)
      await push(noteStore, planStore)
      return true
    } catch (e) {
      lastError.value = e.message
      return false
    }
  }

  function restartAutoSync() {
    if (autoTimer) {
      clearInterval(autoTimer)
      autoTimer = null
    }
    if (enabled.value && autoSync.value) {
      const ms = Math.max(10, autoSyncInterval.value) * 1000
      autoTimer = setInterval(() => {
        // 注意：这里无法直接拿到 store，由 App 层注入回调
        if (typeof window.__rgooseAutoSync === 'function') {
          window.__rgooseAutoSync()
        }
      }, ms)
    }
  }

  function bindAutoSync(fn) {
    window.__rgooseAutoSync = fn
  }

  return {
    enabled,
    type,
    gistConfig,
    webdavConfig,
    autoSync,
    autoSyncInterval,
    lastCloudSync,
    syncing,
    lastError,
    isConfigured,
    currentConfig,
    init,
    setEnabled,
    setType,
    updateGistConfig,
    updateWebdavConfig,
    setAutoSync,
    setAutoSyncInterval,
    test,
    push,
    pull,
    sync,
    bindAutoSync
  }
})

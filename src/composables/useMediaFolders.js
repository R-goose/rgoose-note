import { ref, computed } from 'vue'

const STORAGE_KEY_FOLDERS = 'media_folders'
const STORAGE_KEY_MAP = 'media_folder_map'

// 文件夹列表
const folders = ref([])
// ref -> folderId 的映射
const folderMap = ref({})
// 当前所在文件夹（null = 根目录）
const currentFolderId = ref(null)

let initialized = false

function init() {
  if (initialized) return
  initialized = true
  try {
    folders.value = JSON.parse(localStorage.getItem(STORAGE_KEY_FOLDERS) || '[]')
    folderMap.value = JSON.parse(localStorage.getItem(STORAGE_KEY_MAP) || '{}')
  } catch {
    folders.value = []
    folderMap.value = {}
  }
}

function save() {
  localStorage.setItem(STORAGE_KEY_FOLDERS, JSON.stringify(folders.value))
  localStorage.setItem(STORAGE_KEY_MAP, JSON.stringify(folderMap.value))
}

function genId() {
  return 'mf_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

export function useMediaFolders() {
  init()

  // 当前层级子文件夹
  const childFolders = computed(() =>
    folders.value
      .filter(f => f.parentId === currentFolderId.value)
      .sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0))
  )

  // 当前面包屑路径
  const breadcrumb = computed(() => {
    const trail = []
    let cur = currentFolderId.value
    while (cur) {
      const f = folders.value.find(x => x.id === cur)
      if (!f) break
      trail.unshift(f)
      cur = f.parentId
    }
    return trail
  })

  function createFolder(name = '新建文件夹') {
    const folder = {
      id: genId(),
      name,
      parentId: currentFolderId.value,
      createdAt: Date.now()
    }
    folders.value.push(folder)
    save()
    return folder
  }

  function renameFolder(id, name) {
    const f = folders.value.find(x => x.id === id)
    if (f) {
      f.name = name
      save()
    }
  }

  function deleteFolder(id) {
    // 递归收集所有子孙文件夹
    const toDelete = new Set([id])
    let changed = true
    while (changed) {
      changed = false
      for (const f of folders.value) {
        if (toDelete.has(f.parentId) && !toDelete.has(f.id)) {
          toDelete.add(f.id)
          changed = true
        }
      }
    }
    // 删除文件夹
    folders.value = folders.value.filter(f => !toDelete.has(f.id))
    // 清除被删文件夹下的素材映射（素材本身不删，回到根目录）
    for (const key of Object.keys(folderMap.value)) {
      if (toDelete.has(folderMap.value[key])) {
        delete folderMap.value[key]
      }
    }
    // 如果当前在被删文件夹内，退回根目录
    if (toDelete.has(currentFolderId.value)) {
      currentFolderId.value = null
    }
    save()
  }

  function enterFolder(id) {
    currentFolderId.value = id
  }

  // 获取素材的 folderId
  function getMediaFolder(ref) {
    return folderMap.value[ref] || null
  }

  // 设置素材的 folderId
  function setMediaFolder(ref, folderId) {
    if (folderId) {
      folderMap.value[ref] = folderId
    } else {
      delete folderMap.value[ref]
    }
    save()
  }

  // 获取文件夹下素材数量
  function getFolderItemCount(folderId) {
    return Object.values(folderMap.value).filter(fid => fid === folderId).length
  }

  return {
    folders,
    currentFolderId,
    childFolders,
    breadcrumb,
    createFolder,
    renameFolder,
    deleteFolder,
    enterFolder,
    getMediaFolder,
    setMediaFolder,
    getFolderItemCount
  }
}

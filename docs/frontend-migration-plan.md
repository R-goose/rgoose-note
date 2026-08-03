# R-Goose Note 前端改造方案（本地存储 → HTTP API）

> 版本：v2.0 ｜ 配套文档：[backend-development.md](./backend-development.md)
> 目标：将前端从「localStorage + IndexedDB + 文件系统」改造为「HTTP API 调用云端 Spring Boot + MySQL 服务」

---

## 目录

1. [改造目标与原则](#1-改造目标与原则)
2. [现状分析](#2-现状分析)
3. [改造后架构](#3-改造后架构)
4. [新增 src/api 调用层](#4-新增-srcapi-调用层)
5. [noteStore 改造](#5-notestore-改造)
6. [imageStore 改造](#6-imagestore-改造)
7. [其余 Store 改造](#7-其余-store-改造)
8. [启动与初始化流程](#8-启动与初始化流程)
9. [一次性数据迁移](#9-一次性数据迁移)
10. [离线兼容策略（可选）](#10-离线兼容策略可选)
11. [分阶段实施计划](#11-分阶段实施计划)
12. [改动清单速查](#12-改动清单速查)

---

## 1. 改造目标与原则

### 1.1 目标

- 数据读写从本地存储切换为调用后端 REST API。
- 支持多端同步（基于后端增量同步接口）。
- 保持现有 UI 组件、交互逻辑基本不变，只替换「数据来源 / 落盘方式」。
- 支持旧数据一次性迁移到云端。

### 1.2 原则

| 原则 | 说明 |
|---|---|
| **最小侵入** | Store 对外暴露的 state/computed 保持不变，视图层几乎零改动。只改 Store 内部的 `init / persist / load` 等方法。 |
| **集中收口** | 所有 HTTP 调用收敛到 `src/api/`，Store 不直接写 `fetch`，便于替换、Mock、加 token。 |
| **渐进切换** | 改造期间保留本地存储代码（通过开关切换），验证无误后再删除。 |
| **字段对齐** | 前端字段名（camelCase）与后端（snake_case）由 API 层统一转换，Store 感知不到差异。 |

---

## 2. 现状分析

当前前端为纯本地架构，核心持久化链路：

```
视图变更 → noteStore.persist()  (500ms 防抖)
              → doPersist()
                 → saveToStore()
                    ├─ Electron: electronAPI.writeDataFile(data)  → data.json
                    └─ 浏览器:   localStorage.setItem(...)
```

涉及的关键文件及其职责：

| 文件 | 现职责 | 改造影响 |
|---|---|---|
| `src/stores/note.js` | 持久化中枢，防抖写盘 + 缓存 plans/tags | **重灾区**：persist 改为调 API |
| `src/stores/plan.js` | 通过 `setPendingPlans` 委托 noteStore | 改为调 planApi |
| `src/stores/tag.js` | 通过 `setPendingTags` 委托 noteStore | 改为调 tagApi |
| `src/stores/theme.js` | localStorage（偏好） | 不变（偏好仍存本地） |
| `src/stores/shortcut.js` | localStorage（偏好） | 不变 |
| `src/utils/storage.js` | 本地读写、合并、迁移 | 降级为「离线缓存」或删除 |
| `src/utils/imageStore.js` | IndexedDB/文件读写 | **重灾区**：改为 upload/download |

---

## 3. 改造后架构

```
┌──────────────────────────────────────────────────────────┐
│                  视图层 views/* （基本不变）                │
├──────────────────────────────────────────────────────────┤
│              Pinia Store 层（对外接口不变）                 │
│   noteStore    planStore    tagStore    theme/shortcut    │
│      │ init/persist 内部改造为调 api                       │
├──────────────────────────────────────────────────────────┤
│            src/api/*  (新增 HTTP 调用层)                   │
│   client.js  noteApi  planApi  tagApi  imageApi  syncApi │
│      │                                                    │
│      │ 统一：baseURL / 错误处理 / 字段映射 / token(预留)    │
├──────────────────────────────────────────────────────────┤
│   fetch() ──HTTPS──▶ Spring Boot 后端 ──▶ MySQL           │
└──────────────────────────────────────────────────────────┘

保留本地：theme/shortcut/bg_*/plan_reminded 等偏好仍在 localStorage
```

---

## 4. 新增 src/api 调用层

### 4.1 目录结构

```
src/api/
├── client.js          # fetch 封装：baseURL、统一响应解析、错误处理
├── folders.js         # 文件夹 API
├── notes.js           # 笔记 API
├── plans.js           # 计划 API
├── tags.js            # 标签 API
└── images.js          # 媒体上传/下载 API
```

### 4.2 client.js 封装

```js
// src/api/client.js
const BASE_URL = import.meta.env.VITE_API_BASE || '/api'

/**
 * 统一请求封装
 * - 自动 JSON 序列化
 * - 解析后端统一响应体 { code, msg, data }
 * - code !== 0 抛错，调用方 try/catch
 */
export async function request(path, options = {}) {
  const url = path.startsWith('http') ? path : BASE_URL + path
  const opts = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  }
  // token 预留：未来加认证时在此注入 header
  // const token = localStorage.getItem('rgoose_token')
  // if (token) opts.headers.Authorization = `Bearer ${token}`

  const res = await fetch(url, opts)
  if (res.status === 204) return null

  const contentType = res.headers.get('content-type') || ''
  // 二进制流（图片下载）直接返回
  if (contentType.includes('application/octet-stream') || contentType.startsWith('image/')) {
    return res
  }

  const body = await res.json()
  if (body.code !== 0) {
    const err = new Error(body.msg || '请求失败')
    err.code = body.code
    err.httpStatus = res.status
    throw err
  }
  return body.data
}

export const http = {
  get:    (path, params) => request(path + (params ? '?' + new URLSearchParams(params) : '')),
  post:   (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put:    (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch:  (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' })
}
```

### 4.3 资源 API 模块示例

```js
// src/api/notes.js
import { http } from './client'

export const noteApi = {
  list:   (params) => http.get('/notes', params),
  get:    (id) => http.get(`/notes/${id}`),
  create: (note) => http.post('/notes', note),
  update: (id, note) => http.put(`/notes/${id}`, note),
  remove: (id) => http.delete(`/notes/${id}`),
  duplicate: (id) => http.post(`/notes/${id}/duplicate`),

  // 画布块（嵌套资源）
  listBlocks:      (noteId) => http.get(`/notes/${noteId}/blocks`),
  createBlock:     (noteId, block) => http.post(`/notes/${noteId}/blocks`, block),
  updateBlock:     (noteId, blockId, block) => http.put(`/notes/${noteId}/blocks/${blockId}`, block),
  batchUpdateBlocks: (noteId, blocks) => http.post(`/notes/${noteId}/blocks/batch`, blocks),
  deleteBlock:     (noteId, blockId) => http.delete(`/notes/${noteId}/blocks/${blockId}`),

  // 连线
  listConnections:    (noteId) => http.get(`/notes/${noteId}/connections`),
  createConnection:   (noteId, conn) => http.post(`/notes/${noteId}/connections`, conn),
  updateConnection:   (noteId, connId, conn) => http.put(`/notes/${noteId}/connections/${connId}`, conn),
  deleteConnection:   (noteId, connId) => http.delete(`/notes/${noteId}/connections/${connId}`)
}
```

> plans / tags / folders 模块结构类似，按后端 [资源 API 详解](./backend-development.md#5-资源-api-详解) 一一封装。

### 4.4 环境变量

`.env.development`：
```
VITE_API_BASE=http://localhost:8080/api
```

`.env.production`：留空走相对路径 `/api`（由 Nginx 反代）。

---

## 5. noteStore 改造

noteStore 是改造核心。**对外 state/computed 不变**，只改内部 `init`、`persist` 及各增删改方法。

### 5.1 总体思路

| 原方法 | 原逻辑 | 新逻辑 |
|---|---|---|
| `init()` | `loadFromStore()` 读本地 | `syncApi.pullAll()` 拉取全量 |
| `persist()` | 防抖 `doPersist()` 写盘 | 删除（写操作直接调 API） |
| `doPersist()` | 组装 JSON 落盘 | 删除 |
| `createNote()` | push 后 `persist()` | push 后 `noteApi.create()` |
| `updateNote()` | assign 后 `persist()` | assign 后 `noteApi.update()` |
| `deleteNote()` | 软删 `persist()` | 软删 `noteApi.remove()` |
| `addBlock()` 等 | `persist()` | 对应 block API |

### 5.2 init 改造

```js
// stores/note.js（改造后）
import { syncApi } from '@/api/sync'

async function init() {
  if (initPromise) return initPromise
  initPromise = (async () => {
    const data = await syncApi.pullAll()    // 拉取全量 {folders, notes, plans, tags}
    notes.value = data.notes || []
    folders.value = data.folders || []
    planStoreHydrate(data.plans || [])       // 注入 planStore
    tagStoreHydrate(data.tags || [])
    ensureSystemRootFolder()
    lastSyncTime.value = data.serverTime || Date.now()
  })()
  return initPromise
}
```

> `ensureSystemRootFolder()` 保留：若云端无 system-root，则创建并 POST。

### 5.3 移除防抖中枢

原 `persist / flushPersist / doPersist / setPendingPlans / setPendingTags / cachedPlans / cachedTags` **全部删除**。planStore / tagStore 不再依赖 noteStore 落盘，各自调 API。

### 5.4 写操作改造示例

```js
function createNote(title = '新笔记', folderId = null) {
  const now = getTimestamp()
  const note = {
    id: generateId(),
    title,
    folderId: folderId || currentFolderId.value || null,
    tags: [],
    blocks: [],
    connections: [],
    canvasConfig: { zoom: 1, offsetX: 0, offsetY: 0 },
    createdAt: now,
    updatedAt: now
  }
  notes.value.unshift(note)
  // 异步落库，失败回滚 unshift
  noteApi.create(note).catch(err => {
    notes.value = notes.value.filter(n => n.id !== note.id)
    showError('创建笔记失败', err)
  })
  return note
}

function updateNote(id, updates) {
  const note = notes.value.find(n => n.id === id)
  if (!note) return
  Object.assign(note, updates, { updatedAt: getTimestamp() })
  noteApi.update(id, note)              // 防抖可选，见 5.5
}
```

### 5.5 画布拖拽的防抖优化

块拖拽会高频触发 `updateBlock`。为避免请求风暴，在 NoteEditorView 中**收集变更 + 防抖批量提交**：

```js
// NoteEditorView.vue
const pendingBlocks = new Map()   // blockId -> 最新 block 快照
let batchTimer = null

function scheduleBlockSave(block) {
  pendingBlocks.set(block.id, { ...block })
  if (batchTimer) return
  batchTimer = setTimeout(() => {
    const payload = Array.from(pendingBlocks.values())
    pendingBlocks.clear()
    batchTimer = null
    noteApi.batchUpdateBlocks(noteId, payload)   // /blocks/batch
  }, 500)
}
```

这样把原来「防抖写盘」的优化迁移到「防抖批量调 API」，请求量可控。

### 5.6 错误处理与回滚

每个写操作都要处理失败：
- **乐观更新**：先改本地 state 再调 API。
- **失败回滚**：catch 中撤销本地改动，Toast 提示。
- 提供统一 helper（如 `useToast().error()`）。

建议封装一个 `optimistic` 工具：

```js
// utils/api.js
export async function optimistic(apply, rollback, apiCall) {
  apply()
  try {
    await apiCall()
  } catch (err) {
    rollback()
    showError('操作失败', err)
  }
}
```

---

## 6. imageStore 改造

imageStore 从「IndexedDB/本地文件」改为「上传/下载到后端」。**对外 API 签名保持不变**，视图层无感。

### 6.1 改造对照

| 函数 | 原实现 | 新实现 |
|---|---|---|
| `saveImage(dataUrl)` | IndexedDB put / 文件写入 | dataUrl → Blob → `imageApi.upload()` → 返回 ref |
| `resolveImageUrl(ref)` | IndexedDB get / 绝对路径 | 直接返回 `${BASE}/images/${ref}`（浏览器直接请求） |
| `resolveImageUrlSync(ref)` | 命中缓存 | 返回 URL 字符串（同步可得，无需缓存） |
| `preloadImages(refs[])` | 批量 IndexedDB get | **可移除**（直接用 URL，无加载成本） |
| `deleteImage(ref)` | IndexedDB delete / 文件删除 | `imageApi.delete(ref)` |
| `getImageAsDataUrl(ref)` | IndexedDB get | fetch ref → blob → FileReader |

### 6.2 改造后的 saveImage

```js
// utils/imageStore.js（改造后）
import { imageApi } from '@/api/images'

export async function saveImage(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return dataUrl
  if (!/^data:(image|audio|video)\//.test(dataUrl)) return dataUrl

  // dataUrl → Blob
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const ref = await imageApi.upload(blob)   // multipart 上传
  return ref
}

export function resolveImageUrl(ref) {
  if (!ref || typeof ref !== 'string') return ref
  if (ref.startsWith('data:') || ref.startsWith('http')) return ref
  if (!isImageRef(ref)) return ref
  return `${BASE_URL}/images/${ref}`        // 直接拼 URL，浏览器按需请求
}

export function resolveImageUrlSync(ref) {
  return resolveImageUrl(ref)               // 现在是纯同步字符串拼接
}
```

### 6.3 收益

- 移除 IndexedDB 依赖与 `_urlCache`，代码大幅简化。
- 图片直接走 HTTP，浏览器自带缓存（配合后端 ETag/Last-Modified 更佳）。
- `preloadImages` 可删除（无加载成本）。

### 6.4 导入导出引用重映射

原 `collectImageRefsFromData / buildImageBundle / restoreImageBundle / remapImageRefsInData` 逻辑**保留**——一次性迁移和导入导出时仍需用 ref 打包上传到后端。

---

## 7. 其余 Store 改造

### 7.1 planStore

```js
// 移除：import { useNoteStore }、setPendingPlans、persist 委托
// 新增：直接调 planApi

function createPlan(title, options = {}) {
  const plan = { id: generateId(), title, /* ... */ }
  plans.value.unshift(plan)
  planApi.create(plan)
  return plan
}
function toggleComplete(id) {
  const plan = plans.value.find(p => p.id === id)
  if (plan) {
    plan.completed = !plan.completed
    plan.updatedAt = getTimestamp()
    planApi.update(id, plan)     // 或 planApi.patchComplete(id)
  }
}
```

提醒机制（`checkReminders`、`showReminder`、定时器）**完全保留**，与存储无关。

### 7.2 tagStore

```js
function createTag(name, color) {
  const tag = { id: generateId(), name: trimmed, color, /* ... */ }
  tags.value.push(tag)
  tagApi.create(tag)
  return tag
}
function deleteTag(id) {
  // 后端 DELETE 会从 notes/folders/plans 的 tags JSON 列中移除该 tagId
  // 前端只需同步清理本地 state
  tags.value = tags.value.filter(t => t.id !== id)
  tagApi.remove(id)
  // 清理本地 notes/folders 的 tagId 引用（保持响应即时）
  useNoteStore().notes.forEach(n => { if (n.tags?.includes(id)) n.tags = n.tags.filter(t => t !== id) })
}
```

### 7.3 themeStore / shortcutStore

**不变**。主题、快捷键、画布背景等是「设备级偏好」，继续存 localStorage，不同步到云端（每台设备可以有不同主题）。

---

## 8. 启动与初始化流程

改造后 `App.vue` 的初始化：

```
App.vue onMounted
  ├─ themeStore.init()          // 不变（localStorage）
  ├─ shortcutStore.init()       // 不变（localStorage）
  ├─ noteStore.init()           // 改为调 syncApi.pullAll()
  │     ├─ GET /api/sync?since=0   （全量拉取）
  │     ├─ 填充 notes/folders
  │     ├─ 注入 plans/tags 到对应 store
  │     └─ ensureSystemRootFolder()
  ├─ planStore.init()           // 只启动提醒定时器（数据已由 noteStore 注入）
  └─ tagStore.init()            // 空操作或校验（数据已注入）
```

> 建议保留 `noteStore.init` 作为统一加载入口，planStore/tagStore 改为「被动 hydrate」模式，避免重复请求。

### 增量同步轮询

可选：开启后台定时增量同步（拉取其他端的变更）：

```js
// App.vue
onMounted(() => {
  const timer = setInterval(async () => {
    const data = await syncApi.pullAll({ since: lastSyncTime.value })
    mergeRemote(data)               // 合并到本地 state（参考原 mergeData 思路）
    lastSyncTime.value = data.serverTime
  }, 60000)                          // 每分钟
  onUnmounted(() => clearInterval(timer))
})
```

`mergeRemote` 复用原 `storage.js` 的 `mergeData` 逻辑（updatedAt 比较 + 软删除恢复），只是数据来源从文件变为 API。

---

## 9. 一次性数据迁移

老用户本地有数据，需迁移到云端。

### 9.1 迁移流程

```
首次连接后端（检测到云端为空且本地有数据）
  ↓
读取本地 data.json / localStorage.rgoose_note_data
  ↓
POST /api/data/import （后端解析旧格式，按 updatedAt 写入各表）
  ↓
批量上传图片：
  遍历所有 block 的 image/media ref
  → getImageAsDataUrl(ref) 从 IndexedDB/文件读出
  → imageApi.upload(blob) 上传到后端
  ↓
标记迁移完成（localStorage.rgoose_migrated_to_cloud = '1'）
  ↓
清空本地 IndexedDB / data.json（可选，保留作为备份）
```

### 9.2 迁移工具实现位置

新建 `src/utils/migrateToCloud.js`：

```js
import { loadFromStore } from '@/utils/storage'
import { dataApi } from '@/api/data'
import { collectImageRefsFromData, getImageAsDataUrl, imageApi } from '@/utils/imageStore'

export async function migrateLocalToCloud() {
  if (localStorage.getItem('rgoose_migrated_to_cloud') === '1') return false

  const local = await loadFromStore()
  if (!local?.notes?.length) { markDone(); return false }

  // 1. 结构化数据导入
  await dataApi.import(local)

  // 2. 图片批量上传
  const refs = collectImageRefsFromData(local)
  for (const ref of refs) {
    const dataUrl = await getImageAsDataUrl(ref)
    if (!dataUrl) continue
    const blob = await (await fetch(dataUrl)).blob()
    await imageApi.upload(blob, ref)   // 用原 ref 作为上传标识，避免改 block
  }

  markDone()
  return true
}
```

> 让后端 upload 接口接受自定义 ref（覆盖式上传），可避免重映射 block 中的引用。

### 9.3 迁移时机

在 `noteStore.init()` 开头、`pullAll` 之前判断：

```js
async function init() {
  await migrateLocalToCloud()   // 先迁移本地数据到云端
  const data = await syncApi.pullAll()
  // ...
}
```

---

## 10. 离线兼容策略（可选）

若仍需断网可用（如 Electron 移动办公场景），可保留本地 IndexedDB 作为**离线缓存层**，形成「云为主、本地缓存」的混合模式。

### 10.1 方案

- 正常在线：所有写操作直接调 API。
- 写操作同时写入本地 IndexedDB 缓存（异步，不阻塞）。
- 检测到离线（`navigator.onLine === false`）：写操作只写本地，进入「待同步队列」。
- 恢复在线：按队列顺序回放调 API。

### 10.2 复杂度评估

此方案复杂度高（需处理冲突、重试、顺序），**建议 v2.0 先不做**，纯云端保证可用性（内网部署基本不会断网）。后续按需引入。

---

## 11. 分阶段实施计划

| 阶段 | 内容 | 验证 |
|---|---|---|
| **阶段 0** | 后端搭建：建表、基础 CRUD、Swagger | Postman/curl 验证各 API |
| **阶段 1** | 前端新增 `src/api/` 层，先不改 Store | 单独调用 API 跑通 |
| **阶段 2** | 改造 noteStore（init + 增删改），其余 Store 暂不动 | 笔记 CRUD 走云端 |
| **阶段 3** | 改造 planStore / tagStore | 计划、标签走云端 |
| **阶段 4** | 改造 imageStore | 图片上传/显示走云端 |
| **阶段 5** | 实现一次性迁移工具 | 本地数据迁入云端 |
| **阶段 6** | 删除 storage.js / IndexedDB 死代码 | 构建通过、回归测试 |
| **阶段 7** | 增量同步轮询（可选） | 多端同步验证 |

---

## 12. 改动清单速查

### 新增文件

| 文件 | 用途 |
|---|---|
| `src/api/client.js` | fetch 封装 |
| `src/api/folders.js` | 文件夹 API |
| `src/api/notes.js` | 笔记 + 块 + 连线 API |
| `src/api/plans.js` | 计划 API |
| `src/api/tags.js` | 标签 API |
| `src/api/images.js` | 媒体 API |
| `src/api/sync.js` | 增量同步 API |
| `src/utils/migrateToCloud.js` | 一次性迁移工具 |
| `.env.development` / `.env.production` | API base 配置 |

### 修改文件

| 文件 | 改动 |
|---|---|
| `src/stores/note.js` | 重写 init/persist，移除防抖中枢 |
| `src/stores/plan.js` | persist 委托 → 直接调 planApi |
| `src/stores/tag.js` | persist 委托 → 直接调 tagApi |
| `src/utils/imageStore.js` | IndexedDB → HTTP upload/download |
| `src/views/NoteEditorView.vue` | 块保存改为防抖批量 batch API |
| `src/App.vue` | init 调用链调整，可选加同步轮询 |
| `vite.config.js` | 开发代理 `/api` |
| `package.json` | 版本号 → 2.0.0 |

### 删除/废弃文件

| 文件 | 处理 |
|---|---|
| `src/utils/storage.js` | 阶段 6 删除（迁移工具用完即弃） |
| `electron/main.cjs` 数据相关 IPC | 云端模式下 data.json/images IPC 不再需要，窗口/备份 IPC 按需保留 |

### 不变文件

| 文件 | 原因 |
|---|---|
| `src/stores/theme.js` / `shortcut.js` | 设备级偏好，留 localStorage |
| `src/utils/index.js` / `markdown.js` / `jsonAdapter.js` | 纯逻辑工具 |
| `src/composables/*` | 与存储无关 |
| `src/router/index.js` | 路由不变 |
| 所有 `views/*` / `components/*` | Store 对外接口不变，视图无感 |

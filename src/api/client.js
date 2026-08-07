/**
 * HTTP / IPC 双模客户端
 * - Electron 环境：走 IPC 通道（性能最佳）
 * - 浏览器环境：走 HTTP（开发调试）
 * - 自动路由：将 RESTful 路径映射到 backend:* IPC 通道
 */

const isElectron = typeof window !== 'undefined' && !!window.electronAPI?.backend
const BASE_URL = '/api'

/**
 * 路由表：method + pattern → IPC 通道
 * pattern 用 :param 标记路径参数
 * build(pathParams, body, query) 返回 IPC 调用参数数组
 */
const routes = [
  // ---------- Notes ----------
  { m: 'GET',    p: '/notes',                  c: 'backend:notes:list',      b: (_p, _b, q) => [q || {}] },
  { m: 'GET',    p: '/notes/all',              c: 'backend:notes:listAll' },
  { m: 'GET',    p: '/notes/:id',              c: 'backend:notes:get',       b: (p) => [p.id] },
  { m: 'POST',   p: '/notes',                  c: 'backend:notes:create',    b: (_p, body) => [body] },
  { m: 'PUT',    p: '/notes/:id',              c: 'backend:notes:update',    b: (p, body) => [{ id: p.id, note: body }] },
  { m: 'PATCH',  p: '/notes/:id/tags',         c: 'backend:notes:updateTags', b: (p, body) => [{ id: p.id, tags: body.tags }] },
  { m: 'DELETE', p: '/notes/:id',              c: 'backend:notes:delete',    b: (p) => [p.id] },
  { m: 'POST',   p: '/notes/:id/duplicate',    c: 'backend:notes:duplicate', b: (p) => [p.id] },

  // ---------- Blocks ----------
  // 注意：batch 必须在 :blockId 之前匹配，否则会被 :blockId 误捕获
  { m: 'POST',   p: '/notes/:noteId/blocks/batch',     c: 'backend:blocks:batch',  b: (p, body) => [{ noteId: p.noteId, blocks: body }] },
  { m: 'GET',    p: '/notes/:noteId/blocks',           c: 'backend:blocks:list',   b: (p) => [p.noteId] },
  { m: 'POST',   p: '/notes/:noteId/blocks',           c: 'backend:blocks:create', b: (p, body) => [{ noteId: p.noteId, block: body }] },
  { m: 'PUT',    p: '/notes/:noteId/blocks/:blockId',  c: 'backend:blocks:update', b: (p, body) => [{ noteId: p.noteId, blockId: p.blockId, block: body }] },
  { m: 'DELETE', p: '/notes/:noteId/blocks/:blockId',  c: 'backend:blocks:delete', b: (p) => [{ noteId: p.noteId, blockId: p.blockId }] },

  // ---------- Connections ----------
  { m: 'GET',    p: '/notes/:noteId/connections',          c: 'backend:connections:list',   b: (p) => [p.noteId] },
  { m: 'POST',   p: '/notes/:noteId/connections',          c: 'backend:connections:create', b: (p, body) => [{ noteId: p.noteId, conn: body }] },
  { m: 'PUT',    p: '/notes/:noteId/connections/:connId',  c: 'backend:connections:update', b: (p, body) => [{ noteId: p.noteId, connId: p.connId, conn: body }] },
  { m: 'DELETE', p: '/notes/:noteId/connections/:connId',  c: 'backend:connections:delete', b: (p) => [{ noteId: p.noteId, connId: p.connId }] },

  // ---------- Folders ----------
  { m: 'GET',    p: '/folders',          c: 'backend:folders:list',     b: (_p, _b, q) => [q?.parentId] },
  { m: 'GET',    p: '/folders/all',      c: 'backend:folders:listAll' },
  { m: 'GET',    p: '/folders/:id',      c: 'backend:folders:get',      b: (p) => [p.id] },
  { m: 'POST',   p: '/folders',          c: 'backend:folders:create',   b: (_p, body) => [body] },
  { m: 'PUT',    p: '/folders/:id',      c: 'backend:folders:update',   b: (p, body) => [{ id: p.id, folder: body }] },
  { m: 'PATCH',  p: '/folders/:id/tags', c: 'backend:folders:updateTags', b: (p, body) => [{ id: p.id, tags: body.tags }] },
  { m: 'DELETE', p: '/folders/:id',      c: 'backend:folders:delete',   b: (p) => [p.id] },

  // ---------- Plans ----------
  { m: 'GET',    p: '/plans',            c: 'backend:plans:list',         b: (_p, _b, q) => [normalizePlanQuery(q)] },
  { m: 'GET',    p: '/plans/all',        c: 'backend:plans:listAll' },
  { m: 'GET',    p: '/plans/:id',        c: 'backend:plans:get',          b: (p) => [p.id] },
  { m: 'POST',   p: '/plans',            c: 'backend:plans:create',       b: (_p, body) => [body] },
  { m: 'PUT',    p: '/plans/:id',        c: 'backend:plans:update',       b: (p, body) => [{ id: p.id, plan: body }] },
  { m: 'DELETE', p: '/plans/:id',        c: 'backend:plans:delete',       b: (p) => [p.id] },
  { m: 'PATCH',  p: '/plans/:id/complete', c: 'backend:plans:toggleComplete', b: (p) => [p.id] },

  // ---------- Tags ----------
  { m: 'GET',    p: '/tags',             c: 'backend:tags:list' },
  { m: 'GET',    p: '/tags/:id',         c: 'backend:tags:get',    b: (p) => [p.id] },
  { m: 'POST',   p: '/tags',             c: 'backend:tags:create', b: (_p, body) => [body] },
  { m: 'PUT',    p: '/tags/:id',         c: 'backend:tags:update', b: (p, body) => [{ id: p.id, tag: body }] },
  { m: 'DELETE', p: '/tags/:id',         c: 'backend:tags:delete', b: (p) => [p.id] },

  // ---------- Images (listRefs / delete) ----------
  { m: 'GET',    p: '/images',           c: 'backend:images:listRefs' },
  { m: 'DELETE', p: '/images/:ref',      c: 'backend:images:delete', b: (p) => [decodeURIComponent(p.ref)] },

  // ---------- Sync / Data ----------
  { m: 'GET',    p: '/sync',             c: 'backend:sync:pull',       b: (_p, _b, q) => [Number(q?.since) || 0] },
  { m: 'GET',    p: '/data/export',      c: 'backend:sync:exportAll' },
  { m: 'POST',   p: '/data/import',      c: 'backend:sync:importAll',  b: (_p, body) => [body] },
  { m: 'DELETE', p: '/data/all',         c: 'backend:sync:clearAll' }
]

/** plans.list 查询参数类型规范化（兼容字符串与原始类型） */
function normalizePlanQuery(q) {
  if (!q) return {}
  const out = {}
  if (q.completed != null && q.completed !== '') {
    out.completed = q.completed === true || q.completed === 'true'
  }
  if (q.dueBefore != null && q.dueBefore !== '') {
    out.dueBefore = Number(q.dueBefore)
  }
  if (q.dueAfter != null && q.dueAfter !== '') {
    out.dueAfter = Number(q.dueAfter)
  }
  return out
}

/**
 * 匹配路由
 * @returns {{ channel, args }} 或 null
 */
function matchRoute(path, method, query, body) {
  const segments = path.split('/').filter(Boolean)

  for (const route of routes) {
    if (route.m !== method) continue
    const patSegs = route.p.split('/').filter(Boolean)
    if (patSegs.length !== segments.length) continue

    const params = {}
    let matched = true
    for (let i = 0; i < patSegs.length; i++) {
      if (patSegs[i].startsWith(':')) {
        params[patSegs[i].slice(1)] = decodeURIComponent(segments[i])
      } else if (patSegs[i] !== segments[i]) {
        matched = false
        break
      }
    }
    if (!matched) continue

    if (route.b) {
      return { channel: route.c, args: route.b(params, body, query) }
    }
    return { channel: route.c, args: [] }
  }
  return null
}

/**
 * IPC 请求
 */
async function ipcRequest(path, options = {}) {
  const query = options.params || null
  const body = options.body
  const route = matchRoute(path, options.method || 'GET', query, body)

  if (!route) {
    throw new Error(`未匹配到 IPC 路由: ${options.method} ${path}`)
  }

  const result = await window.electronAPI.backend(route.channel, ...JSON.parse(JSON.stringify(route.args)))

  if (!result || result.code !== 0) {
    throw new Error(result?.msg || `IPC 调用失败 (code: ${result?.code})`)
  }
  return result.data
}

/**
 * HTTP 请求（开发调试回退）
 */
async function httpRequest(path, options = {}) {
  let fullUrl = `${BASE_URL}${path}`
  if (options.params) {
    const search = new URLSearchParams()
    for (const [key, value] of Object.entries(options.params)) {
      if (value !== undefined && value !== null && value !== '') {
        search.append(key, value)
      }
    }
    const qs = search.toString()
    if (qs) fullUrl += `?${qs}`
    delete options.params
  }

  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.headers = { 'Content-Type': 'application/json', ...options.headers }
    options.body = JSON.stringify(options.body)
  }

  let resp
  try {
    resp = await fetch(fullUrl, options)
  } catch (err) {
    throw new Error(`网络请求失败: ${err.message}`)
  }

  const contentType = resp.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return resp
  }

  const result = await resp.json()
  if (result.code !== 0) {
    throw new Error(result.msg || `请求失败 (code: ${result.code})`)
  }
  return result.data
}

/**
 * 统一请求入口
 */
export async function request(path, options = {}) {
  if (isElectron) {
    // FormData（图片上传）特殊处理：IPC 模式下转 base64
    if (options.body instanceof FormData) {
      return ipcUploadFormData(path, options.body)
    }
    return ipcRequest(path, options)
  }
  return httpRequest(path, options)
}

/**
 * IPC 图片上传：FormData → base64 → backend:images:upload
 */
async function ipcUploadFormData(path, formData) {
  const file = formData.get('file')
  if (!file) throw new Error('FormData 缺少 file 字段')

  // File/Blob → base64 dataUrl
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })

  const fileName = file.name || `img_${Date.now()}.png`
  const result = await window.electronAPI.backend('backend:images:upload', {
    base64: dataUrl,
    fileName
  })

  if (!result || result.code !== 0) {
    throw new Error(result?.msg || '图片上传失败')
  }
  return result.data  // { ref }
}

/**
 * 便捷方法
 */
export const http = {
  get(path, params) {
    return request(path, { method: 'GET', params })
  },
  post(path, body, options = {}) {
    return request(path, { method: 'POST', body, ...options })
  },
  put(path, body) {
    return request(path, { method: 'PUT', body })
  },
  patch(path, body) {
    return request(path, { method: 'PATCH', body })
  },
  del(path) {
    return request(path, { method: 'DELETE' })
  }
}

export { isElectron }

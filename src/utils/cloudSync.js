const GIST_FILENAME = 'rgoose-note-data.json'
const WEBDAV_FILENAME = 'rgoose-note-data.json'
const GITEE_FILENAME = 'rgoose-note-data.json'
const GITEE_API = 'https://gitee.com/api/v5/gists'

function extractGistFile(files, filename) {
  if (!files) return null
  if (Array.isArray(files)) {
    return files.find(f => f?.name === filename) || null
  }
  if (typeof files === 'object') {
    return files[filename] || null
  }
  return null
}

const gistAdapter = {
  async test(config) {
    const res = await fetch('https://api.github.com/gists', {
      method: 'GET',
      headers: gistHeaders(config.token)
    })
    if (res.status === 401) throw new Error('Token 无效或已过期')
    if (res.status === 403) throw new Error('触发 GitHub 限流，请稍后再试')
    if (!res.ok) throw new Error(`连接失败（HTTP ${res.status}）`)
    return true
  },

  async create(config, payload) {
    const res = await fetch('https://api.github.com/gists', {
      method: 'POST',
      headers: gistHeaders(config.token),
      body: JSON.stringify({
        description: 'R-Goose Note 同步数据',
        public: false,
        files: { [GIST_FILENAME]: { content: JSON.stringify(payload) } }
      })
    })
    if (!res.ok) throw new Error(`创建失败（HTTP ${res.status}）`)
    const data = await res.json()
    return data.id
  },

  async pull(config) {
    if (!config.gistId) throw new Error('尚未指定 Gist ID')
    const res = await fetch(buildGistUrl(config.gistId), {
      method: 'GET',
      headers: gistHeaders(config.token)
    })
    if (res.status === 404) throw new Error('远程文件不存在，请先推送')
    if (!res.ok) throw new Error(`拉取失败（HTTP ${res.status}）`)
    const data = await res.json()
    const file = extractGistFile(data.files, GIST_FILENAME)
    if (!file) throw new Error('远程 Gist 中找不到数据文件')
    return JSON.parse(file.content)
  },

  async push(config, payload, gistId) {
    const id = gistId || config.gistId
    if (!id) {
      const newId = await this.create(config, payload)
      return { gistId: newId }
    }
    const res = await fetch(buildGistUrl(id), {
      method: 'PATCH',
      headers: gistHeaders(config.token),
      body: JSON.stringify({
        files: { [GIST_FILENAME]: { content: JSON.stringify(payload) } }
      })
    })
    if (res.status === 404) {
      const newId = await this.create(config, payload)
      return { gistId: newId }
    }
    if (!res.ok) throw new Error(`推送失败（HTTP ${res.status}）`)
    return { gistId: id }
  }
}

function gistHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28'
  }
}

const giteeAdapter = {
  buildUrl(gistId, token) {
    const u = `${GITEE_API}/${gistId}`
    return token ? `${u}?access_token=${encodeURIComponent(token)}` : u
  },

  giteeBody(payload) {
    const body = new URLSearchParams()
    body.append('description', 'R-Goose Note 同步数据')
    body.append('public', '0')
    body.append('files[' + GITEE_FILENAME + '][content]', JSON.stringify(payload))
    return body
  },

  async test(config) {
    if (!config.token?.trim()) throw new Error('请填写 Gitee 私人令牌')
    const res = await fetch(`${GITEE_API}?access_token=${encodeURIComponent(config.token)}&per_page=1`, {
      method: 'GET'
    })
    if (res.status === 401) throw new Error('私人令牌无效')
    if (!res.ok) throw new Error(`连接失败（HTTP ${res.status}）`)
    return true
  },

  async create(config, payload) {
    const res = await fetch(`${GITEE_API}?access_token=${encodeURIComponent(config.token)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: this.giteeBody(payload)
    })
    if (res.status === 401) throw new Error('私人令牌无效')
    if (!res.ok) throw new Error(`创建失败（HTTP ${res.status}）`)
    const data = await res.json()
    return data.id
  },

  async pull(config) {
    if (!config.gistId) throw new Error('尚未指定 Gitee 片段 ID')
    const res = await fetch(this.buildUrl(config.gistId, config.token), { method: 'GET' })
    if (res.status === 401) throw new Error('私人令牌无效或无 gists 权限')
    if (res.status === 404) throw new Error('远程片段不存在，请先推送')
    if (!res.ok) throw new Error(`拉取失败（HTTP ${res.status}）`)
    const data = await res.json()
    const file = extractGistFile(data.files, GITEE_FILENAME)
    if (!file) throw new Error('远程片段中找不到数据文件')
    return JSON.parse(file.content)
  },

  async push(config, payload) {
    const id = config.gistId?.trim()
    if (!id) {
      const newId = await this.create(config, payload)
      return { gistId: newId }
    }
    const res = await fetch(this.buildUrl(id, config.token), {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: this.giteeBody(payload)
    })
    if (res.status === 404) {
      throw new Error('指定的 Gitee 片段 ID 不存在，请确认后重试')
    }
    if (res.status === 401) throw new Error('私人令牌无效')
    if (!res.ok) throw new Error(`推送失败（HTTP ${res.status}）`)
    return { gistId: id }
  }
}

const webdavAdapter = {
  buildUrl(config) {
    let base = config.url.replace(/\/$/, '')
    if (!base.endsWith(WEBDAV_FILENAME)) {
      base = `${base}/${WEBDAV_FILENAME}`
    }
    return base
  },

  headers(config, extra = {}) {
    const headers = { ...extra }
    if (config.username) {
      headers.Authorization = 'Basic ' + btoa(`${config.username}:${config.password}`)
    }
    return headers
  },

  async test(config) {
    const res = await fetch(this.buildUrl(config), {
      method: 'PROPFIND',
      headers: this.headers(config, { Depth: '0' })
    })
    if (res.status === 401) throw new Error('用户名或密码错误')
    if (res.status === 404) return true
    if (!res.ok && res.status !== 207) throw new Error(`连接失败（HTTP ${res.status}）`)
    return true
  },

  async pull(config) {
    const res = await fetch(this.buildUrl(config), {
      method: 'GET',
      headers: this.headers(config)
    })
    if (res.status === 404) throw new Error('远程文件不存在，请先推送')
    if (res.status === 401) throw new Error('认证失败')
    if (!res.ok) throw new Error(`拉取失败（HTTP ${res.status}）`)
    const text = await res.text()
    return JSON.parse(text)
  },

  async push(config, payload) {
    const res = await fetch(this.buildUrl(config), {
      method: 'PUT',
      headers: this.headers(config, { 'Content-Type': 'application/json' }),
      body: JSON.stringify(payload)
    })
    if (res.status === 401) throw new Error('认证失败')
    if (res.status === 409) {
      await this.ensureParent(config)
    }
    if (!res.ok && res.status !== 201 && res.status !== 204) {
      throw new Error(`推送失败（HTTP ${res.status}）`)
    }
    return {}
  },

  async ensureParent(config) {
    let base = config.url.replace(/\/$/, '')
    const parts = base.split('/').filter(Boolean)
    const proto = parts[0]
    let cur = proto
    for (let i = 1; i < parts.length; i++) {
      cur += '/' + parts[i]
      try {
        await fetch(cur, { method: 'MKCOL', headers: this.headers(config) })
      } catch (e) {
        // ignore
      }
    }
  }
}

const adapters = {
  gist: gistAdapter,
  gitee: giteeAdapter,
  webdav: webdavAdapter
}

export function getAdapter(type) {
  return adapters[type]
}

export function validateConfig(type, config) {
  if (type === 'gist') {
    if (!config.token?.trim()) return '请填写 GitHub Token'
    return null
  }
  if (type === 'gitee') {
    if (!config.token?.trim()) return '请填写 Gitee 私人令牌'
    return null
  }
  if (type === 'webdav') {
    if (!config.url?.trim()) return '请填写 WebDAV 地址'
    return null
  }
  return '未知后端类型'
}

export async function testConnection(type, config) {
  const adapter = getAdapter(type)
  if (!adapter) throw new Error('不支持的后端类型')
  return adapter.test(config)
}

export async function pullRemote(type, config) {
  const adapter = getAdapter(type)
  if (!adapter) throw new Error('不支持的后端类型')
  return adapter.pull(config)
}

export async function pushRemote(type, config, payload) {
  const adapter = getAdapter(type)
  if (!adapter) throw new Error('不支持的后端类型')
  return adapter.push(config, payload)
}

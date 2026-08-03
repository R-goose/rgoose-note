/**
 * HTTP 客户端封装
 * 统一处理 baseURL、JSON 序列化、错误响应
 */

const BASE_URL = '/api'

/**
 * 发送请求并解析统一响应体 { code, msg, data }
 * @param {string} path - 路径，如 /notes/xxx
 * @param {object} options - fetch options
 * @returns {Promise<any>} data 字段
 * @throws {Error} 网络错误或业务错误（code !== 0）
 */
export async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`

  // GET 请求的查询参数拼接
  let fullUrl = url
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

  // 自动添加 JSON headers
  if (options.body && typeof options.body === 'object' && !(options.body instanceof FormData)) {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }
    options.body = JSON.stringify(options.body)
  }

  let resp
  try {
    resp = await fetch(fullUrl, options)
  } catch (err) {
    throw new Error(`网络请求失败: ${err.message}`)
  }

  // 非 JSON 响应（如图片下载）直接返回 Response
  const contentType = resp.headers.get('content-type') || ''
  if (!contentType.includes('application/json')) {
    return resp
  }

  const result = await resp.json()

  // 统一响应体校验
  if (result.code !== 0) {
    throw new Error(result.msg || `请求失败 (code: ${result.code})`)
  }

  return result.data
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

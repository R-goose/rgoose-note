/**
 * 统一响应封装
 * - ok(data)         构造成功响应
 * - wrap(fn)         IPC 异步包装器，自动捕获异常
 * - handleError      HTTP 错误处理中间件
 */

const { BizError } = require('./errors')

function ok(data = null) {
  return { code: 0, msg: 'success', data }
}

async function wrap(fn) {
  try {
    const data = await fn()
    return ok(data)
  } catch (err) {
    if (err instanceof BizError) {
      return { code: err.code, msg: err.message, data: null }
    }
    console.error('[backend] unhandled error:', err)
    return { code: 50000, msg: '服务器内部错误', data: null }
  }
}

function handleError(err, _req, res, _next) {
  if (err instanceof BizError) {
    return res.status(200).json({ code: err.code, msg: err.message, data: null })
  }
  console.error('[backend] unhandled error:', err)
  res.status(500).json({ code: 50000, msg: '服务器内部错误', data: null })
}

module.exports = { ok, wrap, handleError }

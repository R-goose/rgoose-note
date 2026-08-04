/**
 * 通用工具：日志、UUID、JSON 安全解析
 */

function log(tag, ...args) {
  const ts = new Date().toISOString()
  console.log(`[${ts}] [${tag}]`, ...args)
}

const { v4: uuidv4 } = require('uuid')

function uuid() {
  return uuidv4()
}

function safeParse(str, fallback) {
  if (str == null) return fallback
  if (typeof str !== 'string') return str
  try { return JSON.parse(str) } catch { return fallback }
}

function safeStringify(val) {
  if (val == null) return null
  return typeof val === 'string' ? val : JSON.stringify(val)
}

function now() {
  return Date.now()
}

module.exports = { log, uuid, safeParse, safeStringify, now }

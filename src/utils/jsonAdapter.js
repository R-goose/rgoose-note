import { generateId } from '@/utils'

export function isAppFormatData(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false
  if (Array.isArray(data.notes) && data.notes.length > 0) return true
  if (Array.isArray(data.folders) && data.folders.length > 0) return true
  if (Array.isArray(data.tags) && data.tags.length > 0) return true
  if (data.exportedAt || data.version === '2.0.0') return true
  return false
}

function escapeHtml(s) {
  if (s === null || s === undefined) return ''
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}

function buildTableHTML(rows) {
  if (!rows.length) return ''
  const headers = Object.keys(rows[0])
  let html = '<table><tr>'
  headers.forEach(h => { html += `<th>${escapeHtml(h)}</th>` })
  html += '</tr>'
  rows.forEach(row => {
    html += '<tr>'
    headers.forEach(h => {
      const val = row[h]
      html += `<td>${escapeHtml(formatCellValue(val))}</td>`
    })
    html += '</tr>'
  })
  html += '</table><p><br></p>'
  return html
}

function formatCellValue(val) {
  if (val === null || val === undefined) return ''
  if (typeof val === 'object') return JSON.stringify(val)
  return val
}

function summarizeRows(rows, maxRows = 200) {
  if (rows.length <= maxRows) return rows
  return rows.slice(0, maxRows)
}

export function buildNoteFromArbitraryJSON(data, sourceName = '') {
  if (data === null || data === undefined) return null

  let title = sourceName || '导入的 JSON 数据'
  const blocks = []
  let yOffset = 40

  if (Array.isArray(data)) {
    const rows = data.filter(item => isPlainObject(item))
    if (rows.length) {
      title = sourceName ? `${sourceName}（${rows.length} 条）` : `列表数据（${rows.length} 条）`
      const shown = summarizeRows(rows)
      blocks.push(makeTextBlock(`<h2>共 ${rows.length} 条记录${rows.length > shown.length ? `，已展示前 ${shown.length} 条` : ''}</h2>`, 40, yOffset))
      yOffset += 110
      blocks.push(makeTextBlock(buildTableHTML(shown), 40, yOffset, 640))
      return { title, blocks }
    }
    blocks.push(makeTextBlock(`<p>数组共 ${data.length} 个元素</p>`, 40, yOffset))
    return { title, blocks }
  }

  if (!isPlainObject(data)) {
    blocks.push(makeTextBlock(`<p>${escapeHtml(String(data))}</p>`, 40, yOffset))
    return { title, blocks }
  }

  const keys = Object.keys(data)

  const arrayEntries = keys.filter(k => Array.isArray(data[k]))
  const objectEntries = keys.filter(k => isPlainObject(data[k]))
  const scalarEntries = keys.filter(k => !Array.isArray(data[k]) && !isPlainObject(data[k]))

  if (scalarEntries.length) {
    let html = '<table><tr><th>字段</th><th>值</th></tr>'
    scalarEntries.forEach(k => {
      html += `<tr><td>${escapeHtml(k)}</td><td>${escapeHtml(formatCellValue(data[k]))}</td></tr>`
    })
    html += '</table><p><br></p>'
    blocks.push(makeTextBlock(`<h2>基本信息</h2>`, 40, yOffset))
    yOffset += 100
    blocks.push(makeTextBlock(html, 40, yOffset, 460))
    yOffset += 220
  }

  arrayEntries.forEach(k => {
    const arr = data[k]
    const rows = arr.filter(item => isPlainObject(item))
    if (rows.length) {
      const shown = summarizeRows(rows)
      blocks.push(makeTextBlock(`<h2>${escapeHtml(k)}（${rows.length} 条${rows.length > shown.length ? `，展示前 ${shown.length}` : ''}）</h2>`, 40, yOffset))
      yOffset += 100
      blocks.push(makeTextBlock(buildTableHTML(shown), 40, yOffset, 720))
      const estRows = Math.min(shown.length, 12)
      yOffset += 60 + estRows * 34
    } else if (arr.length) {
      blocks.push(makeTextBlock(`<h2>${escapeHtml(k)}</h2><ul>${arr.slice(0, 50).map(v => `<li>${escapeHtml(formatCellValue(v))}</li>`).join('')}</ul>${arr.length > 50 ? `<p>…共 ${arr.length} 项</p>` : ''}`, 40, yOffset, 420))
      yOffset += 200
    }
  })

  objectEntries.forEach(k => {
    const sub = data[k]
    const subKeys = Object.keys(sub)
    if (!subKeys.length) return
    let html = '<table><tr><th>字段</th><th>值</th></tr>'
    subKeys.forEach(sk => {
      html += `<tr><td>${escapeHtml(sk)}</td><td>${escapeHtml(formatCellValue(sub[sk]))}</td></tr>`
    })
    html += '</table><p><br></p>'
    blocks.push(makeTextBlock(`<h2>${escapeHtml(k)}</h2>`, 40, yOffset, 420))
    yOffset += 100
    blocks.push(makeTextBlock(html, 40, yOffset, 420))
    yOffset += 200
  })

  if (!blocks.length) {
    blocks.push(makeTextBlock('<p>该 JSON 没有可展示的字段</p>', 40, yOffset))
  }

  if (!sourceName) {
    title = arrayEntries.length
      ? `${arrayEntries[0]} 等 ${keys.length} 个字段`
      : (scalarEntries[0] ? String(data[scalarEntries[0]]) : '导入的 JSON 对象')
  }

  return { title, blocks }
}

function makeTextBlock(content, x, y, width = 480) {
  const now = Date.now()
  return {
    id: generateId(),
    type: 'text',
    content,
    x,
    y,
    width,
    minHeight: 80,
    color: 'green',
    createdAt: now,
    updatedAt: now
  }
}

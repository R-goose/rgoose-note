export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function convertInlineMd(text) {
  let html = escapeHtml(text)
  html = html.replace(/`([^`]+)`/g, '<code>$1</code>')
  html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/(^|[^*])\*([^*]+)\*/g, '$1<em>$2</em>')
  html = html.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
  return html
}

export function isLikelyMarkdown(text) {
  if (/(^|\n)\s*(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|---)/.test(text)) return true
  if (/\|.*\|/.test(text)) return true
  if (/\*\*[^*]+\*\*/.test(text)) return true
  if (/(^|[^*])\*[^*]+\*/.test(text)) return true
  if (/`[^`]+`/.test(text)) return true
  if (/\[[^\]]+\]\([^)\s]+\)/.test(text)) return true
  return false
}

export function splitTableCells(line) {
  let parts = line.split('|')
  if (parts.length && parts[0].trim() === '') parts.shift()
  if (parts.length && parts[parts.length - 1].trim() === '') parts.pop()
  return parts.map(c => c.trim())
}

export function markdownToHtml(md) {
  const lines = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  let html = ''
  let i = 0
  let inList = null
  let paraBuf = []
  const closeList = () => {
    if (inList) {
      html += `</${inList}>`
      inList = null
    }
  }
  const flushPara = () => {
    if (paraBuf.length) {
      html += `<p>${paraBuf.map(convertInlineMd).join('<br>')}</p>`
      paraBuf = []
    }
  }

  while (i < lines.length) {
    const line = lines[i]

    if (/^```/.test(line.trim())) {
      closeList()
      flushPara()
      const codeLines = []
      i++
      while (i < lines.length && !/^```/.test(lines[i].trim())) {
        codeLines.push(lines[i])
        i++
      }
      i++
      html += `<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`
      continue
    }

    if (/\|/.test(line) && i + 1 < lines.length && /^[\s|:-]+$/.test(lines[i + 1]) && /-/.test(lines[i + 1])) {
      closeList()
      flushPara()
      const hCells = splitTableCells(line)
      i += 2
      const rows = []
      while (i < lines.length && /\|/.test(lines[i])) {
        rows.push(splitTableCells(lines[i]))
        i++
      }
      let t = '<table><tr>'
      hCells.forEach(c => { t += `<th>${convertInlineMd(c)}</th>` })
      t += '</tr>'
      rows.forEach(r => {
        t += '<tr>'
        r.forEach(c => { t += `<td>${convertInlineMd(c)}</td>` })
        t += '</tr>'
      })
      t += '</table>'
      html += t
      continue
    }

    const hMatch = line.match(/^(#{1,6})\s+(.*)$/)
    if (hMatch) {
      closeList()
      flushPara()
      const level = hMatch[1].length
      html += `<h${level}>${convertInlineMd(hMatch[2])}</h${level}>`
      i++
      continue
    }

    if (/^>\s?/.test(line)) {
      closeList()
      flushPara()
      html += `<blockquote>${convertInlineMd(line.replace(/^>\s?/, ''))}</blockquote>`
      i++
      continue
    }

    if (/^\s*[-*+]\s+/.test(line)) {
      flushPara()
      if (inList !== 'ul') {
        closeList()
        html += '<ul>'
        inList = 'ul'
      }
      html += `<li>${convertInlineMd(line.replace(/^\s*[-*+]\s+/, ''))}</li>`
      i++
      continue
    }

    if (/^\s*\d+\.\s+/.test(line)) {
      flushPara()
      const numMatch = line.match(/^\s*(\d+)\.\s+/)
      const explicitNum = numMatch ? parseInt(numMatch[1], 10) : 1
      if (inList !== 'ol') {
        closeList()
        html += `<ol start="${explicitNum}">`
        inList = 'ol'
      }
      const text = convertInlineMd(line.replace(/^\s*\d+\.\s+/, ''))
      html += `<li>${text}</li>`
      i++
      continue
    }

    if (/^(\*\*\*|---|___)\s*$/.test(line)) {
      closeList()
      flushPara()
      html += '<hr>'
      i++
      continue
    }

    if (/^\s*(#{7,}\s)/.test(line)) {
      closeList()
      flushPara()
      html += `<p style="color: var(--warning-color)">${escapeHtml(line)}</p>`
      i++
      continue
    }

    if (line.trim() === '') {
      closeList()
      flushPara()
      i++
      continue
    }

    closeList()
    paraBuf.push(line)
    i++
  }
  closeList()
  flushPara()
  return html
}

import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: true, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await ed.evaluate(el => { el.innerHTML = '<span style="font-size: 16px;">ELLO</span>'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(400)

// 模拟选中 ELLO 并手动执行合并逻辑，检查每一步
const result = await page.evaluate(() => {
  const el = document.querySelector('.text-editor')
  el.focus()
  // 选中整个 span 内容
  const targetSpan = el.querySelector('span')
  const r = document.createRange()
  r.selectNodeContents(targetSpan)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(r)

  const log = []
  log.push('before extract, editor html: ' + el.innerHTML)
  log.push('range collapsed: ' + r.collapsed)

  const span = document.createElement('span')
  span.style.fontSize = '20px'
  const frag = r.extractContents()
  log.push('fragment children: ' + frag.childNodes.length + ' types: ' + [...frag.childNodes].map(n => n.nodeType + ':' + (n.tagName||'#text')).join(','))
  span.appendChild(frag)
  r.insertNode(span)
  log.push('after insert: ' + el.innerHTML)

  // 模拟 mergeUpward
  const parent = span.parentNode
  log.push('parent tag: ' + parent.tagName + ' cssText: "' + parent.style.cssText + '"')
  log.push('parent children count: ' + parent.childNodes.length)
  log.push('parent is SPAN: ' + (parent.tagName === 'SPAN'))
  log.push('parent has cssText: ' + !!parent.style.cssText)

  const css = parent.style.cssText
  const stripped = css.replace(/font-size[^;]*;?/g, '').replace(/font-weight[^;]*;?/g, '').trim()
  log.push('css: "' + css + '" stripped: "' + stripped + '"')
  log.push('fontSize test: ' + /font-size/.test(css) + ' !stripped: ' + !stripped)

  return log.join('\n')
})
console.log(result)

await browser.close()

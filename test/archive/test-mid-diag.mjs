import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(2000)
const noteId = page.url().split('/note/')[1]

await page.evaluate((nid) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const note = ns.notes.find(n => n.id === nid)
  note.connections.forEach(c => ns.deleteConnection(nid, c.id))
  note.blocks.forEach(b => ns.deleteBlock(nid, b.id))
  const b1 = ns.addBlock(nid, { type: 'text', x: 100, y: 100, width: 160, height: 60, content: 'A' })
  const b2 = ns.addBlock(nid, { type: 'text', x: 500, y: 400, width: 160, height: 60, content: 'B' })
  ns.addConnection(nid, { from: b1.id, to: b2.id, color: '#6bbd8f', label: '中点测试', dir: 'forward' })
}, noteId)
await page.waitForTimeout(1000)

const raw = await page.evaluate(() => {
  const path = document.querySelector('.connection-path')
  const rect = document.querySelector('.conn-label-bg')
  return {
    hasPath: !!path, hasRect: !!rect,
    pathD: path?.getAttribute('d')?.slice(0, 60),
    rectParentTransform: rect?.parentNode?.getAttribute('transform'),
    pathTotal: path ? path.getTotalLength() : null,
    pathMid: path ? (function(){ const t=path.getTotalLength(); const p=path.getPointAtLength(t/2); return {x:p.x,y:p.y} })() : null
  }
})
console.log('诊断:', JSON.stringify(raw, null, 2))

await browser.close()

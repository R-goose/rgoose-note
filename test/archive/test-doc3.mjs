import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(2000)

// 从 URL 拿 note id
const url = page.url()
const noteId = url.split('/note/')[1]
console.log('noteId:', noteId)

// 注入2个块 + 红色带label连线
const setup = await page.evaluate((nid) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const note = ns.notes.find(n => n.id === nid)
  if (!note) return 'note不存在'
  const b1 = ns.addBlock(nid, { type: 'text', x: 100, y: 100, content: '块A' })
  const b2 = ns.addBlock(nid, { type: 'text', x: 400, y: 300, content: '块B' })
  ns.addConnection(nid, { from: b1.id, to: b2.id, color: '#d97676', label: '测试标签', arrow: 'standard', dir: 'forward' })
  return 'OK'
}, noteId)
console.log('setup:', setup)
await page.waitForTimeout(800)

// 1. label
const labelText = await page.locator('.conn-label-text').first().textContent().catch(() => null)
console.log('1. label渲染:', labelText)

// 2. marker 颜色
const markerInfo = await page.evaluate(() => {
  return [...document.querySelectorAll('.connections-layer marker')].map(m => ({ id: m.id, fill: m.getAttribute('fill'), stroke: m.getAttribute('stroke') }))
})
console.log('2. markers:', JSON.stringify(markerInfo))
const hasRed = markerInfo.some(m => m.fill === '#d97676' || m.stroke === '#d97676')
console.log('3. 箭头跟随红色:', hasRed)

// 4. 双击编辑
await page.locator('.connection-hit').first().dblclick()
await page.waitForTimeout(400)
const editing = await page.locator('.conn-label-edit').count()
console.log('4. 双击进入编辑:', editing > 0 ? '是' : '否')

if (editing > 0) {
  await page.locator('.conn-label-edit').fill('已修改文字')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  const after = await page.locator('.conn-label-text').first().textContent().catch(() => null)
  console.log('5. 提交后label:', after)
}

// 6. 持久化
const stored = await page.evaluate((nid) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const n = ns.notes.find(x => x.id === nid)
  return n?.connections?.[0]?.label
}, noteId)
console.log('6. store持久化label:', stored)

await browser.close()

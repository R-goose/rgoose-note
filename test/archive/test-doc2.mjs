import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

// 用 store 给当前笔记加2个块 + 一条带label的红色连线
const setup = await page.evaluate(() => {
  const app = document.querySelector('#app').__vue_app__
  const pinia = app.config.globalProperties.$pinia
  const noteStore = pinia._s.get('note')
  const noteId = noteStore.currentNoteId
  const note = noteStore.notes.find(n => n.id === noteId)
  if (!note) return '无当前笔记'
  const b1 = noteStore.addBlock(noteId, { type: 'text', x: 100, y: 100, content: 'A' })
  const b2 = noteStore.addBlock(noteId, { type: 'text', x: 400, y: 300, content: 'B' })
  noteStore.addConnection(noteId, { from: b1.id, to: b2.id, color: '#d97676', label: '测试标签', arrow: 'standard', dir: 'forward' })
  return `已加块+连线 (noteId=${noteId})`
})
console.log('setup:', setup)
await page.waitForTimeout(800)

// 1. label 文本
const labelText = await page.locator('.conn-label-text').first().textContent().catch(() => null)
console.log('1. label渲染:', labelText)

// 2. 动态 marker 颜色
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
  await page.locator('.conn-label-edit').fill('已修改')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  const after = await page.locator('.conn-label-text').first().textContent().catch(() => null)
  console.log('5. 回车提交后label:', after)
}

// 6. 验证持久化（store 里 label 已更新）
const stored = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const n = ns.notes.find(x => x.id === ns.currentNoteId)
  return n?.connections?.[0]?.label
})
console.log('6. store中label:', stored)

await browser.close()

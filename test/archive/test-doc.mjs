import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

// 先看有几条连线
let conns = await page.locator('.connection-path').count()
console.log('初始连线数:', conns)

// 切到连线模式，连两条
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
// 找块
const blockCount = await page.locator('.note-block').count()
console.log('块数:', blockCount)

// 用 store 直接加一条带 label 和不同颜色的连线来测试渲染
const testResult = await page.evaluate(async () => {
  // 通过 pinia 拿 store
  const app = document.querySelector('#app').__vue_app__
  const pinia = app.config.globalProperties.$pinia
  const noteStore = pinia._s.get('note')
  const note = noteStore.currentNote || noteStore.notes[0]
  const blocks = note.blocks
  if (blocks.length < 2) return '块不足'
  noteStore.addConnection(note.id, { from: blocks[0].id, to: blocks[1].id, color: '#d97676', label: '测试标签', arrow: 'standard', dir: 'forward' })
  return '已添加红色连线+label'
})
console.log('测试连线:', testResult)
await page.waitForTimeout(500)

// 检查 label 文本是否渲染
const labelText = await page.locator('.conn-label-text').first().textContent().catch(() => null)
console.log('1. label文本渲染:', labelText)

// 检查 marker 是否动态生成且颜色为红
const markerHtml = await page.evaluate(() => {
  const markers = document.querySelectorAll('.connections-layer marker')
  return [...markers].map(m => ({ id: m.id, fill: m.getAttribute('fill') }))
})
console.log('2. 动态marker:', JSON.stringify(markerHtml.slice(0,4)))

// 箭头颜色应为红 #d97676
const hasRedMarker = markerHtml.some(m => m.fill === '#d97676')
console.log('3. 箭头跟随红色:', hasRedMarker)

// 双击连线进入编辑
await page.locator('.connection-hit').first().dblclick()
await page.waitForTimeout(400)
const editing = await page.locator('.conn-label-edit').count()
console.log('4. 双击进入编辑:', editing > 0 ? '是' : '否')

// 修改文本并回车
if (editing > 0) {
  await page.locator('.conn-label-edit').fill('已修改')
  await page.keyboard.press('Enter')
  await page.waitForTimeout(300)
  const after = await page.locator('.conn-label-text').first().textContent().catch(() => null)
  console.log('5. 回车提交后:', after)
}

await browser.close()

import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
// 找一个有连线的笔记
const notes = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  return pinia._s.get('note').notes.filter(n => n.connections.length > 0 && n.blocks.length > 0).map(n => n.id)
})
const targetId = notes[0]
console.log('目标笔记:', targetId)
await page.goto('http://localhost:5199/#/note/' + targetId, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

// 给第一条连线加label确保可见
await page.evaluate((nid) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const note = ns.notes.find(n => n.id === nid)
  if (note.connections[0]) ns.updateConnection(nid, note.connections[0].id, { label: '跟随测试' })
}, targetId)
await page.waitForTimeout(800)

const getPos = () => page.evaluate(() => {
  const path = document.querySelector('.connection-path')
  const rect = document.querySelector('.conn-label-bg')
  if (!path || !rect) return null
  const d = path.getAttribute('d')
  if (!d) return null
  const t = path.getTotalLength()
  const p = path.getPointAtLength(t/2)
  const m = rect.parentNode.getAttribute('transform').match(/translate\(([-\d.]+),\s*([-\d.]+)\)/)
  return { midX:+p.x.toFixed(1), midY:+p.y.toFixed(1), labelX:+(+m[1]).toFixed(1), labelY:+(+m[2]).toFixed(1) }
})

const before = await getPos()
console.log('拖动前:', JSON.stringify(before))

// 拖动第一个块
const blocksBefore = await page.evaluate(() => {
  return [...document.querySelectorAll('.note-block')].map(b => ({ id: b.dataset.blockId, x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y }))
})
console.log('拖动前块位置:', JSON.stringify(blocksBefore[0]))

const block = await page.locator('.note-block').first().boundingBox()
console.log('block bbox:', block)
await page.mouse.move(block.x + 40, block.y + 20)
await page.mouse.down()
await page.waitForTimeout(150)
await page.mouse.move(block.x + 220, block.y + 180, { steps: 10 })
await page.waitForTimeout(150)
await page.mouse.up()
await page.waitForTimeout(1000)

const blocksAfter = await page.evaluate(() => {
  return [...document.querySelectorAll('.note-block')].map(b => ({ id: b.dataset.blockId, x: b.getBoundingClientRect().x, y: b.getBoundingClientRect().y }))
})
console.log('拖动后块位置:', JSON.stringify(blocksAfter[0]))
console.log('块是否移动:', blocksBefore[0].x !== blocksAfter[0].x || blocksBefore[0].y !== blocksAfter[0].y)

const after = await getPos()
console.log('拖动后:', JSON.stringify(after))

if (before && after) {
  const followDx = Math.abs(after.midX - after.labelX)
  const followDy = Math.abs(after.midY - after.labelY)
  console.log('拖动后标签是否仍在中点:', followDx<2 && followDy<2 ? '✓' : '✗', '偏差', followDx.toFixed(1), followDy.toFixed(1))
  const moved = Math.abs(after.midX - before.midX) > 10 || Math.abs(after.midY - before.midY) > 10
  console.log('中点位置随块移动:', moved ? '✓ 已跟随' : '✗ 未变')
}

await browser.close()

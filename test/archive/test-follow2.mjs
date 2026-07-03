import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
const notes = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  return pinia._s.get('note').notes.filter(n => n.connections.length > 0 && n.blocks.length > 0).map(n => ({ id: n.id, firstConn: { from: n.connections[0].from, to: n.connections[0].to } }))
})
const target = notes[0]
console.log('目标:', JSON.stringify(target))
await page.goto('http://localhost:5199/#/note/' + target.id, { waitUntil: 'networkidle' })
await page.waitForTimeout(2500)

await page.evaluate((payload) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const note = ns.notes.find(n => n.id === payload.nid)
  if (note.connections[0]) ns.updateConnection(payload.nid, note.connections[0].id, { label: '跟随' })
}, { nid: target.id })
await page.waitForTimeout(800)

const getPos = () => page.evaluate(() => {
  const target = document.querySelector('.connection-path')
  const rect = document.querySelector('.conn-label-bg')
  if (!target || !rect) return null
  const d = target.getAttribute('d')
  if (!d) return null
  const t = target.getTotalLength()
  const pt = target.getPointAtLength(t/2)
  const m = rect.parentNode.getAttribute('transform').match(/translate\(([-\d.]+),\s*([-\d.]+)\)/)
  return { midX:+pt.x.toFixed(1), midY:+pt.y.toFixed(1), labelX:+(+m[1]).toFixed(1), labelY:+(+m[2]).toFixed(1) }
})

const before = await getPos()
console.log('拖动前:', JSON.stringify(before))

// 找到连线起点块并拖动
const fromBlock = await page.locator(`[data-block-id="${target.firstConn.from}"]`).boundingBox()
console.log('起点块bbox:', fromBlock ? `${Math.round(fromBlock.x)},${Math.round(fromBlock.y)}` : 'null')

if (fromBlock) {
  await page.mouse.move(fromBlock.x + 30, fromBlock.y + 15)
  await page.mouse.down()
  await page.waitForTimeout(150)
  await page.mouse.move(fromBlock.x + 200, fromBlock.y + 150, { steps: 12 })
  await page.waitForTimeout(150)
  await page.mouse.up()
  await page.waitForTimeout(1200)
}

const after = await getPos()
console.log('拖动后:', JSON.stringify(after))
if (before && after) {
  const followDx = Math.abs(after.midX - after.labelX)
  const followDy = Math.abs(after.midY - after.labelY)
  console.log('标签是否在中点:', followDx<2 && followDy<2 ? '✓' : '✗')
  const moved = Math.abs(after.midX - before.midX) > 5 || Math.abs(after.midY - before.midY) > 5
  console.log('中点跟随块移动:', moved ? '✓ 已跟随' : '✗ 未变')
}

await browser.close()

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

// 清空当前笔记的所有连线和块，再注入干净的测试数据
const setup = await page.evaluate((nid) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const note = ns.notes.find(n => n.id === nid)
  // 清空
  note.connections.forEach(c => ns.deleteConnection(nid, c.id))
  note.blocks.forEach(b => ns.deleteBlock(nid, b.id))
  // 注入2个块
  const b1 = ns.addBlock(nid, { type: 'text', x: 100, y: 100, width: 160, height: 60, content: '块A' })
  const b2 = ns.addBlock(nid, { type: 'text', x: 500, y: 400, width: 160, height: 60, content: '块B' })
  // 注入连线带label
  ns.addConnection(nid, { from: b1.id, to: b2.id, color: '#6bbd8f', label: '中点测试', dir: 'forward' })
  return { b1: b1.id, b2: b2.id }
}, noteId)
console.log('setup:', JSON.stringify(setup))
await page.waitForTimeout(1000)

// 等待渲染后对比
const cmp = await page.evaluate(() => {
  const path = document.querySelector('.connection-path')
  const rect = document.querySelector('.conn-label-bg')
  if (!path || !rect) return { err: '找不到元素', path: !!path, rect: !!rect }
  const g = rect.parentNode
  const total = path.getTotalLength()
  const mid = path.getPointAtLength(total / 2)
  const transform = g.getAttribute('transform')
  const m = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/)
  return {
    pathMid: { x: +(+mid.x).toFixed(1), y: +(+mid.y).toFixed(1) },
    labelPos: { x: +(+m[1]).toFixed(1), y: +(+m[2]).toFixed(1) },
    total: +total.toFixed(0)
  }
})
console.log('1. path几何中点:', JSON.stringify(cmp.pathMid))
console.log('   标签位置:', JSON.stringify(cmp.labelPos))
const dx1 = Math.abs(cmp.pathMid.x - cmp.labelPos.x)
const dy1 = Math.abs(cmp.pathMid.y - cmp.labelPos.y)
console.log('   偏差:', dx1.toFixed(1), dy1.toFixed(1), dx1 < 2 && dy1 < 2 ? '✓ 在中点' : '✗ 偏离')

// 拖动块B
const blockB = await page.locator('.note-block').last().boundingBox()
await page.mouse.move(blockB.x + 80, blockB.y + 30)
await page.mouse.down()
await page.waitForTimeout(100)
await page.mouse.move(blockB.x + 250, blockB.y + 200, { steps: 8 })
await page.waitForTimeout(100)
await page.mouse.up()
await page.waitForTimeout(800)

const cmp2 = await page.evaluate(() => {
  const path = document.querySelector('.connection-path')
  const rect = document.querySelector('.conn-label-bg')
  const g = rect.parentNode
  const total = path.getTotalLength()
  const mid = path.getPointAtLength(total / 2)
  const transform = g.getAttribute('transform')
  const m = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/)
  return {
    pathMid: { x: +(+mid.x).toFixed(1), y: +(+mid.y).toFixed(1) },
    labelPos: { x: +(+m[1]).toFixed(1), y: +(+m[2]).toFixed(1) }
  }
})
console.log('2. 拖动后path中点:', JSON.stringify(cmp2.pathMid))
console.log('   拖动后标签位置:', JSON.stringify(cmp2.labelPos))
const dx2 = Math.abs(cmp2.pathMid.x - cmp2.labelPos.x)
const dy2 = Math.abs(cmp2.pathMid.y - cmp2.labelPos.y)
console.log('   偏差:', dx2.toFixed(1), dy2.toFixed(1), dx2 < 2 && dy2 < 2 ? '✓ 仍在中点' : '✗ 偏离')
const moved = Math.abs(cmp2.labelPos.x - cmp.labelPos.x) > 5 || Math.abs(cmp2.labelPos.y - cmp.labelPos.y) > 5
console.log('   位置随拖动变化:', moved ? '✓ 已跟随' : '✗ 未变')

await browser.close()

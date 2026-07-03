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

// 注入2个块 + 连线带label
await page.evaluate((nid) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  ns.addBlock(nid, { type: 'text', x: 100, y: 100, content: 'A' })
  ns.addBlock(nid, { type: 'text', x: 500, y: 400, content: 'B' })
  const note = ns.notes.find(n => n.id === nid)
  const b1 = note.blocks[note.blocks.length - 2]
  const b2 = note.blocks[note.blocks.length - 1]
  ns.addConnection(nid, { from: b1.id, to: b2.id, color: '#6bbd8f', label: '中点标签', dir: 'forward' })
}, noteId)
await page.waitForTimeout(800)

// 1. 获取 path 真实中点 和 标签位置对比
const cmp = await page.evaluate(() => {
  const path = document.querySelector('.connection-path')
  const g = document.querySelector('g:has(> .conn-label-bg)')
  const total = path.getTotalLength()
  const mid = path.getPointAtLength(total / 2)
  const transform = g.getAttribute('transform')
  const m = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/)
  return {
    pathMid: { x: mid.x.toFixed(1), y: mid.y.toFixed(1) },
    labelPos: { x: parseFloat(m[1]).toFixed(1), y: parseFloat(m[2]).toFixed(1) },
    totalLen: total.toFixed(1)
  }
})
console.log('1. path几何中点:', JSON.stringify(cmp.pathMid))
console.log('   标签位置:', JSON.stringify(cmp.labelPos))
const matchX = cmp.pathMid.x === cmp.labelPos.x
const matchY = cmp.pathMid.y === cmp.labelPos.y
console.log('   位置匹配:', matchX && matchY ? '✓ 标签在路径几何中点' : '✗ 偏离')

// 2. 拖动块B后，标签是否跟随
const blockBBox = await page.locator('.note-block').last().boundingBox()
await page.mouse.move(blockBBox.x + 50, blockBBox.y + 20)
await page.mouse.down()
await page.waitForTimeout(100)
await page.mouse.move(blockBBox.x + 200, blockBBox.y + 150, { steps: 5 })
await page.waitForTimeout(100)
await page.mouse.up()
await page.waitForTimeout(500)

const cmp2 = await page.evaluate(() => {
  const path = document.querySelector('.connection-path')
  const g = document.querySelector('g:has(> .conn-label-bg)')
  const total = path.getTotalLength()
  const mid = path.getPointAtLength(total / 2)
  const transform = g.getAttribute('transform')
  const m = transform.match(/translate\(([-\d.]+),\s*([-\d.]+)\)/)
  return {
    pathMid: { x: mid.x.toFixed(1), y: mid.y.toFixed(1) },
    labelPos: { x: parseFloat(m[1]).toFixed(1), y: parseFloat(m[2]).toFixed(1) }
  }
})
console.log('2. 拖动后path中点:', JSON.stringify(cmp2.pathMid))
console.log('   拖动后标签位置:', JSON.stringify(cmp2.labelPos))
const followMatch = cmp2.pathMid.x === cmp2.labelPos.x && cmp2.pathMid.y === cmp2.labelPos.y
console.log('   跟随移动:', followMatch ? '✓ 标签随线条移动' : '✗ 未跟随')
const moved = cmp2.labelPos.x !== cmp.labelPos.x || cmp2.labelPos.y !== cmp.labelPos.y
console.log('   位置确实变化:', moved ? '✓' : '✗')

await browser.close()

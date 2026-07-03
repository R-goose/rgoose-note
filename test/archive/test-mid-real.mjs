import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 找一个有连线的笔记
const allNotes = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  return pinia._s.get('note').notes.map(n => ({ id: n.id, title: n.title, blocks: n.blocks.length, conns: n.connections.length }))
})
console.log('笔记列表:', JSON.stringify(allNotes.map(n => ({t:n.title, b:n.blocks, c:n.conns}))))

// 选有连线的笔记
const noteWithConn = allNotes.find(n => n.conns > 0)
if (!noteWithConn) {
  console.log('无带连线的笔记，退出')
  await browser.close()
  process.exit(0)
}

await page.goto('http://localhost:5199/#/note/' + noteWithConn.id, { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// 给第一条连线加label
await page.evaluate((nid) => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const note = ns.notes.find(n => n.id === nid)
  if (note.connections[0]) ns.updateConnection(nid, note.connections[0].id, { label: '中点验证' })
}, noteWithConn.id)
await page.waitForTimeout(800)

const raw = await page.evaluate(() => {
  const path = document.querySelector('.connection-path')
  const rect = document.querySelector('.conn-label-bg')
  const d = path?.getAttribute('d')
  let mid = null
  if (path && d && d !== '') {
    try { const t = path.getTotalLength(); const p = path.getPointAtLength(t/2); mid = {x:+p.x.toFixed(1), y:+p.y.toFixed(1)} } catch(e){ mid = 'err' }
  }
  let labelPos = null
  if (rect) {
    const m = rect.parentNode.getAttribute('transform').match(/translate\(([-\d.]+),\s*([-\d.]+)\)/)
    labelPos = { x: +(+m[1]).toFixed(1), y: +(+m[2]).toFixed(1) }
  }
  return { pathD: d?.slice(0,40), mid, labelPos }
})
console.log('1. pathD:', raw.pathD)
console.log('2. path几何中点:', JSON.stringify(raw.mid))
console.log('3. 标签位置:', JSON.stringify(raw.labelPos))
if (raw.mid && raw.labelPos) {
  const dx = Math.abs(raw.mid.x - raw.labelPos.x)
  const dy = Math.abs(raw.mid.y - raw.labelPos.y)
  console.log('4. 偏差:', dx.toFixed(1), dy.toFixed(1), dx<2&&dy<2 ? '✓ 标签在路径几何中点' : '✗ 偏离')
}

await browser.close()

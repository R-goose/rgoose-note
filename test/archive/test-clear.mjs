import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const notes = ns.notes.filter(n => !n.deleted)
  if (notes[0]) ns.addBlock(notes[0].id, { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80', x: 100, y: 100 })
})

await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

const info = await page.evaluate(() => {
  const s = (el, props) => el ? Object.fromEntries(props.map(p => [p, getComputedStyle(el)[p]])) : null
  return {
    blob1: s(document.querySelector('.bg-blob-1'), ['opacity']),
    blob2: s(document.querySelector('.bg-blob-2'), ['opacity']),
    rings: s(document.querySelector('.bg-rings'), ['opacity']),
    grid: s(document.querySelector('.bg-grid-lines'), ['opacity']),
    dots: s(document.querySelector('.bg-dots'), ['opacity'])
  }
})
console.log('提升后透明度:', JSON.stringify(info, null, 2))

await page.screenshot({ path: 'shot-clear-all.png' })

// 滚到底部
await page.evaluate(() => {
  const c = document.querySelector('.notes-content')
  c.scrollTop = c.scrollHeight
})
await page.waitForTimeout(600)
await page.screenshot({ path: 'shot-clear-bottom.png' })

await browser.close()

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
  const decor = document.querySelector('.notes-bg-decor')
  const wave1 = document.querySelector('.bg-wave-1')
  const wave2 = document.querySelector('.bg-wave-2')
  const dots = document.querySelector('.bg-dots')
  const inner = document.querySelector('.notes-content-inner')
  return {
    decorPresent: !!decor,
    wave1Color: wave1 ? getComputedStyle(wave1).color : null,
    wave1Opacity: wave1 ? getComputedStyle(wave1).opacity : null,
    wave1Anim: wave1 ? getComputedStyle(wave1).animationName : null,
    wave2Present: !!wave2,
    dotsPresent: !!dots,
    dotsBg: dots ? getComputedStyle(dots).backgroundImage.slice(0, 50) : null,
    dotsMask: dots ? getComputedStyle(dots).maskImage?.slice(0, 40) : null,
    innerZ: inner ? getComputedStyle(inner).zIndex : null,
    cardAboveDecor: (() => {
      const c = document.querySelector('.folder-card')
      const d = document.querySelector('.notes-bg-decor')
      if (!c || !d) return null
      return getComputedStyle(c).zIndex >= getComputedStyle(d).zIndex
    })()
  }
})
console.log('背景装饰:', JSON.stringify(info, null, 2))

await page.screenshot({ path: 'shot-bg-all.png' })

// 滚动后看背景是否还在（fixed/sticky 效果测试）
await page.evaluate(() => {
  document.querySelector('.notes-content').scrollTop = 200
})
await page.waitForTimeout(500)
await page.screenshot({ path: 'shot-bg-scroll.png' })

// 单文件夹区
const fid = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  return pinia._s.get('note').notes.find(n => !n.deleted)?.folderId
})
if (fid) {
  await page.evaluate((id) => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(id), fid)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'shot-bg-folder.png' })
}

await browser.close()

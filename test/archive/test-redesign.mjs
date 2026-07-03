import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1400, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 注入不同颜色的笔记 + 一篇带图片
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const notes = ns.notes.filter(n => !n.deleted)
  if (notes[0]) {
    ns.addBlock(notes[0].id, { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1517816743773-6e0fd518b4a6?w=600&q=80', x: 100, y: 100 })
  }
  // 给几篇笔记不同颜色
  const colors = ['#6bbd8f', '#6fa8d6', '#d4b27a', '#a99ad6', '#d4956a']
  notes.slice(0, 5).forEach((n, i) => {
    if (!n.blocks.some(b => b.type === 'image')) {
      ns.updateNote(n.id, { color: colors[i % colors.length] })
    }
  })
})

await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

// 截图：全部文件夹 + 全部笔记
await page.screenshot({ path: 'shot-redesign-all.png' })

// 验证关键元素结构
const info = await page.evaluate(() => {
  const spine = document.querySelector('.folder-card-spine')
  const badge = document.querySelector('.folder-card-badge')
  const arrow = document.querySelector('.folder-card-arrow')
  const manuscript = document.querySelector('.note-cover-manuscript')
  const initial = document.querySelector('.manuscript-initial')
  const cover = document.querySelector('.note-card-cover')
  const coverImg = document.querySelector('.note-card-cover img')
  return {
    spine: !!spine,
    spineW: spine ? getComputedStyle(spine).width : null,
    badge: !!badge,
    arrow: !!arrow,
    manuscriptCount: document.querySelectorAll('.note-cover-manuscript').length,
    initialText: initial ? initial.textContent : null,
    initialFont: initial ? getComputedStyle(initial).fontFamily.slice(0, 40) : null,
    coverInset: cover ? getComputedStyle(cover).margin : null,
    coverH: cover ? getComputedStyle(cover).height : null,
    coverImgCount: document.querySelectorAll('.note-card-cover img').length,
    manuscriptBg: manuscript ? getComputedStyle(manuscript).background.slice(0, 50) : null
  }
})
console.log('结构验证:', JSON.stringify(info, null, 2))

// hover 截图（文件夹卡）
await page.locator('.folder-card').first().hover()
await page.waitForTimeout(400)
await page.screenshot({ path: 'shot-redesign-hover.png' })

await browser.close()

import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// 注入带图片的笔记
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const notes = ns.notes.filter(n => !n.deleted)
  if (notes[0]) ns.addBlock(notes[0].id, { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80', x: 100, y: 100 })
  const colors = ['#6b8f5e', '#a8853f', '#4f7d8c', '#c0744f', '#7a5c8c']
  notes.slice(0, 6).forEach((n, i) => {
    if (!n.blocks.some(b => b.type === 'image')) ns.updateNote(n.id, { color: colors[i % colors.length] })
  })
})

await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

await page.screenshot({ path: 'shot-pixel-all.png' })

const info = await page.evaluate(() => {
  const card = document.querySelector('.pixel-card')
  const win = document.querySelector('.px-window-bar')
  const title = document.querySelector('.px-title')
  const sprite = document.querySelector('.px-sprite svg')
  const badge = document.querySelector('.px-count-badge')
  const screen = document.querySelector('.px-screen')
  const empty = document.querySelector('.px-screen-empty')
  return {
    cardCount: document.querySelectorAll('.pixel-card').length,
    folderCount: document.querySelectorAll('.pixel-folder').length,
    noteCount: document.querySelectorAll('.pixel-note').length,
    border: card ? getComputedStyle(card).border : null,
    boxShadow: card ? getComputedStyle(card).boxShadow.slice(0, 60) : null,
    winBg: win ? getComputedStyle(win).backgroundColor : null,
    titleFont: title ? getComputedStyle(title).fontFamily.slice(0, 30) : null,
    spritePresent: !!sprite,
    badgeText: badge ? badge.textContent : null,
    screenBg: screen ? getComputedStyle(screen).backgroundColor : null,
    emptyPresent: !!empty
  }
})
console.log('像素风结构:', JSON.stringify(info, null, 2))

// hover + active 截图
await page.locator('.pixel-folder').first().hover()
await page.waitForTimeout(400)
await page.screenshot({ path: 'shot-pixel-hover.png' })

// 单文件夹区
const fid = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  return pinia._s.get('note').notes.find(n => !n.deleted)?.folderId
})
if (fid) {
  await page.evaluate((id) => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(id), fid)
  await page.waitForTimeout(1500)
  await page.screenshot({ path: 'shot-pixel-folder.png' })
}

await browser.close()

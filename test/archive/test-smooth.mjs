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

// 结构验证
const info = await page.evaluate(() => {
  const folder = document.querySelector('.folder-card')
  const note = document.querySelector('.note-card')
  const wave = document.querySelector('.folder-card-wave')
  const icon = document.querySelector('.folder-card-icon')
  const dot = document.querySelector('.folder-card-dot')
  const media = document.querySelector('.note-card-media')
  const deco = document.querySelector('.note-card-media-deco')
  const blocks = document.querySelector('.note-card-blocks')
  const bodyLine = document.querySelector('.note-card-body')
  const s = (el, p) => el ? Object.fromEntries(p.map(x => [x, getComputedStyle(el)[x]])) : null
  return {
    wave: !!wave,
    waveColor: wave ? getComputedStyle(wave).color : null,
    iconRadius: s(icon, ['borderRadius'])?.borderRadius,
    iconBg: s(icon, ['background'])?.background?.slice(0, 50),
    dot: !!dot,
    dotRadius: s(dot, ['borderRadius'])?.borderRadius,
    mediaBg: s(media, ['background'])?.background?.slice(0, 60),
    mediaH: s(media, ['height'])?.height,
    decoPresent: !!deco,
    blocksText: blocks ? blocks.textContent : null,
    blocksRadius: s(blocks, ['borderRadius'])?.borderRadius,
    bodyBefore: !!bodyLine,
    folderCount: document.querySelectorAll('.folder-card').length,
    noteCount: document.querySelectorAll('.note-card').length
  }
})
console.log('平滑线条风:', JSON.stringify(info, null, 2))

await page.screenshot({ path: 'shot-smooth-all.png' })

// hover 文件夹
await page.locator('.folder-card').first().hover()
await page.waitForTimeout(500)
await page.screenshot({ path: 'shot-smooth-hover.png' })

// 单文件夹区
const fid = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  return pinia._s.get('note').notes.find(n => !n.deleted)?.folderId
})
if (fid) {
  await page.evaluate((id) => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(id), fid)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'shot-smooth-folder.png' })
  await page.locator('.note-card').first().hover()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'shot-smooth-note-hover.png' })
}

await browser.close()

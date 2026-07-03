import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 注入带图片的笔记
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const notes = ns.notes.filter(n => !n.deleted)
  if (notes[0]) ns.addBlock(notes[0].id, { type: 'image', imageUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=500&q=80', x: 100, y: 100 })
})

await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

// 验证简约风结构 + 与全局 token 协调
const info = await page.evaluate(() => {
  const folder = document.querySelector('.folder-card')
  const note = document.querySelector('.note-card')
  const icon = document.querySelector('.folder-card-icon')
  const folderTag = document.querySelector('.note-card-folder')
  const styles = (el, props) => {
    if (!el) return null
    const cs = getComputedStyle(el)
    return Object.fromEntries(props.map(p => [p, cs[p]]))
  }
  return {
    folder: styles(folder, ['borderRadius', 'borderColor', 'boxShadow', 'padding']),
    note: styles(note, ['borderRadius', 'borderColor', 'boxShadow']),
    icon: styles(icon, ['width', 'height', 'borderRadius', 'background', 'color']),
    folderTag: styles(folderTag, ['background', 'color', 'borderRadius', 'padding']),
    hasPixelFont: !!document.querySelector('[class*="px-"]'),
    fontFamily: note ? getComputedStyle(note).fontFamily : null
  }
})
console.log('简约风结构:', JSON.stringify(info, null, 2))

await page.screenshot({ path: 'shot-clean-all.png' })

// hover 文件夹卡
await page.locator('.folder-card').first().hover()
await page.waitForTimeout(400)
await page.screenshot({ path: 'shot-clean-hover.png' })

// 单文件夹区
const fid = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  return pinia._s.get('note').notes.find(n => !n.deleted)?.folderId
})
if (fid) {
  await page.evaluate((id) => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(id), fid)
  await page.waitForTimeout(1200)
  await page.screenshot({ path: 'shot-clean-folder.png' })
  // hover 笔记看操作按钮
  await page.locator('.note-card').first().hover()
  await page.waitForTimeout(400)
  await page.screenshot({ path: 'shot-clean-note-hover.png' })
}

await browser.close()

import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1400, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.evaluate(() => document.querySelector('#app').__vue_app__.config.globalProperties.$pinia._s.get('note').setCurrentFolder(null))
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const info = await page.evaluate(() => {
  const banner = document.querySelector('.folder-card-banner')
  const banners = document.querySelectorAll('.folder-card-banner')
  const tops = document.querySelectorAll('.note-card-top')
  const topIcons = document.querySelectorAll('.note-card-top-icon')
  const topImgs = document.querySelectorAll('.note-card-top img')
  return {
    folderBannerCount: banners.length,
    folderBannerBg: banner ? getComputedStyle(banner).background.slice(0,60) : null,
    folderBannerHeight: banner ? getComputedStyle(banner).height : null,
    noteTopCount: tops.length,
    noteTopIconCount: topIcons.length,
    noteTopImgCount: topImgs.length
  }
})
console.log('全部视图检查:', JSON.stringify(info, null, 2))

await page.screenshot({ path: 'shot-all2.png' })
await browser.close()

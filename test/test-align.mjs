import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

// 用 getBoundingClientRect 检测元素是否靠右对齐
async function checkRightAlign(selector, pageWidth) {
  return await page.evaluate((sel) => {
    const el = document.querySelector(sel)
    if (!el) return { found: false }
    const r = el.getBoundingClientRect()
    return {
      found: true,
      left: Math.round(r.left),
      right: Math.round(r.right),
      width: Math.round(r.width),
      distanceToRightEdge: Math.round(window.innerWidth - r.right)
    }
  }, selector)
}

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ===== 设置页 =====
await page.goto('http://localhost:5199/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const storageActions = await checkRightAlign('.storage-location-item .storage-actions')
console.log('设置页 storage-actions:', JSON.stringify(storageActions))

// ===== 笔记页 =====
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const notesHeader = await checkRightAlign('.view-header .header-right')
const notesSearch = await checkRightAlign('.view-header .search-box')
console.log('笔记页 header-right:', JSON.stringify(notesHeader))
console.log('笔记页 search-box:', JSON.stringify(notesSearch))
await page.screenshot({ path: 'shot-notes.png' })

// ===== 计划页 =====
await page.goto('http://localhost:5199/#/plans', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const plansHeader = await checkRightAlign('.view-header .header-right')
console.log('计划页 header-right:', JSON.stringify(plansHeader))
await page.screenshot({ path: 'shot-plans.png' })

const pageWidth = await page.evaluate(() => window.innerWidth)
console.log('页面宽度:', pageWidth, '(按钮 distanceToRightEdge 应接近 padding≈28-50)')

await browser.close()

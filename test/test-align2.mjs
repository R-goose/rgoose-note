import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

async function rect(sel) {
  return await page.evaluate((s) => {
    const el = document.querySelector(s)
    if (!el) return { found: false }
    const r = el.getBoundingClientRect()
    return { found: true, left: Math.round(r.left), right: Math.round(r.right), distToRight: Math.round(window.innerWidth - r.right) }
  }, sel)
}

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 设置页
await page.goto('http://localhost:5199/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
console.log('设置页 storage-actions:', JSON.stringify(await rect('.storage-location-item .storage-actions')))

// 笔记页（选中一个文件夹让"新建笔记"按钮显示）
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
// 点击第一个文件夹
await page.evaluate(() => {
  const folders = document.querySelectorAll('.folder-card, [class*="folder"]')
  if (folders.length) folders[0].click()
})
await page.waitForTimeout(800)
console.log('笔记页 header-right:', JSON.stringify(await rect('.view-header .header-right')))
console.log('笔记页 search-box:', JSON.stringify(await rect('.view-header .search-box')))
const newNoteBtn = await page.evaluate(() => {
  const btns = document.querySelectorAll('.header-right .btn-primary')
  if (!btns.length) return { found: false }
  const r = btns[btns.length - 1].getBoundingClientRect()
  return { found: true, right: Math.round(r.right), distToRight: Math.round(window.innerWidth - r.right), text: btns[btns.length-1].textContent.trim() }
})
console.log('笔记页 新建笔记按钮:', JSON.stringify(newNoteBtn))
await page.screenshot({ path: 'shot-notes2.png' })

// 计划页
await page.goto('http://localhost:5199/#/plans', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
console.log('计划页 header-right:', JSON.stringify(await rect('.view-header .header-right')))
const planBtn = await page.evaluate(() => {
  const b = document.querySelector('.header-right .btn-primary')
  if (!b) return { found: false }
  const r = b.getBoundingClientRect()
  return { found: true, right: Math.round(r.right), distToRight: Math.round(window.innerWidth - r.right) }
})
console.log('计划页 新建计划按钮:', JSON.stringify(planBtn))
await page.screenshot({ path: 'shot-plans2.png' })

console.log('--- 预期 distToRight ≈ 28（仅 padding），若仍 168 则未修复 ---')

await browser.close()

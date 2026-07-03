import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1280, height: 800 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 验证深色模式按钮在侧边栏底部
const pos = await page.evaluate(() => {
  const sidebar = document.querySelector('.sidebar')
  const footer = document.querySelector('.sidebar-footer')
  if (!sidebar || !footer) return { err: true, sb: !!sidebar, ft: !!footer }
  const sb = sidebar.getBoundingClientRect()
  const ft = footer.getBoundingClientRect()
  return {
    sidebarBottom: Math.round(sb.bottom),
    footerBottom: Math.round(ft.bottom),
    footerTop: Math.round(ft.top),
    gap: Math.round(sb.bottom - ft.bottom),
    nearBottom: (sb.bottom - ft.bottom) >= -2 && (sb.bottom - ft.bottom) <= 5
  }
})
console.log('深色模式footer位置:', JSON.stringify(pos))
console.log('是否在侧边栏底部:', pos.nearBottom ? '✓' : '✗')

// 验证折叠文件夹分组后，深色模式仍在底部
await page.locator('.group-header:has-text("文件夹")').click()
await page.waitForTimeout(400)
const pos2 = await page.evaluate(() => {
  const sidebar = document.querySelector('.sidebar')
  const footer = document.querySelector('.sidebar-footer')
  const sb = sidebar.getBoundingClientRect()
  const ft = footer.getBoundingClientRect()
  return { sidebarBottom: Math.round(sb.bottom), footerBottom: Math.round(ft.bottom), nearBottom: (sb.bottom - ft.bottom) >= -2 && (sb.bottom - ft.bottom) <= 5 }
})
console.log('折叠文件夹后footer位置:', JSON.stringify(pos2))
console.log('折叠后仍在底部:', pos2.nearBottom ? '✓' : '✗')

await browser.close()

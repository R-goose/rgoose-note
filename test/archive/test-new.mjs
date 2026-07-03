import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ===== 第12点：主题图标 =====
// 默认浅色模式，应显示太阳图标
const themeIconLight = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const isDark = pinia._s.get('theme').isDark
  const svg = document.querySelector('.theme-row-icon svg')
  const isSun = svg && svg.querySelector('circle')
  return { isDark, isSun: !!isSun }
})
console.log('1. 浅色模式图标(应太阳☀):', themeIconLight.isSun ? '太阳☀' : '月亮☾', themeIconLight.isSun ? '✓' : '✗')

// 切换到深色，应显示月亮
await page.click('.theme-row')
await page.waitForTimeout(500)
const themeIconDark = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const isDark = pinia._s.get('theme').isDark
  const svg = document.querySelector('.theme-row-icon svg')
  const isMoon = svg && svg.querySelector('path[d*="12.79"]')
  return { isDark, isMoon: !!isMoon }
})
console.log('2. 深色模式图标(应月亮☾):', themeIconDark.isMoon ? '月亮☾' : '太阳☀', themeIconDark.isMoon ? '✓' : '✗')

// 切回浅色
await page.click('.theme-row')
await page.waitForTimeout(300)

// ===== 第11点：侧边栏分组折叠 =====
const hasToolbar = await page.locator('.group-header:has-text("工具栏")').count()
console.log('3. 工具栏分组标题:', hasToolbar > 0 ? '存在✓' : '缺失✗')

// 点击工具栏折叠
await page.locator('.group-header:has-text("工具栏")').click()
await page.waitForTimeout(300)
const navVisible = await page.locator('.sidebar-nav').isVisible()
console.log('4. 折叠后导航项隐藏:', !navVisible ? '✓' : '✗ 仍可见')

// 展开
await page.locator('.group-header:has-text("工具栏")').click()
await page.waitForTimeout(300)
const navVisible2 = await page.locator('.sidebar-nav').isVisible()
console.log('5. 展开后导航项显示:', navVisible2 ? '✓' : '✗')

// 文件夹分组折叠
const folderGroup = await page.locator('.group-header:has-text("文件夹")').count()
console.log('6. 文件夹分组标题:', folderGroup > 0 ? '存在✓' : '缺失✗')

// ===== 第13点：点击笔记显示全部文件夹 =====
// 先清空当前文件夹选择
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  pinia._s.get('note').setCurrentFolder(null)
})
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

const hasFolderGrid = await page.locator('.folder-card-grid').count()
const hasFolderCard = await page.locator('.folder-card').count()
const hasAllNotes = await page.locator('.all-notes-section').count()
console.log('7. 全部文件夹网格:', hasFolderGrid > 0 ? '显示✓' : '缺失✗')
console.log('8. 文件夹卡片数:', hasFolderCard)
console.log('9. 全部笔记区:', hasAllNotes > 0 ? '显示✓' : '缺失✗')

// 点击文件夹卡片进入
if (hasFolderCard > 0) {
  await page.locator('.folder-card').first().click()
  await page.waitForTimeout(800)
  const inFolder = await page.evaluate(() => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    return pinia._s.get('note').currentFolderId
  })
  console.log('10. 点击文件夹进入:', inFolder ? '✓' : '✗')
}

await browser.close()

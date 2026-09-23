import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.goto('http://localhost:5199/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 测试1：formatBytes 工具函数
const fmtTest = await page.evaluate(async () => {
  const { formatBytes } = await import('/src/utils/index.js')
  return {
    '0': formatBytes(0),
    '500B': formatBytes(500),
    '1KB': formatBytes(1024),
    '1.5MB': formatBytes(1024 * 1024 * 1.5),
    '2GB': formatBytes(1024 ** 3 * 2)
  }
})
console.log('formatBytes 测试:', JSON.stringify(fmtTest, null, 2))

// 测试2：确认弹窗（清除缓存）——Web 端无 electronAPI，但弹窗逻辑应正常
const settingsInfo = await page.evaluate(() => {
  return {
    hasClearBtn: !!Array.from(document.querySelectorAll('.setting-name')).find(el => el.textContent.includes('清除缓存')),
    hasBackupBtn: !!Array.from(document.querySelectorAll('.setting-name')).find(el => el.textContent.includes('本地备份')),
    storageUsageVisible: !!document.querySelector('.storage-usage-item'),
    backupListVisible: !!document.querySelector('.backup-list')
  }
})
console.log('设置页元素:', JSON.stringify(settingsInfo, null, 2))

// 测试3：点击清除缓存按钮，验证弹窗出现（而不是立即清除）
await page.evaluate(() => {
  const btns = document.querySelectorAll('button')
  for (const b of btns) {
    if (b.textContent.trim().includes('清除')) { b.click(); break }
  }
})
await page.waitForTimeout(400)
const confirmModal = await page.evaluate(() => {
  const modal = document.querySelector('.confirm-modal')
  const title = modal?.querySelector('h3')?.textContent
  return { present: !!modal, title }
})
console.log('清除缓存确认弹窗:', JSON.stringify(confirmModal, null, 2))
await page.screenshot({ path: 'shot-confirm.png' })

// 测试4：点击取消，弹窗关闭
await page.evaluate(() => {
  const btns = document.querySelectorAll('.confirm-actions button')
  for (const b of btns) {
    if (b.textContent.includes('取消')) { b.click(); break }
  }
})
await page.waitForTimeout(300)
const modalAfterCancel = await page.evaluate(() => !!document.querySelector('.confirm-modal'))
console.log('取消后弹窗关闭:', !modalAfterCancel)

await browser.close()

import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(2000)
const noteId = page.url().split('/note/')[1]

// 找已有的连线（前一个测试已注入）
const info = await page.evaluate(() => {
  const paths = document.querySelectorAll('.connection-path')
  return [...paths].map(p => {
    const total = p.getTotalLength()
    const mid = p.getPointAtLength(total/2)
    return { total: total.toFixed(0), midX: mid.x.toFixed(0), midY: mid.y.toFixed(0), d: p.getAttribute('d').slice(0,50) }
  })
})
console.log('DOM中path中点:', JSON.stringify(info, null, 2))

await browser.close()

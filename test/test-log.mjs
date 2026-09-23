import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: true, executablePath: getBrowserPath() })
const page = await browser.newPage()
const logs = []
page.on('console', msg => { if (msg.text().includes('[FMT]')) logs.push(msg.text()) })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await ed.evaluate(el => { el.innerHTML = 'ABCDEFGHIJ'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(300)

await ed.evaluate(el => {
  const range = document.createRange()
  range.setStart(el.firstChild, 2)
  range.setEnd(el.firstChild, 5)
  const sel = window.getSelection()
  sel.removeAllRanges()
  sel.addRange(range)
  el.focus()
})
await page.waitForTimeout(200)

// 点击"大"按钮（真实点击）
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(500)

console.log('=== FMT LOGS ===')
logs.forEach(l => console.log(l))

await browser.close()

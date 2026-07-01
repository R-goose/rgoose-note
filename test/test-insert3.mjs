import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)
const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await page.keyboard.type('X')
await page.waitForTimeout(200)

await page.keyboard.press('Control+Shift+KeyJ')
await page.waitForTimeout(500)
const h = await ed.evaluate(el => el.innerHTML)
console.log('完整html:', h)
console.log('含Consolas/代码样式:', /consol|<pre|<code/i.test(h))

await browser.close()

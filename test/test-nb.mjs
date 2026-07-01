import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
const logs = []
page.on('console', msg => { if (msg.text().includes('[NB]')) logs.push(msg.text()) })

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await page.keyboard.type('ABCDEFGH')
await page.waitForTimeout(300)

// 干净选中 BCD
await page.keyboard.press('Home')
await page.keyboard.press('ArrowRight')
await page.keyboard.press('Shift+ArrowRight')
await page.keyboard.press('Shift+ArrowRight')
await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(300)

logs.length = 0
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
console.log('1st 大:', await ed.evaluate(el => el.innerHTML))
console.log('  logs:', logs)

logs.length = 0
await page.locator('.block-style-toolbar button').filter({ hasText: '特大' }).first().click()
await page.waitForTimeout(400)
console.log('2nd 特大:', await ed.evaluate(el => el.innerHTML))
console.log('  logs:', logs)

await browser.close()

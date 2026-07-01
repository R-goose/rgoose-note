import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
const logs = []
page.on('console', msg => { if (msg.text().includes('[')) logs.push(msg.text()) })

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await page.keyboard.type('ABCDEFGH')
await page.waitForTimeout(300)
await page.keyboard.press('Home')
await page.keyboard.press('ArrowRight')
for (let i = 0; i < 3; i++) await page.keyboard.press('Shift+ArrowRight')
await page.waitForTimeout(300)

logs.length = 0
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
console.log('1st:', await ed.evaluate(el => el.innerHTML))
console.log('  logs1:', logs)

logs.length = 0
await page.locator('.block-style-toolbar button').filter({ hasText: '特大' }).first().click()
await page.waitForTimeout(400)
console.log('2nd:', await ed.evaluate(el => el.innerHTML))
console.log('  logs2:', logs)
console.log('  sel now:', await page.evaluate(() => window.getSelection().toString()))

logs.length = 0
await page.locator('.block-style-toolbar button').filter({ hasText: '小' }).first().click()
await page.waitForTimeout(400)
console.log('3rd:', await ed.evaluate(el => el.innerHTML))
console.log('  logs3:', logs)

await browser.close()

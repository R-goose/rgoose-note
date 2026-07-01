import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
]
const exepath = paths.find(p => existsSync(p))
console.log('Browser:', exepath)

const browser = await chromium.launch({ headless: true, executablePath: exepath })
const page = await browser.newPage()

const errors = []
page.on('console', msg => { if (msg.type() === 'error') errors.push(msg.text()) })
page.on('pageerror', err => errors.push('PAGE: ' + err.message))

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: 'e:/大师的/shot-home.png', fullPage: true })

const notes = await page.locator('.note-card, .note-item, [class*=note]').count().catch(() => 0)
console.log('note cards:', notes)

const btnTexts = await page.locator('button, .btn, [class*=button]').allTextContents().catch(() => [])
console.log('buttons:', JSON.stringify(btnTexts.slice(0, 15)))

await browser.close()
console.log('errors:', errors.slice(0, 5))

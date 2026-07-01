import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
page.on('console', msg => { const t = msg.text(); if (t.includes('[NB-KD]') || t.includes('[SC]')) console.log('LOG:', t) })

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)
const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await page.keyboard.type('X')
await page.waitForTimeout(200)

// 先查 store 里 insertCode 的当前绑定
const bind = await page.evaluate(() => {
  const stores = window.__pinia || {}
  return null
})
// 用 localStorage 看绑定
const saved = await page.evaluate(() => localStorage.getItem('rgoose_shortcuts'))
console.log('localStorage shortcuts:', saved)

// 模拟按键，看 combo
const combo = await page.evaluate(() => {
  const fakeEvent = { ctrlKey: true, shiftKey: true, altKey: false, metaKey: false, key: 'J' }
  return null
})

// 直接在页面里 dispatch keydown 并捕获
await ed.evaluate(el => {
  el.addEventListener('keydown', (e) => {
    console.log('[NB-KD] key:', e.key, 'ctrl:', e.ctrlKey, 'shift:', e.shiftKey)
  }, true)
})

await page.keyboard.press('Control+Shift+KeyJ')
await page.waitForTimeout(500)
const h = await ed.evaluate(el => el.innerHTML)
console.log('after html:', h)

await browser.close()

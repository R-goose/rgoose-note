import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: true, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
const logs = []
page.on('console', msg => { if (msg.text().includes('FMT') || msg.text().includes('NB')) logs.push(msg.text()) })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await ed.evaluate(el => { el.innerHTML = 'HELLOWORLD'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(400)
await ed.evaluate(el => {
  const r = document.createRange()
  r.setStart(el.firstChild, 1); r.setEnd(el.firstChild, 5)
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); el.focus()
  el.dispatchEvent(new Event('mouseup', { bubbles: true }))
})
await page.waitForTimeout(200)

// 点红色按钮（最后一个文字颜色按钮，title 含 d97676 或直接用 nth）
const redBtn = page.locator('.block-style-toolbar button.color-btn[title*="文字颜色"]').last()
console.log('red btn title:', await redBtn.getAttribute('title'))
await redBtn.click()
await page.waitForTimeout(400)

const h = await ed.evaluate(el => el.innerHTML)
console.log('AFTER COLOR:', h)
console.log('LOGS:', logs)

await browser.close()

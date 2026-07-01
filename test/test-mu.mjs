import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: true, executablePath: paths.find(p => existsSync(p)) })
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
await ed.evaluate(el => { el.innerHTML = 'HELLOWORLD'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(400)

async function selectText(text) {
  await ed.evaluate((el, t) => {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    let node
    while (node = walker.nextNode()) {
      const idx = node.textContent.indexOf(t)
      if (idx >= 0) {
        const r = document.createRange()
        r.setStart(node, idx); r.setEnd(node, idx + t.length)
        const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r)
        el.focus()
        el.dispatchEvent(new Event('mouseup', { bubbles: true }))
        return
      }
    }
  }, text)
  await page.waitForTimeout(150)
}

// 第一次设16
await selectText('ELLO')
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
console.log('1st:', await ed.evaluate(el => el.innerHTML))

// 第二次设20
logs.length = 0
await selectText('ELLO')
await page.locator('.block-style-toolbar button').filter({ hasText: '特大' }).first().click()
await page.waitForTimeout(400)
console.log('2nd:', await ed.evaluate(el => el.innerHTML))
console.log('LOGS during 2nd:', logs)

await browser.close()

import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: true, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await ed.evaluate(el => { el.innerHTML = 'HELLOWORLD'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(400)

// 选中 ELLO
await ed.evaluate(el => {
  const r = document.createRange()
  r.setStart(el.firstChild, 1); r.setEnd(el.firstChild, 5)
  const s = window.getSelection(); s.removeAllRanges(); s.addRange(r); el.focus()
  el.dispatchEvent(new Event('mouseup', { bubbles: true }))
})
await page.waitForTimeout(200)

// 测试颜色：点击第一个颜色块（用 title 选择器）
const colorBtn = page.locator('.block-style-toolbar button.color-btn[title*="文字颜色"]').first()
const cnt = await colorBtn.count()
console.log('color btn count:', cnt)
if (cnt > 0) {
  await colorBtn.click()
  await page.waitForTimeout(400)
  const h = await ed.evaluate(el => el.innerHTML)
  console.log('AFTER COLOR:', h)
  console.log('COLOR applied:', /color/i.test(h))
}

// 测试无选中时点字号（应该整块变化）
await ed.evaluate(el => { el.innerHTML = 'PLAINTEXT'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(300)
// 不选中任何文字，直接点字号
await page.locator('.block-style-toolbar button').filter({ hasText: '大' }).first().click()
await page.waitForTimeout(400)
const h2 = await ed.evaluate(el => el.innerHTML)
console.log('NO-SEL SIZE (should be block fontSize):', await page.evaluate(() => {
  const b = document.querySelector('.note-block.selected')
  return b ? b.getAttribute('class') : 'none'
}))

await browser.close()

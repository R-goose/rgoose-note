import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: true, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)

const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await ed.evaluate(el => { el.innerHTML = 'HELLOWORLD'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(400)

async function selectAndClick(start, end, btnText) {
  await ed.evaluate((el, [s, e]) => {
    // 找到纯文本节点
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
    const textNode = walker.nextNode()
    const r = document.createRange()
    r.setStart(textNode, s); r.setEnd(textNode, e)
    const sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r); el.focus()
    el.dispatchEvent(new Event('mouseup', { bubbles: true }))
  }, [start, end])
  await page.waitForTimeout(200)
  await page.locator('.block-style-toolbar button').filter({ hasText: btnText }).first().click()
  await page.waitForTimeout(400)
}

// 第一次：选中 ELLO，设字号16
await selectAndClick(1, 5, '大')
let h = await ed.evaluate(el => el.innerHTML)
console.log('1st size16:', h)

// 第二次：选中 ELLO（现在在span内），设字号20
await selectAndClick(1, 5, '特大')
h = await ed.evaluate(el => el.innerHTML)
console.log('2nd size20:', h)

await browser.close()

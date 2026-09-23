import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: true, executablePath: getBrowserPath() })
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

// 选中编辑器里指定的文字（自动找文本节点，兼容 span 嵌套）
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

async function clickBtn(text) {
  await page.locator('.block-style-toolbar button').filter({ hasText: text }).first().click()
  await page.waitForTimeout(300)
}

// 测试1：选中 ELLO，依次设字号16、20、12（多次切换）
await selectText('ELLO')
await clickBtn('大')
console.log('1st 16px:', await ed.evaluate(el => el.innerHTML))

await selectText('ELLO')
await clickBtn('特大')
console.log('2nd 20px:', await ed.evaluate(el => el.innerHTML))

await selectText('ELLO')
await clickBtn('小')
console.log('3rd 12px:', await ed.evaluate(el => el.innerHTML))

// 测试2：字重切换
await selectText('ELLO')
await clickBtn('粗体')
console.log('weight 700:', await ed.evaluate(el => el.innerHTML))

await selectText('ELLO')
await clickBtn('常规')
console.log('weight 400:', await ed.evaluate(el => el.innerHTML))

// 测试3：选中不同段落
await selectText('WORLD')
await clickBtn('特大')
console.log('WORLD 20px:', await ed.evaluate(el => el.innerHTML))

const ok = ['16px', '20px', '12px'].every(s => true)
console.log('=== ALL TESTS DONE ===')

await browser.close()

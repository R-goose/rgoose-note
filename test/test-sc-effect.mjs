import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()

await page.goto('http://localhost:5200/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 把"新建文本块"绑定为 Q（找到 newBlock 对应的框）
const boxes = await page.locator('.keybind-box').allTextContents()
const newBlockIdx = boxes.findIndex(t => t.includes('N'))
console.log('1. 新建块按钮索引:', newBlockIdx, '当前:', boxes[newBlockIdx])

await page.locator('.keybind-box').nth(newBlockIdx).click()
await page.waitForTimeout(300)
await page.keyboard.press('Q')
await page.waitForTimeout(400)
const after = await page.locator('.keybind-box').nth(newBlockIdx).textContent()
console.log('2. 重绑为:', after)

// 进入笔记编辑器
await page.locator('.note-item').first().click().catch(async () => {
  await page.goto('http://localhost:5200/#/notes')
  await page.waitForTimeout(800)
  await page.locator('.note-item').first().click()
})
await page.waitForTimeout(1500)

const blocksBefore = await page.locator('.note-block').count()
console.log('3. 重绑前块数:', blocksBefore)

// 按 Q（新绑定）应新建块
await page.keyboard.press('Q')
await page.waitForTimeout(800)
const blocksAfterQ = await page.locator('.note-block').count()
console.log('4. 按Q后块数(应+1):', blocksAfterQ)

// 按 N（原绑定）现在应无效
await page.keyboard.press('Escape')
await page.waitForTimeout(200)
await page.keyboard.press('N')
await page.waitForTimeout(500)
const blocksAfterN = await page.locator('.note-block').count()
console.log('5. 按N后块数(应不变):', blocksAfterN)

console.log('=== 结果: Q生效=', blocksAfterQ === blocksBefore + 1, ' N失效=', blocksAfterN === blocksAfterQ)

await browser.close()

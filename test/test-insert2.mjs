import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

// 进设置页确认"插入内容"分组渲染
await page.goto('http://localhost:5200/#/settings', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
const groupVisible = await page.locator('text=插入内容').count()
console.log('1. 设置页"插入内容"分组:', groupVisible > 0 ? '显示' : '缺失')

const totalBoxes = await page.locator('.keybind-box').count()
console.log('2. 按键框总数(原18+新7=25):', totalBoxes)

// 找到"插入代码块"项并重绑为 Ctrl+Shift+J
const items = await page.locator('.shortcut-name').allTextContents()
const codeIdx = items.findIndex(t => t.includes('插入代码块'))
console.log('3. 插入代码块项索引:', codeIdx)

// 重绑：找到对应的 keybind-box（同一 shortcut-item 内）
const codeBox = page.locator('.shortcut-item').nth(codeIdx).locator('.keybind-box')
await codeBox.click()
await page.waitForTimeout(300)
await page.keyboard.press('Control+Shift+KeyJ')
await page.waitForTimeout(400)
const after = await codeBox.textContent()
console.log('4. 重绑为(应 Ctrl+Shift+J):', after)

// 进编辑器测试新绑定 Ctrl+Shift+J 插入代码块
await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
await page.locator('.note-item').first().click()
await page.waitForTimeout(1500)
const ed = page.locator('.text-editor').first()
await ed.click()
await page.waitForTimeout(300)
await page.keyboard.type('X')
await page.waitForTimeout(200)

// 按 Ctrl+Shift+J 应插入代码块（新绑定）
await page.keyboard.press('Control+Shift+KeyJ')
await page.waitForTimeout(500)
const h = await ed.evaluate(el => el.innerHTML)
console.log('5. 新绑定Ctrl+Shift+J插入代码块:', /<pre>/i.test(h) ? '✓ 生效' : '✗ 未生效')
console.log('   html:', h.slice(0, 60))

// 按旧的 Ctrl+Shift+K 应无效
await ed.evaluate(el => { el.innerHTML = 'X'; el.dispatchEvent(new Event('input', { bubbles: true })) })
await page.waitForTimeout(200)
await page.keyboard.press('Control+Shift+KeyK')
await page.waitForTimeout(500)
const h2 = await ed.evaluate(el => el.innerHTML)
console.log('6. 旧绑定Ctrl+Shift+K应失效:', /<pre>/i.test(h2) ? '✗ 仍生效' : '✓ 已失效')

await browser.close()

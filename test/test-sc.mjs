import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()

await page.goto('http://localhost:5200/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 进入设置页
await page.goto('http://localhost:5200/#/settings')
await page.waitForTimeout(1500)
await page.screenshot({ path: 'e:/大师的/shot-settings.png', fullPage: true })

// 检查快捷键区块是否渲染
const hasShortcutSection = await page.locator('text=快捷键').count()
console.log('1. 快捷键区块:', hasShortcutSection > 0 ? '存在' : '缺失')

const keybindBoxes = await page.locator('.keybind-box').count()
console.log('2. 按键框数量:', keybindBoxes)

// 检查默认值是否正确显示
const firstBoxText = await page.locator('.keybind-box').first().textContent()
console.log('3. 第一个按键框(应为 Ctrl + C):', firstBoxText)

// 测试录入：点击第一个框（复制块 Ctrl+C），按 Ctrl+Shift+X
await page.locator('.keybind-box').first().click()
await page.waitForTimeout(300)
const recording = await page.locator('.keybind-box.recording').count()
console.log('4. 录入态:', recording > 0 ? '激活' : '未激活')

await page.keyboard.press('Control+Shift+X')
await page.waitForTimeout(500)
const afterRebind = await page.locator('.keybind-box').first().textContent()
console.log('5. 重绑后(应为 Ctrl + Shift + X):', afterRebind)

// 检查 custom 标签
const customTag = await page.locator('.custom-tag').count()
console.log('6. 自定义标签数:', customTag)

// 测试冲突：把第二个（粘贴 Ctrl+V）也设成 Ctrl+Shift+X
await page.locator('.keybind-box').nth(1).click()
await page.waitForTimeout(300)
await page.keyboard.press('Control+Shift+X')
await page.waitForTimeout(500)
const secondBox = await page.locator('.keybind-box').nth(1).textContent()
console.log('7. 冲突测试-第二个框(应保持原值 Ctrl+V):', secondBox)

// 测试持久化：刷新页面
await page.reload()
await page.waitForTimeout(1500)
const afterReload = await page.locator('.keybind-box').first().textContent()
console.log('8. 刷新后(应保持 Ctrl + Shift + X):', afterReload)

// 恢复默认
const resetBtn = page.locator('.btn-reset').first()
if (await resetBtn.count()) {
  await resetBtn.click()
  await page.waitForTimeout(300)
  console.log('9. 恢复默认后:', await page.locator('.keybind-box').first().textContent())
}

await browser.close()

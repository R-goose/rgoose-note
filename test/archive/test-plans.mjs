import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 注入一些计划数据
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ps = pinia._s.get('plan')
  if (ps && ps.plans) {
    const titles = ['完成季度报告', '团队周会准备', '回复客户邮件', '产品需求评审', '健身房训练']
    titles.forEach((t, i) => {
      if (ps.addPlan) ps.addPlan({ title: t, description: '这是计划描述内容，用于测试显示效果', priority: ['high','normal','low'][i%3], dueDate: new Date(Date.now() + (i-2)*86400000).toISOString() })
    })
  }
})

await page.goto('http://localhost:5199/#/plans', { waitUntil: 'networkidle' })
await page.waitForTimeout(1800)

const info = await page.evaluate(() => {
  const decor = document.querySelector('.plans-bg-decor')
  const blob1 = document.querySelector('.plans-content .bg-blob-1')
  const blob2 = document.querySelector('.plans-content .bg-blob-2')
  const rings = document.querySelector('.plans-content .bg-rings')
  const grid = document.querySelector('.plans-content .bg-grid-lines')
  const dots = document.querySelector('.plans-content .bg-dots')
  const inner = document.querySelector('.plans-content-inner')
  const plan = document.querySelector('.plan-item')
  const s = (el, p) => el ? Object.fromEntries(p.map(x => [x, getComputedStyle(el)[x]])) : null
  return {
    decorPresent: !!decor,
    blob1Color: blob1 ? getComputedStyle(blob1).color : null,
    blob2Color: blob2 ? getComputedStyle(blob2).color : null,
    ringsPresent: !!rings,
    gridPresent: !!grid,
    dotsPresent: !!dots,
    innerZ: inner ? getComputedStyle(inner).zIndex : null,
    planHover: plan ? s(plan, ['borderRadius'])?.borderRadius : null,
    planCount: document.querySelectorAll('.plan-item').length
  }
})
console.log('计划面板装饰:', JSON.stringify(info, null, 2))

await page.screenshot({ path: 'shot-plans-all.png' })

// hover 计划项
await page.locator('.plan-item').first().hover()
await page.waitForTimeout(500)
await page.screenshot({ path: 'shot-plans-hover.png' })

// 滚到底部看装饰
await page.evaluate(() => {
  const c = document.querySelector('.plans-content')
  if (c) c.scrollTop = c.scrollHeight
})
await page.waitForTimeout(600)
await page.screenshot({ path: 'shot-plans-bottom.png' })

await browser.close()

import { chromium } from 'playwright'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()

const errors = []
page.on('console', msg => {
  if (msg.type() === 'error') errors.push('CONSOLE: ' + msg.text())
})
page.on('pageerror', err => errors.push('PAGEERROR: ' + err.message))

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

const info = { step: 'init' }
try {
  await page.evaluate(() => {
    const store = window.__pinia || null
    return { hasApp: !!document.querySelector('#app') }
  })

  const canvases = await page.evaluate(() => {
    const layer = document.querySelector('.blocks-layer')
    return { hasLayer: !!layer, html: document.querySelector('#app')?.innerHTML?.slice(0, 200) }
  })
  console.log('UI state:', JSON.stringify(canvases).slice(0, 300))
  info.step = 'check-ui'

  await page.screenshot({ path: 'e:/大师的/test-shot-1.png', fullPage: true })
  console.log('screenshot saved')

} catch (e) {
  console.log('TEST ERROR at', info.step, ':', e.message)
}

console.log('Console errors:', errors.length)
errors.slice(0, 10).forEach(e => console.log(' ', e))

await browser.close()

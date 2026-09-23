import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const exepath = getBrowserPath()
const browser = await chromium.launch({ headless: true, executablePath: exepath })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)
await page.screenshot({ path: 'e:/大师的/shot-home2.png' })

const html = await page.evaluate(() => document.body.innerHTML.slice(0, 1500))
console.log('BODY HTML:', html)

const allClasses = await page.evaluate(() => {
  const set = new Set()
  document.querySelectorAll('*').forEach(el => {
    el.classList.forEach(c => set.add(c))
  })
  return [...set].slice(0, 60)
})
console.log('CLASSES:', JSON.stringify(allClasses))

await browser.close()

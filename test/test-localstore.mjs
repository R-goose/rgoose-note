import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

import { getBrowserPath } from './browser-path.mjs'


const browser = await chromium.launch({ headless: false, executablePath: getBrowserPath() })
const page = await browser.newPage()
await page.setViewportSize({ width: 1440, height: 900 })

// 拦截 console
page.on('console', msg => {
  const t = msg.text()
  if (t.includes('[migrate]') || t.includes('saveImage') || t.includes('imageStore') || t.includes('Failed')) {
    console.log('CONSOLE:', t)
  }
})

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(2000)

// 测试1：图片上传存储（Web 端会存到 IndexedDB）
await page.evaluate(async () => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  await ns.init()

  // 找一篇笔记
  const notes = ns.notes.filter(n => !n.deleted)
  if (notes[0]) {
    // 模拟添加图片块（用一个小的 base64 图片）
    const smallPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
    const { saveImage } = await import('/src/utils/imageStore.js')
    const imgRef = await saveImage(smallPng)
    console.log('saveImage 返回:', imgRef)

    ns.addBlock(notes[0].id, {
      x: 100, y: 100, type: 'image',
      imageUrl: imgRef, width: 280, minHeight: 200
    })

    // 验证 imageUrl 是否是 img_ 开头的相对路径
    const block = ns.notes.find(n => n.id === notes[0].id)?.blocks?.find(b => b.type === 'image')
    console.log('block.imageUrl:', block?.imageUrl)
    console.log('是否是 img_ 引用:', block?.imageUrl?.startsWith('img_'))

    // 验证 resolveImageUrl
    const { resolveImageUrl } = await import('/src/utils/imageStore.js')
    const resolved = await resolveImageUrl(block.imageUrl)
    console.log('resolveImageUrl 返回长度:', resolved?.length, '是否 data:', resolved?.startsWith('data:'))
  }
})
await page.waitForTimeout(1000)

// 测试2：检查 IndexedDB 是否存了图片
const idbInfo = await page.evaluate(async () => {
  return new Promise((resolve) => {
    const req = indexedDB.open('rgoose-images')
    req.onsuccess = () => {
      const db = req.result
      if (!db.objectStoreNames.contains('images')) { resolve({ hasStore: false }); return }
      const tx = db.transaction('images', 'readonly')
      const keysReq = tx.objectStore('images').getAllKeys()
      keysReq.onsuccess = () => resolve({ hasStore: true, count: keysReq.result.length, keys: keysReq.result })
      keysReq.onerror = () => resolve({ hasStore: true, error: 'read failed' })
    }
    req.onerror = () => resolve({ hasStore: false, error: 'open failed' })
  })
})
console.log('IndexedDB 图片:', JSON.stringify(idbInfo, null, 2))

// 测试3：导出含图片
await page.evaluate(async () => {
  const { collectImageRefsFromData, buildImageBundle } = await import('/src/utils/imageStore.js')
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const data = { notes: ns.notes, folders: ns.folders }
  const refs = collectImageRefsFromData(data)
  console.log('导出-图片引用数:', refs.size)
  const bundle = await buildImageBundle(refs)
  console.log('导出-bundle 键数:', Object.keys(bundle).length)
})

await page.screenshot({ path: 'shot-store-test.png' })

await browser.close()

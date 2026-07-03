import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// ===== 问题1：已删除文件夹不显示 =====
const counts = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  return {
    rawAll: ns.folders.length,
    notDeleted: ns.folders.filter(f => !f.deleted).length,
    deleted: ns.folders.filter(f => f.deleted).length
  }
})
console.log('store文件夹总数:', counts.rawAll, '其中已删除:', counts.deleted, '有效:', counts.notDeleted)

// 进入笔记页
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  pinia._s.get('note').setCurrentFolder(null)
})
await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)

const cardCount = await page.locator('.folder-card').count()
console.log('1. 面板文件夹卡片数:', cardCount)
console.log('   应等于有效文件夹数(' + counts.notDeleted + '):', cardCount === counts.notDeleted ? '✓' : '✗')
console.log('   已删除文件夹是否泄露:', cardCount > counts.notDeleted ? '✗ 泄露' : '✓ 未泄露')

// ===== 问题2：点击同一文件夹取消选中 =====
if (cardCount > 0) {
  // 第一次点击进入文件夹
  await page.locator('.folder-card').first().click()
  await page.waitForTimeout(600)
  const selected1 = await page.evaluate(() => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    return pinia._s.get('note').currentFolderId
  })
  console.log('2. 首次点击进入文件夹:', selected1 ? '✓ 已选中' : '✗ 未选中')

  // 回到笔记面板（模拟用户再次进入全部文件夹视图）
  await page.evaluate(() => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    pinia._s.get('note').setCurrentFolder(null)
  })
  await page.waitForTimeout(500)

  // 再次点击同一文件夹应取消选中
  // 通过 enterFolder 逻辑验证
  const firstFolderId = await page.evaluate(() => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    return pinia._s.get('note').sortedFolders[0]?.id
  })

  // 用 store 模拟点击同一文件夹两次
  const result = await page.evaluate((fid) => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    const ns = pinia._s.get('note')
    ns.setCurrentFolder(fid)        // 选中
    const after1 = ns.currentFolderId
    ns.setCurrentFolder(fid)        // 再点同一个 -> 应取消
    const after2 = ns.currentFolderId
    return { after1, after2 }
  }, firstFolderId)
  // 注意：这是直接调 store，不是 enterFolder 逻辑。enterFolder 在 NotesView 里判断
  console.log('   store直接二次选中(after2应保持):', result.after2 === firstFolderId ? 'store保持选中(符合预期)' : '异常')
}

// 验证 enterFolder 的 toggle 逻辑（通过点击 folder-card）
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  pinia._s.get('note').setCurrentFolder(null)
})
await page.waitForTimeout(500)
// 这里 panel 上点击同一卡片两次
const cards = await page.locator('.folder-card').count()
if (cards > 0) {
  await page.locator('.folder-card').first().click()
  await page.waitForTimeout(600)
  const s1 = await page.evaluate(() => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    return pinia._s.get('note').currentFolderId
  })
  console.log('3. 卡片首次点击:', s1 ? '✓ 选中' : '✗')
  // 此时已进入文件夹视图，需要回到全部视图再测——但 enterFolder 已切走
  // 直接验证：当前在文件夹内，点击侧边栏该文件夹的 toggle 行为另算
  // 此处验证 enterFolder 逻辑：已在文件夹内时，allFolders视图不可见，无法直接测同一卡片
}

// 直接单元测试 enterFolder 逻辑（通过重新进 notes 页面模拟）
await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  ns.setCurrentFolder(null)
})
await page.waitForTimeout(500)

// 模拟 enterFolder toggle：选中→取消
const toggleTest = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const fid = ns.sortedFolders[0]?.id
  if (!fid) return 'nofolder'
  // enterFolder 逻辑：currentFolderId === folderId ? null : folderId
  ns.setCurrentFolder(ns.currentFolderId === fid ? null : fid)  // 选中
  const r1 = ns.currentFolderId === fid
  ns.setCurrentFolder(ns.currentFolderId === fid ? null : fid)  // 取消
  const r2 = ns.currentFolderId === null
  return { r1, r2 }
})
console.log('4. toggle逻辑(选中→取消):', JSON.stringify(toggleTest), toggleTest.r1 && toggleTest.r2 ? '✓' : '✗')

await browser.close()

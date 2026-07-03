import { chromium } from 'playwright-core'
import { existsSync } from 'fs'

const paths = ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe','C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe']
const browser = await chromium.launch({ headless: false, executablePath: paths.find(p => existsSync(p)) })
const page = await browser.newPage()

await page.goto('http://localhost:5199/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1500)

// 找一个叶子文件夹（无子文件夹）测试 toggle
const targetFolder = await page.evaluate(() => {
  const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
  const ns = pinia._s.get('note')
  const folders = ns.folders.filter(f => !f.deleted)
  // 找一个没有其他文件夹以它为 parentId 的（叶子）
  const leaf = folders.find(f => !folders.some(c => c.parentId === f.id))
  return leaf ? { id: leaf.id, name: leaf.name } : null
})
console.log('测试目标文件夹:', JSON.stringify(targetFolder))

if (targetFolder) {
  // 先进入 /notes
  await page.goto('http://localhost:5199/#/notes', { waitUntil: 'networkidle' })
  await page.waitForTimeout(800)
  await page.evaluate(() => {
    const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
    pinia._s.get('note').setCurrentFolder(null)
  })
  await page.waitForTimeout(400)

  // 点击侧边栏的该文件夹项
  const folderItemSelector = `.folder-item[data-folder-id="${targetFolder.id}"]`
  const folderItemsBefore = await page.locator('.folder-item').count()
  console.log('侧边栏文件夹项数:', folderItemsBefore)

  // 检查该文件夹项是否存在
  const exists = await page.locator(folderItemSelector).count()
  if (exists > 0) {
    // 第一次点击：选中
    await page.locator(folderItemSelector).click()
    await page.waitForTimeout(600)
    const s1 = await page.evaluate(() => {
      const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
      return pinia._s.get('note').currentFolderId
    })
    console.log('1. 首次点击侧边栏文件夹:', s1 === targetFolder.id ? '✓ 已选中' : '✗ 未选中(' + s1 + ')')

    // 第二次点击同一文件夹：应取消选中
    await page.locator(folderItemSelector).click()
    await page.waitForTimeout(600)
    const s2 = await page.evaluate(() => {
      const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
      return pinia._s.get('note').currentFolderId
    })
    console.log('2. 再次点击同一文件夹:', s2 === null ? '✓ 已取消选中' : '✗ 仍选中(' + s2 + ')')
  } else {
    // 文件夹可能在折叠状态，先展开
    console.log('   文件夹项不在DOM，可能折叠，尝试点击笔记面板的卡片')

    // 用面板卡片测试
    const cardSel = `.folder-card`
    // 先获取第一个卡片的文件夹id
    const firstCardId = await page.evaluate(() => {
      const cards = document.querySelectorAll('.folder-card')
      // 通过点击进入后，侧边栏会高亮，再点侧边栏
      return cards[0] ? cards[0].getAttribute('data-folder-id') || cards[0].textContent : null
    })
    console.log('   首个卡片:', firstCardId)

    // 点第一个卡片进入
    await page.locator('.folder-card').first().click()
    await page.waitForTimeout(600)
    const s1 = await page.evaluate(() => {
      const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
      return pinia._s.get('note').currentFolderId
    })
    console.log('1. 点击面板卡片进入文件夹:', s1 ? '✓ 选中' : '✗')

    // 再点击面板返回
    await page.evaluate(() => {
      const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
      pinia._s.get('note').setCurrentFolder(null)
    })
    await page.waitForTimeout(500)

    // 用侧边栏测：找到当前选中文件夹对应的侧边栏项
    const sideFolderId = s1
    const sideSel = `.folder-item[data-folder-id="${sideFolderId}"]`
    const sideExists = await page.locator(sideSel).count()
    if (sideExists > 0) {
      await page.locator(sideSel).click()
      await page.waitForTimeout(500)
      const r1 = await page.evaluate(() => {
        const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
        return pinia._s.get('note').currentFolderId
      })
      console.log('2. 侧边栏首次点击:', r1 ? '✓ 选中' : '✗')
      await page.locator(sideSel).click()
      await page.waitForTimeout(500)
      const r2 = await page.evaluate(() => {
        const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia
        return pinia._s.get('note').currentFolderId
      })
      console.log('3. 侧边栏再次点击(应取消):', r2 === null ? '✓ 取消' : '✗ 仍选中')
    } else {
      console.log('   侧边栏无该文件夹项')
    }
  }
}

await browser.close()

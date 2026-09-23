import { existsSync } from 'node:fs'
import { env } from 'node:process'

// 按当前平台定位可用的 Chromium 系浏览器可执行文件，供 playwright-core 测试脚本复用。
// 找不到任何已知浏览器时返回 undefined：调用方 chromium.launch 将回退到默认下载的 chromium。
const CANDIDATES = [
  // 显式环境变量优先（CI 或自定义安装位置）
  env.CHROME_PATH,
  env.PLAYWRIGHT_BROWSERS_PATH,
  // macOS
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Arc.app/Contents/MacOS/Arc',
  // Windows
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  // Linux
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/microsoft-edge',
  '/opt/google/chrome/chrome'
].filter(Boolean)

export function getBrowserPath() {
  return CANDIDATES.find((p) => existsSync(p)) || undefined
}
// 在 Electron 主进程中尝试加载 better-sqlite3
// 如果 ABI 不匹配会立即崩溃
try {
  const Database = require('better-sqlite3')
  const db = new Database(':memory:')
  const v = db.prepare('SELECT sqlite_version() as v').get()
  console.log('[ELECTRON_TEST] better-sqlite3 OK, sqlite version:', v.v)
  db.close()
  process.exit(0)
} catch (e) {
  console.error('[ELECTRON_TEST] better-sqlite3 FAILED:', e.message)
  process.exit(1)
}

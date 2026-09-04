/**
 * 后端入口
 * - 初始化数据库（建表 + 种子）
 * - 注册 IPC 通道
 * - 可选启动 HTTP 服务（调试模式）
 */

const { getDb, closeDb, checkpoint } = require('./db/connection')
const { runMigrations } = require('./db/migrate')
const { register: registerIpc } = require('./router/ipcRoutes')
const { createRouter: createHttpRouter } = require('./router/httpRoutes')
const config = require('./config')
const { log } = require('./common/utils')

let httpServer = null

function start(dataDir) {
  config.dataDir = dataDir

  // 1. 初始化数据库
  const db = getDb(dataDir)
  runMigrations(db)
  log('backend', `SQLite ready at ${dataDir}\\rgoose.db`)

  // 2. 注册 IPC 通道
  registerIpc()
  log('backend', 'IPC routes registered')

  // 3. 启动 HTTP 服务（可选）
  if (config.mode === 'http' || config.mode === 'both') {
    const app = createHttpRouter()
    // 绑定 127.0.0.1：dev HTTP 模式仅本机可访问，不暴露到局域网
    httpServer = app.listen(config.httpPort, '127.0.0.1', () => {
      log('backend', `HTTP server listening on http://127.0.0.1:${config.httpPort}`)
    })
  }
}

function stop() {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  closeDb()
}

/** 触发 WAL checkpoint，备份前调用以确保主 db 文件完整 */
function flush() {
  checkpoint()
}

/**
 * 恢复备份后重启数据库（仅重开 db，不重新注册 IPC，避免重复 handle 报错）
 * - 备份恢复流程会先 backend.stop() 释放 SQLite 句柄，替换文件后调用本方法重新打开
 */
function restart(dataDir) {
  config.dataDir = dataDir
  closeDb()
  const db = getDb(dataDir)
  runMigrations(db)
  log('backend', `SQLite restarted at ${dataDir}\\rgoose.db`)
}

module.exports = { start, stop, flush, restart }

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
    httpServer = app.listen(config.httpPort, () => {
      log('backend', `HTTP server listening on http://localhost:${config.httpPort}`)
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

module.exports = { start, stop, flush }

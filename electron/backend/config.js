/**
 * 后端运行时配置
 * - mode: 'ipc' 生产默认 | 'http' 调试 | 'both' 双开
 * - httpPort: HTTP 模式端口
 * - dataDir: 数据目录（由 main.js 在启动时注入）
 */

const config = {
  mode: process.env.RGOOSE_BACKEND_MODE || (process.env.VITE_DEV_SERVER_URL ? 'both' : 'ipc'),
  httpPort: 18080,
  dataDir: null
}

module.exports = config

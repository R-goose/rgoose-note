import { readdirSync, rmSync, existsSync } from 'node:fs'
import { resolve, join } from 'node:path'

const root = resolve(process.cwd())

// 清理历史 release 输出目录，避免与分析现有文件混淆
for (const entry of readdirSync(root)) {
  if (entry.startsWith('release-build')) {
    rmSync(join(root, entry), { recursive: true, force: true })
  }
}

const effCfg = join(root, 'release', 'builder-effective-config.yaml')
if (existsSync(effCfg)) {
  rmSync(effCfg, { force: true })
}

console.log('release 目录已清理')
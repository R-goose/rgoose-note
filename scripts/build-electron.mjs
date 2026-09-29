import { spawn } from 'node:child_process'
import { resolve, join } from 'node:path'
import { argv } from 'node:process'

const root = resolve(process.cwd())
const useMirror = argv.includes('--mirror')
const publishToGitee = argv.includes('--publish-gitee')

const ts = new Date()
const pad = (n) => String(n).padStart(2, '0')
const stamp = `${ts.getFullYear()}${pad(ts.getMonth() + 1)}${pad(ts.getDate())}-${pad(ts.getHours())}${pad(ts.getMinutes())}${pad(ts.getSeconds())}`
const outDir = `release-build-${stamp}`

const env = { ...process.env }
if (useMirror) {
  env.ELECTRON_MIRROR = 'https://npmmirror.com/mirrors/electron/'
  env.ELECTRON_BUILDER_BINARIES_MIRROR = 'https://npmmirror.com/mirrors/electron-builder-binaries/'
  delete env.ELECTRON_BUILDER_BINARIES_CUSTOM_DIR
}

const cli = join(root, 'node_modules', 'electron-builder', 'cli.js')
const child = spawn('node', [cli, '--projectDir', '.', `--config.directories.output=${outDir}`], {
  cwd: root,
  env,
  stdio: 'inherit',
  shell: process.platform === 'win32',
})
child.on('exit', (code) => {
  if (code !== 0) process.exit(code ?? 1)
  if (!publishToGitee) process.exit(0)
  const publisher = spawn('node', [join(root, 'scripts', 'publish-gitee-release.mjs'), '--dir', join(root, outDir)], {
    cwd: root,
    env,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  publisher.on('exit', publishCode => process.exit(publishCode ?? 1))
  publisher.on('error', err => {
    console.error('Gitee Release 发布脚本启动失败:', err.message)
    process.exit(1)
  })
})
child.on('error', (err) => {
  console.error('electron-builder 启动失败:', err.message)
  process.exit(1)
})

import { spawn } from 'node:child_process'
import { resolve, join } from 'node:path'
import { argv } from 'node:process'

const root = resolve(process.cwd())
const useMirror = argv.includes('--mirror')
const publishToGitee = argv.includes('--publish-gitee')
const buildAllPlatforms = argv.includes('--all-platforms')

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
// `build.publish` 是应用检查更新所使用的 generic 下载地址，并不是
// electron-builder 可直接发布的目标。无论是否处于 Git tag CI，都由
// publish-gitee-release.mjs 在打包成功后统一上传到 Gitee Release。
function run(command, args, failureMessage) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, {
      cwd: root,
      env,
      stdio: 'inherit',
      shell: process.platform === 'win32',
    })
    child.once('error', error => rejectRun(new Error(`${failureMessage}: ${error.message}`)))
    child.once('exit', code => {
      if (code === 0) resolveRun()
      else rejectRun(new Error(`${failureMessage}（退出码 ${code ?? 1}）`))
    })
  })
}

async function main() {
  if (buildAllPlatforms && process.platform !== 'darwin') {
    throw new Error('双平台本地发布仅支持在 macOS 上执行。')
  }

  // Apple Silicon 默认会把 --win 构建为 Windows ARM64；为兼容绝大多数
  // Intel/AMD Windows 设备，双平台发布明确生成 Windows x64。macOS 则
  // 生成当前开发机可验证的 Apple Silicon ARM64 DMG/ZIP。
  const builds = buildAllPlatforms
    ? [['--mac', '--arm64'], ['--win', '--x64']]
    : [[]]
  let windowsBuildStarted = false
  try {
    for (const targetArgs of builds) {
      if (targetArgs.includes('--win')) windowsBuildStarted = true
      await run('node', [cli, '--projectDir', '.', `--config.directories.output=${outDir}`, '--publish', 'never', ...targetArgs], 'electron-builder 构建失败')
    }
  } finally {
    // electron-builder 为 Windows 交叉构建原生模块时会重写工作区的
    // better-sqlite3 二进制。无论构建结果如何，都恢复当前 Mac 的模块，
    // 以免后续 electron:dev 无法加载 SQLite。
    if (windowsBuildStarted) {
      await run('node', [cli, 'install-app-deps', '--platform', 'darwin', '--arch', 'arm64'], '恢复 macOS 原生依赖失败')
    }
  }

  if (!publishToGitee) return
  const publishArgs = [join(root, 'scripts', 'publish-gitee-release.mjs'), '--dir', join(root, outDir)]
  if (buildAllPlatforms) publishArgs.push('--platform', 'all')
  await run('node', publishArgs, 'Gitee Release 发布脚本启动失败')
}

main().catch(error => {
  console.error(error?.stack || error?.message || error)
  process.exit(1)
})

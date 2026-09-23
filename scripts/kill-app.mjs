import { execFileSync } from 'node:child_process'
import { relative, resolve, sep } from 'node:path'

// 终止正在运行的打包/开发版 Electron 应用，避免占用 release 目录导致打包失败。
const root = resolve(process.cwd())

function isProjectProcess(cmdline) {
  if (typeof cmdline !== 'string' || !cmdline) return false
  // 只匹配本项目 release 目录下启动的可执行文件，避免误杀其他 Electron 应用
  const norm = cmdline.replace(/\//g, sep)
  return (
    norm.includes(`${sep}release${sep}`) &&
    (norm.includes('R-Goose Note') || norm.includes('r-goose-note')) &&
    !relative(root, norm).startsWith(`..${sep}`)
  )
}

function killWindows() {
  const out = execFileSync('powershell.exe', [
    '-NoProfile', '-NonInteractive', '-Command',
    `Get-CimInstance Win32_Process | Where-Object { $_.Name -eq 'R-Goose Note.exe' -or ($_.Name -eq 'electron.exe' -and ($_.CommandLine -like '*${root.replace(/\\/g, '\\')}*')) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }`
  ], { windowsHide: true, stdio: 'pipe' })
  return out.toString()
}

function killUnix() {
  try {
    const out = execFileSync('ps', ['-e', '-o', 'pid=', '-o', 'command='], { stdio: 'pipe' }).toString()
    const pids = new Set()
    for (const line of out.split('\n')) {
      if (isProjectProcess(line)) {
        const pid = parseInt(line.split(/\s+/)[0], 10)
        if (pid && !Number.isNaN(pid)) pids.add(pid)
      }
    }
    for (const pid of pids) {
      try { execFileSync('kill', ['-9', String(pid)], { stdio: 'pipe' }) } catch (_) {}
    }
    if (pids.size) console.log(`已终止 ${pids.size} 个应用进程`)
  } catch (e) {
    console.error('kill-app 失败:', e.message)
  }
}

if (process.platform === 'win32') {
  killWindows()
} else {
  killUnix()
}
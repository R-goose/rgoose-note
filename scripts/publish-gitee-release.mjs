import { readdir, stat } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { basename, resolve } from 'node:path'
import { argv, env, exit } from 'node:process'

const OWNER = 'kokomi123'
const REPO = 'rgoose-note'
const RELEASE_TAG = 'latest'
const API_ROOT = `https://gitee.com/api/v5/repos/${OWNER}/${REPO}`
const token = env.GITEE_TOKEN
const dirArgIndex = argv.indexOf('--dir')
const artifactDir = dirArgIndex >= 0 ? argv[dirArgIndex + 1] : env.UPDATE_ARTIFACT_DIR
const platformArgIndex = argv.indexOf('--platform')
const requestedPlatform = platformArgIndex >= 0 ? argv[platformArgIndex + 1] : process.platform
const REQUEST_TIMEOUT_MS = 3 * 60 * 1000
const UPLOAD_TIMEOUT_MS = 20 * 60 * 1000
const UPLOAD_MAX_ATTEMPTS = 4
const UPLOAD_RETRY_DELAYS_MS = [3_000, 10_000, 25_000]
const GITEE_UPLOAD_HOST = 'gitee.com'

if (!token) {
  console.error('缺少 GITEE_TOKEN；请在当前终端或 CI 的密钥变量中设置后再发布。')
  exit(1)
}
if (!artifactDir) {
  console.error('缺少更新产物目录；使用 --dir <目录> 或设置 UPDATE_ARTIFACT_DIR。')
  exit(1)
}

function endpoint(path) {
  const url = new URL(`${API_ROOT}${path}`)
  url.searchParams.set('access_token', token)
  return url
}

async function request(path, options = {}, timeoutMs = REQUEST_TIMEOUT_MS) {
  const response = await fetch(endpoint(path), {
    ...options,
    signal: AbortSignal.timeout(timeoutMs)
  })
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500)
    throw new Error(`Gitee API 请求失败（${response.status}）：${detail}`)
  }
  return response.status === 204 ? null : response.json()
}

async function findOrCreateLatestRelease() {
  const releases = await request('/releases?per_page=100')
  const existing = releases.find(release => release.tag_name === RELEASE_TAG)
  if (existing) return existing
  try {
    return await request('/releases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        tag_name: RELEASE_TAG,
        target_commitish: env.GITEE_TARGET_BRANCH || 'master',
        name: 'Latest',
        body: 'R-Goose Note 最新稳定版更新文件。'
      })
    })
  } catch (error) {
    // macOS 与 Windows 构建会并行发布；另一端可能已在这期间创建 latest。
    const retryReleases = await request('/releases?per_page=100')
    const concurrentRelease = retryReleases.find(release => release.tag_name === RELEASE_TAG)
    if (concurrentRelease) return concurrentRelease
    throw error
  }
}

const PLATFORM_ARTIFACTS = {
  darwin: {
    label: 'macOS',
    manifest: /^latest-mac\.ya?ml$/i,
    matches: name => /^latest-mac\.ya?ml$/i.test(name) || /\.dmg(?:\.blockmap)?$/i.test(name) || /-mac\.zip(?:\.blockmap)?$/i.test(name)
  },
  win32: {
    label: 'Windows',
    manifest: /^latest\.ya?ml$/i,
    matches: name => /^latest\.ya?ml$/i.test(name) || /\.exe(?:\.blockmap)?$/i.test(name)
  },
  linux: {
    label: 'Linux',
    manifest: /^latest-linux\.ya?ml$/i,
    matches: name => /^latest-linux\.ya?ml$/i.test(name) || /\.AppImage(?:\.blockmap)?$/i.test(name)
  }
}

function getPlatformArtifacts() {
  if (requestedPlatform === 'all') return [PLATFORM_ARTIFACTS.darwin, PLATFORM_ARTIFACTS.win32]
  const artifacts = PLATFORM_ARTIFACTS[requestedPlatform]
  if (!artifacts) throw new Error(`暂不支持发布 ${requestedPlatform} 平台的更新包。`)
  return [artifacts]
}

async function collectArtifacts(dir, artifactSets) {
  const names = await readdir(dir)
  const files = []
  for (const artifacts of artifactSets) {
    const platformFiles = names.filter(artifacts.matches)
    if (!platformFiles.some(name => artifacts.manifest.test(name))) {
      throw new Error(`未找到 ${artifacts.label} 的更新清单；请确认目录来自 electron-builder。`)
    }
    files.push(...platformFiles)
  }
  return files.map(name => resolve(dir, name))
}

async function uploadAttachment(releaseId, filePath) {
  const { size } = await stat(filePath)
  const name = basename(filePath)
  for (let attempt = 1; attempt <= UPLOAD_MAX_ATTEMPTS; attempt += 1) {
    try {
      console.log(`正在上传：${name}（${Math.ceil(size / 1024 / 1024)} MB，第 ${attempt}/${UPLOAD_MAX_ATTEMPTS} 次）`)
      await uploadWithCurl(releaseId, filePath)
      console.log(`已上传：${name}`)
      return
    } catch (error) {
      const message = error?.message || String(error)
      const isNetworkOrServerFailure = error?.name === 'TypeError' || /Gitee API 请求失败（(?:408|429|5\d{2})）/.test(message)
      if (!isNetworkOrServerFailure || attempt === UPLOAD_MAX_ATTEMPTS) throw error
      const delay = UPLOAD_RETRY_DELAYS_MS[attempt - 1]
      console.warn(`上传连接异常，将在 ${Math.round(delay / 1000)} 秒后重试：${name}（${message}）`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
}

function escapeCurlConfig(value) {
  return String(value).replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

async function uploadWithCurl(releaseId, filePath) {
  // 大文件通过 Node 的 undici 上传到 Gitee 时会频繁断连。curl 使用流式
  // multipart，不会把完整 EXE 载入 Node 内存；令牌仅经标准输入传给 curl，
  // 不会出现在 Actions 日志、命令行参数或临时配置文件中。
  const url = endpoint(`/releases/${releaseId}/attach_files`).toString()
  const directAddress = await resolveGiteeUploadAddress()
  const config = [
    'fail-with-body',
    'silent',
    'show-error',
    'location',
    'connect-timeout = "60"',
    `max-time = "${Math.ceil(UPLOAD_TIMEOUT_MS / 1000)}"`,
    `url = "${escapeCurlConfig(url)}"`,
    ...(directAddress ? [`connect-to = "${GITEE_UPLOAD_HOST}:443:${directAddress}:443"`] : []),
    `form = "file=@${escapeCurlConfig(filePath)}"`
  ].join('\n')

  return new Promise((resolveUpload, rejectUpload) => {
    const curl = spawn(process.platform === 'win32' ? 'curl.exe' : 'curl', ['--config', '-'], {
      stdio: ['pipe', 'ignore', 'pipe']
    })
    let stderr = ''
    curl.stderr.on('data', chunk => { stderr += chunk })
    curl.once('error', rejectUpload)
    curl.once('close', code => {
      if (code === 0) resolveUpload()
      else rejectUpload(new Error(`curl 上传失败（退出码 ${code ?? 1}）：${stderr.trim() || '未知错误'}`))
    })
    curl.stdin.end(config)
  })
}

async function resolveGiteeUploadAddress() {
  // 此 Mac 的代理会将 gitee.com 解析到 198.18.0.0/15 虚拟地址，小请求正常、
  // 大文件上传却会卡住。通过 DoH 取得真实地址后让 curl 直连，同时仍使用
  // gitee.com 作为 SNI 与 Host，TLS 校验不受影响。
  try {
    const response = await fetch(`https://dns.google/resolve?name=${GITEE_UPLOAD_HOST}&type=A`, {
      signal: AbortSignal.timeout(20_000)
    })
    if (!response.ok) throw new Error(`DoH 状态码 ${response.status}`)
    const payload = await response.json()
    const address = payload.Answer?.map(record => record.data).find(value =>
      typeof value === 'string' && /^(?!198\.18\.)(?:25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(?:25[0-5]|2[0-4]\d|1?\d?\d)){3}$/.test(value)
    )
    if (!address) throw new Error('未返回可用 IPv4 地址')
    return address
  } catch (error) {
    console.warn(`无法解析 Gitee 直连地址，将使用默认网络路径：${error?.message || error}`)
    return null
  }
}

try {
  const artifactSets = getPlatformArtifacts()
  const files = await collectArtifacts(resolve(artifactDir), artifactSets)
  const release = await findOrCreateLatestRelease()
  // Release 概览只包含 assets 的展示信息，缺少附件 ID；必须通过专用
  // 接口读取附件，才能可靠删除早先发布留下的同名文件。
  const attachments = await request(`/releases/${release.id}/attach_files?per_page=100`)
  for (const attachment of attachments) {
    const attachmentName = attachment.name || attachment.filename || ''
    if (artifactSets.some(artifacts => artifacts.matches(attachmentName))) {
      await request(`/releases/${release.id}/attach_files/${attachment.id}`, { method: 'DELETE' })
      console.log(`已替换旧发布产物：${attachmentName}`)
    }
  }
  for (const filePath of files) await uploadAttachment(release.id, filePath)
  console.log(`${artifactSets.map(artifacts => artifacts.label).join(' + ')} 发布完成：https://gitee.com/${OWNER}/${REPO}/releases/tag/${RELEASE_TAG}`)
} catch (error) {
  console.error(error?.stack || error?.message || error)
  exit(1)
}

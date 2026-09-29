import { readFile, readdir } from 'node:fs/promises'
import { basename, resolve } from 'node:path'
import { argv, env, exit } from 'node:process'

const OWNER = 'kokomi123'
const REPO = 'rgoose-note'
const RELEASE_TAG = 'latest'
const API_ROOT = `https://gitee.com/api/v5/repos/${OWNER}/${REPO}`
const token = env.GITEE_TOKEN
const dirArgIndex = argv.indexOf('--dir')
const artifactDir = dirArgIndex >= 0 ? argv[dirArgIndex + 1] : env.UPDATE_ARTIFACT_DIR

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

async function request(path, options = {}) {
  const response = await fetch(endpoint(path), options)
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
  return request('/releases', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      tag_name: RELEASE_TAG,
      target_commitish: env.GITEE_TARGET_BRANCH || 'master',
      name: 'Latest',
      body: 'R-Goose Note 最新稳定版更新文件。'
    })
  })
}

function isUpdateArtifact(name) {
  return /^(latest.*\.ya?ml|.*\.(exe|dmg|zip|AppImage)(\.blockmap)?)$/i.test(name)
}

async function collectArtifacts(dir) {
  const names = await readdir(dir)
  const files = names.filter(isUpdateArtifact)
  if (!files.some(name => /^latest.*\.ya?ml$/i.test(name))) {
    throw new Error('未找到 latest.yml、latest-mac.yml 或 latest-linux.yml；请确认目录来自 electron-builder。')
  }
  return files.map(name => resolve(dir, name))
}

async function uploadAttachment(releaseId, filePath) {
  const content = await readFile(filePath)
  const form = new FormData()
  form.append('file', new Blob([content]), basename(filePath))
  await request(`/releases/${releaseId}/attach_files`, { method: 'POST', body: form })
  console.log(`已上传：${basename(filePath)}`)
}

try {
  const files = await collectArtifacts(resolve(artifactDir))
  const release = await findOrCreateLatestRelease()
  for (const attachment of release.attach_files || []) {
    await request(`/releases/${release.id}/attach_files/${attachment.id}`, { method: 'DELETE' })
  }
  for (const filePath of files) await uploadAttachment(release.id, filePath)
  console.log(`发布完成：https://gitee.com/${OWNER}/${REPO}/releases/tag/${RELEASE_TAG}`)
} catch (error) {
  console.error(error?.message || error)
  exit(1)
}

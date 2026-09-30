import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { env, exit } from 'node:process'

// GitHub 的 GITHUB_* 默认变量不可被 workflow env 覆盖；手动补发时
// 通过 RELEASE_TAG 传入要验证的版本，标签触发时则回退到默认变量。
const tag = env.RELEASE_TAG || env.GITHUB_REF_NAME
if (!tag) {
  console.error('缺少 GitHub 版本标签；请推送形如 v2.5.1 的标签来发布。')
  exit(1)
}

const packageJson = JSON.parse(await readFile(resolve(process.cwd(), 'package.json'), 'utf8'))
const expectedTag = `v${packageJson.version}`
if (tag !== expectedTag) {
  console.error(`版本标签 ${tag} 与 package.json 中的版本 ${packageJson.version} 不一致；请使用 ${expectedTag}。`)
  exit(1)
}

console.log(`发布版本校验通过：${packageJson.version}`)

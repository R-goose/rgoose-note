import { readFile, readdir, writeFile } from 'node:fs/promises'
import { resolve, join } from 'node:path'

const outputDirArg = process.argv.indexOf('--dir')
const outputDir = outputDirArg >= 0 ? process.argv[outputDirArg + 1] : null

if (!outputDir) throw new Error('请通过 --dir 指定 Windows 构建输出目录。')

const outputDirPath = resolve(process.cwd(), outputDir)
const files = await readdir(outputDirPath)
const installer = files.find(file => file.endsWith('.exe') && !file.endsWith('.exe.blockmap'))
if (!installer) throw new Error(`未找到 Windows 安装包：${outputDirPath}`)

// GitHub Release 的上传动作会把资源名中的空格规范为 "."。发布清单必须
// 使用完全相同的文件名，否则 electron-updater 无法下载更新包。
const githubAssetName = installer.replaceAll(' ', '.')
const manifestPath = join(outputDirPath, 'latest.yml')
const manifest = await readFile(manifestPath, 'utf8')
if (!manifest.includes(installer)) {
  throw new Error(`发布清单未包含安装包名称：${installer}`)
}

await writeFile(manifestPath, manifest.replaceAll(installer, githubAssetName))
console.log(`已同步 GitHub Release 资源名：${githubAssetName}`)

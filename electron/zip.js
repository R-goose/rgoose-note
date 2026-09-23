const fs = require('fs')
const path = require('path')
const AdmZip = require('adm-zip')

/**
 * 跨平台 ZIP 工具：导出、导入、备份统一使用。
 * 在主进程中以 CommonJS 加载（electron/package.json 声明 type=commonjs）。
 */

/** 压缩 sourceDir 的“内容”到 destZip（不含 sourceDir 自身目录层级） */
function zipFolder(sourceDir, destZip) {
  const zip = new AdmZip()
  zip.addLocalFolder(sourceDir)
  zip.writeZip(destZip)
}

/** 归一化 entryName 并阻止路径穿越，非法路径返回 null */
function sanitizeEntry(entryName) {
  const norm = String(entryName).replace(/\\/g, '/')
  const clean = []
  for (const part of norm.split('/')) {
    if (part === '' || part === '.') continue
    if (part === '..') return null
    clean.push(part)
  }
  return clean.join('/')
}

/** 解压 zip 到 destDir，逐个条目校验，任何穿越路径立即抛错 */
function unzipTo(zipPath, destDir) {
  const zip = new AdmZip(zipPath)
  const base = path.resolve(destDir)
  for (const entry of zip.getEntries()) {
    const cleanName = sanitizeEntry(entry.entryName)
    if (!cleanName) throw new Error('备份包内包含非法路径: ' + entry.entryName)
    const resolved = path.resolve(base, cleanName)
    const relative = path.relative(base, resolved)
    if (!relative || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
      throw new Error('备份包内路径超出目录: ' + entry.entryName)
    }
    if (entry.isDirectory) {
      fs.mkdirSync(resolved, { recursive: true })
    } else {
      fs.mkdirSync(path.dirname(resolved), { recursive: true })
      fs.writeFileSync(resolved, entry.getData())
    }
  }
}

module.exports = { zipFolder, unzipTo }
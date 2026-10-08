import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const root = resolve(process.cwd())

const bmpAssets = [
  ['build/installerHeader.bmp', 150, 57],
  ['build/installerSidebar.bmp', 164, 314],
  ['build/uninstallerSidebar.bmp', 164, 314],
]

function fail(message) {
  throw new Error(`安装器资源校验失败：${message}`)
}

async function normalizeBmp(relativePath, expectedWidth, expectedHeight) {
  const file = resolve(root, relativePath)
  const data = Buffer.from(await readFile(file))
  if (data.subarray(0, 2).toString('ascii') !== 'BM') fail(`${relativePath} 不是 BMP 文件`)

  const pixelOffset = data.readUInt32LE(10)
  const dibSize = data.readUInt32LE(14)
  const width = data.readInt32LE(18)
  const height = data.readInt32LE(22)
  const bitsPerPixel = data.readUInt16LE(28)
  const compression = data.readUInt32LE(30)
  if (dibSize !== 40 || width !== expectedWidth || Math.abs(height) !== expectedHeight) {
    fail(`${relativePath} 必须为 ${expectedWidth}×${expectedHeight} 的 Windows BMP`)
  }
  if (bitsPerPixel !== 24 || compression !== 0) {
    fail(`${relativePath} 必须为未压缩 24 位 BMP`)
  }

  // macOS 的 sips 会生成顶向下 BMP（高度为负）。NSIS 的 Modern UI 在部分
  // Windows 环境无法稳定加载该格式，因此统一转换为标准的底向上 DIB。
  if (height < 0) {
    const rowSize = Math.ceil((width * 3) / 4) * 4
    const pixelDataSize = rowSize * expectedHeight
    if (pixelOffset + pixelDataSize > data.length) fail(`${relativePath} 像素数据不完整`)

    const pixels = Buffer.from(data.subarray(pixelOffset, pixelOffset + pixelDataSize))
    for (let row = 0; row < expectedHeight; row += 1) {
      pixels.copy(data, pixelOffset + row * rowSize, (expectedHeight - 1 - row) * rowSize, (expectedHeight - row) * rowSize)
    }
    data.writeInt32LE(expectedHeight, 22)
    await writeFile(file, data)
    console.log(`已转换为 Windows 兼容 BMP：${relativePath}`)
  }
}

async function validateDmgBackground() {
  const file = resolve(root, 'build/dmg-background.png')
  const data = await readFile(file)
  const signature = '89504e470d0a1a0a'
  if (data.subarray(0, 8).toString('hex') !== signature) fail('build/dmg-background.png 不是 PNG 文件')
  const width = data.readUInt32BE(16)
  const height = data.readUInt32BE(20)
  if (width !== 540 || height !== 380) fail('build/dmg-background.png 必须为 540×380')
}

await Promise.all(bmpAssets.map(([path, width, height]) => normalizeBmp(path, width, height)))
await validateDmgBackground()

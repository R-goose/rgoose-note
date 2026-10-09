const SIDES = ['top', 'right', 'bottom', 'left']

export function connectionPort(block, size, side) {
  const x = Number(block.x) || 0
  const y = Number(block.y) || 0
  const width = Number(size.width) || 0
  const height = Number(size.height) || 0
  switch (side) {
    case 'top': return { x: x + width / 2, y }
    case 'right': return { x: x + width, y: y + height / 2 }
    case 'bottom': return { x: x + width / 2, y: y + height }
    default: return { x, y: y + height / 2 }
  }
}

// 旧连线没有记录端口：选择距离最近的一对可见圆点，保证升级后也贴合圆点。
export function connectionEndpoints(fromBlock, fromSize, toBlock, toSize, conn = {}) {
  const fromSides = SIDES.includes(conn.fromSide) ? [conn.fromSide] : SIDES
  const toSides = SIDES.includes(conn.toSide) ? [conn.toSide] : SIDES
  let best = null
  let bestDistance = Infinity
  for (const fromSide of fromSides) {
    const from = connectionPort(fromBlock, fromSize, fromSide)
    for (const toSide of toSides) {
      const to = connectionPort(toBlock, toSize, toSide)
      const distance = (from.x - to.x) ** 2 + (from.y - to.y) ** 2
      if (distance < bestDistance) {
        bestDistance = distance
        best = { from, to, fromSide, toSide }
      }
    }
  }
  return best
}

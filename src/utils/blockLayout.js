const DIRECTIONS = new Set(['n', 's', 'e', 'w'])

export function blocksOverlap(a, b) {
  return a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
}

function resizeDirections(direction) {
  return String(direction || '')
    .split('')
    .filter(item => DIRECTIONS.has(item))
}

function pushCandidates(pusher, target, directions) {
  const pusherCenterX = pusher.x + pusher.width / 2
  const pusherCenterY = pusher.y + pusher.height / 2
  const targetCenterX = target.x + target.width / 2
  const targetCenterY = target.y + target.height / 2
  const all = []

  if (directions.includes('e')) {
    all.push({ direction: 'e', distance: pusher.x + pusher.width - target.x, preferred: targetCenterX >= pusherCenterX })
  }
  if (directions.includes('w')) {
    all.push({ direction: 'w', distance: target.x + target.width - pusher.x, preferred: targetCenterX <= pusherCenterX })
  }
  if (directions.includes('s')) {
    all.push({ direction: 's', distance: pusher.y + pusher.height - target.y, preferred: targetCenterY >= pusherCenterY })
  }
  if (directions.includes('n')) {
    all.push({ direction: 'n', distance: target.y + target.height - pusher.y, preferred: targetCenterY <= pusherCenterY })
  }

  const positive = all.filter(candidate => candidate.distance > 0)
  const preferred = positive.filter(candidate => candidate.preferred)
  return (preferred.length ? preferred : positive).sort((a, b) => a.distance - b.distance)
}

function pushedPosition(pusher, target, direction) {
  if (direction === 'e') return { x: pusher.x + pusher.width, y: target.y }
  if (direction === 'w') return { x: pusher.x - target.width, y: target.y }
  if (direction === 's') return { x: target.x, y: pusher.y + pusher.height }
  return { x: target.x, y: pusher.y - target.height }
}

/**
 * 将尺寸扩张造成的重叠块沿扩张方向逐个推开。
 * 返回值仅包含被推动的块；边界使用严格相交判定，因此块可以无缝紧贴。
 */
export function pushOverlappingBlocks(blocks, resizedId, resizedRect, direction) {
  const items = (Array.isArray(blocks) ? blocks : [])
    .filter(block => block?.id && Number.isFinite(block.x) && Number.isFinite(block.y))
    .map(block => ({
      id: block.id,
      x: block.id === resizedId ? resizedRect.x : block.x,
      y: block.id === resizedId ? resizedRect.y : block.y,
      width: Math.max(1, block.id === resizedId ? resizedRect.width : block.width),
      height: Math.max(1, block.id === resizedId ? resizedRect.height : block.height)
    }))

  const positions = new Map(items.map(item => [item.id, item]))
  const source = positions.get(resizedId)
  const initialDirections = resizeDirections(direction)
  if (!source || !initialDirections.length) return {}

  const updates = {}
  const queue = [{ id: resizedId, directions: initialDirections }]
  let remaining = Math.max(16, items.length * items.length * 4)

  while (queue.length && remaining > 0) {
    remaining -= 1
    const current = queue.shift()
    const pusher = positions.get(current.id)
    if (!pusher) continue

    for (const candidate of items) {
      if (candidate.id === resizedId || candidate.id === current.id) continue
      const target = positions.get(candidate.id)
      if (!target || !blocksOverlap(pusher, target)) continue
      const push = pushCandidates(pusher, target, current.directions)[0]
      if (!push) continue

      const nextPosition = pushedPosition(pusher, target, push.direction)
      const moved = { ...target, ...nextPosition }
      positions.set(target.id, moved)
      updates[target.id] = nextPosition
      queue.push({ id: target.id, directions: [push.direction] })
    }
  }

  return updates
}

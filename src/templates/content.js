import { deepClone, generateId } from '../utils/index.js'

// 模板只保留不依赖当前笔记、素材库或其他笔记的自包含块。
export const TEMPLATE_BLOCK_TYPES = new Set(['text', 'table', 'code', 'callout', 'formula'])

/**
 * 把一份真实笔记裁剪为可复用模板，并同步重建块 ID、分组 ID 与连线端点。
 * 模板内部仍保留 ID，方便模板编辑器和预览正确关联；真正套用时会再次换成新 ID。
 */
export function sanitizeTemplateContent(blocks, connections = [], idFactory = generateId) {
  const sourceBlocks = Array.isArray(blocks) ? blocks : []
  const sourceConnections = Array.isArray(connections) ? connections : []
  const blockIdMap = new Map()
  const groupIdMap = new Map()
  const keptBlocks = []
  let dropped = 0

  for (const source of sourceBlocks) {
    if (!source || !TEMPLATE_BLOCK_TYPES.has(source.type)) {
      dropped++
      continue
    }

    const block = deepClone(source)
    const templateBlockId = idFactory()
    if (block.id) blockIdMap.set(block.id, templateBlockId)
    block.id = templateBlockId
    delete block.createdAt
    delete block.updatedAt
    // 旧模板可能没有保存背景色；统一补为中性底色，避免回退为绿色。
    if (!block.color) block.color = 'default'

    if (block.groupId) {
      if (!groupIdMap.has(block.groupId)) groupIdMap.set(block.groupId, idFactory())
      block.groupId = groupIdMap.get(block.groupId)
    }
    keptBlocks.push(block)
  }

  const keptConnections = sourceConnections.flatMap(source => {
    const from = blockIdMap.get(source?.from)
    const to = blockIdMap.get(source?.to)
    if (!from || !to || from === to) return []
    const connection = deepClone(source)
    connection.id = idFactory()
    connection.from = from
    connection.to = to
    delete connection.createdAt
    delete connection.updatedAt
    return [connection]
  })

  return { blocks: keptBlocks, connections: keptConnections, dropped }
}

/**
 * 为一次“从模板新建笔记”生成全新的块/连线 ID，避免多篇笔记复用数据库主键。
 * 同时兼容旧模板中缺少块 ID 的情况；这类旧数据无法可靠关联历史连线，会安全丢弃悬空线。
 */
export function instantiateTemplateContent(blocks, connections = [], idFactory = generateId) {
  const sourceBlocks = Array.isArray(blocks) ? blocks : []
  const sourceConnections = Array.isArray(connections) ? connections : []
  const blockIdMap = new Map()
  const groupIdMap = new Map()

  const instantiatedBlocks = sourceBlocks.map((source, index) => {
    const block = deepClone(source || {})
    const sourceId = block.id || `legacy-block-${index}`
    const noteBlockId = idFactory()
    blockIdMap.set(sourceId, noteBlockId)
    block.id = noteBlockId
    delete block.createdAt
    delete block.updatedAt
    // 兼容历史模板：缺省背景色一律使用中性默认色。
    if (!block.color) block.color = 'default'

    if (block.groupId) {
      if (!groupIdMap.has(block.groupId)) groupIdMap.set(block.groupId, idFactory())
      block.groupId = groupIdMap.get(block.groupId)
    }
    return block
  })

  const instantiatedConnections = sourceConnections.flatMap(source => {
    const from = blockIdMap.get(source?.from)
    const to = blockIdMap.get(source?.to)
    if (!from || !to || from === to) return []
    const connection = deepClone(source)
    connection.id = idFactory()
    connection.from = from
    connection.to = to
    delete connection.createdAt
    delete connection.updatedAt
    return [connection]
  })

  return { blocks: instantiatedBlocks, connections: instantiatedConnections }
}

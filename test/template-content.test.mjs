import assert from 'node:assert/strict'
import { instantiateTemplateContent, sanitizeTemplateContent } from '../src/templates/content.js'

function sequentialIds(prefix) {
  let index = 0
  return () => `${prefix}-${++index}`
}

const sourceBlocks = [
  { id: 'note-a', type: 'text', content: '<p>A</p>', x: 80, y: 60, width: 240, groupId: 'group-1', createdAt: 1 },
  { id: 'note-b', type: 'table', rows: [['B']], x: 380, y: 60, width: 260, groupId: 'group-1', updatedAt: 2 },
  { id: 'note-image', type: 'image', imageUrl: 'asset://outside-template' }
]
const sourceConnections = [
  { id: 'note-line', from: 'note-a', to: 'note-b', shape: 'bezier', dash: 'dashed', color: '#123456', createdAt: 3 },
  { id: 'orphan-line', from: 'note-a', to: 'note-image', shape: 'straight' }
]

const sanitized = sanitizeTemplateContent(sourceBlocks, sourceConnections, sequentialIds('template'))
assert.equal(sanitized.dropped, 1)
assert.deepEqual(sanitized.blocks.map(block => block.id), ['template-1', 'template-3'])
assert.equal(sanitized.blocks[0].groupId, 'template-2')
assert.equal(sanitized.blocks[1].groupId, 'template-2')
assert.equal('createdAt' in sanitized.blocks[0], false)
assert.equal('updatedAt' in sanitized.blocks[1], false)
assert.deepEqual(sanitized.connections, [{
  id: 'template-4',
  from: 'template-1',
  to: 'template-3',
  shape: 'bezier',
  dash: 'dashed',
  color: '#123456'
}])

const instantiated = instantiateTemplateContent(
  sanitized.blocks,
  sanitized.connections,
  sequentialIds('note')
)
assert.deepEqual(instantiated.blocks.map(block => block.id), ['note-1', 'note-3'])
assert.equal(instantiated.blocks[0].groupId, 'note-2')
assert.equal(instantiated.blocks[1].groupId, 'note-2')
assert.deepEqual(instantiated.connections, [{
  id: 'note-4',
  from: 'note-1',
  to: 'note-3',
  shape: 'bezier',
  dash: 'dashed',
  color: '#123456'
}])

assert.equal(sourceBlocks[0].id, 'note-a')
assert.equal(sourceConnections[0].from, 'note-a')

const legacy = instantiateTemplateContent(
  [{ type: 'text', content: 'legacy' }],
  [{ id: 'legacy-line', from: 'missing-a', to: 'missing-b' }],
  sequentialIds('legacy')
)
assert.equal(legacy.blocks.length, 1)
assert.equal(legacy.connections.length, 0)

console.log('template-content: PASS')

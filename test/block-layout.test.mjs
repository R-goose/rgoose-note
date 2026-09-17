import assert from 'node:assert/strict'
import { blocksOverlap, pushOverlappingBlocks } from '../src/utils/blockLayout.js'

assert.equal(blocksOverlap(
  { x: 0, y: 0, width: 100, height: 100 },
  { x: 100, y: 0, width: 100, height: 100 }
), false)

const horizontal = [
  { id: 'a', x: 0, y: 0, width: 100, height: 100 },
  { id: 'b', x: 120, y: 0, width: 80, height: 100 },
  { id: 'c', x: 210, y: 0, width: 70, height: 100 }
]
assert.deepEqual(
  pushOverlappingBlocks(horizontal, 'a', { x: 0, y: 0, width: 150, height: 100 }, 'e'),
  { b: { x: 150, y: 0 }, c: { x: 230, y: 0 } }
)

const vertical = [
  { id: 'a', x: 20, y: 100, width: 100, height: 100 },
  { id: 'b', x: 20, y: 60, width: 100, height: 30 },
  { id: 'c', x: 20, y: 20, width: 100, height: 30 }
]
assert.deepEqual(
  pushOverlappingBlocks(vertical, 'a', { x: 20, y: 50, width: 100, height: 150 }, 'n'),
  { b: { x: 20, y: 20 }, c: { x: 20, y: -10 } }
)

const corner = [
  { id: 'a', x: 0, y: 0, width: 100, height: 100 },
  { id: 'right', x: 110, y: 10, width: 50, height: 50 },
  { id: 'bottom', x: 10, y: 110, width: 50, height: 50 }
]
assert.deepEqual(
  pushOverlappingBlocks(corner, 'a', { x: 0, y: 0, width: 130, height: 130 }, 'se'),
  { right: { x: 130, y: 10 }, bottom: { x: 10, y: 130 } }
)

console.log('block-layout: PASS')

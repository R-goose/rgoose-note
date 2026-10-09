import assert from 'node:assert/strict'
import { connectionEndpoints, connectionPort } from '../src/utils/connectionPorts.js'

const text = { x: 80, y: 60 }
const table = { x: 390, y: 140 }
const textSize = { width: 240, height: 100 }
const tableSize = { width: 300, height: 180 }

assert.deepEqual(connectionPort(text, textSize, 'top'), { x: 200, y: 60 })
assert.deepEqual(connectionPort(text, textSize, 'right'), { x: 320, y: 110 })
assert.deepEqual(connectionPort(table, tableSize, 'left'), { x: 390, y: 230 })
assert.deepEqual(connectionPort(table, tableSize, 'bottom'), { x: 540, y: 320 })

const selected = connectionEndpoints(text, textSize, table, tableSize, {
  fromSide: 'bottom', toSide: 'left'
})
assert.deepEqual(selected.from, { x: 200, y: 160 })
assert.deepEqual(selected.to, { x: 390, y: 230 })
assert.equal(selected.fromSide, 'bottom')
assert.equal(selected.toSide, 'left')

const legacy = connectionEndpoints(text, textSize, table, tableSize)
assert.deepEqual(legacy.from, connectionPort(text, textSize, legacy.fromSide))
assert.deepEqual(legacy.to, connectionPort(table, tableSize, legacy.toSide))
assert.equal(legacy.fromSide, 'right')
assert.equal(legacy.toSide, 'left')

const resized = connectionEndpoints(text, textSize, table, { width: 360, height: 250 }, {
  fromSide: 'bottom', toSide: 'left'
})
assert.deepEqual(resized.to, { x: 390, y: 265 })

console.log('connection-ports: PASS')

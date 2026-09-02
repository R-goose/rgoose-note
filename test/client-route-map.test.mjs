import assert from 'node:assert/strict'
import { matchRoute } from '../src/api/client.js'

const restoreRoute = matchRoute('/notes/note-1/restore', 'POST')
assert.deepEqual(restoreRoute, {
  channel: 'backend:notes:restore',
  args: ['note-1']
})

const hardDeleteRoute = matchRoute('/notes/note-1/hard', 'DELETE')
assert.deepEqual(hardDeleteRoute, {
  channel: 'backend:notes:hardDelete',
  args: ['note-1']
})

const softDeleteRoute = matchRoute('/notes/note-1', 'DELETE')
assert.deepEqual(softDeleteRoute, {
  channel: 'backend:notes:delete',
  args: ['note-1']
})

assert.equal(matchRoute('/notes/note-1/hard', 'POST'), null)

console.log('client-route-map: PASS')

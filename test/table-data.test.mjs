import assert from 'node:assert/strict'
import {
  deleteTableColumn,
  deleteTableRow,
  getNextTableHeader,
  insertTableColumn,
  insertTableRow,
  insertTableSize,
  deleteTableSize,
  normalizeTableSizes,
  parseTableData,
  updateTableCell
} from '../src/utils/tableData.js'

const source = '姓名|分数\n小鹅|90\n小鸭|80'

assert.deepEqual(parseTableData(source), [
  ['姓名', '分数'],
  ['小鹅', '90'],
  ['小鸭', '80']
])
assert.equal(insertTableRow(source, 2), '姓名|分数\n小鹅|90\n|\n小鸭|80')
assert.equal(insertTableColumn(source, 1), '姓名|列3|分数\n小鹅||90\n小鸭||80')
assert.equal(insertTableColumn('列1|列3\n1|3', 2), '列1|列3|列4\n1|3|')
assert.equal(getNextTableHeader(['列1', '列3']), '列4')
assert.deepEqual(normalizeTableSizes([40, 120], 3, 92, 60), [60, 120, 92])
assert.deepEqual(insertTableSize([80, 90], 1, 2, 92, 60), [80, 92, 90])
assert.deepEqual(deleteTableSize([80, 90, 100], 1, 3, 92, 60), [80, 100])
assert.equal(deleteTableRow(source, 1), '姓名|分数\n小鸭|80')
assert.equal(deleteTableColumn(source, 0), '分数\n90\n80')
assert.equal(updateTableCell(source, 1, 1, ' 95 '), '姓名|分数\n小鹅|95\n小鸭|80')

// 至少保留表头和一列；最后一条数据行也可以删除。
assert.equal(deleteTableRow('A\n1', 1), 'A')
assert.deepEqual(parseTableData('A'), [['A']])
assert.equal(insertTableRow('A', 1), 'A\n')
assert.deepEqual(parseTableData('A\n'), [['A'], ['']])
assert.equal(deleteTableColumn('A\n1', 0), 'A\n1')

console.log('table-data: PASS')

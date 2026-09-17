import assert from 'node:assert/strict'
import {
  deleteTableColumn,
  deleteTableRow,
  getNextTableHeader,
  insertTableColumn,
  insertTableRow,
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
assert.equal(deleteTableRow(source, 1), '姓名|分数\n小鸭|80')
assert.equal(deleteTableColumn(source, 0), '分数\n90\n80')
assert.equal(updateTableCell(source, 1, 1, ' 95 '), '姓名|分数\n小鹅|95\n小鸭|80')

// 至少保留表头、一行数据和一列，避免编辑操作产生不可用空表。
assert.equal(deleteTableRow('A\n1', 1), 'A\n1')
assert.equal(deleteTableColumn('A\n1', 0), 'A\n1')

console.log('table-data: PASS')

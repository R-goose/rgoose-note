export const DEFAULT_TABLE_DATA = '列1|列2|列3\n10|20|30\n15|25|35'

export function parseTableData(raw, fallback = DEFAULT_TABLE_DATA) {
  const source = typeof raw === 'string' && raw.trim() ? raw : fallback
  const rows = source
    .split(/\r?\n/)
    .filter(line => line.trim())
    .map(line => line.split(/\||\t/).map(cell => cell.trim()))

  if (!rows.length) return [['列1'], ['']]
  const columnCount = Math.max(1, ...rows.map(row => row.length))
  const normalized = rows.map(row => [
    ...row.slice(0, columnCount),
    ...Array(Math.max(0, columnCount - row.length)).fill('')
  ])
  if (normalized.length === 1) normalized.push(Array(columnCount).fill(''))
  return normalized
}

export function serializeTableData(rows) {
  return rows.map(row => row.join('|')).join('\n')
}

export function updateTableCell(raw, rowIndex, columnIndex, value) {
  const rows = parseTableData(raw)
  if (!rows[rowIndex] || columnIndex < 0 || columnIndex >= rows[rowIndex].length) return serializeTableData(rows)
  rows[rowIndex][columnIndex] = String(value ?? '').trim()
  return serializeTableData(rows)
}

export function insertTableRow(raw, rowIndex) {
  const rows = parseTableData(raw)
  const index = Math.min(Math.max(1, Number(rowIndex) || 1), rows.length)
  rows.splice(index, 0, Array(rows[0].length).fill(''))
  return serializeTableData(rows)
}

export function deleteTableRow(raw, rowIndex) {
  const rows = parseTableData(raw)
  if (rows.length <= 2 || rowIndex <= 0 || rowIndex >= rows.length) return serializeTableData(rows)
  rows.splice(rowIndex, 1)
  return serializeTableData(rows)
}

export function insertTableColumn(raw, columnIndex) {
  const rows = parseTableData(raw)
  const currentCount = rows[0].length
  const index = Math.min(Math.max(0, Number(columnIndex) || 0), currentCount)
  const existingHeaders = new Set(rows[0])
  let headerNumber = currentCount + 1
  while (existingHeaders.has(`列${headerNumber}`)) headerNumber += 1
  rows.forEach((row, rowIndex) => {
    row.splice(index, 0, rowIndex === 0 ? `列${headerNumber}` : '')
  })
  return serializeTableData(rows)
}

export function deleteTableColumn(raw, columnIndex) {
  const rows = parseTableData(raw)
  if (rows[0].length <= 1 || columnIndex < 0 || columnIndex >= rows[0].length) return serializeTableData(rows)
  rows.forEach(row => row.splice(columnIndex, 1))
  return serializeTableData(rows)
}

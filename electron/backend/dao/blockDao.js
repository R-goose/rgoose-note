/**
 * 块 DAO
 * 全类型共用一张表，按 type 区分
 */

const { getDb } = require('../db/connection')
const { safeParse, safeStringify } = require('../common/utils')

/** JSON 数组/对象字段的反序列化 */
function deserialize(row) {
  if (!row) return null
  const obj = { ...row }
  if (obj.images != null) {
    obj.images = safeParse(obj.images, [])
  }
  if (obj.linkedTextRange != null) {
    obj.linkedTextRange = safeParse(obj.linkedTextRange, null)
  }
  // 布尔类型字段
  if (obj.done != null) obj.done = !!obj.done
  if (obj.tableAnalysis != null) obj.tableAnalysis = !!obj.tableAnalysis
  return obj
}

/** 各列的写入值（null safe + JSON 序列化） */
function buildParams(block) {
  return {
    id: block.id,
    noteId: block.noteId,
    type: block.type,
    content: block.content ?? null,
    x: block.x ?? 0,
    y: block.y ?? 0,
    width: block.width ?? 240,
    minHeight: block.minHeight ?? 60,
    color: block.color ?? null,
    title: block.title ?? null,
    status: block.status ?? null,
    priority: block.priority ?? null,
    dueDate: block.dueDate ?? null,
    imageUrl: block.imageUrl ?? null,
    mediaUrl: block.mediaUrl ?? null,
    mediaName: block.mediaName ?? null,
    images: block.images != null ? safeStringify(block.images) : null,
    galleryLayout: block.galleryLayout ?? null,
    code: block.code ?? null,
    codeLang: block.codeLang ?? null,
    calloutType: block.calloutType ?? null,
    formula: block.formula ?? null,
    tableData: block.tableData ?? null,
    tableAnalysis: block.tableAnalysis == null ? null : (block.tableAnalysis ? 1 : 0),
    label: block.label ?? null,
    value: block.value ?? null,
    mode: block.mode ?? null,
    date: block.date ?? null,
    done: block.done == null ? null : (block.done ? 1 : 0),
    desc: block.desc ?? null,
    linkedNoteId: block.linkedNoteId ?? null,
    linkedBlockId: block.linkedBlockId ?? null,
    linkedTextRange: block.linkedTextRange != null ? safeStringify(block.linkedTextRange) : null,
    createdAt: block.createdAt,
    updatedAt: block.updatedAt
  }
}

const INSERT_SQL = `
  INSERT INTO blocks (
    id, noteId, type, content, x, y, width, minHeight, color,
    title, status, priority, dueDate,
    imageUrl, mediaUrl, mediaName, images, galleryLayout,
    code, codeLang, calloutType, formula, tableData, tableAnalysis,
    label, value, mode, "date", done, "desc",
    linkedNoteId, linkedBlockId, linkedTextRange,
    createdAt, updatedAt
  ) VALUES (
    @id, @noteId, @type, @content, @x, @y, @width, @minHeight, @color,
    @title, @status, @priority, @dueDate,
    @imageUrl, @mediaUrl, @mediaName, @images, @galleryLayout,
    @code, @codeLang, @calloutType, @formula, @tableData, @tableAnalysis,
    @label, @value, @mode, @date, @done, @desc,
    @linkedNoteId, @linkedBlockId, @linkedTextRange,
    @createdAt, @updatedAt
  )
`

const UPDATE_SQL = `
  UPDATE blocks SET
    type = @type,
    content = @content,
    x = @x,
    y = @y,
    width = @width,
    minHeight = @minHeight,
    color = @color,
    title = @title,
    status = @status,
    priority = @priority,
    dueDate = @dueDate,
    imageUrl = @imageUrl,
    mediaUrl = @mediaUrl,
    mediaName = @mediaName,
    images = @images,
    galleryLayout = @galleryLayout,
    code = @code,
    codeLang = @codeLang,
    calloutType = @calloutType,
    formula = @formula,
    tableData = @tableData,
    tableAnalysis = @tableAnalysis,
    label = @label,
    value = @value,
    mode = @mode,
    "date" = @date,
    done = @done,
    "desc" = @desc,
    linkedNoteId = @linkedNoteId,
    linkedBlockId = @linkedBlockId,
    linkedTextRange = @linkedTextRange,
    updatedAt = @updatedAt
  WHERE id = @id
`

module.exports = {
  listByNote(noteId) {
    const db = getDb()
    return db.prepare('SELECT * FROM blocks WHERE noteId = ?')
      .all(noteId).map(deserialize)
  },

  listByNoteIds(noteIds) {
    if (!noteIds || noteIds.length === 0) return []
    const db = getDb()
    const placeholders = noteIds.map(() => '?').join(',')
    return db.prepare(`SELECT * FROM blocks WHERE noteId IN (${placeholders})`)
      .all(...noteIds).map(deserialize)
  },

  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM blocks WHERE id = ?').get(id))
  },

  insert(block) {
    const db = getDb()
    db.prepare(INSERT_SQL).run(buildParams(block))
    return this.getById(block.id)
  },

  update(id, block) {
    const db = getDb()
    db.prepare(UPDATE_SQL).run({ ...buildParams(block), id })
    return this.getById(id)
  },

  delete(id) {
    const db = getDb()
    return db.prepare('DELETE FROM blocks WHERE id = ?').run(id).changes
  },

  deleteByNote(noteId) {
    const db = getDb()
    return db.prepare('DELETE FROM blocks WHERE noteId = ?').run(noteId).changes
  },

  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM blocks').all().map(deserialize)
  }
}

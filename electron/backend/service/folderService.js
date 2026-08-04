/**
 * 文件夹业务：层级查询、递归软删除
 * 对照 Java FolderService.java
 */

const folderDao = require('../dao/folderDao')
const noteDao = require('../dao/noteDao')
const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const { getDb } = require('../db/connection')
const { now } = require('../common/utils')
const { notFound } = require('../common/errors')

module.exports = {
  list(parentId) {
    return folderDao.list(parentId)
  },

  get(id) {
    const folder = folderDao.getById(id)
    if (!folder || folder.deleted) throw notFound('文件夹不存在')
    return folder
  },

  create(folder) {
    const ts = now()
    return folderDao.insert({ ...folder, createdAt: ts, updatedAt: ts })
  },

  update(id, folder) {
    this.get(id)
    return folderDao.update(id, { ...folder, updatedAt: now() })
  },

  /** 递归软删：文件夹 + 子文件夹 + 其下笔记（及 blocks/connections） */
  delete(id) {
    const db = getDb()
    let count = 0
    const tx = db.transaction(() => {
      count += folderDao.softDelete(id)

      // 递归子文件夹
      const children = folderDao.list(id)
      for (const child of children) {
        count += this.delete(child.id)
      }

      // 软删笔记 + 物理删 blocks/connections
      const notes = noteDao.list({ folderId: id })
      for (const note of notes) {
        count += noteDao.softDelete(note.id)
        count += blockDao.deleteByNote(note.id)
        count += connectionDao.deleteByNote(note.id)
      }
    })
    tx()
    return count
  },

  listAll() {
    return folderDao.listAll()
  }
}

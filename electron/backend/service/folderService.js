/**
 * 文件夹业务：层级查询、递归软删除
 * 对照 Java FolderService.java
 */

const folderDao = require('../dao/folderDao')
const noteDao = require('../dao/noteDao')
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

  /** 仅更新标签 */
  updateTags(id, tags) {
    this.get(id)
    return folderDao.updateTags(id, tags)
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

      // 软删笔记（保留 blocks/connections，回收站可完整恢复）
      const notes = noteDao.list({ folderId: id })
      for (const note of notes) {
        count += noteDao.softDelete(note.id)
      }
    })
    tx()
    return count
  },

  listAll() {
    return folderDao.listAll()
  }
}

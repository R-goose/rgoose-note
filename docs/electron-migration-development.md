# R-Goose Note 后端开发文档（Electron + Node.js + SQLite）

> 版本：v3.0 ｜ 架构：单进程内嵌 · 零外部依赖 ｜ 更新日期：2026-08-03
> 技术栈：Electron 28 · Node.js（主进程） · better-sqlite3 · Express（可选）
> **命名原则：后端变量名 / 数据库列名 / JS 对象字段，全部以前端 camelCase 为准，1:1 对齐**

---

## 目录

1. [架构概览](#1-架构概览)
2. [技术栈与工程结构](#2-技术栈与工程结构)
3. [数据库设计](#3-数据库设计)
4. [数据访问层（DAO）](#4-数据访问层dao)
5. [业务服务层（Service）](#5-业务服务层service)
6. [IPC 通道与 HTTP 路由](#6-ipc-通道与-http-路由)
7. [媒体存储子系统](#7-媒体存储子系统)
8. [数据同步与合并](#8-数据同步与合并)
9. [导入导出与备份](#9-导入导出与备份)
10. [异常处理与统一响应](#10-异常处理与统一响应)
11. [启动流程与生命周期](#11-启动流程与生命周期)
12. [前端适配清单](#12-前端适配清单)
13. [打包与分发](#13-打包与分发)
14. [前后端字段对照表](#14-前后端字段对照表)

---

## 1. 架构概览

从 v2.0（Spring Boot + MySQL，需用户独立安装 JRE 与 MySQL）迁移到 v3.0（Electron 主进程内嵌 Node.js 后端 + SQLite）。目标：**用户双击安装包即可使用，零外部依赖、零启动延迟**。

```
┌──────────────────────────────────────────────────────────┐
│                 Electron 单进程应用                       │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  渲染进程 (Vue 3 + Pinia)                         │    │
│  │   src/api/*.js  ──┐                               │    │
│  └────────────────────┼─────────────────────────────┘    │
│                       │                                  │
│            ┌──────────┴───────────┐                      │
│            │  方式 A: IPC Bridge   │                      │
│            │  方式 B: 内嵌 Express  │                      │
│            └──────────┬───────────┘                      │
│                       │                                  │
│  ┌────────────────────┼─────────────────────────────┐    │
│  │  主进程 (Node.js)   ▼                             │    │
│  │  ┌──────────────────────────────────────────┐    │    │
│  │  │  Service 层 (业务逻辑、合并、同步)         │    │    │
│  │  ├──────────────────────────────────────────┤    │    │
│  │  │  DAO 层 (better-sqlite3 prepared stmt)    │    │    │
│  │  ├──────────────┬───────────────────────────┤    │    │
│  │  │  SQLite      │  文件存储 (images/)         │    │    │
│  │  │  rgoose.db   │  媒体文件                   │    │    │
│  │  └──────────────┴───────────────────────────┘    │    │
│  └──────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘
```

### 1.1 核心变化（对比 v2.0）

| 维度 | v2.0 Java + MySQL | v3.0 Electron + SQLite |
|---|---|---|
| 用户安装 | 需装 JDK 17 + MySQL 8 | 双击 exe/dmg 即用 |
| 启动延迟 | JVM + MySQL 启动 3-8s | 主进程内嵌，零延迟 |
| 进程数 | 2 个独立进程 | 单进程 |
| 数据文件 | MySQL 数据目录 | 单个 `rgoose.db`，可随应用打包/迁移 |
| 配置 | 用户名/密码/端口 | 零配置 |
| 跨平台 | 一致 | 一致（Win/Mac/Linux） |
| 后端语言 | Java | Node.js (CommonJS) |
| 数据库驱动 | JDBC + HikariCP | better-sqlite3 (同步 API) |
| ORM | MyBatis-Plus | 手写 SQL prepared statement |

### 1.2 设计原则

- **以前端为主**：数据库列名、Service 参数名、返回对象字段全部沿用前端 camelCase，零转换、零映射成本。
- **零外部依赖**：用户无需安装任何额外环境，应用启动即可用。
- **单进程内嵌**：Node 后端跑在 Electron 主进程，无 IPC 跨进程开销（与渲染进程通信除外）。
- **同步 SQL API**：better-sqlite3 是同步的，代码直观，事务边界清晰，避免 callback/Promise 地狱。
- **保留 RESTful 形态**：前端 `src/api/*.js` 仅需切换 baseURL 或走 IPC 通道，store 层零改动。

### 1.3 通信方式选择

| 方式 | 启动复杂度 | 前端改动量 | 性能 | 调试便利 | 推荐场景 |
|---|---|---|---|---|---|
| **A: IPC Bridge** | 极低 | 中（client.js 切换） | 最佳（无 HTTP 序列化） | DevTools 不易抓包 | 桌面端主力方案 |
| **B: 内嵌 Express** | 中 | 极低（仅改 baseURL） | 略低（HTTP 序列化） | DevTools Network 可抓 | 兼容旧前端、过渡期 |

**推荐**：默认走 IPC Bridge（性能最佳），开发调试期可启用 Express 模式（保留原 `src/api/*.js` 不变）。详见 [§6](#6-ipc-通道与-http-路由)。

---

## 2. 技术栈与工程结构

### 2.1 技术选型

| 层 | 技术 | 版本 | 说明 |
|---|---|---|---|
| 桌面框架 | Electron | 28.x | 已在用，主进程支持 Node.js 全部 API |
| 数据库 | SQLite | 3.45+（better-sqlite3 自带） | 单文件嵌入式数据库 |
| DB 驱动 | better-sqlite3 | 11.x | 同步 API、性能最佳、支持 prepared statement |
| Web 框架 | express | 4.x | 仅在 HTTP 模式下启用，IPC 模式不需要 |
| 文件处理 | fs-extra | 11.x | 异步文件操作，便于备份/迁移 |
| 加密 | 内置 crypto | — | UUID v4 生成、文件哈希 |
| 打包 | electron-builder | 24.x | 已在用，需配置 asar 与 native 模块 rebuild |

### 2.2 工程结构

```
e:\大师的\
├── electron/                          # Electron 主进程
│   ├── main.cjs                       # 入口：窗口管理、生命周期（已存在，需扩展）
│   ├── preload.cjs                    # 预加载：暴露 IPC bridge（已存在，需扩展）
│   ├── backend/                       # ★ 新增：内嵌后端
│   │   ├── index.cjs                  # 后端入口：初始化 DB、注册 IPC、可选启动 Express
│   │   ├── db/
│   │   │   ├── connection.cjs         # SQLite 连接管理（单例）
│   │   │   ├── schema.sql             # 建表脚本（SQLite 方言）
│   │   │   ├── seed.sql               # 种子数据（system-root 文件夹）
│   │   │   └── migrate.cjs            # 自动迁移：首次启动建表 + 种子
│   │   ├── dao/
│   │   │   ├── folderDao.cjs          # 文件夹 CRUD
│   │   │   ├── noteDao.cjs            # 笔记 CRUD
│   │   │   ├── blockDao.cjs           # 块 CRUD
│   │   │   ├── connectionDao.cjs      # 连线 CRUD
│   │   │   ├── planDao.cjs            # 计划 CRUD
│   │   │   ├── tagDao.cjs             # 标签 CRUD
│   │   │   └── imageDao.cjs           # 媒体元数据 CRUD
│   │   ├── service/
│   │   │   ├── folderService.cjs      # 文件夹业务（递归删除）
│   │   │   ├── noteService.cjs        # 笔记业务（深拷贝复制）
│   │   │   ├── blockService.cjs       # 块业务（批量更新）
│   │   │   ├── connectionService.cjs  # 连线业务（双向去重）
│   │   │   ├── planService.cjs        # 计划业务
│   │   │   ├── tagService.cjs         # 标签业务（级联清理）
│   │   │   ├── imageService.cjs       # 媒体业务
│   │   │   └── syncService.cjs        # 同步/导入/清空
│   │   ├── router/
│   │   │   ├── ipcRoutes.cjs          # IPC 通道注册（默认）
│   │   │   └── httpRoutes.cjs         # Express 路由（可选调试模式）
│   │   ├── common/
│   │   │   ├── response.cjs           # 统一响应封装 R<T>
│   │   │   ├── errors.cjs             # 业务异常类
│   │   │   └── utils.cjs              # 时间戳、UUID、JSON 序列化
│   │   └── config.cjs                 # 路径配置、端口、模式开关
│   └── lib/                           # ★ 新增：better-sqlite3 native 模块
│       └── better-sqlite3/            # 通过 electron-rebuild 编译
├── src/                               # 前端（基本不动）
│   └── api/
│       └── client.js                  # ★ 修改：根据环境切换 IPC / HTTP
├── build/                             # 打包资源（图标）
├── dist/                              # Vite 构建产物
└── package.json                       # ★ 新增 better-sqlite3、express、fs-extra 依赖
```

### 2.3 依赖增补

`package.json` 新增：

```json
{
  "dependencies": {
    "better-sqlite3": "^11.0.0",
    "express": "^4.19.0",
    "fs-extra": "^11.2.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@electron/rebuild": "^3.6.0"
  },
  "scripts": {
    "postinstall": "electron-rebuild -f -w better-sqlite3",
    "electron:dev": "vite build && concurrently -k \"vite\" \"wait-on http://localhost:5173 && electron .\"",
    "electron:build": "npm run kill:app && vite build && electron-builder"
  }
}
```

`build.files` 字段补充 native 模块白名单：

```json
"files": [
  "dist/**/*",
  "electron/**/*.cjs",
  "electron/lib/better-sqlite3/**/*",
  "build/icon.ico",
  "!**/node_modules/**",
  "!test/**"
]
```

---

## 3. 数据库设计

### 3.1 SQLite vs MySQL 方言差异

复用 v2.0 的 `schema.sql`，需做以下转换：

| MySQL 写法 | SQLite 写法 | 说明 |
|---|---|---|
| `CREATE DATABASE` + `USE` | 删除 | SQLite 单文件即数据库 |
| `CHAR(36)` | `TEXT` | SQLite 无定长字符 |
| `VARCHAR(N)` | `TEXT` | SQLite 无长度限制 |
| `MEDIUMTEXT` | `TEXT` | 同上 |
| `BIGINT` | `INTEGER` | SQLite 整数统一 INTEGER（8 字节） |
| `TINYINT(1)` | `INTEGER` | 用 0/1 表示 bool |
| `DOUBLE` | `REAL` | 浮点数 |
| `JSON` | `TEXT` | SQLite 无原生 JSON 类型，存字符串即可 |
| `ENGINE=InnoDB` | 删除 | SQLite 无存储引擎 |
| `DEFAULT CHARSET=utf8mb4` | 删除 | SQLite 默认 UTF-8 |
| 反引号 `from` | 双引号 `"from"` | 保留字引用方式不同 |
| `UNIX_TIMESTAMP() * 1000` | `(strftime('%s','now') * 1000)` | 时间戳函数不同 |
| `JSON_CONTAINS(tags, ?)` | `EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)` | JSON 查询语法不同 |
| `ON DUPLICATE KEY UPDATE` | `INSERT OR REPLACE` 或 `ON CONFLICT(id) DO UPDATE` | UPSERT 语法 |

### 3.2 建表脚本（SQLite 版）

`electron/backend/db/schema.sql`：

```sql
-- ============================================================
-- R-Goose Note SQLite Schema
-- 列名全部 camelCase，与前端字段名 1:1 对齐
-- ============================================================

PRAGMA journal_mode = WAL;          -- 并发读写性能更佳
PRAGMA foreign_keys = ON;            -- 启用外键约束
PRAGMA synchronous = NORMAL;         -- 平衡性能与安全

-- ---------- 文件夹 ----------
CREATE TABLE IF NOT EXISTS folders (
  id           TEXT    PRIMARY KEY,
  name         TEXT    NOT NULL,
  parentId     TEXT,
  tags         TEXT,                  -- JSON 数组字符串
  isSystem     INTEGER NOT NULL DEFAULT 0,
  createdAt    INTEGER NOT NULL,
  updatedAt    INTEGER NOT NULL,
  deleted      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_folders_parent  ON folders(parentId);
CREATE INDEX IF NOT EXISTS idx_folders_updated ON folders(updatedAt);

-- ---------- 笔记 ----------
CREATE TABLE IF NOT EXISTS notes (
  id            TEXT    PRIMARY KEY,
  title         TEXT    NOT NULL DEFAULT '',
  folderId      TEXT,
  tags          TEXT,
  canvasConfig  TEXT,                  -- JSON: { zoom, offsetX, offsetY }
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL,
  deleted       INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_notes_folder  ON notes(folderId);
CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(updatedAt);

-- ---------- 画布块（全类型共用） ----------
CREATE TABLE IF NOT EXISTS blocks (
  id            TEXT    PRIMARY KEY,
  noteId        TEXT    NOT NULL,
  type          TEXT    NOT NULL,      -- text/todo/image/audio/video/gallery
  content       TEXT,
  x             REAL    NOT NULL DEFAULT 0,
  y             REAL    NOT NULL DEFAULT 0,
  width         INTEGER NOT NULL DEFAULT 240,
  minHeight     INTEGER NOT NULL DEFAULT 60,
  color         TEXT,                  -- default/green/blue/yellow/pink/gray
  title         TEXT,                  -- todo 专有
  status        TEXT,                  -- todo/doing/done/paused
  priority      TEXT,                  -- low/normal/high
  dueDate       INTEGER,              -- 毫秒时间戳
  imageUrl      TEXT,                  -- image 专有
  mediaUrl      TEXT,                  -- audio/video 专有
  mediaName     TEXT,
  images        TEXT,                  -- JSON 数组
  galleryLayout TEXT,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blocks_note     ON blocks(noteId);
CREATE INDEX IF NOT EXISTS idx_blocks_note_type ON blocks(noteId, type);

-- ---------- 连线 ----------
-- from / to 是 SQL 保留字，必须用双引号
CREATE TABLE IF NOT EXISTS connections (
  id            TEXT    PRIMARY KEY,
  noteId        TEXT    NOT NULL,
  "from"        TEXT    NOT NULL,
  "to"          TEXT    NOT NULL,
  shape         TEXT    NOT NULL DEFAULT 'straight',
  dash          TEXT    NOT NULL DEFAULT 'solid',
  arrow         TEXT    NOT NULL DEFAULT 'standard',
  dir           TEXT    NOT NULL DEFAULT 'forward',
  color         TEXT    NOT NULL DEFAULT '#6bbd8f',
  width         TEXT    NOT NULL DEFAULT '2',
  label         TEXT,
  createdAt     INTEGER NOT NULL,
  UNIQUE (noteId, "from", "to")
);
CREATE INDEX IF NOT EXISTS idx_connections_note ON connections(noteId);

-- ---------- 计划/待办 ----------
CREATE TABLE IF NOT EXISTS plans (
  id            TEXT    PRIMARY KEY,
  title         TEXT    NOT NULL,
  description   TEXT,
  dueDate       INTEGER,
  reminder      TEXT,                  -- JSON
  completed     INTEGER NOT NULL DEFAULT 0,
  priority      TEXT    NOT NULL DEFAULT 'normal',
  tags          TEXT,                  -- JSON 数组
  noteId        TEXT,
  blockId       TEXT,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_plans_due     ON plans(dueDate, completed);
CREATE INDEX IF NOT EXISTS idx_plans_note    ON plans(noteId);
CREATE INDEX IF NOT EXISTS idx_plans_updated ON plans(updatedAt);

-- ---------- 标签 ----------
CREATE TABLE IF NOT EXISTS tags (
  id         TEXT    PRIMARY KEY,
  name       TEXT    NOT NULL UNIQUE,
  color      TEXT    NOT NULL DEFAULT '#6bbd8f',
  sort       INTEGER,
  createdAt  INTEGER NOT NULL,
  updatedAt  INTEGER NOT NULL
);

-- ---------- 媒体文件元数据 ----------
CREATE TABLE IF NOT EXISTS images (
  id           TEXT    PRIMARY KEY,    -- 前端引用 ref，如 img_xxx.png
  fileName     TEXT    NOT NULL,
  mimeType     TEXT    NOT NULL,
  sizeBytes    INTEGER NOT NULL DEFAULT 0,
  storagePath  TEXT    NOT NULL,
  createdAt    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_images_created ON images(createdAt);
```

### 3.3 种子数据

`electron/backend/db/seed.sql`：

```sql
-- 系统根目录文件夹（前端 SYSTEM_ROOT_FOLDER_ID = 'system-root'）
INSERT INTO folders (id, name, parentId, tags, isSystem, createdAt, updatedAt, deleted)
VALUES ('system-root', '根目录', NULL, '[]', 1,
        CAST(strftime('%s','now') AS INTEGER) * 1000,
        CAST(strftime('%s','now') AS INTEGER) * 1000, 0)
ON CONFLICT(id) DO UPDATE SET name = '根目录', isSystem = 1;
```

### 3.4 字段名对齐原则

**所有列名严格使用前端 camelCase**，例如：
- `parentId`（非 `parent_id`）
- `folderId`（非 `folder_id`）
- `noteId`（非 `note_id`）
- `isSystem`（非 `is_system`）
- `createdAt`（非 `created_at`）

DAO 层取出后无需任何字段映射，直接返回给前端。

---

## 4. 数据访问层（DAO）

### 4.1 连接管理（单例）

`electron/backend/db/connection.cjs`：

```js
const Database = require('better-sqlite3')
const path = require('path')
const fs = require('fs')

let db = null

/**
 * 获取 SQLite 数据库连接（单例）
 * @param {string} dataDir - 数据目录（由 main.cjs 传入）
 * @returns {Database}
 */
function getDb(dataDir) {
  if (db) return db

  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
  const dbPath = path.join(dataDir, 'rgoose.db')
  db = new Database(dbPath)

  // 性能优化
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')
  db.pragma('synchronous = NORMAL')

  return db
}

function closeDb() {
  if (db) {
    db.close()
    db = null
  }
}

module.exports = { getDb, closeDb }
```

### 4.2 DAO 实现规范

**约定**：
- 每个 DAO 模块导出一组 prepared statement 包装函数
- prepared statement 在模块加载时创建，进程退出时自动释放
- 所有写操作返回完整对象（便于前端乐观更新回滚）
- 软删除字段 `deleted` 由 DAO 自动处理（查询时附加 `WHERE deleted = 0`）

`electron/backend/dao/noteDao.cjs` 示例：

```js
const { getDb } = require('../db/connection')

/** 将行数据转换为前端对象（处理 JSON 字段反序列化） */
function deserialize(row) {
  if (!row) return null
  return {
    ...row,
    tags: row.tags ? JSON.parse(row.tags) : [],
    canvasConfig: row.canvasConfig ? JSON.parse(row.canvasConfig) : null
  }
}

module.exports = {
  /** 列表查询（条件可选） */
  list({ folderId, keyword, tagId } = {}) {
    const db = getDb()
    let sql = 'SELECT * FROM notes WHERE deleted = 0'
    const params = []

    if (folderId) {
      sql += ' AND folderId = ?'
      params.push(folderId)
    }
    if (keyword) {
      sql += ' AND title LIKE ?'
      params.push(`%${keyword}%`)
    }
    if (tagId) {
      // SQLite JSON 查询：tags 列为 ["uuid1", "uuid2"] 字符串
      sql += ' AND EXISTS (SELECT 1 FROM json_each(tags) WHERE value = ?)'
      params.push(tagId)
    }
    sql += ' ORDER BY updatedAt DESC'

    return db.prepare(sql).all(...params).map(deserialize)
  },

  /** 按 id 查询（含已删除） */
  getById(id) {
    const db = getDb()
    return deserialize(db.prepare('SELECT * FROM notes WHERE id = ?').get(id))
  },

  /** 插入 */
  insert(note) {
    const db = getDb()
    db.prepare(`
      INSERT INTO notes (id, title, folderId, tags, canvasConfig, createdAt, updatedAt, deleted)
      VALUES (@id, @title, @folderId, @tags, @canvasConfig, @createdAt, @updatedAt, @deleted)
    `).run({
      id: note.id,
      title: note.title || '',
      folderId: note.folderId || null,
      tags: JSON.stringify(note.tags || []),
      canvasConfig: note.canvasConfig ? JSON.stringify(note.canvasConfig) : null,
      createdAt: note.createdAt,
      updatedAt: note.updatedAt,
      deleted: 0
    })
    return this.getById(note.id)
  },

  /** 全字段更新 */
  update(id, note) {
    const db = getDb()
    db.prepare(`
      UPDATE notes SET
        title = @title,
        folderId = @folderId,
        tags = @tags,
        canvasConfig = @canvasConfig,
        updatedAt = @updatedAt
      WHERE id = @id
    `).run({
      id,
      title: note.title || '',
      folderId: note.folderId || null,
      tags: JSON.stringify(note.tags || []),
      canvasConfig: note.canvasConfig ? JSON.stringify(note.canvasConfig) : null,
      updatedAt: Date.now()
    })
    return this.getById(id)
  },

  /** 软删除 */
  softDelete(id) {
    const db = getDb()
    db.prepare('UPDATE notes SET deleted = 1, updatedAt = ? WHERE id = ?')
      .run(Date.now(), id)
  },

  /** 物理删除（清空数据时用） */
  hardDelete(id) {
    const db = getDb()
    db.prepare('DELETE FROM notes WHERE id = ?').run(id)
  },

  /** 全部数据（同步用） */
  listAll() {
    const db = getDb()
    return db.prepare('SELECT * FROM notes').all().map(deserialize)
  },

  /** 按 updatedAt 增量查询 */
  listSince(since) {
    const db = getDb()
    return db.prepare('SELECT * FROM notes WHERE updatedAt > ?')
      .all(since).map(deserialize)
  }
}
```

### 4.3 DAO 模块清单

| 模块 | 主要方法 |
|---|---|
| `folderDao.cjs` | list, getById, insert, update, softDelete, listAll, listSince |
| `noteDao.cjs` | list(条件), getById, insert, update, softDelete, hardDelete, listAll, listSince |
| `blockDao.cjs` | listByNote, getById, insert, update, deleteByNote, batchUpdate, listByNoteIds |
| `connectionDao.cjs` | listByNote, getByFromTo, insert, update, delete, deleteByNote, listByNoteIds |
| `planDao.cjs` | list(条件), getById, insert, update, delete, toggleComplete, listAll, listSince |
| `tagDao.cjs` | list, getById, getByName, insert, update, delete, listAll, listSince |
| `imageDao.cjs` | getById, insert, delete, listAll |

---

## 5. 业务服务层（Service）

Service 层封装跨表事务、业务规则。逻辑直接对照 Java 版重写，无功能差异。

### 5.1 NoteService

对照 `NoteService.java`：

```js
// electron/backend/service/noteService.cjs
const noteDao = require('../dao/noteDao')
const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const { getDb } = require('../db/connection')
const { v4: uuidv4 } = require('uuid')
const { notFound } = require('../common/errors')

module.exports = {
  list(params) {
    return noteDao.list(params)
  },

  get(id) {
    const note = noteDao.getById(id)
    if (!note || note.deleted) throw notFound('笔记不存在')
    return {
      ...note,
      blocks: blockDao.listByNote(id),
      connections: connectionDao.listByNote(id)
    }
  },

  create(note) {
    const now = Date.now()
    return noteDao.insert({ ...note, createdAt: now, updatedAt: now })
  },

  update(id, note) {
    if (!noteDao.getById(id)) throw notFound('笔记不存在')
    return noteDao.update(id, note)
  },

  /** 软删除笔记 + 物理删除关联 blocks/connections（事务） */
  delete(id) {
    const db = getDb()
    const tx = db.transaction(() => {
      noteDao.softDelete(id)
      blockDao.deleteByNote(id)
      connectionDao.deleteByNote(id)
    })
    tx()
  },

  /** 深拷贝笔记：复制 note + blocks + connections，重新生成 ID 并映射 from/to */
  duplicate(id) {
    const source = noteDao.getById(id)
    if (!source) throw notFound('笔记不存在')

    const db = getDb()
    const tx = db.transaction(() => {
      const now = Date.now()
      const newNoteId = uuidv4()
      const copy = {
        ...source,
        id: newNoteId,
        title: source.title + ' (副本)',
        createdAt: now,
        updatedAt: now
      }
      noteDao.insert(copy)

      // 复制 blocks，建立 oldId -> newId 映射
      const blocks = blockDao.listByNote(id)
      const idMap = {}
      for (const block of blocks) {
        const newBlockId = uuidv4()
        idMap[block.id] = newBlockId
        blockDao.insert({
          ...block,
          id: newBlockId,
          noteId: newNoteId,
          createdAt: now,
          updatedAt: now
        })
      }

      // 复制 connections，映射 from/to
      const conns = connectionDao.listByNote(id)
      for (const conn of conns) {
        connectionDao.insert({
          ...conn,
          id: uuidv4(),
          noteId: newNoteId,
          from: idMap[conn.from] || conn.from,
          to: idMap[conn.to] || conn.to,
          createdAt: now
        })
      }
      return copy
    })
    return tx()
  },

  listAll() {
    return noteDao.listAll()
  }
}
```

### 5.2 FolderService（递归软删除）

```js
// electron/backend/service/folderService.cjs
const folderDao = require('../dao/folderDao')
const noteDao = require('../dao/noteDao')
const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const { getDb } = require('../db/connection')
const { notFound } = require('../common/errors')

module.exports = {
  list(parentId) {
    // parentId 为 null/undefined 查根级；否则查指定父级下
    return folderDao.list(parentId)
  },

  get(id) {
    const folder = folderDao.getById(id)
    if (!folder) throw notFound('文件夹不存在')
    return folder
  },

  create(folder) {
    const now = Date.now()
    return folderDao.insert({ ...folder, createdAt: now, updatedAt: now })
  },

  update(id, folder) {
    if (!folderDao.getById(id)) throw notFound('文件夹不存在')
    return folderDao.update(id, folder)
  },

  /** 递归软删除：文件夹 + 子文件夹 + 其下笔记（及 blocks/connections） */
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
```

### 5.3 BlockService（批量更新）

```js
// electron/backend/service/blockService.cjs
const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const { getDb } = require('../db/connection')

module.exports = {
  list(noteId) { return blockDao.listByNote(noteId) },

  create(noteId, block) {
    const now = Date.now()
    return blockDao.insert({ ...block, noteId, createdAt: now, updatedAt: now })
  },

  update(noteId, blockId, block) {
    return blockDao.update(blockId, { ...block, noteId, updatedAt: Date.now() })
  },

  /** 删除块 + 删除关联连线（from 或 to 等于 blockId） */
  delete(noteId, blockId) {
    const db = getDb()
    const tx = db.transaction(() => {
      blockDao.delete(blockId)
      connectionDao.deleteByBlock(noteId, blockId)
    })
    tx()
  },

  /** 批量更新（画布拖拽场景，单事务） */
  batchUpdate(noteId, blocks) {
    const db = getDb()
    const now = Date.now()
    const tx = db.transaction(() => {
      for (const block of blocks) {
        blockDao.update(block.id, { ...block, noteId, updatedAt: now })
      }
    })
    tx()
  }
}
```

### 5.4 ConnectionService（双向去重）

```js
// electron/backend/service/connectionService.cjs
const connectionDao = require('../dao/connectionDao')
const { v4: uuidv4 } = require('uuid')

module.exports = {
  list(noteId) { return connectionDao.listByNote(noteId) },

  /** 新建连线，双向去重：(from,to) 与 (to,from) 视为同一连线 */
  create(noteId, conn) {
    const existing = connectionDao.getByFromTo(noteId, conn.from, conn.to)
                  || connectionDao.getByFromTo(noteId, conn.to, conn.from)
    if (existing) return existing

    return connectionDao.insert({
      ...conn,
      id: conn.id || uuidv4(),
      noteId,
      createdAt: Date.now()
    })
  },

  update(noteId, connId, conn) {
    return connectionDao.update(connId, { ...conn, noteId })
  },

  delete(noteId, connId) {
    connectionDao.delete(connId)
  }
}
```

### 5.5 PlanService / TagService / ImageService

逻辑与 Java 版一一对应，详见 [§14 字段对照表](#14-前后端字段对照表)。要点：

- **PlanService.toggleComplete**：`UPDATE plans SET completed = 1 - completed, updatedAt = ? WHERE id = ?`
- **TagService.delete**：删除标签后，遍历 notes/folders/plans，从 tags JSON 数组中移除该 tagId
- **TagService.list**：`ORDER BY COALESCE(sort, createdAt)`
- **ImageService.upload**：磁盘文件 + images 表元数据，文件名格式 `img_{ts}_{rand6}.{ext}` 或 `media_{ts}_{rand6}.{ext}`

---

## 6. IPC 通道与 HTTP 路由

### 6.1 通信方式选择策略

`electron/backend/config.cjs`：

```js
const config = {
  // 启动模式：'ipc' | 'http' | 'both'
  // - 'ipc'：仅 IPC，性能最佳（生产环境默认）
  // - 'http'：仅 HTTP，方便 DevTools 抓包（开发调试）
  // - 'both'：两者都启用（开发期对比）
  mode: process.env.RGOOSE_BACKEND_MODE || (process.env.VITE_DEV_SERVER_URL ? 'both' : 'ipc'),

  // HTTP 模式端口（仅 mode 为 http/both 时使用）
  httpPort: 18080,

  // 数据目录（由 main.cjs 在初始化时写入）
  dataDir: null
}

module.exports = config
```

### 6.2 IPC 通道命名规范

**统一格式**：`backend:{resource}:{action}`

| 通道名 | 入参 | 返回 |
|---|---|---|
| `backend:notes:list` | `{ folderId?, keyword?, tagId? }` | `Note[]` |
| `backend:notes:get` | `id` | `NoteDetail` |
| `backend:notes:create` | `Note` | `Note` |
| `backend:notes:update` | `{ id, note }` | `Note` |
| `backend:notes:delete` | `id` | `void` |
| `backend:notes:duplicate` | `id` | `Note` |
| `backend:notes:listAll` | — | `Note[]` |
| `backend:blocks:list` | `noteId` | `Block[]` |
| `backend:blocks:create` | `{ noteId, block }` | `Block` |
| `backend:blocks:update` | `{ noteId, blockId, block }` | `Block` |
| `backend:blocks:delete` | `{ noteId, blockId }` | `void` |
| `backend:blocks:batch` | `{ noteId, blocks }` | `void` |
| `backend:connections:list` | `noteId` | `Connection[]` |
| `backend:connections:create` | `{ noteId, conn }` | `Connection` |
| `backend:connections:update` | `{ noteId, connId, conn }` | `Connection` |
| `backend:connections:delete` | `{ noteId, connId }` | `void` |
| `backend:folders:list` | `parentId?` | `Folder[]` |
| `backend:folders:get` | `id` | `Folder` |
| `backend:folders:create` | `Folder` | `Folder` |
| `backend:folders:update` | `{ id, folder }` | `Folder` |
| `backend:folders:delete` | `id` | `number` |
| `backend:folders:listAll` | — | `Folder[]` |
| `backend:plans:list` | `{ completed?, dueBefore?, dueAfter? }` | `Plan[]` |
| `backend:plans:get` | `id` | `Plan` |
| `backend:plans:create` | `Plan` | `Plan` |
| `backend:plans:update` | `{ id, plan }` | `Plan` |
| `backend:plans:delete` | `id` | `void` |
| `backend:plans:toggleComplete` | `id` | `void` |
| `backend:plans:listAll` | — | `Plan[]` |
| `backend:tags:list` | — | `Tag[]` |
| `backend:tags:get` | `id` | `Tag` |
| `backend:tags:create` | `Tag` | `Tag` |
| `backend:tags:update` | `{ id, tag }` | `Tag` |
| `backend:tags:delete` | `id` | `void` |
| `backend:images:upload` | `{ base64, fileName }` | `string (ref)` |
| `backend:images:download` | `ref` | `Buffer` |
| `backend:images:delete` | `ref` | `void` |
| `backend:images:listRefs` | — | `string[]` |
| `backend:sync:pull` | `since?` | `SyncResponse` |
| `backend:sync:exportAll` | — | `SyncResponse` |
| `backend:sync:importAll` | `ImportData` | `void` |
| `backend:sync:clearAll` | — | `void` |

### 6.3 IPC 路由注册

`electron/backend/router/ipcRoutes.cjs`：

```js
const { ipcMain } = require('electron')
const noteService = require('../service/noteService')
const blockService = require('../service/blockService')
// ... 其他 service
const syncService = require('../service/syncService')
const { wrap } = require('../common/response')

/**
 * 注册所有 IPC 通道
 * wrap 自动捕获异常并封装为统一响应 { code, msg, data }
 */
function register() {
  // Notes
  ipcMain.handle('backend:notes:list',  (_e, params) => wrap(() => noteService.list(params)))
  ipcMain.handle('backend:notes:get',   (_e, id) => wrap(() => noteService.get(id)))
  ipcMain.handle('backend:notes:create',(_e, note) => wrap(() => noteService.create(note)))
  ipcMain.handle('backend:notes:update',(_e, { id, note }) => wrap(() => noteService.update(id, note)))
  ipcMain.handle('backend:notes:delete',(_e, id) => wrap(() => noteService.delete(id)))
  ipcMain.handle('backend:notes:duplicate', (_e, id) => wrap(() => noteService.duplicate(id)))
  ipcMain.handle('backend:notes:listAll', () => wrap(() => noteService.listAll()))

  // Blocks / Connections / Folders / Plans / Tags / Images / Sync ... 同理
}

module.exports = { register }
```

### 6.4 HTTP 路由（可选调试模式）

`electron/backend/router/httpRoutes.cjs`：完全复用 v2.0 的 RESTful 路径，便于前端 `src/api/*.js` 零改动。

```js
const express = require('express')
const multer = require('multer')
const noteService = require('../service/noteService')
// ... 其他 service
const syncService = require('../service/syncService')
const imageService = require('../service/imageService')
const { ok, handleError } = require('../common/response')

const upload = multer({ storage: multer.memoryStorage() })

function createRouter() {
  const app = express()
  app.use(express.json({ limit: '50mb' }))

  // Notes
  app.get('/api/notes', (req, res) => res.json(ok(noteService.list(req.query))))
  app.get('/api/notes/all', (_req, res) => res.json(ok(noteService.listAll())))
  app.get('/api/notes/:id', (req, res) => res.json(ok(noteService.get(req.params.id))))
  app.post('/api/notes', (req, res) => res.json(ok(noteService.create(req.body))))
  app.put('/api/notes/:id', (req, res) => res.json(ok(noteService.update(req.params.id, req.body))))
  app.delete('/api/notes/:id', (req, res) => { noteService.delete(req.params.id); res.json(ok()) })
  app.post('/api/notes/:id/duplicate', (req, res) => res.json(ok(noteService.duplicate(req.params.id))))

  // Images（multipart 上传）
  app.post('/api/images', upload.single('file'), (req, res) => {
    res.json(ok({ ref: imageService.upload(req.file) }))
  })
  app.get('/api/images/:ref', (req, res) => {
    const { buffer, mimeType } = imageService.download(req.params.ref)
    res.set('Content-Type', mimeType)
    res.send(buffer)
  })
  app.delete('/api/images/:ref', (req, res) => {
    imageService.delete(req.params.ref)
    res.json(ok())
  })
  app.get('/api/images', (_req, res) => res.json(ok(imageService.listRefs())))

  // Sync
  app.get('/api/sync', (req, res) => res.json(ok(syncService.pull(req.query.since || 0))))
  app.get('/api/data/export', (_req, res) => res.json(ok(syncService.pull(0))))
  app.post('/api/data/import', (req, res) => { syncService.importAll(req.body); res.json(ok()) })
  app.delete('/api/data/all', (_req, res) => { syncService.clearAll(); res.json(ok()) })

  // 其他资源（blocks/connections/folders/plans/tags）路径同 v2.0
  // ...

  app.use((err, _req, res, _next) => handleError(err, res))
  return app
}

module.exports = { createRouter }
```

### 6.5 后端入口

`electron/backend/index.cjs`：

```js
const { getDb, closeDb } = require('./db/connection')
const { runMigrations } = require('./db/migrate')
const { register: registerIpc } = require('./router/ipcRoutes')
const { createRouter: createHttpRouter } = require('./router/httpRoutes')
const config = require('./config')
const log = require('./common/utils').log

let httpServer = null

/**
 * 启动后端
 * @param {string} dataDir - 数据目录（来自 main.cjs 的 getDataDir()）
 */
function start(dataDir) {
  config.dataDir = dataDir

  // 1. 初始化数据库
  const db = getDb(dataDir)
  runMigrations(db)
  log('backend', `SQLite ready at ${dataDir}/rgoose.db`)

  // 2. 注册 IPC 通道（默认）
  registerIpc()
  log('backend', 'IPC routes registered')

  // 3. 启动 HTTP 服务（可选，开发调试用）
  if (config.mode === 'http' || config.mode === 'both') {
    const app = createHttpRouter()
    httpServer = app.listen(config.httpPort, () => {
      log('backend', `HTTP server listening on http://localhost:${config.httpPort}`)
    })
  }
}

function stop() {
  if (httpServer) {
    httpServer.close()
    httpServer = null
  }
  closeDb()
}

module.exports = { start, stop }
```

---

## 7. 媒体存储子系统

### 7.1 存储策略

- **文件本体**：存磁盘 `${dataDir}/images/${ref}`，扩展名白名单：`png/jpg/jpeg/gif/webp/bmp/mp3/wav/mp4/webm`
- **元数据**：`images` 表，主键即前端引用 `ref`（如 `img_1735689600000_483729.png`）
- **目录结构**：

```
${dataDir}/
├── rgoose.db          # SQLite 数据库文件
└── images/            # 媒体文件目录
    ├── img_1735689600000_483729.png
    ├── img_1735689700000_192847.jpg
    └── media_1735689800000_582934.mp3
```

### 7.2 上传流程

前端上传数据时：
1. 渲染进程将 File 转 base64（或直接走 IPC 传 Buffer）
2. 通过 `backend:images:upload` IPC 通道发送
3. 主进程生成 ref，写盘，写元数据表
4. 返回 ref 字符串

### 7.3 下载流程

- **IPC 模式**：`backend:images:download` 返回 Buffer，渲染进程转 Blob URL
- **HTTP 模式**：直接 `<img src="/api/images/{ref}">`，浏览器自动请求

### 7.4 ref 生成规则

```js
function generateRef(mimeType, originalName) {
  const ext = extractExtension(originalName, mimeType)
  if (!ALLOWED_EXTS.has(ext)) throw badRequest('不支持的文件类型: ' + ext)
  const ts = Date.now()
  const rand = String(Math.floor(Math.random() * 1000000)).padStart(6, '0')
  const prefix = IMAGE_EXTS.has(ext) ? 'img_' : 'media_'
  return `${prefix}${ts}_${rand}.${ext}`
}
```

### 7.5 孤儿清理

提供 `backend:images:listRefs` 接口，前端可定期扫描所有 block.imageUrl / block.mediaUrl / block.images，对比 refs 列表，删除未引用文件。

---

## 8. 数据同步与合并

### 8.1 增量同步：pull(since)

```js
// electron/backend/service/syncService.cjs
const folderDao = require('../dao/folderDao')
const noteDao = require('../dao/noteDao')
const blockDao = require('../dao/blockDao')
const connectionDao = require('../dao/connectionDao')
const planDao = require('../dao/planDao')
const tagDao = require('../dao/tagDao')

module.exports = {
  /** 增量/全量拉取 */
  pull(since = 0) {
    const incremental = since > 0
    const folders = incremental ? folderDao.listSince(since) : folderDao.listAll()
    const notes   = incremental ? noteDao.listSince(since)   : noteDao.listAll()
    const plans   = incremental ? planDao.listSince(since)   : planDao.listAll()
    const tags    = incremental ? tagDao.listSince(since)    : tagDao.listAll()

    // blocks / connections 是子资源，无独立 since；增量时按 noteId 反查
    let blocks, connections
    if (incremental) {
      const noteIds = notes.map(n => n.id)
      if (noteIds.length === 0) {
        blocks = []
        connections = []
      } else {
        blocks = blockDao.listByNoteIds(noteIds)
        connections = connectionDao.listByNoteIds(noteIds)
      }
    } else {
      blocks = blockDao.listAll()
      connections = connectionDao.listAll()
    }

    return { serverTime: Date.now(), folders, notes, plans, tags, blocks, connections }
  }
}
```

### 8.2 LWW 合并：importAll

```js
const { getDb } = require('../db/connection')

module.exports = {
  /** 数据导入，按 updatedAt LWW 合并 */
  importAll(data) {
    const db = getDb()
    const tx = db.transaction(() => {
      mergeAll(folderDao, data.folders)
      mergeAll(noteDao, data.notes)
      mergeAll(planDao, data.plans)
      mergeAll(tagDao, data.tags)
      // blocks/connections 不参与导入（属于笔记子资源，导入笔记时一并处理）
    })
    tx()
  }
}

/** 通用 LWW 合并：不存在则 insert，存在则 updatedAt 比较 */
function mergeAll(dao, list) {
  if (!list) return
  for (const incoming of list) {
    const existing = dao.getById(incoming.id)
    if (!existing) {
      dao.insert(incoming)
    } else if (incoming.updatedAt >= existing.updatedAt) {
      dao.update(incoming.id, incoming)
    }
  }
}
```

### 8.3 清空：clearAll

```js
const { getDb } = require('../db/connection')

module.exports = {
  clearAll() {
    const db = getDb()
    const tx = db.transaction(() => {
      db.prepare('DELETE FROM connections').run()
      db.prepare('DELETE FROM blocks').run()
      db.prepare('DELETE FROM notes').run()
      db.prepare('DELETE FROM plans').run()
      db.prepare('DELETE FROM tags').run()
      db.prepare('DELETE FROM folders').run()
    })
    tx()
  }
}
```

---

## 9. 导入导出与备份

### 9.1 数据导出

`syncService.pull(0)` 即为全量导出，返回结构同 `SyncResponse`。

### 9.2 数据导入

`syncService.importAll(data)`，按 [§8.2](#82-lww-合并importall) LWW 合并。

### 9.3 本地备份（沿用 v1.x）

保留 `electron/main.cjs` 中已有的备份机制：
- `create-backup`：将 `rgoose.db` 与 `images/` 目录打包为 zip
- `list-backups` / `delete-backup`：备份管理
- `open-backups-folder`：在资源管理器中打开备份目录
- 最多保留 5 份，超出删除最早的

备份内容需调整：
- 旧版备份：`data.json` + `images/`
- **新版备份**：`rgoose.db` + `images/`（替换 data.json 为 SQLite 文件）

```js
// electron/main.cjs - create-backup 修改片段
const srcData = path.join(getDataDir(), 'rgoose.db')   // 替换 data.json
if (fs.existsSync(srcData)) {
  fs.copyFileSync(srcData, path.join(stagingDir, 'rgoose.db'))
}
```

### 9.4 数据迁移（自定义存储位置）

`change-data-dir` 与 `reset-data-dir` 流程：
1. 复制 `rgoose.db` 与 `images/` 到新目录
2. 更新配置 `customDataDir`
3. 重启后端（关闭旧 DB 连接，打开新目录 DB）

---

## 10. 异常处理与统一响应

### 10.1 业务异常

`electron/backend/common/errors.cjs`：

```js
class BizError extends Error {
  constructor(code, msg) {
    super(msg)
    this.code = code
  }
}

const notFound    = (msg) => new BizError(40400, msg)
const badRequest  = (msg) => new BizError(40000, msg)
const conflict    = (msg) => new BizError(40900, msg)

module.exports = { BizError, notFound, badRequest, conflict }
```

### 10.2 统一响应封装

`electron/backend/common/response.cjs`：

```js
const { BizError } = require('./errors')

/** 成功响应 data 字段 */
function ok(data = null) {
  return { code: 0, msg: 'success', data }
}

/**
 * IPC 包装器：捕获异常并返回统一响应
 * @param {Function} fn - 业务函数
 * @returns {Promise<{code, msg, data}>}
 */
async function wrap(fn) {
  try {
    const data = await fn()
    return ok(data)
  } catch (err) {
    if (err instanceof BizError) {
      return { code: err.code, msg: err.message, data: null }
    }
    console.error('[backend] unhandled error:', err)
    return { code: 50000, msg: '服务器内部错误', data: null }
  }
}

/** HTTP 错误处理 */
function handleError(err, res) {
  if (err instanceof BizError) {
    return res.status(200).json({ code: err.code, msg: err.message, data: null })
  }
  console.error('[backend] unhandled error:', err)
  res.status(500).json({ code: 50000, msg: '服务器内部错误', data: null })
}

module.exports = { ok, wrap, handleError }
```

---

## 11. 启动流程与生命周期

### 11.1 启动时序

```
1. Electron app.whenReady()
   └─ createWindow()                  # 创建窗口（沿用 v1.x）
   └─ require('./backend').start(dataDir)
      ├─ getDb(dataDir)               # 打开 SQLite（不存在则创建）
      ├─ runMigrations(db)            # 建表 + 种子数据
      ├─ registerIpc()                # 注册 IPC 通道
      └─ (可选) httpServer.listen()   # HTTP 调试模式
2. BrowserWindow.loadURL(VITE_DEV_SERVER_URL | dist/index.html)
3. 渲染进程 main.js → 调用 syncApi.pull() 初始化 store
```

### 11.2 main.cjs 改造

```js
// electron/main.cjs - 在 createWindow 前启动后端
const backend = require('./backend')

app.whenReady().then(async () => {
  // ★ 启动后端（关键）
  await backend.start(getDataDir())

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  backend.stop()                       // ★ 关闭数据库连接
  if (process.platform !== 'darwin') app.quit()
})
```

### 11.3 自动迁移

`electron/backend/db/migrate.cjs`：

```js
const fs = require('fs')
const path = require('path')

function runMigrations(db) {
  // 1. 执行建表脚本
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8')
  db.exec(schema)

  // 2. 执行种子数据
  const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf-8')
  db.exec(seed)

  // 3. 版本号记录（未来升级时按版本增量迁移）
  const ver = db.prepare('PRAGMA user_version').get()
  const CURRENT_VER = 1
  if (ver.user_version === 0) {
    db.prepare(`PRAGMA user_version = ${CURRENT_VER}`).run()
  }
}

module.exports = { runMigrations }
```

### 11.4 关闭流程

`backend.stop()` 顺序：
1. 关闭 HTTP Server（如有）
2. 调用 `db.close()` 释放文件句柄
3. SQLite WAL 模式下，关闭时会自动 checkpoint 合并 WAL 文件

---

## 12. 前端适配清单

### 12.1 修改文件清单

| 文件 | 改动内容 |
|---|---|
| `src/api/client.js` | ★ 核心改造：根据 `window.electronAPI` 自动切换 IPC / HTTP |
| `src/api/*.js` | （IPC 模式无需改）保留 HTTP 路径，由 client.js 路由 |
| `src/stores/note.js` | 无需改 |
| `src/stores/plan.js` | 无需改 |
| `src/stores/tag.js` | 无需改 |
| `src/utils/imageStore.js` | 无需改（仍调用 `imagesApi.uploadFromDataUrl`） |
| `src/utils/storage.js` | 标记 `@deprecated`（已废弃，仅保留兼容） |
| `src/views/SettingsView.vue` | 「存储占用」显示 `rgoose.db` 文件大小而非 `data.json` |
| `package.json` | 新增 better-sqlite3、express、fs-extra 依赖 |
| `vite.config.js` | （IPC 模式无需改）HTTP 模式下 proxy target 改为 `localhost:18080` |
| `electron/main.cjs` | ★ 启动后端、关闭时清理 |
| `electron/preload.cjs` | ★ 暴露 `backend` 命名空间 |

### 12.2 client.js 改造方案

```js
// src/api/client.js
const isElectron = typeof window !== 'undefined' && window.electronAPI?.backend
const BASE_URL = '/api'

/**
 * 统一请求入口
 * - Electron 生产环境：走 IPC 通道
 * - 浏览器/开发调试：走 HTTP
 */
export async function request(path, options = {}) {
  if (isElectron) {
    return ipcRequest(path, options)
  }
  return httpRequest(path, options)
}

/** IPC 路由：将 RESTful 路径转换为 IPC 通道名 */
async function ipcRequest(path, options = {}) {
  // path 示例：/notes/abc/blocks  + method=GET
  // 映射到 backend:blocks:list { noteId: 'abc' }
  const route = matchRoute(path, options.method, options.body)
  const result = await window.electronAPI.backend(route.channel, route.params)

  if (result.code !== 0) {
    throw new Error(result.msg)
  }
  return result.data
}

/** HTTP 回退（开发调试用） */
async function httpRequest(path, options = {}) {
  // ... 沿用 v2.0 实现
}

export const http = {
  get(path, params) { return request(path, { method: 'GET', params }) },
  post(path, body)  { return request(path, { method: 'POST', body }) },
  put(path, body)   { return request(path, { method: 'PUT', body }) },
  patch(path, body) { return request(path, { method: 'PATCH', body }) },
  del(path)         { return request(path, { method: 'DELETE' }) }
}
```

### 12.3 preload.cjs 改造

```js
// electron/preload.cjs
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electronAPI', {
  // ... 沿用 v1.x 全部 window/filesystem API

  // ★ 新增：统一 backend 入口
  backend: (channel, params) => ipcRenderer.invoke(channel, params)
})
```

### 12.4 SettingsView.vue 调整

「存储占用」展示项：

```js
// 旧：dataFileSize = fs.statSync('data.json').size
// 新：dataFileSize = fs.statSync('rgoose.db').size
```

存储信息接口 `get-storage-info` 返回：

```js
{
  type: 'electron',
  dataDir: '...',
  dataFile: 'rgoose.db',         // 替换 data.json
  dbFile: 'rgoose.db',            // 新增
  imagesDir: '...',
  isCustom: false,
  defaultDir: '...'
}
```

---

## 13. 打包与分发

### 13.1 Native 模块编译

`better-sqlite3` 是 native 模块，必须针对 Electron 的 Node ABI 编译：

```bash
# 安装时自动 rebuild
npm install

# 手动 rebuild
npx electron-rebuild -f -w better-sqlite3
```

### 13.2 electron-builder 配置

`package.json` 的 `build` 字段补充：

```json
{
  "build": {
    "appId": "com.rgoose.note",
    "productName": "R-Goose Note",
    "compression": "maximum",
    "directories": { "output": "release" },
    "files": [
      "dist/**/*",
      "electron/**/*.cjs",
      "electron/backend/**/*.sql",
      "electron/lib/better-sqlite3/**/*",
      "build/icon.ico",
      "build/favicon.svg",
      "!**/node_modules/**",
      "!test/**"
    ],
    "extraResources": [
      {
        "from": "electron/lib/better-sqlite3",
        "to": "better-sqlite3"
      }
    ],
    "asarUnpack": [
      "**/better-sqlite3/**"
    ],
    "win": { "target": "nsis", "icon": "build/icon.ico" },
    "mac": { "target": "dmg", "icon": "build/icon.ico" },
    "linux": { "target": "AppImage", "icon": "build/icon.ico" },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    },
    "electronDownload": { "mirror": "https://npmmirror.com/mirrors/electron/" }
  }
}
```

### 13.3 启动后行为

- 用户双击安装包 → 安装到 `C:\Program Files\R-Goose Note\`
- 启动 exe → Electron 主进程启动 → 自动打开 `${userData}/rgoose-data/rgoose.db`（首次启动自动建表 + 种子）
- 数据目录默认在 `%APPDATA%/R-Goose Note/rgoose-data/`，用户可在设置页自定义位置
- 卸载应用不会删除 `%APPDATA%` 下的数据，需用户手动清理或通过设置页「清除缓存」

### 13.4 体积估算

| 组成 | 大小 |
|---|---|
| Electron 运行时 | ~80 MB |
| better-sqlite3 native | ~3 MB |
| 应用代码（dist + electron） | ~5 MB |
| Vue 依赖打包 | ~500 KB |
| **合计 NSIS 安装包** | **~50-60 MB**（压缩后） |

对比 v2.0 需用户额外安装 JRE (~200MB) + MySQL (~400MB)，体积优势明显。

---

## 14. 前后端字段对照表

### 14.1 Folder

| 前端字段 | 数据库列 | 类型 | 说明 |
|---|---|---|---|
| id | id | TEXT (UUID) | 主键 |
| name | name | TEXT | 文件夹名 |
| parentId | parentId | TEXT | 父文件夹 id；null=根级 |
| tags | tags | TEXT (JSON) | tagId 数组，如 `["tag-uuid-1"]` |
| isSystem | isSystem | INTEGER (0/1) | 是否系统文件夹 |
| createdAt | createdAt | INTEGER | 毫秒时间戳 |
| updatedAt | updatedAt | INTEGER | 毫秒时间戳 |
| deleted | deleted | INTEGER (0/1) | 软删除标记 |

### 14.2 Note

| 前端字段 | 数据库列 | 类型 | 说明 |
|---|---|---|---|
| id | id | TEXT | 主键 |
| title | title | TEXT | 笔记标题 |
| folderId | folderId | TEXT | 所属文件夹；null=根目录 |
| tags | tags | TEXT (JSON) | tagId 数组 |
| canvasConfig | canvasConfig | TEXT (JSON) | `{ zoom, offsetX, offsetY }` |
| blocks | （关联表 blocks） | — | 详情接口返回 |
| connections | （关联表 connections） | — | 详情接口返回 |
| createdAt | createdAt | INTEGER | 毫秒时间戳 |
| updatedAt | updatedAt | INTEGER | 毫秒时间戳 |
| deleted | deleted | INTEGER (0/1) | 软删除 |

### 14.3 Block

| 前端字段 | 数据库列 | 类型 | 说明 |
|---|---|---|---|
| id | id | TEXT | 主键 |
| noteId | noteId | TEXT | 所属笔记 |
| type | type | TEXT | text/todo/image/audio/video/gallery |
| content | content | TEXT | text/todo 的 HTML |
| x, y | x, y | REAL | 画布坐标 |
| width, minHeight | width, minHeight | INTEGER | 尺寸 |
| color | color | TEXT | default/green/blue/yellow/pink/gray |
| title | title | TEXT | todo 专有 |
| status | status | TEXT | todo/doing/done/paused |
| priority | priority | TEXT | low/normal/high |
| dueDate | dueDate | INTEGER | 毫秒时间戳 |
| imageUrl | imageUrl | TEXT | image 专有 |
| mediaUrl | mediaUrl | TEXT | audio/video 专有 |
| mediaName | mediaName | TEXT | 原始文件名 |
| images | images | TEXT (JSON) | gallery 图片 ref 数组 |
| galleryLayout | galleryLayout | TEXT | carousel/grid |
| createdAt | createdAt | INTEGER | 毫秒时间戳 |
| updatedAt | updatedAt | INTEGER | 毫秒时间戳 |

### 14.4 Connection

| 前端字段 | 数据库列 | 类型 | 说明 |
|---|---|---|---|
| id | id | TEXT | 主键 |
| noteId | noteId | TEXT | 所属笔记 |
| from | "from" | TEXT | 起始 blockId（保留字，双引号） |
| to | "to" | TEXT | 目标 blockId（保留字，双引号） |
| shape | shape | TEXT | straight/bezier |
| dash | dash | TEXT | solid/dashed/dotted/dot-dash |
| arrow | arrow | TEXT | standard/thin/open/circle/square/diamond |
| dir | dir | TEXT | forward/backward/none |
| color | color | TEXT | 默认 `#6bbd8f` |
| width | width | TEXT | "1"/"2"/"3"/"4" |
| label | label | TEXT | 连线标签 |
| createdAt | createdAt | INTEGER | 毫秒时间戳 |

### 14.5 Plan

| 前端字段 | 数据库列 | 类型 | 说明 |
|---|---|---|---|
| id | id | TEXT | 主键 |
| title | title | TEXT | 计划标题 |
| description | description | TEXT | 描述 |
| dueDate | dueDate | INTEGER | 截止时间（毫秒） |
| reminder | reminder | TEXT (JSON) | 提醒配置 |
| completed | completed | INTEGER (0/1) | 是否完成 |
| priority | priority | TEXT | low/normal/high |
| tags | tags | TEXT (JSON) | tagId 数组 |
| noteId | noteId | TEXT | 关联笔记 |
| blockId | blockId | TEXT | 关联块 |
| createdAt | createdAt | INTEGER | 毫秒时间戳 |
| updatedAt | updatedAt | INTEGER | 毫秒时间戳 |

### 14.6 Tag

| 前端字段 | 数据库列 | 类型 | 说明 |
|---|---|---|---|
| id | id | TEXT | 主键 |
| name | name | TEXT (UNIQUE) | 标签名 |
| color | color | TEXT | 默认 `#6bbd8f` |
| sort | sort | INTEGER | 排序权重 |
| createdAt | createdAt | INTEGER | 毫秒时间戳 |
| updatedAt | updatedAt | INTEGER | 毫秒时间戳 |

### 14.7 Image（媒体元数据）

| 字段 | 数据库列 | 类型 | 说明 |
|---|---|---|---|
| id | id | TEXT | 主键，即前端引用 ref |
| fileName | fileName | TEXT | 磁盘文件名 |
| mimeType | mimeType | TEXT | 如 `image/png` |
| sizeBytes | sizeBytes | INTEGER | 文件大小 |
| storagePath | storagePath | TEXT | 相对存储路径，如 `images/img_xxx.png` |
| createdAt | createdAt | INTEGER | 毫秒时间戳 |

---

## 附录 A：迁移工作排期

| 阶段 | 任务 | 涉及文件 |
|---|---|---|
| **阶段 1**：基础设施 | 建 `electron/backend/` 目录、配置依赖、写 schema.sql 与 migrate.cjs | 新增文件 |
| **阶段 2**：DAO 层 | 7 个 dao 模块 + connection.cjs | 新增文件 |
| **阶段 3**：Service 层 | 8 个 service 模块（直接对照 Java 版翻译） | 新增文件 |
| **阶段 4**：路由层 | ipcRoutes.cjs（默认）+ httpRoutes.cjs（可选） | 新增文件 |
| **阶段 5**：主进程改造 | main.cjs 启动后端、preload.cjs 暴露 backend 入口 | 修改 |
| **阶段 6**：前端适配 | client.js 切换 IPC/HTTP，SettingsView 调整文件名显示 | 修改 |
| **阶段 7**：打包验证 | electron-rebuild、electron-builder 配置、首次打包测试 | 修改 package.json |
| **阶段 8**：回归测试 | 全功能验证：CRUD、拖拽、连线、备份、导入导出 | — |

## 附录 B：开发调试技巧

### B.1 启用 HTTP 调试模式

```bash
# 设置环境变量启用 both 模式（IPC + HTTP）
set RGOOSE_BACKEND_MODE=both
npm run electron:dev
```

前端 DevTools Network 即可看到所有 `/api/*` 请求，与 v2.0 调试体验一致。

### B.2 直接连接 SQLite 查看

```bash
# 使用 sqlite3 CLI
sqlite3 "%APPDATA%/R-Goose Note/rgoose-data/rgoose.db"

# 常用查询
.tables
.schema notes
SELECT id, title, updatedAt FROM notes ORDER BY updatedAt DESC LIMIT 10;
```

### B.3 数据库重置

开发期如需重置数据：

```bash
# 关闭应用后删除 db 文件，下次启动自动重建
del "%APPDATA%/R-Goose Note/rgoose-data/rgoose.db"
del "%APPDATA%/R-Goose Note/rgoose-data/rgoose.db-wal"
del "%APPDATA%/R-Goose Note/rgoose-data/rgoose.db-shm"
```

### B.4 性能注意事项

- **better-sqlite3 是同步 API**，不要在长事务中插入大量数据导致主进程阻塞
- 拖拽场景使用 `blocks:batch` 单事务批量更新，避免高频单条 update
- 图片上传走 IPC 时传 Buffer，避免 base64 序列化开销（性能提升约 30%）
- 定期执行 `PRAGMA optimize` 优化查询计划（应用退出时自动执行）

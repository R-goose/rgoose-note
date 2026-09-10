-- ============================================================
-- R-Goose Note SQLite Schema
-- 列名全部 camelCase，与前端字段名 1:1 对齐
-- ============================================================

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;

-- ---------- 文件夹 ----------
CREATE TABLE IF NOT EXISTS folders (
  id           TEXT    PRIMARY KEY,
  name         TEXT    NOT NULL,
  parentId     TEXT,
  tags         TEXT,
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
  canvasConfig  TEXT,
  pinned        INTEGER NOT NULL DEFAULT 0,
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
  type          TEXT    NOT NULL,
  content       TEXT,
  x             REAL    NOT NULL DEFAULT 0,
  y             REAL    NOT NULL DEFAULT 0,
  width         INTEGER NOT NULL DEFAULT 240,
  minHeight     INTEGER NOT NULL DEFAULT 60,
  color         TEXT,
  -- todo / milestone 共用
  title         TEXT,
  status        TEXT,
  priority      TEXT,
  dueDate       INTEGER,
  -- image / audio / video / gallery
  imageUrl      TEXT,
  mediaUrl      TEXT,
  mediaName     TEXT,
  images        TEXT,
  galleryLayout TEXT,
  -- code（兼容旧代码块）
  code          TEXT,
  codeLang      TEXT,
  -- callout
  calloutType   TEXT,
  -- formula
  formula       TEXT,
  -- table
  tableData     TEXT,
  tableAnalysis INTEGER,
  -- progress
  label         TEXT,
  value         INTEGER,
  mode          TEXT,
  -- milestone
  "date"        INTEGER,
  done          INTEGER,
  "desc"        TEXT,
  -- note-link
  linkedNoteId    TEXT,
  linkedBlockId   TEXT,
  linkedTextRange TEXT,
  createdAt     INTEGER NOT NULL,
  updatedAt     INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_blocks_note      ON blocks(noteId);
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
  updatedAt     INTEGER NOT NULL DEFAULT 0,
  UNIQUE (noteId, "from", "to")
);
CREATE INDEX IF NOT EXISTS idx_connections_note ON connections(noteId);

-- ---------- 标签 ----------
CREATE TABLE IF NOT EXISTS tags (
  id         TEXT    PRIMARY KEY,
  name       TEXT    NOT NULL UNIQUE,
  color      TEXT    NOT NULL DEFAULT '#6bbd8f',
  sort       INTEGER,
  createdAt  INTEGER NOT NULL,
  updatedAt  INTEGER NOT NULL
);

-- ---------- 自定义笔记模板 ----------
CREATE TABLE IF NOT EXISTS templates (
  id         TEXT    PRIMARY KEY,
  name       TEXT    NOT NULL UNIQUE,
  desc       TEXT    NOT NULL DEFAULT '',
  icon       TEXT,
  blocks     TEXT,
  connections TEXT,
  isBuiltin  INTEGER NOT NULL DEFAULT 0,
  sort       INTEGER,
  createdAt  INTEGER NOT NULL,
  updatedAt  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_templates_updated ON templates(updatedAt);

-- ---------- 媒体文件元数据 ----------
CREATE TABLE IF NOT EXISTS images (
  id           TEXT    PRIMARY KEY,
  fileName     TEXT    NOT NULL,
  displayName  TEXT,
  mimeType     TEXT    NOT NULL,
  sizeBytes    INTEGER NOT NULL DEFAULT 0,
  storagePath  TEXT    NOT NULL,
  tags         TEXT    DEFAULT '[]',
  contentHash  TEXT,
  createdAt    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_images_created ON images(createdAt);
-- 注意：idx_images_hash 不能放在 schema.sql 里。
-- 旧库（v3）的 images 表已存在但没有 contentHash 列，
-- 若在建表脚本里对 contentHash 建索引，会先于补列迁移抛出
-- "no such column: contentHash"，导致整个迁移失败、后端无法启动。
-- 该索引统一在 migrate.js 的 ensureImageColumns() 中补列后创建。

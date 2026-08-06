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

-- ---------- 计划/待办 ----------
CREATE TABLE IF NOT EXISTS plans (
  id            TEXT    PRIMARY KEY,
  title         TEXT    NOT NULL,
  description   TEXT,
  dueDate       INTEGER,
  reminder      TEXT,
  completed     INTEGER NOT NULL DEFAULT 0,
  priority      TEXT    NOT NULL DEFAULT 'normal',
  tags          TEXT,
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
  id           TEXT    PRIMARY KEY,
  fileName     TEXT    NOT NULL,
  displayName  TEXT,
  mimeType     TEXT    NOT NULL,
  sizeBytes    INTEGER NOT NULL DEFAULT 0,
  storagePath  TEXT    NOT NULL,
  createdAt    INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_images_created ON images(createdAt);

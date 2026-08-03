-- ============================================================
-- R-Goose Note 数据库初始化脚本
-- MySQL 8.0+
-- 
-- 使用方法：
--   mysql -u root -p < schema.sql
--   或 MySQL Workbench / Navicat 中直接执行
--
-- 列名全部 camelCase，与前端字段名 1:1 对齐
-- ============================================================

-- ---------- 1. 创建数据库 ----------
CREATE DATABASE IF NOT EXISTS rgoose_note
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ---------- 2. 用户授权 ----------
-- 使用 root 用户连接（密码 123456），无需额外创建用户
GRANT ALL PRIVILEGES ON rgoose_note.* TO 'root'@'%';
FLUSH PRIVILEGES;

USE rgoose_note;

-- ---------- 3. 建表 ----------

-- 文件夹
-- 对齐前端 Folder: { id, name, parentId, tags[], isSystem, createdAt, updatedAt, deleted }
CREATE TABLE IF NOT EXISTS folders (
  id           CHAR(36)     NOT NULL                COMMENT 'UUID（前端生成）',
  name         VARCHAR(200) NOT NULL                COMMENT '文件夹名称',
  parentId     CHAR(36)     NULL                    COMMENT '父文件夹 ID；NULL=根级',
  tags         JSON         NULL                    COMMENT 'tagId 数组，如 ["tag-uuid-1"]',
  isSystem     TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '是否系统文件夹',
  createdAt    BIGINT       NOT NULL                COMMENT '创建时间（毫秒时间戳）',
  updatedAt    BIGINT       NOT NULL                COMMENT '更新时间（毫秒时间戳）',
  deleted      TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '软删除标记',
  PRIMARY KEY (id),
  KEY idx_parent (parentId),
  KEY idx_updated (updatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文件夹';

-- 笔记
-- 对齐前端 Note: { id, title, folderId, tags[], blocks[], connections[], canvasConfig, createdAt, updatedAt, deleted }
CREATE TABLE IF NOT EXISTS notes (
  id            CHAR(36)     NOT NULL,
  title         VARCHAR(500) NOT NULL DEFAULT '',
  folderId      CHAR(36)     NULL                    COMMENT '所属文件夹；NULL=根目录',
  tags          JSON         NULL                    COMMENT 'tagId 数组',
  canvasConfig  JSON         NULL                    COMMENT '{ zoom, offsetX, offsetY }',
  createdAt     BIGINT       NOT NULL,
  updatedAt     BIGINT       NOT NULL,
  deleted       TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_folder (folderId),
  KEY idx_updated (updatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='笔记';

-- 画布块（全字段扁平，对齐前端 Block 所有类型）
-- text / todo / image / audio / video / gallery 共用一张表
CREATE TABLE IF NOT EXISTS blocks (
  id            CHAR(36)     NOT NULL,
  noteId        CHAR(36)     NOT NULL                COMMENT '所属笔记 ID',
  type          VARCHAR(20)  NOT NULL                COMMENT 'text/todo/image/audio/video/gallery',
  content       MEDIUMTEXT   NULL                    COMMENT 'text/todo 的 HTML 内容',
  x             DOUBLE       NOT NULL DEFAULT 0      COMMENT '画布坐标 X',
  y             DOUBLE       NOT NULL DEFAULT 0      COMMENT '画布坐标 Y',
  width         INT          NOT NULL DEFAULT 240,
  minHeight     INT          NOT NULL DEFAULT 60,
  color         VARCHAR(20)  NULL                    COMMENT 'default/green/blue/yellow/pink/gray',
  -- —— todo 特有字段 ——
  title         VARCHAR(500) NULL                    COMMENT 'todo 标题',
  status        VARCHAR(20)  NULL                    COMMENT 'todo/doing/done/paused',
  priority      VARCHAR(20)  NULL                    COMMENT 'low/normal/high',
  dueDate       BIGINT       NULL                    COMMENT '截止时间（毫秒时间戳）',
  -- —— image 特有字段 ——
  imageUrl      VARCHAR(200) NULL                    COMMENT '图片引用 img_xxx',
  -- —— audio/video 特有字段 ——
  mediaUrl      VARCHAR(200) NULL                    COMMENT '媒体引用 media_xxx',
  mediaName     VARCHAR(200) NULL                    COMMENT '原始文件名',
  -- —— gallery 特有字段 ——
  images        JSON         NULL                    COMMENT '图片引用数组 ["img_xxx", ...]',
  galleryLayout VARCHAR(20)  NULL                    COMMENT 'carousel/grid',
  -- —— 通用 ——
  createdAt     BIGINT       NOT NULL,
  updatedAt     BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_note (noteId),
  KEY idx_note_type (noteId, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='画布块';

-- 连线
-- 注意：from / to 是 MySQL 保留字，必须用反引号
-- 对齐前端 Connection: { id, from, to, shape, dash, arrow, dir, color, width, label, createdAt }
CREATE TABLE IF NOT EXISTS connections (
  id            CHAR(36)     NOT NULL,
  noteId        CHAR(36)     NOT NULL                COMMENT '所属笔记 ID',
  `from`        CHAR(36)     NOT NULL                COMMENT '起始 blockId（保留字，反引号）',
  `to`          CHAR(36)     NOT NULL                COMMENT '目标 blockId（保留字，反引号）',
  shape         VARCHAR(20)  NOT NULL DEFAULT 'straight' COMMENT 'straight/bezier',
  dash          VARCHAR(20)  NOT NULL DEFAULT 'solid'    COMMENT 'solid/dashed/dotted/dot-dash',
  arrow         VARCHAR(20)  NOT NULL DEFAULT 'standard' COMMENT 'standard/thin/open/circle/square/diamond',
  dir           VARCHAR(20)  NOT NULL DEFAULT 'forward'  COMMENT 'forward/backward/none',
  color         VARCHAR(20)  NOT NULL DEFAULT '#6bbd8f',
  width         VARCHAR(10)  NOT NULL DEFAULT '2'    COMMENT '连线宽度：1/2/3/4',
  label         VARCHAR(200) NULL                    COMMENT '连线标签文本',
  createdAt     BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_note (noteId),
  UNIQUE KEY uk_conn_pair (noteId, `from`, `to`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='块间连线';

-- 计划/待办
-- 对齐前端 Plan: { id, title, description, dueDate, reminder, completed, priority, tags[], noteId, blockId, createdAt, updatedAt }
CREATE TABLE IF NOT EXISTS plans (
  id            CHAR(36)     NOT NULL,
  title         VARCHAR(500) NOT NULL,
  description   MEDIUMTEXT   NULL,
  dueDate       BIGINT       NULL                    COMMENT '截止时间（毫秒时间戳）',
  reminder      JSON         NULL                    COMMENT '提醒配置（原始 JSON）',
  completed     TINYINT(1)   NOT NULL DEFAULT 0      COMMENT '是否完成',
  priority      VARCHAR(20)  NOT NULL DEFAULT 'normal' COMMENT 'low/normal/high',
  tags          JSON         NULL                    COMMENT 'tagId 数组',
  noteId        CHAR(36)     NULL                    COMMENT '关联笔记 ID',
  blockId       CHAR(36)     NULL                    COMMENT '关联块 ID',
  createdAt     BIGINT       NOT NULL,
  updatedAt     BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_due (dueDate, completed),
  KEY idx_note (noteId),
  KEY idx_updated (updatedAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='计划/待办';

-- 标签
-- 对齐前端 Tag: { id, name, color, sort, createdAt, updatedAt }
CREATE TABLE IF NOT EXISTS tags (
  id         CHAR(36)     NOT NULL,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(20)  NOT NULL DEFAULT '#6bbd8f',
  sort       INT          NULL                    COMMENT '排序权重',
  createdAt  BIGINT       NOT NULL,
  updatedAt  BIGINT       NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='标签';

-- 媒体文件元数据（文件本体存磁盘，不进 DB）
CREATE TABLE IF NOT EXISTS images (
  id           CHAR(36)     NOT NULL                COMMENT '前端引用 ref，如 img_xxx.png',
  fileName     VARCHAR(200) NOT NULL                COMMENT '磁盘文件名',
  mimeType     VARCHAR(100) NOT NULL,
  sizeBytes    BIGINT       NOT NULL DEFAULT 0,
  storagePath  VARCHAR(500) NOT NULL                COMMENT '相对存储路径',
  createdAt    BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='媒体文件元数据';

-- ---------- 4. 种子数据：系统根目录文件夹 ----------
-- 前端 SYSTEM_ROOT_FOLDER_ID = 'system-root'
INSERT INTO folders (id, name, parentId, tags, isSystem, createdAt, updatedAt, deleted)
VALUES ('system-root', '根目录', NULL, '[]', 1, UNIX_TIMESTAMP() * 1000, UNIX_TIMESTAMP() * 1000, 0)
ON DUPLICATE KEY UPDATE name = '根目录', isSystem = 1;

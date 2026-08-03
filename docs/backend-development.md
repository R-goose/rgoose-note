# R-Goose Note 后端开发文档（Java + MySQL）

> 版本：v2.0 ｜ 架构：前后端分离 · 纯云端 ｜ 更新日期：2026-08-03
> 技术栈：Spring Boot 3 (Java 17+) · MySQL 8.0 · MyBatis-Plus
> **命名原则：后端变量名 / 数据库列名 / Java 实体字段，全部以前端 camelCase 为准，1:1 对齐**

---

## 目录

1. [架构概览](#1-架构概览)
2. [技术栈与工程结构](#2-技术栈与工程结构)
3. [数据库设计](#3-数据库设计)
4. [RESTful API 规范](#4-restful-api-规范)
5. [资源 API 详解](#5-资源-api-详解)
6. [媒体存储子系统](#6-媒体存储子系统)
7. [数据同步与合并](#7-数据同步与合并)
8. [导入导出与备份](#8-导入导出与备份)
9. [异常处理与统一响应](#9-异常处理与统一响应)
10. [配置与部署](#10-配置与部署)
11. [前后端字段对照表](#11-前后端字段对照表)

---

## 1. 架构概览

应用由「纯本地 Electron」升级为「前后端分离 · 纯云端」架构。数据全部驻留 MySQL，前端通过 HTTP API 存取，天然支持多端同步。

```
┌──────────────────────────────────────────────────────────┐
│                    客户端（多端）                          │
│  Electron 桌面端  │  浏览器 Web  │  移动端（规划）         │
│        └──────────┴──────────────┘                       │
│                  Vue 3 + Pinia                            │
│            src/api/*  (HTTP 调用层)                       │
└────────────────────────┬─────────────────────────────────┘
                         │ HTTPS / JSON
                         ▼
┌──────────────────────────────────────────────────────────┐
│              Spring Boot 3 后端服务                        │
│  ┌────────────────────────────────────────────────────┐  │
│  │  Controller 层 (REST API)                           │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Service 层 (业务逻辑、合并、同步)                   │  │
│  ├────────────────────────────────────────────────────┤  │
│  │  Mapper / Repository 层 (MyBatis-Plus)              │  │
│  ├──────────────┬─────────────────────────────────────┤  │
│  │  MySQL 8     │  文件存储 (images/)                   │  │
│  │  业务数据     │  媒体文件（磁盘/对象存储）            │  │
│  └──────────────┴─────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

**核心变化**（对比 v1.x 本地后端）：

| 维度 | v1.x 本地后端 | v2.0 云端后端 |
|---|---|---|
| 数据存储 | localStorage / data.json / IndexedDB | MySQL |
| 媒体存储 | 本地文件 / IndexedDB | 服务端磁盘 / 对象存储 |
| 持久化调度 | noteStore 单一中枢防抖写盘 | 前端调 API，后端事务落库 |
| 多端同步 | 不支持 | 基于 updatedAt 增量同步 |
| 认证 | 无 | 无（单机/内网场景，预留扩展） |

**设计原则**：
- **以前端为主**：数据库列名、Java 实体字段名全部沿用前端 camelCase，零转换、零映射成本。
- **前后端职责清晰**：后端只管数据存取与业务规则，不含 UI 逻辑。
- **幂等可重试**：所有写操作基于业务 UUID，支持失败重试不产生重复。
- **无状态服务**：便于水平扩展（未来多实例部署）。

---

## 2. 技术栈与工程结构

### 2.1 技术选型

| 层 | 技术 | 版本 | 说明 |
|---|---|---|---|
| 语言 | Java | 17 (LTS) | Spring Boot 3 最低要求 |
| 框架 | Spring Boot | 3.2.x | Web、Validation、异常处理 |
| ORM | MyBatis-Plus | 3.5.x | 代码量少，灵活，国内生态成熟 |
| 数据库 | MySQL | 8.0+ | 支持 JSON 类型、窗口函数 |
| 连接池 | HikariCP | 内置 | Spring Boot 默认 |
| 参数校验 | Jakarta Validation | 3.0 | `@Valid`、`@NotBlank` 等 |
| 接口文档 | SpringDoc OpenAPI | 2.3.x | 替代 Swagger，生成 /swagger-ui |
| 构建 | Maven | 3.9+ | |

### 2.2 后端工程结构

```
rgoose-backend/
├── pom.xml
└── src/main/
    ├── java/com/rgoose/note/
    │   ├── RgooseApplication.java          # 启动类
    │   ├── config/
    │   │   ├── WebConfig.java              # CORS、静态资源映射
    │   │   ├── MybatisPlusConfig.java      # 分页插件等
    │   │   └── OpenApiConfig.java
    │   ├── common/
    │   │   ├── R.java                      # 统一响应体
    │   │   ├── BizException.java           # 业务异常
    │   │   └── GlobalExceptionHandler.java
    │   ├── controller/                     # REST 入口
    │   │   ├── FolderController.java
    │   │   ├── NoteController.java
    │   │   ├── BlockController.java
    │   │   ├── ConnectionController.java
    │   │   ├── PlanController.java
    │   │   ├── TagController.java
    │   │   ├── ImageController.java
    │   │   └── DataController.java         # 导入导出/同步
    │   ├── service/                        # 业务逻辑
    │   │   ├── FolderService.java
    │   │   ├── NoteService.java
    │   │   ├── BlockService.java
    │   │   ├── PlanService.java
    │   │   ├── TagService.java
    │   │   ├── ImageService.java
    │   │   └── SyncService.java            # 增量同步、合并
    │   ├── mapper/                         # MyBatis-Plus Mapper
    │   │   ├── FolderMapper.java
    │   │   ├── NoteMapper.java
    │   │   ├── BlockMapper.java
    │   │   ├── ConnectionMapper.java
    │   │   ├── PlanMapper.java
    │   │   ├── TagMapper.java
    │   │   └── ImageMapper.java
    │   ├── entity/                         # 数据库实体（字段名 1:1 对齐前端）
    │   │   ├── Folder.java
    │   │   ├── Note.java
    │   │   ├── Block.java
    │   │   ├── Connection.java
    │   │   ├── Plan.java
    │   │   ├── Tag.java
    │   │   └── Image.java
    │   └── dto/                            # 请求/响应 DTO
    │       ├── req/
    │       └── resp/
    └── resources/
        ├── application.yml
        ├── application-prod.yml
        └── db/
            └── schema.sql                  # 建表脚本
```

### 2.3 命名对齐策略（核心）

**后端所有命名以前端 camelCase 为准**，这是本次改造的核心约束：

| 层 | 命名规则 | 示例 |
|---|---|---|
| MySQL 列名 | camelCase，与前端口对接收的 JSON 字段**完全一致** | `folderId`、`createdAt`、`canvasConfig` |
| Java 实体字段 | camelCase，与前端 TypeScript interface 字段名**完全一致** | `folderId`、`createdAt` |
| MyBatis-Plus 映射 | **关闭** `mapUnderscoreToCamelCase`，列名 = 字段名 = JSON 字段 | 无需任何转换 |
| API 请求/响应 JSON | camelCase，前端 `JSON.stringify(note)` 可直接 POST | `{ "folderId": "...", "canvasConfig": {...} }` |

> 收益：前端发送的 JSON 与后端 Entity / DB 列名三者同名，**全程零字段映射代码**，杜绝命名不一致 bug。

---

## 3. 数据库设计

### 3.1 设计要点

1. **主键**：`id CHAR(36)`，存 UUID v4，由**前端生成**（沿用现有 `generateId()`）。保证前端创建对象后可直接 POST，后端无需回填 ID。
2. **列名全 camelCase**：与前端字段名 1:1 对齐（如 `folderId`、`createdAt`、`updatedAt`），**不使用** snake_case。
3. **时间戳**：`createdAt` / `updatedAt` 用 `BIGINT` 存毫秒（与前端 `Date.now()` 对齐），便于增量同步比较。
4. **软删除**：`deleted TINYINT(1)`，与前端 `deleted: true` 语义一致。
5. **tags 用 JSON 数组列**：前端 `note.tags` 是 `string[]`，后端用 `tags JSON` 存 `["tagId1","tagId2"]`，与前端结构一致，无需关联表。
6. **blocks 全字段扁平**：前端 Block 的所有可能字段（text/todo/image/audio/video/gallery 特有字段）全部展开为列，按 type 使用，不用 `extra` JSON 容器。
7. **保留字处理**：connection 的 `from` / `to` 是 MySQL 保留字，DDL 中用反引号 `` `from` `` 包裹。
8. **字符集**：统一 `utf8mb4`，支持 emoji 与多语言。

### 3.2 ER 关系图

```
folders (1) ──< notes (N)           notes (1) ──< blocks (N)
   │  parentId (自引用)               │                  │
   │  tags JSON                       │          connections
   │                                  │          (`from`/`to` 指向 block.id)
   │                                  │
   ▼                                  ▼
tags (独立)                       plans (noteId 可选)
  被多处 JSON 引用                   tags JSON
```

> tags 不再设关联表。notes / folders / plans 各自用 `tags JSON` 列存 tagId 数组，与前端数据结构完全一致。

### 3.3 建表 DDL

```sql
-- ============================================================
-- R-Goose Note 数据库建表脚本  schema.sql
-- MySQL 8.0+
-- 列名全部 camelCase，与前端字段名 1:1 对齐
-- ============================================================

CREATE DATABASE IF NOT EXISTS rgoose_note
  DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE rgoose_note;

-- ---------- 文件夹 ----------
-- 对齐前端 Folder: { id, name, parentId, tags[], isSystem, createdAt, updatedAt, deleted }
CREATE TABLE folders (
  id           CHAR(36)     NOT NULL COMMENT 'UUID (前端生成)',
  name         VARCHAR(200) NOT NULL,
  parentId     CHAR(36)     NULL     COMMENT '父文件夹；NULL=根级',
  tags         JSON         NULL     COMMENT 'tagId 数组，如 ["tag-uuid-1"]',
  isSystem     TINYINT(1)   NOT NULL DEFAULT 0,
  createdAt    BIGINT       NOT NULL COMMENT '毫秒时间戳',
  updatedAt    BIGINT       NOT NULL,
  deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_parent (parentId),
  KEY idx_updated (updatedAt)
) ENGINE=InnoDB COMMENT='文件夹';

-- ---------- 笔记 ----------
-- 对齐前端 Note: { id, title, folderId, tags[], blocks[], connections[], canvasConfig, createdAt, updatedAt, deleted }
CREATE TABLE notes (
  id            CHAR(36)     NOT NULL,
  title         VARCHAR(500) NOT NULL DEFAULT '',
  folderId      CHAR(36)     NULL     COMMENT '所属文件夹；NULL=根目录',
  tags          JSON         NULL     COMMENT 'tagId 数组',
  canvasConfig  JSON         NULL     COMMENT '{zoom,offsetX,offsetY}',
  createdAt     BIGINT       NOT NULL,
  updatedAt     BIGINT       NOT NULL,
  deleted       TINYINT(1)   NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  KEY idx_folder (folderId),
  KEY idx_updated (updatedAt)
) ENGINE=InnoDB COMMENT='笔记';

-- ---------- 画布块（全字段扁平，对齐前端 Block）----------
-- 对齐前端 Block 所有字段：text/todo/image/audio/video/gallery 共用一张表
CREATE TABLE blocks (
  id            CHAR(36)     NOT NULL,
  noteId        CHAR(36)     NOT NULL COMMENT '所属笔记',
  type          VARCHAR(20)  NOT NULL COMMENT 'text/todo/image/audio/video/gallery',
  content       MEDIUMTEXT   NULL     COMMENT 'text/todo 的 HTML',
  x             DOUBLE       NOT NULL DEFAULT 0  COMMENT '画布坐标 X',
  y             DOUBLE       NOT NULL DEFAULT 0  COMMENT '画布坐标 Y',
  width         INT          NOT NULL DEFAULT 240,
  minHeight     INT          NOT NULL DEFAULT 60,
  color         VARCHAR(20)  NULL     COMMENT 'default/green/blue/yellow/pink/gray',
  -- —— todo 特有 ——
  title         VARCHAR(500) NULL     COMMENT 'todo 标题',
  status        VARCHAR(20)  NULL     COMMENT 'todo/doing/done/paused',
  priority      VARCHAR(20)  NULL     COMMENT 'low/normal/high',
  dueDate       BIGINT       NULL     COMMENT 'todo 截止时间戳',
  -- —— image 特有 ——
  imageUrl      VARCHAR(200) NULL     COMMENT '图片引用 img_xxx',
  -- —— audio/video 特有 ——
  mediaUrl      VARCHAR(200) NULL     COMMENT '媒体引用 media_xxx',
  mediaName     VARCHAR(200) NULL     COMMENT '原始文件名',
  -- —— gallery 特有 ——
  images        JSON         NULL     COMMENT '图片引用数组 [img_xxx, ...]',
  galleryLayout VARCHAR(20)  NULL     COMMENT 'carousel/grid',
  -- —— 通用 ——
  createdAt     BIGINT       NOT NULL,
  updatedAt     BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_note (noteId),
  KEY idx_note_type (noteId, type)
) ENGINE=InnoDB COMMENT='画布块';

-- ---------- 连线 ----------
-- 对齐前端 Connection: { id, from, to, shape, dash, arrow, dir, color, width, label, createdAt }
-- 注意：from / to 是 MySQL 保留字，必须用反引号
CREATE TABLE connections (
  id            CHAR(36)     NOT NULL,
  noteId        CHAR(36)     NOT NULL,
  `from`        CHAR(36)     NOT NULL COMMENT '起始 blockId（保留字，反引号包裹）',
  `to`          CHAR(36)     NOT NULL COMMENT '目标 blockId（保留字，反引号包裹）',
  shape         VARCHAR(20)  NOT NULL DEFAULT 'straight',
  dash          VARCHAR(20)  NOT NULL DEFAULT 'solid',
  arrow         VARCHAR(20)  NOT NULL DEFAULT 'standard',
  dir           VARCHAR(20)  NOT NULL DEFAULT 'forward',
  color         VARCHAR(20)  NOT NULL DEFAULT '#6bbd8f',
  width         VARCHAR(10)  NOT NULL DEFAULT '2',
  label         VARCHAR(200) NULL,
  createdAt     BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_note (noteId),
  UNIQUE KEY uk_conn_pair (noteId, `from`, `to`)
) ENGINE=InnoDB COMMENT='块间连线';

-- ---------- 计划 ----------
-- 对齐前端 Plan: { id, title, description, dueDate, reminder, completed, priority, tags[], noteId, blockId, createdAt, updatedAt }
CREATE TABLE plans (
  id            CHAR(36)     NOT NULL,
  title         VARCHAR(500) NOT NULL,
  description   MEDIUMTEXT   NULL,
  dueDate       BIGINT       NULL     COMMENT '截止时间戳',
  reminder      JSON         NULL,
  completed     TINYINT(1)   NOT NULL DEFAULT 0,
  priority      VARCHAR(20)  NOT NULL DEFAULT 'normal',
  tags          JSON         NULL     COMMENT 'tagId 数组',
  noteId        CHAR(36)     NULL     COMMENT '关联笔记',
  blockId       CHAR(36)     NULL     COMMENT '关联块',
  createdAt     BIGINT       NOT NULL,
  updatedAt     BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_due (dueDate, completed),
  KEY idx_note (noteId),
  KEY idx_updated (updatedAt)
) ENGINE=InnoDB COMMENT='计划/待办';

-- ---------- 标签 ----------
-- 对齐前端 Tag: { id, name, color, sort, createdAt, updatedAt }
CREATE TABLE tags (
  id         CHAR(36)     NOT NULL,
  name       VARCHAR(100) NOT NULL,
  color      VARCHAR(20)  NOT NULL DEFAULT '#6bbd8f',
  sort       INT          NULL,
  createdAt  BIGINT       NOT NULL,
  updatedAt  BIGINT       NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_name (name)
) ENGINE=InnoDB COMMENT='标签';

-- ---------- 媒体文件元数据（文件本体存磁盘）----------
CREATE TABLE images (
  id           CHAR(36)     NOT NULL COMMENT '前端引用 ref，如 img_xxx',
  fileName     VARCHAR(200) NOT NULL COMMENT '磁盘文件名',
  mimeType     VARCHAR(100) NOT NULL,
  sizeBytes    BIGINT       NOT NULL DEFAULT 0,
  storagePath  VARCHAR(500) NOT NULL COMMENT '相对存储路径',
  createdAt    BIGINT       NOT NULL,
  PRIMARY KEY (id),
  KEY idx_created (createdAt)
) ENGINE=InnoDB COMMENT='媒体文件元数据';
```

### 3.4 为什么不用关联表存 tags

前端 `note.tags` 是纯 `string[]`（tagId 数组），如果后端用关联表（note_tags），则：
- 查询笔记时需要 JOIN + 组装成数组 → 多一层转换代码。
- 前端发送的 `{ tags: ["id1","id2"] }` 需要拆成关联行 → 又一层转换。

改用 `tags JSON` 列后：**前端发什么，后端存什么，零转换**。MySQL 8 的 JSON 类型支持 `JSON_CONTAINS` 查询，按 tag 过滤同样高效：

```sql
-- 按 tagId 过滤笔记（等价于前端的 notesByTag）
SELECT * FROM notes WHERE JSON_CONTAINS(tags, '"tag-uuid-1"');
```

### 3.5 为什么 blocks 全字段扁平

前端 Block 接口是扁平结构（不分表），所有类型共用同一组字段。如果后端用 `extra JSON` 容器：
- 前端 `block.imageUrl` 需映射到 `{ extra: { imageUrl } }` → 多一层拆装。
- 无法对特有字段建索引或做 SQL 级校验。

全字段扁平后：**每个前端 Block 字段对应一个独立列**，按 type 决定哪些列有值。未使用的列留 NULL，存储开销可忽略。

### 3.6 索引设计说明

| 索引 | 用途 |
|---|---|
| `idx_updated` (各表) | 支撑增量同步 `WHERE updatedAt > ?` |
| `idx_folder` (notes) | 按文件夹查询笔记 |
| `idx_note` (blocks/connections) | 查询笔记的子资源 |
| `idx_due` (plans) | 按截止时间 + 完成状态过滤 |
| `uk_name` (tags) | 标签名唯一约束 |
| `uk_conn_pair` (connections) | 连线去重 |

---

## 4. RESTful API 规范

### 4.1 通用约定

- **Base URL**：`/api`
- **数据格式**：`application/json; charset=UTF-8`
- **字段命名**：camelCase（与前端一致，**无任何转换**）
- **时间戳**：全部用毫秒级 `number`（如 `1691564800123`）
- **ID**：UUID 字符串，前端生成
- **HTTP 方法语义**：GET 查询、POST 新建、PUT 整体更新、PATCH 局部更新、DELETE 删除（软删除）

### 4.2 统一响应体

所有接口返回统一结构：

```json
{
  "code": 0,
  "msg": "ok",
  "data": { }
}
```

| 字段 | 说明 |
|---|---|
| `code` | `0` 表示成功；非 0 为业务错误码 |
| `msg` | 提示信息 |
| `data` | 业务数据，失败时为 `null` |

### 4.3 错误码

| code | HTTP 状态 | 含义 |
|---|---|---|
| 0 | 200 | 成功 |
| 40001 | 400 | 参数校验失败 |
| 40401 | 404 | 资源不存在 |
| 40901 | 409 | 冲突（如标签重名、连线重复） |
| 50001 | 500 | 服务端错误 |

### 4.4 列表查询通用参数

所有参数名 camelCase：

| 参数 | 说明 |
|---|---|
| `folderId` | 按文件夹过滤 |
| `keyword` | 关键词搜索（标题/内容） |
| `tagId` | 按标签过滤（后端用 `JSON_CONTAINS`） |
| `since` | 增量同步：返回 `updatedAt > since` 的记录 |
| `includeDeleted` | 是否包含软删除记录（默认 false） |

---

## 5. 资源 API 详解

### 5.1 文件夹 Folders

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/folders` | 列表（含层级） |
| GET | `/api/folders/{id}` | 详情 |
| POST | `/api/folders` | 新建 |
| PUT | `/api/folders/{id}` | 更新 |
| DELETE | `/api/folders/{id}` | 删除（递归软删子文件夹及笔记） |

**新建示例**（JSON 字段名与前端 Folder 完全一致）：

```json
{
  "id": "uuid-...",
  "name": "角色设定",
  "parentId": "system-root",
  "tags": [],
  "isSystem": false,
  "createdAt": 1691564800123,
  "updatedAt": 1691564800123
}
```

**递归删除规则**：删除文件夹时，后端事务内递归软删除所有子孙文件夹、其下笔记、笔记的 blocks/connections。返回受影响的资源计数。

### 5.2 笔记 Notes

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/notes` | 列表（支持 folderId/keyword/tagId） |
| GET | `/api/notes/{id}` | 详情（含 blocks、connections、canvasConfig） |
| POST | `/api/notes` | 新建 |
| PUT | `/api/notes/{id}` | 更新（title、folderId、tags、canvasConfig） |
| DELETE | `/api/notes/{id}` | 软删除 |
| POST | `/api/notes/{id}/duplicate` | 复制（深拷贝块与连线，生成新 ID） |

**详情响应示例**（字段名 100% 对齐前端 Note interface）：

```json
{
  "code": 0, "msg": "ok",
  "data": {
    "id": "note-uuid",
    "title": "主角设定",
    "folderId": "system-root",
    "tags": ["tag-uuid-1"],
    "blocks": [
      {
        "id": "block-uuid",
        "type": "text",
        "content": "<p>内容</p>",
        "x": 100, "y": 100,
        "width": 240, "minHeight": 60,
        "color": "green",
        "title": null, "status": null, "priority": null, "dueDate": null,
        "imageUrl": null, "mediaUrl": null, "mediaName": null,
        "images": null, "galleryLayout": null,
        "createdAt": 1691564800123,
        "updatedAt": 1691564800123
      }
    ],
    "connections": [
      {
        "id": "conn-uuid",
        "from": "blockA", "to": "blockB",
        "shape": "straight", "dash": "solid",
        "arrow": "standard", "dir": "forward",
        "color": "#6bbd8f", "width": "2", "label": "",
        "createdAt": 1691564800123
      }
    ],
    "canvasConfig": { "zoom": 1, "offsetX": 0, "offsetY": 0 },
    "createdAt": 1691564800123,
    "updatedAt": 1691564900123,
    "deleted": false
  }
}
```

> 注意 block 响应中包含所有类型的字段（未用的为 null），前端可直接 `Object.assign` 使用，无需关心类型差异。

### 5.3 画布块 Blocks（嵌套资源）

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/notes/{noteId}/blocks` | 列表 |
| POST | `/api/notes/{noteId}/blocks` | 新建块 |
| PUT | `/api/notes/{noteId}/blocks/{blockId}` | 更新 |
| DELETE | `/api/notes/{noteId}/blocks/{blockId}` | 删除（同时清理相关连线） |
| POST | `/api/notes/{noteId}/blocks/batch` | 批量更新（拖拽多块时用） |

> **批量更新**接口用于画布拖拽场景：前端防抖收集多个 block 的位置变更，一次请求提交，减少请求数。

### 5.4 连线 Connections

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/notes/{noteId}/connections` | 列表 |
| POST | `/api/notes/{noteId}/connections` | 新建（后端去重校验） |
| PUT | `/api/notes/{noteId}/connections/{connId}` | 更新 |
| DELETE | `/api/notes/{noteId}/connections/{connId}` | 删除 |

去重规则：`(from,to)` 与 `(to,from)` 视为同一连线，Service 层双向校验，已存在则返回现有记录而非新建。

### 5.5 计划 Plans

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/plans` | 列表（支持 completed/dueDate 范围过滤） |
| POST | `/api/plans` | 新建 |
| PUT | `/api/plans/{id}` | 更新 |
| DELETE | `/api/plans/{id}` | 删除 |
| PATCH | `/api/plans/{id}/complete` | 切换完成状态 |

> 提醒通知逻辑保留在前端（planStore），后端只负责数据。这样避免后端推送通道复杂度。

### 5.6 标签 Tags

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/tags` | 列表 |
| POST | `/api/tags` | 新建（name 唯一校验） |
| PUT | `/api/tags/{id}` | 更新 |
| DELETE | `/api/tags/{id}` | 删除 |

删除标签时，后端扫描 notes/folders/plans 的 `tags` JSON 列，移除其中的该 tagId（`JSON_REMOVE` 或读改写）。

---

## 6. 媒体存储子系统

### 6.1 存储策略

媒体文件**不进 MySQL**（避免 BLOB 膨胀），采用「**磁盘文件 + 元数据表**」方案：

```
后端服务器
└── ${app.storage.dir}/images/     ← 文件本体
    ├── img_1691xxxxxx_a3f2k9.png
    └── media_1691xxxxxx_b8c1d2.mp3

MySQL images 表                      ← 元数据（路径、MIME、大小）
```

> 单机部署时 `${app.storage.dir}` 默认为应用目录下 `storage/`；容器化/多实例时可切换为对象存储（OSS/S3），只需替换 `ImageService` 实现层。

### 6.2 图片 API

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/images` | 上传（multipart/form-data），返回 ref |
| GET | `/api/images/{ref}` | 下载（直接返回二进制流，Content-Type 正确） |
| DELETE | `/api/images/{ref}` | 删除（文件 + 元数据） |
| GET | `/api/images` | 列出全部 ref（用于孤儿清理） |

**上传响应**：

```json
{ "code": 0, "msg": "ok", "data": { "ref": "img_1691564800123_a3f2k9.png" } }
```

**前端兼容**：`ref` 格式沿用现有 `img_<ts>_<rand>.<ext>` / `media_<ts>_<rand>.<ext>`，前端 `isImageRef()` 判定逻辑无需改动。

### 6.3 引用一致性

- 删除笔记/块时，后端扫描被引用的 image ref，但**不立即删除文件**（可能被其他笔记引用）。
- 提供 `/api/images/orphans` 接口（GET）列出未被任何 block 引用的孤儿文件，供定期清理。

---

## 7. 数据同步与合并

### 7.1 增量同步机制

多端同步基于 `updatedAt` 时间戳：

```http
GET /api/sync?since=1691564800123
```

**响应**：返回所有 `updatedAt > since` 的四类资源（notes/folders/plans/tags），前端据此合并到本地状态。

```json
{
  "code": 0, "msg": "ok",
  "data": {
    "serverTime": 1691564999999,
    "folders": [...],
    "notes": [...],
    "plans": [...],
    "tags": [...]
  }
}
```

前端下次同步以 `serverTime` 作为新的 `since`。

### 7.2 写回策略

前端对资源的增删改直接调对应 REST API（无需等同步周期），保证实时性。同步接口仅用于**拉取其他端的变更**。

### 7.3 冲突合并规则

当多端并发修改同一资源时，后端采用 **Last-Write-Wins** 策略：

```
PUT /api/notes/{id}  Body 含 updatedAt
  → 后端比较 Body.updatedAt 与 DB.updatedAt
  → 若 Body.updatedAt >= DB.updatedAt  → 接受更新
  → 否则返回 409 + 当前服务器版本，前端提示或自动合并
```

软删除特殊规则（与原 `mergeData` 一致）：远端未删除而本地已删除时，以未删除方为准（恢复）。

---

## 8. 导入导出与备份

### 8.1 导出

```http
GET /api/data/export
```

后端打包全量数据（含 image 引用列表）为 JSON 返回。媒体本体可通过 `/api/images/{ref}` 单独下载，或打包为 zip。

### 8.2 导入

```http
POST /api/data/import   (multipart 或 JSON)
```

后端按 `updatedAt` 合并策略写入，冲突按 LWW 处理（与原前端 `mergeData` 逻辑一致）。

### 8.3 数据库备份

- **逻辑备份**：`mysqldump --single-transaction rgoose_note > backup.sql`，配合定时任务（crontab / Windows 任务计划）。
- **文件备份**：`storage/images/` 目录定期增量备份。
- **保留策略**：建议每日全量 + 每周滚动，保留 4 周。

---

## 9. 异常处理与统一响应

### 9.1 全局异常处理

`GlobalExceptionHandler` 统一捕获：

| 异常 | 处理 |
|---|---|
| `MethodArgumentNotValidException` | 400 + 参数错误明细 |
| `BizException`（自定义业务异常） | 按 errorCode 映射 HTTP 状态 |
| `DataIntegrityViolationException` | 409 唯一约束冲突 |
| `Exception`（兜底） | 500 + 通用错误信息 |

### 9.2 CORS 配置

`WebConfig` 全局开放（内网部署）：

```java
registry.addMapping("/api/**")
    .allowedOriginPatterns("*")
    .allowedMethods("GET","POST","PUT","PATCH","DELETE","OPTIONS")
    .allowCredentials(true);
```

> 生产环境应收敛为前端实际域名白名单。

---

## 10. 配置与部署

### 10.1 application.yml

```yaml
server:
  port: 8080

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/rgoose_note?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: rgoose
    password: ${DB_PASSWORD:rgoose}
    hikari:
      maximum-pool-size: 10
  servlet:
    multipart:
      max-file-size: 100MB      # 媒体上传上限
      max-request-size: 100MB

mybatis-plus:
  configuration:
    # ★ 关闭下划线转驼峰：列名已经是 camelCase，与 Java 字段同名，无需转换
    map-underscore-to-camel-case: false
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0

# 媒体存储目录
app:
  storage:
    dir: ${STORAGE_DIR:./storage}

springdoc:
  swagger-ui:
    path: /swagger-ui.html
```

> **关键**：`map-underscore-to-camel-case: false`。因为列名已是 camelCase（如 `folderId`），若开启转换会错误地把 `folderId` 当成 `folder_id` 反查。

### 10.2 Java 实体示例（字段名对齐前端）

```java
// entity/Note.java —— 字段名与前端 Note interface 完全一致
@TableName("notes")
public class Note {
    @TableId(type = IdType.INPUT)   // ID 由前端生成，不做自增
    private String id;
    private String title;
    private String folderId;
    private List<String> tags;       // MyBatis-Plus JSON -> MySQL JSON 列
    private CanvasConfig canvasConfig;
    private Long createdAt;
    private Long updatedAt;
    @TableLogic
    private Integer deleted;
    // getter/setter ...
}

// entity/Block.java —— 全字段扁平，对齐前端 Block
@TableName("blocks")
public class Block {
    @TableId(type = IdType.INPUT)
    private String id;
    private String noteId;
    private String type;
    private String content;
    private Double x;                // 前端 block.x
    private Double y;                // 前端 block.y
    private Integer width;
    private Integer minHeight;
    private String color;
    // todo 特有
    private String title;
    private String status;
    private String priority;
    private Long dueDate;
    // image 特有
    private String imageUrl;
    // audio/video 特有
    private String mediaUrl;
    private String mediaName;
    // gallery 特有
    private List<String> images;
    private String galleryLayout;
    // 通用
    private Long createdAt;
    private Long updatedAt;
}

// entity/Connection.java —— from/to 用 @TableField 显式映射保留字
@TableName("connections")
public class Connection {
    @TableId(type = IdType.INPUT)
    private String id;
    private String noteId;
    @TableField("`from`")            // MySQL 保留字，反引号包裹
    private String from;
    @TableField("`to`")
    private String to;
    private String shape;
    private String dash;
    private String arrow;
    private String dir;
    private String color;
    private String width;
    private String label;
    private Long createdAt;
}
```

### 10.3 部署方式

**方式一：本地开发**
```bash
mysql -u root -p < src/main/resources/db/schema.sql
mvn spring-boot:run
# 前端配置 VITE_API_BASE=http://localhost:8080/api
```

**方式二：打包部署**
```bash
mvn clean package -DskipTests
java -jar target/rgoose-backend.jar --spring.profiles.active=prod
```

**方式三：内网 Docker**
```dockerfile
FROM eclipse-temurin:17-jre
COPY target/rgoose-backend.jar /app/app.jar
COPY storage /app/storage
WORKDIR /app
ENTRYPOINT ["java","-jar","app.jar","--app.storage.dir=/app/storage"]
```

### 10.4 前端代理配置

开发期 `vite.config.js` 配置代理避免 CORS：

```js
server: {
  proxy: {
    '/api': { target: 'http://localhost:8080', changeOrigin: true }
  }
}
```

---

## 11. 前后端字段对照表

由于后端命名以前端为准，对照基本是 **1:1 同名**。下表列出所有实体，确认无遗漏：

### 11.1 Note

| 前端字段 | 后端列名 / Java 字段 | MySQL 类型 | 说明 |
|---|---|---|---|
| `id` | `id` | CHAR(36) | UUID |
| `title` | `title` | VARCHAR(500) | |
| `folderId` | `folderId` | CHAR(36) | 所属文件夹 |
| `tags` | `tags` | JSON | tagId 数组 |
| `blocks` | (blocks 表 noteId 关联) | — | 子表查询组装 |
| `connections` | (connections 表 noteId 关联) | — | 子表查询组装 |
| `canvasConfig` | `canvasConfig` | JSON | `{zoom,offsetX,offsetY}` |
| `createdAt` | `createdAt` | BIGINT | 毫秒 |
| `updatedAt` | `updatedAt` | BIGINT | 毫秒 |
| `deleted` | `deleted` | TINYINT(1) | 软删除 |

### 11.2 Block

| 前端字段 | 后端列名 / Java 字段 | MySQL 类型 | 适用 type |
|---|---|---|---|
| `id` | `id` | CHAR(36) | 全部 |
| `noteId` | `noteId` | CHAR(36) | 全部 |
| `type` | `type` | VARCHAR(20) | 全部 |
| `content` | `content` | MEDIUMTEXT | text/todo |
| `x` | `x` | DOUBLE | 全部 |
| `y` | `y` | DOUBLE | 全部 |
| `width` | `width` | INT | 全部 |
| `minHeight` | `minHeight` | INT | 全部 |
| `color` | `color` | VARCHAR(20) | 全部 |
| `title` | `title` | VARCHAR(500) | todo |
| `status` | `status` | VARCHAR(20) | todo |
| `priority` | `priority` | VARCHAR(20) | todo |
| `dueDate` | `dueDate` | BIGINT | todo |
| `imageUrl` | `imageUrl` | VARCHAR(200) | image |
| `mediaUrl` | `mediaUrl` | VARCHAR(200) | audio/video |
| `mediaName` | `mediaName` | VARCHAR(200) | audio/video |
| `images` | `images` | JSON | gallery |
| `galleryLayout` | `galleryLayout` | VARCHAR(20) | gallery |
| `createdAt` | `createdAt` | BIGINT | 全部 |
| `updatedAt` | `updatedAt` | BIGINT | 全部 |

### 11.3 Connection

| 前端字段 | 后端列名 | Java 字段 | MySQL 类型 |
|---|---|---|---|
| `id` | `id` | id | CHAR(36) |
| (noteId) | `noteId` | noteId | CHAR(36) |
| `from` | `` `from` `` | from (`@TableField("`from`")`) | CHAR(36) |
| `to` | `` `to` `` | to (`@TableField("`to`")`) | CHAR(36) |
| `shape` | `shape` | shape | VARCHAR(20) |
| `dash` | `dash` | dash | VARCHAR(20) |
| `arrow` | `arrow` | arrow | VARCHAR(20) |
| `dir` | `dir` | dir | VARCHAR(20) |
| `color` | `color` | color | VARCHAR(20) |
| `width` | `width` | width | VARCHAR(10) |
| `label` | `label` | label | VARCHAR(200) |
| `createdAt` | `createdAt` | createdAt | BIGINT |

### 11.4 Folder / Plan / Tag / Image

| 实体 | 前端字段 | 后端列名 | 备注 |
|---|---|---|---|
| **Folder** | id/name/parentId/tags/isSystem/createdAt/updatedAt/deleted | 同名 | tags 为 JSON |
| **Plan** | id/title/description/dueDate/reminder/completed/priority/tags/noteId/blockId/createdAt/updatedAt | 同名 | tags 为 JSON |
| **Tag** | id/name/color/sort/createdAt/updatedAt | 同名 | |
| **Image** | (ref) → id/fileName/mimeType/sizeBytes/storagePath/createdAt | camelCase | 仅后端使用 |

> **结论**：除 connections 的 `from`/`to` 因 MySQL 保留字需反引号外，所有字段名前后端**完全同名、零映射**。

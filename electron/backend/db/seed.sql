-- 系统根目录文件夹（前端 SYSTEM_ROOT_FOLDER_ID = 'system-root'）
INSERT INTO folders (id, name, parentId, tags, isSystem, createdAt, updatedAt, deleted)
VALUES ('system-root', '根目录', NULL, '[]', 1,
        CAST(strftime('%s','now') AS INTEGER) * 1000,
        CAST(strftime('%s','now') AS INTEGER) * 1000, 0)
ON CONFLICT(id) DO UPDATE SET name = '根目录', isSystem = 1;

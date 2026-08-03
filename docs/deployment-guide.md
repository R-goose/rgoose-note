# R-Goose Note 部署与启动指南

> 版本：v2.0 ｜ 前后端分离架构
> 更新日期：2026-08-03

---

## 目录

1. [环境要求](#1-环境要求)
2. [快速启动（开发模式）](#2-快速启动开发模式)
3. [后端详细配置](#3-后端详细配置)
4. [前端详细配置](#4-前端详细配置)
5. [生产部署](#5-生产部署)
6. [Docker 一键部署](#6-docker-一键部署)
7. [API 文档（Swagger）](#7-api-文档swagger)
8. [常见问题](#8-常见问题)

---

## 1. 环境要求

| 组件 | 最低版本 | 推荐版本 | 说明 |
|---|---|---|---|
| **JDK** | 17 | 17 (LTS) | Spring Boot 3 最低要求 |
| **Maven** | 3.8 | 3.9+ | 后端构建 |
| **MySQL** | 8.0 | 8.0+ | 数据库 |
| **Node.js** | 18 | 20 (LTS) | 前端构建 |
| **npm** | 9 | 10+ | 前端包管理 |

### 验证环境

```bash
java -version       # 应输出 17 或更高
mvn -v              # 应输出 3.8+
node -v             # 应输出 18+
mysql --version     # 应输出 8.0+
```

---

## 2. 快速启动（开发模式）

### 第一步：初始化数据库

```bash
# 用 root 用户执行建表脚本
mysql -u root -p < rgoose-backend/src/main/resources/db/schema.sql
```

脚本会自动完成：
- 创建 `rgoose_note` 数据库
- 授权 `root` 用户访问权限
- 创建 7 张表（folders / notes / blocks / connections / plans / tags / images）
- 插入系统根目录种子数据

### 第二步：启动后端

```bash
cd rgoose-backend
mvn spring-boot:run
```

后端启动后监听 `http://localhost:8080`，Swagger UI 可访问 `http://localhost:8080/swagger-ui.html`。

### 第三步：启动前端

```bash
cd e:\大师的
npm install        # 首次运行需安装依赖
npm run dev
```

前端启动后监听 `http://localhost:5173`，自动代理 `/api` 请求到后端。

### 第四步：打开应用

浏览器访问 `http://localhost:5173`，开始使用。

---

## 3. 后端详细配置

### 3.1 配置文件

后端配置文件位于 `rgoose-backend/src/main/resources/application.yml`：

```yaml
server:
  port: 8080                        # 后端端口

spring:
  datasource:
    url: jdbc:mysql://localhost:3306/rgoose_note?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
    username: rgoose                # 数据库用户名
    password: rgoose                # 数据库密码
    hikari:
      maximum-pool-size: 10         # 连接池上限
  servlet:
    multipart:
      max-file-size: 100MB          # 单文件上传上限
      max-request-size: 100MB

mybatis-plus:
  configuration:
    map-underscore-to-camel-case: false   # 关闭驼峰映射（列名已 camelCase）
  global-config:
    db-config:
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
      id-type: input                # ID 由前端生成

app:
  storage:
    dir: ${STORAGE_DIR:./storage}   # 媒体文件存储目录
```

### 3.2 修改数据库连接

如果你的 MySQL 环境不同，修改 `application.yml` 中的 `url` / `username` / `password`：

```yaml
spring:
  datasource:
    url: jdbc:mysql://你的数据库地址:3306/rgoose_note?...
    username: 你的用户名
    password: 你的密码
```

### 3.3 媒体存储目录

图片和音视频文件存储在磁盘，不进 MySQL。默认路径为 `rgoose-backend/storage/images/`。

- 可通过环境变量 `STORAGE_DIR` 修改
- 目录不存在时自动创建

### 3.4 切换生产配置

```bash
# 使用生产配置文件启动
mvn spring-boot:run -Dspring-boot.run.profiles=prod
```

生产配置（`application-prod.yml`）特点：
- 数据库密码从环境变量 `${DB_PASSWORD}` 读取
- 存储目录从环境变量 `${STORAGE_DIR}` 读取

---

## 4. 前端详细配置

### 4.1 API 代理

前端开发服务器通过 Vite proxy 将 `/api` 请求代理到后端：

```js
// vite.config.js
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',   // 后端地址
      changeOrigin: true
    }
  }
}
```

如果后端不在 `localhost:8080`，修改 `target` 即可。

### 4.2 前端 API 层

所有 HTTP 调用通过 `src/api/` 统一封装：

```
src/api/
├── client.js         # fetch 封装（baseURL = /api）
├── folders.js        # 文件夹 CRUD
├── notes.js          # 笔记 CRUD
├── blocks.js         # 画布块 CRUD
├── connections.js    # 连线 CRUD
├── plans.js          # 计划 CRUD
├── tags.js           # 标签 CRUD
├── images.js         # 图片上传/下载
└── sync.js           # 同步/导入导出/清空
```

前端无需关心后端地址细节，所有请求走相对路径 `/api/...`，由 proxy 转发。

---

## 5. 生产部署

### 5.1 打包后端

```bash
cd rgoose-backend
mvn clean package -DskipTests
# 产物：target/rgoose-backend-2.0.0.jar
```

### 5.2 打包前端

```bash
cd e:\大师的
npm run build
# 产物：dist/ 目录
```

### 5.3 启动

```bash
# 启动后端
java -jar rgoose-backend-2.0.0.jar \
  --spring.profiles.active=prod \
  --DB_PASSWORD=123456 \
  --STORAGE_DIR=/data/rgoose/storage

# 前端产物部署到 Nginx / 其他静态服务器
# Nginx 配置示例：
```

### 5.4 Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态资源
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 代理到后端
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 100M;    # 允许大文件上传
    }
}
```

---

## 6. Docker 一键部署

### 6.1 后端 Dockerfile

```dockerfile
# rgoose-backend/Dockerfile
FROM eclipse-temurin:17-jre
COPY target/rgoose-backend-2.0.0.jar /app/app.jar
WORKDIR /app
ENTRYPOINT ["java", "-jar", "app.jar", \
  "--spring.profiles.active=prod", \
  "--app.storage.dir=/app/storage"]
```

### 6.2 Docker Compose（后端 + MySQL）

```yaml
# docker-compose.yml
version: '3.8'
services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: rootpass
      MYSQL_DATABASE: rgoose_note
      MYSQL_USER: rgoose
      MYSQL_PASSWORD: rgoosepass
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
      - ./rgoose-backend/src/main/resources/db/schema.sql:/docker-entrypoint-initdb.d/schema.sql

  backend:
    build: ./rgoose-backend
    depends_on:
      - mysql
    environment:
      - DB_PASSWORD=rgoosepass
      - STORAGE_DIR=/app/storage
      - SPRING_DATASOURCE_URL=jdbc:mysql://mysql:3306/rgoose_note?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false
    ports:
      - "8080:8080"
    volumes:
      - storage_data:/app/storage

volumes:
  mysql_data:
  storage_data:
```

### 6.3 启动

```bash
# 先打包后端 jar
cd rgoose-backend && mvn clean package -DskipTests && cd ..

# 启动全部服务
docker compose up -d

# 后端：http://localhost:8080
# MySQL 自动执行 schema.sql 初始化
```

---

## 7. API 文档（Swagger）

后端启动后，访问 Swagger UI 查看完整 API 文档：

```
http://localhost:8080/swagger-ui.html
```

API 规范速查：

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | `/api/folders` | 文件夹列表 |
| POST | `/api/folders` | 新建文件夹 |
| GET | `/api/notes` | 笔记列表 |
| GET | `/api/notes/{id}` | 笔记详情（含 blocks/connections） |
| POST | `/api/notes` | 新建笔记 |
| POST | `/api/notes/{id}/duplicate` | 复制笔记 |
| POST | `/api/notes/{noteId}/blocks` | 新建块 |
| POST | `/api/notes/{noteId}/blocks/batch` | 批量更新块 |
| POST | `/api/notes/{noteId}/connections` | 新建连线 |
| GET | `/api/plans` | 计划列表 |
| PATCH | `/api/plans/{id}/complete` | 切换完成状态 |
| GET | `/api/tags` | 标签列表 |
| POST | `/api/images` | 上传图片（multipart） |
| GET | `/api/images/{ref}` | 下载图片 |
| GET | `/api/sync?since=0` | 增量同步 |
| GET | `/api/data/export` | 全量导出 |
| POST | `/api/data/import` | 导入数据 |
| DELETE | `/api/data/all` | 清空全部 |

---

## 8. 常见问题

### Q: 启动后端报数据库连接失败

**原因**：MySQL 未启动，或用户名/密码不匹配。

**解决**：
1. 确认 MySQL 服务正在运行
2. 确认已执行 `schema.sql`（会自动创建 `rgoose` 用户）
3. 检查 `application.yml` 中的 `url` / `username` / `password`

### Q: 前端页面空白，控制台报 502 / ECONNREFUSED

**原因**：后端未启动，前端 proxy 无法转发。

**解决**：先启动后端（`mvn spring-boot:run`），再启动前端。

### Q: 图片上传后无法显示

**原因**：媒体存储目录无写入权限。

**解决**：
1. 确认 `STORAGE_DIR`（默认 `./storage`）目录存在且可写
2. 检查后端日志是否有 `IOException`

### Q: `mvn` 命令不存在

**原因**：未安装 Maven 或未配置 PATH。

**替代方案**：用 IDE（IntelliJ IDEA）直接导入 `rgoose-backend` 项目运行。

### Q: MySQL 报 `Public Key Retrieval is not allowed`

**原因**：MySQL 8 默认认证插件变更。

**解决**：连接 URL 中已包含 `allowPublicKeyRetrieval=true`，确认未删除此参数。

### Q: 端口 8080 被占用

**解决**：修改 `application.yml` 中 `server.port`，同时更新 `vite.config.js` 中 proxy 的 `target` 端口。

### Q: 前端如何连接远程后端

修改 `vite.config.js`：

```js
proxy: {
  '/api': {
    target: 'http://远程服务器IP:8080',
    changeOrigin: true
  }
}
```

或修改 `src/api/client.js` 中的 `BASE_URL` 为完整地址。

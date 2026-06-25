<<<<<<< HEAD
# RGoose-note

#### 介绍
{**以下是 Gitee 平台说明，您可以替换此简介**
Gitee 是 OSCHINA 推出的基于 Git 的代码托管平台（同时支持 SVN）。专为开发者提供稳定、高效、安全的云端软件开发协作平台
无论是个人、团队、或是企业，都能够用 Gitee 实现代码托管、项目管理、协作开发。企业项目请看 [https://gitee.com/enterprises](https://gitee.com/enterprises)}

#### 软件架构
软件架构说明


#### 安装教程

1.  xxxx
2.  xxxx
3.  xxxx

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)
=======
# R-Goose Note

一个使用 Vue 3 + Vite + Pinia 构建的笔记应用，支持思维导图式笔记编辑。

## 功能特性

- 📝 思维导图式笔记编辑
- 🔗 块之间的连线功能
- 🖼️ 支持图片块
- 📋 引用笔记块
- ↩️ 撤销/重做功能
- 📱 支持多平台（APP、Windows桌面端）
- 🎨 简洁清新的界面设计

## 技术栈

- Vue 3 (Composition API)
- Vite
- Pinia (状态管理)
- Vue Router
- Interact.js (交互库)

## 安装和运行

```bash
# 安装依赖
pnpm install

# 开发模式运行
pnpm dev

# 构建生产版本
pnpm build
```

## Git 推送说明

如果你需要将代码推送到自己的仓库，可以执行以下命令：

```bash
# 添加远程仓库（如果还没有）
git remote add origin https://gitee.com/kokomi123/rgoose-note.git

# 推送代码
git push -u origin master
```

或者，如果你想推送到新的仓库：

```bash
# 在 Gitee 上创建新仓库后
git remote set-url origin https://gitee.com/你的用户名/你的仓库名.git
git push -u origin master
```

## 项目结构

```
src/
├── components/     # 组件
│   ├── NoteBlock.vue      # 笔记块组件
│   ├── PlanItem.vue       # 计划项组件
│   └── Sidebar.vue        # 侧边栏组件
├── views/         # 页面视图
│   ├── NoteEditorView.vue  # 笔记编辑器
│   ├── NotesView.vue      # 笔记列表
│   ├── PlansView.vue      # 计划页面
│   └── SettingsView.vue   # 设置页面
├── stores/        # Pinia 状态管理
│   ├── note.js    # 笔记状态
│   └── plan.js    # 计划状态
├── styles/        # 样式文件
│   ├── global.css     # 全局样式
│   └── variables.css   # CSS 变量
└── utils/         # 工具函数
    ├── index.js       # 通用工具
    └── storage.js     # 存储工具

electron/          # Electron 桌面端配置
public/           # 静态资源
```

## License

MIT
>>>>>>> 5d935f4 (Add README.md)

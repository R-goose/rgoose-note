# 项目规则

## 版本号规则

每次完成一轮功能更新/修复后，必须同步更新版本号。

- 版本格式：三段式 `major.minor.patch`（如 `1.0.5`）
- `patch`（第三段）= 小版本，每轮更新 +1，取值范围 `1–8`（最多到 8，绝不能出现 9 或 0）
- 满到 `.8` 后进位：`minor`（第二段/大版本）+1，`patch` 从 `1` 重新开始
  - 例：`1.0.4 → 1.0.5 → … → 1.0.8 → 1.1.1 → 1.1.2 …`
- `major`（第一段）暂不主动变动

需要同步更新版本号的位置（共 3 处，保持一致）：

1. `package.json` 的 `version` 字段（源头）
2. `package-lock.json` 中的两处根 `version` 字段（`name: "note-flow"` 下）
3. `src/views/SettingsView.vue` 设置页中 `版本 x.x.x` 的显示文本

注意：`package-lock.json` / `pnpm-lock.yaml` 中其他 `1.0.x` 命中均为第三方依赖版本，不要改动。

## 质量检查

完成代码改动后，运行以下命令验证（项目为 Vite + Vue 3，无独立 lint 脚本，依赖 HMR 编译报错）：

- 开发验证：`npm run dev`（已运行的 dev server 通过 HMR 反馈编译错误）
- 生产构建：`npm run build`

# 项目规则

## 版本号规则

每次完成一轮功能更新/修复后，必须同步更新版本号。

- 版本格式：三段式 `major.minor.patch`（如 `1.1.5`）
- **每一段的取值范围都是 `1–8`，任何一段都不允许出现 9、10 或 0**
- `patch`（第三段）每轮更新 +1；满到 `.8` 进位：`minor` +1，`patch` 回到 `1`
- `minor`（第二段）同样最多到 `8`；满到 `x.8.8` 后进位：`major` +1，回到 `1.1.1`
  - 例：`1.1.7 → 1.1.8 → 1.2.1 → … → 1.8.8 → 2.1.1 → 2.1.2 …`

需要同步更新版本号的位置（共 3 处，保持一致）：

1. `package.json` 的 `version` 字段（源头）
2. `package-lock.json` 中的两处根 `version` 字段（`name: "note-flow"` 下）
3. `src/views/SettingsView.vue` 设置页中 `版本 x.x.x` 的显示文本

注意：`package-lock.json` / `pnpm-lock.yaml` 中其他 `1.0.x` 命中均为第三方依赖版本，不要改动。

## 质量检查

完成代码改动后，运行以下命令验证（项目为 Vite + Vue 3，无独立 lint 脚本，依赖 HMR 编译报错）：

- 开发验证：`npm run dev`（已运行的 dev server 通过 HMR 反馈编译错误）
- 生产构建：`npm run build`

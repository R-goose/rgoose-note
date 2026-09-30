# 安装包归档

这里保存已发布版本的可分发文件，便于个人从 Git 仓库直接取得与当前代码对应的安装包。它们不是 Electron Builder 的临时 `unpacked` 目录。

`2.5.0/` 包含：

- `R-Goose Note-2.5.0-arm64.dmg`：Apple Silicon Mac 的手动安装包。
- `R-Goose Note Setup 2.5.0.exe`：Intel/AMD Windows 的手动安装包。
- `latest.yml`、Windows `.blockmap`：Windows 应用内更新所需文件。

这些文件会使仓库体积明显增大；每次发布新版本时新增一个版本目录，不覆盖历史版本。自动发布只上传 Windows 文件；macOS 包仅在此 Mac 本机构建并安装，归档时只保留 DMG。当前 macOS 包未签名和公证：个人从仓库克隆后自行使用可以保留，但不适合直接发给其他 Mac 用户。

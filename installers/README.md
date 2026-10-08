# 安装包说明

安装包不再提交到源码仓库：它们体积较大，也不属于源码版本控制的范围。

- macOS 的 DMG 在此 Mac 本地构建和安装，位于 `release-build-<时间>/`，不会上传。
- Windows 的 EXE、`latest.yml` 与 `.blockmap` 由发布工作流上传到 [Gitee Release](https://gitee.com/kokomi123/rgoose-note/releases/tag/latest)，供应用内更新下载。

当前 macOS DMG 未签名和公证，仅适合本机手动安装。

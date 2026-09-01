# 素材卡片 Design QA

## 对照基准

- source visual truth: `design-qa-assets/media-cards-source-option-3.png`
- normalized source: `design-qa-assets/media-cards-source-normalized.png`
- implementation screenshot: `design-qa-assets/media-cards-pass-2.png`
- full-view comparison: `design-qa-assets/media-cards-comparison-pass-2.png`
- focused card-region comparison: `design-qa-assets/media-cards-focus-comparison-pass-2.png`
- viewport: 1280 x 720 CSS px
- source pixels: 1672 x 941；按相同比例高质量缩放到 1280 x 720 后比较
- implementation pixels: 1280 x 720；浏览器截图与 CSS 视口 1:1
- state: 浅色模式、素材库根目录、全部素材、标签“全部”、真实素材数据

## Findings

- 未发现仍需修复的 P0、P1 或 P2 差异。
- [P3] 缩略图左上角沿用了项目现有的“图 / 音 / 视”类型标记，而视觉稿使用线性图标。保留现状是为了延续当前产品的图标语言，不影响识别和信息层级。

## Required fidelity surfaces

- Fonts and typography: 继续使用项目现有系统字体栈；素材标题为 13px / 600，格式和元信息为 10–11px。标题、格式、文件夹、标签和引用数的层级与视觉稿一致，长标题保持单行省略。
- Spacing and layout rhythm: 1280px 桌面视口下为稳定四列，列间距 14px；缩略图维持 4:3；卡片信息区固定为 72px；圆角 8px、细边框、无投影。卡片起点、列宽和行距已与归一化视觉稿对齐。
- Colors and visual tokens: 复用现有主题变量、浅灰工作区、绿色主色与素材类型色；无渐变、玻璃效果或浮层阴影，符合克制的桌面工具风格。
- Image quality and asset fidelity: 使用后端真实素材及真实缩略图，统一 `object-fit: cover`；未生成占位图、CSS 图形或替代素材。视频保留原有首帧和播放状态能力。
- Copy and content: 标题右侧显示真实文件扩展名；第二行固定展示文件夹，标签与文件夹处于同一行，笔记引用数弱化到最右侧；真实标签名和引用数量均保留。

## Focused comparison evidence

卡片区域使用同一 980 x 450 裁剪范围上下拼接比较。缩略图高度、标题基线、格式右对齐、第二行文件夹与标签关系、边框、圆角和四列密度均可直接读取，因此无需额外局部裁剪。

## Comparison history

### Pass 1

- [P2] 顶部筛选项在 1280px 宽度下被压缩换行，导致页面头部比视觉稿高，卡片整体下移。
- [P2] 素材内容区左右留白为 28px，卡片网格比视觉稿内缩约 16px，四列显得偏窄。
- Fixes: 为筛选组和操作按钮增加稳定收缩规则；搜索框改为可弹性缩放并设置最小宽度；筛选文字禁止换行；素材内容区和标签栏水平内边距调整为 12px。
- Post-fix evidence: `design-qa-assets/media-cards-pass-2.png` 与 `design-qa-assets/media-cards-comparison-pass-2.png`。

### Pass 2

- 顶部筛选项恢复单行，头部高度与视觉稿接近。
- 四列卡片从相同水平基线开始，卡片宽度、列间距和行距与视觉稿一致。
- 未发现新的 P0、P1 或 P2 差异。

## Interaction checks

- 视频筛选：显示 3 个视频素材。
- 搜索“飞书”：结果缩小为 2 个匹配素材，非匹配素材隐藏。
- 卡片点击：操作菜单正常打开并显示“查看素材”。
- 生产构建：`npm run build` 通过。
- Source diff check: `git diff --check -- src/views/MediaView.vue` 通过。

## Follow-up polish

- 可在后续统一项目的素材类型图标库后，将“图 / 音 / 视”字符标记替换为同一套线性图标；当前不作为交付阻塞项。

final result: passed

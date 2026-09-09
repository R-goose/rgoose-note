/**
 * 内置笔记模板：元数据 + 模板块布局生成器
 * 内置模板保留在 JS 硬编码（含复杂布局计算），自定义模板入库。
 */

export const BUILTIN_TEMPLATES = [
  {
    key: 'blank',
    name: '空白',
    desc: '从零开始',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="4" y="3" width="16" height="18" rx="2"/><line x1="8" y1="9" x2="16" y2="9"/><line x1="8" y1="13" x2="16" y2="13"/></svg>'
  },
  {
    key: 'character',
    name: '角色卡',
    desc: '游戏角色设定',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21v-1a8 8 0 0 1 16 0v1"/></svg>'
  },
  {
    key: 'level',
    name: '关卡设计',
    desc: '关卡/地图规划',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>'
  },
  {
    key: 'system',
    name: '系统设计',
    desc: '玩法/系统文档',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/></svg>'
  },
  {
    key: 'story',
    name: '剧情大纲',
    desc: '故事/剧本结构',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>'
  },
  {
    key: 'tasks',
    name: '开发规划',
    desc: '项目功能规划',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
  }
]

export function buildTemplateBlocks(tplKey) {
  const PAD_X = 60
  const GAP = 32
  const blocks = []
  let cursorY = 60
  // 估算块渲染高度（含块 header + padding 开销 + 浏览器默认标题/段落/列表 margin）
  const estHeight = (data) => {
    // 文本块：根据内容粗略估算
    const html = data.content || ''
    const pCount = (html.match(/<p/g) || []).length
    const liCount = (html.match(/<li/g) || []).length
    const hasH2 = /<h2/.test(html)
    const hasH3 = /<h3/.test(html)
    // 基础开销：块 header(22) + content padding(22) + border(2) ≈ 46
    let h = 50
    if (hasH2) h += 64   // h2: font 24 + margin 40
    if (hasH3) h += 50   // h3: font 18 + margin 32
    h += pCount * 48     // p: font 16 + margin 32
    h += liCount * 26    // li: line-height ~24 + 间距
    if (liCount > 0) h += 32 // ul 自身 margin
    return Math.max(data.minHeight || 80, h)
  }
  // 单列块
  const mk = (data) => {
    const y = cursorY
    const b = { ...data, x: data.x != null ? data.x : PAD_X, y }
    blocks.push(b)
    cursorY = y + estHeight(b) + GAP
    return b
  }
  // 并排两块（同一行）
  const mkRow = (left, right) => {
    const y = cursorY
    const lb = { ...left, y }
    const rb = { ...right, y }
    blocks.push(lb, rb)
    cursorY = y + Math.max(estHeight(lb), estHeight(rb)) + GAP
  }

  if (tplKey === 'character') {
    mkRow(
      { x: PAD_X, width: 320, minHeight: 90, type: 'text', content: '<h2>角色名</h2><p>填写角色基本信息、背景设定</p>' },
      { x: PAD_X + 320 + GAP, width: 260, minHeight: 100, type: 'text', content: '<h3>立绘说明</h3><p>角色立绘的要点与进度备注</p>' }
    )
    mk({ width: 600, minHeight: 130, type: 'text', content: '<h3>属性面板</h3><ul><li>生命值 / 攻击力 / 防御力</li><li>特殊技能</li><li>弱点与抗性</li></ul>' })
    mk({ width: 600, minHeight: 130, type: 'text', content: '<h3>背景故事</h3><p>角色的身世、动机、关键事件...</p>' })
  } else if (tplKey === 'level') {
    mk({ width: 340, minHeight: 90, type: 'text', content: '<h2>关卡名称</h2><p>主题 / 难度 / 时长</p>' })
    mk({ width: 600, minHeight: 100, type: 'text', content: '<h3>关卡目标</h3><p>玩家需要完成什么...</p>' })
    mk({ width: 600, minHeight: 150, type: 'text', content: '<h3>地图结构</h3><ul><li>起点 → 中段 → Boss</li><li>隐藏区域 / 收集品</li></ul>' })
    mk({ width: 300, minHeight: 130, type: 'text', content: '<h3>敌人配置</h3><p>敌人的类型、参数与设计要点</p>' })
  } else if (tplKey === 'system') {
    mk({ width: 340, minHeight: 90, type: 'text', content: '<h2>系统名称</h2><p>一句话描述这个系统</p>' })
    mk({ width: 600, minHeight: 150, type: 'text', content: '<h3>核心机制</h3><p>这个系统如何运作？输入 → 处理 → 输出...</p>' })
    mk({ width: 600, minHeight: 130, type: 'text', content: '<h3>数值平衡</h3><ul><li>成长曲线</li><li>消耗与收益</li></ul>' })
    mk({ width: 300, minHeight: 130, type: 'text', content: '<h3>原型验证</h3><p>原型验证的内容、方法与结论</p>' })
  } else if (tplKey === 'story') {
    mk({ width: 340, minHeight: 90, type: 'text', content: '<h2>故事标题</h2><p>题材 / 基调</p>' })
    mk({ width: 600, minHeight: 100, type: 'text', content: '<h3>第一幕：开端</h3><p>引入、设定、激励事件...</p>' })
    mk({ width: 600, minHeight: 100, type: 'text', content: '<h3>第二幕：发展</h3><p>冲突升级、转折点...</p>' })
    mk({ width: 600, minHeight: 100, type: 'text', content: '<h3>第三幕：结局</h3><p>高潮、解决、余韵...</p>' })
  } else if (tplKey === 'tasks') {
    mk({ width: 340, minHeight: 90, type: 'text', content: '<h2>项目规划</h2><p>分区记录各模块的目标与进度</p>' })
    mkRow(
      { x: PAD_X, width: 290, minHeight: 130, type: 'text', content: '<h3>核心玩法原型</h3><p>阶段目标与说明</p>' },
      { x: PAD_X + 290 + GAP, width: 290, minHeight: 130, type: 'text', content: '<h3>美术资源整理</h3><p>资源清单与进度</p>' }
    )
    mkRow(
      { x: PAD_X, width: 290, minHeight: 130, type: 'text', content: '<h3>音效接入</h3><p>音效清单与进度</p>' },
      { x: PAD_X + 290 + GAP, width: 290, minHeight: 130, type: 'text', content: '<h3>Bug 修复</h3><p>问题记录与修复说明</p>' }
    )
  }
  return blocks
}
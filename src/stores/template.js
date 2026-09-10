import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { generateId, getTimestamp, deepClone } from '@/utils'
import { templatesApi } from '@/api/templates'
import { BUILTIN_TEMPLATES, buildTemplateBlocks } from '@/templates/builtin'

// 可被保存为模板的自包含结构块类型（杜绝外部引用/媒体依赖）
const KEEP_BLOCK_TYPES = new Set(['text', 'table', 'code', 'callout', 'formula'])
// 模板编辑器可创建的块类型
export const EDITABLE_BLOCK_TYPES = ['text', 'table']

export const useTemplateStore = defineStore('template', () => {
  const templates = ref([]) // 自定义模板

  const builtinTemplates = computed(() => {
    return BUILTIN_TEMPLATES.map(t => ({
      id: `builtin:${t.key}`,
      key: t.key,
      name: t.name,
      desc: t.desc,
      icon: t.icon,
      builtin: true
    }))
  })

  /** 内置 + 自定义 合并列表（新建笔记弹窗用） */
  const allTemplates = computed(() => [
    ...builtinTemplates.value,
    ...templates.value.map(t => ({ ...t, builtin: false }))
  ])

  let initPromise = null
  async function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        templates.value = await templatesApi.list()
      } catch (err) {
        console.error('[templateStore] 加载失败:', err)
        templates.value = []
      }
    })()
    return initPromise
  }

  function getTemplateById(tplId) {
    if (!tplId) return null
    const custom = templates.value.find(t => t.id === tplId)
    if (custom) return custom
    const key = String(tplId).replace(/^builtin:/, '')
    const builtin = BUILTIN_TEMPLATES.find(t => t.key === key)
    return builtin ? { ...builtin, builtin: true } : null
  }

  /** 模板 → 模板块数组；内置走生成器，自定义深拷贝 blocks */
  function getBlocksById(tplId) {
    const custom = templates.value.find(t => t.id === tplId)
    if (custom) return deepClone(custom.blocks || [])
    const builtin = getTemplateById(tplId)
    if (builtin && builtin.key) return deepClone(buildTemplateBlocks(builtin.key))
    return []
  }

  /** 过滤出可保存为模型的自包含块，返回 { blocks, dropped } */
  function sanitizeBlocks(blocks) {
    const list = Array.isArray(blocks) ? blocks : []
    const kept = []
    let dropped = 0
    for (const b of list) {
      if (b && KEEP_BLOCK_TYPES.has(b.type)) {
        const { id, updatedAt, createdAt, ...rest } = b
        kept.push(rest)
      } else {
        dropped++
      }
    }
    return { blocks: kept, dropped }
  }

  function create(template) {
    const name = (template.name || '').trim()
    if (!name) throw new Error('模板名称不能为空')
    const now = getTimestamp()
    const record = {
      id: generateId(),
      name,
      desc: template.desc || '',
      icon: template.icon || null,
      blocks: template.blocks || [],
      createdAt: now,
      updatedAt: now
    }
    templates.value.push(record)
    templatesApi.create({
      id: record.id,
      name: record.name,
      desc: record.desc,
      icon: record.icon,
      blocks: record.blocks
    }).catch(err => {
      console.error('创建模板失败:', err)
      const idx = templates.value.findIndex(t => t.id === record.id)
      if (idx >= 0) templates.value.splice(idx, 1)
      throw err
    })
    return record
  }

  function update(id, patch) {
    const tpl = templates.value.find(t => t.id === id)
    if (!tpl) return
    const backup = { ...tpl }
    if (patch.name != null) tpl.name = String(patch.name).trim() || tpl.name
    if (patch.desc != null) tpl.desc = patch.desc
    if (patch.icon != null) tpl.icon = patch.icon
    if (patch.blocks != null) tpl.blocks = deepClone(patch.blocks)
    tpl.updatedAt = getTimestamp()
    templatesApi.update(id, {
      name: tpl.name,
      desc: tpl.desc,
      icon: tpl.icon,
      blocks: tpl.blocks
    }).catch(err => {
      console.error('更新模板失败:', err)
      Object.assign(tpl, backup)
      throw err
    })
  }

  function remove(id) {
    const idx = templates.value.findIndex(t => t.id === id)
    if (idx < 0) return
    const backup = templates.value[idx]
    templates.value.splice(idx, 1)
    templatesApi.delete(id).catch(err => {
      console.error('删除模板失败:', err)
      templates.value.splice(idx, 0, backup)
    })
  }

  function replaceAll(list) {
    templates.value = deepClone(list || [])
  }

  return {
    templates,
    builtinTemplates,
    allTemplates,
    init,
    getTemplateById,
    getBlocksById,
    sanitizeBlocks,
    create,
    update,
    remove,
    replaceAll
  }
})
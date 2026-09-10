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
  const templates = ref([]) // 内置 + 自定义统一存放（builtin 时 isBuiltin=true）

  const builtinTemplates = computed(() => templates.value.filter(t => t.isBuiltin))
  const customTemplates = computed(() => templates.value.filter(t => !t.isBuiltin))

  /** 内置 + 自定义 合并列表（新建笔记弹窗用，内置在前） */
  const allTemplates = computed(() => [
    ...builtinTemplates.value,
    ...customTemplates.value
  ])

  let initPromise = null
  async function init() {
    if (initPromise) return initPromise
    initPromise = (async () => {
      try {
        templates.value = await templatesApi.list()
        await ensureBuiltins()
      } catch (err) {
        console.error('[templateStore] 加载失败:', err)
        templates.value = []
      }
    })()
    return initPromise
  }

  /** 把内置模板初次写入库（isBuiltin=1），使其可像普通模板一样编辑 */
  async function ensureBuiltins() {
    for (const b of BUILTIN_TEMPLATES) {
      if (templates.value.some(t => t.name === b.name)) continue
      const record = {
        id: generateId(),
        name: b.name,
        desc: b.desc,
        icon: b.icon,
        blocks: buildTemplateBlocks(b.key),
        connections: [],
        isBuiltin: true,
        createdAt: getTimestamp(),
        updatedAt: getTimestamp()
      }
      templates.value.push(record)
      try {
        await templatesApi.create({
          id: record.id,
          name: record.name,
          desc: record.desc,
          icon: record.icon,
          blocks: record.blocks,
          connections: record.connections,
          isBuiltin: 1
        })
      } catch (err) {
        console.error('[templateStore] 内置模板初始化失败:', err)
        const idx = templates.value.findIndex(t => t.id === record.id)
        if (idx >= 0) templates.value.splice(idx, 1)
      }
    }
  }

  function getTemplateById(tplId) {
    if (!tplId) return null
    return templates.value.find(t => t.id === tplId) || null
  }

  /** 模板 → 模板块数组（深拷贝，避免污染模板数据） */
  function getBlocksById(tplId) {
    const initLocal = templates.value.find(t => t.id === tplId)
    if (initLocal) return deepClone(initLocal.blocks || [])
    // 兜底：内置模板按 key 生成
    const key = String(tplId).replace(/^builtin:/, '')
    const builtin = BUILTIN_TEMPLATES.find(t => t.key === key)
    if (builtin) return deepClone(buildTemplateBlocks(builtin.key))
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
      connections: template.connections || [],
      createdAt: now,
      updatedAt: now
    }
    templates.value.push(record)
    templatesApi.create({
      id: record.id,
      name: record.name,
      desc: record.desc,
      icon: record.icon,
      blocks: record.blocks,
      connections: record.connections
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
    if (patch.connections != null) tpl.connections = deepClone(patch.connections)
    tpl.updatedAt = getTimestamp()
    templatesApi.update(id, {
      name: tpl.name,
      desc: tpl.desc,
      icon: tpl.icon,
      blocks: tpl.blocks,
      connections: tpl.connections
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
    customTemplates,
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
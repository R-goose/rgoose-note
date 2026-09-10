<template>
  <div class="templates-view">
    <header class="view-header">
      <div class="header-left">
        <h1>模板管理</h1>
        <span class="tpl-total">{{ totalCount }} 个模板</span>
      </div>
      <div class="header-right">
        <button class="btn btn-primary" @click="startCreate">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建模板
        </button>
      </div>
    </header>

    <div class="templates-content">
      <BgDecor />
      <div class="templates-content-inner">
        <!-- 内置模板 -->
        <section v-if="templateStore.builtinTemplates.length" class="tpl-section">
          <div class="section-title">内置模板</div>
          <div class="tpl-grid">
            <div
              v-for="tpl in templateStore.builtinTemplates"
              :key="tpl.id"
              class="tpl-card"
            >
              <div class="tpl-card-head">
                <div class="tpl-icon" v-html="tpl.icon"></div>
                <div class="tpl-name">{{ tpl.name }}</div>
                <span class="builtin-badge">内置</span>
              </div>
              <div class="tpl-desc">{{ tpl.desc }}</div>
              <div class="tpl-card-actions">
                <button class="btn btn-secondary btn-sm" @click="editTemplate(tpl)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  编辑
                </button>
                <button class="btn btn-secondary btn-sm" @click="previewTemplate(tpl)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  预览
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 自定义模板 -->
        <section v-if="templateStore.customTemplates.length" class="tpl-section">
          <div class="section-title">我的模板</div>
          <div class="tpl-grid">
            <div
              v-for="tpl in templateStore.customTemplates"
              :key="tpl.id"
              class="tpl-card"
            >
              <div class="tpl-card-head">
                <div class="tpl-icon" v-html="tpl.icon || defaultTemplateIcon"></div>
                <div class="tpl-name">{{ tpl.name }}</div>
                <span class="block-count">{{ (tpl.blocks || []).length }} 个块</span>
              </div>
              <div class="tpl-desc">{{ tpl.desc || '暂无描述' }}</div>
              <div class="tpl-card-actions">
                <button class="btn btn-secondary btn-sm" @click="editTemplate(tpl)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                  编辑
                </button>
                <button class="btn btn-secondary btn-sm" @click="previewTemplate(tpl)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  预览
                </button>
                <button class="btn btn-danger btn-sm" @click="askDelete(tpl)">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  删除
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- 空状态 -->
        <div v-if="!templateStore.builtinTemplates.length && !templateStore.templates.length" class="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 3h-6.18C14.4 1.84 13.3 1 12 1s-2.4.84-2.82 2H3a1 1 0 0 0-1 1v15a1 1 0 0 0 1 1h18a1 1 0 0 0 1-1V4a1 1 0 0 0-1-1z"/>
            <path d="M7 8h10M7 12h10M7 16h6"/>
          </svg>
          <p>暂无模板</p>
          <span>点击右上角「新建模板」开始创建</span>
        </div>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <Teleport to="body">
      <JellyModal :show="!!previewTpl" @close="previewTpl = null">
        <div class="modal-content preview-modal">
          <h3>{{ previewTpl?.name }}</h3>
          <p class="preview-desc">{{ previewTpl?.desc || '暂无描述' }}</p>
          <div v-if="previewBlocks.length" class="preview-blocks">
            <div
              v-for="b in previewBlocks"
              :key="b.id"
              class="preview-block"
            >
              <span class="preview-type">{{ typeLabel(b.type) }}</span>
              <span class="preview-brief">{{ blockBrief(b) }}</span>
            </div>
          </div>
          <div v-else class="preview-empty">该模板暂无内容块</div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="previewTpl = null">关闭</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>

    <!-- 删除确认 -->
    <Teleport to="body">
      <JellyModal :show="!!tplToDelete" @close="tplToDelete = null">
        <div class="modal-content confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div>
              <h3>删除模板</h3>
              <p>确定删除「{{ tplToDelete?.name }}」吗？该操作不可恢复，已创建的笔记不受影响。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="tplToDelete = null">取消</button>
            <button class="btn btn-primary" @click="confirmDelete">删除</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTemplateStore } from '@/stores/template'
import { useToast } from '@/composables/useToast'
import BgDecor from '@/components/BgDecor.vue'
import JellyModal from '@/components/JellyModal.vue'
import { generateId } from '@/utils'

const router = useRouter()
const templateStore = useTemplateStore()
const { error: toastError } = useToast()

templateStore.init()

const totalCount = computed(() =>
  templateStore.builtinTemplates.length + templateStore.templates.length
)

const defaultTemplateIcon =
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'

const previewTpl = ref(null)
const previewBlocks = ref([])
const tplToDelete = ref(null)

function startCreate() {
  router.push('/templates/new/edit')
}

function editTemplate(tpl) {
  router.push(`/templates/${tpl.id}/edit`)
}

function previewTemplate(tpl) {
  previewTpl.value = tpl
  const blocks = templateStore.getBlocksById(tpl.id)
  previewBlocks.value = blocks.map(b => ({ ...b, id: b.id || generateId() }))
}

function askDelete(tpl) {
  tplToDelete.value = tpl
}

function confirmDelete() {
  if (tplToDelete.value) {
    templateStore.remove(tplToDelete.value.id)
  }
  tplToDelete.value = null
}

function typeLabel(type) {
  const map = { text: '文本', table: '表格', code: '代码', callout: '提示', formula: '公式' }
  return map[type] || type || '块'
}

function blockBrief(b) {
  if (!b) return ''
  if (typeof b.content === 'string') {
    return b.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim().slice(0, 40) || '（空内容）'
  }
  if (b.type === 'table') return '表格数据'
  return ''
}
</script>

<style scoped>
.templates-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px 32px 16px;
  border-bottom: 1px solid var(--border-light);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.header-left h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

.tpl-total {
  font-size: 13px;
  color: var(--text-tertiary);
}

.templates-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 32px 32px;
  position: relative;
}

.templates-content-inner {
  position: relative;
  z-index: 1;
}

.tpl-section {
  margin-bottom: 28px;
}

.section-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary);
  margin-bottom: 12px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 20px;
  color: var(--text-tertiary);
  text-align: center;
}

.empty-state svg {
  color: var(--border-color);
  margin-bottom: 16px;
}

.empty-state p {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.empty-state span {
  font-size: 13px;
}

.tpl-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(258px, 1fr));
  gap: 14px;
}

.tpl-card {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: 8px;
  padding: 15px;
  transition: border-color var(--transition-fast), background var(--transition-fast);
}

.tpl-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 34%, var(--border-color));
  background: var(--bg-tertiary);
}

.tpl-card-head {
  display: flex;
  align-items: center;
  gap: 9px;
  margin-bottom: 10px;
}

.tpl-icon {
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.tpl-name {
  flex: 1;
  font-size: 15px;
  font-weight: 650;
  color: var(--text-primary);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.builtin-badge {
  flex-shrink: 0;
  font-size: 11px;
  padding: 3px 8px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  color: var(--text-tertiary);
}

.block-count {
  flex-shrink: 0;
  font-size: 12px;
  color: var(--text-tertiary);
}

.tpl-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 12px;
  min-height: 36px;
}

.tpl-card-actions {
  display: flex;
  gap: 8px;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 7px 12px;
  border-radius: var(--radius-sm);
  font-size: 12.5px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border-light);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-dark);
  background: var(--primary-soft);
}

.btn-primary {
  border-color: transparent;
  background: var(--primary-color);
  color: #fff;
}

.btn-primary:hover {
  background: var(--primary-color);
  filter: brightness(1.05);
  color: #fff;
}

.btn-danger:hover {
  border-color: var(--warning-color);
  color: var(--warning-color);
  background: var(--warning-soft);
}

.btn-sm {
  padding: 5px 9px;
  font-size: 12px;
}

.preview-modal {
  width: 440px;
  max-width: 90vw;
  padding: 24px;
}

.preview-modal h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--text-primary);
}

.preview-desc {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
}

.preview-blocks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 20px;
  max-height: 320px;
  overflow-y: auto;
}

.preview-block {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
}

.preview-type {
  flex-shrink: 0;
  font-size: 11.5px;
  padding: 3px 8px;
  border-radius: 5px;
  background: var(--primary-soft);
  color: var(--primary-dark);
  font-weight: 600;
}

.preview-brief {
  font-size: 12.5px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  min-width: 0;
}

.preview-empty {
  color: var(--text-tertiary);
  font-size: 13px;
  margin-bottom: 20px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.confirm-modal {
  width: 420px;
  max-width: 90vw;
  padding: 24px;
}

.confirm-header {
  display: flex;
  gap: 14px;
  margin-bottom: 20px;
}

.confirm-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.confirm-icon.warning {
  background: var(--warning-soft);
  color: var(--warning-color);
}

.confirm-header h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.confirm-header p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
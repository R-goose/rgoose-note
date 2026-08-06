<template>
  <div class="notes-view">
    <header class="view-header">
      <div class="header-left">
        <h1>{{ currentFolderName }}</h1>
        <span class="note-count">{{ filteredNotes.length }} 篇笔记</span>
      </div>
      <div class="header-right">
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            ref="searchInputRef"
            v-model="searchKeyword"
            type="text"
            placeholder="搜索笔记（Ctrl+F）..."
            class="search-input"
            @keydown.esc="searchKeyword = ''"
          />
        </div>
        <button class="btn btn-primary" @click="createNote">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          新建笔记
        </button>
      </div>
    </header>
    
    <div class="notes-content">
      <BgDecor />
      <div class="notes-content-inner">
      <div v-if="!noteStore.currentFolderId" class="all-folders-view">
        <div v-if="activeTagFilter || activeFolderTagFilter" class="tag-filter-bar">
          <span class="tag-filter-label">筛选中：</span>
          <span v-if="activeTagFilter" class="tag-filter-chip" :style="tagChipStyle(activeTagFilter)" @click="clearTagFilter">
            {{ tagName(activeTagFilter) }} 笔记
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
          <span v-if="activeFolderTagFilter" class="tag-filter-chip" :style="tagChipStyle(activeFolderTagFilter)" @click="clearFolderTagFilter">
            {{ tagName(activeFolderTagFilter) }} 文件夹
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </span>
        </div>
        <div v-if="filteredFolders.length > 0" class="folder-grid-section">
          <h2 class="grid-section-title">全部文件夹</h2>
          <div class="folder-card-grid">
            <article
              v-for="folder in filteredFolders"
              :key="folder.id"
              class="folder-card"
              :style="folderStyle(folder.id)"
              @click="enterFolder(folder.id)"
              @contextmenu.prevent="onFolderContextMenu($event, folder)"
            >
              <svg class="folder-card-wave" viewBox="0 0 200 60" preserveAspectRatio="none" aria-hidden="true">
                <path d="M0,40 C40,20 80,55 120,35 C160,15 180,45 200,30 L200,60 L0,60 Z" fill="currentColor"/>
              </svg>
              <div class="folder-card-inner">
                <div class="folder-card-icon" :class="{ 'folder-card-icon-child': folder.parentId }">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                  </svg>
                </div>
                <div class="folder-card-content">
                  <span v-if="getParentFolderName(folder)" class="folder-card-parent" :title="`位于：${getParentFolderName(folder)}`">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    <span class="folder-card-parent-name">{{ getParentFolderName(folder) }}</span>
                  </span>
                  <h3 class="folder-card-name">{{ folder.name }}</h3>
                  <p class="folder-card-meta">
                    <span class="folder-card-count">{{ countNotesInFolder(folder.id) }}</span> 篇笔记
                  </p>
                </div>
                <span class="folder-card-dot"></span>
              </div>
            </article>
          </div>
        </div>
        <div v-if="filteredNotes.length > 0" class="all-notes-section">
          <h2 class="grid-section-title">全部笔记 <span class="section-count">{{ filteredNotes.length }}</span></h2>
          <div class="notes-grid">
            <article
              v-for="note in filteredNotes"
              :key="note.id"
              class="note-card"
              :style="noteStyle(note)"
              @click="openNote(note.id)"
              @contextmenu.prevent="onNoteContextMenu($event, note)"
            >
              <div class="note-card-media" :class="{ 'has-cover': getNoteCover(note) }">
                <img v-if="getNoteCover(note)" :src="getNoteCover(note)" alt="" loading="lazy" />
                <div v-else class="note-card-title-cover">
                  <span>{{ (note.title || '无标题').slice(0, 6) }}</span>
                </div>
                <span class="note-card-blocks">{{ note.blocks?.length || 0 }}</span>
              </div>
              <div class="note-card-body">
                <h3 class="note-card-title">{{ note.title || '无标题笔记' }}</h3>
                <p class="note-card-preview">{{ getNotePreview(note) }}</p>
                <div class="note-card-foot">
                  <span v-if="note.folderId" class="note-card-folder">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                    </svg>
                    {{ getFolderPath(note.folderId) }}
                  </span>
                  <span class="note-card-date">{{ formatDate(note.updatedAt) }}</span>
                </div>
                <div v-if="noteTagList(note).length" class="note-card-tags">
                  <span
                    v-for="t in noteTagList(note)"
                    :key="t.id"
                    class="note-tag-chip"
                    :style="{ background: t.color + '22', color: t.color }"
                    @click.stop="filterByTag(t.id)"
                  >{{ t.name }}</span>
                </div>
              </div>
            </article>
          </div>
        </div>
        <div v-if="filteredFolders.length === 0 && filteredNotes.length === 0" class="empty-state">
          <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M20 30h30l10 12h40v48H20z"/>
            <path d="M20 42h80"/>
          </svg>
          <p>还没有文件夹或笔记</p>
        </div>
      </div>
      
      <div v-else-if="filteredNotes.length === 0" class="empty-state">
        <svg viewBox="0 0 120 120" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="32" y="20" width="56" height="80" rx="4"/>
          <path d="M44 40h32M44 56h32M44 72h20"/>
        </svg>
        <p>{{ searchKeyword ? '没有找到匹配的笔记' : '这个文件夹还没有笔记' }}</p>
        <button v-if="!searchKeyword" class="btn btn-primary" @click="createNote">创建第一篇笔记</button>
      </div>
      
      <div v-else class="notes-grid">
        <article
          v-for="note in filteredNotes"
          :key="note.id"
          class="note-card"
          :style="noteStyle(note)"
          @click="openNote(note.id)"
          @contextmenu.prevent="onNoteContextMenu($event, note)"
        >
          <div class="note-card-media" :class="{ 'has-cover': getNoteCover(note) }">
            <img v-if="getNoteCover(note)" :src="getNoteCover(note)" alt="" loading="lazy" />
            <div v-else class="note-card-title-cover">
              <span>{{ (note.title || '无标题').slice(0, 6) }}</span>
            </div>
            <span class="note-card-blocks">{{ note.blocks?.length || 0 }}</span>
            <div class="note-card-actions">
              <button class="note-action" @click.stop="duplicateNote(note)" title="复制">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2"/>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
                </svg>
              </button>
              <button class="note-action note-del" @click.stop="deleteNote(note.id)" title="删除">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
          <div class="note-card-body">
            <h3 class="note-card-title">{{ note.title || '无标题笔记' }}</h3>
            <p class="note-card-preview">{{ getNotePreview(note) }}</p>
            <div class="note-card-foot">
              <span v-if="note.folderId" class="note-card-folder">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
                </svg>
                {{ getFolderPath(note.folderId) }}
              </span>
              <span class="note-card-date">{{ formatDate(note.updatedAt) }}</span>
            </div>
            <div v-if="noteTagList(note).length" class="note-card-tags">
              <span
                v-for="t in noteTagList(note)"
                :key="t.id"
                class="note-tag-chip"
                :style="{ background: t.color + '22', color: t.color }"
                @click.stop="filterByTag(t.id)"
              >{{ t.name }}</span>
            </div>
          </div>
        </article>
      </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="showCreateModal" class="modal-overlay" @click.self="cancelCreateNote">
        <div class="modal-content create-note-modal">
          <h3>新建笔记</h3>
          <input
            ref="noteTitleInputRef"
            v-model="newNoteTitle"
            type="text"
            class="input"
            :class="{ 'input-error': createError }"
            placeholder="请输入笔记名称"
            maxlength="100"
            @keyup.enter="confirmCreateNote"
            @keyup.esc="cancelCreateNote"
            @input="createError = ''"
          />
          <div v-if="createError" class="field-error-tip">{{ createError }}</div>
          <div class="template-section">
            <div class="template-section-label">选择模板（可选）</div>
            <div class="template-grid">
              <div
                v-for="tpl in NOTE_TEMPLATES"
                :key="tpl.key"
                class="template-card"
                :class="{ active: selectedTemplate === tpl.key }"
                @click="selectedTemplate = selectedTemplate === tpl.key ? null : tpl.key"
              >
                <div class="template-card-icon" v-html="tpl.icon"></div>
                <div class="template-card-name">{{ tpl.name }}</div>
                <div class="template-card-desc">{{ tpl.desc }}</div>
              </div>
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="cancelCreateNote">取消</button>
            <button class="btn btn-primary" @click="confirmCreateNote">创建</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div
        v-if="contextMenu.show"
        class="context-menu"
        :style="contextMenuStyle"
        @click.stop
      >
        <template v-if="contextMenu.type === 'note'">
          <button class="context-menu-item" @click="execCtxAction('open')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span>打开笔记</span>
          </button>
          <button class="context-menu-item" @click="execCtxAction('duplicate')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <rect x="9" y="9" width="13" height="13" rx="2"/>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
            </svg>
            <span>复制副本</span>
          </button>
          <button class="context-menu-item" @click="execCtxAction('tags')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            <span>设置标签</span>
          </button>
          <button class="context-menu-item" @click="execCtxAction('move')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>移动到…</span>
          </button>
          <div class="context-menu-divider" v-if="!contextMenu.target?.isSystem"></div>
          <button class="context-menu-item danger" @click="execCtxAction('delete')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>删除</span>
          </button>
        </template>
        <template v-else-if="contextMenu.type === 'folder'">
          <button class="context-menu-item" @click="execCtxAction('enter')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <span>打开文件夹</span>
          </button>
          <button v-if="!contextMenu.target?.isSystem" class="context-menu-item" @click="execCtxAction('rename')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
            <span>重命名</span>
          </button>
          <button class="context-menu-item" @click="execCtxAction('tags')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
              <line x1="7" y1="7" x2="7.01" y2="7"/>
            </svg>
            <span>设置标签</span>
          </button>
          <div class="context-menu-divider" v-if="!contextMenu.target?.isSystem"></div>
          <button v-if="!contextMenu.target?.isSystem" class="context-menu-item danger" @click="execCtxAction('delete')">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
            <span>删除</span>
          </button>
        </template>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="renameState.show" class="modal-overlay" @click.self="cancelRename">
        <div class="modal-content create-note-modal">
          <h3>重命名文件夹</h3>
          <input
            v-model="renameState.name"
            type="text"
            class="input"
            placeholder="请输入新名称"
            maxlength="50"
            @keyup.enter="confirmRename"
            @keyup.esc="cancelRename"
          />
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="cancelRename">取消</button>
            <button class="btn btn-primary" @click="confirmRename">确定</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="deleteFolderState.show" class="modal-overlay" @click.self="deleteFolderState.show = false">
        <div class="modal-content confirm-modal">
          <div class="confirm-header">
            <div class="confirm-icon warning">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <div>
              <h3>确认删除文件夹</h3>
              <p>确定删除文件夹「{{ deleteFolderState.target?.name }}」？文件夹内的笔记不会被删除。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="deleteFolderState.show = false">取消</button>
            <button class="btn btn-primary" @click="confirmDeleteFolder">确认删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="tagPickerState.show" class="modal-overlay" @click.self="closeTagPicker">
        <div class="modal-content tag-target-modal">
          <h3>设置标签</h3>
          <input
            v-model="tagPickerState.search"
            type="text"
            class="input"
            placeholder="搜索或创建标签..."
            @keyup.enter="createTagForTarget"
          />
          <div class="tag-target-list">
            <div
              v-for="t in tagPickerAvailable"
              :key="t.id"
              class="tag-target-item"
              :class="{ selected: tagPickerCurrent.includes(t.id) }"
              @click="toggleTargetTag(t.id)"
            >
              <span class="tag-dot" :style="{ background: t.color }"></span>
              <span class="tag-target-name">{{ t.name }}</span>
              <svg v-if="tagPickerCurrent.includes(t.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div
              v-if="tagPickerState.search.trim() && !tagStore.tags.some(t => t.name.toLowerCase() === tagPickerState.search.trim().toLowerCase())"
              class="tag-target-create"
              @click="createTagForTarget"
            >
              创建「{{ tagPickerState.search.trim() }}」
            </div>
            <div v-if="!tagStore.tags.length && !tagPickerState.search.trim()" class="tag-target-empty">
              还没有标签，输入名称创建
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="closeTagPicker">完成</button>
          </div>
        </div>
      </div>
    </Teleport>

    <Teleport to="body">
      <div v-if="moveFolderState.show" class="modal-overlay" @click.self="closeMoveFolderPicker">
        <div class="modal-content move-folder-modal">
          <h3>移动笔记到文件夹</h3>
          <div class="move-folder-list">
            <div
              class="move-folder-item"
              :class="{ selected: !moveTargetNote?.folderId }"
              @click="moveNoteToTargetFolder(null)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              <span class="move-folder-name">根目录（不放入任何文件夹）</span>
              <svg v-if="!moveTargetNote?.folderId" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div
              v-for="f in noteStore.sortedFolders"
              :key="f.id"
              class="move-folder-item"
              :class="{ selected: moveTargetNote?.folderId === f.id }"
              @click="moveNoteToTargetFolder(f.id)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
              <span class="move-folder-name">{{ getFolderPath(f.id) }}</span>
              <svg v-if="moveTargetNote?.folderId === f.id" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div v-if="!noteStore.sortedFolders.length" class="move-folder-empty">还没有文件夹，请先在侧边栏创建</div>
          </div>
          <div class="modal-actions">
            <button class="btn" @click="closeMoveFolderPicker">取消</button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, reactive, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { useTagStore, TAG_PRESET_COLORS } from '@/stores/tag'
import { useToast } from '@/composables/useToast'
import { formatDate as formatDateUtil } from '@/utils'
import { resolveImageUrl, isImageRef } from '@/utils/imageStore'
import BgDecor from '@/components/BgDecor.vue'

const router = useRouter()
const route = useRoute()
const noteStore = useNoteStore()
const tagStore = useTagStore()
const { error: toastError } = useToast()
tagStore.init()
const searchKeyword = ref('')
const searchInputRef = ref(null)
const activeTagFilter = ref(null)
const activeFolderTagFilter = ref(null)
const showCreateModal = ref(false)
const newNoteTitle = ref('')
const createError = ref('')
const selectedTemplate = ref(null)
const noteTitleInputRef = ref(null)

// 笔记模板库
const NOTE_TEMPLATES = [
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
    name: '任务清单',
    desc: '开发待办管理',
    icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>'
  }
]

function buildTemplateBlocks(tplKey) {
  const PAD_X = 60
  const GAP = 24
  const blocks = []
  let cursorY = 60
  // 估算块渲染高度（文本块含标题/列表实际更高），用于推算下一块 y，避免重叠
  const estHeight = (data) => {
    if (data.type === 'todo') return 110
    // 文本块：根据内容粗略估算
    const html = data.content || ''
    const lines = (html.match(/<li/g) || []).length + (html.match(/<p/g) || []).length
    const hasH2 = /<h2/.test(html)
    const hasH3 = /<h3/.test(html)
    let h = 70 + lines * 26
    if (hasH2) h += 20
    if (hasH3) h += 16
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
      { x: PAD_X + 320 + GAP, width: 260, minHeight: 90, type: 'todo', title: '完成角色立绘', status: 'todo', priority: 'normal', dueDate: null, content: '' }
    )
    mk({ width: 600, minHeight: 130, type: 'text', content: '<h3>属性面板</h3><ul><li>生命值 / 攻击力 / 防御力</li><li>特殊技能</li><li>弱点与抗性</li></ul>' })
    mk({ width: 600, minHeight: 130, type: 'text', content: '<h3>背景故事</h3><p>角色的身世、动机、关键事件...</p>' })
  } else if (tplKey === 'level') {
    mk({ width: 340, minHeight: 90, type: 'text', content: '<h2>关卡名称</h2><p>主题 / 难度 / 时长</p>' })
    mk({ width: 600, minHeight: 100, type: 'text', content: '<h3>关卡目标</h3><p>玩家需要完成什么...</p>' })
    mk({ width: 600, minHeight: 150, type: 'text', content: '<h3>地图结构</h3><ul><li>起点 → 中段 → Boss</li><li>隐藏区域 / 收集品</li></ul>' })
    mk({ width: 300, minHeight: 100, type: 'todo', title: '设计敌人配置', status: 'todo', priority: 'high', dueDate: null, content: '' })
  } else if (tplKey === 'system') {
    mk({ width: 340, minHeight: 90, type: 'text', content: '<h2>系统名称</h2><p>一句话描述这个系统</p>' })
    mk({ width: 600, minHeight: 150, type: 'text', content: '<h3>核心机制</h3><p>这个系统如何运作？输入 → 处理 → 输出...</p>' })
    mk({ width: 600, minHeight: 130, type: 'text', content: '<h3>数值平衡</h3><ul><li>成长曲线</li><li>消耗与收益</li></ul>' })
    mk({ width: 300, minHeight: 100, type: 'todo', title: '原型验证', status: 'todo', priority: 'normal', dueDate: null, content: '' })
  } else if (tplKey === 'story') {
    mk({ width: 340, minHeight: 90, type: 'text', content: '<h2>故事标题</h2><p>题材 / 基调</p>' })
    mk({ width: 600, minHeight: 100, type: 'text', content: '<h3>第一幕：开端</h3><p>引入、设定、激励事件...</p>' })
    mk({ width: 600, minHeight: 100, type: 'text', content: '<h3>第二幕：发展</h3><p>冲突升级、转折点...</p>' })
    mk({ width: 600, minHeight: 100, type: 'text', content: '<h3>第三幕：结局</h3><p>高潮、解决、余韵...</p>' })
  } else if (tplKey === 'tasks') {
    mk({ width: 340, minHeight: 90, type: 'text', content: '<h2>项目待办</h2><p>按优先级跟踪开发进度</p>' })
    mkRow(
      { x: PAD_X, width: 290, minHeight: 100, type: 'todo', title: '核心玩法原型', status: 'doing', priority: 'high', dueDate: null, content: '' },
      { x: PAD_X + 290 + GAP, width: 290, minHeight: 100, type: 'todo', title: '美术资源整理', status: 'todo', priority: 'normal', dueDate: null, content: '' }
    )
    mkRow(
      { x: PAD_X, width: 290, minHeight: 100, type: 'todo', title: '音效接入', status: 'todo', priority: 'low', dueDate: null, content: '' },
      { x: PAD_X + 290 + GAP, width: 290, minHeight: 100, type: 'todo', title: 'Bug 修复', status: 'paused', priority: 'normal', dueDate: null, content: '' }
    )
  }
  return blocks
}

const currentFolderName = computed(() => {
  if (!noteStore.currentFolderId) return '笔记'
  return noteStore.folders.find(f => f.id === noteStore.currentFolderId)?.name || '笔记'
})

const allFolders = computed(() => noteStore.sortedFolders)

function enterFolder(folderId) {
  noteStore.setCurrentFolder(noteStore.currentFolderId === folderId ? null : folderId)
}

function countNotesInFolder(folderId) {
  return noteStore.notes.filter(n => !n.deleted && n.folderId === folderId).length
}

/** 根据笔记数量计算气泡尺寸和不规则圆角 */
function folderStyle(folderId) {
  const count = countNotesInFolder(folderId)
  const t = Math.min(1, Math.log2(count + 1) / 5) // 0~1，32篇到上限

  // 气泡尺寸：宽高协调，笔记越多越大
  const base = 120 + t * 90                              // 120~210px 基准边长
  // hash 决定每个文件夹的宽高比偏移，让气泡有胖有瘦
  const hash = folderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const wRatio = 1 + ((hash % 5) - 2) * 0.06             // 0.88~1.08
  const hRatio = 1 + ((hash >> 4) % 5 - 2) * 0.06        // 0.88~1.08
  const width = Math.round(base * wRatio)
  const height = Math.round(base * hRatio)

  // 被风吹的不规则圆角：高百分比(40~60%)，四角不同
  const wind = (seed) => 42 + ((hash >> seed) % 7) * 3   // 42~60
  const r1 = wind(0), r2 = wind(2), r3 = wind(5), r4 = wind(8)
  // 垂直半径也各不同，增强不规则感
  const rv1 = wind(1), rv2 = wind(3), rv3 = wind(6), rv4 = wind(9)

  return {
    '--fw': `${width}px`,
    '--fh': `${height}px`,
    '--fr': `${r1}% ${r2}% ${r3}% ${r4}% / ${rv1}% ${rv2}% ${rv3}% ${rv4}%`,
    '--folder-t': t.toFixed(2)
  }
}

function getParentFolderName(folder) {
  if (!folder || !folder.parentId) return ''
  const parent = noteStore.folders.find(f => f.id === folder.parentId && !f.deleted)
  return parent?.name || ''
}

const filteredNotes = computed(() => {
  let notes
  if (activeTagFilter.value) {
    notes = noteStore.notes.filter(n => !n.deleted && Array.isArray(n.tags) && n.tags.includes(activeTagFilter.value))
  } else if (noteStore.currentFolderId) {
    notes = noteStore.currentFolderNotes || []
  } else {
    notes = noteStore.notes.filter(n => !n.deleted)
  }
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    notes = notes.filter(note => noteMatchesKeyword(note, keyword))
  }
  return notes.sort((a, b) => b.updatedAt - a.updatedAt)
})

const filteredFolders = computed(() => {
  if (!activeFolderTagFilter.value) return noteStore.sortedFolders
  return noteStore.sortedFolders.filter(f => Array.isArray(f.tags) && f.tags.includes(activeFolderTagFilter.value))
})

function tagName(id) {
  return tagStore.getTag(id)?.name || ''
}

function tagColor(id) {
  return tagStore.getTag(id)?.color || '#999'
}

function tagChipStyle(id) {
  const color = tagColor(id)
  return { background: color + '22', color, borderColor: color + '55' }
}

function noteTagList(note) {
  if (!Array.isArray(note.tags) || !note.tags.length) return []
  return note.tags.slice(0, 3).map(id => ({ id, name: tagName(id), color: tagColor(id) }))
}

function clearTagFilter() {
  activeTagFilter.value = null
  router.replace({ path: '/notes', query: {} })
}

function clearFolderTagFilter() {
  activeFolderTagFilter.value = null
  router.replace({ path: '/notes', query: {} })
}

function filterByTag(tagId) {
  activeTagFilter.value = tagId
  activeFolderTagFilter.value = null
  router.replace({ path: '/notes', query: { tag: tagId } })
}

watch(() => route.query, (q) => {
  activeTagFilter.value = q.tag || null
  activeFolderTagFilter.value = q.folderTag || null
}, { immediate: true })

function createNote() {
  newNoteTitle.value = ''
  createError.value = ''
  selectedTemplate.value = null
  showCreateModal.value = true
  nextTick(() => noteTitleInputRef.value?.focus())
}

function confirmCreateNote() {
  const title = newNoteTitle.value.trim()
  if (!title) {
    createError.value = '请输入笔记名称'
    toastError('请输入笔记名称')
    noteTitleInputRef.value?.focus()
    return
  }
  const note = noteStore.createNote(title)
  // 应用模板：向新笔记追加预设块
  if (selectedTemplate.value && selectedTemplate.value !== 'blank') {
    const tplBlocks = buildTemplateBlocks(selectedTemplate.value)
    for (const b of tplBlocks) {
      noteStore.addBlock(note.id, b)
    }
  }
  showCreateModal.value = false
  newNoteTitle.value = ''
  createError.value = ''
  selectedTemplate.value = null
  router.push(`/note/${note.id}`)
}

function cancelCreateNote() {
  showCreateModal.value = false
  newNoteTitle.value = ''
  selectedTemplate.value = null
}

function openNote(id) {
  router.push(`/note/${id}`)
}

function duplicateNote(note) {
  const newNote = noteStore.duplicateNote(note.id)
  if (newNote) router.push(`/note/${newNote.id}`)
}

function deleteNote(id) {
  noteStore.deleteNote(id)
}

function getNotePreview(note) {
  if (!note.blocks?.length) return '空白笔记'
  const firstTextBlock = note.blocks.find(block => block.type === 'text' && block.content)
  if (!firstTextBlock) return `${note.blocks.length} 个内容块`
  const div = document.createElement('div')
  div.innerHTML = firstTextBlock.content
  return div.textContent?.slice(0, 80) || '空白笔记'
}

/** 计算笔记内容大小，返回 CSS 变量控制卡片尺寸/圆角/装饰 */
function noteStyle(note) {
  // 估算笔记内容量：blocks 数量 + 各块 content 长度
  let size = 0
  if (note.blocks?.length) {
    for (const b of note.blocks) {
      if (b.content) size += b.content.length
      size += 50 // 每个块的基础大小
    }
  }
  // 归一化到 0~1，约 3000 字到达上限
  const t = Math.min(1, size / 3000)

  // 尺寸：区分度比文件夹小，244~300px
  const hash = note.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const wRatio = 1 + ((hash % 5) - 2) * 0.03   // 微小宽高比差异
  const hRatio = 1 + ((hash >> 4) % 5 - 2) * 0.03
  const baseW = 244 + t * 56                    // 244~300px
  const baseH = 300 + t * 50                    // 300~350px

  // 圆角：轻微不规则
  const r = 14 + t * 6                          // 14~20px 基础
  const d = 3                                   // 偏移小
  const r1 = r + (hash % 4 - 1) * d
  const r2 = r + ((hash >> 3) % 4 - 1) * d
  const r3 = r + ((hash >> 6) % 4 - 1) * d
  const r4 = r + ((hash >> 9) % 4 - 1) * d

  return {
    '--note-w': `${Math.round(baseW * wRatio)}px`,
    '--note-h': `${Math.round(baseH * hRatio)}px`,
    '--note-r': `${r1}px ${r2}px ${r3}px ${r4}px`,
    '--note-t': t.toFixed(2)
  }
}

function noteMatchesKeyword(note, kw) {
  if (!kw) return true
  if ((note.title || '').toLowerCase().includes(kw)) return true
  // 按标签名搜索
  if (Array.isArray(note.tags) && note.tags.some(tid => {
    const tname = tagStore.getTag(tid)?.name || ''
    return tname.toLowerCase().includes(kw)
  })) return true
  if (!note.blocks?.length) return false
  const tmp = document.createElement('div')
  return note.blocks.some(b => {
    if (b.type === 'text' && b.content) {
      tmp.innerHTML = b.content
      return (tmp.textContent || '').toLowerCase().includes(kw)
    }
    return false
  })
}

const resolvedCovers = reactive({})

async function resolveCover(note) {
  const raw = getNoteCoverRaw(note)
  if (!raw) { resolvedCovers[note.id] = null; return }
  if (isImageRef(raw)) {
    resolvedCovers[note.id] = await resolveImageUrl(raw)
  } else {
    resolvedCovers[note.id] = raw
  }
}

watch(filteredNotes, (notes) => {
  notes.forEach(n => resolveCover(n))
}, { immediate: true })

function getNoteCoverRaw(note) {
  if (!note.blocks?.length) return null
  const imgBlock = note.blocks.find(b => b.type === 'image' && b.imageUrl)
  return imgBlock?.imageUrl || null
}

function getNoteCover(note) {
  return resolvedCovers[note.id] || null
}

function getFolderPath(folderId) {
  return noteStore.getFolderPathString(folderId)
}

function formatDate(timestamp) {
  return formatDateUtil(timestamp, 'MM月DD日')
}

const contextMenu = ref({ show: false, type: 'note', x: 0, y: 0, target: null })
const contextMenuStyle = computed(() => ({ left: `${contextMenu.value.x}px`, top: `${contextMenu.value.y}px` }))

const renameState = ref({ show: false, id: '', name: '', isFolder: false })
const deleteFolderState = ref({ show: false, target: null })
const tagPickerState = ref({ show: false, targetId: '', isFolder: false, search: '' })
const moveFolderState = ref({ show: false, noteId: '' })

const moveTargetNote = computed(() => noteStore.notes.find(n => n.id === moveFolderState.value.noteId))

const tagPickerAvailable = computed(() => {
  const kw = tagPickerState.value.search.trim().toLowerCase()
  return tagStore.tags
    .filter(t => !kw || t.name.toLowerCase().includes(kw))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
})

const tagPickerCurrent = computed(() => {
  if (!tagPickerState.value.targetId) return []
  const item = tagPickerState.value.isFolder
    ? noteStore.folders.find(f => f.id === tagPickerState.value.targetId)
    : noteStore.notes.find(n => n.id === tagPickerState.value.targetId)
  return Array.isArray(item?.tags) ? item.tags : []
})

function onNoteContextMenu(e, note) {
  contextMenu.value = { show: true, type: 'note', x: e.clientX, y: e.clientY, target: note }
}
function onFolderContextMenu(e, folder) {
  contextMenu.value = { show: true, type: 'folder', x: e.clientX, y: e.clientY, target: folder }
}
function closeContextMenu() {
  contextMenu.value.show = false
}
function execCtxAction(action) {
  const { type, target } = contextMenu.value
  closeContextMenu()
  if (!target) return
  if (type === 'note') {
    if (action === 'open') openNote(target.id)
    else if (action === 'duplicate') duplicateNote(target)
    else if (action === 'delete') deleteNote(target.id)
    else if (action === 'tags') {
      tagPickerState.value = { show: true, targetId: target.id, isFolder: false, search: '' }
    }
    else if (action === 'move') {
      moveFolderState.value = { show: true, noteId: target.id }
    }
  } else if (type === 'folder') {
    if (action === 'enter') enterFolder(target.id)
    else if (action === 'rename') {
      renameState.value = { show: true, id: target.id, name: target.name, isFolder: true }
    } else if (action === 'tags') {
      tagPickerState.value = { show: true, targetId: target.id, isFolder: true, search: '' }
    } else if (action === 'delete') {
      deleteFolderState.value = { show: true, target }
    }
  }
}

function toggleTargetTag(tagId) {
  const { targetId, isFolder } = tagPickerState.value
  if (!targetId) return
  const item = isFolder
    ? noteStore.folders.find(f => f.id === targetId)
    : noteStore.notes.find(n => n.id === targetId)
  if (!item) return
  const current = Array.isArray(item.tags) ? [...item.tags] : []
  const idx = current.indexOf(tagId)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(tagId)
  if (isFolder) noteStore.setFolderTags(targetId, current)
  else noteStore.setNoteTags(targetId, current)
}

function createTagForTarget() {
  const name = tagPickerState.value.search.trim()
  if (!name) {
    toastError('请输入标签名称')
    return
  }
  let tag = tagStore.tags.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (!tag) {
    tag = tagStore.createTag(name, TAG_PRESET_COLORS[tagStore.tags.length % TAG_PRESET_COLORS.length])
  }
  if (tag && !tagPickerCurrent.value.includes(tag.id)) {
    toggleTargetTag(tag.id)
  }
  tagPickerState.value.search = ''
}

function closeTagPicker() {
  tagPickerState.value.show = false
  tagPickerState.value.search = ''
}

function moveNoteToTargetFolder(folderId) {
  if (!moveFolderState.value.noteId) return
  noteStore.moveNoteToFolder(moveFolderState.value.noteId, folderId)
  moveFolderState.value = { show: false, noteId: '' }
}

function closeMoveFolderPicker() {
  moveFolderState.value = { show: false, noteId: '' }
}
function confirmRename() {
  const name = renameState.value.name.trim()
  if (!name) {
    toastError('请输入文件夹名称')
    return
  }
  if (renameState.value.id) {
    noteStore.renameFolder(renameState.value.id, name)
  }
  renameState.value.show = false
}
function cancelRename() {
  renameState.value.show = false
}
function confirmDeleteFolder() {
  if (deleteFolderState.value.target) {
    noteStore.deleteFolder(deleteFolderState.value.target.id)
  }
  deleteFolderState.value.show = false
}
function onGlobalClick(e) {
  if (contextMenu.value.show && !e.target.closest('.context-menu')) closeContextMenu()
}
function onSearchShortcut(e) {
  if ((e.ctrlKey || e.metaKey) && (e.key === 'f' || e.key === 'F')) {
    e.preventDefault()
    nextTick(() => {
      searchInputRef.value?.focus()
      searchInputRef.value?.select()
    })
  }
}

onMounted(() => {
  window.addEventListener('keydown', onSearchShortcut)
  window.addEventListener('mousedown', onGlobalClick)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onSearchShortcut)
  window.removeEventListener('mousedown', onGlobalClick)
})
</script>

<style scoped>
.notes-view {
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.view-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 28px;
  border-bottom: 1px solid var(--border-light);
  background: var(--bg-secondary);
  flex-shrink: 0;
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

.note-count {
  font-size: 12px;
  font-weight: 500;
  color: var(--purple-dark);
  background: var(--purple-softer);
  padding: 3px 10px;
  border-radius: 10px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.search-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  width: 280px;
  transition: all var(--transition-fast);
}

.search-box:focus-within {
  background: var(--bg-secondary);
  box-shadow: 0 0 0 1.5px var(--primary-color);
}

.search-box:focus-within svg {
  color: var(--primary-color);
}

.search-box svg {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  background: transparent;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

.search-input:focus-visible {
  outline: none;
}

.notes-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  position: relative;
}

.notes-content-inner {
  position: relative;
  z-index: 1;
}

.all-folders-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.grid-section-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-count {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.folder-card-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
}

.folder-card {
  position: relative;
  overflow: hidden;
  padding: 18px;
  background: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--primary-color) calc(var(--folder-t, 0) * 8%), var(--border-light));
  cursor: pointer;
  transition: all var(--transition-normal);
  /* 气泡尺寸和不规则圆角由 CSS 变量驱动 */
  width: var(--fw, 140px);
  height: var(--fh, 140px);
  border-radius: var(--fr, 45% 50% 42% 48% / 48% 42% 50% 44%);
}

.folder-card-wave {
  position: absolute;
  right: -10px;
  bottom: -10px;
  /* 笔记越多装饰越大：130px → 200px */
  width: calc(130px + var(--folder-t, 0) * 70px);
  height: calc(50px + var(--folder-t, 0) * 30px);
  color: var(--primary-color);
  /* 笔记越多装饰越深：0.08 → 0.22 */
  opacity: calc(0.08 + var(--folder-t, 0) * 0.14);
  transition: opacity var(--transition-normal), transform var(--transition-normal);
  pointer-events: none;
}

.folder-card-inner {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 100%;
  text-align: center;
}

.folder-card-icon {
  flex-shrink: 0;
  /* 笔记越多图标越大：40px → 52px */
  width: calc(40px + var(--folder-t, 0) * 12px);
  height: calc(40px + var(--folder-t, 0) * 12px);
  border-radius: 50%;
  background: linear-gradient(135deg, var(--primary-soft), var(--primary-softer));
  color: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary-color) calc(18% + var(--folder-t, 0) * 15%), transparent);
  transition: all var(--transition-normal);
}

.folder-card-content {
  flex: 1;
  min-width: 0;
}

.folder-card-name {
  font-size: 14.5px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-card-parent {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-tertiary);
  margin-bottom: 3px;
  white-space: nowrap;
  overflow: hidden;
}

.folder-card-parent svg {
  flex-shrink: 0;
  opacity: 0.75;
}

.folder-card-parent-name {
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-card-icon-child {
  background: linear-gradient(135deg, var(--secondary-soft, var(--primary-soft)), var(--bg-tertiary));
}

.folder-card-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}

.folder-card-count {
  color: var(--primary-dark);
  font-weight: 600;
  /* 笔记越多数字越大：inherit → 16px */
  font-size: calc(1em + var(--folder-t, 0) * 0.25rem);
}

.folder-card-dot {
  flex-shrink: 0;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--border-color);
  transition: all var(--transition-normal);
}

.folder-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
  box-shadow: 0 6px 18px -8px color-mix(in srgb, var(--primary-color) 35%, rgba(0, 0, 0, 0.1));
  transform: translateY(-2px);
}

.folder-card:hover .folder-card-wave {
  opacity: 0.16;
  transform: translate(-4px, -4px) scale(1.08);
}

.folder-card:hover .folder-card-icon {
  background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
  color: #fff;
  box-shadow: 0 4px 10px -2px color-mix(in srgb, var(--primary-color) 50%, transparent);
}

.folder-card:hover .folder-card-dot {
  background: var(--primary-color);
  transform: scale(1.3);
}

.notes-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.note-card {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  width: var(--note-w, 244px);
  background: var(--bg-secondary);
  border: 1px solid color-mix(in srgb, var(--primary-color) calc(var(--note-t, 0) * 6%), var(--border-light));
  border-radius: var(--note-r, 14px);
  cursor: pointer;
  transition: all var(--transition-normal);
}

.note-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
  box-shadow: 0 8px 22px -10px color-mix(in srgb, var(--primary-color) 30%, rgba(0, 0, 0, 0.12));
  transform: translateY(-3px);
}

.note-card-media {
  position: relative;
  width: 100%;
  height: calc(130px + var(--note-t, 0) * 20px);
  overflow: hidden;
  background: linear-gradient(135deg, var(--primary-soft), var(--bg-tertiary));
}

.note-card-media.has-cover {
  background: var(--bg-tertiary);
}

.note-card-media::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 40px;
  background: linear-gradient(180deg, transparent, var(--bg-secondary));
  pointer-events: none;
  z-index: 1;
}

.note-card-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s var(--transition-normal);
}

.note-card-media-deco,
.note-card-title-cover {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* 无封面时：展示标题放大版 */
.note-card-title-cover {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--primary-soft), var(--bg-tertiary));
  color: color-mix(in srgb, var(--primary-color) 50%, var(--text-secondary));
  font-size: calc(2rem + var(--note-t, 0) * 0.5rem);
  font-weight: 700;
  letter-spacing: 0.05em;
  opacity: 0.4;
  overflow: hidden;
  word-break: break-all;
  text-align: center;
  padding: 8px;
}

.note-card:hover .note-card-media img {
  transform: scale(1.05);
}

.note-card-blocks {
  position: absolute;
  top: 10px;
  left: 10px;
  min-width: 24px;
  height: 24px;
  padding: 0 7px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(6px);
  border-radius: 999px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
  z-index: 2;
}

.note-card-body {
  position: relative;
  padding: 4px 16px 14px;
  display: flex;
  flex-direction: column;
  flex: 1;
  z-index: 2;
}

.note-card-body::before {
  content: '';
  position: absolute;
  left: 16px;
  right: 16px;
  top: 0;
  height: 2px;
  border-radius: 2px;
  background: linear-gradient(90deg, transparent, var(--border-color) 30%, var(--border-color) 70%, transparent);
}

.note-card-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin: 10px 0 6px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: color var(--transition-fast);
}

.note-card:hover .note-card-title {
  color: var(--primary-dark);
}

.note-card-preview {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.note-card-foot {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 10px;
  border-top: 1px dashed var(--border-color);
  font-size: 11px;
  color: var(--text-tertiary);
}

.note-card-folder {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--primary-dark);
  background: var(--primary-soft);
  padding: 3px 9px;
  border-radius: 999px;
  max-width: 65%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-card-folder svg {
  flex-shrink: 0;
  opacity: 0.7;
}

.note-card-date {
  white-space: nowrap;
  margin-left: auto;
}

.note-card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transform: translateY(-4px);
  transition: opacity var(--transition-fast), transform var(--transition-fast);
  z-index: 3;
}

.note-card:hover .note-card-actions {
  opacity: 1;
  transform: translateY(0);
}

.note-action {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(6px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  transition: all var(--transition-fast);
}

.note-action:hover {
  background: var(--primary-color);
  color: #fff;
  transform: scale(1.1);
}

.note-action.note-del:hover {
  background: var(--warning-color);
  color: #fff;
}

.create-note-modal {
  width: 620px;
  max-width: 92vw;
  padding: 24px;
}

.create-note-modal h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.create-note-modal .input {
  margin-bottom: 16px;
  font-size: 15px;
}

.create-note-modal .input.input-error {
  border-color: #d96b6e;
}

.field-error-tip {
  color: #d96b6e;
  font-size: 12px;
  margin-top: -10px;
  margin-bottom: 14px;
}

.template-section {
  margin-bottom: 20px;
}

.template-section-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.template-card {
  border: 1.5px solid var(--border-light);
  border-radius: var(--radius-md);
  padding: 14px 10px;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
  background: var(--bg-secondary);
}

.template-card:hover {
  border-color: var(--primary-color);
  background: var(--bg-tertiary);
}

.template-card.active {
  border-color: var(--primary-color);
  background: var(--primary-soft);
  box-shadow: 0 0 0 2px var(--primary-color);
}

.template-card-icon {
  color: var(--text-secondary);
  margin-bottom: 6px;
  display: flex;
  justify-content: center;
}

.template-card.active .template-card-icon {
  color: var(--primary-color);
}

.template-card-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.template-card-desc {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

.create-note-modal .modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .view-header {
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px 20px;
  }

  .header-right {
    flex-direction: column;
    align-items: stretch;
  }

  .search-box {
    width: 100%;
  }

  .notes-content {
    padding: 20px;
  }

  .notes-grid {
    grid-template-columns: 1fr;
  }
}

.context-menu {
  position: fixed;
  z-index: 1000;
  min-width: 180px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  padding: 6px;
  animation: ctxPop 0.12s ease-out;
}

@keyframes ctxPop {
  from { opacity: 0; transform: scale(0.96) translateY(-4px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  transition: all var(--transition-fast);
}

.context-menu-item svg {
  color: var(--text-tertiary);
  flex-shrink: 0;
}

.context-menu-item:hover {
  background: var(--bg-hover);
}

.context-menu-item:hover svg {
  color: var(--primary-color);
}

.context-menu-item.danger {
  color: var(--warning-color);
}

.context-menu-item.danger svg {
  color: var(--warning-color);
}

.context-menu-item.danger:hover {
  background: var(--warning-soft);
}

.context-menu-divider {
  height: 1px;
  background: var(--border-light);
  margin: 4px 6px;
}

.note-card-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  padding-top: 8px;
}

.note-tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: transform var(--transition-fast);
}

.note-tag-chip:hover {
  transform: translateY(-1px);
}

.tag-filter-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  padding: 12px 0 16px;
}

.tag-filter-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-tertiary);
}

.tag-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
  cursor: pointer;
  transition: filter var(--transition-fast);
}

.tag-filter-chip:hover {
  filter: brightness(0.95);
}

.tag-target-modal {
  width: 360px;
  max-width: 90vw;
  padding: 22px;
}

.tag-target-modal h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--text-primary);
}

.tag-target-modal .input {
  margin-bottom: 12px;
  font-size: 14px;
}

.tag-target-list {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 14px;
}

.tag-target-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.tag-target-item:hover {
  background: var(--bg-hover);
}

.tag-target-item.selected {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.tag-target-item .tag-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.tag-target-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag-target-create {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.tag-target-create:hover {
  background: var(--primary-soft);
}

.tag-target-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
}

.move-folder-modal {
  width: 340px;
  max-width: 90vw;
  padding: 22px;
}

.move-folder-modal h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 14px;
  color: var(--text-primary);
}

.move-folder-list {
  max-height: 340px;
  overflow-y: auto;
}

.move-folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.move-folder-item:hover {
  background: var(--bg-hover);
}

.move-folder-item.selected {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.move-folder-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.move-folder-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}
</style>

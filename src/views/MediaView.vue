<template>
  <div class="media-view">
    <div class="view-header">
      <div class="header-left">
        <!-- 面包屑导航 -->
        <div class="media-breadcrumb">
          <span class="breadcrumb-item" @click="enterFolder(null)">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            素材库
          </span>
          <template v-for="f in breadcrumb" :key="f.id">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="breadcrumb-sep"><polyline points="9 18 15 12 9 6"/></svg>
            <span class="breadcrumb-item" @click="enterFolder(f.id)">{{ f.name }}</span>
          </template>
        </div>
        <!-- 新建文件夹按钮 -->
        <button class="btn-new-folder" @click="showNewFolderInput = true" title="创建文件夹">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/></svg>
          <span>创建文件夹</span>
        </button>
        <!-- 新建文件夹输入框 -->
        <div v-if="showNewFolderInput" class="new-folder-input-wrap">
          <input
            ref="newFolderInputRef"
            v-model="newFolderName"
            type="text"
            class="new-folder-input"
            placeholder="文件夹名称"
            @keydown.enter="confirmNewFolder"
            @keydown.esc="cancelNewFolder"
            @blur="confirmNewFolder"
          />
        </div>
      </div>
      <div class="header-actions">
        <div class="filter-tabs">
          <button
            v-for="f in filters"
            :key="f.key"
            class="filter-tab"
            :class="{ active: activeFilter === f.key }"
            @click="activeFilter = f.key"
          >
            {{ f.label }}
            <span v-if="counts[f.key]" class="filter-count">{{ counts[f.key] }}</span>
          </button>
        </div>
        <div class="search-box">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            v-model="searchText"
            type="text"
            placeholder="搜索素材（含标签）..."
            class="search-input"
            @keydown.esc="searchText = ''"
          />
        </div>
        <button class="btn-import-export" @click="exportMedia" :disabled="mediaExporting" title="导出全部素材到文件夹">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          {{ mediaExporting ? '导出中...' : '导出' }}
        </button>
        <button class="btn-import-export" @click="startImport" title="导入素材文件">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          导入
        </button>
        <input ref="importInput" type="file" accept="image/*,audio/*,video/*" multiple style="display:none" @change="importMedia" />
      </div>
    </div>

    <!-- 标签筛选栏 -->
    <div v-if="mediaTags.length" class="tag-filter-bar">
      <span class="tag-filter-label">标签：</span>
      <button
        class="tag-filter-chip"
        :class="{ active: !activeTagFilter }"
        @click="activeTagFilter = null"
      >全部</button>
      <button
        v-for="t in mediaTags"
        :key="t.id"
        class="tag-filter-chip"
        :class="{ active: activeTagFilter === t.id }"
        :style="activeTagFilter === t.id ? { background: t.color, color: '#fff', borderColor: t.color } : {}"
        @click="activeTagFilter = activeTagFilter === t.id ? null : t.id"
      >{{ t.name }}</button>
    </div>

    <div class="media-content">
      <BgDecor />
      <div class="media-content-inner">
        <div v-if="loading" class="media-loading">加载中...</div>

        <template v-else>
          <!-- 文件夹区域 -->
          <div v-if="childFolders.length > 0" class="folder-card-grid-section">
            <div class="folder-card-grid">
              <article
                v-for="folder in childFolders"
                :key="folder.id"
                class="folder-card"
                :style="folderStyle(folder.id)"
                @click="enterFolder(folder.id)"
                @contextmenu.prevent="showFolderContextMenu($event, folder)"
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
                    <h3 class="folder-card-name">{{ folder.name }}</h3>
                    <p class="folder-card-meta">
                      <span class="folder-card-count">{{ getFolderItemCount(folder.id) }}</span> 项素材
                    </p>
                  </div>
                  <span class="folder-card-dot"></span>
                </div>
              </article>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="filteredItems.length === 0 && childFolders.length === 0" class="media-empty">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.4">
              <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
            </svg>
            <p>{{ allItems.length === 0 ? '还没有任何媒体素材' : '没有匹配的素材' }}</p>
          </div>

          <!-- 素材网格 -->
          <div v-if="filteredItems.length > 0" class="media-grid">
            <div
              v-for="item in filteredItems"
              :key="item.id"
              class="media-card"
              @click.stop="onCardClick($event, item)"
              @contextmenu.prevent="showContextMenu($event, item)"
            >
              <div class="media-thumb">
                <img v-if="item.type === 'image' && item.url" :src="item.url" alt="" />
                <div v-else-if="item.type === 'video' && item.thumbUrl" class="thumb-video-cover">
                  <img :src="item.thumbUrl" alt="" />
                  <span class="play-overlay">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </span>
                </div>
                <div v-else-if="item.type === 'video'" class="thumb-icon video-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="2" y="5" width="14" height="14" rx="2"/><polygon points="23 7 16 12 23 17 23 7"/>
                  </svg>
                </div>
                <div v-else-if="item.type === 'audio'" class="thumb-icon audio-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                </div>
                <span class="type-badge" :class="item.type">{{ typeLabel[item.type] }}</span>
              </div>
              <div class="media-info">
                <div class="media-info-header">
                  <span class="media-name" :title="'素材名称：' + itemName(item)">{{ itemName(item) }}</span>
                </div>
                <div v-if="itemFolderName(item) || item.notes.length || itemTagNames(item).length" class="media-info-meta">
                  <span v-if="itemFolderName(item)" class="media-folder">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
                    {{ itemFolderName(item) }}
                  </span>
                  <span v-if="item.notes.length" class="media-note-count" @click.stop>
                    {{ item.notes.length }} 个笔记
                  </span>
                </div>
                <div v-if="item.notes.length" class="media-note-items">
                  <span
                    v-for="n in item.notes"
                    :key="n.id"
                    class="media-note-chip"
                    @click.stop="goToNote(n.id)"
                    :title="'跳转到笔记：' + n.title"
                  >{{ n.title }}</span>
                </div>
                <div v-if="itemTagNames(item).length" class="media-tags">
                  <span
                    v-for="t in itemTagNames(item)"
                    :key="t.id"
                    class="media-tag-chip"
                    :style="{ background: t.color + '1a', color: t.color, borderColor: t.color + '33' }"
                  >{{ t.name }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <!-- 预览弹窗 -->
    <div v-if="previewItem_data" class="preview-overlay" @click="previewItem_data = null">
      <div class="preview-content" @click.stop>
        <img v-if="previewItem_data.type === 'image'" :src="previewItem_data.url" class="preview-img" />
        <audio v-else-if="previewItem_data.type === 'audio'" :src="previewItem_data.url" controls autoplay class="preview-audio"></audio>
        <video v-else-if="previewItem_data.type === 'video'" :src="previewItem_data.url" controls autoplay class="preview-video"></video>
        <div class="preview-meta">
          <span>{{ previewItem_data.noteTitle }}</span>
          <button v-if="previewItem_data.noteId" class="btn btn-secondary" @click="goToNote(previewItem_data.noteId)">打开笔记</button>
          <button class="btn btn-ghost" @click="previewItem_data = null">关闭</button>
        </div>
      </div>
    </div>

    <!-- 素材右键菜单 -->
    <Teleport to="body">
      <div v-if="contextMenu.show" class="media-context-menu" :style="{ left: contextMenu.x + 'px', top: contextMenu.y + 'px' }" @click.stop>
        <button v-if="contextMenu.item && contextMenu.item.noteId" class="ctx-item" @click="goToNote(contextMenu.item.noteId)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          打开笔记
        </button>
        <button class="ctx-item" @click="showMoveDialog">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
          移动到文件夹
        </button>
        <button class="ctx-item" @click="startRenameMedia">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          重命名
        </button>
        <button class="ctx-item" @click="openTagPicker(contextMenu.item)">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
          编辑标签
        </button>
        <button class="ctx-item ctx-danger" @click="askDelete">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          删除素材
        </button>
      </div>
    </Teleport>

    <!-- 点击素材卡片弹出菜单 -->
    <Teleport to="body">
      <div v-if="cardMenu.show" class="media-context-menu" :style="{ left: cardMenu.x + 'px', top: cardMenu.y + 'px' }" @click.stop>
        <button class="ctx-item" @click="previewItem(cardMenu.item); hideCardMenu()">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          查看素材
        </button>
        <div v-if="cardMenu.item?.notes?.length" class="ctx-sep"></div>
        <template v-if="cardMenu.item?.notes?.length">
          <div class="ctx-label">跳转到笔记：</div>
          <button
            v-for="n in cardMenu.item.notes"
            :key="n.id"
            class="ctx-item"
            @click="goToNote(n.id)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            {{ n.title }}
          </button>
        </template>
      </div>
    </Teleport>

    <!-- 文件夹右键菜单 -->
    <Teleport to="body">
      <div v-if="folderContextMenu.show" class="media-context-menu" :style="{ left: folderContextMenu.x + 'px', top: folderContextMenu.y + 'px' }" @click.stop>
        <button class="ctx-item" @click="startRenameFolder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          重命名
        </button>
        <button class="ctx-item ctx-danger" @click="askDeleteFolder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
          删除文件夹
        </button>
      </div>
    </Teleport>

    <!-- 移动到文件夹弹窗 -->
    <Teleport to="body">
      <div v-if="moveState.show" class="modal-overlay" @click.self="moveState.show = false">
        <div class="modal-content move-modal">
          <h3 class="move-title">移动到文件夹</h3>
          <div class="move-folder-list">
            <button class="move-folder-item" :class="{ active: moveState.targetId === null }" @click="moveState.targetId = null">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              根目录
            </button>
            <button
              v-for="f in allFoldersFlat"
              :key="f.id"
              class="move-folder-item"
              :class="{ active: moveState.targetId === f.id }"
              @click="moveState.targetId = f.id"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {{ f.displayName }}
            </button>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="moveState.show = false">取消</button>
            <button class="btn btn-primary" @click="confirmMove">移动</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 导入到文件夹弹窗 -->
    <Teleport to="body">
      <div v-if="importFolderState.show" class="modal-overlay" @click.self="importFolderState.show = false">
        <div class="modal-content move-modal">
          <h3 class="move-title">导入到文件夹</h3>
          <div class="move-folder-list">
            <button class="move-folder-item" :class="{ active: importFolderState.targetId === null }" @click="importFolderState.targetId = null">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              根目录
            </button>
            <button
              v-for="f in allFoldersFlat"
              :key="f.id"
              class="move-folder-item"
              :class="{ active: importFolderState.targetId === f.id }"
              @click="importFolderState.targetId = f.id"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>
              {{ f.displayName }}
            </button>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="importFolderState.show = false">取消</button>
            <button class="btn btn-primary" @click="confirmImportFolder">选择文件</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 重命名弹窗 -->
    <Teleport to="body">
      <div v-if="renameState.show" class="modal-overlay" @click.self="renameState.show = false">
        <div class="modal-content confirm-modal">
          <div class="confirm-header" style="margin-bottom:16px">
            <div>
              <h3>重命名文件夹</h3>
            </div>
          </div>
          <input
            ref="renameInputRef"
            v-model="renameState.name"
            type="text"
            class="rename-input"
            placeholder="文件夹名称"
            @keydown.enter="confirmRename"
            @keydown.esc="renameState.show = false"
          />
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="renameState.show = false">取消</button>
            <button class="btn btn-primary" @click="confirmRename">确定</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 素材重命名弹窗 -->
    <Teleport to="body">
      <div v-if="mediaRenameState.show" class="modal-overlay" @click.self="mediaRenameState.show = false">
        <div class="modal-content confirm-modal">
          <div class="confirm-header" style="margin-bottom:16px">
            <div>
              <h3>重命名素材</h3>
            </div>
          </div>
          <input
            ref="mediaRenameInputRef"
            v-model="mediaRenameState.name"
            type="text"
            class="rename-input"
            placeholder="素材名称"
            @keydown.enter="confirmRenameMedia"
            @keydown.esc="mediaRenameState.show = false"
          />
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="mediaRenameState.show = false">取消</button>
            <button class="btn btn-primary" @click="confirmRenameMedia">确定</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除文件夹确认弹窗 -->
    <Teleport to="body">
      <div v-if="deleteFolderState.show" class="modal-overlay" @click.self="deleteFolderState.show = false">
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
              <h3>删除文件夹</h3>
              <p>确定删除「{{ deleteFolderState.name }}」吗？文件夹内的素材将移回根目录，不会被删除。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="deleteFolderState.show = false">取消</button>
            <button class="btn btn-primary" @click="confirmDeleteFolder">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 删除确认弹窗 -->
    <Teleport to="body">
      <div v-if="deleteState.show" class="modal-overlay" @click.self="deleteState.show = false">
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
              <h3>删除素材</h3>
              <p>确定删除此素材吗？{{ deleteState.fromNote ? '该素材将从笔记中移除并删除文件。' : '此操作不可撤销。' }}</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="deleteState.show = false">取消</button>
            <button class="btn btn-primary" @click="confirmDelete">删除</button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- 标签选择弹窗 -->
    <Teleport to="body">
      <div v-if="tagPickerState.show" class="modal-overlay" @click.self="closeTagPicker">
        <div class="tag-picker-modal" @click.stop>
          <div class="tag-picker-header">
            <h3>编辑标签</h3>
            <button class="btn-close" @click="closeTagPicker">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="tag-picker-search">
            <input
              v-model="tagPickerState.search"
              type="text"
              placeholder="搜索或创建标签..."
              class="tag-search-input"
            />
          </div>
          <div class="tag-picker-list">
            <template v-for="t in tagStore.tags" :key="t.id">
              <button
                v-if="!tagPickerState.search.trim() || t.name.toLowerCase().includes(tagPickerState.search.trim().toLowerCase())"
                class="tag-pick-item"
                :class="{ selected: tagPickerState.item?.tags?.includes(t.id) }"
                :style="{ borderColor: tagPickerState.item?.tags?.includes(t.id) ? t.color : '' }"
                @click="toggleItemTag(t.id)"
              >
                <span class="tag-dot" :style="{ background: t.color }"></span>
                {{ t.name }}
                <svg v-if="tagPickerState.item?.tags?.includes(t.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
              </button>
            </template>
            <button
              v-if="tagPickerState.search.trim() && !tagStore.tags.some(t => t.name.toLowerCase() === tagPickerState.search.trim().toLowerCase())"
              class="tag-pick-create"
              @click="createAndAddTag"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              创建"{{ tagPickerState.search.trim() }}"
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { useTagStore } from '@/stores/tag'
import { resolveImageUrl, isImageRef, getAllImageRefs, deleteImage, renameMedia, getAllImageMeta } from '@/utils/imageStore'
import { imagesApi } from '@/api/images'
import { useMediaFolders } from '@/composables/useMediaFolders'
import { useToast } from '@/composables/useToast'
import BgDecor from '@/components/BgDecor.vue'

const router = useRouter()
const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
const noteStore = useNoteStore()
const {
  folders: mediaFolders,
  currentFolderId,
  childFolders,
  breadcrumb,
  createFolder,
  renameFolder,
  deleteFolder,
  enterFolder,
  getMediaFolder,
  setMediaFolder,
  getFolderItemCount
} = useMediaFolders()

const loading = ref(true)
const allItems = ref([])
const activeFilter = ref('all')
const searchText = ref('')
const previewItem_data = ref(null)

const tagStore = useTagStore()
tagStore.init()
const activeTagFilter = ref(null)
const tagPickerState = reactive({ show: false, item: null, search: '' })

const filters = [
  { key: 'all', label: '全部' },
  { key: 'image', label: '图片' },
  { key: 'audio', label: '音频' },
  { key: 'video', label: '视频' }
]

const typeLabel = { image: '图', audio: '音', video: '视' }

const counts = computed(() => {
  const c = { all: allItems.value.length, image: 0, audio: 0, video: 0 }
  allItems.value.forEach(i => { if (c[i.type] !== undefined) c[i.type]++ })
  return c
})

const filteredItems = computed(() => {
  let items = allItems.value
  // 按当前文件夹筛选（只显示当前文件夹内的素材）
  items = items.filter(i => {
    const fid = getMediaFolder(i.ref)
    return (fid || null) === (currentFolderId.value || null)
  })
  if (activeFilter.value !== 'all') {
    items = items.filter(i => i.type === activeFilter.value)
  }
  if (activeTagFilter.value) {
    items = items.filter(i => Array.isArray(i.tags) && i.tags.includes(activeTagFilter.value))
  }
  if (searchText.value.trim()) {
    const q = searchText.value.trim().toLowerCase()
    items = items.filter(i =>
      (i.displayName || '').toLowerCase().includes(q) ||
      (i.name || '').toLowerCase().includes(q) ||
      (i.notes || []).some(n => (n.title || '').toLowerCase().includes(q)) ||
      (Array.isArray(i.tags) && i.tags.some(tid => (tagStore.getTag(tid)?.name || '').toLowerCase().includes(q)))
    )
  }
  return items
})

// 素材可用标签列表（从所有素材去重）
const mediaTags = computed(() => {
  const ids = new Set()
  allItems.value.forEach(i => {
    if (Array.isArray(i.tags)) i.tags.forEach(t => ids.add(t))
  })
  return tagStore.tags.filter(t => ids.has(t.id))
})

function itemTagNames(item) {
  if (!Array.isArray(item.tags) || !item.tags.length) return []
  return item.tags.map(tid => tagStore.getTag(tid)).filter(Boolean)
}

async function toggleItemTag(tagId) {
  if (!tagPickerState.item) return
  const item = tagPickerState.item
  const tags = Array.isArray(item.tags) ? [...item.tags] : []
  const idx = tags.indexOf(tagId)
  if (idx >= 0) tags.splice(idx, 1)
  else tags.push(tagId)
  item.tags = tags
  try {
    await imagesApi.updateTags(item.ref, tags)
  } catch (e) {
    console.error('更新素材标签失败:', e)
    item.tags = tags.includes(tagId) ? tags.filter(t => t !== tagId) : [...tags, tagId]
  }
}

function openTagPicker(item) {
  hideContextMenu()
  tagPickerState.item = item
  tagPickerState.search = ''
  tagPickerState.show = true
}

function closeTagPicker() {
  tagPickerState.show = false
  tagPickerState.item = null
}

function createAndAddTag() {
  const name = tagPickerState.search.trim()
  if (!name) return
  const existing = tagStore.tags.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (existing) {
    toggleItemTag(existing.id)
  } else {
    const t = tagStore.createTag(name)
    if (t) toggleItemTag(t.id)
  }
  tagPickerState.search = ''
}

// 所有文件夹的扁平列表（用于移动弹窗，带路径前缀）
const allFoldersFlat = computed(() => {
  return mediaFolders.value.map(f => {
    // 构建路径名
    const path = []
    let cur = f
    while (cur) {
      path.unshift(cur.name)
      cur = mediaFolders.value.find(x => x.id === cur.parentId)
    }
    return { id: f.id, displayName: path.join(' / ') }
  })
})

// ===== 新建文件夹 =====
const showNewFolderInput = ref(false)
const newFolderName = ref('')
const newFolderInputRef = ref(null)

watch(showNewFolderInput, (v) => {
  if (v) {
    newFolderName.value = ''
    nextTick(() => newFolderInputRef.value?.focus())
  }
})

function confirmNewFolder() {
  const name = newFolderName.value.trim()
  if (name) {
    createFolder(name)
  }
  showNewFolderInput.value = false
  newFolderName.value = ''
}

function cancelNewFolder() {
  showNewFolderInput.value = false
  newFolderName.value = ''
}

/** 根据素材引用获取文件夹名称 */
function getFolderNameByRef(ref) {
  const folderId = getMediaFolder(ref)
  const folder = mediaFolders.value.find(f => f.id === folderId)
  return folder ? folder.name : ''
}

/** 素材名称 */
function itemName(item) {
  if (item.displayName) return item.displayName
  if (item.name && !item.ref.endsWith(item.name)) return item.name
  if (item.type === 'audio') return typeLabel.audio + '频'
  if (item.type === 'video') return typeLabel.video + '频'
  return '未命名素材'
}

/** 素材所属文件夹名称（独立素材才有） */
function itemFolderName(item) {
  if (item.blockType === 'standalone') {
    return getFolderNameByRef(item.ref)
  }
  return ''
}

/** 素材被引用的笔记标题列表 */
function itemNoteNames(item) {
  return (item.notes || []).map(n => n.title)
}

/** 根据素材数量计算气泡尺寸和不规则圆角 */
function folderStyle(folderId) {
  const count = getFolderItemCount(folderId)
  const t = Math.min(1, Math.log2(count + 1) / 5)

  const base = 120 + t * 90
  const hash = folderId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  const wRatio = 1 + ((hash % 5) - 2) * 0.06
  const hRatio = 1 + ((hash >> 4) % 5 - 2) * 0.06
  const width = Math.round(base * wRatio)
  const height = Math.round(base * hRatio)

  const wind = (seed) => 42 + ((hash >> seed) % 7) * 3
  const r1 = wind(0), r2 = wind(2), r3 = wind(5), r4 = wind(8)
  const rv1 = wind(1), rv2 = wind(3), rv3 = wind(6), rv4 = wind(9)

  return {
    '--fw': `${width}px`,
    '--fh': `${height}px`,
    '--fr': `${r1}% ${r2}% ${r3}% ${r4}% / ${rv1}% ${rv2}% ${rv3}% ${rv4}%`,
    '--folder-t': t.toFixed(2)
  }
}

async function collectMedia() {
  loading.value = true
  const notes = noteStore.notes || []

  // 1. 扫描所有笔记，按 ref 聚合，收集所有引用该素材的笔记
  const refMap = new Map() // ref → { type, blockType, name, notes: [{id, title}] }
  const referencedRefs = new Set()

  for (const note of notes) {
    if (note.deleted) continue
    const blocks = note.blocks || []
    for (const block of blocks) {
      const collected = []
      if (block.type === 'image' && block.imageUrl) {
        collected.push({ ref: block.imageUrl, type: 'image', blockType: 'image', name: '' })
      } else if ((block.type === 'audio' || block.type === 'video') && block.mediaUrl) {
        collected.push({ ref: block.mediaUrl, type: block.type, blockType: block.type, name: block.mediaName || '' })
      } else if (block.type === 'gallery' && Array.isArray(block.images)) {
        block.images.forEach(img => {
          if (img) collected.push({ ref: img, type: 'image', blockType: 'gallery', name: '' })
        })
      }
      for (const c of collected) {
        if (isImageRef(c.ref)) referencedRefs.add(c.ref)
        if (!refMap.has(c.ref)) {
          refMap.set(c.ref, { type: c.type, blockType: c.blockType, name: c.name, notes: [] })
        }
        const entry = refMap.get(c.ref)
        if (!entry.notes.some(n => n.id === note.id)) {
          entry.notes.push({ id: note.id, title: note.title || '未命名' })
        }
      }
    }
  }

  // 2. 加载后端独立素材元数据
  let metaMap = {}
  try {
    const [allRefs, allMeta] = await Promise.all([getAllImageRefs(), getAllImageMeta()])
    for (const m of allMeta) metaMap[m.id] = { displayName: m.displayName, tags: m.tags }
    // 独立素材也加入 refMap
    for (const ref of allRefs) {
      if (!refMap.has(ref)) {
        refMap.set(ref, {
          type: ref.startsWith('media_') ? 'audio' : 'image',
          blockType: 'standalone',
          name: ref,
          notes: []
        })
      }
    }
  } catch { /* ignore */ }

  // 3. 构建统一的 items 列表（每个 ref 一条）
  const items = []
  for (const [ref, info] of refMap) {
    const meta = metaMap[ref]
    items.push({
      id: ref,
      ref,
      type: info.type,
      blockType: info.blockType,
      name: info.name,
      displayName: meta?.displayName || '',
      tags: meta?.tags || [],
      notes: info.notes,
      url: '',
      thumbUrl: ''
    })
  }

  // 4. resolve URLs
  await Promise.all(items.map(async (item) => {
    if (isImageRef(item.ref)) {
      item.url = await resolveImageUrl(item.ref)
    } else {
      item.url = item.ref
    }
  }))

  // 5. 为视频生成首帧缩略图
  const videoItems = items.filter(i => i.type === 'video' && i.url)
  const CONCURRENCY = 3
  for (let i = 0; i < videoItems.length; i += CONCURRENCY) {
    const batch = videoItems.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map(async (item) => {
      item.thumbUrl = await generateVideoThumbnail(item.url)
    }))
  }

  allItems.value = items
  loading.value = false
}

function createItem(ref, type, note, blockType, name) {
  return {
    id: `${note.id}_${ref}_${Math.random().toString(36).slice(0, 4)}`,
    ref,
    type,
    noteId: note.id,
    noteTitle: note.title || '未命名',
    blockType,
    name: name || '',
    url: '',
    thumbUrl: ''
  }
}

function createStandaloneItem(ref, displayName, tags) {
  return {
    id: `standalone_${ref}`,
    ref,
    type: ref.startsWith('media_') ? 'audio' : 'image',
    noteId: null,
    noteTitle: displayName || '素材库',
    displayName: displayName || '',
    tags: tags || [],
    blockType: 'standalone',
    name: ref,
    url: '',
    thumbUrl: ''
  }
}

// 从视频 URL 提取首帧作为缩略图
function generateVideoThumbnail(videoUrl) {
  return new Promise((resolve) => {
    const video = document.createElement('video')
    video.muted = true
    video.playsInline = true
    video.preload = 'auto'
    // 必须挂载到 DOM 才能在 Electron/Chromium 中正常解码帧
    video.style.position = 'fixed'
    video.style.left = '-9999px'
    video.style.top = '0'
    video.style.width = '2px'
    video.style.height = '2px'
    video.style.opacity = '0'
    video.style.pointerEvents = 'none'
    document.body.appendChild(video)

    let settled = false
    let timer = null
    let attempt = 0
    // 候选取帧时间点（秒）：依次尝试，避开开头纯黑帧（第四项在 metadata 加载后补算）
    const seekPoints = [0.5, 1, 2]

    const cleanup = () => {
      if (timer) { clearTimeout(timer); timer = null }
      video.removeAttribute('src')
      try { video.load() } catch {}
      video.remove()
    }
    const fail = () => { if (!settled) { settled = true; cleanup(); resolve('') } }
    const capture = () => {
      try {
        const w = video.videoWidth || 320
        const h = video.videoHeight || 180
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        // 先填黑底，再绘制视频帧
        ctx.fillStyle = '#000'
        ctx.fillRect(0, 0, w, h)
        ctx.drawImage(video, 0, 0, w, h)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
        // 简单黑屏检测：统计前若干像素亮度，若全黑则换下一时间点
        const sample = ctx.getImageData(0, 0, Math.min(32, w), Math.min(32, h)).data
        let sum = 0
        for (let i = 0; i < sample.length; i += 4) {
          sum += sample[i] + sample[i + 1] + sample[i + 2]
        }
        const avg = sum / (sample.length / 4 * 3)
        if (avg < 8 && attempt < seekPoints.length) {
          // 可能是黑帧，尝试下一个时间点
          attempt++
          trySeek()
          return
        }
        settled = true
        cleanup()
        resolve(dataUrl)
      } catch {
        fail()
      }
    }
    const trySeek = () => {
      if (settled) return
      const t = seekPoints[attempt]
      if (t == null || isNaN(t)) { fail(); return }
      try { video.currentTime = t } catch { fail() }
    }

    video.addEventListener('loadedmetadata', () => {
      // duration 已知，补充一个靠后的取帧点
      const dur = video.duration
      if (isFinite(dur) && dur > 0) {
        seekPoints.push(Math.min(5, dur * 0.2))
      }
      // 等待可以播放再 seek，避免 seeked 不触发
      const onReady = () => {
        if (settled) return
        attempt = 0
        trySeek()
      }
      if (video.readyState >= 2) {
        onReady()
      } else {
        video.addEventListener('canplay', onReady, { once: true })
      }
    })
    video.addEventListener('seeked', () => {
      if (settled) return
      // 给解码留一点时间，避免抓到上一帧
      setTimeout(capture, 60)
    })
    video.addEventListener('error', fail)
    timer = setTimeout(fail, 8000)

    video.src = videoUrl
    try { video.load() } catch {}
  })
}

function previewItem(item) {
  previewItem_data.value = item
}

function goToNote(noteId) {
  if (!noteId) return
  previewItem_data.value = null
  contextMenu.value.show = false
  cardMenu.value.show = false
  router.push(`/note/${noteId}`)
}

// ===== 点击卡片弹出菜单（查看素材 / 跳转笔记） =====
const cardMenu = ref({ show: false, x: 0, y: 0, item: null })
const importInputRef = ref(null)

function onCardClick(e, item) {
  cardMenu.value = { show: true, x: e.clientX, y: e.clientY, item }
}

function hideCardMenu() {
  cardMenu.value.show = false
}

// ===== 右键菜单 =====
const contextMenu = ref({ show: false, x: 0, y: 0, item: null })

function showContextMenu(e, item) {
  contextMenu.value = { show: true, x: e.clientX, y: e.clientY, item }
}

function hideContextMenu() {
  contextMenu.value.show = false
}

async function deleteMediaItem() {
  const item = contextMenu.value.item
  if (!item) return
  hideContextMenu()

  if (isImageRef(item.ref)) {
    // 从所有引用该素材的笔记中移除
    for (const n of (item.notes || [])) {
      const note = noteStore.notes.find(x => x.id === n.id)
      if (note && note.blocks) {
        for (const b of note.blocks) {
          const isMatch =
            (b.type === 'image' && b.imageUrl === item.ref) ||
            ((b.type === 'audio' || b.type === 'video') && b.mediaUrl === item.ref) ||
            (b.type === 'gallery' && Array.isArray(b.images) && b.images.includes(item.ref))
          if (isMatch) noteStore.deleteBlock(note.id, b.id)
        }
      }
    }
    // 删除文件
    await deleteImage(item.ref)
  }

  await collectMedia()
}

// ===== 删除确认弹窗 =====
const deleteState = ref({ show: false, item: null, fromNote: false })

function askDelete() {
  const item = contextMenu.value.item
  if (!item) return
  hideContextMenu()
  deleteState.value = { show: true, item, fromNote: (item.notes?.length || 0) > 0 }
}

async function confirmDelete() {
  const item = deleteState.value.item
  deleteState.value.show = false
  if (!item) return
  contextMenu.value.item = item
  await deleteMediaItem()
}

// ===== 文件夹右键菜单 =====
const folderContextMenu = ref({ show: false, x: 0, y: 0, folder: null })

function showFolderContextMenu(e, folder) {
  folderContextMenu.value = { show: true, x: e.clientX, y: e.clientY, folder }
}

function hideFolderContextMenu() {
  folderContextMenu.value.show = false
}

// ===== 重命名文件夹 =====
const renameState = ref({ show: false, id: null, name: '' })
const renameInputRef = ref(null)

function startRenameFolder() {
  const folder = folderContextMenu.value.folder
  if (!folder) return
  hideFolderContextMenu()
  renameState.value = { show: true, id: folder.id, name: folder.name }
  nextTick(() => renameInputRef.value?.focus())
}

function confirmRename() {
  const name = renameState.value.name.trim()
  if (name && renameState.value.id) {
    renameFolder(renameState.value.id, name)
  }
  renameState.value.show = false
}

// ===== 删除文件夹 =====
const deleteFolderState = ref({ show: false, id: null, name: '' })

function askDeleteFolder() {
  const folder = folderContextMenu.value.folder
  if (!folder) return
  hideFolderContextMenu()
  deleteFolderState.value = { show: true, id: folder.id, name: folder.name }
}

function confirmDeleteFolder() {
  if (deleteFolderState.value.id) {
    deleteFolder(deleteFolderState.value.id)
  }
  deleteFolderState.value.show = false
}

// ===== 导入到文件夹 =====
const importFolderState = ref({ show: false, targetId: null })

function startImport() {
  importFolderState.value = { show: true, targetId: currentFolderId.value }
}

function confirmImportFolder() {
  importFolderState.value.show = false
  // 延迟打开文件选择器，确保弹窗关闭
  nextTick(() => {
    const input = importInputRef.value
    if (input) input.click()
  })
}

// ===== 移动到文件夹 =====
const moveState = ref({ show: false, item: null, targetId: null })

function showMoveDialog() {
  const item = contextMenu.value.item
  if (!item) return
  hideContextMenu()
  moveState.value = { show: true, item, targetId: getMediaFolder(item.ref) }
}

function confirmMove() {
  const item = moveState.value.item
  if (item) {
    setMediaFolder(item.ref, moveState.value.targetId)
  }
  moveState.value.show = false
}

// ===== 素材重命名 =====
const mediaRenameState = ref({ show: false, item: null, name: '' })
const mediaRenameInputRef = ref(null)

function startRenameMedia() {
  const item = contextMenu.value.item
  if (!item) return
  hideContextMenu()
  mediaRenameState.value = { show: true, item, name: item.displayName || itemName(item) }
  nextTick(() => mediaRenameInputRef.value?.focus())
}

async function confirmRenameMedia() {
  const name = mediaRenameState.value.name.trim()
  const item = mediaRenameState.value.item
  mediaRenameState.value.show = false
  if (!name || !item) return

  // 只更新后端 displayName，不触碰 noteTitle
  if (isImageRef(item.ref)) {
    await renameMedia(item.ref, name)
  }
  const found = allItems.value.find(i => i.ref === item.ref)
  if (found) {
    found.displayName = name
  }
}

function hideAllMenus() {
  hideContextMenu()
  hideFolderContextMenu()
  hideCardMenu()
}

function onMediaLibraryChanged() {
  collectMedia()
}

// ===== 素材导出 =====
const mediaExporting = ref(false)

/** 导出素材：先弹窗选目录，确认后再下载并写入 */
async function exportMedia() {
  if (mediaExporting.value) return
  const items = filteredItems.value
  if (!items.length) {
    toastError('没有可导出的素材')
    return
  }

  // Electron：先弹窗让用户选目录
  let targetDir = null
  if (window.electronAPI?.selectExportDir) {
    targetDir = await window.electronAPI.selectExportDir()
    if (!targetDir) return // 用户取消
  }

  mediaExporting.value = true
  toastInfo(`正在导出 ${items.length} 个素材...`)

  try {
    // 下载每个素材为 buffer
    const files = []
    for (const item of items) {
      if (!isImageRef(item.ref)) continue
      const blob = await imagesApi.download(item.ref)
      const arrayBuffer = await blob.arrayBuffer()
      // 用 displayName + 原始扩展名作为文件名，无 displayName 则用 ref
      const ext = item.ref.match(/\.(\w+)$/)?.[1] || 'png'
      const baseName = (item.displayName || item.ref).replace(/\.[^.]+$/, '')
      // 分块转换 base64，避免大文件栈溢出
      const bytes = new Uint8Array(arrayBuffer)
      let binary = ''
      const chunkSize = 8192
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
      }
      files.push({
        name: `${baseName}.${ext}`,
        buffer: btoa(binary)
      })
    }

    if (!files.length) {
      toastError('没有可导出的素材文件')
      return
    }

    if (targetDir) {
      // Electron：写入已选定的目录
      const count = await window.electronAPI.writeMediaToDir({ dir: targetDir, files })
      toastSuccess(`成功导出 ${count} 个素材到 ${targetDir}`)
    } else {
      // 浏览器：逐个下载
      for (const file of files) {
        const bytes = atob(file.buffer)
        const arr = new Uint8Array(bytes.length)
        for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i)
        const blob = new Blob([arr])
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        a.click()
        URL.revokeObjectURL(url)
      }
      toastSuccess(`成功导出 ${files.length} 个素材`)
    }
  } catch (err) {
    console.error('导出素材失败:', err)
    toastError('导出素材失败')
  } finally {
    mediaExporting.value = false
  }
}

/** 导入素材：直接选择原始文件上传 */
async function importMedia(e) {
  const fileList = e.target.files
  e.target.value = ''
  if (!fileList || !fileList.length) return

  const files = Array.from(fileList)
  const targetFolderId = importFolderState.value.targetId
  toastInfo(`正在导入 ${files.length} 个素材...`)

  let successCount = 0
  for (const file of files) {
    try {
      const ref = await imagesApi.upload(file)
      if (ref) {
        // 用原始文件名（去扩展名）作为 displayName
        const displayName = file.name.replace(/\.[^.]+$/, '')
        await imagesApi.rename(ref, displayName)
        // 将素材分配到选定的文件夹
        if (targetFolderId !== undefined) {
          setMediaFolder(ref, targetFolderId)
        }
        successCount++
      }
    } catch (err) {
      console.error('导入文件失败:', file.name, err)
    }
  }

  if (successCount > 0) {
    toastSuccess(`成功导入 ${successCount} 个素材`)
    await collectMedia()
  } else {
    toastError('导入失败，未成功导入任何素材')
  }
}

onMounted(() => {
  collectMedia()
  document.addEventListener('click', hideAllMenus)
  window.addEventListener('media-library-changed', onMediaLibraryChanged)
})

onUnmounted(() => {
  document.removeEventListener('click', hideAllMenus)
  window.removeEventListener('media-library-changed', onMediaLibraryChanged)
})
</script>

<style scoped>
.media-view {
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
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

/* 面包屑 */
.media-breadcrumb {
  display: flex;
  align-items: center;
  gap: 4px;
}
.breadcrumb-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background .15s;
}
.breadcrumb-item:hover { background: var(--bg-hover); }
.breadcrumb-item svg { opacity: .6; }
.breadcrumb-sep { opacity: .3; }

/* 新建文件夹按钮 */
.btn-new-folder {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 12px;
  border: none;
  border-radius: 7px;
  background: var(--bg-hover);
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all .15s;
}
.btn-new-folder:hover {
  background: var(--primary-color);
  color: #fff;
}

/* 新建文件夹输入框 */
.new-folder-input-wrap {
  display: flex;
  align-items: center;
}
.new-folder-input {
  padding: 5px 10px;
  font-size: 13px;
  border: 1px solid var(--primary-color);
  border-radius: 6px;
  outline: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  width: 160px;
}

/* 文件夹气泡卡片 */
.folder-card-grid-section {
  margin-bottom: 24px;
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
  width: var(--fw, 140px);
  height: var(--fh, 140px);
  border-radius: var(--fr, 45% 50% 42% 48% / 48% 42% 50% 44%);
}
.folder-card-wave {
  position: absolute;
  right: -10px;
  bottom: -10px;
  width: calc(130px + var(--folder-t, 0) * 70px);
  height: calc(50px + var(--folder-t, 0) * 30px);
  color: var(--primary-color);
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
.folder-card-icon-child {
  background: linear-gradient(135deg, var(--secondary-soft, var(--primary-soft)), var(--bg-tertiary));
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
.folder-card-meta {
  margin-top: 2px;
  font-size: 12px;
  color: var(--text-tertiary);
}
.folder-card-count {
  color: var(--primary-dark);
  font-weight: 600;
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

/* 移动到文件夹弹窗 */
.move-modal {
  width: 420px;
  max-width: 90vw;
  padding: 24px;
}
.move-title {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 16px;
}
.move-folder-list {
  max-height: 300px;
  overflow-y: auto;
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.move-folder-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all .1s;
  text-align: left;
}
.move-folder-item:hover { background: var(--bg-hover); }
.move-folder-item.active {
  border-color: var(--primary-color);
  background: rgba(99,102,241,.08);
  color: var(--primary-color);
  font-weight: 600;
}

/* 重命名输入框 */
.rename-input {
  width: 100%;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  outline: none;
  background: var(--bg-primary);
  color: var(--text-primary);
  margin-bottom: 16px;
}
.rename-input:focus { border-color: var(--primary-color); }

.media-content {
  flex: 1;
  overflow-y: auto;
  padding: 24px 28px;
  position: relative;
}

.media-content-inner {
  position: relative;
  z-index: 1;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: auto;
}

.filter-tabs {
  display: flex;
  gap: 4px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  padding: 3px;
}

.filter-tab {
  padding: 5px 14px;
  font-size: 13px;
  border: none;
  background: transparent;
  color: var(--text-secondary);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.filter-tab:hover {
  color: var(--text-primary);
}

.filter-tab.active {
  background: var(--bg-elevated);
  color: var(--text-primary);
  font-weight: 500;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.filter-count {
  font-size: 11px;
  background: var(--bg-hover);
  padding: 0 5px;
  border-radius: 8px;
  min-width: 16px;
  text-align: center;
}

.filter-tab.active .filter-count {
  background: var(--primary-soft);
  color: var(--primary-color);
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

.btn-import-export {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12.5px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.18s cubic-bezier(.34,1.2,.64,1);
  white-space: nowrap;
}
.btn-import-export:hover {
  border-color: color-mix(in srgb, var(--primary-color) 40%, var(--border-color));
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 5%, var(--bg-secondary));
  transform: translateY(-1px);
}
.btn-import-export:active {
  transform: translateY(0);
}
.btn-import-export:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}

.search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}

.media-loading,
.media-empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  color: var(--text-secondary);
}

.media-grid {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 16px;
  align-content: start;
}
.media-grid > .media-card:nth-child(1) { animation-delay: 0.02s; }
.media-grid > .media-card:nth-child(2) { animation-delay: 0.05s; }
.media-grid > .media-card:nth-child(3) { animation-delay: 0.08s; }
.media-grid > .media-card:nth-child(4) { animation-delay: 0.11s; }
.media-grid > .media-card:nth-child(5) { animation-delay: 0.14s; }
.media-grid > .media-card:nth-child(6) { animation-delay: 0.17s; }
.media-grid > .media-card:nth-child(7) { animation-delay: 0.2s; }
.media-grid > .media-card:nth-child(8) { animation-delay: 0.23s; }
.media-grid > .media-card:nth-child(n+9) { animation-delay: 0.26s; }

.media-card {
  border: 1px solid var(--border-light);
  border-radius: 14px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.28s cubic-bezier(.34,1.3,.64,1), box-shadow 0.28s ease, border-color 0.2s ease;
  background: var(--bg-secondary);
  display: flex;
  flex-direction: column;
  animation: card-in 0.4s cubic-bezier(.22,.61,.36,1) backwards;
}
@keyframes card-in {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

.media-card:hover {
  border-color: color-mix(in srgb, var(--primary-color) 35%, var(--border-color));
  box-shadow: 0 12px 32px -10px rgba(0,0,0,0.16), 0 4px 12px rgba(0,0,0,0.06);
  transform: translateY(-5px);
}

.media-card:active {
  transform: translateY(-2px);
  transition-duration: 0.08s;
}

.media-thumb {
  position: relative;
  aspect-ratio: 1;
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

/* 缩略图底部渐变遮罩，与信息区融合增加深度 */
.media-thumb::after {
  content: '';
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 40%;
  background: linear-gradient(to top, rgba(0,0,0,0.08), transparent);
  pointer-events: none;
}

.media-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(.22,.61,.36,1);
}
.media-card:hover .media-thumb img {
  transform: scale(1.07);
}

.thumb-icon {
  color: var(--text-secondary);
  opacity: 0.35;
  transition: opacity 0.25s, transform 0.25s;
}
.media-card:hover .thumb-icon { opacity: 0.5; transform: scale(1.08); }

.thumb-video-cover {
  position: relative;
  width: 100%;
  height: 100%;
}
.thumb-video-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.4s cubic-bezier(.22,.61,.36,1);
}
.media-card:hover .thumb-video-cover img {
  transform: scale(1.07);
}
.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.18);
  color: #fff;
  transition: background 0.25s;
}
.media-card:hover .play-overlay { background: rgba(0, 0, 0, 0.28); }
.play-overlay svg {
  filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.5));
  transition: transform 0.25s cubic-bezier(.34,1.3,.64,1);
}
.media-card:hover .play-overlay svg { transform: scale(1.12); }

.type-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 6px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.03em;
  backdrop-filter: blur(6px);
  z-index: 1;
}

.type-badge.image { background: color-mix(in srgb, var(--primary-color) 70%, transparent); }
.type-badge.audio { background: rgba(230, 126, 34, 0.75); }
.type-badge.video { background: rgba(142, 68, 173, 0.75); }

.media-info {
  padding: 9px 11px 11px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.media-info-header {
  display: flex;
  align-items: center;
}

.media-name {
  font-size: 12.5px;
  font-weight: 600;
  color: var(--text-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.35;
  letter-spacing: 0.01em;
}

.media-info-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.media-folder {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 130px;
}
.media-folder svg { flex-shrink: 0; opacity: 0.65; }

.media-note-count {
  font-size: 10.5px;
  color: var(--text-tertiary);
  white-space: nowrap;
}

.media-note-items {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.media-note-chip {
  display: inline-flex;
  align-items: center;
  font-size: 10.5px;
  font-weight: 500;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 7%, transparent);
  padding: 2px 8px;
  border-radius: 999px;
  cursor: pointer;
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: all 0.18s cubic-bezier(.34,1.2,.64,1);
  border: 1px solid color-mix(in srgb, var(--primary-color) 10%, transparent);
}
.media-note-chip:hover {
  background: color-mix(in srgb, var(--primary-color) 14%, transparent);
  border-color: color-mix(in srgb, var(--primary-color) 28%, transparent);
  transform: translateY(-1px);
}

/* 右键菜单 */
.media-context-menu {
  position: fixed;
  z-index: 10000;
  min-width: 140px;
  background: var(--bg-secondary, #fff);
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 10px;
  box-shadow: 0 8px 28px -6px rgba(0,0,0,.18);
  padding: 5px;
  animation: ctx-in .12s ease;
}
@keyframes ctx-in { from{opacity:0;transform:scale(.95)} to{opacity:1;transform:scale(1)} }

.ctx-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 12px;
  border: none;
  border-radius: 7px;
  background: transparent;
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: background .1s;
}
.ctx-item:hover { background: var(--bg-hover, #f5f5f5); }
.ctx-danger { color: #ef4444; }
.ctx-danger:hover { background: rgba(239,68,68,.1); }
.ctx-sep { height: 1px; background: var(--border-color); margin: 4px 0; }
.ctx-label { font-size: 10px; color: var(--text-tertiary); padding: 2px 10px; }

/* 预览弹窗 */
.preview-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 9000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.preview-content {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.preview-img {
  max-width: 90vw;
  max-height: 75vh;
  border-radius: var(--radius-md);
  object-fit: contain;
}

.preview-video {
  max-width: 90vw;
  max-height: 75vh;
  border-radius: var(--radius-md);
}

.preview-audio {
  width: 400px;
}

.preview-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  color: #fff;
  font-size: 14px;
}

/* 标签筛选栏 */
.tag-filter-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 28px 8px;
  flex-wrap: wrap;
}
.tag-filter-label {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
}
.tag-filter-chip {
  padding: 3px 12px;
  border-radius: 999px;
  border: 1px solid var(--border-color);
  background: var(--bg-secondary);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
}
.tag-filter-chip:hover { border-color: var(--primary-color); }
.tag-filter-chip.active {
  background: var(--primary-color);
  color: #fff;
  border-color: var(--primary-color);
}

/* 素材卡片标签 */
.media-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.media-tag-chip {
  padding: 1px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  border: 1px solid transparent;
  max-width: 70px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: transform 0.15s;
}
.media-tag-chip:hover { transform: scale(1.05); }

/* 标签选择弹窗 */
.tag-picker-modal {
  background: var(--bg-primary);
  border-radius: var(--radius-lg, 12px);
  padding: 20px;
  width: 360px;
  max-height: 480px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 8px 32px rgba(0,0,0,.15);
}
.tag-picker-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}
.tag-picker-header h3 { margin: 0; font-size: 16px; }
.btn-close {
  background: none; border: none; cursor: pointer;
  color: var(--text-tertiary); padding: 4px; border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
}
.btn-close:hover { background: var(--bg-secondary); color: var(--text-primary); }
.tag-picker-search { margin-bottom: 12px; }
.tag-search-input {
  width: 100%; padding: 8px 12px; border-radius: 8px;
  border: 1px solid var(--border-color); background: var(--bg-secondary);
  color: var(--text-primary); font-size: 13px; box-sizing: border-box;
}
.tag-search-input:focus { outline: none; border-color: var(--primary-color); }
.tag-picker-list {
  flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 4px;
}
.tag-pick-item {
  display: flex; align-items: center; gap: 8px;
  padding: 7px 12px; border-radius: 8px; border: 1px solid var(--border-color);
  background: var(--bg-secondary); color: var(--text-primary);
  font-size: 13px; cursor: pointer; transition: all 0.15s;
}
.tag-pick-item:hover { border-color: var(--primary-color); }
.tag-pick-item.selected { font-weight: 600; }
.tag-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.tag-pick-item svg { margin-left: auto; color: var(--primary-color); }
.tag-pick-create {
  display: flex; align-items: center; gap: 6px;
  padding: 7px 12px; border-radius: 8px; border: 1px dashed var(--primary-color);
  background: transparent; color: var(--primary-color);
  font-size: 13px; cursor: pointer; margin-top: 4px;
}
</style>

<template>
  <aside class="sidebar" :class="{ collapsed }">
    <div class="sidebar-header">
      <div class="logo">
        <img class="logo-img" src="/favicon.png" alt="R-Goose Note" />
        <span v-if="!collapsed" class="logo-text">R-Goose Note</span>
      </div>
      <button class="collapse-btn" @click="$emit('toggle-collapse')">
        <svg v-if="collapsed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="13 17 18 12 13 7"/>
          <polyline points="6 17 11 12 6 7"/>
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="11 17 6 12 11 7"/>
          <polyline points="18 17 13 12 18 7"/>
        </svg>
      </button>
    </div>
    
    <div v-if="!collapsed" class="sidebar-collapsible-group">
      <button class="group-header" @click="toggleSection('toolbar')">
        <span class="group-header-title">工具栏</span>
        <svg class="group-toggle-icon" :class="{ collapsed: isSectionCollapsed('toolbar') }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>
      <nav v-show="!isSectionCollapsed('toolbar')" class="sidebar-nav">
        <router-link to="/dashboard" class="nav-item nav-dashboard" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="9"/>
            <rect x="14" y="3" width="7" height="5"/>
            <rect x="14" y="12" width="7" height="9"/>
            <rect x="3" y="16" width="7" height="5"/>
          </svg>
          <span>仪表盘</span>
        </router-link>
        <router-link to="/notes" class="nav-item nav-notes" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span>笔记</span>
        </router-link>
        <router-link to="/tags" class="nav-item nav-tags" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          <span>标签</span>
        </router-link>
        <router-link to="/media" class="nav-item nav-media" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <span>素材库</span>
        </router-link>
        <router-link to="/plans" class="nav-item nav-plans" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>计划</span>
          <span v-if="todayPlanCount" class="badge">{{ todayPlanCount }}</span>
        </router-link>
        <router-link to="/trash" class="nav-item nav-trash" active-class="active">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            <line x1="10" y1="11" x2="10" y2="17"/>
            <line x1="14" y1="11" x2="14" y2="17"/>
          </svg>
          <span>回收站</span>
        </router-link>
      </nav>
    </div>
    
    <div v-if="!collapsed" class="sidebar-collapsible-group group-folders">
      <div class="section-header">
        <button class="group-header section-header-btn" @click="toggleSection('folders')">
          <span class="group-header-title">文件夹</span>
          <svg class="group-toggle-icon" :class="{ collapsed: isSectionCollapsed('folders') }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button class="btn-icon-small" @click="createNewFolder()" title="新建文件夹">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
        </button>
      </div>
      <div v-show="!isSectionCollapsed('folders')" class="folder-list">
        <template v-for="item in visibleFolders" :key="item.folder.id">
          <div
            class="folder-item"
            :class="{ active: noteStore.currentFolderId === item.folder.id }"
            :style="{ paddingLeft: (item.depth * 16 + 4) + 'px' }"
            @click="onFolderClick(item.folder)"
            @dblclick.stop="startRenameFolder(item.folder)"
            @contextmenu.prevent="showFolderContextMenu($event, item.folder)"
          >
            <span
              v-if="hasChildFolders(item.folder.id)"
              class="folder-toggle"
              :class="{ expanded: isFolderExpanded(item.folder.id) }"
              @click.stop="toggleFolderExpandById(item.folder.id)"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </span>
            <span v-else class="folder-spacer" aria-hidden="true"></span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div v-if="editingFolderId === item.folder.id" class="folder-input-wrapper">
              <input
                ref="folderInputRef"
                v-model="editingFolderName"
                class="folder-name-input"
                :class="{ error: folderNameError }"
                @blur="finishEditFolder"
                @input="onFolderNameInput"
                @keyup.enter="finishEditFolder"
                @keyup.esc="cancelEditFolder"
                @click.stop
              />
              <div v-if="folderNameError" class="folder-error-tip">文件夹名称已存在</div>
            </div>
            <span v-else class="folder-name">{{ item.folder.name }}</span>
            <div v-if="!editingFolder || editingFolder !== item.folder.id" v-show="folderTagList(item.folder).length" class="folder-tags">
              <span
                v-for="t in folderTagList(item.folder)"
                :key="t.id"
                class="folder-tag-chip"
                :style="{ background: t.color + '22', color: t.color }"
                :title="t.name"
              >{{ t.name }}</span>
            </div>
            <span class="folder-count">{{ getFolderNoteCount(item.folder.id) }}</span>
          </div>
          <div
            v-if="isCreatingFolder && newFolderParentId === item.folder.id"
            class="folder-item creating"
            :style="{ paddingLeft: ((item.depth + 1) * 18 + 12) + 'px' }"
          >
            <span class="folder-spacer"></span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
            <div class="folder-input-wrapper">
              <input
                ref="newFolderInputRef"
                v-model="newFolderName"
                class="folder-name-input"
                :class="{ error: folderNameError }"
                placeholder="新文件夹"
                @blur="finishCreateFolder"
                @input="onFolderNameInput"
                @keyup.enter="finishCreateFolder"
                @keyup.esc="cancelCreateFolder"
                @click.stop
              />
              <div v-if="folderNameError" class="folder-error-tip">文件夹名称已存在</div>
            </div>
          </div>
        </template>
        <div v-if="!visibleFolders.length && !isCreatingFolder" class="folder-empty">
          暂无文件夹，点击上方 + 新建
        </div>
        <div v-if="isCreatingFolder && !newFolderParentId" class="folder-item creating">
          <span class="folder-spacer" style="width: 16px; flex-shrink: 0; opacity: 0;"></span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
          </svg>
          <div class="folder-input-wrapper">
            <input
              ref="newFolderInputRef"
              v-model="newFolderName"
              class="folder-name-input"
              :class="{ error: folderNameError }"
              placeholder="新文件夹"
              @blur="finishCreateFolder"
              @input="onFolderNameInput"
              @keyup.enter="finishCreateFolder"
              @keyup.esc="cancelCreateFolder"
              @click.stop
            />
            <div v-if="folderNameError" class="folder-error-tip">文件夹名称已存在</div>
          </div>
        </div>
      </div>
      
      <div
        v-if="folderContextMenu.show"
        class="folder-context-menu"
        :style="{ top: folderContextMenu.y + 'px', left: folderContextMenu.x + 'px' }"
        @click.stop
      >
        <div class="context-menu-item" @click="createFolderFromMenu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
            <line x1="9" y1="14" x2="15" y2="14"/>
          </svg>
          新建文件夹
        </div>
        <div class="context-menu-item" @click="createNoteInFolder">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          新建笔记
        </div>
        <div v-if="!folderContextMenu.folder?.isSystem" class="context-menu-item" @click="renameFromContextMenu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M12 20h9"/>
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
          </svg>
          重命名
        </div>
        <div class="context-menu-item" @click="tagsFromContextMenu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
            <line x1="7" y1="7" x2="7.01" y2="7"/>
          </svg>
          设置标签
        </div>
        <div v-if="!folderContextMenu.folder?.isSystem" class="context-menu-item danger" @click="deleteFromContextMenu">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="3 6 5 6 21 6"/>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
          删除
        </div>
      </div>
      
      <!-- 浏览历史 -->
      <div class="section-header" style="margin-top: 12px;">
        <button class="group-header section-header-btn" @click="toggleSection('history')">
          <span class="group-header-title">浏览历史</span>
          <svg class="group-toggle-icon" :class="{ collapsed: isSectionCollapsed('history') }" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </button>
        <button v-if="routeHistory.length && !isSectionCollapsed('history')" class="btn-icon-small btn-history-clear" @click="clearHistory" title="清空">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>
      <div v-show="!isSectionCollapsed('history')" class="history-list">
        <button
          v-for="(h, i) in routeHistory"
          :key="h.path + h.ts"
          class="history-item"
          :class="{ active: route.fullPath === h.path }"
          @click="goToHistory(h.path)"
        >
          <span class="history-dot" :style="{ background: h.color }"></span>
          <svg class="history-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
            <template v-if="h.icon === 'note'"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></template>
            <template v-else-if="h.icon === 'edit'"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></template>
            <template v-else-if="h.icon === 'dashboard'"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></template>
            <template v-else-if="h.icon === 'tag'"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></template>
            <template v-else-if="h.icon === 'media'"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></template>
            <template v-else-if="h.icon === 'plan'"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></template>
            <template v-else-if="h.icon === 'settings'"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></template>
          </svg>
          <span class="history-title">{{ h.title }}</span>
          <span v-if="h.folderName" class="history-folder">{{ h.folderName }}</span>
          <span class="history-time">{{ h.timeLabel }}</span>
        </button>
        <div v-if="!routeHistory.length" class="empty-mini">暂无浏览记录</div>
      </div>
    </div>
    
    <div v-if="!collapsed" class="sidebar-footer">
      <router-link to="/settings" class="footer-settings-btn" active-class="active" title="设置">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      </router-link>
      <button type="button" class="theme-row" :title="themeStore.isDark ? '切换到浅色模式' : '切换到深色模式'" @click="themeStore.toggle">
        <div class="theme-row-left">
          <span class="theme-row-icon">
            <svg v-if="!themeStore.isDark" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="4"/>
              <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/>
            </svg>
            <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </span>
          <span class="theme-row-label">{{ themeStore.isDark ? '深色模式' : '浅色模式' }}</span>
        </div>
        <span class="theme-row-switch" :class="{ on: themeStore.isDark }">
          <span class="theme-row-knob"></span>
        </span>
      </button>
    </div>

    <Teleport to="body">
      <JellyModal :show="showCreateFolderModal" @close="cancelCreateFolderModal">
        <div class="modal-content create-folder-modal">
          <h3>新建文件夹</h3>
          <input
            ref="folderNameInputRef"
            v-model="newFolderModalName"
            type="text"
            class="input"
            placeholder="请输入文件夹名称"
            maxlength="50"
            @keyup.enter="confirmCreateFolderModal"
            @keyup.esc="cancelCreateFolderModal"
          />
          <div class="folder-select-wrapper">
              <label>父级文件夹</label>
              <div class="custom-select">
                <div 
                  ref="folderSelectTriggerRef"
                  class="custom-select-trigger" 
                  :class="{ 'has-value': selectedParentFolderId !== null }"
                  @click="toggleFolderDropdown"
                >
                  <span class="custom-select-text">
                    {{ selectedParentFolderId !== null 
                      ? getFolderDisplayPath(selectedParentFolderId) || '未找到文件夹' 
                      : '无父级文件夹（根目录）' }}
                  </span>
                  <svg 
                    class="custom-select-arrow" 
                    :class="{ flipped: folderDropdownOpen }"
                    width="12" 
                    height="12" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    stroke-width="2.5" 
                    stroke-linecap="round" 
                    stroke-linejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </div>
                <Teleport to="body">
                  <Transition name="custom-select">
                    <div v-if="folderDropdownOpen" class="custom-select-dropdown" :style="folderDropdownStyle">
                      <div
                        class="custom-select-option"
                        :class="{ selected: selectedParentFolderId === null }"
                        @click="selectParentFolder(null)"
                      >
                        无父级文件夹（根目录）
                      </div>
                      <div
                        v-for="folder in availableParentFolders"
                        :key="folder.id"
                        class="custom-select-option"
                        :class="{ selected: selectedParentFolderId === folder.id }"
                        @click="selectParentFolder(folder.id)"
                      >
                        <div class="folder-option-content">
                          <span class="folder-option-name">{{ folder.name }}</span>
                          <span v-if="folder.parentId" class="folder-option-path">{{ getFolderParentPath(folder.parentId) }}</span>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </Teleport>
              </div>
            </div>
          <div class="modal-tag-section">
            <label>标签 <span class="optional">（可选）</span></label>
            <div class="modal-tag-selected">
              <span
                v-for="tid in selectedModalTagIds"
                :key="tid"
                class="modal-tag-chip"
                :style="{ background: tagColor(tid) + '22', color: tagColor(tid), borderColor: tagColor(tid) + '55' }"
              >
                {{ tagName(tid) }}
                <button type="button" class="modal-tag-remove" @click="toggleModalFolderTag(tid)" title="移除">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                </button>
              </span>
              <div class="modal-tag-add-wrap">
                <button ref="modalTagAddBtnRef" type="button" class="modal-tag-add-btn" @click.stop="toggleModalTagDropdown">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                    <line x1="12" y1="5" x2="12" y2="19"/>
                    <line x1="5" y1="12" x2="19" y2="12"/>
                  </svg>
                  添加标签
                </button>
                <Teleport to="body">
                <div v-if="showModalTagDropdown" class="modal-tag-dropdown" :style="modalTagDropdownStyle" @click.stop>
                  <input
                    v-model="modalTagSearch"
                    type="text"
                    class="input modal-tag-search"
                    placeholder="搜索或创建标签..."
                    @keyup.enter="createModalFolderTag"
                  />
                  <div class="modal-tag-list">
                    <div
                      v-for="t in modalAvailableTags"
                      :key="t.id"
                      class="modal-tag-option"
                      :class="{ selected: selectedModalTagIds.includes(t.id) }"
                      @click="toggleModalFolderTag(t.id)"
                    >
                      <span class="modal-tag-dot" :style="{ background: t.color }"></span>
                      <span class="modal-tag-name">{{ t.name }}</span>
                      <svg v-if="selectedModalTagIds.includes(t.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    </div>
                    <div v-if="modalTagSearch.trim() && !modalExactTagExists" class="modal-tag-create" @click="createModalFolderTag">
                      创建「{{ modalTagSearch.trim() }}」
                    </div>
                    <div v-if="!tagStore.tags.length && !modalTagSearch.trim()" class="modal-tag-empty">
                      还没有标签，输入名称创建
                    </div>
                  </div>
                </div>
                </Teleport>
              </div>
            </div>
          </div>
          <div v-if="folderNameError" class="folder-error-tip">文件夹名称已存在</div>
          <div class="modal-actions">
            <button class="btn btn-secondary" @click="cancelCreateFolderModal">取消</button>
            <button class="btn btn-primary" @click="confirmCreateFolderModal">创建</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>

    <Teleport to="body">
      <JellyModal :show="!!noteToDelete" @close="noteToDelete = null">
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
              <h3>删除笔记</h3>
              <p>确定删除「{{ noteToDelete.title || '无标题笔记' }}」吗？此操作不可恢复。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button type="button" class="btn btn-secondary" @click="noteToDelete = null">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmDeleteNote">删除</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>

    <Teleport to="body">
      <JellyModal :show="!!folderToDelete" @close="folderToDelete = null">
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
              <p>确定删除文件夹「{{ folderToDelete.name }}」吗？该文件夹下的所有子文件夹和笔记都会移入回收站，30 天后自动清除。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button type="button" class="btn btn-secondary" @click="folderToDelete = null">取消</button>
            <button type="button" class="btn btn-primary" @click="confirmDeleteFolder">删除</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>

    <Teleport to="body">
      <JellyModal :show="folderTagPicker.show" @close="closeFolderTagPicker">
        <div class="modal-content folder-tag-picker-modal">
          <h3>设置标签</h3>
          <p class="folder-tag-target-name">{{ folderTagPicker.folderName }}</p>
          <input
            v-model="folderTagPicker.search"
            type="text"
            class="input"
            placeholder="搜索或创建标签..."
            @keyup.enter="createFolderCtxTag"
          />
          <div class="folder-tag-list">
            <div
              v-for="t in folderTagAvailable"
              :key="t.id"
              class="folder-tag-item"
              :class="{ selected: folderTagCurrent.includes(t.id) }"
              @click="toggleFolderCtxTag(t.id)"
            >
              <span class="folder-tag-dot" :style="{ background: t.color }"></span>
              <span class="folder-tag-name">{{ t.name }}</span>
              <svg v-if="folderTagCurrent.includes(t.id)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div
              v-if="folderTagPicker.search.trim() && !folderTagExactExists"
              class="folder-tag-create"
              @click="createFolderCtxTag"
            >
              创建「{{ folderTagPicker.search.trim() }}」
            </div>
            <div v-if="!tagStore.tags.length && !folderTagPicker.search.trim()" class="folder-tag-empty">
              还没有标签，输入名称创建
            </div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-primary" @click="closeFolderTagPicker">完成</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>
  </aside>
</template>

<script setup>
import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { useTagStore, TAG_PRESET_COLORS } from '@/stores/tag'
import { useThemeStore } from '@/stores/theme'
import { useToast } from '@/composables/useToast'
import { formatRelativeTime } from '@/utils'

defineProps({
  collapsed: Boolean
})

defineEmits(['toggle-collapse'])

const router = useRouter()
const route = useRoute()
const noteStore = useNoteStore()
const planStore = usePlanStore()
const tagStore = useTagStore()
const themeStore = useThemeStore()
const { error: toastError } = useToast()

const editingFolderId = ref(null)
const editingFolderName = ref('')
const folderInputRef = ref(null)
const newFolderInputRef = ref(null)
const folderNameError = ref(false)
const isCreatingFolder = ref(false)
const newFolderName = ref('')
const newFolderParentId = ref(null)
const folderContextMenu = ref({ show: false, x: 0, y: 0, folder: null })
const expandedFolderIds = ref(new Set())
const collapsedSections = ref({})
function toggleSection(key) {
  collapsedSections.value = { ...collapsedSections.value, [key]: !collapsedSections.value[key] }
}
function isSectionCollapsed(key) {
  return !!collapsedSections.value[key]
}
const noteToDelete = ref(null)
const folderToDelete = ref(null)
const showCreateFolderModal = ref(false)
const newFolderModalName = ref('')
const selectedParentFolderId = ref(null)
const selectedModalTagIds = ref([])
const modalTagSearch = ref('')
const showModalTagDropdown = ref(false)
const modalTagAddBtnRef = ref(null)
const modalTagDropdownStyle = ref({})

const modalAvailableTags = computed(() => {
  const kw = modalTagSearch.value.trim().toLowerCase()
  return tagStore.tags
    .filter(t => !kw || t.name.toLowerCase().includes(kw))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
})

const modalExactTagExists = computed(() => {
  const kw = modalTagSearch.value.trim().toLowerCase()
  return !!kw && tagStore.tags.some(t => t.name.toLowerCase() === kw)
})
const folderNameInputRef = ref(null)
const folderDropdownOpen = ref(false)
const folderDropdownStyle = ref({})
const folderSelectTriggerRef = ref(null)

const todayPlanCount = computed(() => planStore.todayPlans?.length || 0)
const tagCount = computed(() => tagStore.tags?.length || 0)
const currentFolderName = computed(() => {
  if (!noteStore.currentFolderId) return ''
  return noteStore.folders.find(f => f.id === noteStore.currentFolderId)?.name || ''
})

const visibleFolders = computed(() => {
  const result = []
  function walk(parentId, depth) {
    const children = noteStore.folders
      .filter(f => (f.parentId || null) === parentId && !f.deleted)
      .sort((a, b) => {
        if (a.isSystem && !b.isSystem) return -1
        if (!a.isSystem && b.isSystem) return 1
        return a.createdAt - b.createdAt
      })
    for (const folder of children) {
      result.push({ folder, depth })
      if (expandedFolderIds.value.has(folder.id)) {
        walk(folder.id, depth + 1)
      }
    }
  }
  walk(null, 0)
  return result
})

const availableParentFolders = computed(() => {
  return noteStore.folders
    .filter(f => !f.deleted)
    .sort((a, b) => a.createdAt - b.createdAt)
})

function selectFolder(id) {
  noteStore.setCurrentFolder(id)
  router.push('/notes')
}

function focusRef(refEl) {
  const val = refEl.value
  if (!val) return
  const el = Array.isArray(val) ? val[0] : val
  el?.focus?.()
  if (el && typeof el.select === 'function') el.select()
}
function openNote(id) {
  const targetNote = noteStore.notes.find(n => n.id === id)
  if (targetNote && targetNote.folderId !== noteStore.currentFolderId) {
    noteStore.setCurrentFolder(targetNote.folderId || null)
  }
  router.push(`/note/${id}`)
}

function askDeleteNote(note) {
  noteToDelete.value = note
}

function confirmDeleteNote() {
  const note = noteToDelete.value
  if (!note) return
  noteStore.deleteNote(note.id)
  if (route.params.id === note.id) {
    router.push('/notes')
  }
  noteToDelete.value = null
}

function getFolderNoteCount(folderId) {
  return noteStore.getFolderNoteCount?.(folderId) || 0
}

function formatTime(timestamp) {
  return formatRelativeTime(timestamp)
}

function getFolderPath(folderId) {
  return noteStore.getFolderPathString?.(folderId)
}

function isFolderExpanded(folderId) {
  return expandedFolderIds.value.has(folderId)
}

function hasChildFolders(folderId) {
  return noteStore.folders.some(f => f.parentId === folderId && !f.deleted)
}

function onFolderClick(folder) {
  if (noteStore.currentFolderId === folder.id) {
    noteStore.setCurrentFolder(null)
    router.push('/notes')
    return
  }
  if (hasChildFolders(folder.id)) {
    toggleFolderExpandById(folder.id)
  }
  selectFolder(folder.id)
}

function toggleFolderExpandById(folderId) {
  const next = new Set(expandedFolderIds.value)
  if (next.has(folderId)) next.delete(folderId)
  else next.add(folderId)
  expandedFolderIds.value = next
}

function validateFolderName(name, excludeId = null, parentId = null) {
  const trimmed = name.trim()
  if (!trimmed) return false
  const duplicated = noteStore.folders.some(folder => (
    !folder.deleted &&
    folder.id !== excludeId &&
    folder.parentId === parentId &&
    folder.name.trim() === trimmed
  ))
  folderNameError.value = duplicated
  return !duplicated
}

function onFolderNameInput(e) {
  const name = e.target.value
  const excludeId = editingFolderId.value
  const parentId = editingFolderId.value
    ? noteStore.folders.find(f => f.id === editingFolderId.value)?.parentId ?? null
    : newFolderParentId.value
  validateFolderName(name, excludeId, parentId)
}

function startRenameFolder(folder) {
  if (folder.isSystem) return
  editingFolderId.value = folder.id
  editingFolderName.value = folder.name
  folderNameError.value = false
  nextTick(() => focusRef(folderInputRef))
}

function finishEditFolder() {
  if (!editingFolderId.value) return
  const folder = noteStore.folders.find(f => f.id === editingFolderId.value)
  if (!folder) return cancelEditFolder()
  if (!validateFolderName(editingFolderName.value, folder.id, folder.parentId)) return
  noteStore.renameFolder(folder.id, editingFolderName.value.trim())
  cancelEditFolder()
}

function cancelEditFolder() {
  editingFolderId.value = null
  editingFolderName.value = ''
  folderNameError.value = false
}

function createNewFolder(parentId = null) {
  if (parentId) {
    const next = new Set(expandedFolderIds.value)
    next.add(parentId)
    expandedFolderIds.value = next
  }
  showCreateFolderModal.value = true
  newFolderModalName.value = ''
  selectedParentFolderId.value = parentId
  selectedModalTagIds.value = []
  modalTagSearch.value = ''
  showModalTagDropdown.value = false
  folderNameError.value = false
  nextTick(() => focusRef(folderNameInputRef))
}

function finishCreateFolder() {
  if (!isCreatingFolder.value) return
  if (!validateFolderName(newFolderName.value, null, newFolderParentId.value)) return
  if (!newFolderName.value.trim()) return cancelCreateFolder()
  noteStore.createFolder(newFolderName.value.trim(), newFolderParentId.value)
  if (newFolderParentId.value) {
    const next = new Set(expandedFolderIds.value)
    next.add(newFolderParentId.value)
    expandedFolderIds.value = next
  }
  cancelCreateFolder()
}

function cancelCreateFolder() {
  isCreatingFolder.value = false
  newFolderParentId.value = null
  newFolderName.value = ''
  folderNameError.value = false
}

function showFolderContextMenu(e, folder) {
  folderContextMenu.value = { show: true, x: e.clientX, y: e.clientY, folder }
}

function hideFolderContextMenu() {
  folderContextMenu.value = { show: false, x: 0, y: 0, folder: null }
}

function createFolderFromMenu() {
  createNewFolder(folderContextMenu.value.folder?.id || null)
  hideFolderContextMenu()
}

function createNoteInFolder() {
  const folder = folderContextMenu.value.folder
  if (folder) noteStore.setCurrentFolder(folder.id)
  hideFolderContextMenu()
  // 复用笔记页的新建笔记弹窗（含标签/模板选择）
  window.__rgooseCreateNotePending = true
  router.push('/notes')
  window.dispatchEvent(new CustomEvent('rgoose:open-create-note'))
}


function confirmCreateFolderModal() {
  const name = newFolderModalName.value.trim()
  if (!name) {
    toastError('请输入文件夹名称')
    return
  }
  if (!validateFolderName(name, null, selectedParentFolderId.value)) return
  const folder = noteStore.createFolder(name, selectedParentFolderId.value)
  if (folder && selectedModalTagIds.value.length) {
    noteStore.setFolderTags(folder.id, [...selectedModalTagIds.value])
  }
  if (selectedParentFolderId.value) {
    const next = new Set(expandedFolderIds.value)
    next.add(selectedParentFolderId.value)
    expandedFolderIds.value = next
  }
  cancelCreateFolderModal()
}

function cancelCreateFolderModal() {
  showCreateFolderModal.value = false
  newFolderModalName.value = ''
  selectedParentFolderId.value = null
  selectedModalTagIds.value = []
  modalTagSearch.value = ''
  showModalTagDropdown.value = false
  folderNameError.value = false
  folderDropdownOpen.value = false
}

function toggleModalFolderTag(tagId) {
  const idx = selectedModalTagIds.value.indexOf(tagId)
  if (idx >= 0) selectedModalTagIds.value.splice(idx, 1)
  else selectedModalTagIds.value.push(tagId)
}

function toggleModalTagDropdown() {
  if (showModalTagDropdown.value) {
    showModalTagDropdown.value = false
    modalTagSearch.value = ''
  } else {
    showModalTagDropdown.value = true
    nextTick(() => positionModalTagDropdown())
  }
}

function positionModalTagDropdown() {
  const trigger = modalTagAddBtnRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const panelW = 220
  const panelH = 280
  let left = rect.left
  let top = rect.bottom + 6
  if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8
  if (top + panelH > window.innerHeight - 8) top = rect.top - panelH - 6
  if (left < 8) left = 8
  if (top < 8) top = 8
  modalTagDropdownStyle.value = { left: left + 'px', top: top + 'px', width: panelW + 'px' }
}

function createModalFolderTag() {
  const name = modalTagSearch.value.trim()
  if (!name) {
    toastError('请输入标签名称')
    return
  }
  let tag = tagStore.tags.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (!tag) {
    tag = tagStore.createTag(name, TAG_PRESET_COLORS[tagStore.tags.length % TAG_PRESET_COLORS.length])
  }
  if (tag && !selectedModalTagIds.value.includes(tag.id)) {
    selectedModalTagIds.value.push(tag.id)
  }
  modalTagSearch.value = ''
}

function tagName(id) {
  return tagStore.getTag(id)?.name || ''
}

function tagColor(id) {
  return tagStore.getTag(id)?.color || '#999'
}

function folderTagList(folder) {
  if (!Array.isArray(folder.tags) || !folder.tags.length) return []
  return folder.tags.slice(0, 3).map(id => ({ id, name: tagName(id), color: tagColor(id) }))
}

function noteTagList(note) {
  if (!Array.isArray(note.tags) || !note.tags.length) return []
  return note.tags.slice(0, 2).map(id => ({ id, name: tagName(id), color: tagColor(id) }))
}

function toggleFolderDropdown() {
  if (folderDropdownOpen.value) {
    closeFolderDropdown()
  } else {
    openFolderDropdown()
  }
}

function openFolderDropdown() {
  folderDropdownOpen.value = true
  nextTick(() => positionFolderDropdown())
}

function closeFolderDropdown() {
  folderDropdownOpen.value = false
}

function positionFolderDropdown() {
  const trigger = folderSelectTriggerRef.value
  if (!trigger) return
  const rect = trigger.getBoundingClientRect()
  const panelW = rect.width
  const panelH = 300
  let left = rect.left
  let top = rect.bottom + 6
  if (left + panelW > window.innerWidth - 8) left = window.innerWidth - panelW - 8
  if (top + panelH > window.innerHeight - 8) top = rect.top - panelH - 6
  if (left < 8) left = 8
  if (top < 8) top = 8
  folderDropdownStyle.value = { width: panelW + 'px', left: left + 'px', top: top + 'px' }
}

function selectParentFolder(folderId) {
  selectedParentFolderId.value = folderId
  closeFolderDropdown()
}

function handleFolderSelectDocClick(e) {
  if (folderDropdownOpen.value && !e.target.closest('.custom-select')) {
    closeFolderDropdown()
  }
}

function getFolderDisplayPath(folderId) {
  const path = noteStore.getFolderPathString?.(folderId)
  return path || noteStore.folders.find(f => f.id === folderId)?.name
}

function getFolderParentPath(parentId) {
  const parentPath = noteStore.getFolderPathString?.(parentId)
  return parentPath ? `所属文件夹： ${parentPath}` : ''
}

function renameFromContextMenu() {
  const folder = folderContextMenu.value.folder
  hideFolderContextMenu()
  if (folder) startRenameFolder(folder)
}

function deleteFromContextMenu() {
  const folder = folderContextMenu.value.folder
  hideFolderContextMenu()
  if (folder) {
    folderToDelete.value = folder
  }
}

function confirmDeleteFolder() {
  const folder = folderToDelete.value
  if (!folder) return
  noteStore.deleteFolder(folder.id)
  folderToDelete.value = null
}

const folderTagPicker = ref({ show: false, folderId: '', folderName: '', search: '' })

const folderTagAvailable = computed(() => {
  const kw = folderTagPicker.value.search.trim().toLowerCase()
  return tagStore.tags
    .filter(t => !kw || t.name.toLowerCase().includes(kw))
    .sort((a, b) => a.name.localeCompare(b.name, 'zh'))
})

const folderTagExactExists = computed(() => {
  const kw = folderTagPicker.value.search.trim().toLowerCase()
  return !!kw && tagStore.tags.some(t => t.name.toLowerCase() === kw)
})

const folderTagCurrent = computed(() => {
  if (!folderTagPicker.value.folderId) return []
  const folder = noteStore.folders.find(f => f.id === folderTagPicker.value.folderId)
  return Array.isArray(folder?.tags) ? folder.tags : []
})

function tagsFromContextMenu() {
  const folder = folderContextMenu.value.folder
  hideFolderContextMenu()
  if (!folder) return
  folderTagPicker.value = { show: true, folderId: folder.id, folderName: folder.name, search: '' }
}

function toggleFolderCtxTag(tagId) {
  const folderId = folderTagPicker.value.folderId
  if (!folderId) return
  const folder = noteStore.folders.find(f => f.id === folderId)
  if (!folder) return
  const current = Array.isArray(folder.tags) ? [...folder.tags] : []
  const idx = current.indexOf(tagId)
  if (idx >= 0) current.splice(idx, 1)
  else current.push(tagId)
  noteStore.setFolderTags(folderId, current)
}

function createFolderCtxTag() {
  const name = folderTagPicker.value.search.trim()
  if (!name) return
  let tag = tagStore.tags.find(t => t.name.toLowerCase() === name.toLowerCase())
  if (!tag) {
    tag = tagStore.createTag(name, TAG_PRESET_COLORS[tagStore.tags.length % TAG_PRESET_COLORS.length])
  }
  if (tag && !folderTagCurrent.value.includes(tag.id)) {
    toggleFolderCtxTag(tag.id)
  }
  folderTagPicker.value.search = ''
}

function closeFolderTagPicker() {
  folderTagPicker.value.show = false
  folderTagPicker.value.search = ''
}

// ===== 浏览历史 =====
const HISTORY_KEY = 'route_history'
const routeHistory = ref([])
const routeMeta = {
  Dashboard: { color: '#8b5cf6', icon: 'dashboard', label: '仪表盘' },
  Notes: { color: '#5a9e7a', icon: 'note', label: '笔记' },
  NoteEditor: { color: '#3b82f6', icon: 'edit', label: '编辑笔记' },
  Tags: { color: '#ec4899', icon: 'tag', label: '标签' },
  Media: { color: '#06b6d4', icon: 'media', label: '素材库' },
  Plans: { color: '#f59e0b', icon: 'plan', label: '计划' },
  Settings: { color: '#6b7280', icon: 'settings', label: '设置' }
}

function timeLabel(ts) {
  const diff = Date.now() - ts
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return Math.floor(diff / 60000) + '分钟前'
  if (diff < 86400000) return Math.floor(diff / 3600000) + '小时前'
  return Math.floor(diff / 86400000) + '天前'
}

function loadHistory() {
  try {
    const raw = localStorage.getItem(HISTORY_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) {
        parsed.forEach(r => { r.timeLabel = timeLabel(r.ts) })
        return parsed
      }
    }
  } catch { /* ignore */ }
  return []
}

function saveHistory() {
  try { localStorage.setItem(HISTORY_KEY, JSON.stringify(routeHistory.value)) } catch { /* ignore */ }
}

function trackRoute(to) {
  const name = to.name
  if (!name || name === 'NotFound') return
  // 获取笔记标题和所属文件夹
  let title = to.meta?.title || routeMeta[name]?.label || to.path
  let folderName = ''
  if (name === 'NoteEditor') {
    const note = noteStore.notes.find(n => n.id === to.params.id && !n.deleted)
    if (note) {
      title = note.title || '无标题笔记'
      if (note.folderId) {
        const folder = noteStore.folders.find(f => f.id === note.folderId && !f.deleted)
        if (folder) folderName = folder.name
      }
    }
  }
  const meta = routeMeta[name] || { color: '#999', icon: 'note' }
  const entry = { path: to.fullPath, title, folderName, name, ts: Date.now(), color: meta.color, icon: meta.icon, timeLabel: '刚刚' }
  routeHistory.value = routeHistory.value.filter(r => r.path !== entry.path)
  routeHistory.value.unshift(entry)
  if (routeHistory.value.length > 7) routeHistory.value.pop()
  routeHistory.value.forEach(r => { r.timeLabel = timeLabel(r.ts) })
  saveHistory()
}

function goToHistory(path) {
  if (route.fullPath !== path) router.push(path)
}

function clearHistory() {
  routeHistory.value = []
  saveHistory()
}

// 笔记被删除时，同步移除浏览历史中对应条目
watch(() => noteStore.notes, (notes) => {
  if (!routeHistory.value.length) return
  const deletedIds = new Set(notes.filter(n => n.deleted).map(n => n.id))
  if (!deletedIds.size) return
  const before = routeHistory.value.length
  routeHistory.value = routeHistory.value.filter(h => {
    if (h.name !== 'NoteEditor') return true
    const noteId = h.path.split('/note/')[1]
    return !noteId || !deletedIds.has(noteId)
  })
  if (routeHistory.value.length !== before) saveHistory()
}, { deep: true })

let historyTimer = null

onMounted(async () => {
  await noteStore.init()
  await planStore.init()
  await tagStore.init()
  document.addEventListener('click', hideFolderContextMenu)
  document.addEventListener('click', handleFolderSelectDocClick)
  document.addEventListener('click', closeFolderModalTagDropdown)

  // 浏览历史
  routeHistory.value = loadHistory()
  trackRoute(router.currentRoute.value)
  router.afterEach((to) => { trackRoute(to) })
  historyTimer = setInterval(() => { routeHistory.value.forEach(r => { r.timeLabel = timeLabel(r.ts) }) }, 60000)
})

onUnmounted(() => {
  document.removeEventListener('click', hideFolderContextMenu)
  document.removeEventListener('click', handleFolderSelectDocClick)
  document.removeEventListener('click', closeFolderModalTagDropdown)
  if (historyTimer) clearInterval(historyTimer)
})

function closeFolderModalTagDropdown(e) {
  if (!showModalTagDropdown.value) return
  if (e.target.closest('.modal-tag-add-wrap') || e.target.closest('.modal-tag-dropdown')) return
  showModalTagDropdown.value = false
  modalTagSearch.value = ''
}
</script>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  height: 100%;
  background: var(--bg-secondary);
  border-right: 1px solid var(--border-light);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  transition: width var(--transition-normal);
  overflow: hidden;
}

.sidebar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 16px 16px 20px;
  border-bottom: 1px solid var(--border-light);
  flex-shrink: 0;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  white-space: nowrap;
  overflow: hidden;
  flex-shrink: 0;
}

.logo > svg,
.logo > img {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
}

.logo > img {
  border-radius: 7px;
}

.logo-text {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-primary);
  letter-spacing: -0.02em;
}

.collapse-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.collapse-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.sidebar-collapsible-group {
  display: flex;
  flex-direction: column;
}

.group-folders {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 12px 16px 6px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.group-header:hover {
  color: var(--text-secondary);
}

.group-header-title {
  position: relative;
  padding-left: 10px;
}

.group-header-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 12px;
  background: var(--primary-color);
  border-radius: 2px;
  opacity: 0.7;
}

.group-toggle-icon {
  transition: transform 0.2s ease;
}

.group-toggle-icon.collapsed {
  transform: rotate(-90deg);
}

.section-header-btn {
  padding: 12px 4px 8px;
}

.sidebar-nav {
  padding: 4px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  transition: all var(--transition-fast);
  position: relative;
}

.nav-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.nav-item svg {
  transition: color var(--transition-fast);
}

.nav-notes svg { color: var(--primary-color); }
.nav-plans svg { color: var(--secondary-dark); }
.nav-dashboard svg { color: #4a9e9e; }
.nav-tags svg { color: #9b7bd6; }
.nav-media svg { color: #e8a838; }
.nav-settings svg { color: var(--info-color); }

.nav-notes:hover svg { color: var(--primary-dark); }
.nav-plans:hover svg { color: var(--secondary-dark); }
.nav-dashboard:hover svg { color: #3a8585; }
.nav-tags:hover svg { color: #9b7bd6; }
.nav-settings:hover svg { color: var(--info-dark); }

.nav-item.active {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.nav-notes.active { background: var(--primary-soft); color: var(--primary-dark); }
.nav-plans.active { background: var(--secondary-soft); color: var(--secondary-dark); }
.nav-dashboard.active { background: rgba(74, 158, 158, 0.16); color: #4a9e9e; }
.nav-tags.active { background: rgba(155, 123, 214, 0.16); color: #9b7bd6; }
.nav-settings.active { background: var(--info-soft); color: var(--info-dark); }

.nav-notes.active svg { color: var(--primary-color); }
.nav-plans.active svg { color: var(--secondary-color); }
.nav-dashboard.active svg { color: #4a9e9e; }
.nav-tags.active svg { color: #9b7bd6; }
.nav-settings.active svg { color: var(--info-color); }

.badge {
  margin-left: auto;
  background: var(--warning-color);
  color: white;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 10px;
  min-width: 20px;
  text-align: center;
}

.badge.tag-badge {
  background: #9b7bd6;
}

.sidebar-section {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 0 12px;
  overflow: hidden;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 8px 8px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.section-header > span {
  position: relative;
  padding-left: 10px;
}

.section-header > span::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 12px;
  border-radius: 2px;
  background: var(--primary-light);
}

.section-title-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
}

.current-folder-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--info-soft);
  color: var(--info-dark);
  font-size: 10px;
  font-weight: 500;
  letter-spacing: 0;
  text-transform: none;
}

.folder-list {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 4px;
}

.folder-empty,
.empty-mini {
  padding: 16px 10px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 8px 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.folder-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.folder-item.active {
  background: var(--primary-soft);
  color: var(--primary-color);
}

.folder-toggle {
  width: 12px;
  height: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: transform var(--transition-fast);
}

.folder-toggle.expanded {
  transform: rotate(90deg);
}

.folder-spacer {
  display: inline-block;
  width: 12px;
  flex-shrink: 0;
}

.folder-name {
  flex: 0 1 auto;
  min-width: 0;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-tags {
  display: flex;
  align-items: center;
  gap: 3px;
  flex-shrink: 0;
  margin-left: 4px;
  overflow: hidden;
}

.folder-tag-chip {
  max-width: 60px;
  padding: 0 5px;
  height: 16px;
  line-height: 16px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.folder-name-input {
  flex: 1;
  min-width: 0;
  padding: 4px 8px;
  font-size: 13px;
  border: 1px solid var(--primary-color);
  border-radius: var(--radius-sm);
  background: var(--bg-secondary);
  color: var(--text-primary);
}

.folder-name-input.error {
  border-color: var(--warning-color);
}

.folder-item.creating {
  background: var(--primary-soft);
  border: 1px dashed var(--primary-light);
}

.folder-input-wrapper {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.folder-error-tip {
  font-size: 11px;
  color: var(--warning-color);
  line-height: 1;
}

.folder-count {
  font-size: 11px;
  color: var(--secondary-dark);
  background: var(--secondary-softer);
  padding: 1px 6px;
  border-radius: 10px;
  flex-shrink: 0;
  margin-left: auto;
}

.folder-item.active .folder-count {
  background: rgba(107, 189, 143, 0.18);
  color: var(--primary-dark);
}

.btn-icon-small {
  padding: 4px;
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition-fast);
}

.btn-icon-small:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.note-list {
  flex: 1;
  overflow-y: auto;
  padding-bottom: 12px;
}

.note-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  margin-bottom: 2px;
}

.note-item:hover {
  background: var(--bg-hover);
}

.note-item.active {
  background: var(--primary-soft);
  opacity: 0.7;
}

.note-delete-btn {
  flex-shrink: 0;
  width: 26px;
  height: 26px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  opacity: 0;
  transition: all var(--transition-fast);
}

.note-item:hover .note-delete-btn {
  opacity: 1;
}

.note-delete-btn:hover {
  background: var(--warning-soft);
  color: var(--warning-color);
}

.note-icon {
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  background: var(--bg-tertiary);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--primary-color);
  flex-shrink: 0;
}

.note-info {
  flex: 1;
  min-width: 0;
}

.note-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-time {
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.note-folder {
  display: inline-block;
  padding: 1px 6px;
  background: var(--primary-soft);
  color: var(--primary-color);
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  max-width: 150px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.note-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 3px;
  margin-top: 3px;
}

.note-tag {
  display: inline-flex;
  align-items: center;
  padding: 1px 5px;
  border-radius: 999px;
  font-size: 9px;
  font-weight: 500;
  white-space: nowrap;
}

.sidebar-footer {
  padding: 12px 20px;
  border-top: 1px solid var(--border-light);
  display: flex;
  align-items: center;
  gap: 8px;
}

.footer-settings-btn {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-md);
  color: var(--text-secondary);
  transition: background var(--transition-fast), color var(--transition-fast);
}

.footer-settings-btn:hover {
  background: var(--bg-hover);
  color: var(--primary-color);
}

.footer-settings-btn.active {
  color: var(--primary-color);
  background: var(--primary-soft);
}

.theme-row {
  flex: 1;
  padding: 8px 0;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--text-secondary);
  transition: background var(--transition-fast);
}

.theme-row:hover {
  background: var(--bg-hover);
}

.theme-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.theme-row-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
}

.theme-row-label {
  font-size: 12px;
  font-weight: 500;
}

.theme-row-switch {
  width: 34px;
  height: 19px;
  border-radius: 999px;
  background: var(--bg-tertiary);
  position: relative;
  transition: background var(--transition-fast);
  flex-shrink: 0;
}

.theme-row-switch.on {
  background: var(--primary-color);
}

.theme-row-knob {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 15px;
  height: 15px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  transition: transform var(--transition-fast);
}

.theme-row-switch.on .theme-row-knob {
  transform: translateX(15px);
}

.folder-context-menu {
  position: fixed;
  z-index: 9999;
  background: var(--bg-secondary);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  border: 1px solid var(--border-light);
  padding: 4px;
  min-width: 120px;
  animation: ctxJellyPop var(--motion-jelly-menu) var(--motion-jelly-ease) backwards;
  transform-origin: top left;
}

.context-menu-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.context-menu-item:hover {
  background: var(--bg-hover);
}

.context-menu-item.danger {
  color: var(--warning-color);
}

@keyframes ctxJellyPop {
  0% { opacity: 0; transform: scale(0.88); }
  65% { opacity: 1; transform: scale(1.008); }
  100% { transform: none; opacity: 1; }
}

.folder-tag-picker-modal {
  width: 360px;
  max-width: 90vw;
  padding: 22px;
}

.folder-tag-picker-modal h3 {
  font-size: 17px;
  font-weight: 600;
  margin-bottom: 6px;
  color: var(--text-primary);
}

.folder-tag-target-name {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 14px;
}

.folder-tag-picker-modal .input {
  margin-bottom: 12px;
  font-size: 14px;
}

.folder-tag-list {
  max-height: 280px;
  overflow-y: auto;
  margin-bottom: 14px;
}

.folder-tag-item {
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

.folder-tag-item:hover {
  background: var(--bg-hover);
}

.folder-tag-item.selected {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.folder-tag-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.folder-tag-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.folder-tag-create {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.folder-tag-create:hover {
  background: var(--primary-soft);
}

.folder-tag-empty {
  padding: 16px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

.sidebar.collapsed {
  width: 64px;
}

.sidebar.collapsed .sidebar-header {
  padding: 16px 12px;
  justify-content: center;
}

.sidebar.collapsed .sidebar-nav {
  padding: 12px 8px;
}

.sidebar.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
}

.sidebar.collapsed .badge {
  position: absolute;
  top: 4px;
  right: 2px;
  margin-left: 0;
}


.create-folder-modal {
  width: 380px;
  max-width: 90vw;
  padding: 24px;
}

.create-folder-modal h3 {
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 16px;
  color: var(--text-primary);
}

.create-folder-modal .input {
  margin-bottom: 20px;
  font-size: 15px;
}

.folder-select-wrapper {
  margin-bottom: 20px;
}

.folder-select-wrapper label {
  display: block;
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
  font-weight: 500;
}

.custom-select {
  position: relative;
  width: 100%;
}

.custom-select-trigger {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-radius: var(--radius-md);
  border: 1px solid var(--border-light);
  background: var(--bg-tertiary);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.custom-select-trigger:hover {
  background-color: var(--bg-hover);
  border-color: var(--primary-light);
}

.custom-select-trigger:focus {
  outline: none;
  border-color: var(--primary-color);
  background-color: var(--bg-tertiary);
  box-shadow: 0 0 0 3px rgba(107, 189, 143, 0.1);
}

.custom-select-text {
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.custom-select-arrow {
  flex-shrink: 0;
  color: var(--text-tertiary);
  transition: transform var(--transition-fast);
}

.custom-select-arrow.flipped {
  transform: rotate(180deg);
}

.custom-select-dropdown {
  position: fixed;
  z-index: 9999;
  max-height: 300px;
  overflow-y: auto;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  padding: 8px;
  box-sizing: border-box;
  min-width: 120px;
}

.custom-select-option {
  padding: 10px 14px;
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-size: 14px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.folder-option-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.folder-option-name {
  font-weight: 500;
  color: var(--text-primary);
}

.folder-option-path {
  font-size: 12px;
  color: var(--text-tertiary);
  font-weight: 400;
}

.custom-select-option:hover {
  background: var(--bg-hover);
  color: var(--primary-dark);
}

.custom-select-option:hover .folder-option-path {
  color: var(--text-secondary);
}

.custom-select-option.selected {
  background: var(--primary-color);
  color: white;
  font-weight: 600;
}

.custom-select-option.selected .folder-option-name {
  color: white;
}

.custom-select-option.selected .folder-option-path {
  color: rgba(255, 255, 255, 0.7);
}

.custom-select-enter-active,
.custom-select-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.custom-select-enter-from,
.custom-select-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.create-folder-modal .folder-error-tip {
  margin-bottom: 20px;
  padding: 8px 12px;
  background: var(--warning-soft);
  border-radius: var(--radius-sm);
  font-size: 12px;
  color: var(--warning-color);
  line-height: 1.4;
}

.create-folder-modal .modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.modal-tag-section {
  margin-bottom: 16px;
}

.modal-tag-section > label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.modal-tag-section .optional {
  font-weight: 400;
  color: var(--text-tertiary);
  font-size: 12px;
}

.modal-tag-selected {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
  min-height: 34px;
  padding: 4px 6px;
  background: var(--bg-tertiary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-sm);
}

.modal-tag-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  border: 1px solid;
}

.modal-tag-remove {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  color: inherit;
  opacity: 0.6;
  transition: opacity var(--transition-fast);
}

.modal-tag-remove:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.12);
}

.modal-tag-add-wrap {
  position: relative;
}

.modal-tag-add-btn {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  font-size: 12px;
  color: var(--text-secondary);
  border: 1px dashed var(--border-color);
  transition: all var(--transition-fast);
}

.modal-tag-add-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.modal-tag-dropdown {
  position: fixed;
  z-index: 100000;
  width: 220px;
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
}

.modal-tag-search {
  margin: 0;
  border: none;
  border-bottom: 1px solid var(--border-light);
  border-radius: 0;
  padding: 8px 10px;
  font-size: 13px;
  width: 100%;
  box-sizing: border-box;
}

.modal-tag-list {
  max-height: 200px;
  overflow-y: auto;
  padding: 4px;
}

.modal-tag-option {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  color: var(--text-primary);
  transition: background var(--transition-fast);
}

.modal-tag-option:hover {
  background: var(--bg-hover);
}

.modal-tag-option.selected {
  background: var(--primary-soft);
  color: var(--primary-dark);
}

.modal-tag-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.modal-tag-name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.modal-tag-create {
  padding: 8px 10px;
  font-size: 13px;
  color: var(--primary-color);
  cursor: pointer;
  border-radius: var(--radius-sm);
}

.modal-tag-create:hover {
  background: var(--primary-soft);
}

.modal-tag-empty {
  padding: 12px;
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
}

/* ===== 浏览历史 ===== */
.btn-history-clear {
  opacity: 0.4;
  transition: opacity var(--transition-fast);
}
.btn-history-clear:hover {
  opacity: 1;
  color: #ef4444;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-bottom: 12px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border-radius: var(--radius-md);
  border: none;
  background: transparent;
  cursor: pointer;
  transition: all var(--transition-fast);
  width: 100%;
  text-align: left;
}

.history-item:hover {
  background: var(--bg-hover);
}

.history-item.active {
  background: color-mix(in srgb, var(--primary-color) 10%, transparent);
}

.history-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}

.history-icon {
  flex-shrink: 0;
  color: var(--text-tertiary);
}

.history-item.active .history-icon {
  color: var(--primary-color);
}

.history-title {
  flex: 1;
  font-size: 13px;
  color: var(--text-secondary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-item.active .history-title {
  color: var(--primary-color);
  font-weight: 600;
}

.history-folder {
  flex-shrink: 0;
  max-width: 70px;
  font-size: 10px;
  color: var(--text-tertiary);
  background: var(--bg-tertiary);
  padding: 1px 6px;
  border-radius: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.history-time {
  font-size: 10px;
  color: var(--text-tertiary);
  flex-shrink: 0;
  white-space: nowrap;
}
</style>

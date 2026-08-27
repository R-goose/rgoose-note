<template>
  <div class="settings-view">
    <header class="view-header">
      <div class="header-left">
        <h1>设置</h1>
      </div>
      <div class="search-box">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          ref="searchInputRef"
          v-model="searchQuery"
          type="text"
          placeholder="搜索设置..."
          class="search-input"
          @input="onSearchInput"
          @keydown.esc="closeSearch"
          @keydown.down.prevent="moveHighlight(1)"
          @keydown.up.prevent="moveHighlight(-1)"
          @keydown.enter.prevent="selectHighlighted"
          @focus="showResults = true"
        />
        <Transition name="search-dropdown">
          <div v-if="showResults && searchResults.length > 0" class="search-dropdown">
            <div
              v-for="(r, i) in searchResults"
              :key="r.id"
              class="search-result-item"
              :class="{ active: i === highlightIndex }"
              @mouseenter="highlightIndex = i"
              @mousedown.prevent="goToSetting(r)"
            >
              <span class="result-group">{{ r.group }}</span>
              <span class="result-name">{{ r.name }}</span>
              <span v-if="r.desc" class="result-desc">{{ r.desc }}</span>
            </div>
          </div>
        </Transition>
      </div>
    </header>

    <div class="settings-content">
     <BgDecor />
     <div class="settings-inner">
      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-blue"></span>数据管理</h2>
        <div class="settings-list">
          <div id="set-export" class="setting-item">
            <div class="setting-info">
              <div class="setting-name">导出数据</div>
              <div class="setting-desc">将所有笔记和计划导出为 JSON 文件备份</div>
            </div>
            <button class="btn btn-secondary btn-export" @click="handleExport">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="17 8 12 3 7 8" />
                  <line x1="12" y1="3" x2="12" y2="15" />
                </svg>
 
              导出
            </button>
          </div>

          <div id="set-import" class="setting-item">
            <div class="setting-info">
              <div class="setting-name">导入数据</div>
              <div class="setting-desc">从 JSON 备份文件恢复数据</div>
            </div>
            <button class="btn btn-secondary btn-import" @click="handleImport">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              导入
            </button>
          </div>

          <div id="set-sync" class="setting-item">
            <div class="setting-info">
              <div class="setting-name">保存状态</div>
              <div class="setting-desc">上次保存：{{ lastSyncTimeStr }}</div>
            </div>
            <div class="sync-badge synced">
              <div class="sync-dot synced"></div>
              已保存
            </div>
          </div>

          <div id="set-cache" class="setting-item">
            <div class="setting-info">
              <div class="setting-name">清除缓存</div>
              <div class="setting-desc">清除本地存储数据（操作前请先导出备份）</div>
            </div>
            <button class="btn btn-danger-outline" @click="handleClearCache">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                stroke-linecap="round">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              </svg>
              清除
            </button>
          </div>

          <div v-if="storageSize" id="set-usage" class="setting-item storage-usage-item">
            <div class="setting-info">
              <div class="setting-name">存储占用 <span class="total-usage">共 {{ formatBytes(usageTotal) }}</span></div>
              <div class="storage-usage-bar">
                <div class="usage-segment notes" :style="{ width: notesUsagePercent + '%' }" title="笔记数据"></div>
                <div class="usage-segment images" :style="{ width: imagesUsagePercent + '%' }" title="图片文件"></div>
                <div class="usage-segment backups" :style="{ width: backupUsagePercent + '%' }" title="备份文件"></div>
              </div>
              <div class="storage-usage-detail">
                <span class="usage-tag notes">笔记 {{ formatBytes(storageSize.dataFileSize != null ? storageSize.dataFileSize : storageSize.dataSize) }}</span>
                <span class="usage-tag images">图片 {{ formatBytes(storageSize.imagesDirSize) }}</span>
                <span class="usage-tag backups">备份 {{ formatBytes(storageSize.backupSize) }}（{{ storageSize.backupCount }} 份）</span>
              </div>
              <div v-if="storageSize.appSize != null" class="storage-usage-detail app-usage-line">
                <span class="usage-tag app">应用本体 {{ formatBytes(storageSize.appSize) }}</span>
              </div>
            </div>
          </div>

          <div id="set-backup" class="setting-item">
            <div class="setting-info">
              <div class="setting-name">本地备份</div>
              <div class="setting-desc">生成完整备份（含数据和图片，打包为 zip），最多保留 5 份</div>
            </div>
            <div class="storage-actions">
              <button v-if="storageType === 'electron'" class="btn btn-secondary" @click="openBackupsFolder" title="打开备份所在目录">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                打开目录
              </button>
              <button class="btn btn-export" @click="handleCreateBackup">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                生成备份
              </button>
            </div>
          </div>

          <div v-if="backups.length" class="backup-list">
            <div v-for="b in backups" :key="b.name" class="backup-item">
              <div class="backup-info">
                <span class="backup-time">{{ formatBackupTime(b.mtime) }}</span>
                <span class="backup-size">{{ formatBytes(b.size) }}</span>
              </div>
              <div class="backup-actions">
                  <button v-if="storageType === 'electron'" class="action-icon-btn secondary" @click="openBackup(b.name)"
                    title="在资源管理器中显示">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round">
                      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                    </svg>
                  </button>
                  <button class="action-icon-btn danger" @click="handleDeleteBackup(b.name)" title="删除备份">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
              </div>

            </div>
          </div>

          <div id="set-location" class="setting-item storage-location-item">
            <div class="setting-info">
              <div class="setting-name">
                文件存储位置
                <span v-if="storageIsCustom" class="custom-badge">自定义</span>
              </div>
              <div class="setting-desc">{{ storageLocation }}</div>
              <div v-if="migrating" class="migrating-hint">
                <span class="mini-spinner"></span> 正在迁移数据，请稍候...
              </div>
            </div>
            <div class="storage-actions">
              <button v-if="storageType === 'electron'" class="btn btn-secondary" @click="openStorageLocation" title="在文件资源管理器中打开">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                </svg>
                打开
              </button>
              <button class="btn btn-secondary" @click="copyStorageLocation">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                复制
              </button>
              <template v-if="storageType === 'electron'">
                <button v-if="!storageIsCustom" class="btn btn-export" :disabled="migrating" @click="handleChangeStorage">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round">
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                  更改位置
                </button>
                <button v-else class="btn btn-export" :disabled="migrating" @click="handleResetStorage">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                    stroke-linecap="round">
                    <polyline points="1 4 1 10 7 10" />
                    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                  </svg>
                  恢复默认
                </button>
              </template>
            </div>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-purple"></span>快捷键</h2>
        <div class="shortcut-toolbar">
          <span class="shortcut-tip">点击按键框重新录入，按 Esc 取消</span>
          <button class="btn btn-secondary btn-sm" @click="resetAllShortcuts">全部恢复默认</button>
        </div>
        <div class="shortcut-groups">
          <div v-for="(actions, group) in shortcutStore.groupedActions" :key="group" class="shortcut-group">
            <div class="shortcut-group-title">{{ group }}</div>
            <div class="shortcut-list">
              <div v-for="act in actions" :key="act.id" :id="`sc-${act.id}`" class="shortcut-item">
                <div class="shortcut-info">
                  <div class="shortcut-name">
                    {{ act.label }}
                    <span v-if="!shortcutStore.isDefault(act.id)" class="custom-tag">自定义</span>
                  </div>
                </div>
                <div class="shortcut-actions">
                  <button
                    class="keybind-box"
                    :class="{ recording: recordingId === act.id, conflict: conflictInfo(act.id) }"
                    @click="startRecording(act.id)"
                    @keydown="onRecordKeydown($event, act.id)"
                    @blur="cancelRecording"
                  >
                    <template v-if="recordingId === act.id">按下快捷键…</template>
                    <template v-else>{{ formatCombo(shortcutStore.getCombo(act.id)) }}</template>
                  </button>
                  <button
                    v-if="!shortcutStore.isDefault(act.id)"
                    class="btn-reset"
                    title="恢复默认"
                    @click="shortcutStore.resetShortcut(act.id)"
                  >↺</button>
                </div>
                <div v-if="conflictInfo(act.id)" class="conflict-warn">与「{{ conflictInfo(act.id).label }}」冲突</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-yellow"></span>AI 设置</h2>
        <div class="settings-list">
          <div id="set-ai-key" class="setting-item">
            <div class="setting-info">
              <div class="setting-name">API Key</div>
              <div class="setting-desc">智谱 AI 接口密钥（免费注册：<a href="https://open.bigmodel.cn" target="_blank" style="color: var(--primary-color)">open.bigmodel.cn</a>）</div>
            </div>
            <input
              v-model="aiApiKey"
              type="password"
              class="ai-key-input"
              placeholder="粘贴你的 API Key"
              spellcheck="false"
              autocapitalize="off"
              autocomplete="off"
              @change="saveAiSettings"
            />
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">文本对话模型</div>
              <div class="setting-desc">GLM-4.7-Flash 为永久免费</div>
            </div>
            <div class="ai-model-row">
              <div class="ai-combobox" ref="textComboboxRef">
                <input
                  v-model="aiModel"
                  type="text"
                  class="ai-key-input ai-combobox-input"
                  placeholder="glm-4.7-flash"
                  spellcheck="false"
                  autocapitalize="off"
                  autocomplete="off"
                  @change="saveAiSettings"
                  @focus="openDropdown('text')"
                  @input="onComboboxInput('text')"
                />
                <button type="button" class="ai-combobox-arrow" @click="toggleDropdown('text')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div v-if="activeDropdown === 'text'" class="ai-combobox-panel">
                  <div v-if="!filteredTextModels.length" class="ai-combobox-empty">无匹配模型，点右侧"刷新模型列表"</div>
                  <div
                    v-for="m in filteredTextModels"
                    :key="m.id"
                    class="ai-combobox-option"
                    :class="{ active: m.id === aiModel, free: m.free }"
                    @mousedown.prevent="pickModel('text', m.id)"
                  >
                    <span class="ai-model-id">{{ m.id }}</span>
                    <span class="ai-model-tag" :class="m.free ? 'is-free' : 'is-paid'">{{ m.free ? '免费' : '收费' }}</span>
                    <span v-if="m.tag" class="ai-model-desc">{{ m.tag.replace(/^(免费|收费)\s·\s/, '') }}</span>
                  </div>
                </div>
              </div>
              <button class="btn-fetch-models" :disabled="loadingModels" @click="fetchAiModels">
                {{ loadingModels ? '获取中...' : '刷新模型列表' }}
              </button>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">图片生成模型</div>
              <div class="setting-desc">CogView-3-Flash 为永久免费</div>
            </div>
            <div class="ai-model-row">
              <div class="ai-combobox" ref="imageComboboxRef">
                <input
                  v-model="aiImageModel"
                  type="text"
                  class="ai-key-input ai-combobox-input"
                  placeholder="cogview-3-flash"
                  spellcheck="false"
                  autocapitalize="off"
                  autocomplete="off"
                  @change="saveAiSettings"
                  @focus="openDropdown('image')"
                  @input="onComboboxInput('image')"
                />
                <button type="button" class="ai-combobox-arrow" @click="toggleDropdown('image')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div v-if="activeDropdown === 'image'" class="ai-combobox-panel">
                  <div v-if="!filteredImageModels.length" class="ai-combobox-empty">无匹配模型，点右侧"刷新模型列表"</div>
                  <div
                    v-for="m in filteredImageModels"
                    :key="m.id"
                    class="ai-combobox-option"
                    :class="{ active: m.id === aiImageModel, free: m.free }"
                    @mousedown.prevent="pickModel('image', m.id)"
                  >
                    <span class="ai-model-id">{{ m.id }}</span>
                    <span class="ai-model-tag" :class="m.free ? 'is-free' : 'is-paid'">{{ m.free ? '免费' : '收费' }}</span>
                    <span v-if="m.tag" class="ai-model-desc">{{ m.tag.replace(/^(免费|收费)\s·\s/, '') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <div class="setting-name">视频生成模型</div>
              <div class="setting-desc">CogVideoX-Flash 为永久免费（清影）</div>
            </div>
            <div class="ai-model-row">
              <div class="ai-combobox" ref="videoComboboxRef">
                <input
                  v-model="aiVideoModel"
                  type="text"
                  class="ai-key-input ai-combobox-input"
                  placeholder="cogvideox-flash"
                  spellcheck="false"
                  autocapitalize="off"
                  autocomplete="off"
                  @change="saveAiSettings"
                  @focus="openDropdown('video')"
                  @input="onComboboxInput('video')"
                />
                <button type="button" class="ai-combobox-arrow" @click="toggleDropdown('video')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                </button>
                <div v-if="activeDropdown === 'video'" class="ai-combobox-panel">
                  <div v-if="!filteredVideoModels.length" class="ai-combobox-empty">无匹配模型，点右侧"刷新模型列表"</div>
                  <div
                    v-for="m in filteredVideoModels"
                    :key="m.id"
                    class="ai-combobox-option"
                    :class="{ active: m.id === aiVideoModel, free: m.free }"
                    @mousedown.prevent="pickModel('video', m.id)"
                  >
                    <span class="ai-model-id">{{ m.id }}</span>
                    <span class="ai-model-tag" :class="m.free ? 'is-free' : 'is-paid'">{{ m.free ? '免费' : '收费' }}</span>
                    <span v-if="m.tag" class="ai-model-desc">{{ m.tag.replace(/^(免费|收费)\s·\s/, '') }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section v-if="canCloseToTray" class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-blue"></span>通用</h2>
        <div class="settings-list">
          <div id="set-close-to-tray" class="setting-item">
            <div class="setting-info">
              <div class="setting-name">关闭到托盘</div>
              <div class="setting-desc">开启后点击窗口关闭按钮将最小化到系统托盘，应用继续在后台运行，可从托盘图标重新打开或退出。</div>
            </div>
            <label class="switch-wrap">
              <input type="checkbox" v-model="closeToTray" @change="onToggleCloseToTray" />
              <span class="switch-track"><span class="switch-thumb"></span></span>
            </label>
          </div>
        </div>
      </section>

      <section class="settings-section">
        <h2 class="section-title"><span class="title-bar bar-green"></span>关于</h2>
        <div class="settings-list">
          <div id="set-about-version" class="setting-item">
            <div class="setting-info">
              <div class="setting-name brand-name">R-Goose Note</div>
              <div class="setting-desc">版本 2.3.7</div>
            </div>
          </div>
          <div id="set-about-platform" class="setting-item">
            <div class="setting-info">
              <div class="setting-name">平台支持</div>
              <div class="setting-desc">Web / Windows</div>
            </div>
          </div>
            <div id="set-about-license" class="setting-item">
              <div class="setting-info">
                <div class="setting-name">版权归属</div>
                <div class="setting-desc">R-Goose Note 是一个基于 Vue 3 的笔记应用，由 R-Goose 开发。</div>
              </div>
            </div>
 
        </div>
      </section>
     </div>
    </div>

    <Teleport to="body">
      <JellyModal :show="showImportConfirm" @close="cancelImport">
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
            <h3>确认导入数据</h3>
            <p>导入的数据会与当前数据合并，重复内容会被保留。</p>
          </div>
        </div>

        <div class="import-target-section">
          <label class="import-target-label">导入位置</label>
          <div class="import-target-options">
            <label class="import-target-radio">
              <input type="radio" value="merge" v-model="importTargetMode" />
              <span>合并到原结构</span>
            </label>
            <label class="import-target-radio">
              <input type="radio" value="folder" v-model="importTargetMode" />
              <span>导入到指定文件夹</span>
            </label>
            <label class="import-target-radio">
              <input type="radio" value="new" v-model="importTargetMode" />
              <span>创建为新文件夹</span>
            </label>
          </div>

          <div v-if="importTargetMode === 'folder'" class="import-folder-select">
            <CustomSelect
              v-model="importTargetFolderId"
              :options="importFolderOptions"
              :trigger-style="{ width: '100%' }"
            />
          </div>

          <div v-if="importTargetMode === 'new'" class="import-folder-select">
            <input v-model="importNewFolderName" class="import-folder-input" placeholder="输入新文件夹名称" />
          </div>
        </div>

        <div class="confirm-actions">
          <button class="btn btn-secondary" @click="cancelImport">取消</button>
          <button class="btn btn-primary" @click="confirmImport">确认导入</button>
        </div>
        </div>
      </JellyModal>
    </Teleport>

    <Teleport to="body">
      <JellyModal :show="showClearCacheConfirm" @close="showClearCacheConfirm = false">
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
              <h3>确认清除缓存</h3>
              <p>此操作将删除本地存储的所有笔记和计划数据，且不可恢复。建议操作前先「导出数据」备份。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showClearCacheConfirm = false">取消</button>
            <button class="btn btn-primary" @click="confirmClearCache">确认清除</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>

    <Teleport to="body">
      <JellyModal :show="showStorageMigrateConfirm" @close="showStorageMigrateConfirm = false">
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
              <h3>更改存储位置</h3>
              <p>将完整迁移当前数据（笔记+图片）到新位置：<br><code class="path-code">{{ pendingStorageDir }}</code><br>迁移完成后建议重启应用以完全生效。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showStorageMigrateConfirm = false">取消</button>
            <button class="btn btn-primary" @click="performChangeStorage">确认迁移</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>

    <Teleport to="body">
      <JellyModal :show="showStorageResetConfirm" @close="showStorageResetConfirm = false">
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
              <h3>恢复默认存储位置</h3>
              <p>当前数据会迁移回应用默认目录。建议操作前先生成备份。</p>
            </div>
          </div>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showStorageResetConfirm = false">取消</button>
            <button class="btn btn-primary" @click="performResetStorage">确认恢复</button>
          </div>
        </div>
      </JellyModal>
    </Teleport>
  </div>
</template>

<script setup>
import { computed, ref, onMounted, nextTick, onUnmounted } from 'vue'
import { useNoteStore } from '@/stores/note'
import { usePlanStore } from '@/stores/plan'
import { useTagStore } from '@/stores/tag'
import { useShortcutStore, eventToCombo, ACTION_META } from '@/stores/shortcut'
import { exportAsJSON, importFromJSON, mergeData, loadFromStore, saveToStore } from '@/utils/storage'
import { isAppFormatData, buildNoteFromArbitraryJSON } from '@/utils/jsonAdapter'
import { collectImageRefsFromData, buildImageBundle, restoreImageBundle, remapImageRefsInData } from '@/utils/imageStore'
import { formatDate, formatBytes } from '@/utils'
import { useToast } from '@/composables/useToast'
import BgDecor from '@/components/BgDecor.vue'
import CustomSelect from '@/components/CustomSelect.vue'

const { error: toastError, success: toastSuccess, info: toastInfo } = useToast()

const noteStore = useNoteStore()
const planStore = usePlanStore()
const tagStore = useTagStore()
const shortcutStore = useShortcutStore()
shortcutStore.init()
const showImportConfirm = ref(false)
const importTargetMode = ref('merge') // 'merge' | 'folder' | 'new'
const importTargetFolderId = ref(null)
const importNewFolderName = ref('')
const importFolderOptions = computed(() => [
  { label: '— 请选择文件夹 —', value: '__none__' },
  ...noteStore.folders.filter(f => !f.deleted).map(f => ({ label: f.name, value: f.id }))
])
const showClearCacheConfirm = ref(false)

// ============ 通用：关闭到托盘 ============
const canCloseToTray = typeof window !== 'undefined' && !!window.electronAPI?.getCloseToTray
const closeToTray = ref(false)

async function onToggleCloseToTray() {
  try {
    await window.electronAPI.setCloseToTray(closeToTray.value)
    toastSuccess(closeToTray.value ? '已开启关闭到托盘' : '已关闭关闭到托盘')
  } catch (e) {
    closeToTray.value = !closeToTray.value
    toastError('设置失败，请重试')
  }
}

// ============ AI 设置 ============
const aiApiKey = ref(localStorage.getItem('ai_api_key') || '')
const aiModel = ref(localStorage.getItem('ai_model') || 'glm-4.7-flash')
const aiImageModel = ref(localStorage.getItem('ai_image_model') || 'cogview-3-flash')
const aiVideoModel = ref(localStorage.getItem('ai_video_model') || 'cogvideox-flash')

// 智谱 GLM 内置模型清单（按官方文档 https://docs.bigmodel.cn/cn/guide/start/model-overview 维护）
// 官方无 /models 列表 API，以下清单为唯一数据源；用户可在下拉框手动输入自定义模型 id
// price 仅用于排序展示，0 = 免费
const BUILTIN_TEXT_MODELS = [
  { id: 'glm-4.7-flash',         free: true,  price: 0,   tag: '免费 · GLM-4.7 基座 · 200K 上下文' },
  { id: 'glm-4-flash-250414',    free: true,  price: 0,   tag: '免费 · 128K 上下文' },
  { id: 'glm-4.5-flash',         free: true,  price: 0,   tag: '免费 · 即将下线 · 支持深度思考' },
  { id: 'glm-5.2',               free: false, price: 200, tag: '收费 · 旗舰 · 1M 上下文' },
  { id: 'glm-5.1',               free: false, price: 180, tag: '收费 · 200K · 对齐 Claude 4.6' },
  { id: 'glm-5',                 free: false, price: 160, tag: '收费 · 200K · 对齐 Claude 4.5' },
  { id: 'glm-5-turbo',           free: false, price: 100, tag: '收费 · 200K · 长任务优化' },
  { id: 'glm-4.7',               free: false, price: 150, tag: '收费 · 200K · 通用旗舰' },
  { id: 'glm-4.7-flashx',        free: false, price: 30,  tag: '收费 · 轻量高速' },
  { id: 'glm-4.6',               free: false, price: 120, tag: '收费 · 200K · 工具调用' },
  { id: 'glm-4.5-air',           free: false, price: 20,  tag: '收费 · 128K · 高性价比' },
  { id: 'glm-4.5-airx',          free: false, price: 25,  tag: '收费 · 128K · 极速版' },
  { id: 'glm-4-long',            free: false, price: 1,   tag: '收费 · 1M 上下文' },
  { id: 'glm-4-flashx-250414',   free: false, price: 10,  tag: '收费 · 128K · 高速版' }
]
const BUILTIN_IMAGE_MODELS = [
  { id: 'cogview-3-flash', free: true,  price: 0,  tag: '免费 · 快速生成' },
  { id: 'glm-image',       free: false, price: 50, tag: '收费 · 旗舰 · 文字渲染强' },
  { id: 'cogview-4',       free: false, price: 30, tag: '收费 · 通用 · 支持中文' }
]
const BUILTIN_VIDEO_MODELS = [
  { id: 'cogvideox-flash', free: true,  price: 0,   tag: '免费 · 最长 10 秒 · 4K/60fps' },
  { id: 'cogvideox-3',     free: false, price: 100, tag: '收费 · 旗舰 · 首尾帧生成' },
  { id: 'vidu-q1',         free: false, price: 80,  tag: '收费 · 高质量 · 首尾帧' },
  { id: 'vidu-2',          free: false, price: 30,  tag: '收费 · 高速低价' }
]

// 排序：免费在前，收费按价格从高到低
function sortByPrice(list) {
  return [...list].sort((a, b) => {
    if (a.free !== b.free) return a.free ? -1 : 1   // 免费 true 在前
    if (!a.free) return b.price - a.price            // 收费：价格降序
    return 0
  })
}

// 合并内置清单与本地缓存/API 返回（去重，按价格排序）
// saved: 字符串数组（旧缓存或 API 返回的 id 列表）
function mergeBuiltin(saved) {
  // 分类规则：cogvideo → 视频；cogview/image → 图片；其余 → 文本
  const isVideo = id => /cogvideo/i.test(id)
  const isImage = id => /cogview|image/i.test(id)
  const savedVideoIds = (saved || []).filter(id => isVideo(id))
  const savedImageIds = (saved || []).filter(id => !isVideo(id) && isImage(id))
  const savedTextIds  = (saved || []).filter(id => !isVideo(id) && !isImage(id))

  const textMap = new Map(BUILTIN_TEXT_MODELS.map(m => [m.id, m]))
  for (const id of savedTextIds) if (!textMap.has(id)) textMap.set(id, { id, free: false, price: 0, tag: '收费 · 其它' })

  const imageMap = new Map(BUILTIN_IMAGE_MODELS.map(m => [m.id, m]))
  for (const id of savedImageIds) if (!imageMap.has(id)) imageMap.set(id, { id, free: false, price: 0, tag: '收费 · 其它' })

  const videoMap = new Map(BUILTIN_VIDEO_MODELS.map(m => [m.id, m]))
  for (const id of savedVideoIds) if (!videoMap.has(id)) videoMap.set(id, { id, free: false, price: 0, tag: '收费 · 其它' })

  return {
    text: sortByPrice([...textMap.values()]),
    image: sortByPrice([...imageMap.values()]),
    video: sortByPrice([...videoMap.values()])
  }
}

const merged = mergeBuiltin([
  ...JSON.parse(localStorage.getItem('ai_text_models') || '[]'),
  ...JSON.parse(localStorage.getItem('ai_image_models') || '[]'),
  ...JSON.parse(localStorage.getItem('ai_video_models') || '[]')
])
const textModels = ref(merged.text)
const imageModels = ref(merged.image)
const videoModels = ref(merged.video)
const loadingModels = ref(false)

// 下拉框状态
const activeDropdown = ref(null) // 'text' | 'image' | 'video' | null
const textComboboxRef = ref(null)
const imageComboboxRef = ref(null)
const videoComboboxRef = ref(null)
// 独立的搜索词，仅在用户实时输入时更新，避免默认模型名（如 glm-4-flash）误过滤掉列表
const textQuery = ref('')
const imageQuery = ref('')
const videoQuery = ref('')

const filteredTextModels = computed(() => {
  const q = textQuery.value.trim().toLowerCase()
  if (!q) return textModels.value
  return textModels.value.filter(m => m.id.toLowerCase().includes(q))
})

const filteredImageModels = computed(() => {
  const q = imageQuery.value.trim().toLowerCase()
  if (!q) return imageModels.value
  return imageModels.value.filter(m => m.id.toLowerCase().includes(q))
})

const filteredVideoModels = computed(() => {
  const q = videoQuery.value.trim().toLowerCase()
  if (!q) return videoModels.value
  return videoModels.value.filter(m => m.id.toLowerCase().includes(q))
})

function openDropdown(type) {
  activeDropdown.value = type
  // 打开时清空搜索词，展示完整列表
  if (type === 'text') textQuery.value = ''
  else if (type === 'image') imageQuery.value = ''
  else videoQuery.value = ''
}

function onComboboxInput(type) {
  openDropdown(type)
  // 同步搜索词到当前输入的文本（v-model 已更新对应 ref）
  if (type === 'text') textQuery.value = aiModel.value
  else if (type === 'image') imageQuery.value = aiImageModel.value
  else videoQuery.value = aiVideoModel.value
}

function toggleDropdown(type) {
  if (activeDropdown.value === type) {
    activeDropdown.value = null
  } else {
    openDropdown(type)
  }
}

function pickModel(type, m) {
  if (type === 'text') {
    aiModel.value = m
    textQuery.value = ''
  } else if (type === 'image') {
    aiImageModel.value = m
    imageQuery.value = ''
  } else {
    aiVideoModel.value = m
    videoQuery.value = ''
  }
  activeDropdown.value = null
  saveAiSettings()
}

function handleDropdownOutsideClick(e) {
  if (activeDropdown.value === null) return
  const textEl = textComboboxRef.value
  const imageEl = imageComboboxRef.value
  const videoEl = videoComboboxRef.value
  if (textEl && textEl.contains(e.target)) return
  if (imageEl && imageEl.contains(e.target)) return
  if (videoEl && videoEl.contains(e.target)) return
  activeDropdown.value = null
}

function saveAiSettings() {
  localStorage.setItem('ai_api_key', aiApiKey.value.trim())
  localStorage.setItem('ai_model', aiModel.value.trim() || 'glm-4-flash')
  localStorage.setItem('ai_image_model', aiImageModel.value.trim() || 'cogview-3-flash')
  localStorage.setItem('ai_video_model', aiVideoModel.value.trim() || 'cogvideox-flash')
  toastSuccess('AI 设置已保存')
}

// 从智谱 API 拉取可用模型列表，并与内置清单合并
async function fetchAiModels() {
  const key = aiApiKey.value.trim()
  if (!key) {
    toastError('请先填写 API Key')
    return
  }
  loadingModels.value = true
  try {
    // 用 chat/completions 发一个极简请求验证 API Key 有效性
    const baseUrl = 'https://open.bigmodel.cn/api/coding/paas/v4'
    const resp = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'glm-4.7-flash', messages: [{ role: 'user', content: 'hi' }], max_tokens: 1 })
    })
    if (!resp.ok) {
      const body = await resp.json().catch(() => ({}))
      const msg = body?.error?.message || `HTTP ${resp.status}`
      throw new Error(msg)
    }
    // Key 有效，直接使用内置清单（官方无 /models 列表 API）
    textModels.value = sortByPrice([...BUILTIN_TEXT_MODELS])
    imageModels.value = sortByPrice([...BUILTIN_IMAGE_MODELS])
    videoModels.value = sortByPrice([...BUILTIN_VIDEO_MODELS])
    localStorage.setItem('ai_text_models', JSON.stringify(textModels.value.map(m => m.id)))
    localStorage.setItem('ai_image_models', JSON.stringify(imageModels.value.map(m => m.id)))
    localStorage.setItem('ai_video_models', JSON.stringify(videoModels.value.map(m => m.id)))
    const total = textModels.value.length + imageModels.value.length + videoModels.value.length
    toastSuccess(`API Key 验证成功，已加载 ${total} 个官方模型`)
  } catch (e) {
    toastError('API Key 验证失败：' + e.message)
  } finally {
    loadingModels.value = false
  }
}

// ============ 设置搜索 ============
const searchInputRef = ref(null)
const searchQuery = ref('')
const showResults = ref(false)
const highlightIndex = ref(0)

// 搜索索引：将所有设置项结构化
const settingsIndex = computed(() => {
  const items = [
    { id: 'set-export', name: '导出数据', group: '数据管理', desc: '将所有笔记和计划导出为 JSON 文件备份', keywords: '导出 备份 json 数据 export 下载' },
    { id: 'set-import', name: '导入数据', group: '数据管理', desc: '从 JSON 备份文件恢复数据', keywords: '导入 恢复 json 数据 import 上传' },
    { id: 'set-sync', name: '保存状态', group: '数据管理', desc: '上次保存时间', keywords: '保存 同步 状态 sync 时间' },
    { id: 'set-cache', name: '清除缓存', group: '数据管理', desc: '清除本地存储数据', keywords: '清除 缓存 删除 清空 cache 重置' },
    { id: 'set-usage', name: '存储占用', group: '数据管理', desc: '磁盘空间使用情况', keywords: '存储 占用 空间 磁盘 大小 容量 usage' },
    { id: 'set-backup', name: '本地备份', group: '数据管理', desc: '生成完整备份打包为 zip', keywords: '备份 本地 zip 打档 backup 归档' },
    { id: 'set-location', name: '文件存储位置', group: '数据管理', desc: '数据文件保存路径', keywords: '存储 位置 路径 文件 目录 文件夹 location 自定义' },
  ]
  // 快捷键项
  for (const [group, actions] of Object.entries(shortcutStore.groupedActions)) {
    for (const act of actions) {
      items.push({
        id: `sc-${act.id}`,
        name: act.label,
        group: `快捷键 · ${group}`,
        desc: formatCombo(shortcutStore.getCombo(act.id)),
        keywords: `${act.label} 快捷键 ${group} ${act.id} 键盘 hotkey`
      })
    }
  }
  // 关于项
  items.push({ id: 'set-about-version', name: '版本信息', group: '关于', desc: 'R-Goose Note 版本', keywords: '版本 关于 应用 rgoose goose 版本号' })
  items.push({ id: 'set-about-platform', name: '平台支持', group: '关于', desc: 'Web / Windows', keywords: '平台 支持 系统 web windows 环境' })
  items.push({ id: 'set-about-license', name: '版权归属', group: '关于', desc: '基于 Vue 3 的笔记应用', keywords: '版权 归属 vue 作者 开发 license 开源' })
  return items
})

// 相关度搜索
const searchResults = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return []
  const scored = []
  for (const item of settingsIndex.value) {
    const name = item.name.toLowerCase()
    const desc = (item.desc || '').toLowerCase()
    const keywords = item.keywords.toLowerCase()
    let score = 0
    if (name === q) score = 100
    else if (name.startsWith(q)) score = 80
    else if (name.includes(q)) score = 60
    else if (keywords.includes(q)) score = 40
    else if (desc.includes(q)) score = 20
    // 多词匹配加分
    const words = q.split(/\s+/).filter(w => w.length > 0)
    for (const w of words) {
      if (name.includes(w)) score += 10
      if (keywords.includes(w)) score += 8
      if (desc.includes(w)) score += 5
    }
    if (score > 0) scored.push({ ...item, score })
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, 8)
})

function onSearchInput() {
  highlightIndex.value = 0
  showResults.value = searchResults.value.length > 0
}

function moveHighlight(dir) {
  if (searchResults.value.length === 0) return
  highlightIndex.value = (highlightIndex.value + dir + searchResults.value.length) % searchResults.value.length
}

function selectHighlighted() {
  const r = searchResults.value[highlightIndex.value]
  if (r) goToSetting(r)
}

function closeSearch() {
  searchQuery.value = ''
  showResults.value = false
}

function goToSetting(r) {
  showResults.value = false
  searchQuery.value = ''
  nextTick(() => {
    const el = document.getElementById(r.id)
    if (!el) return
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    el.classList.add('search-highlight')
    setTimeout(() => el.classList.remove('search-highlight'), 2500)
  })
}

function handleDocClick(e) {
  if (!searchInputRef.value?.contains(e.target) && !e.target.closest('.search-dropdown')) {
    showResults.value = false
  }
}
onMounted(() => { document.addEventListener('click', handleDocClick) })
onUnmounted(() => { document.removeEventListener('click', handleDocClick) })
onMounted(() => { document.addEventListener('mousedown', handleDropdownOutsideClick) })
onUnmounted(() => { document.removeEventListener('mousedown', handleDropdownOutsideClick) })
const pendingImportData = ref(null)

const lastSyncTimeStr = computed(() => {
  const lastSync = Math.max(noteStore.lastSyncTime || 0, planStore.lastSyncTime || 0)
  if (!lastSync) return '尚未同步'
  return formatDate(lastSync, 'YYYY年MM月DD日 HH:mm')
})

const storageLocation = ref('')
const storageType = ref('')
const storageIsCustom = ref(false)
const storageSize = ref(null)
const backups = ref([])
const migrating = ref(false)
const showStorageMigrateConfirm = ref(false)
const showStorageResetConfirm = ref(false)
const pendingStorageDir = ref('')

async function loadStorageSize() {
  if (window.electronAPI?.getStorageSize) {
    try {
      storageSize.value = await window.electronAPI.getStorageSize()
    } catch (e) {
      storageSize.value = null
    }
  }
}

async function loadBackups() {
  if (window.electronAPI?.listBackups) {
    try {
      backups.value = await window.electronAPI.listBackups()
    } catch (e) {
      backups.value = []
    }
  }
}

onMounted(async () => {
  if (window.electronAPI?.getStorageInfo) {
    try {
      const info = await window.electronAPI.getStorageInfo()
      storageType.value = info.type
      storageLocation.value = info.dataDir || '本地应用数据目录'
      storageIsCustom.value = info.isCustom
    } catch (e) {
      storageLocation.value = '本地应用数据目录'
    }
  } else {
    storageType.value = 'web'
    storageLocation.value = '浏览器本地存储 (localStorage) · key: rgoose_note_data'
  }
  await loadStorageSize()
  await loadBackups()
  if (window.electronAPI?.getCloseToTray) {
    try { closeToTray.value = await window.electronAPI.getCloseToTray() } catch {}
  }
})

const usageTotal = computed(() => {
  if (!storageSize.value) return 0
  const data = storageSize.value.dataFileSize != null ? storageSize.value.dataFileSize : storageSize.value.dataSize
  return (data || 0) + (storageSize.value.imagesDirSize || 0) + (storageSize.value.backupSize || 0)
})

const notesUsagePercent = computed(() => {
  if (!storageSize.value || usageTotal.value === 0) return 0
  const data = storageSize.value.dataFileSize != null ? storageSize.value.dataFileSize : storageSize.value.dataSize
  return ((data || 0) / usageTotal.value) * 100
})
const imagesUsagePercent = computed(() => {
  if (!storageSize.value || usageTotal.value === 0) return 0
  return ((storageSize.value.imagesDirSize || 0) / usageTotal.value) * 100
})
const backupUsagePercent = computed(() => {
  if (!storageSize.value || usageTotal.value === 0) return 0
  return ((storageSize.value.backupSize || 0) / usageTotal.value) * 100
})

function formatBackupTime(mtime) {
  const d = new Date(mtime)
  const pad = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

async function copyStorageLocation() {
  const text = storageLocation.value
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
    } else {
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    toastSuccess('存储位置已复制到剪贴板')
  } catch {
    toastError('复制失败，请手动选择文本复制')
  }
}

async function openStorageLocation() {
  const target = storageLocation.value
  if (window.electronAPI?.openPath && target) {
    const res = await window.electronAPI.openPath(target)
    if (!res?.ok) toastError('无法打开：' + (res?.error || '路径不存在'))
  } else {
    toastError('当前环境不支持打开文件夹')
  }
}

async function openBackup(name) {
  if (window.electronAPI?.openBackup) {
    const res = await window.electronAPI.openBackup(name)
    if (!res?.ok) toastError('无法打开备份：' + (res?.error || '未知错误'))
  } else {
    toastError('当前环境不支持打开文件夹')
  }
}

async function openBackupsFolder() {
  if (window.electronAPI?.openBackupsFolder) {
    const res = await window.electronAPI.openBackupsFolder()
    if (!res?.ok) toastError('无法打开备份目录')
  } else {
    toastError('当前环境不支持打开文件夹')
  }
}

async function handleClearCache() {
  showClearCacheConfirm.value = true
}

async function confirmClearCache() {
  showClearCacheConfirm.value = false
  // 先停止计划提醒定时器，避免对清空后的数据继续跑空检测
  planStore.dispose?.()
  try {
    // v2.0: 调用后端清空全部数据
    await syncApi.clearAll()
    await noteStore.clearCache()
    noteStore.replaceAll([])
    noteStore.replaceAllFolders([])
    planStore.replaceAll([])
    tagStore.replaceAll([])
    toastSuccess('所有数据已清除')
  } catch (err) {
    toastError('清除失败：' + (err?.message || '未知错误'))
  }
  await loadStorageSize()
}

async function handleCreateBackup() {
  if (window.electronAPI?.createBackup) {
    const res = await window.electronAPI.createBackup()
    if (res?.ok) {
      toastSuccess('备份已生成')
      await loadBackups()
      await loadStorageSize()
    } else {
      toastError('备份失败：' + (res?.error || '未知错误'))
    }
  } else {
    toastError('当前环境不支持本地备份')
  }
}

async function handleDeleteBackup(name) {
  if (window.electronAPI?.deleteBackup) {
    const ok = await window.electronAPI.deleteBackup(name)
    if (ok) {
      toastSuccess('备份已删除')
      await loadBackups()
      await loadStorageSize()
    }
  }
}

async function handleChangeStorage() {
  if (!window.electronAPI?.pickDataDir || migrating.value) return
  const picked = await window.electronAPI.pickDataDir()
  if (!picked) return

  if (picked === storageLocation.value) {
    toastError('选择的新位置与当前位置相同')
    return
  }

  pendingStorageDir.value = picked
  showStorageMigrateConfirm.value = true
}

async function performChangeStorage() {
  showStorageMigrateConfirm.value = false
  const target = pendingStorageDir.value
  pendingStorageDir.value = ''
  if (!target) return

  migrating.value = true
  try {
    const res = await window.electronAPI.changeDataDir(target)
    if (res?.ok) {
      storageLocation.value = res.newDir
      storageIsCustom.value = true
      toastSuccess('数据迁移完成，建议重启应用以完全生效')
      await noteStore.flushPersist?.()
      await loadStorageSize()
    } else {
      toastError('迁移失败：' + (res?.error || '未知错误'))
    }
  } catch (e) {
    toastError('迁移失败：' + e.message)
  } finally {
    migrating.value = false
  }
}

async function handleResetStorage() {
  if (!window.electronAPI?.resetDataDir || migrating.value) return
  showStorageResetConfirm.value = true
}

async function performResetStorage() {
  showStorageResetConfirm.value = false
  migrating.value = true
  try {
    const res = await window.electronAPI.resetDataDir()
    if (res?.ok) {
      storageLocation.value = res.newDir
      storageIsCustom.value = false
      toastSuccess('已恢复默认存储位置')
      await loadStorageSize()
    } else {
      toastError('恢复失败：' + (res?.error || '未知错误'))
    }
  } catch (e) {
    toastError('恢复失败：' + e.message)
  } finally {
    migrating.value = false
  }
}

async function handleExport() {
  const baseData = {
    notes: noteStore.notes,
    folders: noteStore.folders,
    plans: planStore.plans,
    tags: tagStore.tags,
    exportedAt: Date.now(),
    version: '2.0.0'
  }

  const refs = collectImageRefsFromData(baseData)
  let imageBundle = {}
  try {
    imageBundle = await buildImageBundle(refs)
  } catch (e) {
    console.error('buildImageBundle failed:', e)
  }

  const payload = {
    ...baseData,
    images: imageBundle,
    imageCount: Object.keys(imageBundle).length
  }

  try {
    if (window.electronAPI?.exportData) {
      const ok = await window.electronAPI.exportData(payload)
      if (!ok) {
        toastError('导出已取消')
        return
      }
    } else {
      exportAsJSON(payload)
    }
    toastSuccess(`数据已导出（含 ${payload.imageCount} 张图片）`)
  } catch (err) {
    toastError('导出失败：' + (err?.message || '未知错误'))
  }
}

function pickJSONFile() {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json,application/json'
    input.onchange = () => {
      const file = input.files?.[0]
      if (file) resolve(file)
      else reject(new Error('未选择文件'))
    }
    input.click()
  })
}

async function handleImport() {
  try {
    let data

    if (window.electronAPI?.importData) {
      data = await window.electronAPI.importData()
    } else {
      const file = await pickJSONFile()
      data = await importFromJSON(file)
    }

    if (data && typeof data === 'object') {
      if (!isAppFormatData(data)) {
        const noteSpec = buildNoteFromArbitraryJSON(data)
        if (noteSpec) {
          const created = noteStore.createNote(noteSpec.title)
          noteSpec.blocks.forEach(b => noteStore.addBlock(created.id, b))
          const rootFolder = await noteStore.ensureSystemRootFolder()
          if (rootFolder) noteStore.moveNoteToFolder(created.id, rootFolder.id)
          toastSuccess(`已根据 JSON 生成新笔记「${noteSpec.title}」，已放入「根目录」文件夹`)
          return
        }
      }
      pendingImportData.value = data
      importTargetMode.value = 'merge'
      importTargetFolderId.value = '__none__'
      importNewFolderName.value = ''
      showImportConfirm.value = true
    } else {
      toastError('导入失败：文件格式无效')
    }
  } catch (err) {
    if (err?.message === '未选择文件') return
    toastError('导入失败：' + (err?.message || '未知错误'))
  }
}

async function placeOrphanNotesIntoRoot(importedNoteIds) {
  if (!importedNoteIds || !importedNoteIds.length) return 0
  const folderIds = new Set(noteStore.folders.filter(f => !f.deleted).map(f => f.id))
  const orphans = noteStore.notes.filter(n => importedNoteIds.has(n.id) && (!n.folderId || !folderIds.has(n.folderId)))
  if (!orphans.length) return 0
  const rootFolder = await noteStore.ensureSystemRootFolder()
  if (!rootFolder) return 0
  orphans.forEach(n => noteStore.moveNoteToFolder(n.id, rootFolder.id))
  return orphans.length
}

async function confirmImport() {
  if (!pendingImportData.value) return

  // 校验目标选项
  if (importTargetMode.value === 'folder' && (!importTargetFolderId.value || importTargetFolderId.value === '__none__')) {
    toastError('请选择要导入到的文件夹')
    return
  }
  if (importTargetMode.value === 'new' && !importNewFolderName.value.trim()) {
    toastError('请输入新文件夹名称')
    return
  }

  try {
    const importData = pendingImportData.value
    let refMap = {}

    if (importData.images && typeof importData.images === 'object') {
      try {
        await restoreImageBundle(importData.images, refMap)
        remapImageRefsInData(importData, refMap)
      } catch (e) {
        console.error('restoreImageBundle failed:', e)
      }
    }

    const currentData = {
      notes: noteStore.notes,
      folders: noteStore.folders,
      plans: planStore.plans,
      tags: tagStore.tags
    }
    const beforeNoteIds = new Set(noteStore.notes.map(n => n.id))
    const mergedData = mergeData(currentData, importData)

    if (mergedData.folders) noteStore.replaceAllFolders(mergedData.folders)
    noteStore.replaceAll(mergedData.notes || [])
    planStore.replaceAll(mergedData.plans || [])
    tagStore.replaceAll(mergedData.tags || [])

    const importedNoteIds = new Set(noteStore.notes.filter(n => !beforeNoteIds.has(n.id)).map(n => n.id))

    let toastMsg = '数据导入完成'
    let orphanCount = 0

    if (importTargetMode.value === 'merge') {
      orphanCount = await placeOrphanNotesIntoRoot(importedNoteIds)
      toastMsg = orphanCount > 0 ? `数据导入完成，${orphanCount} 篇无父级的笔记已放入「根目录」文件夹` : '数据导入完成'
    } else if (importTargetMode.value === 'folder') {
      const importedNotes = noteStore.notes.filter(n => importedNoteIds.has(n.id))
      importedNotes.forEach(n => noteStore.moveNoteToFolder(n.id, importTargetFolderId.value))
      const folderName = noteStore.folders.find(f => f.id === importTargetFolderId.value)?.name || ''
      toastMsg = `数据导入完成，${importedNotes.length} 篇笔记已导入到「${folderName}」`
    } else if (importTargetMode.value === 'new') {
      const newFolder = noteStore.createFolder(importNewFolderName.value.trim())
      const importedNotes = noteStore.notes.filter(n => importedNoteIds.has(n.id))
      importedNotes.forEach(n => noteStore.moveNoteToFolder(n.id, newFolder.id))
      toastMsg = `数据导入完成，${importedNotes.length} 篇笔记已放入新文件夹「${newFolder.name}」`
    }

    // 展平 blocks/connections（嵌套在 notes 中），传给后端做 LWW 合并
    const flatBlocks = []
    const flatConnections = []
    for (const n of noteStore.notes) {
      if (n.blocks) flatBlocks.push(...n.blocks)
      if (n.connections) flatConnections.push(...n.connections)
    }

    // v2.0: 通过后端 API 导入合并后的数据
    await syncApi.importAll({
      ...mergedData,
      blocks: flatBlocks,
      connections: flatConnections
    })

    showImportConfirm.value = false
    pendingImportData.value = null
    toastSuccess(toastMsg)
  } catch (err) {
    toastError('导入失败：' + (err?.message || '未知错误'))
  }
}

function cancelImport() {
  showImportConfirm.value = false
  pendingImportData.value = null
}

const recordingId = ref(null)

function formatCombo(combo) {
  if (!combo) return '未设置'
  return combo.split('+').map(p => {
    const m = { Ctrl: 'Ctrl', Shift: 'Shift', Alt: 'Alt', Up: '↑', Down: '↓', Left: '←', Right: '→', Space: '空格', Del: 'Delete', Esc: 'Esc', Enter: 'Enter' }
    return m[p] || p
  }).join(' + ')
}

function startRecording(actionId) {
  recordingId.value = actionId
}

function cancelRecording() {
  recordingId.value = null
}

function onRecordKeydown(e, actionId) {
  e.preventDefault()
  e.stopPropagation()
  if (e.key === 'Escape') {
    recordingId.value = null
    return
  }
  if (e.key === 'Tab') return
  if (['Control', 'Shift', 'Alt', 'Meta'].includes(e.key)) return

  const combo = eventToCombo(e)
  const conflict = shortcutStore.findConflict(actionId, combo)
  if (conflict) {
    toastError(`该快捷键已被「${ACTION_META[conflict].label}」占用`)
    recordingId.value = null
    return
  }
  shortcutStore.setShortcut(actionId, combo)
  recordingId.value = null
  toastSuccess('快捷键已更新')
}

function conflictInfo(actionId) {
  const combo = shortcutStore.getCombo(actionId)
  const conflict = shortcutStore.findConflict(actionId, combo)
  return conflict ? ACTION_META[conflict] : null
}

function resetAllShortcuts() {
  shortcutStore.resetAll()
  toastSuccess('已恢复全部默认快捷键')
}
</script>

<style scoped>
.settings-view {
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

.view-header h1 {
  font-size: 22px;
  font-weight: 700;
  color: var(--text-primary);
}

/* ============ 搜索框 ============ */
.search-box {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-lg);
  width: 320px;
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
  border: none;
  font-size: 14px;
  color: var(--text-primary);
  outline: none;
}
.search-input:focus-visible { outline: none; }

/* 搜索下拉 */
.search-dropdown {
  position: absolute;
  top: calc(100% + 6px);
  left: 0;
  right: 0;
  background: var(--bg-elevated, var(--bg-secondary));
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  box-shadow: 0 12px 36px -8px rgba(0, 0, 0, 0.22);
  overflow: hidden;
  z-index: 100;
  max-height: 380px;
  overflow-y: auto;
}
.search-result-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  cursor: pointer;
  transition: background var(--transition-fast);
}
.search-result-item:hover,
.search-result-item.active {
  background: var(--bg-hover);
}
.result-group {
  font-size: 11px;
  font-weight: 600;
  color: var(--primary-color);
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
  padding: 2px 8px;
  border-radius: 6px;
  flex-shrink: 0;
  white-space: nowrap;
}
.result-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  white-space: nowrap;
}
.result-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-left: auto;
}

/* 搜索高亮动画 */
@keyframes searchPulse {
  0%, 100% { box-shadow: none; }
  30% { box-shadow: 0 0 0 2.5px var(--primary-color); background: color-mix(in srgb, var(--primary-color) 8%, transparent); }
}
.search-highlight {
  animation: searchPulse 0.5s ease-in-out 3;
  border-radius: var(--radius-md);
}

/* 下拉动画 */
.search-dropdown-enter-active,
.search-dropdown-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}
.search-dropdown-enter-from,
.search-dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 28px 32px;
  width: 100%;
  box-sizing: border-box;
  position: relative;
}

.settings-inner {
  position: relative;
  z-index: 1;
  max-width: 900px;
  margin: 0 auto;
  width: 100%;
}

.settings-section {
  width: 100%;
  margin-bottom: 36px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 14px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.title-bar {
  width: 4px;
  height: 16px;
  border-radius: 2px;
  flex-shrink: 0;
}

.bar-blue {
  background: var(--info-color);
}

.bar-green {
  background: var(--primary-color);
}

.bar-purple {
  background: #9b6dd7;
}

.shortcut-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  gap: 12px;
}

.shortcut-tip {
  font-size: 12px;
  color: var(--text-tertiary);
}

.btn-sm {
  padding: 5px 12px;
  font-size: 12px;
}

.shortcut-groups {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.shortcut-group-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 8px;
  padding-left: 2px;
}

.shortcut-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.shortcut-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid var(--border-light);
  position: relative;
  flex-wrap: wrap;
}

.shortcut-item:last-child {
  border-bottom: none;
}

.shortcut-info {
  flex: 1;
  min-width: 140px;
}

.shortcut-name {
  font-size: 14px;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}

.custom-tag {
  font-size: 10px;
  padding: 1px 6px;
  border-radius: 4px;
  background: var(--primary-soft);
  color: var(--primary-dark);
  font-weight: 600;
}

.shortcut-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.keybind-box {
  min-width: 110px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 13px;
  font-family: inherit;
  cursor: pointer;
  text-align: center;
  transition: all 0.15s;
}

.keybind-box:hover {
  border-color: var(--primary-color);
}

.keybind-box.recording {
  border-color: var(--primary-color);
  background: var(--primary-soft);
  color: var(--primary-dark);
  box-shadow: 0 0 0 2px rgba(var(--primary-color-rgb, 82, 163, 119), 0.15);
}

.keybind-box.conflict {
  border-color: var(--danger-color, #d97676);
  color: var(--danger-color, #d97676);
}

.btn-reset {
  width: 28px;
  height: 28px;
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  background: var(--bg-primary);
  color: var(--text-tertiary);
  cursor: pointer;
  font-size: 15px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
}

.btn-reset:hover {
  color: var(--primary-color);
  border-color: var(--primary-color);
}

.conflict-warn {
  position: absolute;
  bottom: 2px;
  right: 16px;
  font-size: 11px;
  color: var(--danger-color, #d97676);
}

.settings-list {
  background: var(--bg-secondary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  /* 不设 overflow: hidden，否则 AI 模型下拉面板会被裁剪 */
  width: 100%;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-light);
  width: 100%;
  box-sizing: border-box;
}

.setting-item:last-child {
  border-bottom: none;
}

.switch-wrap {
  flex-shrink: 0;
  display: inline-flex;
  cursor: pointer;
}

.switch-wrap input {
  display: none;
}

.switch-track {
  width: 42px;
  height: 24px;
  border-radius: 999px;
  background: var(--border-color, #d8dee4);
  position: relative;
  transition: background 0.2s ease;
}

.switch-thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease;
}

.switch-wrap input:checked + .switch-track {
  background: var(--accent-color, #d4956a);
}

.switch-wrap input:checked + .switch-track .switch-thumb {
  transform: translateX(18px);
}

.ai-key-input {
  flex-shrink: 0;
  width: 240px;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  background: var(--bg-primary);
  color: var(--text-primary);
  outline: none;
  transition: border-color 0.15s;
}

.ai-key-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--primary-color) 15%, transparent);
}

.ai-key-input::placeholder {
  color: var(--text-tertiary);
}

.ai-model-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

/* AI 模型下拉框 */
.ai-combobox {
  position: relative;
  display: flex;
  align-items: center;
}

.ai-combobox-input {
  padding-right: 30px;
  width: 240px;
}

.ai-combobox-arrow {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  background: transparent;
  border: none;
  padding: 4px;
  cursor: pointer;
  color: var(--text-tertiary);
  display: flex;
  align-items: center;
  pointer-events: auto;
}

.ai-combobox-arrow:hover {
  color: var(--primary-color);
}

.ai-combobox-panel {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  min-width: 240px;
  max-height: 240px;
  overflow-y: auto;
  background: var(--bg-primary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 8px 24px -6px rgba(0,0,0,0.18), 0 2px 8px rgba(0,0,0,0.06);
  z-index: 100;
  padding: 4px;
}

.ai-combobox-option {
  padding: 7px 10px;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-primary);
  transition: background 0.12s;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ai-combobox-option:hover {
  background: color-mix(in srgb, var(--primary-color) 12%, transparent);
}

.ai-combobox-option.active {
  background: color-mix(in srgb, var(--primary-color) 18%, transparent);
  color: var(--primary-color);
  font-weight: 600;
}

.ai-model-id {
  font-size: 13px;
  word-break: break-all;
}

.ai-model-tag {
  flex-shrink: 0;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: 4px;
  line-height: 1.5;
}

.ai-model-tag.is-free {
  background: rgba(34, 197, 94, 0.16);
  color: #16a34a;
}

.ai-model-tag.is-paid {
  background: rgba(245, 158, 11, 0.16);
  color: #d97706;
}

.ai-model-desc {
  flex-basis: 100%;
  font-size: 11px;
  color: var(--text-tertiary);
  font-weight: normal;
}

.ai-combobox-empty {
  padding: 10px;
  font-size: 12px;
  color: var(--text-tertiary);
  text-align: center;
}

.btn-fetch-models {
  flex-shrink: 0;
  padding: 6px 12px;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--bg-primary);
  color: var(--text-primary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.15s;
  white-space: nowrap;
}

.btn-fetch-models:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.btn-fetch-models:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.setting-info {
  flex: 1;
  min-width: 0;
}

.setting-name {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.total-usage {
  font-size: 13px;
  font-weight: 600;
  color: var(--primary-color);
  margin-left: 6px;
}

.brand-name {
  color: var(--primary-dark);
  font-weight: 600;
}

.setting-desc {
  font-size: 13px;
  color: var(--text-tertiary);
  line-height: 1.5;
  word-break: break-all;
}

.sync-badge {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-tertiary);
}

.sync-badge.synced {
  color: var(--primary-dark);
}

.sync-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--text-tertiary);
}

.sync-dot.synced {
  background: var(--primary-color);
  box-shadow: 0 0 0 3px rgba(107, 189, 143, 0.18);
}

.btn-export {
  color: var(--primary-dark);
  border-color: var(--primary-light);
}

.btn-export:hover {
  background: var(--primary-soft);
  border-color: var(--primary-color);
}

.btn-danger-outline {
  color: var(--warning-color, #d97676);
  border-color: var(--warning-color, #d97676);
}

.btn-danger-outline:hover {
  background: var(--warning-soft, #fbecec);
  border-color: var(--warning-color, #d97676);
}

.btn-import {
  color: var(--info-dark);
  border-color: var(--info-light);
}

.btn-import:hover {
  background: var(--info-soft);
  border-color: var(--info-color);
}

.confirm-modal {
  width: 420px;
  max-width: 90vw;
  padding: 24px;
}

.confirm-header {
  display: flex;
  gap: 16px;
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
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.confirm-header p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* ===== 导入目标选择 ===== */
.import-target-section {
  margin: 16px 0;
  padding: 14px 16px;
  background: var(--bg-tertiary, #f7f7f8);
  border-radius: 10px;
  border: 1px solid var(--border-light, rgba(0,0,0,.06));
}
.import-target-label {
  display: block;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: 10px;
}
.import-target-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.import-target-radio {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
}
.import-target-radio input[type="radio"] {
  accent-color: var(--primary-color, #3b82f6);
  cursor: pointer;
}
.import-folder-select {
  margin-top: 12px;
}
.import-folder-input {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 12px;
  font-size: 13px;
  font-family: inherit;
  border: 1px solid var(--border-color);
  border-radius: var(--radius-md);
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  outline: none;
  cursor: text;
  transition: border-color var(--transition-fast);
}
.import-folder-input:hover {
  border-color: var(--primary-light);
}
.import-folder-input:focus {
  border-color: var(--primary-color);
  box-shadow: 0 0 0 3px var(--primary-soft);
}

@media (max-width: 768px) {
  .view-header {
    padding: 16px;
  }

  .settings-content {
    padding: 16px;
  }
}

.form-row {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row.inline {
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.form-label {
  font-size: 12px;
  font-weight: 700;
  color: var(--text-tertiary);
  letter-spacing: 0.05em;
}

.form-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
}

.interval-input {
  max-width: 120px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
  flex-shrink: 0;
}

.switch.small {
  width: 36px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.switch-slider {
  position: absolute;
  cursor: pointer;
  inset: 0;
  background: var(--border-color);
  border-radius: 999px;
  transition: var(--transition-fast);
}

.switch-slider::before {
  content: '';
  position: absolute;
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background: #fff;
  border-radius: 50%;
  transition: var(--transition-fast);
  box-shadow: var(--shadow-sm);
}

.switch.small .switch-slider::before {
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
}

.switch input:checked+.switch-slider {
  background: var(--primary-color);
}

.switch input:checked+.switch-slider::before {
  transform: translateX(20px);
}

.switch.small input:checked+.switch-slider::before {
  transform: translateX(16px);
}

.title-bar.bar-yellow {
  background: #d4b27a;
}

.storage-usage-item {
  flex-direction: column;
  align-items: stretch !important;
  gap: 8px;
}

.custom-badge {
  display: inline-block;
  margin-left: 8px;
  padding: 1px 8px;
  font-size: 10px;
  font-weight: 600;
  color: var(--primary-color, #6bbd8f);
  background: var(--primary-soft, #e8f3ec);
  border-radius: 999px;
  vertical-align: middle;
}

.storage-location-item .setting-info {
  max-width: 60%;
}

.storage-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
  margin-left: auto;
}

.migrating-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
  font-size: 12px;
  color: var(--primary-color, #6bbd8f);
}

.mini-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--primary-soft, #e8f3ec);
  border-top-color: var(--primary-color, #6bbd8f);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.path-code {
  display: inline-block;
  margin-top: 4px;
  padding: 2px 6px;
  font-family: 'SF Mono', Consolas, monospace;
  font-size: 11px;
  background: var(--bg-tertiary);
  border-radius: 4px;
  word-break: break-all;
}

.storage-usage-bar {
  display: flex;
  width: 100%;
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: var(--bg-tertiary);
  margin-top: 4px;
}

.usage-segment {
  height: 100%;
  transition: width 0.4s ease;
}

.usage-segment.notes { background: var(--primary-color, #6bbd8f); }
.usage-segment.images { background: var(--secondary-color, #d4b27a); }
.usage-segment.backups { background: color-mix(in srgb, var(--text-tertiary, #999) 60%, transparent); }

.storage-usage-detail {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 14px;
  margin-top: 2px;
}

.usage-tag {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-secondary);
}

.usage-tag::before {
  content: '';
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.usage-tag.notes::before { background: var(--primary-color, #6bbd8f); }
.usage-tag.images::before { background: var(--secondary-color, #d4b27a); }
.usage-tag.backups::before { background: color-mix(in srgb, var(--text-tertiary, #999) 60%, transparent); }
.usage-tag.app::before { background: var(--info-color, #6ba6d9); }

.app-usage-line {
  margin-top: 4px;
  padding-top: 4px;
  border-top: 1px dashed var(--border-light);
}

.backup-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 4px 0 8px;
}

.backup-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-tertiary);
  border-radius: var(--radius-md);
  transition: background var(--transition-fast);
}

.backup-actions {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: row;
  gap: 4px;
}


.backup-item:hover {
  background: var(--bg-hover);
}

.backup-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.backup-time {
  color: var(--text-primary);
  font-weight: 500;
}

.backup-size {
  color: var(--text-tertiary);
}

.action-icon-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-tertiary);
  background: transparent;
  transition: all var(--transition-fast);
}

.action-icon-btn.secondary:hover {
  color: var(--secondary-color, #55d4f5);
  background: var(--secondary-soft, #f5f5f5);
}

.action-icon-btn.danger:hover {
  color: var(--warning-color, #d97676);
  background: var(--warning-soft, #fbecec);
}
</style>

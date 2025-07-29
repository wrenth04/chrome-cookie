// js/main.js
/**
 * @file 擴充功能的主入口點，負責初始化、資料遷移和綁定事件監聽器。
 * @description
 *      此檔案包含擴充功能的啟動邏輯。
 *      1. `migrateToSplitStorage`: 一個關鍵的遷移腳本，用於將舊的、單一物件的儲存結構，
 *         轉換為新的、拆分開的儲存結構，以解決 `chrome.storage.sync` 的配額限制。
 *      2. `initialize`: 擴充功能的主初始化函數，會在遷移完成後執行。
 *      3. `setupEventListeners`: 負責為所有 UI 元素綁定事件監聽器。
 */

import { dom, state } from './state.js';
import { setupTabs } from './tabs.js';
import { loadProfilesUI, renderCookieList, updateLoadedProfileDisplay } from './ui.js';
import { loadProfile, deleteProfile, saveProfile, saveEditedProfile } from './profiles.js';
import { applyToPage, copyCookieString, saveFromString, deleteSingleCookie } from './editor.js';
import { handleExportSelectAll, handleExportCheckboxChange, exportSelectedProfiles, importProfiles, handleImportFile, clearPageCookies } from './tools.js';

const PROFILE_PREFIX = 'profile_';
const PROFILE_LIST_KEY = 'profile_list';

// --- 初始化 ---

/**
 * 一次性遷移腳本，將設定檔從舊的單一物件結構 (`cookieProfiles`)
 * 遷移到新的獨立儲存結構 (`profile_*` 和 `profile_list`)。
 * 這是為了解決 `chrome.storage.sync` 對單一項目 8KB 的大小限制。
 */
async function migrateToSplitStorage() {
  const migrationKey = 'migration_v2_completed';

  // 1. 檢查是否已經執行過此版本的遷移
  const migrationCheck = await chrome.storage.sync.get(migrationKey);
  if (migrationCheck[migrationKey]) {
    return;
  }

  console.log('開始執行 v2 儲存結構遷移...');

  // 2. 從 local 讀取最原始的資料 (v0)
  const localData = await chrome.storage.local.get('cookieProfiles');
  const localProfiles = localData.cookieProfiles;

  // 3. 從 sync 讀取可能存在的舊結構資料 (v1 遷移後)
  const syncData = await chrome.storage.sync.get('cookieProfiles');
  const syncProfiles = syncData.cookieProfiles;

  // 合併兩者，local 的資料優先
  const allProfiles = { ...(syncProfiles || {}), ...(localProfiles || {}) };

  if (Object.keys(allProfiles).length > 0) {
    console.log(`找到 ${Object.keys(allProfiles).length} 個設定檔需要遷移。`);
    const dataToSet = {};
    const profileNames = [];

    // 準備新的、拆分開的資料結構
    for (const name in allProfiles) {
      const profileKey = `${PROFILE_PREFIX}${name}`;
      dataToSet[profileKey] = allProfiles[name];
      profileNames.push(name);
    }
    
    // 4. 寫入新的 profile list
    dataToSet[PROFILE_LIST_KEY] = profileNames;

    // 5. 一次性寫入所有新的設定檔和列表
    await chrome.storage.sync.set(dataToSet);

    // 6. 移除舊的 cookieProfiles 物件 (從 sync 和 local)
    await chrome.storage.sync.remove('cookieProfiles');
    await chrome.storage.local.remove('cookieProfiles');
    
    console.log('設定檔已成功遷移到新的儲存結構。');
  }

  // 7. 設定遷移完成標記
  await chrome.storage.sync.set({ [migrationKey]: true });
  console.log('v2 遷移完成。');
}


/**
 * 初始化擴充功能，載入設定檔、取得當前分頁的 Cookie，並更新 UI。
 */
async function initialize() {
  // 在初始化最開始執行遷移腳本
  await migrateToSplitStorage();

  // 載入設定檔下拉選單和匯出列表
  loadProfilesUI();
  // 更新顯示已載入設定檔的名稱
  updateLoadedProfileDisplay();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    state.activeTab = tab;
    if (state.activeTab && state.activeTab.url && state.activeTab.url.startsWith('http')) {
      state.currentCookies = await chrome.cookies.getAll({ url: state.activeTab.url, storeId: state.activeTab.cookieStoreId });
    } else {
      state.currentCookies = [];
    }
  } catch (error) {
    console.warn("無法取得活動分頁的 Cookie:", error);
    state.currentCookies = [];
  }
  
  renderCookieList();
}

// --- 事件監聽器 ---

/**
 * 設定所有 UI 元素的事件監聽器。
 */
function setupEventListeners() {
  setupTabs();
  dom.profileFilterInput.addEventListener('input', (e) => loadProfilesUI(e.target.value));
  dom.loadProfileButton.addEventListener('click', loadProfile);
  dom.deleteProfileButton.addEventListener('click', deleteProfile);
  dom.applyToPageButton.addEventListener('click', () => applyToPage());
  dom.saveEditedProfileButton.addEventListener('click', saveEditedProfile);
  dom.copyCookieStringButton.addEventListener('click', copyCookieString);
  dom.saveProfileButton.addEventListener('click', saveProfile);
  dom.saveFromStringButton.addEventListener('click', saveFromString);
  dom.cookieListDiv.addEventListener('click', deleteSingleCookie);
  dom.exportSelectAll.addEventListener('change', handleExportSelectAll);
  dom.exportProfilesListDiv.addEventListener('change', handleExportCheckboxChange);
  dom.exportSelectedProfilesButton.addEventListener('click', exportSelectedProfiles);
  dom.importProfilesButton.addEventListener('click', importProfiles);
  dom.importFileInput.addEventListener('change', handleImportFile);
  dom.clearPageCookiesButton.addEventListener('click', clearPageCookies);
}


// --- 啟動 ---

document.addEventListener('DOMContentLoaded', () => {
  initialize();
  setupEventListeners();
});
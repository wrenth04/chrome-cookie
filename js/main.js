// js/main.js
/**
 * @file 擴充功能的主入口點，負責初始化、載入資料和綁定事件監聽器。
 */

import { dom, state } from './state.js';
import { setupTabs } from './tabs.js';
import { loadProfilesUI, renderCookieList, updateLoadedProfileDisplay } from './ui.js';
import { loadProfile, deleteProfile, saveProfile, saveEditedProfile } from './profiles.js';
import { applyToPage, copyCookieString, saveFromString, deleteSingleCookie } from './editor.js';
import { handleExportSelectAll, handleExportCheckboxChange, exportSelectedProfiles, importProfiles, handleImportFile, clearPageCookies } from './tools.js';

// --- 初始化 ---

/**
 * 初始化擴充功能，載入設定檔、取得當前分頁的 Cookie，並更新 UI。
 */
async function initialize() {
  // 載入設定檔下拉選單和匯出列表
  loadProfilesUI();
  // 更新顯示已載入設定檔的名稱
  updateLoadedProfileDisplay();

  try {
    // 取得當前活動分頁
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    state.activeTab = tab;
    // 如果是有效的網頁，則獲取其 Cookie
    if (state.activeTab && state.activeTab.url && state.activeTab.url.startsWith('http')) {
      state.currentCookies = await chrome.cookies.getAll({ url: state.activeTab.url, storeId: state.activeTab.cookieStoreId });
    } else {
      state.currentCookies = [];
    }
  } catch (error) {
    console.warn("無法取得活動分頁的 Cookie:", error);
    state.currentCookies = [];
  }
  
  // 將獲取的 Cookie 渲染到編輯區
  renderCookieList();
}

// --- 事件監聽器 ---

/**
 * 設定所有 UI 元素的事件監聽器。
 */
function setupEventListeners() {
  // 設定分頁切換功能
  setupTabs();

  // --- 分頁 1: 設定檔管理 ---
  dom.loadProfileButton.addEventListener('click', loadProfile);
  dom.deleteProfileButton.addEventListener('click', deleteProfile);

  // --- 分頁 2: 編輯器 & 建立 ---
  dom.applyToPageButton.addEventListener('click', () => applyToPage());
  dom.saveEditedProfileButton.addEventListener('click', saveEditedProfile);
  dom.copyCookieStringButton.addEventListener('click', copyCookieString);
  dom.saveProfileButton.addEventListener('click', saveProfile);
  dom.saveFromStringButton.addEventListener('click', saveFromString);
  dom.cookieListDiv.addEventListener('click', deleteSingleCookie);

  // --- 分頁 3: 工具 ---
  dom.exportSelectAll.addEventListener('change', handleExportSelectAll);
  dom.exportProfilesListDiv.addEventListener('change', handleExportCheckboxChange);
  dom.exportSelectedProfilesButton.addEventListener('click', exportSelectedProfiles);
  dom.importProfilesButton.addEventListener('click', importProfiles);
  dom.importFileInput.addEventListener('change', handleImportFile);
  dom.clearPageCookiesButton.addEventListener('click', clearPageCookies);
}


// --- 啟動 ---

/**
 * 當 DOM 內容載入完成後，執行初始化和事件綁定。
 */
document.addEventListener('DOMContentLoaded', () => {
  initialize();
  setupEventListeners();
});
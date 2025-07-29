// js/state.js
/**
 * @file 全域狀態管理，包含 DOM 元素參照和應用程式狀態。
 */

/**
 * @typedef {object} DomElements
 * @property {HTMLSelectElement} profilesSelect - 設定檔選擇下拉選單
 * @property {HTMLButtonElement} loadProfileButton - 載入設定檔按鈕
 * @property {HTMLButtonElement} deleteProfileButton - 刪除設定檔按鈕
 * @property {HTMLElement} loadedProfileNameDisplay - 顯示已載入設定檔名稱的元素
 * @property {HTMLElement} cookieListDiv - 顯示 Cookie 列表的容器
 * @property {HTMLButtonElement} applyToPageButton - 應用至頁面按鈕
 * @property {HTMLButtonElement} saveEditedProfileButton - 儲存已編輯設定檔按鈕
 * @property {HTMLTextAreaElement} copyCookieStringTextarea - 顯示可複製 Cookie 字串的文字區
 * @property {HTMLButtonElement} copyCookieStringButton - 複製 Cookie 字串按鈕
 * @property {HTMLInputElement} profileNameInput - 新設定檔名稱輸入框（從當前頁面）
 * @property {HTMLButtonElement} saveProfileButton - 儲存設定檔按鈕（從當前頁面）
 * @property {HTMLInputElement} newProfileNameInput - 新設定檔名稱輸入框（從字串）
 * @property {HTMLTextAreaElement} cookieStringInput - Cookie 字串輸入區
 * @property {HTMLButtonElement} saveFromStringButton - 從字串儲存按鈕
 * @property {HTMLElement} exportProfilesListDiv - 匯出設定檔列表的容器
 * @property {HTMLElement} exportSelectAllContainer - "全選" 複選框的容器
 * @property {HTMLInputElement} exportSelectAll - "全選" 複選框
 * @property {HTMLButtonElement} exportSelectedProfilesButton - 匯出所選設定檔按鈕
 * @property {HTMLButtonElement} importProfilesButton - 匯入設定檔按鈕
 * @property {HTMLInputElement} importFileInput - 檔案匯入輸入框 (隱藏)
 * @property {HTMLButtonElement} clearPageCookiesButton - 清除頁面 Cookie 按鈕
 * @property {NodeListOf<HTMLElement>} tabs - 所有分頁標籤的集合
 * @property {NodeListOf<HTMLElement>} tabContents - 所有分頁內容的集合
 */

/**
 * 集中管理的 DOM 元素參照。
 * @type {DomElements}
 */
export const dom = {
  // --- 通用元素 ---
  tabs: document.querySelectorAll('.tab-link'),
  tabContents: document.querySelectorAll('.tab-content'),
  
  // --- 分頁 1: 設定檔管理 ---
  profilesSelect: document.getElementById('profilesSelect'),
  loadProfileButton: document.getElementById('loadProfile'),
  deleteProfileButton: document.getElementById('deleteProfile'),
  
  // --- 分頁 2: 編輯器 & 建立 ---
  loadedProfileNameDisplay: document.getElementById('loadedProfileNameDisplay'),
  cookieListDiv: document.getElementById('cookie-list'),
  applyToPageButton: document.getElementById('applyToPage'),
  saveEditedProfileButton: document.getElementById('saveEditedProfile'),
  
  copyCookieStringTextarea: document.getElementById('copyCookieStringTextarea'),
  copyCookieStringButton: document.getElementById('copyCookieStringButton'),

  profileNameInput: document.getElementById('profileName'),
  saveProfileButton: document.getElementById('saveProfile'),
  
  newProfileNameInput: document.getElementById('newProfileName'),
  cookieStringInput: document.getElementById('cookieString'),
  saveFromStringButton: document.getElementById('saveFromString'),

  // --- 分頁 3: 工具 ---
  exportProfilesListDiv: document.getElementById('exportProfilesList'),
  exportSelectAllContainer: document.getElementById('exportSelectAllContainer'),
  exportSelectAll: document.getElementById('exportSelectAll'),
  exportSelectedProfilesButton: document.getElementById('exportSelectedProfilesButton'),
  importProfilesButton: document.getElementById('importProfiles'),
  importFileInput: document.getElementById('importFile'),
  clearPageCookiesButton: document.getElementById('clearPageCookies'),
};

/**
 * @typedef {object} AppState
 * @property {chrome.cookies.Cookie[]} currentCookies - 當前在編輯區的 Cookie 列表。
 * @property {string} loadedProfileName - 當前載入的設定檔名稱。
 * @property {chrome.tabs.Tab | null} activeTab - 當前的活動分頁物件。
 */

/**
 * 全域應用程式狀態。
 * @type {AppState}
 */
export const state = {
  currentCookies: [],
  loadedProfileName: '',
  activeTab: null,
};
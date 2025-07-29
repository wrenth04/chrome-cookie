// js/tools.js
/**
 * @file 提供匯入/匯出設定檔、清除頁面 Cookie 等工具函數。
 * @description
 *      此檔案的函數與新的拆分儲存結構緊密配合。
 *      - **匯出**: 根據使用者選擇的設定檔名稱，從 `chrome.storage.sync` 中讀取對應的
 *        `profile_*` 項目，並將它們組合成一個 JSON 檔案供使用者下載。
 *      - **匯入**: 解析使用者上傳的 JSON 檔案，將其中的每個設定檔作為獨立的 `profile_*`
 *        項目寫入 `chrome.storage.sync`，並更新 `profile_list`。
 */

import { dom, state } from './state.js';
import { renderCookieList, loadProfilesUI } from './ui.js';

const PROFILE_PREFIX = 'profile_';
const PROFILE_LIST_KEY = 'profile_list';

/**
 * 處理 "全選" 複選框的變更事件。
 * @param {Event} e - 變更事件物件。
 */
export function handleExportSelectAll(e) {
  const checkboxes = document.querySelectorAll('#exportProfilesList input[name="exportProfile"]');
  checkboxes.forEach(checkbox => {
    checkbox.checked = e.target.checked;
  });
}

/**
 * 處理匯出列表中單個複選框的變更事件，以更新 "全選" 複選框的狀態。
 */
export function handleExportCheckboxChange() {
    const checkboxes = document.querySelectorAll('#exportProfilesList input[name="exportProfile"]');
    const total = checkboxes.length;
    const checkedCount = Array.from(checkboxes).filter(checkbox => checkbox.checked).length;

    if (checkedCount === 0) {
      dom.exportSelectAll.checked = false;
      dom.exportSelectAll.indeterminate = false;
    } else if (checkedCount === total) {
      dom.exportSelectAll.checked = true;
      dom.exportSelectAll.indeterminate = false;
    } else {
      dom.exportSelectAll.checked = false;
      dom.exportSelectAll.indeterminate = true;
    }
}

/**
 * 匯出所選的設定檔為一個 JSON 檔案。
 * 根據所選名稱，讀取對應的 `profile_*` 項目並打包。
 */
export function exportSelectedProfiles() {
  const selectedCheckboxes = document.querySelectorAll('#exportProfilesList input[name="exportProfile"]:checked');
  if (selectedCheckboxes.length === 0) {
    alert('請至少選擇一個要匯出的設定檔。');
    return;
  }

  const selectedProfileNames = Array.from(selectedCheckboxes).map(cb => cb.value);
  const keysToGet = selectedProfileNames.map(name => `${PROFILE_PREFIX}${name}`);

  chrome.storage.sync.get(keysToGet, (result) => {
    const profilesToExport = {};
    for (const key in result) {
        const profileName = key.replace(PROFILE_PREFIX, '');
        profilesToExport[profileName] = result[key];
    }

    if (Object.keys(profilesToExport).length === 0) {
      alert('找不到所選的設定檔資料。');
      return;
    }

    // 建立並下載 JSON 檔案
    const dataStr = JSON.stringify(profilesToExport, null, 2);
    const blob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cookie_profiles_export.json';
    a.click();
    URL.revokeObjectURL(url);
    a.remove();
  });
}

/**
 * 觸發檔案選擇對話框以進行匯入。
 */
export function importProfiles() {
  dom.importFileInput.click();
}

/**
 * 處理檔案選擇事件，讀取並合併匯入的設定檔。
 * 會將 JSON 中的每個設定檔拆分成獨立的 `profile_*` 項目儲存，並更新 `profile_list`。
 * @param {Event} event - 檔案輸入的變更事件。
 */
export function handleImportFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const importedProfiles = JSON.parse(e.target.result);
      if (confirm('這將會合併匯入的設定檔.\n\n- 如果設定檔名稱已存在，將會更新.\n- 如果是新名稱，將會新增.\n\n確定要繼續嗎？')) {
        chrome.storage.sync.get([PROFILE_LIST_KEY], (result) => {
          const existingNames = result[PROFILE_LIST_KEY] || [];
          const newNames = Object.keys(importedProfiles);
          const updatedNames = [...new Set([...existingNames, ...newNames])]; // 合併並去重
          
          const dataToSet = {};
          for (const name of newNames) {
            dataToSet[`${PROFILE_PREFIX}${name}`] = importedProfiles[name];
          }
          dataToSet[PROFILE_LIST_KEY] = updatedNames;

          chrome.storage.sync.set(dataToSet, () => {
            loadProfilesUI(); // 更新 UI
            alert('設定檔已成功合併與更新。');
          });
        });
      }
    } catch (error) {
      alert('檔案格式錯誤，請確認是從本擴充功能匯出的 .json 檔案。');
    }
  };
  reader.readAsText(file);
  dom.importFileInput.value = '';
}

/**
 * 清除當前活動頁面的所有 Cookie。
 */
export async function clearPageCookies() {
  if (!state.activeTab || !state.activeTab.url || !state.activeTab.url.startsWith('http')) {
    alert('請在一個有效的網頁上操作。');
    return;
  }
  const { url, cookieStoreId } = state.activeTab;
  const storeId = cookieStoreId;
  if (confirm(`確定要清除當前網頁 (${url.split('/')[2]}) 的所有 Cookie 嗎？`)) {
    const existingCookies = await chrome.cookies.getAll({ url, storeId });
    for (const cookie of existingCookies) {
      await chrome.cookies.remove({ url, name: cookie.name, storeId });
    }
    state.currentCookies = [];
    renderCookieList();
    alert('當前網頁的所有 Cookie 已被清除。');
  }
}

// CommonJS export for testing in Node.js environment
try {
  if (module) {
    module.exports = {
      handleExportSelectAll,
      handleExportCheckboxChange,
      exportSelectedProfiles,
      importProfiles,
      handleImportFile,
      clearPageCookies,
      PROFILE_PREFIX,
      PROFILE_LIST_KEY
    };
  }
} catch (e) {
  // Running in browser, do nothing
}
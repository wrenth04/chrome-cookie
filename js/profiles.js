// js/profiles.js
/**
 * @file 管理 Cookie 設定檔，包括載入、刪除和儲存。
 * @description
 *      此檔案負責處理所有與設定檔生命週期相關的操作。
 *      它使用 `chrome.storage.sync` API，並遵循拆分儲存的策略：
 *      - 每一個設定檔都作為一個獨立的項目儲存，鍵值為 `profile_{profileName}`。
 *      - 一個名為 `profile_list` 的陣列負責追蹤所有設定檔的名稱。
 */

import { dom, state } from './state.js';
import { renderCookieList, updateLoadedProfileDisplay, loadProfilesUI } from './ui.js';
import { applyToPage } from './editor.js';

const PROFILE_PREFIX = 'profile_';
const PROFILE_LIST_KEY = 'profile_list';

/**
 * 從下拉選單中選擇並載入一個設定檔到編輯區。
 * 透過讀取 `profile_{profileName}` 來取得特定設定檔的資料。
 * 載入後會自動將 Cookie 應用到當前頁面。
 */
export function loadProfile() {
  const profileName = dom.profilesSelect.value;
  if (!profileName) {
    alert('請選擇一個要載入的設定檔。');
    return;
  }
  const profileKey = `${PROFILE_PREFIX}${profileName}`;
  chrome.storage.sync.get([profileKey], async (result) => {
    if (result[profileKey]) {
      // 使用深層複製以避免直接修改原始儲存的資料
      state.currentCookies = JSON.parse(JSON.stringify(result[profileKey]));
      state.loadedProfileName = profileName;
      renderCookieList();
      updateLoadedProfileDisplay();
      // 載入後自動套用，但不顯示成功提示
      const success = await applyToPage(false); 
      if (success) {
        alert(`設定檔 "${profileName}" 已載入並套用至當前網頁。`);
      }
    } else {
      alert(`錯誤：找不到設定檔 "${profileName}" 的資料。`);
    }
  });
}

/**
 * 從下拉選單中選擇並刪除一個設定檔。
 * 此操作會移除 `profile_{profileName}` 項目，並從 `profile_list` 中移除對應的名稱。
 */
export function deleteProfile() {
  const profileName = dom.profilesSelect.value;
  if (!profileName) {
    alert('請選擇一個要刪除的設定檔。');
    return;
  }
  if (confirm(`確定要刪除設定檔 "${profileName}" 嗎？`)) {
    const profileKey = `${PROFILE_PREFIX}${profileName}`;
    // 1. 從儲存中移除該設定檔
    chrome.storage.sync.remove(profileKey, () => {
      // 2. 更新 profile_list
      chrome.storage.sync.get([PROFILE_LIST_KEY], (result) => {
        const profileNames = result[PROFILE_LIST_KEY] || [];
        const updatedList = profileNames.filter(name => name !== profileName);
        chrome.storage.sync.set({ [PROFILE_LIST_KEY]: updatedList }, () => {
          // 3. 更新 UI
          if (state.loadedProfileName === profileName) {
            state.loadedProfileName = '';
            state.currentCookies = [];
            renderCookieList();
            updateLoadedProfileDisplay();
          }
          loadProfilesUI(); // 重新載入 UI 以更新下拉選單
          alert(`設定檔 "${profileName}" 已刪除。`);
        });
      });
    });
  }
}

/**
 * 將當前編輯區的 Cookie 儲存為一個新的設定檔。
 * 如果是新設定檔，會建立 `profile_{profileName}` 並更新 `profile_list`。
 * 如果是現有設定檔，則只會更新 `profile_{profileName}` 的內容。
 */
export function saveProfile() {
    const name = dom.profileNameInput.value.trim();
    if (!name) {
      alert('請為新設定檔輸入一個名稱。');
      return;
    }
    
    const profileKey = `${PROFILE_PREFIX}${name}`;
    const dataToSave = { [profileKey]: state.currentCookies };

    // 先檢查設定檔是否已存在
    chrome.storage.sync.get([PROFILE_LIST_KEY], (result) => {
        const profileNames = result[PROFILE_LIST_KEY] || [];
        if (profileNames.includes(name)) {
            if (!confirm(`設定檔 "${name}" 已存在。要覆蓋它嗎？`)) return;
        }

        // 儲存設定檔資料
        chrome.storage.sync.set(dataToSave, () => {
            // 如果是新設定檔，則更新 profile_list
            if (!profileNames.includes(name)) {
                const newList = [...profileNames, name];
                chrome.storage.sync.set({ [PROFILE_LIST_KEY]: newList }, () => {
                    loadProfilesUI(); // 重新載入 UI
                });
            }
            state.loadedProfileName = name;
            updateLoadedProfileDisplay();
            alert(`設定檔 "${name}" 已儲存。`);
            dom.profileNameInput.value = ''; // 清空輸入框
        });
    });
}

/**
 * 儲存對已載入設定檔的修改。
 * 這只會更新 `profile_{profileName}` 的內容，不會影響 `profile_list`。
 */
export function saveEditedProfile() {
    if (!state.loadedProfileName) {
      alert('沒有載入任何設定檔。請先載入一個設定檔再儲存.\n提示：您可以從「設定檔管理」分頁載入，或從下方建立一個新的。');
      return;
    }
    const profileKey = `${PROFILE_PREFIX}${state.loadedProfileName}`;
    const dataToSave = { [profileKey]: state.currentCookies };

    chrome.storage.sync.set(dataToSave, () => {
        alert(`對設定檔 "${state.loadedProfileName}" 的修改已儲存。`);
    });
}

// CommonJS export for testing in Node.js environment
try {
  if (module) {
    module.exports = {
      loadProfile,
      deleteProfile,
      saveProfile,
      saveEditedProfile,
      PROFILE_PREFIX,
      PROFILE_LIST_KEY
    };
  }
} catch (e) {
  // Running in browser, do nothing
}
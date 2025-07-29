// js/profiles.js
/**
 * @file 管理 Cookie 設定檔，包括載入、刪除和儲存。
 */

import { dom, state } from './state.js';
import { renderCookieList, updateLoadedProfileDisplay, loadProfilesUI } from './ui.js';
import { applyToPage } from './editor.js';

/**
 * 從下拉選單中選擇並載入一個設定檔到編輯區。
 * 載入後會自動將 Cookie 應用到當前頁面。
 */
export function loadProfile() {
  const profileName = dom.profilesSelect.value;
  if (!profileName) {
    alert('請選擇一個要載入的設定檔。');
    return;
  }
  chrome.storage.local.get(['cookieProfiles'], async (result) => {
    const profiles = result.cookieProfiles || {};
    if (profiles[profileName]) {
      // 使用深層複製以避免直接修改原始儲存的資料
      state.currentCookies = JSON.parse(JSON.stringify(profiles[profileName]));
      state.loadedProfileName = profileName;
      renderCookieList();
      updateLoadedProfileDisplay();
      // 載入後自動套用，但不顯示成功提示
      const success = await applyToPage(false); 
      if (success) {
        alert(`設定檔 "${profileName}" 已載入並套用至當前網頁。`);
      }
    }
  });
}

/**
 * 從下拉選單中選擇並刪除一個設定檔。
 */
export function deleteProfile() {
  const profileName = dom.profilesSelect.value;
  if (!profileName) {
    alert('請選擇一個要刪除的設定檔。');
    return;
  }
  if (confirm(`確定要刪除設定檔 "${profileName}" 嗎？`)) {
    chrome.storage.local.get(['cookieProfiles'], (result) => {
      const profiles = result.cookieProfiles || {};
      delete profiles[profileName];
      chrome.storage.local.set({ cookieProfiles: profiles }, () => {
        // 如果刪除的是當前載入的設定檔，則清空編輯區
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
  }
}

/**
 * 將當前編輯區的 Cookie 儲存為一個新的設定檔。
 */
export function saveProfile() {
    const name = dom.profileNameInput.value.trim();
    if (!name) {
      alert('請為新設定檔輸入一個名稱。');
      return;
    }
    chrome.storage.local.get(['cookieProfiles'], (result) => {
      const profiles = result.cookieProfiles || {};
      // 如果設定檔已存在，提示使用者是否覆蓋
      if (profiles[name]) {
        if (!confirm(`設定檔 "${name}" 已存在。要覆蓋它嗎？`)) return;
      }
      profiles[name] = state.currentCookies;
      chrome.storage.local.set({ cookieProfiles: profiles }, () => {
        loadProfilesUI(); // 重新載入 UI
        state.loadedProfileName = name;
        updateLoadedProfileDisplay();
        alert(`設定檔 "${name}" 已儲存。`);
        dom.profileNameInput.value = ''; // 清空輸入框
      });
    });
}

/**
 * 儲存對已載入設定檔的修改。
 */
export function saveEditedProfile() {
    if (!state.loadedProfileName) {
      alert('沒有載入任何設定檔。請先載入一個設定檔再儲存.\n提示：您可以從「設定檔管理」分頁載入，或從下方建立一個新的。');
      return;
    }
    chrome.storage.local.get(['cookieProfiles'], (result) => {
        const profiles = result.cookieProfiles || {};
        profiles[state.loadedProfileName] = state.currentCookies;
        chrome.storage.local.set({ cookieProfiles: profiles }, () => {
            alert(`對設定檔 "${state.loadedProfileName}" 的修改已儲存。`);
        });
    });
}
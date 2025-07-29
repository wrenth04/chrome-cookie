// js/editor.js
/**
 * @file 編輯器相關功能，包含將 Cookie 應用至頁面、複製 Cookie 字串、從字串儲存設定檔等。
 * @description
 *      此檔案主要處理與 Cookie 編輯區互動的功能。
 *      - `applyToPage`: 將編輯區的 Cookie 應用到當前網頁。
 *      - `saveFromString`: 解析 Cookie 字串並儲存為新的設定檔，此過程會與新的拆分儲存結構互動。
 */

import { dom, state } from './state.js';
import { renderCookieList, updateLoadedProfileDisplay, loadProfilesUI } from './ui.js';

const PROFILE_PREFIX = 'profile_';
const PROFILE_LIST_KEY = 'profile_list';

/**
 * 將編輯區的 Cookie 應用到當前的網頁。
 * @param {boolean} [showSuccessAlert=true] - 是否在成功後顯示提示訊息。
 * @returns {Promise<boolean>} - 回傳操作是否成功。
 */
export async function applyToPage(showSuccessAlert = true) {
  if (!state.activeTab || !state.activeTab.url || !state.activeTab.url.startsWith('http')) {
    alert('請在一個有效的網頁上套用 Cookie。');
    return false;
  }
  
  const { url, cookieStoreId } = state.activeTab;
  const storeId = cookieStoreId;
  const hostname = new URL(url).hostname;

  const existingCookies = await chrome.cookies.getAll({ url, storeId });
  for (const cookie of existingCookies) {
    await chrome.cookies.remove({ url, name: cookie.name, storeId });
  }

  for (const savedCookie of state.currentCookies) {
    const newCookie = {
      url: url,
      name: savedCookie.name,
      value: savedCookie.value,
      path: savedCookie.path || '/',
      storeId: storeId,
      domain: hostname, 
    };

    if (savedCookie.secure) newCookie.secure = savedCookie.secure;
    if (savedCookie.httpOnly) newCookie.httpOnly = savedCookie.httpOnly;
    if (savedCookie.sameSite) newCookie.sameSite = savedCookie.sameSite;
    if (savedCookie.expirationDate && !savedCookie.session) {
      newCookie.expirationDate = savedCookie.expirationDate;
    }

    try {
      await chrome.cookies.set(newCookie);
    } catch (e) {
      if (e.message.includes("domain")) {
          try {
              delete newCookie.domain;
              await chrome.cookies.set(newCookie);
          } catch (e2) {
              console.warn(`無法設定 Cookie (重試後) "${newCookie.name}": ${e2.message}`, newCookie);
          }
      } else {
          console.warn(`無法設定 Cookie "${newCookie.name}": ${e.message}`, newCookie);
      }
    }
  }

  if (showSuccessAlert) {
    alert('編輯區的 Cookie 已成功套用到當前網頁。');
  }
  return true;
}

/**
 * 複製 Cookie 字串到剪貼簿。
 */
export function copyCookieString() {
  const textToCopy = dom.copyCookieStringTextarea.value;
  if (textToCopy) {
    navigator.clipboard.writeText(textToCopy).then(() => {
      alert('Cookie 字串已成功複製到剪貼簿！');
    }).catch(err => {
      console.error('無法複製文字: ', err);
      alert('複製失敗，請手動複製。');
    });
  } else {
    alert('沒有內容可以複製。');
  }
}

/**
 * 從輸入的字串建立並儲存一個新的 Cookie 設定檔。
 * 此函數會建立一個新的 `profile_{profileName}` 項目並更新 `profile_list`。
 */
export function saveFromString() {
  const name = dom.newProfileNameInput.value.trim();
  const cookieString = dom.cookieStringInput.value.trim();
  if (!name) {
    alert('請輸入新設定檔的名稱。');
    return;
  }
  if (!cookieString) {
    alert('請貼上 Cookie 字串。');
    return;
  }
  const cookies = cookieString.split(';').map(p => {
    const parts = p.trim().split('=');
    if (parts.length === 2) return { name: parts[0].trim(), value: parts[1].trim() };
    return null;
  }).filter(Boolean);

  if (cookies.length === 0) {
    alert('無法解析 Cookie 字串，請檢查格式。');
    return;
  }

  const profileKey = `${PROFILE_PREFIX}${name}`;
  const dataToSave = { [profileKey]: cookies };

  chrome.storage.sync.get([PROFILE_LIST_KEY], (result) => {
    const profileNames = result[PROFILE_LIST_KEY] || [];
    if (profileNames.includes(name)) {
      if (!confirm(`設定檔 "${name}" 已存在。要覆蓋它嗎？`)) return;
    }

    chrome.storage.sync.set(dataToSave, () => {
      if (!profileNames.includes(name)) {
        const newList = [...profileNames, name];
        chrome.storage.sync.set({ [PROFILE_LIST_KEY]: newList }, () => {
          loadProfilesUI();
        });
      }
      state.loadedProfileName = name;
      state.currentCookies = cookies;
      renderCookieList();
      updateLoadedProfileDisplay();
      alert(`設定檔 "${name}" 已成功從字串建立。`);
      dom.newProfileNameInput.value = '';
      dom.cookieStringInput.value = '';
    });
  });
}

/**
 * 從編輯區的列表中刪除單個 Cookie。
 * @param {Event} e - 點擊事件物件。
 */
export function deleteSingleCookie(e) {
  if (e.target.classList.contains('delete-cookie')) {
    const name = e.target.dataset.name;
    state.currentCookies = state.currentCookies.filter(c => c.name !== name);
    renderCookieList();
  }
}

// CommonJS export for testing in Node.js environment
try {
  if (module) {
    module.exports = {
      applyToPage,
      copyCookieString,
      saveFromString,
      deleteSingleCookie,
      PROFILE_PREFIX,
      PROFILE_LIST_KEY
    };
  }
} catch (e) {
  // Running in browser, do nothing
}
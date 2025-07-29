// js/ui.js
/**
 * @file 管理所有與 UI 渲染相關的函數。
 */

import { dom, state } from './state.js';

/**
 * 更新可供複製的 Cookie 字串文字區。
 */
export const updateCopyableString = () => {
  if (state.currentCookies.length > 0) {
    const cookieString = state.currentCookies.map(c => `${c.name}=${c.value}`).join('; ');
    dom.copyCookieStringTextarea.value = cookieString;
  } else {
    dom.copyCookieStringTextarea.value = '';
  }
};

/**
 * 根據 `state.currentCookies` 渲染編輯區的 Cookie 列表。
 */
export const renderCookieList = () => {
  dom.cookieListDiv.innerHTML = '';
  if (state.currentCookies.length === 0) {
    dom.cookieListDiv.innerHTML = '<p><em>編輯區是空的。</em></p>';
    updateCopyableString();
    return;
  }
  state.currentCookies.forEach(cookie => {
    const cookieItem = document.createElement('div');
    cookieItem.className = 'cookie-item';
    cookieItem.innerHTML = `
      <span><strong>${cookie.name}</strong>: ${cookie.value}</span>
      <button data-name="${cookie.name}" class="delete-cookie">X</button>
    `;
    dom.cookieListDiv.appendChild(cookieItem);
  });
  updateCopyableString();
};

/**
 * 更新顯示當前載入設定檔名稱的 UI 元素。
 */
export const updateLoadedProfileDisplay = () => {
  dom.loadedProfileNameDisplay.textContent = state.loadedProfileName || '無';
};

/**
 * 根據從存儲中讀取的設定檔，渲染匯出工具中的設定檔列表。
 * @param {object} profiles - 從 chrome.storage.local 讀取的設定檔物件。
 */
export const renderExportList = (profiles) => {
  dom.exportProfilesListDiv.innerHTML = '';
  dom.exportSelectAll.checked = false;
  dom.exportSelectAll.indeterminate = false;
  const hasProfiles = Object.keys(profiles).length > 0;
  dom.exportSelectAllContainer.style.display = hasProfiles ? 'block' : 'none';

  if (!hasProfiles) {
    dom.exportProfilesListDiv.innerHTML = '<p><em>沒有任何設定檔可匯出。</em></p>';
    return;
  }
  for (const name in profiles) {
    const checkboxContainer = document.createElement('div');
    checkboxContainer.className = 'checkbox-container';
    checkboxContainer.innerHTML = `
      <input type="checkbox" id="export-${name}" name="exportProfile" value="${name}">
      <label for="export-${name}">${name}</label>
    `;
    dom.exportProfilesListDiv.appendChild(checkboxContainer);
  }
};

/**
 * 從 chrome.storage 載入所有設定檔，並更新設定檔管理的下拉選單和匯出工具的列表。
 */
export const loadProfilesUI = () => {
  chrome.storage.local.get(['cookieProfiles'], (result) => {
    const profiles = result.cookieProfiles || {};
    const selectedValue = dom.profilesSelect.value;
    
    // 重新填充設定檔下拉選單
    dom.profilesSelect.innerHTML = '<option value="" disabled selected>選擇一個設定檔</option>';
    for (const name in profiles) {
      const option = document.createElement('option');
      option.value = name;
      option.textContent = name;
      dom.profilesSelect.appendChild(option);
    }
    // 如果之前有選中的值且該值仍然存在，則恢復選中狀態
    if (selectedValue && profiles[selectedValue]) {
      dom.profilesSelect.value = selectedValue;
    }

    // 重新渲染匯出列表
    renderExportList(profiles);
  });
};
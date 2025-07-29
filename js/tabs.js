// js/tabs.js
/**
 * @file 處理彈出視窗中的分頁切換邏輯。
 * @description
 *      此檔案負責實現擴充功能彈出視窗中的分頁 (Tab) 切換功能。
 *      它為每個分頁標籤新增點擊事件監聽器，
 *      當使用者點擊時，會顯示對應的內容區域並隱藏其他區域。
 */

import { dom } from './state.js';

/**
 * 設定分頁點擊事件，實現內容區域的切換。
 */
export function setupTabs() {
  dom.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab; // 獲取目標內容區域的 ID

      // 移除所有分頁標籤的 'active' class
      dom.tabs.forEach(t => t.classList.remove('active'));
      // 為被點擊的分頁標籤加上 'active' class
      tab.classList.add('active');

      // 隱藏所有內容區域
      dom.tabContents.forEach(content => {
        content.classList.remove('active');
        // 如果內容區域的 ID 與目標 ID 相符，則顯示它
        if (content.id === target) {
          content.classList.add('active');
        }
      });
    });
  });
}
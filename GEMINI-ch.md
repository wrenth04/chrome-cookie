# Chrome 擴充功能開發筆記

這份文件整理了開發 Chrome 擴充功能時的核心概念與最佳實踐。

## 一、開發最佳實踐

### 1. 優先考慮使用者信任與安全性
- **最小權限原則**：在 `manifest.json` 中只請求功能絕對必要的權限。
- **保護開發者帳戶**：使用雙重驗證 (2FA) 保護您的開發者帳戶。
- **內容安全策略 (CSP)**：設定嚴格的 CSP 來防止跨網站指令碼 (XSS) 攻擊。

### 2. 專注於簡潔直觀的 UI/UX
- **使用者友善**：設計簡單直觀的介面，易於使用者理解和操作。
- **清晰描述**：在 Chrome 線上應用程式商店中提供清晰的擴充功能描述。

### 3. 編寫乾淨高效的程式碼
- **組織化與模組化**：保持程式碼結構清晰，便於維護和偵錯。
- **非同步程式設計**：多加利用非同步操作 (如 Promises, async/await) 避免阻塞主執行緒，提升效能。

### 4. 徹底測試與偵錯
- **全面測試**：在不同的 Chrome 版本、作業系統和網路條件下進行測試。
- **錯誤管理**：使用功能旗標 (Feature Flags) 等策略有效管理和修復錯誤。

### 5. 遵守 Chrome 線上應用程式商店政策
- **詳閱並遵守**：確保您的擴充功能符合所有開發者計畫政策，避免被下架。

---

## 二、Cookie 管理

要管理瀏覽器 Cookie，需使用 `chrome.cookies` API。

### 1. `manifest.json` 設定
必須在 `manifest.json` 中宣告權限：
- **`"permissions"`**:
    - `"cookies"`: 允許使用 `chrome.cookies` API。
    - **主機權限**: 指定可以存取哪些網站的 Cookie，例如 `"https://*.example.com/"` 或 `"<all_urls>"`。

```json
"permissions": [
  "cookies",
  "https://*.google.com/"
]
```

### 2. `chrome.cookies` API
此 API 的所有方法都是 **非同步** 的，需要使用回呼函式 (callback) 或 Promises 處理結果。

- **`chrome.cookies.get(details, callback)`**: 取得單一 Cookie。
- **`chrome.cookies.getAll(details, callback)`**: 取得符合條件的所有 Cookie。
- **`chrome.cookies.set(details, callback)`**: 設定或覆寫一個 Cookie。
- **`chrome.cookies.remove(details, callback)`**: 刪除一個 Cookie。

---

## 三、資料儲存

擴充功能應優先使用 `chrome.storage` API 來儲存資料。

### 1. `manifest.json` 設定
必須在 `manifest.json` 中請求 `"storage"` 權限。

```json
"permissions": [
  "storage"
]
```

### 2. `chrome.storage` API (推薦)
此 API 是 **非同步** 的，效能好，且專為擴充功能設計。

- **`chrome.storage.local`**:
    - **用途**: 在使用者本機儲存資料 (上限 10MB)。
    - **生命週期**: 資料會保留直到擴充功能被解除安裝。
- **`chrome.storage.sync`**:
    - **用途**: 在使用者登入的所有裝置間同步資料 (上限 100KB)。
    - **生命週期**: 與使用者的 Chrome 帳戶綁定。
- **`chrome.storage.session`**:
    - **用途**: 在單次瀏覽器工作階段中儲存資料於記憶體。
    - **生命週期**: 瀏覽器關閉後清除。
- **`chrome.storage.managed`**:
    - **用途**: (唯讀) 由系統管理員透過政策為組織成員預先設定的資料。

### 3. 其他儲存選項

- **`localStorage` (不推薦)**:
    - **缺點**: 同步操作會阻塞 UI、資料可能隨瀏覽紀錄被清除、只能儲存字串。應避免使用。
- **IndexedDB**:
    - **用途**: 適合儲存需要複雜查詢的大量結構化資料。當 `chrome.storage` 不敷使用時可考慮。

---

## 四、國際化 (i18n)

為了讓擴充功能觸及全球使用者，國際化 (Internationalization) 是關鍵。

### 1. `manifest.json` 與檔案結構
- **`_locales` 資料夾**: 在根目錄建立此資料夾，並為每種語言建立子資料夾 (例如 `en`, `zh_TW`)。
- **`messages.json`**: 在每個語言子資料夾中建立此檔案，用來存放翻譯字串。
- **`"default_locale"`**: 在 `manifest.json` 中設定預設語言。
- **`__MSG_messagename__`**: 在 `manifest.json` 和 CSS 檔案中使用此格式來引用翻譯字串。

### 2. `chrome.i18n` API
- **`chrome.i18n.getMessage(messageName, substitutions)`**: 在 JavaScript 中取得翻譯字串。
- **預定義訊息**: 使用 `@@ui_locale` 等訊息來取得當前環境資訊。

### 3. HTML 國際化
- 建議使用 JavaScript 掃描並替換帶有 `data-i18n` 等特定屬性的 HTML 元素內容。

---

## 五、自動化測試

自動化測試是確保擴充功能品質與可靠性的重要環節。

### 1. 端對端 (End-to-End) 測試
- **目的**: 模擬真實使用者情境，驗證完整功能流程。
- **工具**:
    - **Puppeteer**: Google 開發的 Node.js 函式庫，可控制 Chrome/Chromium。
    - **Playwright**: Microsoft 開發的類似工具，支援多種瀏覽器。
    - **Selenium**: 老牌的瀏覽器自動化框架。

### 2. 單元測試 (Unit Testing)
- **目的**: 獨立測試擴充功能中的個別函式或元件。
- **框架**:
    - **Jest**: 功能強大的 JavaScript 測試框架。
    - **Mocha**: 靈活的測試框架。
- **關鍵**: 需要 **模擬 (Mocking)** `chrome.*` 等擴充功能特有的 API。

### 3. 其他重要測試
- **UI / 視覺回歸測試**: 確保 UI 介面的一致性與預期相符。
- **效能測試**: 確保擴充功能不會過度影響瀏覽器效能。
- **無障礙 (Accessibility) 測試**: 確保所有使用者都能順利操作。

### 4. 最佳實踐
- **整合測試策略**: 結合單元測試、E2E 測試等多種方法。
- **持續整合 (CI)**: 使用 GitHub Actions 等工具自動化測試流程。
- **跨環境測試**: 在不同作業系統與瀏覽器版本上進行測試。
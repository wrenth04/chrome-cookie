# Chrome Extension Development Notes

This document summarizes the core concepts and best practices for developing Chrome extensions.

## 1. Development Best Practices

### 1. Prioritize User Trust and Security
- **Principle of Least Privilege**: Only request absolutely necessary permissions in `manifest.json`.
- **Protect Developer Accounts**: Use Two-Factor Authentication (2FA) to protect your developer account.
- **Content Security Policy (CSP)**: Set a strict CSP to prevent Cross-Site Scripting (XSS) attacks.

### 2. Focus on a Clean and Intuitive UI/UX
- **User-Friendly**: Design a simple and intuitive interface that is easy for users to understand and operate.
- **Clear Description**: Provide a clear extension description in the Chrome Web Store.

### 3. Write Clean and Efficient Code
- **Organization and Modularity**: Keep the code structure clean for easy maintenance and debugging.
- **Asynchronous Programming**: Make heavy use of asynchronous operations (like Promises, async/await) to avoid blocking the main thread and improve performance.

### 4. Thoroughly Test and Debug
- **Comprehensive Testing**: Test across different Chrome versions, operating systems, and network conditions.
- **Bug Management**: Use strategies like Feature Flags to effectively manage and fix bugs.

### 5. Adhere to Chrome Web Store Policies
- **Read and Comply**: Ensure your extension complies with all developer program policies to avoid being delisted.

---

## 2. Cookie Management

To manage browser cookies, use the `chrome.cookies` API.

### 1. `manifest.json` Configuration
Permissions must be declared in `manifest.json`:
- **`"permissions"`**:
    - `"cookies"`: Allows the use of the `chrome.cookies` API.
    - **Host Permissions**: Specify which websites' cookies can be accessed, e.g., `"https://*.example.com/"` or `"<all_urls>"`.

```json
"permissions": [
  "cookies",
  "https://*.google.com/"
]
```

### 2. `chrome.cookies` API
All methods of this API are **asynchronous**, requiring callbacks or Promises to handle the results.

- **`chrome.cookies.get(details, callback)`**: Get a single cookie.
- **`chrome.cookies.getAll(details, callback)`**: Get all cookies that match the given details.
- **`chrome.cookies.set(details, callback)`**: Set or overwrite a cookie.
- **`chrome.cookies.remove(details, callback)`**: Remove a cookie.

---

## 3. Data Storage

Extensions should prioritize using the `chrome.storage` API for data storage.

### 1. `manifest.json` Configuration
The `"storage"` permission must be requested in `manifest.json`.

```json
"permissions": [
  "storage"
]
```

### 2. `chrome.storage` API (Recommended)
This API is **asynchronous**, performant, and designed specifically for extensions.

- **`chrome.storage.local`**:
    - **Use Case**: Store data on the user's local machine (up to 10MB).
    - **Lifecycle**: Data persists until the extension is uninstalled.
- **`chrome.storage.sync`**:
    - **Use Case**: Sync data across all devices where the user is logged in (up to 100KB).
    - **Lifecycle**: Tied to the user's Chrome account.
- **`chrome.storage.session`**:
    - **Use Case**: Store data in memory for a single browser session.
    - **Lifecycle**: Cleared when the browser is closed.
- **`chrome.storage.managed`**:
    - **Use Case**: (Read-only) Data pre-configured by a system administrator for organization members via policy.

### 3. Other Storage Options

- **`localStorage` (Not Recommended)**:
    - **Drawbacks**: Synchronous operations block the UI, data can be cleared with browsing history, and it only stores strings. Its use should be avoided.
- **IndexedDB**:
    - **Use Case**: Suitable for storing large amounts of structured data that require complex queries. Consider it when `chrome.storage` is insufficient.

---

## 4. Internationalization (i18n)

Internationalization is key to reaching a global audience with your extension.

### 1. `manifest.json` and File Structure
- **`_locales` Directory**: Create this in the root, with subdirectories for each language (e.g., `en`, `es`).
- **`messages.json`**: Place this file in each language subdirectory to hold translation strings.
- **`"default_locale"`**: Set a default language in `manifest.json`.
- **`__MSG_messagename__`**: Use this format in `manifest.json` and CSS files to reference translated strings.

### 2. `chrome.i18n` API
- **`chrome.i18n.getMessage(messageName, substitutions)`**: Get translated strings in your JavaScript code.
- **Predefined Messages**: Use messages like `@@ui_locale` to get information about the current environment.

### 3. i18n for HTML
- It's recommended to use JavaScript to scan and replace the content of HTML elements that have a specific attribute, such as `data-i18n`.

---

## 5. Automated Testing

Automated testing is crucial for ensuring the quality and reliability of your extension.

### 1. End-to-End (E2E) Testing
- **Purpose**: Simulates real user scenarios to validate the entire application flow.
- **Tools**:
    - **Puppeteer**: A Node.js library by Google to control Chrome/Chromium.
    - **Playwright**: A similar tool by Microsoft that supports multiple browsers.
    - **Selenium**: A long-standing browser automation framework.

### 2. Unit Testing
- **Purpose**: Tests individual functions or components of the extension in isolation.
- **Frameworks**:
    - **Jest**: A powerful JavaScript testing framework.
    - **Mocha**: A flexible testing framework.
- **Key Aspect**: Requires **mocking** of extension-specific APIs like `chrome.*`.

### 3. Other Important Tests
- **UI / Visual Regression Testing**: Ensures UI consistency and appearance.
- **Performance Testing**: Ensures the extension doesn't negatively impact browser performance.
- **Accessibility Testing**: Ensures the extension is usable by everyone.

### 4. Best Practices
- **Integrated Strategy**: Combine unit tests, E2E tests, and other methods.
- **Continuous Integration (CI)**: Automate the testing process using tools like GitHub Actions.
- **Cross-Environment Testing**: Test on different operating systems and browser versions.

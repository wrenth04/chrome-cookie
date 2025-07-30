// test/i18n.test.js
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

// 模擬 chrome.i18n.getMessage
global.chrome = {
  i18n: {
    getMessage: jest.fn(key => {
      const messages = {
        "extensionName": "Cookie Management",
        "profilesTab": "Profiles",
        "editorTab": "Editor",
        "toolsTab": "Tools",
        "profilesTitle": "Profile Management",
        "filterProfilesPlaceholder": "Filter profiles...",
        "loadProfileButton": "Load and Apply Profile",
        "deleteProfileButton": "Delete Selected Profile",
        "saveChangesPrompt": "To save changes to the current profile, go to the 'Editor' tab.",
        "editorTitle": "Edit and Create",
        "currentProfileLabel": "Currently editing profile:",
        "noProfileLoaded": "None",
        "applyToPageButton": "Apply Above List to Page",
        "saveEditedProfileButton": "Save Changes to Current Profile",
        "copyFromListLabel": "Copy from Current List",
        "copyCookieStringPlaceholder": "Copyable cookie string will appear here...",
        "copyCookieStringButton": "Copy String",
        "createNewProfileLabel": "Create New Profile",
        "newProfileNamePlaceholder": "New profile name",
        "saveProfileButton": "Save Current List as New Profile",
        "createFromStringLabel": "Quick Create from String",
        "newProfileNamePlaceholder2": "New profile name",
        "pasteCookieStringPlaceholder": "Paste cookie string here (e.g., name1=value1; name2=value2)",
        "saveFromStringButton": "Save as New Profile from String",
        "toolsTitle": "Tools",
        "exportProfilesLabel": "Export Profiles",
        "selectAllLabel": "Select/Deselect All",
        "exportSelectedProfilesButton": "Export Selected Profiles",
        "importProfilesLabel": "Import Profiles",
        "importFromFileButton": "Import from File",
        "otherToolsLabel": "Other",
        "clearPageCookiesButton": "Clear Current Page Cookies"
      };
      return messages[key] || '';
    })
  }
};

// 讀取 popup.html
const html = fs.readFileSync(path.resolve(__dirname, '../popup.html'), 'utf8');

// 模擬 applyI18n 函數
function applyI18n(document) {
  document.querySelectorAll('[data-i18n]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n');
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        element.textContent = message;
      }
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
    const messageKey = element.getAttribute('data-i18n-placeholder');
    if (messageKey) {
      const message = chrome.i18n.getMessage(messageKey);
      if (message) {
        element.placeholder = message;
      }
    }
  });
}

describe('i18n', () => {
  let document;

  beforeEach(() => {
    const dom = new JSDOM(html, { runScripts: 'dangerously' });
    document = dom.window.document;
  });

  test('should apply English translations to the popup', () => {
    // 執行 i18n 函數
    applyI18n(document);

    // 驗證標題
    const title = document.querySelector('h1');
    expect(title.textContent).toBe('Cookie Management');

    // 驗證分頁按鈕
    const profilesTab = document.querySelector('[data-tab="profiles"]');
    expect(profilesTab.textContent).toBe('Profiles');

    // 驗證 placeholder
    const filterInput = document.getElementById('profileFilter');
    expect(filterInput.placeholder).toBe('Filter profiles...');
  });
});

// js/tools.test.js

// Mock dependencies from other modules.
// We only need to mock the functions that are actually called by the functions we're testing.
jest.mock('../js/ui.js', () => ({
  loadProfilesUI: jest.fn(),
  renderCookieList: jest.fn(),
}));
jest.mock('../js/state.js', () => ({
  dom: {
    importFileInput: { value: '' },
  },
  state: {
    activeTab: { url: 'https://example.com', cookieStoreId: '1' },
    currentCookies: [],
  },
}));

const {
  exportSelectedProfiles,
  handleImportFile,
  clearPageCookies,
  PROFILE_PREFIX,
  PROFILE_LIST_KEY
} = require('../js/tools.js');
const { state } = require('../js/state.js');
const { loadProfilesUI, renderCookieList } = require('../js/ui.js');


describe('Tools Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true); // Assume user always confirms
  });

  describe('Export Profiles', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <div id="exportProfilesList">
          <input type="checkbox" name="exportProfile" value="Profile1" checked>
          <input type="checkbox" name="exportProfile" value="Profile2" checked>
          <input type="checkbox" name="exportProfile" value="Profile3">
        </div>
      `;
      global.URL.createObjectURL = jest.fn(() => 'blob:http://localhost/mock-url');
      global.URL.revokeObjectURL = jest.fn();
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn(),
        remove: jest.fn(),
      };
      global.document.createElement = jest.fn(() => mockLink);
    });

    test('should export selected profiles correctly', () => {
      const mockProfiles = {
        [`${PROFILE_PREFIX}Profile1`]: [{ name: 'cookie1', value: 'value1' }],
        [`${PROFILE_PREFIX}Profile2`]: [{ name: 'cookie2', value: 'value2' }],
      };
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback(mockProfiles);
      });

      exportSelectedProfiles();

      const expectedKeys = [`${PROFILE_PREFIX}Profile1`, `${PROFILE_PREFIX}Profile2`];
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(expectedKeys, expect.any(Function));

      const expectedExportData = {
        "Profile1": [{ "name": "cookie1", "value": "value1" }],
        "Profile2": [{ "name": "cookie2", "value": "value2" }],
      };
      const expectedJson = JSON.stringify(expectedExportData, null, 2);
      expect(global.Blob).toHaveBeenCalledWith([expectedJson], { type: 'application/json' });

      const link = global.document.createElement();
      expect(link.href).toBe('blob:http://localhost/mock-url');
      expect(link.download).toBe('cookie_profiles_export.json');
      expect(link.click).toHaveBeenCalledTimes(1);
    });

    test('should show alert if no profile is selected', () => {
      document.querySelectorAll('input[name="exportProfile"]').forEach(cb => cb.checked = false);
      exportSelectedProfiles();
      expect(global.alert).toHaveBeenCalledWith('請至少選擇一個要匯出的設定檔。');
      expect(chrome.storage.sync.get).not.toHaveBeenCalled();
    });
  });

  describe('Import Profiles', () => {
    let mockReader;

    beforeEach(() => {
        // Mock FileReader
        mockReader = {
            readAsText: jest.fn(),
            onload: null,
            result: ''
        };
        global.FileReader = jest.fn(() => mockReader);
        document.body.innerHTML = `<input type="file" id="importFileInput">`;
    });

    test('should import and merge profiles correctly', () => {
        const importedData = {
            'NewProfile': [{ name: 'new_cookie', value: 'new_val' }],
            'ExistingProfile': [{ name: 'updated_cookie', value: 'updated_val' }]
        };
        mockReader.result = JSON.stringify(importedData);

        // Mock existing profiles in storage
        chrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ [PROFILE_LIST_KEY]: ['ExistingProfile', 'OldProfile'] });
        });
        chrome.storage.sync.set.mockImplementation((data, callback) => {
            callback();
        });

        const mockFile = new Blob([JSON.stringify(importedData)], { type: 'application/json' });
        const mockEvent = { target: { files: [mockFile], value: '' } };

        handleImportFile(mockEvent);
        mockReader.onload({ target: { result: mockReader.result } }); // Manually trigger onload

        expect(global.confirm).toHaveBeenCalled();
        
        const expectedNewNames = ['ExistingProfile', 'OldProfile', 'NewProfile'];
        const expectedDataToSet = {
            [`${PROFILE_PREFIX}NewProfile`]: importedData.NewProfile,
            [`${PROFILE_PREFIX}ExistingProfile`]: importedData.ExistingProfile,
            [PROFILE_LIST_KEY]: expectedNewNames
        };

        expect(chrome.storage.sync.set).toHaveBeenCalledWith(expectedDataToSet, expect.any(Function));
        expect(loadProfilesUI).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('設定檔已成功合併與更新。');
    });

    test('should show alert on invalid JSON file', () => {
        mockReader.result = 'invalid json';
        const mockFile = new Blob(['invalid json'], { type: 'text/plain' });
        const mockEvent = { target: { files: [mockFile], value: '' } };

        handleImportFile(mockEvent);
        mockReader.onload({ target: { result: mockReader.result } });

        expect(global.alert).toHaveBeenCalledWith('檔案格式錯誤，請確認是從本擴充功能匯出的 .json 檔案。');
    });
  });

  describe('Clear Page Cookies', () => {
    test('should clear all cookies for the active tab', async () => {
        const mockCookies = [
            { name: 'cookie1', url: state.activeTab.url, storeId: state.activeTab.cookieStoreId },
            { name: 'cookie2', url: state.activeTab.url, storeId: state.activeTab.cookieStoreId }
        ];
        chrome.cookies.getAll.mockImplementation((details, callback) => callback(mockCookies));
        // For async version
        chrome.cookies.getAll.mockResolvedValue(mockCookies);
        chrome.cookies.remove.mockResolvedValue({});

        await clearPageCookies();

        expect(global.confirm).toHaveBeenCalled();
        expect(chrome.cookies.getAll).toHaveBeenCalledWith({ url: state.activeTab.url, storeId: state.activeTab.cookieStoreId });
        expect(chrome.cookies.remove).toHaveBeenCalledTimes(2);
        expect(chrome.cookies.remove).toHaveBeenCalledWith({ url: state.activeTab.url, name: 'cookie1', storeId: state.activeTab.cookieStoreId });
        expect(chrome.cookies.remove).toHaveBeenCalledWith({ url: state.activeTab.url, name: 'cookie2', storeId: state.activeTab.cookieStoreId });
        expect(state.currentCookies.length).toBe(0);
        expect(renderCookieList).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith('當前網頁的所有 Cookie 已被清除。');
    });

    test('should show alert if active tab is not a valid webpage', async () => {
        state.activeTab.url = 'chrome://extensions';
        await clearPageCookies();
        expect(global.alert).toHaveBeenCalledWith('請在一個有效的網頁上操作。');
        expect(chrome.cookies.getAll).not.toHaveBeenCalled();
    });
  });
});
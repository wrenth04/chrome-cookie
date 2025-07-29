// js/editor.test.js

jest.mock('../js/ui.js', () => ({
  renderCookieList: jest.fn(),
  updateLoadedProfileDisplay: jest.fn(),
  loadProfilesUI: jest.fn(),
}));
jest.mock('../js/state.js', () => ({
  dom: {
    newProfileNameInput: { value: '' },
    cookieStringInput: { value: '' },
  },
  state: {
    activeTab: { url: 'https://example.com', cookieStoreId: '1' },
    currentCookies: [],
    loadedProfileName: '',
  },
}));

const {
  applyToPage,
  saveFromString,
  deleteSingleCookie,
  PROFILE_PREFIX,
  PROFILE_LIST_KEY
} = require('../js/editor.js');
const { dom, state } = require('../js/state.js');
const { loadProfilesUI, renderCookieList, updateLoadedProfileDisplay } = require('../js/ui.js');

describe('Editor Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
    state.currentCookies = [];
    state.loadedProfileName = '';
    dom.newProfileNameInput.value = '';
    dom.cookieStringInput.value = '';
  });

  describe('applyToPage', () => {
    test('should clear existing cookies and set new ones', async () => {
      const existingCookies = [{ name: 'old', value: 'old_val', url: state.activeTab.url, storeId: state.activeTab.cookieStoreId }];
      const newCookies = [{ name: 'new', value: 'new_val', path: '/' }];
      state.currentCookies = newCookies;

      chrome.cookies.getAll.mockResolvedValue(existingCookies);
      chrome.cookies.remove.mockResolvedValue({});
      chrome.cookies.set.mockResolvedValue({});

      const result = await applyToPage();

      expect(result).toBe(true);
      expect(chrome.cookies.getAll).toHaveBeenCalledWith({ url: state.activeTab.url, storeId: state.activeTab.cookieStoreId });
      expect(chrome.cookies.remove).toHaveBeenCalledWith({ url: state.activeTab.url, name: 'old', storeId: state.activeTab.cookieStoreId });
      
      const expectedCookieToSet = {
        url: state.activeTab.url,
        name: 'new',
        value: 'new_val',
        path: '/',
        storeId: state.activeTab.cookieStoreId,
        domain: 'example.com',
      };
      expect(chrome.cookies.set).toHaveBeenCalledWith(expectedCookieToSet);
      expect(global.alert).toHaveBeenCalledWith('編輯區的 Cookie 已成功套用到當前網頁。');
    });

    test('should not show success alert when specified', async () => {
        await applyToPage(false);
        expect(global.alert).not.toHaveBeenCalled();
    });
  });

  describe('saveFromString', () => {
    test('should create a new profile from a cookie string', (done) => {
        const name = 'StringProfile';
        const cookieStr = 'c1=v1; c2=v2';
        dom.newProfileNameInput.value = name;
        dom.cookieStringInput.value = cookieStr;

        chrome.storage.sync.get.mockImplementation((keys, callback) => callback({ [PROFILE_LIST_KEY]: [] }));
        chrome.storage.sync.set.mockImplementation((data, callback) => callback());

        saveFromString();

        setTimeout(() => {
            const expectedCookies = [{ name: 'c1', value: 'v1' }, { name: 'c2', value: 'v2' }];
            const expectedData = { [`${PROFILE_PREFIX}${name}`]: expectedCookies };
            expect(chrome.storage.sync.set).toHaveBeenCalledWith(expectedData, expect.any(Function));
            expect(chrome.storage.sync.set).toHaveBeenCalledWith({ [PROFILE_LIST_KEY]: [name] }, expect.any(Function));
            
            expect(state.currentCookies).toEqual(expectedCookies);
            expect(renderCookieList).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith(`設定檔 "${name}" 已成功從字串建立。`);
            done();
        }, 0);
    });

    test('should show alert if name or string is empty', () => {
        saveFromString();
        expect(global.alert).toHaveBeenCalledWith('請輸入新設定檔的名稱。');

        dom.newProfileNameInput.value = 'some-name';
        saveFromString();
        expect(global.alert).toHaveBeenCalledWith('請貼上 Cookie 字串。');
    });
  });

  describe('deleteSingleCookie', () => {
    test('should delete a cookie from the current list', () => {
        state.currentCookies = [
            { name: 'cookie1', value: 'val1' },
            { name: 'cookie2', value: 'val2' }
        ];
        const mockEvent = {
            target: {
                classList: { contains: (c) => c === 'delete-cookie' },
                dataset: { name: 'cookie1' }
            }
        };

        deleteSingleCookie(mockEvent);

        expect(state.currentCookies).toEqual([{ name: 'cookie2', value: 'val2' }]);
        expect(renderCookieList).toHaveBeenCalled();
    });

    test('should not do anything if delete button is not clicked', () => {
        state.currentCookies = [{ name: 'cookie1', value: 'val1' }];
        const mockEvent = {
            target: {
                classList: { contains: () => false },
                dataset: {}
            }
        };
        deleteSingleCookie(mockEvent);
        expect(state.currentCookies).toEqual([{ name: 'cookie1', value: 'val1' }]);
        expect(renderCookieList).not.toHaveBeenCalled();
    });
  });
});

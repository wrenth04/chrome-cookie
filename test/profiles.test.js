// js/profiles.test.js

jest.mock('../js/ui.js', () => ({
  renderCookieList: jest.fn(),
  updateLoadedProfileDisplay: jest.fn(),
  loadProfilesUI: jest.fn(),
}));
jest.mock('../js/editor.js', () => ({
  applyToPage: jest.fn(() => Promise.resolve(true)),
}));
jest.mock('../js/state.js', () => ({
  dom: {
    profilesSelect: { value: '' },
    profileNameInput: { value: '' },
  },
  state: {
    currentCookies: [],
    loadedProfileName: '',
  },
}));

const {
  loadProfile,
  deleteProfile,
  saveProfile,
  saveEditedProfile,
  PROFILE_PREFIX,
  PROFILE_LIST_KEY
} = require('../js/profiles.js');
const { dom, state } = require('../js/state.js');
const { applyToPage } = require('../js/editor.js');
const { loadProfilesUI, updateLoadedProfileDisplay, renderCookieList } = require('../js/ui.js');

describe('Profiles Tests', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    global.confirm = jest.fn(() => true);
    // Reset state mocks
    dom.profilesSelect.value = 'TestProfile';
    dom.profileNameInput.value = 'NewProfile';
    state.currentCookies = [{ name: 'c1', value: 'v1' }];
    state.loadedProfileName = '';
  });

  describe('loadProfile', () => {
    test('should load a profile and apply it to the page', (done) => {
      const profileName = 'TestProfile';
      const profileData = [{ name: 'test', value: '123' }];
      dom.profilesSelect.value = profileName;
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ [`${PROFILE_PREFIX}${profileName}`]: profileData });
      });

      loadProfile();

      setTimeout(() => {
        expect(chrome.storage.sync.get).toHaveBeenCalledWith([`${PROFILE_PREFIX}${profileName}`], expect.any(Function));
        expect(state.currentCookies).toEqual(profileData);
        expect(state.loadedProfileName).toBe(profileName);
        expect(renderCookieList).toHaveBeenCalled();
        expect(updateLoadedProfileDisplay).toHaveBeenCalled();
        expect(applyToPage).toHaveBeenCalledWith(false);
        expect(global.alert).toHaveBeenCalledWith(`設定檔 "${profileName}" 已載入並套用至當前網頁。`);
        done();
      }, 0);
    });
  });

  describe('deleteProfile', () => {
    test('should delete a profile and update UI', (done) => {
      const profileName = 'TestProfile';
      dom.profilesSelect.value = profileName;
      state.loadedProfileName = profileName; // Assume it was loaded

      // Mock the sequence of storage operations
      chrome.storage.sync.remove.mockImplementation((key, callback) => callback());
      chrome.storage.sync.get.mockImplementation((keys, callback) => {
        callback({ [PROFILE_LIST_KEY]: [profileName, 'AnotherProfile'] });
      });
      chrome.storage.sync.set.mockImplementation((data, callback) => callback());

      deleteProfile();

      setTimeout(() => {
        expect(chrome.storage.sync.remove).toHaveBeenCalledWith(`${PROFILE_PREFIX}${profileName}`, expect.any(Function));
        expect(chrome.storage.sync.set).toHaveBeenCalledWith({ [PROFILE_LIST_KEY]: ['AnotherProfile'] }, expect.any(Function));
        expect(state.loadedProfileName).toBe('');
        expect(state.currentCookies).toEqual([]);
        expect(loadProfilesUI).toHaveBeenCalled();
        expect(global.alert).toHaveBeenCalledWith(`設定檔 "${profileName}" 已刪除。`);
        done();
      }, 0);
    });
  });

  describe('saveProfile', () => {
    test('should save a new profile and update list', (done) => {
        const newProfileName = 'NewProfile';
        dom.profileNameInput.value = newProfileName;
        
        // Mock that the profile does not exist yet
        chrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ [PROFILE_LIST_KEY]: ['ExistingProfile'] });
        });
        chrome.storage.sync.set.mockImplementation((data, callback) => callback());

        saveProfile();

        setTimeout(() => {
            const expectedData = { [`${PROFILE_PREFIX}${newProfileName}`]: state.currentCookies };
            expect(chrome.storage.sync.set).toHaveBeenCalledWith(expectedData, expect.any(Function));
            
            const expectedList = { [PROFILE_LIST_KEY]: ['ExistingProfile', newProfileName] };
            // This gets called in the callback of the first set
            expect(chrome.storage.sync.set).toHaveBeenCalledWith(expectedList, expect.any(Function));
            
            expect(loadProfilesUI).toHaveBeenCalled();
            expect(global.alert).toHaveBeenCalledWith(`設定檔 "${newProfileName}" 已儲存。`);
            done();
        }, 0);
    });

    test('should ask for confirmation when overwriting a profile', (done) => {
        const existingProfileName = 'ExistingProfile';
        dom.profileNameInput.value = existingProfileName;
        global.confirm.mockReturnValue(false); // User clicks "Cancel"

        chrome.storage.sync.get.mockImplementation((keys, callback) => {
            callback({ [PROFILE_LIST_KEY]: [existingProfileName] });
        });

        saveProfile();

        setTimeout(() => {
            expect(global.confirm).toHaveBeenCalledWith(`設定檔 "${existingProfileName}" 已存在。要覆蓋它嗎？`);
            expect(chrome.storage.sync.set).not.toHaveBeenCalled();
            done();
        }, 0);
    });
  });

  describe('saveEditedProfile', () => {
    test('should save changes to an already loaded profile', () => {
        const loadedProfileName = 'LoadedProfile';
        state.loadedProfileName = loadedProfileName;
        state.currentCookies = [{name: 'new', value: 'data'}];

        chrome.storage.sync.set.mockImplementation((data, callback) => callback());

        saveEditedProfile();

        const expectedData = { [`${PROFILE_PREFIX}${loadedProfileName}`]: state.currentCookies };
        expect(chrome.storage.sync.set).toHaveBeenCalledWith(expectedData, expect.any(Function));
        expect(global.alert).toHaveBeenCalledWith(`對設定檔 "${loadedProfileName}" 的修改已儲存。`);
    });

    test('should show alert if no profile is loaded', () => {
        state.loadedProfileName = '';
        saveEditedProfile();
        expect(global.alert).toHaveBeenCalledWith('沒有載入任何設定檔。請先載入一個設定檔再儲存.\n提示：您可以從「設定檔管理」分頁載入，或從下方建立一個新的。');
        expect(chrome.storage.sync.set).not.toHaveBeenCalled();
    });
  });
});

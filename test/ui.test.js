// test/ui.test.js

jest.mock('../js/state.js', () => ({
  dom: {
    profilesSelect: {
      innerHTML: '',
      value: '',
      appendChild: jest.fn(),
    },
    exportProfilesListDiv: {
        innerHTML: '',
        appendChild: jest.fn(),
    },
    exportSelectAllContainer: {
        style: {
            display: ''
        }
    },
    exportSelectAll: {
        checked: false,
        indeterminate: false,
    }
  },
  state: {},
}));

const { loadProfilesUI } = require('../js/ui.js');
const { dom } = require('../js/state.js');

// Mock document.createElement
global.document = {
    createElement: (tag) => {
        const element = {
            appendChild: jest.fn(),
        };
        if (tag === 'option') {
            element.value = '';
            element.textContent = '';
        }
        return element;
    }
};

describe('UI Tests', () => {
  const mockProfileNames = ['Alpha Profile', 'Beta Test', 'Gamma-Ray', 'Delta'];

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset DOM state
    dom.profilesSelect.innerHTML = '';
    dom.profilesSelect.value = '';
    dom.profilesSelect.appendChild.mockClear();
    dom.exportProfilesListDiv.innerHTML = '';
    dom.exportProfilesListDiv.appendChild.mockClear();


    // Mock chrome.storage.sync.get
    chrome.storage.sync.get.mockImplementation((keys, callback) => {
      if (keys.includes('profile_list')) {
        callback({ 'profile_list': mockProfileNames });
      } else {
        callback({});
      }
    });
  });

  test('loadProfilesUI should render all profiles without filter', (done) => {
    loadProfilesUI();

    setTimeout(() => {
      expect(dom.profilesSelect.appendChild).toHaveBeenCalledTimes(mockProfileNames.length);
      expect(dom.profilesSelect.innerHTML).toBe('<option value="" disabled selected>選擇一個設定檔</option>');
      done();
    }, 0);
  });

  test('loadProfilesUI should filter profiles based on filterText', (done) => {
    loadProfilesUI('beta');

    setTimeout(() => {
      expect(dom.profilesSelect.appendChild).toHaveBeenCalledTimes(1);
      const option = dom.profilesSelect.appendChild.mock.calls[0][0];
      expect(option.value).toBe('Beta Test');
      expect(option.textContent).toBe('Beta Test');
      done();
    }, 0);
  });

  test('loadProfilesUI should be case-insensitive', (done) => {
    loadProfilesUI('pRoFiLe');

    setTimeout(() => {
      expect(dom.profilesSelect.appendChild).toHaveBeenCalledTimes(1);
      const option = dom.profilesSelect.appendChild.mock.calls[0][0];
      expect(option.value).toBe('Alpha Profile');
      expect(option.textContent).toBe('Alpha Profile');
      done();
    }, 0);
  });

  test('loadProfilesUI should maintain selection if item is still in list', (done) => {
    dom.profilesSelect.value = 'Beta Test';
    loadProfilesUI('test');

    setTimeout(() => {
      expect(dom.profilesSelect.appendChild).toHaveBeenCalledTimes(1);
      expect(dom.profilesSelect.value).toBe('Beta Test');
      done();
    }, 0);
  });

  test('loadProfilesUI should not maintain selection if item is not in list', (done) => {
    dom.profilesSelect.value = 'Alpha Profile';
    loadProfilesUI('beta');

    setTimeout(() => {
      expect(dom.profilesSelect.appendChild).toHaveBeenCalledTimes(1);
      // The value should be reset because the previously selected item is not in the filtered list.
      expect(dom.profilesSelect.value).not.toBe('Alpha Profile');
      done();
    }, 0);
  });
});

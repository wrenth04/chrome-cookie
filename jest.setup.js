// jest.setup.js

// Mock the chrome API
global.chrome = {
  storage: {
    sync: {
      get: jest.fn((keys, callback) => {
        const result = {};
        if (Array.isArray(keys)) {
          keys.forEach(key => result[key] = {});
        } else if (typeof keys === 'string') {
          result[keys] = {};
        } else if (keys === null || keys === undefined) {
          // Mock getting all items
          result.profile_list = [];
        }
        callback(result);
      }),
      set: jest.fn((items, callback) => {
        if (callback) {
          callback();
        }
      }),
      remove: jest.fn((keys, callback) => {
        if (callback) {
          callback();
        }
      }),
    },
  },
  tabs: {
    query: jest.fn((options, callback) => {
      callback([{ url: 'https://example.com', cookieStoreId: '1' }]);
    }),
  },
  cookies: {
    getAll: jest.fn((details, callback) => {
      if (callback) callback([]);
      return Promise.resolve([]);
    }),
    set: jest.fn((details, callback) => {
      if (callback) callback();
      return Promise.resolve({});
    }),
    remove: jest.fn((details, callback) => {
      if (callback) callback();
      return Promise.resolve({});
    }),
  },
  i18n: {
    getMessage: jest.fn(key => key),
  },
};

// Keep jsdom's URL but mock createObjectURL and revokeObjectURL
const JSDOM_URL = global.URL;
global.URL = JSDOM_URL;
global.URL.createObjectURL = jest.fn(blob => `blob:http://localhost/${Math.random().toString(36).substring(7)}`);
global.URL.revokeObjectURL = jest.fn();


global.Blob = jest.fn(function (content, options) {
  return { content, options };
});

// Mock navigator.clipboard
Object.defineProperty(global.navigator, 'clipboard', {
  value: {
    writeText: jest.fn(() => Promise.resolve()),
  },
  writable: true,
});

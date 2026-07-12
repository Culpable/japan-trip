const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  if (start === -1) return '';
  const openingBrace = html.indexOf('{', start);
  let depth = 0;
  for (let index = openingBrace; index < html.length; index += 1) {
    if (html[index] === '{') depth += 1;
    if (html[index] === '}') depth -= 1;
    if (depth === 0) return html.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function createHarness(storage) {
  const listeners = {};
  const toastMessages = [];
  let reloads = 0;
  let appInitialisations = 0;
  const bodyClasses = new Set(['is-locked']);
  const elements = {
    '#authForm': { addEventListener: (type, listener) => { listeners[type] = listener; } },
    '#authPassword': { value: '', focus() {}, select() {} },
    '#authError': { textContent: '' },
    '#authGate': { setAttribute() {} },
    '#bookingsShortcut': {},
    '#openHotels': {},
    '#lockSite': {}
  };
  const context = {
    URLSearchParams,
    AUTH_KEY: 'jalena-trip-auth-until',
    AUTH_HASH: 'valid-hash',
    FORTY_FIVE_DAYS: 45 * 24 * 60 * 60 * 1000,
    Date,
    localStorage: storage,
    hashText: async () => 'valid-hash',
    initialiseApp: () => { appInitialisations += 1; },
    openDayView() {},
    showToast: (message) => { toastMessages.push(message); },
    document: {
      hidden: false,
      body: {
        classList: {
          add: (name) => bodyClasses.add(name),
          remove: (name) => bodyClasses.delete(name),
          contains: (name) => bodyClasses.has(name)
        }
      },
      addEventListener: (type, listener) => { listeners[type] = listener; },
      querySelector: (selector) => elements[selector] || { close() {}, showModal() {}, scrollIntoView() {} },
      querySelectorAll: () => []
    },
    window: {
      location: { search: '', reload: () => { reloads += 1; } },
      clearTimeout() {},
      setTimeout: () => 1
    }
  };
  vm.createContext(context);
  const functionNames = [
    'syncInstallControl',
    'readAuthExpiry',
    'persistAuthExpiry',
    'clearAuthExpiry',
    'scheduleAuthExpiry',
    'showAuthGate',
    'enforceAuthExpiry',
    'unlockSite',
    'initialiseAuth',
    'initialiseDialogs'
  ];
  vm.runInContext(`let installPrompt; let authExpiryTimer; let transientAuthExpiry = 0; let authStorageUnavailable = false;\n${functionNames.map(extractFunction).join('\n')}`, context);
  return {
    context,
    elements,
    listeners,
    toastMessages,
    get reloads() { return reloads; },
    get appInitialisations() { return appInitialisations; },
    unlockForTest: () => bodyClasses.delete('is-locked'),
    isLocked: () => bodyClasses.has('is-locked')
  };
}

async function verifyStorageFallback() {
  const storedValues = new Map();
  const availableStorage = createHarness({
    getItem: (key) => storedValues.get(key) || null,
    setItem: (key, value) => storedValues.set(key, value),
    removeItem: (key) => storedValues.delete(key)
  });
  vm.runInContext('initialiseAuth()', availableStorage.context);
  availableStorage.elements['#authPassword'].value = 'dericious2000';
  await availableStorage.listeners.submit({ preventDefault() {} });
  assert.ok(Number(storedValues.get('jalena-trip-auth-until')) > Date.now(), 'available storage should retain the 45-day grant');
  assert.equal(availableStorage.toastMessages.length, 0, 'persistent access should not show a fallback warning');

  const blockedRead = createHarness({
    getItem() { throw new DOMException('Blocked', 'SecurityError'); },
    setItem() { throw new DOMException('Blocked', 'SecurityError'); },
    removeItem() { throw new DOMException('Blocked', 'SecurityError'); }
  });
  assert.doesNotThrow(() => vm.runInContext('initialiseAuth()', blockedRead.context));
  assert.equal(typeof blockedRead.listeners.submit, 'function', 'the password form should remain usable');
  blockedRead.elements['#authPassword'].value = 'dericious2000';
  await blockedRead.listeners.submit({ preventDefault() {} });
  assert.equal(blockedRead.isLocked(), false, 'a blocked storage read should not prevent tab-only access');
  assert.match(blockedRead.toastMessages.join(' '), /this tab/i);

  const blockedWrite = createHarness({
    getItem: () => null,
    setItem() { throw new DOMException('Full', 'QuotaExceededError'); },
    removeItem() {}
  });
  vm.runInContext('initialiseAuth()', blockedWrite.context);
  blockedWrite.elements['#authPassword'].value = 'dericious2000';
  await blockedWrite.listeners.submit({ preventDefault() {} });
  assert.equal(blockedWrite.isLocked(), false, 'a valid password should unlock the current tab');
  assert.equal(blockedWrite.appInitialisations, 1);
  assert.match(blockedWrite.toastMessages.join(' '), /this tab/i, 'the user should be warned that access is tab-only');

  const blockedRemoval = createHarness({
    getItem: () => null,
    setItem() {},
    removeItem() { throw new DOMException('Blocked', 'SecurityError'); }
  });
  vm.runInContext('initialiseDialogs()', blockedRemoval.context);
  blockedRemoval.unlockForTest();
  assert.doesNotThrow(() => blockedRemoval.elements['#lockSite'].onclick());
  assert.equal(blockedRemoval.isLocked(), true, 'manual lock should restore the gate when storage removal fails');
  assert.match(blockedRemoval.elements['#authError'].textContent, /could not be cleared/i);
  assert.equal(blockedRemoval.reloads, 0, 'manual lock should not reload into a persisted grant that could not be removed');
}

verifyStorageFallback()
  .then(() => console.log('authentication storage fallback test passed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist in index.html`);
  const openingBrace = html.indexOf('{', start);
  let depth = 0;
  for (let index = openingBrace; index < html.length; index += 1) {
    if (html[index] === '{') depth += 1;
    if (html[index] === '}') depth -= 1;
    if (depth === 0) return html.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

// Locking from the "Lock this device" button inside the open booking wallet must first dismiss the
// modal dialog. A dialog opened with showModal() makes the rest of the page inert, so if it stayed
// open the auth gate's password field would be unfocusable behind a stuck backdrop.
let closedCount = 0;
const openDialog = { close() { closedCount += 1; } };
const bodyClasses = new Set();
const authGate = { setAttribute() {} };
const authPassword = { value: 'still-here', focus() {}, select() {} };
const authError = { textContent: '' };

const context = {
  installPrompt: undefined,
  authExpiryTimer: 0,
  window: { clearTimeout() {} },
  document: {
    body: { classList: { add: (name) => bodyClasses.add(name), contains: (name) => bodyClasses.has(name) } },
    querySelectorAll: (selector) => (selector === 'dialog[open]' ? [openDialog] : []),
    querySelector: (selector) => ({
      '#installApp': {},
      '#authGate': authGate,
      '#authPassword': authPassword,
      '#authError': authError,
    }[selector] || {}),
  },
};
vm.createContext(context);
vm.runInContext(`${extractFunction('syncInstallControl')}\n${extractFunction('showAuthGate')}`, context);
vm.runInContext("showAuthGate('locked')", context);

assert.equal(closedCount, 1, 'showAuthGate must close the open modal dialog before showing the gate');
assert.equal(bodyClasses.has('is-locked'), true, 'showAuthGate must relock the body');
assert.equal(authPassword.value, '', 'the password field must be cleared when the gate reappears');
assert.equal(authError.textContent, 'locked', 'the gate should surface the passed message');

console.log('lock closes open dialogs test passed');

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

// Native <dialog>.showModal() dims the page but leaves it scrollable, so a wheel/touch gesture on
// the backdrop scrolls the itinerary instead of the modal. lockBodyForDialog must pin the body to
// its current scroll position while a dialog is open, and releaseBodyForDialog must restore it.
function makeContext({ scrollY, innerWidth, clientWidth }) {
  const context = {
    lockedScrollY: 0,
    scrolledTo: null,
    window: {
      scrollY,
      innerWidth,
      scrollTo(x, y) { context.scrolledTo = [x, y]; },
    },
    document: {
      documentElement: { clientWidth },
      body: {
        classList: {
          store: new Set(),
          add(name) { this.store.add(name); },
          remove(name) { this.store.delete(name); },
          contains(name) { return this.store.has(name); },
        },
        style: {},
      },
    },
  };
  vm.createContext(context);
  vm.runInContext([
    extractFunction('lockBodyForDialog'),
    extractFunction('releaseBodyForDialog'),
    extractFunction('showModalDialog'),
  ].join('\n'), context);
  return context;
}

// Desktop: a 15px scrollbar disappears when the body is pinned, so its width is reserved as padding
// to stop the dimmed background jumping sideways.
const desktop = makeContext({ scrollY: 320, innerWidth: 1024, clientWidth: 1009 });
vm.runInContext('lockBodyForDialog()', desktop);
assert.equal(desktop.document.body.classList.contains('dialog-locked'), true, 'lock must add the dialog-locked class');
assert.equal(desktop.document.body.style.top, '-320px', 'lock must pin the body at the negated scroll position');
assert.equal(desktop.document.body.style.paddingRight, '15px', 'lock must reserve the vanished scrollbar width');
assert.equal(desktop.lockedScrollY, 320, 'lock must remember the scroll position to restore later');

// Re-entry is a no-op so a second open (or a stray call) cannot clobber the remembered position.
desktop.window.scrollY = 999;
vm.runInContext('lockBodyForDialog()', desktop);
assert.equal(desktop.lockedScrollY, 320, 'lock must ignore re-entry while already locked');

vm.runInContext('releaseBodyForDialog()', desktop);
assert.equal(desktop.document.body.classList.contains('dialog-locked'), false, 'release must drop the dialog-locked class');
assert.equal(desktop.document.body.style.top, '', 'release must clear the pinned top offset');
assert.equal(desktop.document.body.style.paddingRight, '', 'release must clear the reserved scrollbar padding');
assert.deepEqual(desktop.scrolledTo, [0, 320], 'release must restore the pre-modal scroll position');

// Mobile / installed PWA: no visible scrollbar, so no padding compensation should be added.
const mobile = makeContext({ scrollY: 140, innerWidth: 393, clientWidth: 393 });
vm.runInContext('lockBodyForDialog()', mobile);
assert.equal(mobile.document.body.style.top, '-140px', 'lock must pin the body on mobile too');
assert.equal(mobile.document.body.style.paddingRight, undefined, 'lock must not add padding when there is no scrollbar');

// showModalDialog must open the dialog AND lock the background in one step, so every call site is safe.
let showModalCalls = 0;
mobile.openedDialog = { showModal() { showModalCalls += 1; } };
vm.runInContext('showModalDialog(openedDialog)', mobile);
assert.equal(showModalCalls, 1, 'showModalDialog must open the dialog via showModal()');
assert.equal(mobile.document.body.classList.contains('dialog-locked'), true, 'showModalDialog must lock the background');

// Static wiring: the CSS lock, both modal open paths, and the release-on-close hook must exist.
assert.match(html, /body\.dialog-locked\s*\{[^}]*position:\s*fixed/, 'CSS: dialog-locked must pin the body with position: fixed');
assert.match(html, /body\.dialog-locked\s*\{[^}]*overflow:\s*hidden/, 'CSS: dialog-locked must hide body overflow');
assert.match(html, /\.dialog-body\s*\{[^}]*overscroll-behavior:\s*contain/, 'CSS: dialog body must contain overscroll chaining');
assert.match(html, /showModalDialog\(document\.querySelector\('#dayDialog'\)\)/, 'day view must open through showModalDialog');
assert.match(html, /showModalDialog\(dialog\)/, 'booking wallet must open through showModalDialog');
assert.match(html, /addEventListener\('close',\s*releaseBodyForDialog\)/, 'every dialog must release the lock on close');

console.log('dialog scroll lock test passed');

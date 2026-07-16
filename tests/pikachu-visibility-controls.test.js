const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function extractFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist`);
  const openingBrace = html.indexOf('{', start);
  let depth = 0;
  for (let index = openingBrace; index < html.length; index += 1) {
    if (html[index] === '{') depth += 1;
    if (html[index] === '}') depth -= 1;
    if (depth === 0) return html.slice(start, index + 1);
  }
  throw new Error(`Could not extract ${name}`);
}

function classList() {
  const classes = new Set();
  return {
    add: (...names) => names.forEach((name) => classes.add(name)),
    remove: (...names) => names.forEach((name) => classes.delete(name)),
    toggle(name, force) {
      if (force === undefined) force = !classes.has(name);
      if (force) classes.add(name); else classes.delete(name);
    },
    contains: (name) => classes.has(name),
  };
}

assert.match(html, /id="pikachuCompanion"/, 'Pikachu must remain in the page');
assert.match(html, /id="pikachuCompanion"[^>]*popover="manual"/, 'Pikachu should use the top layer so dialogs hide only his speech bubble');
assert.match(html, /id="pikachuToggle"/, 'a manual Pikachu visibility control should exist');
assert.match(html, /const PIKACHU_VISIBILITY_KEY = 'jalena-trip-pikachu-visible-v1'/, 'the manual choice should use a dedicated persisted key');
assert.match(html, /function setPikachuVisibility\(visible, persist = true\)/, 'manual visibility should have one state setter');
assert.match(html, /companion\.hidden = !visible/, 'the state setter should hide and show Pikachu');
assert.match(html, /localStorage\.setItem\(PIKACHU_VISIBILITY_KEY, visible \? '1' : '0'\)/, 'the visibility choice should persist');
assert.match(html, /Show Pikachu/, 'the control should clearly offer to restore Pikachu');
assert.match(html, /Hide Pikachu/, 'the control should clearly offer to hide Pikachu');

assert.match(html, /function setCompanionSpeechMuted\(muted\)/, 'speech suppression should have a single state setter');
assert.match(html, /function raiseCompanionAboveDialog\(\)/, 'dialogs should keep Pikachu above their backdrop');
assert.match(html, /body\.companion-speech-muted \.pikachu-speech\s*\{[^}]*opacity:\s*0\s*!important/, 'muted speech should be visually hidden');
assert.match(html, /dialog\[open\]/, 'open dialogs should suppress the speech bubble');
assert.match(html, /input, textarea, select/, 'active text controls should suppress the speech bubble');
assert.match(html, /closest\('button, a, input, textarea, select, \[role="button"\]'\)/, 'control interaction should temporarily suppress the speech bubble');
assert.match(html, /companionSpeechMutedUntil = Date\.now\(\) \+ 1200/, 'pointer suppression should survive the control focus event');
assert.match(html, /function revealCompanionSpeech\(\)[\s\S]*companion-speech-muted/, 'Pikachu should not reveal speech while suppression is active');

function verifyVisibilityToggleSuppressesSpeech() {
  const documentListeners = {};
  const toggleListeners = {};
  let popoverOpen = false;
  const companion = {
    hidden: false,
    classList: classList(),
    matches: (selector) => selector === ':popover-open' && popoverOpen,
    showPopover: () => { popoverOpen = true; },
    hidePopover: () => { popoverOpen = false; },
  };
  const toggle = {
    id: 'pikachuToggle',
    textContent: '',
    addEventListener: (type, listener) => { toggleListeners[type] = listener; },
    setAttribute() {},
  };
  const body = { classList: classList() };
  const context = vm.createContext({
    Date,
    PIKACHU_VISIBILITY_KEY: 'jalena-trip-pikachu-visible-v1',
    localStorage: {
      getItem: () => '0',
      setItem() {},
    },
    document: {
      activeElement: null,
      body,
      addEventListener: (type, listener) => { documentListeners[type] = listener; },
      querySelector: (selector) => ({
        '#pikachuCompanion': companion,
        '#pikachuToggle': toggle,
        'dialog[open]': null,
      }[selector]),
    },
    window: {
      clearTimeout() {},
      setTimeout: () => 1,
    },
  });

  vm.runInContext([
    extractFunction('readPikachuVisibility'),
    extractFunction('showCompanionPopover'),
    extractFunction('setPikachuVisibility'),
    extractFunction('setCompanionSpeechMuted'),
    'let companionSpeechMutedUntil = 0;',
    extractFunction('syncCompanionSpeechState'),
    extractFunction('initialiseCompanionControls'),
    'initialiseCompanionControls();',
  ].join('\n'), context);

  assert.equal(companion.hidden, true, 'the stored hidden state should start Pikachu hidden');
  documentListeners.pointerdown({ target: { closest: () => toggle } });
  toggleListeners.click();

  assert.equal(companion.hidden, false, 'the visibility toggle should restore Pikachu');
  assert.equal(
    body.classList.contains('companion-speech-muted'),
    true,
    'showing Pikachu with the visibility control should temporarily suppress his desktop speech bubble'
  );
}

verifyVisibilityToggleSuppressesSpeech();

console.log('Pikachu visibility controls test passed');

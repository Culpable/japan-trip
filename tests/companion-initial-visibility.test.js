const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync(new URL('../index.html', `file://${__filename}`), 'utf8');

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `${name} should exist in index.html`);
  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(start, index + 1);
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
      return force;
    },
    contains: (name) => classes.has(name),
  };
}

const companion = {
  classList: classList(),
  dataset: {},
  addEventListener() {},
  get offsetWidth() { return 104; },
};
const speech = { textContent: '' };
const observers = [];

class IntersectionObserver {
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.targets = [];
    observers.push(this);
  }
  observe(target) { this.targets.push(target); }
}

const context = vm.createContext({
  Date,
  IntersectionObserver,
  document: {
    querySelector(selector) {
      return {
        '#pikachuCompanion': companion,
        '#pikachuSpeech': speech,
      }[selector];
    },
  },
  regions: [],
  revealCompanionSpeech() {},
});

vm.runInContext(extractFunction('initialiseCompanion'), context);
vm.runInContext('initialiseCompanion()', context);

assert.equal(
  companion.classList.contains('is-docked-away'),
  false,
  'the bottom-right Pikachu should remain visible when the itinerary first opens'
);
assert.equal(observers.length, 1, 'only the region observer should control companion context');

console.log('companion initial visibility test passed');

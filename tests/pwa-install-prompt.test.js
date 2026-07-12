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

async function verifyPromptCapturedBeforeUnlock() {
  const listeners = {};
  const installButton = { hidden: true };
  const bodyClasses = new Set(['is-locked']);
  let promptCalls = 0;
  let prevented = false;

  const context = {
    location: { protocol: 'file:' },
    navigator: { onLine: true },
    document: {
      body: { classList: { contains: (name) => bodyClasses.has(name), toggle() {} } },
      querySelector: () => installButton
    },
    window: {
      addEventListener: (type, listener) => { listeners[type] = listener; }
    }
  };
  vm.createContext(context);

  const captureFunction = extractFunction('captureInstallPrompt');
  const syncFunction = extractFunction('syncInstallControl');
  const listenerRegistration = "window.addEventListener('beforeinstallprompt', captureInstallPrompt);";
  assert.ok(captureFunction, 'the install prompt must have a capture function available before unlock');
  assert.ok(syncFunction, 'the install control must synchronise saved prompt state after unlock');
  assert.ok(
    html.indexOf(listenerRegistration) < html.lastIndexOf('initialiseAuth();'),
    'the browser listener must be registered before authentication can hold the page at the gate'
  );
  assert.doesNotMatch(
    extractFunction('initialiseOffline'),
    /addEventListener\('beforeinstallprompt'/,
    'offline initialisation must not defer the one-shot browser listener until after unlock'
  );

  vm.runInContext(
    `let installPrompt;\n${syncFunction}\n${captureFunction}\nwindow.addEventListener('beforeinstallprompt', captureInstallPrompt);\n${extractFunction('initialiseOffline')}`,
    context
  );

  listeners.beforeinstallprompt({
    preventDefault: () => { prevented = true; },
    prompt: () => { promptCalls += 1; },
    userChoice: Promise.resolve({ outcome: 'accepted' })
  });
  assert.equal(prevented, true, 'the early install prompt should be retained');
  assert.equal(installButton.hidden, true, 'the install control should stay hidden behind the password gate');

  bodyClasses.delete('is-locked');
  vm.runInContext('initialiseOffline()', context);
  assert.equal(installButton.hidden, false, 'the retained prompt should become available immediately after unlock');

  await installButton.onclick();
  assert.equal(promptCalls, 1, 'the retained prompt should remain usable');
  assert.equal(installButton.hidden, true, 'the install control should hide after the prompt is consumed');
}

verifyPromptCapturedBeforeUnlock()
  .then(() => console.log('PWA install prompt capture test passed'))
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });

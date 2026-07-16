const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(
  html,
  /id="pikachuPageDock"/,
  'compact layouts should provide an in-flow page dock so Pikachu cannot cover page content'
);
const controlsDockStart = html.indexOf('<div class="controls-dock">');
const mainStart = html.indexOf('<main>');
const controlsDockMarkup = html.slice(controlsDockStart, mainStart);
assert.match(
  controlsDockMarkup,
  /id="pikachuPageDock"/,
  'the compact page dock should live inside the sticky controls layout instead of scrolling behind it'
);
assert.match(
  html,
  /@media \(max-width: 900px\), \(max-height: 620px\)[\s\S]*?\.controls-dock\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto/s,
  'compact controls should reserve a separate grid column for Pikachu'
);
assert.equal(
  (html.match(/class="dialog-companion-dock" data-companion-dock/g) || []).length,
  2,
  'both modal dialogs should provide reserved companion space'
);
assert.match(
  html,
  /\.trip-dialog\[open\]\s*\{[^}]*display:\s*grid[^}]*grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto/s,
  'open dialogs should use intrinsic grid rows for the header, scroll body, and companion dock'
);
assert.match(
  html,
  /\.dialog-body\s*\{[^}]*min-height:\s*0[^}]*overflow:\s*auto/s,
  'the dialog body should shrink inside the modal before it scrolls'
);
assert.doesNotMatch(
  html,
  /\.dialog-body\s*\{[^}]*max-height:\s*calc\(100dvh - 86px\)/s,
  'mobile dialog height must not assume a fixed header height'
);
assert.match(
  html,
  /\.pikachu-companion\.is-inline\s*\{[^}]*position:\s*static[^}]*overflow:\s*visible/s,
  'the compact companion should participate in layout without inheriting a popover scrollbar'
);
assert.match(
  html,
  /function syncCompanionPlacement\(/,
  'one placement function should coordinate page and modal companion docks'
);
assert.match(
  html,
  /function showModalDialog\(dialog\)[\s\S]*syncCompanionPlacement\(dialog\)/,
  'opening a dialog should move Pikachu into its reserved space'
);
assert.match(
  html,
  /dialog\.addEventListener\('close',[\s\S]*syncCompanionPlacement\(\)/,
  'closing a dialog should restore Pikachu to the compact page dock or desktop position'
);
assert.match(
  html,
  /\.auth-gate\s*\{[^}]*display:\s*flex[^}]*align-items:\s*flex-start[^}]*justify-content:\s*center/s,
  'the auth gate should safely centre short cards while keeping tall cards scrollable from the top'
);
assert.match(
  html,
  /\.auth-card\s*\{[^}]*margin-block:\s*auto/s,
  'automatic block margins should centre the auth card only when the viewport has room'
);

console.log('Mobile layout safety test passed');

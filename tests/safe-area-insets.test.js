const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// The installed PWA draws under the status bar, notch and home indicator, so the viewport must
// opt into that area and every persistently fixed control must pad itself back off the unsafe edges.
assert.match(
  html,
  /<meta name="viewport"[^>]*viewport-fit=cover/,
  'the viewport must use viewport-fit=cover so safe-area insets resolve in the installed app'
);

function ruleBody(selector) {
  // Grab the first declaration block for a top-level selector (selectors here are simple enough
  // that a non-greedy match to the closing brace is unambiguous).
  const match = html.match(new RegExp(`${selector.replace(/[.#]/g, '\\$&')}\\s*\\{([^}]*)\\}`));
  assert.ok(match, `${selector} should have a rule in index.html`);
  return match[1];
}

// The reported paper cut: the bottom-right Pikachu had a fixed clamp margin with no safe-area
// component, so it sat flush in the corner of an installed phone app.
const companion = ruleBody('.pikachu-companion');
assert.match(companion, /right:\s*calc\([^;]*env\(safe-area-inset-right/, 'companion needs a right safe-area inset');
assert.match(companion, /bottom:\s*calc\([^;]*env\(safe-area-inset-bottom/, 'companion needs a bottom safe-area inset');

// The other always-on fixed elements must clear the same unsafe edges.
assert.match(ruleBody('.offline-badge'), /env\(safe-area-inset-bottom/, 'offline badge must clear the home indicator');
assert.match(ruleBody('.delight-toast'), /bottom:\s*calc\([^;]*env\(safe-area-inset-bottom/, 'toast must clear the home indicator');
assert.match(ruleBody('.delight-toast'), /max-width:/, 'toast must cap its width so long messages do not span the screen');

console.log('safe-area inset test passed');

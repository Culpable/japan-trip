const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const serviceWorker = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const iconFiles = [
  'assets/favicon.ico',
  'assets/favicon-32.png',
  'assets/favicon-64.png',
  'assets/apple-touch-icon.png',
];

for (const icon of iconFiles) {
  assert.ok(fs.existsSync(path.join(root, icon)), `${icon} should exist`);
  assert.match(html, new RegExp(icon.replace('.', '\\.')), `${icon} should be linked from the document head`);
  assert.match(serviceWorker, new RegExp(icon.replace('.', '\\.')), `${icon} should be available offline`);
}

assert.match(html, /theme-color[^>]+prefers-color-scheme: light/, 'light phone chrome should have a theme colour');
assert.match(html, /theme-color[^>]+prefers-color-scheme: dark/, 'dark phone chrome should have a theme colour');

console.log('favicon metadata test passed');

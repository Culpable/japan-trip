const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const iconPath = path.join(__dirname, '..', 'assets', 'apple-touch-icon.png');

// Measure inside the central safe zone (24px inset each side), then make the
// yellow field transparent. The icon is now full-bleed with no baked frame, so
// the OS mask supplies the corners; the remaining bounds represent Pikachu's
// visible non-background footprint and must stay boldly centred.
const INNER_SIZE = 132;
const MIN_FOOTPRINT_RATIO = 0.48;
const geometry = execFileSync(
  'magick',
  [
    iconPath,
    '-crop', `${INNER_SIZE}x${INNER_SIZE}+24+24`,
    '-fuzz', '15%',
    '-transparent', '#ffdb43',
    '-trim',
    '-format', '%w %h',
    'info:',
  ],
  { encoding: 'utf8' },
).trim();

const [width, height] = geometry.split(/\s+/).map(Number);
const widthRatio = width / INNER_SIZE;
const heightRatio = height / INNER_SIZE;

assert.ok(
  widthRatio >= MIN_FOOTPRINT_RATIO && heightRatio >= MIN_FOOTPRINT_RATIO,
  `Pikachu should occupy at least ${Math.round(MIN_FOOTPRINT_RATIO * 100)}% of the inner icon in both dimensions; `
    + `current footprint is ${width}x${height}px (${(widthRatio * 100).toFixed(1)}% wide, `
    + `${(heightRatio * 100).toFixed(1)}% tall)`,
);

console.log('favicon character footprint test passed');

const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(scriptMatch, 'Expected inline application script');

const source = scriptMatch[1];

function extractFunction(name) {
  const start = source.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `Expected function ${name}`);

  const bodyStart = source.indexOf('{', start);
  let depth = 0;
  let quote = null;
  let escaped = false;
  let templateExpressionDepth = 0;

  for (let index = bodyStart; index < source.length; index += 1) {
    const character = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (quote) {
      if (quote === '`' && character === '$' && source[index + 1] === '{') {
        templateExpressionDepth += 1;
        depth += 1;
        index += 1;
        continue;
      }

      if (character === quote && templateExpressionDepth === 0) {
        quote = null;
      } else if (quote === '`' && character === '}' && templateExpressionDepth > 0) {
        templateExpressionDepth -= 1;
        depth -= 1;
      }
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }

    if (character === '{') depth += 1;
    if (character === '}') {
      depth -= 1;
      if (depth === 0) return source.slice(start, index + 1);
    }
  }

  throw new Error(`Could not extract function ${name}`);
}

function extractDeclaration(name) {
  const start = source.indexOf(`const ${name} =`);
  assert.notEqual(start, -1, `Expected declaration ${name}`);

  let squareDepth = 0;
  let braceDepth = 0;
  let parenDepth = 0;
  let quote = null;
  let escaped = false;

  for (let index = start; index < source.length; index += 1) {
    const character = source[index];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (character === '\\') {
      escaped = true;
      continue;
    }

    if (quote) {
      if (character === quote) quote = null;
      continue;
    }

    if (character === '"' || character === "'" || character === '`') {
      quote = character;
      continue;
    }

    if (character === '[') squareDepth += 1;
    if (character === ']') squareDepth -= 1;
    if (character === '{') braceDepth += 1;
    if (character === '}') braceDepth -= 1;
    if (character === '(') parenDepth += 1;
    if (character === ')') parenDepth -= 1;

    if (
      character === ';'
      && squareDepth === 0
      && braceDepth === 0
      && parenDepth === 0
    ) {
      return source.slice(start, index + 1);
    }
  }

  throw new Error(`Could not extract declaration ${name}`);
}

function createRendererContext() {
  const context = {
    actionIcons: {
      external: '<svg data-icon="external"></svg>',
      maps: '<svg data-icon="map"></svg>',
      reservation: '<svg data-icon="reservation"></svg>',
    },
    mapsUrl: (query) => `https://maps.example.test/?q=${encodeURIComponent(query)}`,
  };

  vm.createContext(context);
  vm.runInContext(
    [
      extractDeclaration('tripData'),
      extractFunction('activityTimeline'),
      extractFunction('activityDurationLabel'),
      extractFunction('renderRunSheet'),
      'this.tripData = tripData;',
      'this.renderRunSheet = renderRunSheet;',
    ].join('\n'),
    context,
  );

  return context;
}

function clockFor(isoDate, timeMinutes, currentDay) {
  const hours = String(Math.floor(timeMinutes / 60)).padStart(2, '0');
  const minutes = String(timeMinutes % 60).padStart(2, '0');
  return {
    isoDate,
    currentDate: isoDate,
    timeMinutes,
    now: new Date(`${isoDate}T${hours}:${minutes}:00+09:00`),
    currentDay,
    inTrip: true,
    beforeTrip: false,
    afterTrip: false,
  };
}

function rowFor(markup, title) {
  const rows = markup.match(/<article class="run-sheet-item"[\s\S]*?<\/article>/g) || [];
  const row = rows.find((candidate) => candidate.includes(title));
  assert.ok(row, `Expected run-sheet row for ${title}`);
  return row;
}

test('updateTripState repaints an already-open Day dialog without reopening or relocking it', () => {
  const updateTripStateSource = extractFunction('updateTripState');

  assert.match(
    updateTripStateSource,
    /\brefreshOpenDayDialog\(clock\)/,
    'updateTripState must refresh the open Day dialog with the newly computed trip clock',
  );

  const refreshSource = extractFunction('refreshOpenDayDialog');
  assert.match(refreshSource, /\.open\b/, 'Refresh must be gated by the existing dialog open state');
  assert.match(
    refreshSource,
    /dataset\.(?:day|dayNumber)|getAttribute\(['"]data-day/,
    'Refresh must repaint the day already displayed by the dialog',
  );
  assert.doesNotMatch(
    refreshSource,
    /\b(?:showModalDialog|showModal|lockBodyForDialog|releaseBodyForDialog)\b/,
    'In-place refresh must not reopen the dialog or disturb its existing body scroll lock',
  );
});

test('Dior booked stop exposes Reservation as its sole primary action and Map as secondary', () => {
  const context = createRendererContext();
  const daySix = context.tripData.find((day) => day.day === 6);
  const markup = context.renderRunSheet(daySix, clockFor('2026-08-06', 9 * 60, 6));
  const diorRow = rowFor(markup, 'Dior Café');
  const primaryActions = diorRow.match(/class="mini-action[^"]*\bprimary\b[^"]*"/g) || [];

  assert.equal(
    primaryActions.length,
    1,
    'A booked stop with a reservation URL must have exactly one primary run-sheet action',
  );
  assert.match(
    diorRow,
    /<a class="mini-action[^"]*\bprimary\b[^"]*"[^>]*>[\s\S]*?<span>Reservation<\/span>/,
    'Reservation must be the primary Dior action',
  );

  const mapAction = diorRow.match(
    /<a class="([^"]*\bmini-action\b[^"]*)"[^>]*>(?:(?!<\/a>)[\s\S])*?<span>Open map<\/span>/,
  );
  assert.ok(mapAction, 'Expected Dior map action');
  assert.doesNotMatch(mapAction[1], /\bprimary\b/, 'Dior map action must remain secondary');
});

test('run-sheet rows explicitly expand current and next states and compact complete and upcoming states', () => {
  const context = createRendererContext();
  const daySix = context.tripData.find((day) => day.day === 6);

  const currentMarkup = context.renderRunSheet(
    daySix,
    clockFor('2026-08-06', 10 * 60 + 45, 6),
  );
  const progressedMarkup = context.renderRunSheet(
    daySix,
    clockFor('2026-08-06', 12 * 60, 6),
  );
  const futureMarkup = context.renderRunSheet(
    daySix,
    clockFor('2026-08-05', 12 * 60, 5),
  );

  assert.match(
    rowFor(currentMarkup, 'Dior Café'),
    /data-expanded="true"/,
    'Current rows must declare their expanded treatment',
  );
  assert.match(
    rowFor(progressedMarkup, 'teamLab Planets'),
    /data-expanded="true"/,
    'Next rows must declare their expanded treatment',
  );
  assert.match(
    rowFor(progressedMarkup, 'Dior Café'),
    /data-expanded="false"/,
    'Complete rows must declare their compact treatment',
  );
  assert.match(
    rowFor(futureMarkup, 'Dior Café'),
    /data-expanded="false"/,
    'Upcoming rows must declare their compact treatment',
  );
});

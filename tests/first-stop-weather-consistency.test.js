const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const source = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

const weatherFunctionStart = source.indexOf('async function fetchFirstStopWeather()');
const weatherFunctionEnd = source.indexOf('// One-time wiring for the countdown extras', weatherFunctionStart);
const weatherFunction = source.slice(weatherFunctionStart, weatherFunctionEnd);
const liveWeatherUrlMatch = weatherFunction.match(/fetch\('(https:\/\/[^']+)'/);
const linkedForecastUrlMatch = source.match(
  /'Hong Kong':\s*'(https:\/\/[^']+)'/
);

function weatherProvider(hostname) {
  if (hostname.endsWith('hko.gov.hk') || hostname.endsWith('weather.gov.hk')) return 'Hong Kong Observatory';
  if (hostname.endsWith('open-meteo.com')) return 'Open-Meteo';
  if (hostname.endsWith('accuweather.com')) return 'AccuWeather';
  return hostname;
}

test('the Hong Kong reading and linked details use the same provider and station', () => {
  assert.ok(liveWeatherUrlMatch, 'the live Hong Kong weather request should be present');
  assert.ok(linkedForecastUrlMatch, 'the linked Hong Kong forecast should be present');

  const liveUrl = new URL(liveWeatherUrlMatch[1]);
  const forecastUrl = new URL(linkedForecastUrlMatch[1]);

  assert.equal(weatherProvider(forecastUrl.hostname), weatherProvider(liveUrl.hostname), 'the click-through page and reading should use one provider');
  assert.equal(liveUrl.searchParams.get('dataType'), 'rhrread', 'the card should request the HKO current weather report');
  assert.match(forecastUrl.pathname, /\/wxinfo\/currwx\/current\.htm$/, 'the card should open the HKO current weather report');
  assert.match(weatherFunction, /entry\.place === 'Hong Kong Observatory'/, 'the card should select the Hong Kong Observatory station');
});

test('the Hong Kong card presents the observation timestamp returned by the provider', () => {
  assert.notEqual(weatherFunctionStart, -1, 'the first-stop weather function should be present');
  assert.match(
    weatherFunction,
    /data\.updateTime/,
    'the displayed weather metadata should read the provider observation time'
  );
  assert.match(
    weatherFunction,
    /subEl\.textContent\s*=\s*[^;]*(time|observed|updated)/i,
    'the weather subtitle should present the observation time to the traveller'
  );
  assert.match(
    weatherFunction,
    /Australia\/Perth/,
    'the weather subtitle should also format the observation time in AWST'
  );
  assert.match(
    weatherFunction,
    /\(\$\{perthTime\} AWST\)/,
    'the AWST observation time should be shown in brackets after HKT'
  );
});

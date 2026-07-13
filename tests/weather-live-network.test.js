const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('a cross-origin live weather request bypasses the service-worker asset cache', async () => {
  const listeners = {};
  const cacheWrites = [];
  const cachedWeather = new Response(JSON.stringify({ temperature: { data: [{ place: 'Hong Kong Observatory', value: 27 }] } }));
  const freshWeather = new Response(JSON.stringify({ temperature: { data: [{ place: 'Hong Kong Observatory', value: 31 }] } }), { status: 200 });

  const context = {
    URL,
    Response,
    caches: {
      match: async () => cachedWeather,
      open: async () => ({
        addAll: async () => {},
        put: async (request, response) => {
          cacheWrites.push({ request, body: await response.text() });
        }
      }),
      keys: async () => []
    },
    fetch: async () => freshWeather,
    self: {
      location: { origin: 'https://culpable.github.io' },
      addEventListener: (type, listener) => { listeners[type] = listener; },
      skipWaiting: () => {},
      clients: { claim: async () => {} }
    }
  };

  vm.runInNewContext(
    fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8'),
    context,
    { filename: 'sw.js' }
  );

  const waits = [];
  let responsePromise;
  listeners.fetch({
    request: {
      method: 'GET',
      mode: 'cors',
      url: 'https://data.weather.gov.hk/weatherAPI/opendata/weather.php?dataType=rhrread&lang=en'
    },
    respondWith: (promise) => { responsePromise = promise; },
    waitUntil: (promise) => { waits.push(promise); }
  });

  const response = await responsePromise;
  const body = await response.text();
  await Promise.all(waits);

  assert.equal(
    body,
    JSON.stringify({ temperature: { data: [{ place: 'Hong Kong Observatory', value: 31 }] } }),
    'live weather must come from the network instead of a stale cached API response'
  );
  assert.equal(cacheWrites.length, 0, 'cross-origin live weather responses must not be written to the asset cache');
});
